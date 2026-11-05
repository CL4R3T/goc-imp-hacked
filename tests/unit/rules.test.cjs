const assert = require('node:assert/strict');
const r = require('../../src/rules/impossible-rules.cjs');
const allCards=require('../helpers/cards.cjs');
const baseMegas=level=>r.totalMegas({level,bonus:0});
const startingLevel=probability=>r.createChain({probability,seed:r.encodeSeed(0),startedAt:0}).startLevel;
const rewardPool=(held,game,level)=>r.drawCard(held,game,level,()=>0).pool;
const hasSlotLine=grid=>[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]]
  .some(([a,b,c])=>grid[a]===grid[b]&&grid[b]===grid[c]);
const slotWeights={chance:20,skull:20,blank:11};
let checks = 0;
function check(test) { test(); checks++; }
check(()=>assert.deepEqual(Array.from({length:11},(_,i)=>baseMegas(i)),[10,15,23,34,51,76,110,170,260,380,580]));
for (let level=0;level<=20;level++) {
  check(()=>assert.equal(startingLevel(r.IMPOSSIBLE_THRESHOLD_PERCENT/2**level),level));
}
let sequences=0;
for(let seed=0;seed<1000;seed++) {
  for(let turn=0;turn<12;turn++) {
    const chain = r.createChain({source:'coin',probability:r.IMPOSSIBLE_THRESHOLD_PERCENT,seed:r.encodeSeed(seed)});
    const a=r.resolveCall(chain,r.outcomeRandom(chain.seed,turn),true);
    const b=r.resolveCall(chain,r.outcomeRandom(chain.seed,turn),false);
    assert.equal(a.settled,b.settled);
    assert.equal(a.level,b.level);
    assert.notEqual(a.faces[0],b.faces[0]);
    sequences++;
  }
}
checks+=sequences;
for(let rows=3;rows<=13;rows+=2) {
  for(let seed=0;seed<30;seed++) {
    const level=Math.max(0,rows-4);
    const board=r.createChain({game:'plinko',seed:r.encodeSeed(seed),
      probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/2**level}).board;
    assert.equal(board.rows,rows);
    const values=board.values;
    assert.equal(values.reduce((a,b)=>a+b,0),0);
    assert.deepEqual(values,[...values].reverse());
    for(const face of [false,true]) {
      const path=r.plinkoPathForFace(face,rows,r.minigameRandom(r.encodeSeed(seed),0,'plinko'));
      assert.equal(r.countRightSteps(path)%2===0,face);
    }
    checks++;
  }
}
for(let seed=0;seed<100;seed++) {
  const encoded=r.encodeSeed(seed);
  for(const face of [false,true]) {
    const cards=r.dealForFace(face,25,r.minigameRandom(encoded,0,'deal'));
    assert.equal(r.redMinusBlack(cards)>0,face);
    const grid=r.slotGridForWin(face,r.minigameRandom(encoded,0,'slot'));
    assert.equal(hasSlotLine(grid),face);
    checks++;
  }
}
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:3},-10000)),0));
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:3},10000)),68));
// A skull line at L3 -> L4 wipes the starting 34, leaving the new level's 17.
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:4},r.slotBonus('wipe',34))),17));
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:4},r.slotBonus('double',34))),85));
check(()=>assert.equal(allCards.length,215));
check(()=>assert.equal(new Set(allCards.map(card=>card.id)).size,215));
for(const card of allCards)check(()=>assert.equal(r.duplicateTokens(card.id),
  card.prismatic?4:card.global?3:Math.ceil(card.percent/2)));
const heldAll=Object.fromEntries(allCards.map(c=>[c.id,1]));
check(()=>assert.equal(rewardPool({},'coin',8).length,22));
check(()=>assert.equal(rewardPool({},'coin',9).length,10));
check(()=>assert.equal(rewardPool({},'coin',10).length,7));
const uniqueAt10=rewardPool({},'coin',10);
check(()=>assert.equal(rewardPool(Object.fromEntries(uniqueAt10.map(c=>[c.id,1])),'coin',10).length,11));
check(()=>assert.equal(rewardPool(heldAll,'coin',10).length,23));
// v0.31.0 keeps existing IDs, but changes their art/targets and extends the pools.
check(()=>assert.deepEqual(r.WHEEL_SOURCES,['coin','dice','card','d20','roulette','lottery','dart','rocket','element','animal','plant','fossil']));
check(()=>assert.deepEqual(r.filterWheelSegments([0,11,12],[0]).remaining,[11]));
check(()=>assert.equal(r.payoutSource({source:'coin',payoutSource:'fossil'}),'fossil'));
for(const [actions,unlocked,eligible] of [[49999,true,false],[50000,false,false],[50000,true,true]]) {
  check(()=>assert.equal(r.wheelEligibility({fossil:{totalActions:actions}},{fossil:unlocked}).at(-1).eligible,eligible));
}
const fossilPercents=[1,1,1,3,1,2,1,3,2,1,1,4,1,1,2,5];
for(const [gameIndex,{id:game}] of r.MINIGAMES.entries())for(let band=0;band<4;band++) {
  const id=`${game}:${band}:fossil`;
  check(()=>assert.equal(r.cardById(id).percent,fossilPercents[gameIndex*4+band]));
  check(()=>assert.equal(r.cardById(id).sourceName,'Fossil Dig'));
  const pool=rewardPool({},game,[0,2,3,5][band]);
  check(()=>assert.equal(pool.length,13));
  check(()=>assert.equal(pool.find(c=>c.id===id).weight,.95/12));
  // Non-shiny draw: the twelfth source is Fossil Dig.
  let calls=0;
  check(()=>assert.equal(r.drawCardId({},game,[0,2,3,5][band],()=>calls++===0?.5:.999),id));
}
check(()=>assert.equal(r.cardById('coin:1:global').name,'Chestlord'));
const tusk=r.cardById('slot:0:global');
check(()=>assert.equal(tusk.name,'Tusk Titan'));
check(()=>assert.equal(tusk.targetSource,'fossil'));
check(()=>assert.equal(tusk.percent,10));
check(()=>assert.equal(r.cardById('unique:6:global').name,'Aurelisk'));
check(()=>assert.equal(r.cardById('unique:6:global').percent,1));
const oldUniques=Object.fromEntries(Array.from({length:6},(_,i)=>[`unique:${i}:global`,1]));
// Owning the old six uniques must no longer trigger a fallback: Aurelisk is missing.
check(()=>assert.equal(rewardPool(oldUniques,'coin',10).length,7));
check(()=>assert.equal(r.drawCard(oldUniques,'coin',10,()=>.999).id,'unique:6:global'));
check(()=>assert.equal(r.drawCard(oldUniques,'coin',10,()=>.999).isNew,true));
for(const source of r.WHEEL_SOURCES) {
  const speed=allCards.filter(c=>c.source===source||c.global&&(!c.targetSource||c.targetSource===source))
    .reduce((sum,c)=>sum+c.percent,0);
  check(()=>assert.equal(speed,52));
}
check(()=>assert.equal(r.isWheelUnlocked({3:1}),true));
check(()=>assert.equal(r.isWheelUnlocked({4:1}),false));
check(()=>assert.equal(r.isMinigameUnlocked('deal',{5:1}),false));
check(()=>assert.equal(r.isMinigameUnlocked('deal',{4:1}),true));
check(()=>assert.deepEqual(r.filterWheelSegments([0,1,1,2],[1,999]).remaining,[0,2]));
// Enumerate every raw slot grid. These are pre-conditioning probabilities, not the final 50/50 win rate.
const symbols=['chance','skull','blank'];
const mass={double:0,wipe:0,quietWin:0,loss:0};
for(let i=0;i<3**9;i++) {
  let n=i,weight=1;
  const grid=Array.from({length:9},()=>{const s=symbols[n%3];n=Math.floor(n/3);weight*=slotWeights[s];return s;});
  const win=hasSlotLine(grid);
  const effect=r.slotEffect(grid);
  mass[win ? effect==='quiet' ? 'quietWin' : effect : 'loss']+=weight;
}
assert.equal(mass.double,mass.wipe);
checks++;
const total=51**9;
const winMass=total-mass.loss;
const slots={loss:.5,double:.5*mass.double/winMass,wipe:.5*mass.wipe/winMass,quietWin:.5*mass.quietWin/winMass};
console.log(JSON.stringify({checks,cards:allCards.length,slots},null,2));
