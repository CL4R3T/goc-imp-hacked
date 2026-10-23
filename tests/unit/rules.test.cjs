const assert = require('node:assert/strict');
const fs = require('node:fs');
const r = require('../../src/generated/impossible-rules.cjs');
const {outputPath}=require('../../scripts/lib/paths.cjs');
let checks = 0;
function check(test) { test(); checks++; }
check(()=>assert.deepEqual(Array.from({length:11},(_,i)=>r.baseMegas(i)),[10,15,23,34,51,76,110,170,260,380,580]));
for (let level=0;level<=20;level++) {
  check(()=>assert.equal(r.startingLevel(r.IMPOSSIBLE_THRESHOLD_PERCENT/2**level),level));
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
    const values=r.createBucketValues(rows,9,r.seededRandom(r.encodeSeed(seed),0,1));
    assert.equal(values.reduce((a,b)=>a+b,0),0);
    assert.deepEqual(values,[...values].reverse());
    for(const face of [false,true]) {
      const path=r.plinkoPathForFace(face,rows,r.seededRandom(r.encodeSeed(seed),0,2));
      assert.equal(r.bucketShowsChance(r.countRightSteps(path)),face);
    }
    checks++;
  }
}
for(let seed=0;seed<100;seed++) {
  const encoded=r.encodeSeed(seed);
  for(const face of [false,true]) {
    const cards=r.dealForFace(face,25,r.seededRandom(encoded,0,3));
    assert.equal(r.redMinusBlack(cards)>0,face);
    const grid=r.slotGridForWin(face,r.seededRandom(encoded,0,4));
    assert.equal(r.hasSlotLine(grid),face);
    checks++;
  }
}
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:3},-10000)),0));
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:3},10000)),68));
// A skull line at L3 -> L4 wipes the starting 34, leaving the new level's 17.
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:4},r.slotBonus('wipe',34))),17));
check(()=>assert.equal(r.totalMegas(r.applyBonus({...r.createChain({}),level:4},r.slotBonus('double',34))),85));
check(()=>assert.equal(r.ALL_CARDS.length,198));
check(()=>assert.equal(r.CARD_SPEED_CAP,52));
const heldAll=Object.fromEntries(r.ALL_CARDS.map(c=>[c.id,1]));
for(const source of r.WHEEL_SOURCES) check(()=>{
  assert.equal(r.cardSpeedPercent(source,heldAll),52);
  assert.equal(r.cardSpeedPercent(source,Object.fromEntries(r.ALL_CARDS.map(c=>[c.id,9]))),52);
});
check(()=>assert.equal(r.rewardPool({},'coin',8).length,21));
check(()=>assert.equal(r.rewardPool({},'coin',9).length,9));
check(()=>assert.equal(r.rewardPool({},'coin',10).length,6));
const uniqueAt10=r.rewardPool({},'coin',10);
check(()=>assert.equal(r.rewardPool(Object.fromEntries(uniqueAt10.map(c=>[c.id,1])),'coin',10).length,10));
check(()=>assert.equal(r.rewardPool(heldAll,'coin',10).length,22));
check(()=>assert.deepEqual(r.newUnlocksAtLevel(3,{}).map(x=>x.id),['wheel']));
check(()=>assert.equal(r.isMinigameUnlocked('deal',{5:1}),false));
check(()=>assert.equal(r.isMinigameUnlocked('deal',{4:1}),true));
check(()=>assert.deepEqual(r.filterWheelSegments([0,1,1,2],[1,999]).remaining,[0,2]));
// Enumerate every raw slot grid. These are pre-conditioning probabilities, not the final 50/50 win rate.
const symbols=['chance','skull','blank'];
const mass={double:0,wipe:0,quietWin:0,loss:0};
for(let i=0;i<3**9;i++) {
  let n=i,weight=1;
  const grid=Array.from({length:9},()=>{const s=symbols[n%3];n=Math.floor(n/3);weight*=r.SLOT_SYMBOL_WEIGHTS[s];return s;});
  const win=r.hasSlotLine(grid);
  const effect=r.slotEffect(grid);
  mass[win ? effect==='quiet' ? 'quietWin' : effect : 'loss']+=weight;
}
assert.equal(mass.double,mass.wipe);
checks++;
const total=51**9;
const winMass=total-mass.loss;
const evidence={
  checks, sameOutcomePairs:sequences,
  thresholdPercent:r.IMPOSSIBLE_THRESHOLD_PERCENT,
  thresholdProbability:r.IMPOSSIBLE_THRESHOLD_PERCENT/100,
  basePayouts:Array.from({length:21},(_,i)=>({level:i,megas:r.baseMegas(i)})),
  rawSlotProbabilities:Object.fromEntries(Object.entries(mass).map(([k,v])=>[k,v/total])),
  finalSlotProbabilities:{loss:.5,double:.5*mass.double/winMass,wipe:.5*mass.wipe/winMass,quietWin:.5*mass.quietWin/winMass},
  poolSizes:{ordinary:r.rewardPool({},'coin',7).length,L8:r.rewardPool({},'coin',8).length,L9:r.rewardPool({},'coin',9).length,L10:r.rewardPool({},'coin',10).length},
  cardCount:r.ALL_CARDS.length,cardSpeedCap:r.CARD_SPEED_CAP,
  ordinaryPercentMatrix:r.WHEEL_SOURCES.map(source=>({source,percents:r.CARD_DECKS.flatMap(d=>d.bands.map((_,band)=>r.cardById(`${d.game}:${band}:${source}`).percent))})),
};
fs.writeFileSync(outputPath('reports/rules.json'),JSON.stringify(evidence,null,2)+'\n');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const fields=['id','name','game','band','source','targetSource','percent','global','unique','prismatic','fromLevel'];
fs.writeFileSync(outputPath('data/cards.csv'),'\ufeff'+fields.join(',')+'\n'+r.ALL_CARDS.map(card=>fields.map(f=>quote(card[f])).join(',')).join('\n')+'\n');
console.log(JSON.stringify({checks,cards:r.ALL_CARDS.length,cap:r.CARD_SPEED_CAP,slots:evidence.finalSlotProbabilities},null,2));
