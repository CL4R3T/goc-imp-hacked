const assert = require('node:assert/strict');
const r = require('../../src/rules/impossible-rules.cjs');
const predictor = require('../../src/core/predict-event.cjs');
const example=require('../../examples/event.json');
const fixture=require('../fixtures/prediction.json');
let regressionTurns=0;
for(const branch of fixture.branches){
  let chain=r.createChain({source:fixture.source,game:branch.game,seed:fixture.seed,
    probability:fixture.probability,startedAt:0});
  for(const expected of branch.turns){
    const result=predictor.replayTurn(chain,true);
    assert.equal(result.chain.level,expected.level);
    assert.equal(result.chain.bonus,expected.bonus);
    assert.equal(r.totalMegas(result.chain),expected.megas);
    assert.equal(result.chain.faces.at(-1),expected.detail.face);
    assert.equal(result.turn.requestedBonus,expected.detail.bonus);
    for(const key of ['path','cards','grid']){
      if(expected.detail[key])assert.deepEqual(result.turn.detail[key],expected.detail[key]);
    }
    chain=result.chain;regressionTurns++;
  }
  assert.equal(chain.settled,true);
}
let turns=0;
for(let seed=0;seed<200;seed++) {
  for(const game of ['coin','deal','plinko','slot']) {
    let predicted=r.createChain({source:'coin',game,seed:r.encodeSeed(seed),
      probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/32,startedAt:0});
    for(let step=0;step<128&&!predicted.settled;step++) {
      const call=(seed+step)%2===0;
      const result=predictor.replayTurn(predicted,call);
      const opposite=predictor.replayTurn(predicted,!call);
      assert.equal(opposite.chain.level,result.chain.level);
      assert.equal(r.totalMegas(opposite.chain),r.totalMegas(result.chain));
      predicted=result.chain;
      turns++;
    }
    assert.ok(predicted.settled);
  }
}
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
console.log(JSON.stringify({regressionTurns,oppositeCallTurns:turns,seedCount:200,games:4,
  oppositeCallsSamePayout:true,exampleNaturalMegas:output.branches.map(b=>b.naturalEnd.megas),
  resumedSnapshotMatched:true},null,2));
