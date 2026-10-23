const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const r = require('../../src/generated/impossible-rules.cjs');
const predictor = require('../../src/core/predict-event.cjs');
const {rootPath}=require('../../scripts/lib/paths.cjs');
const babel = require('../../scripts/lib/runtime.cjs').loadBabel();
// Replay against the actual unmodified application callback yB, with state updates captured.
const source = fs.readFileSync(rootPath('samples/upstream/index-kVDE62Ka.js'),'utf8');
const ast = babel.babelParse(source,'index.js',true);
let callback;
babel.traverse(ast,{VariableDeclarator(path){
  if(path.node.id.name==='yB') {
    const node=path.node.init.arguments[0];
    callback=source.slice(node.start,node.end);
    path.stop();
  }
}});
assert.ok(callback);
const aliases=JSON.parse(fs.readFileSync(rootPath('src/generated/symbol-map.json'),'utf8'));
let originalEvent;
const sandbox={
  ...Object.fromEntries(Object.entries(aliases).map(([oldName,newName])=>[oldName,r[newName]])),
  Eo:{current:null},Za:{current:{active:true}},r:{grantImpossible:false},
  Sx:'plinko',qm:'deal',Wm:'slot',
  G2:(id,update)=>{originalEvent=update(originalEvent);},
};
const originalFlip=vm.runInNewContext('('+callback+')',sandbox);
function relevant(chain) {
  const {settledAt,startedAt,...rest}=chain;
  return JSON.parse(JSON.stringify(rest));
}
let turns=0;
for(let seed=0;seed<200;seed++) {
  for(const game of ['coin','deal','plinko','slot']) {
    let predicted=r.createChain({source:'coin',game,seed:r.encodeSeed(seed),
      probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/32,startedAt:0});
    originalEvent={id:'verification',seed:predicted.seed,seedVersion:1,chain:predicted};
    for(let step=0;step<128&&!predicted.settled;step++) {
      const call=(seed+step)%2===0;
      sandbox.Eo.current={activeEventId:originalEvent.id,events:[originalEvent]};
      const originalDetail=originalFlip(call);
      const result=predictor.replayTurn(predicted,call);
      assert.deepEqual(relevant(result.chain),relevant(originalEvent.chain));
      assert.equal(result.turn.requestedBonus,originalDetail.bonus);
      for(const key of ['path','cards','grid']) {
        if(originalDetail[key]) assert.deepEqual(result.turn.detail[key],originalDetail[key]);
      }
      const opposite=predictor.replayTurn(predicted,!call);
      assert.equal(opposite.chain.level,result.chain.level);
      assert.equal(r.totalMegas(opposite.chain),r.totalMegas(result.chain));
      predicted=result.chain;
      turns++;
    }
    assert.ok(predicted.settled);
  }
}
const example=JSON.parse(fs.readFileSync(rootPath('examples/event.json'),'utf8'));
const output=predictor.predict(example);
assert.deepEqual(output.branches.map(b=>b.outcomeSequence),Array(4).fill('WWWWWWL'));
assert.deepEqual(output.branches.map(b=>b.naturalEnd.megas),[860,869,857,680]);
assert.equal(output.wheel.source,'lottery');
assert.ok(output.branches.every(b=>b.naturalEnd.card.id==='unique:5:global'));
assert.equal(predictor.predict({...example,removedSources:['coin']}).wheel.source,'lottery');
const unknown=predictor.predict({seed:example.seed,startLevel:5});
assert.equal(unknown.branches[0].naturalEnd.card.status,'needs_heldCards');
assert.equal(unknown.wheel.status,'needs_availableSources');
for(const branch of output.branches) {
  for(const point of branch.stopOptions) {
    const alternatives=predictor.predictCard(output.storedSeed,branch.game,point.level,undefined).alternatives;
    if(alternatives) assert.ok(alternatives.some(c=>c.id===point.card.id));
  }
}
const initial=r.createChain({source:'coin',game:'plinko',seed:output.storedSeed,
  probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/32});
const oneTurn=predictor.replayTurn(initial).chain;
const resumed=predictor.predict({event:{id:'resume',source:'coin',probability:initial.probability,
  seed:initial.seed,seedVersion:1,chain:oneTurn},heldCards:{}});
assert.equal(resumed.branches.length,1);
assert.equal(resumed.branches[0].naturalEnd.megas,857);
assert.equal(resumed.branches[0].outcomeSequence,'WWWWWL');
console.log(JSON.stringify({originalCallbackMatchedTurns:turns,seedCount:200,games:4,
  oppositeCallsSamePayout:true,exampleNaturalMegas:output.branches.map(b=>b.naturalEnd.megas),
  resumedSnapshotMatched:true},null,2));
