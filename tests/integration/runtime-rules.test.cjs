const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {rootPath,outputPath}=require('../../scripts/lib/paths.cjs');
const {loadBrowserSources}=require('../../scripts/lib/browser-sources.cjs');
const {usedRuleExports,buildRuntimeRules}=require('../../scripts/lib/runtime-rules.cjs');
const full=require('../../src/generated/impossible-rules.cjs');
const fullPredictor=require('../../src/core/predict-event.cjs');
const fullSummary=require('../../src/core/prediction-summary.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
function load(source,bindings={}){
  return vm.runInNewContext('(function(){const module={exports:{}};\n'+source+'\nreturn module.exports;})()',bindings);
}
const sources=loadBrowserSources();
const originalSource=fs.readFileSync(rootPath('src/generated/impossible-rules.cjs'),'utf8');
const {code,report}=buildRuntimeRules(sources);
const rules=load(code);
const predictor=load(sources.predictor,{RULES:rules});
const summary=load(sources.summary,{RULES:rules});
assert.ok(report.runtimeRulesBytes<report.fullRulesBytes*0.6);
assert.deepEqual(Object.keys(rules).sort(),report.exports);
assert.deepEqual(usedRuleExports({demo:'const r=RULES; r.totalMegas(); RULES["baseMegas"]();'}),['baseMegas','totalMegas']);
assert.deepEqual(usedRuleExports({demo:'function f(r){return r.unknown;}'}),[]);
for(const source of ['RULES[key]();','consume(RULES);','const r=RULES; const alias=r; alias.totalMegas();'])
  assert.throws(()=>usedRuleExports({demo:source}),/needs review/);
assert.throws(()=>buildRuntimeRules({demo:'RULES.nonexistent();'}),/Unknown rule export/);
assert.deepEqual(plain(rules.MINIGAMES),full.MINIGAMES.map(({id,name,unlockLevel})=>({id,name,unlockLevel})));
for(const card of full.ALL_CARDS)assert.deepEqual(plain(rules.cardById(card.id)),plain(card));
const collections=[{},Object.fromEntries(full.ALL_CARDS.map(card=>[card.id,1])),
  Object.fromEntries(full.ALL_CARDS.filter(card=>card.unique).map(card=>[card.id,1])),undefined];
let predictions=0;
for(let seed=0;seed<60;seed++)for(const level of [0,3,5,8,9,10])for(const heldCards of collections){
  const input={seed,startLevel:level,source:'coin',availableSources:full.WHEEL_SOURCES,
    removedSources:seed%2?['coin','dice']:[],wheelUnlocked:true,spinCurrency:seed%4};
  if(heldCards!==undefined)input.heldCards=heldCards;
  const expected=fullPredictor.predict(input),actual=predictor.predict(input);
  assert.deepEqual(plain(actual),plain(expected));
  assert.deepEqual(plain(actual.branches.map(branch=>summary.summarizeBranch(branch))),
    plain(expected.branches.map(branch=>fullSummary.summarizeBranch(branch))));
  predictions++;
}
let replayTurns=0;
for(let seed=0;seed<96;seed++)for(const {id:game} of full.MINIGAMES){
  let chain=full.createChain({source:'coin',game,seed:full.encodeSeed(seed),
    probability:full.IMPOSSIBLE_THRESHOLD_PERCENT/32,startedAt:0});
  for(let step=0;step<128&&!chain.settled;step++){
    const call=(seed+step)%2===0;
    const expected=fullPredictor.replayTurn(chain,call),actual=predictor.replayTurn(chain,call);
    // Separate calls can settle on different milliseconds; only compare game state.
    delete expected.chain.settledAt;delete actual.chain.settledAt;
    assert.deepEqual(plain(actual),plain(expected));
    chain=expected.chain;replayTurns++;
  }
  assert.equal(chain.settled,true);
  const input={event:{id:'existing',seed:chain.seed,seedVersion:1,chain},heldCards:{}};
  assert.deepEqual(plain(predictor.predict(input)),plain(fullPredictor.predict(input)));
}
const bundle=fs.readFileSync(rootPath('dist/goc-impossible-predictor.user.js'),'utf8');
const wrap=(name,source)=>`const ${name}=(()=>{const module={exports:{}};\n${source}\nreturn module.exports;})();\n`;
assert.ok(bundle.includes(wrap('RULES',code)),'Published rules must match the build.');
assert.ok(bundle.includes(wrap('PREDICTOR',sources.predictor)));
assert.ok(bundle.includes(wrap('SUMMARY',sources.summary)));
assert.ok(bundle.includes(sources.ui));
assert.equal(fs.readFileSync(rootPath('src/generated/impossible-rules.cjs'),'utf8'),originalSource);
const result={cards:full.ALL_CARDS.length,predictions,replayTurns,...report};
fs.writeFileSync(outputPath('reports/runtime-rules.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({cards:result.cards,predictions,replayTurns,
  fullRulesBytes:report.fullRulesBytes,runtimeRulesBytes:report.runtimeRulesBytes},null,2));
