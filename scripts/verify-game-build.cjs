const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {playwrightDirectory,rootPath,outputPath} = require('../tests/helpers/browser.cjs');
const babel = require(path.join(playwrightDirectory(),'lib/transform/babelBundle.js'));
const old = require('../src/rules/impossible-rules.cjs');
// Extract only the audited rule dependency graph; never execute the whole game bundle.
// Binding names are specific to the audited builds below; review other builds first.
const input = path.resolve(process.argv[2] || rootPath('artifacts/index-C0JM9mVX.js'));
const source = fs.readFileSync(input,'utf8');
const ast = babel.babelParse(source, input, true);
let bindings;
babel.traverse(ast, {Program(p) { bindings = p.scope.bindings; p.stop(); }});
const namesV0310 = {
  IMPOSSIBLE_THRESHOLD_PERCENT:'pv', MINIGAMES:'O9', WHEEL_SOURCES:'a6',
  accumulatedBonus:'D9', applyBonus:'lb', cardById:'Ad', cardRandom:'voe',
  chooseWheelSegment:'Oie', countRightSteps:'Lie', createChain:'Zoe', dealBonus:'Jie',
  dealForFace:'qie', drawCard:'b8e', drawCardId:'g8e', duplicateTokens:'H$',
  encodeSeed:'a8', filterWheelSegments:'ZL', isEncodedSeed:'bd', isImpossibleProbability:'d2',
  isMinigameUnlocked:'Boe', isWheelUnlocked:'Loe', minigameRandom:'koe', outcomeRandom:'Coe',
  payoutSource:'yv', plinkoPathForFace:'Iie', readEventSeed:'Uu', redMinusBlack:'Kie',
  refreshBoard:'Doe', resolveCall:'ere', shinyPoolAtTier:'JE', shinyTier:'gD',
  slotBonus:'loe', slotEffect:'ooe', slotGridForWin:'roe', startOrResumeEvent:'Qoe',
  totalMegas:'o6', wheelEligibility:'p_', wheelRandom:'Soe',
  allCards:'A8', cardSpeed:'K$', maxCardSpeed:'i8e'
};
const namesV0311 = {
  IMPOSSIBLE_THRESHOLD_PERCENT:'xv', MINIGAMES:'K9', WHEEL_SOURCES:'o6',
  accumulatedBonus:'H9', applyBonus:'mb', cardById:'Fd', cardRandom:'Aoe',
  chooseWheelSegment:'Uie', countRightSteps:'zie', createChain:'are', dealBonus:'eoe',
  dealForFace:'Zie', drawCard:'C8e', drawCardId:'x8e', duplicateTokens:'V$',
  encodeSeed:'s8', filterWheelSegments:'sD', isEncodedSeed:'Cd', isImpossibleProbability:'m2',
  isMinigameUnlocked:'$oe', isWheelUnlocked:'zoe', minigameRandom:'joe', outcomeRandom:'Noe',
  payoutSource:'Sv', plinkoPathForFace:'Oie', readEventSeed:'Ku', redMinusBlack:'Vie',
  refreshBoard:'Goe', resolveCall:'nre', shinyPoolAtTier:'tF', shinyTier:'wD',
  slotBonus:'moe', slotEffect:'uoe', slotGridForWin:'doe', startOrResumeEvent:'sre',
  totalMegas:'u6', wheelEligibility:'y_', wheelRandom:'Moe',
  allCards:'M8', cardSpeed:'J$', maxCardSpeed:'c8e'
};
const auditedBuilds = {'index-BljK5PRK.js':namesV0310,'index-C0JM9mVX.js':namesV0311};
const names = auditedBuilds[path.basename(input)];
if(!names) throw Error('Unaudited build: review its rule bindings before verification.');
const selected = new Set();
function include(name) {
  if(selected.has(name)) return;
  const binding = bindings[name];
  if(!binding) throw Error('Unknown binding '+name);
  if(!binding.path.isVariableDeclarator()) throw Error('Unsupported declaration '+name);
  selected.add(name);
  binding.path.traverse({ReferencedIdentifier(p) {
    const b=p.scope.getBinding(p.node.name);
    if(b && b.scope===binding.scope) include(p.node.name);
  }});
}
Object.values(names).forEach(include);
const declarations = [...selected].map(n=>bindings[n].path.node).sort((a,b)=>a.start-b.start);
const extracted = declarations.map(n=>'const '+source.slice(n.start,n.end)+';').join('\n')+
  '\nglobalThis.rules={'+Object.entries(names).map(([k,v])=>JSON.stringify(k)+':'+v).join(',')+'};';
const context=vm.createContext({Date:class extends Date { static now(){return 0;} },console});
vm.runInContext(extracted,context,{timeout:10000});
const latest=context.rules;
const json=v=>JSON.parse(JSON.stringify(v));
let comparisons=0;
function eq(a,b,label) {assert.deepEqual(json(a),json(b),label);comparisons++;}
eq(latest.IMPOSSIBLE_THRESHOLD_PERCENT,old.IMPOSSIBLE_THRESHOLD_PERCENT,'threshold');
eq(latest.WHEEL_SOURCES,old.WHEEL_SOURCES,'wheel order');
eq(latest.MINIGAMES.map(({id,name,unlockLevel})=>({id,name,unlockLevel})),old.MINIGAMES,'unlocks');
const oldCards=require('../tests/helpers/cards.cjs');
eq(latest.allCards,oldCards,'all card metadata');
const collections=[{},Object.fromEntries(oldCards.filter(c=>c.unique).map(c=>[c.id,1])),
  Object.fromEntries(oldCards.filter(c=>c.global).map(c=>[c.id,1])),Object.fromEntries(oldCards.map(c=>[c.id,2])),
  // A pre-update collection: Aurelisk and Fossil Dig cards have not been collected.
  Object.fromEntries(oldCards.filter(c=>c.id!=='unique:6:global'&&c.source!=='fossil').map(c=>[c.id,1]))];
eq(latest.maxCardSpeed,52,'maximum speed');
for(const source of old.WHEEL_SOURCES) {
  for(const actions of [0,49999,50000,50001])for(const unlocked of [false,true])
    eq(latest.wheelEligibility({[source]:{totalActions:actions}},{[source]:unlocked}),
      old.wheelEligibility({[source]:{totalActions:actions}},{[source]:unlocked}),'wheel eligibility');
  eq(latest.cardSpeed(source,collections[3]),52,'full collection speed for '+source);
}
function replay(r,chain,call){
  const step=chain.flips.length, before=r.totalMegas(chain);
  let next=r.resolveCall(chain,r.outcomeRandom(chain.seed,step),call);
  const rng=r.minigameRandom(chain.seed,step,chain.game),face=next.faces.at(-1),won=next.flips.at(-1);
  let bonus=0,detail=null;
  if(chain.game==='deal') {detail=r.dealForFace(face,chain.board.cards,rng);bonus=r.dealBonus(detail,won);}
  if(chain.game==='plinko') {detail=r.plinkoPathForFace(face,chain.board.rows,rng);bonus=chain.board.values[r.countRightSteps(detail)]??0;}
  if(chain.game==='slot') {detail=r.slotGridForWin(won,rng);bonus=r.slotBonus(r.slotEffect(detail),before);}
  next=r.refreshBoard(r.applyBonus(next,bonus),chain.seed);
  return {next,detail,bonus};
}
let turns=0;
for(let raw=0;raw<1000;raw++) {
  const seed=old.encodeSeed(raw);
  eq(latest.encodeSeed(raw),seed,'seed encoding');
  for(let step=0;step<16;step++) {
    eq(latest.outcomeRandom(seed,step)(),old.outcomeRandom(seed,step)(),'outcome random');
    for(const {id:game} of old.MINIGAMES)eq(latest.minigameRandom(seed,step,game)(),old.minigameRandom(seed,step,game)(),'game random');
  }
  for(const {id:game} of old.MINIGAMES) {
    for(const call of [false,true]) {
      const config={seed,source:'coin',game,probability:old.IMPOSSIBLE_THRESHOLD_PERCENT/2**(raw%21),startedAt:0};
      let a=old.createChain(config),b=latest.createChain(config);
      eq(b,a,'initial chain');
      for(let step=0;!a.settled&&step<256;step++) {
        const x=replay(old,a,call),y=replay(latest,b,call);
        if(x.next.settled) x.next.settledAt=0;
        eq(y,x,'turn'); a=x.next;b=y.next;turns++;
      }
    }
    for(let level=0;level<=12;level++)for(const held of collections)
      eq(latest.drawCard(held,game,level,latest.cardRandom(seed)),old.drawCard(held,game,level,old.cardRandom(seed)),'draw card');
  }
  for(const available of [[0],[0,2,4],[0,1,2,3,4,5,6,7,8,9,10,11]]) {
    for(const removed of [[],available.slice(0,-1),available.slice(1)])
      eq(latest.chooseWheelSegment(removed,latest.wheelRandom(seed),available),old.chooseWheelSegment(removed,old.wheelRandom(seed),available),'wheel');
  }
}
for(let level=0;level<=100;level++) {
  eq(latest.totalMegas({level,bonus:0}),old.totalMegas({level,bonus:0}),'base megas');
  for(const bonus of [-1e9,-9,0,9,1e9])eq(latest.applyBonus({level,bonus:7},bonus),old.applyBonus({level,bonus:7},bonus),'bonus clamp');
  for(const game of old.MINIGAMES)eq(latest.isMinigameUnlocked(game.id,{[level]:1}),old.isMinigameUnlocked(game.id,{[level]:1}),'unlock level');
  eq(latest.isWheelUnlocked({[level]:1}),old.isWheelUnlocked({[level]:1}),'wheel unlock');
}
for(const event of [{id:'legacy'}, {seed:123}, {seed:123,seedVersion:1}, {seed:old.encodeSeed(123),seedVersion:1}, {seedVersion:1,chain:{seed:old.encodeSeed(123)}}, {seed:'bad'}])
  eq(latest.readEventSeed(event),old.readEventSeed(event),'read event seed');
const result={build:path.basename(input),sha256:createHash('sha256').update(source).digest('hex'),baseline:'src/rules/impossible-rules.cjs (v0.31.0 adaptation)',
  extractedBindings:selected.size,comparisons,rawSeeds:1000,replayedTurns:turns,cardCount:latest.allCards.length,
  maximumCardSpeed:latest.maxCardSpeed,cardCollections:collections.length,status:'PASS'};
fs.writeFileSync(outputPath('reports/'+(names===namesV0311?'v0311':'v031')+'-build-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
