const r=require('../generated/impossible-rules.cjs');

function naturalOutcome(seed,startLevel,maxTurns=4096){
  for(let i=0;i<maxTurns;i++)if(r.outcomeRandom(seed,i)()>=0.5){
    return {failureRound:i+1,finalLevel:startLevel+i};
  }
  return null;
}
function operation(point,currentTurns){
  if(point.reason==='already_settled')return '领取';
  const remaining=point.afterTurns-currentTurns;
  if(point.reason==='forced_loss')return '再玩 '+remaining+' 轮，失败后领取（Lvl '+point.level+'）';
  if(remaining===0)return '现在结算（Lvl '+point.level+'）';
  return '再玩 '+remaining+' 轮后结算（Lvl '+point.level+'）';
}
function summarizeBranch(branch){
  const currentTurns=branch.stopOptions[0].afterTurns;
  const best=branch.stopOptions.find(p=>p.afterTurns===branch.bestMegaOption.afterTurns&&p.reason===branch.bestMegaOption.reason);
  const fresh=branch.stopOptions.find(p=>p.card.isNew===true);
  const drawn=branch.stopOptions.find(p=>p.card.status==='already_drawn');
  let newCard;
  if(drawn)newCard={status:drawn.card.wasNew===true?'already_new':drawn.card.wasNew===false?'already_duplicate':'unknown'};
  else if(fresh)newCard={status:'available',level:fresh.level,operation:operation(fresh,currentTurns)};
  else if(branch.stopOptions.some(p=>p.card.isNew===undefined))newCard={status:'unknown'};
  else newCard={status:branch.complete?'none':'unknown'};
  return {game:branch.game,complete:branch.complete,maxMegas:best.megas,
    operation:operation(best,currentTurns),newCard};
}
function minimumWheelRemoval(seed,availableSources,target){
  const available=r.WHEEL_SOURCES.filter(s=>availableSources.includes(s));
  if(!available.includes(target))return null;
  const indices=available.map(s=>r.WHEEL_SOURCES.indexOf(s));
  let best=null;
  const u=r.wheelRandom(seed)();
  for(let mask=0;mask<2**indices.length;mask++){
    const removed=[],remaining=[];
    for(let i=0;i<indices.length;i++)((mask&(1<<i))?removed:remaining).push(indices[i]);
    if(!remaining.length||(best&&removed.length>=best.cost))continue;
    const selected=remaining[Math.min(remaining.length-1,Math.floor(u*remaining.length))];
    if(r.WHEEL_SOURCES[selected]!==target)continue;
    best={target,cost:removed.length,removedSources:removed.map(i=>r.WHEEL_SOURCES[i])};
  }
  return best;
}
module.exports={naturalOutcome,operation,summarizeBranch,minimumWheelRemoval};
