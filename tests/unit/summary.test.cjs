const assert=require('node:assert/strict');
const r=require('../../src/rules/impossible-rules.cjs');
const p=require('../../src/core/predict-event.cjs');
const s=require('../../src/core/prediction-summary.cjs');
const example=require('../../examples/event.json');
const allCards=require('../helpers/cards.cjs');
const result=p.predict(example);
assert.deepEqual(s.naturalOutcome(example.seed,5),{failureRound:7,finalLevel:11});
assert.deepEqual(result.branches.map(b=>s.summarizeBranch(b).maxMegas),[860,870,857,680]);
assert.ok(result.branches.every(b=>s.summarizeBranch(b).operation==='再玩 6 轮后结算（Lvl 11）'));
assert.ok(result.branches.every(b=>s.summarizeBranch(b).newCard.operation==='现在结算（Lvl 5）'));
// Each card appears once, with the best payout among stops that actually draw it.
for(const [index,branch] of result.branches.entries()){
  const summary=s.summarizeBranch(branch).newCard;
  assert.deepEqual(summary.cards.map(c=>c.id),[branch.game+':3:dart','unique:2:global','unique:5:global']);
  assert.deepEqual(summary.cards.map(c=>c.maxMegas),[[170,260,860],[172,263,870],[170,256,857],[246,90,680]][index]);
  assert.deepEqual(summary.cards.map(c=>c.operation),[
    '再玩 2 轮后结算（Lvl 7）','再玩 3 轮后结算（Lvl 8）','再玩 6 轮后结算（Lvl 11）',
  ]);
  assert.equal(summary.cards[0].source,'dart');
  assert.equal(summary.cards[0].percent,[2,1,3,5][index]);
  assert.equal(summary.cards[1].source,'global');
  assert.equal(summary.cards[1].percent,1);
}
const withoutTopCard=p.predict({...example,heldCards:{'unique:5:global':1}});
assert.deepEqual(withoutTopCard.branches.map(b=>s.summarizeBranch(b).newCard.maxMegas),[260,263,256,246]);
assert.ok(withoutTopCard.branches.every(b=>s.summarizeBranch(b).newCard.cards.length===2));
const allOwned=Object.fromEntries(allCards.map(c=>[c.id,1]));
assert.ok(p.predict({...example,heldCards:allOwned}).branches.every(b=>s.summarizeBranch(b).newCard.status==='none'));
const heldInitial=Object.fromEntries(result.branches.map(b=>[b.stopOptions[0].card.id,1]));
assert.ok(p.predict({...example,heldCards:heldInitial}).branches.every(b=>s.summarizeBranch(b).newCard.level===8));
assert.ok(p.predict({seed:example.seed,startLevel:5}).branches.every(b=>s.summarizeBranch(b).newCard.status==='unknown'));
assert.ok(p.predict({seed:example.seed,startLevel:5}).branches.every(b=>s.summarizeBranch(b).newCard.cards.length===0));
const plinko=p.predict({seed:2,startLevel:0,heldCards:{}}).branches.find(b=>b.game==='plinko');
assert.equal(s.summarizeBranch(plinko).operation,'再玩 2 轮，失败后领取（Lvl 1）');
assert.equal(s.summarizeBranch(plinko).newCard.cards[0].operation,'再玩 2 轮，失败后领取（Lvl 1）');
const resumed=p.replayTurn(r.createChain({seed:example.seed,game:'deal',source:'coin',probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/32})).chain;
const resumedPrediction=p.predict({event:{id:'resume',seed:example.seed,seedVersion:1,source:'coin',chain:resumed},heldCards:{}});
assert.equal(s.summarizeBranch(resumedPrediction.branches[0]).operation,'再玩 5 轮后结算（Lvl 11）');
assert.equal(s.summarizeBranch(resumedPrediction.branches[0]).newCard.cards[0].operation,'再玩 1 轮后结算（Lvl 7）');
const settled={...resumed,settled:true,card:'unique:5:global',cardWasNew:true};
const settledConfig={event:{id:'settled',seed:example.seed,seedVersion:1,source:'coin',chain:settled},heldCards:{'unique:5:global':1}};
const alreadyNew=s.summarizeBranch(p.predict(settledConfig).branches[0]).newCard;
assert.equal(alreadyNew.status,'already_new');
assert.equal(alreadyNew.cards[0].id,settled.card);
assert.equal(alreadyNew.cards[0].maxMegas,r.totalMegas(settled));
assert.equal(alreadyNew.cards[0].operation,'领取');
assert.equal(s.summarizeBranch(p.predict({...settledConfig,event:{...settledConfig.event,chain:{...settled,cardWasNew:false}}}).branches[0]).newCard.cards.length,0);
assert.equal(s.summarizeBranch(p.predict({...example,maxTurns:1}).branches[0]).complete,false);
assert.equal(s.summarizeBranch(p.predict({...example,maxTurns:1}).branches[0]).newCard.maxMegas,110);
let plansChecked=0,subsetsChecked=0;
for(let seed=0;seed<16;seed++){
  for(const sources of [r.WHEEL_SOURCES.slice(0,1),['dice','lottery','plant'],r.WHEEL_SOURCES.slice(0,6),r.WHEEL_SOURCES]){
    const indices=sources.map(source=>r.WHEEL_SOURCES.indexOf(source));
    const minimums=new Map();
    // Independent oracle: call the actual game's selection function for every removal subset.
    for(let mask=0;mask<2**sources.length-1;mask++){
      const removed=indices.filter((_,i)=>mask&(1<<i));
      const winner=r.chooseWheelSegment(removed,r.wheelRandom(seed),indices);
      if(winner===null)continue;
      minimums.set(winner,Math.min(minimums.get(winner)??Infinity,removed.length));
      subsetsChecked++;
    }
    for(const target of sources){
      const plan=s.minimumWheelRemoval(seed,sources,target);
      assert.equal(plan.cost,minimums.get(r.WHEEL_SOURCES.indexOf(target)));
      assert.equal(r.chooseWheelSegment(plan.removedSources.map(source=>r.WHEEL_SOURCES.indexOf(source)),r.wheelRandom(seed),indices),r.WHEEL_SOURCES.indexOf(target));
      assert.equal(plan.removedSources.includes(target),false);
      plansChecked++;
    }
  }
}
assert.equal(s.minimumWheelRemoval(example.seed,['coin'],'plant'),null);
console.log(JSON.stringify({plansChecked,subsetsChecked,maxMegaStopPoints:true,newCardsAcrossAllStops:true,resumedRoundInstructions:true},null,2));
