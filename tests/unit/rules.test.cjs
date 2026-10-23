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
check(()=>assert.equal(allCards.length,198));
check(()=>assert.equal(new Set(allCards.map(card=>card.id)).size,198));
for(const card of allCards)check(()=>assert.equal(r.duplicateTokens(card.id),
  card.prismatic?4:card.global?3:Math.ceil(card.percent/2)));
const heldAll=Object.fromEntries(allCards.map(c=>[c.id,1]));
check(()=>assert.equal(rewardPool({},'coin',8).length,21));
check(()=>assert.equal(rewardPool({},'coin',9).length,9));
check(()=>assert.equal(rewardPool({},'coin',10).length,6));
const uniqueAt10=rewardPool({},'coin',10);
check(()=>assert.equal(rewardPool(Object.fromEntries(uniqueAt10.map(c=>[c.id,1])),'coin',10).length,10));
check(()=>assert.equal(rewardPool(heldAll,'coin',10).length,22));
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
