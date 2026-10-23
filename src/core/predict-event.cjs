// Offline replay of the supplied Game of Chance build. Does not read or modify game saves.
const r = require('../rules/impossible-rules.cjs');
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);

function normalizeSeed(value) {
  const n = Number(value);
  if (r.isEncodedSeed(n)) return n;
  if (Number.isInteger(n) && n >= 0 && n <= 0xffffffff) return r.encodeSeed(n);
  throw new Error('seed must be a raw uint32 or a valid encoded event seed.');
}

// Turn order: outcome -> details -> clamped bonus -> next board.
function replayTurn(chain, call = true) {
  if (chain.settled) throw new Error('The chain has already ended.');
  const step = chain.flips.length;
  const beforeMegas = r.totalMegas(chain);
  const outcomeValue = r.outcomeRandom(chain.seed,step)();
  let next = r.resolveCall(chain,()=>outcomeValue,call);
  const rng = r.minigameRandom(chain.seed,step,chain.game);
  const face = next.faces.at(-1);
  const won = next.flips.at(-1);
  let requestedBonus = 0;
  let detail = null;
  if (chain.game === 'plinko' && chain.board?.rows) {
    const path = r.plinkoPathForFace(face,chain.board.rows,rng);
    const bucket = r.countRightSteps(path);
    requestedBonus = chain.board.values[bucket] ?? 0;
    detail = {board:chain.board,path,bucket,face};
  } else if (chain.game === 'deal' && chain.board?.cards) {
    const cards = r.dealForFace(face,chain.board.cards,rng);
    requestedBonus = r.dealBonus(cards,won);
    detail = {cards,redMinusBlack:r.redMinusBlack(cards),face};
  } else if (chain.game === 'slot') {
    const grid = r.slotGridForWin(won,rng);
    const effect = r.slotEffect(grid);
    requestedBonus = r.slotBonus(effect,beforeMegas);
    detail = {grid,effect};
  } else {
    detail = {face};
  }
  next = r.applyBonus(next,requestedBonus);
  const appliedBonus = r.accumulatedBonus(next)-r.accumulatedBonus(chain);
  next = r.refreshBoard(next,chain.seed);
  return {chain:next,turn:{
    step,turnNumber:step+1,outcomeValue,won,call,
    fromLevel:chain.level,toLevel:next.level,
    beforeMegas,afterMegas:r.totalMegas(next),requestedBonus,appliedBonus,detail,
  }};
}

function shortCard(card) {
  return {id:card.id,name:card.name,source:card.source,targetSource:card.targetSource,
    percent:card.percent,shiny:!!card.global,unique:!!card.unique,prismatic:!!card.prismatic};
}

function predictCard(seed,game,level,heldCards,existingChain) {
  if (existingChain?.card) return {
    status:'already_drawn',...shortCard(r.cardById(existingChain.card)),
    wasNew:existingChain.cardWasNew,tokensAddedNow:0,
  };
  if (heldCards !== undefined) {
    const result = r.drawCard(heldCards,game,level,r.cardRandom(seed));
    return {status:'exact',...shortCard(result.card),isNew:result.isNew,
      tokensAddedNow:result.spin,poolSize:result.pool.length};
  }
  const tier = r.shinyTier(level);
  if (tier === null) {
    const id = r.drawCardId({},game,level,r.cardRandom(seed));
    return {status:'exact_id_ownership_unknown',...shortCard(r.cardById(id)),
      tokensIfAlreadyOwned:r.duplicateTokens(id),tokensIfNew:0};
  }
  const alternatives = [];
  for (let t=tier;t>=0;t--) {
    const pool = r.shinyPoolAtTier(t,level);
    const id = pool[Math.min(pool.length-1,Math.floor(r.cardRandom(seed)()*pool.length))];
    alternatives.push({poolTier:t,poolSize:pool.length,...shortCard(r.cardById(id))});
  }
  return {status:'needs_heldCards',alternatives};
}

function wheelSetup(config,seed) {
  const value = r.wheelRandom(seed)();
  if (!Array.isArray(config.availableSources)) return {status:'needs_availableSources',randomValue:value};
  for (const source of [...config.availableSources,...(config.removedSources || [])]) {
    if (!r.WHEEL_SOURCES.includes(source)) throw new Error('Unknown wheel source: '+source);
  }
  // The application always supplies eligible sources in this canonical order.
  const available = r.WHEEL_SOURCES.map((s,i)=>config.availableSources.includes(s)?i:-1).filter(i=>i>=0);
  const removed = (config.removedSources || []).map(s=>r.WHEEL_SOURCES.indexOf(s));
  const filtered = r.filterWheelSegments(available,removed);
  if (!filtered.remaining.length) return {status:'no_remaining_segments',randomValue:value};
  const segment = r.chooseWheelSegment(filtered.removed,r.wheelRandom(seed),filtered.available);
  return {status:'exact_if_spin_allowed',randomValue:value,segment,source:r.WHEEL_SOURCES[segment],
    remainingSources:filtered.remaining.map(i=>r.WHEEL_SOURCES[i]),tokenCost:filtered.removed.length,
    unlocked:typeof config.wheelUnlocked === 'boolean' ? config.wheelUnlocked : null};
}

function predict(config) {
  const event = config.event;
  if(event && own(config,'startLevel')) throw new Error('For event input, use its probability/chain state; do not also supply startLevel.');
  const seed = event ? r.readEventSeed(event) : normalizeSeed(config.seed);
  if (seed === null) throw new Error('Event seed is invalid for this seedVersion.');
  const rawSeed = Math.floor((seed-2**48)/2**16) >>> 0;
  const held = own(config,'heldCards') ? config.heldCards : undefined;
  if (held !== undefined && (!held || typeof held !== 'object' || Array.isArray(held))) {
    throw new Error('heldCards must be a card-ID to count object. Omit it if unknown.');
  }
  const probability = event?.probability ?? config.probabilityPercent;
  if (!event?.chain && !own(config,'startLevel') && !r.isImpossibleProbability(probability)) {
    throw new Error('Supply startLevel or the stored probabilityPercent (percentage units).');
  }
  if (own(config,'startLevel') && (!Number.isSafeInteger(config.startLevel) || config.startLevel<0 || config.startLevel>1000)) {
    throw new Error('startLevel must be an integer between 0 and 1000.');
  }
  const maxTurns = config.maxTurns ?? 256;
  if (!Number.isInteger(maxTurns) || maxTurns<1 || maxTurns>10000) throw new Error('maxTurns must be 1..10000.');
  const wheel = event?.chain?.spun ? {status:'already_spun',segment:event.chain.spunSegment,
    source:r.payoutSource(event.chain)} : wheelSetup(config,seed);
  const games = event?.chain ? [event.chain.game] : r.MINIGAMES.map(g=>g.id);
  const branches = games.map(game=>{
    let chain;
    if (event?.chain) {
      chain = r.startOrResumeEvent(event,game).chain;
    } else {
      chain = r.createChain({source:event?.source ?? config.source,probability,game,seed,startedAt:0,
        board:event?.boards?.[game] || null});
      if (own(config,'startLevel') && !event) {
        chain={...chain,startLevel:config.startLevel,bonusLevel:config.startLevel,level:config.startLevel};
        chain=r.refreshBoard(chain,seed);
      }
    }
    const turns=[];
    const stopOptions=[];
    function addPoint(reason) {
      const card=predictCard(seed,game,chain.level,held,chain);
      const point={reason,afterTurns:chain.flips.length,level:chain.level,megas:r.totalMegas(chain),
        bonus:r.accumulatedBonus(chain),card};
      if (Number.isFinite(config.spinCurrency) && typeof card.tokensAddedNow==='number' && typeof wheel.tokenCost==='number') {
        point.canAffordWheel=config.spinCurrency+card.tokensAddedNow>=wheel.tokenCost;
      }
      stopOptions.push(point);
    }
    addPoint(chain.settled?'already_settled':'stop_now');
    for(let i=0;i<maxTurns && !chain.settled;i++) {
      const step=chain.flips.length;
      const call=Array.isArray(config.calls) && config.calls[step]!==undefined ? Boolean(config.calls[step]) : true;
      const result=replayTurn(chain,call);
      chain=result.chain;
      turns.push(result.turn);
      addPoint(chain.settled?'forced_loss':'stop_now');
    }
    const best=stopOptions.reduce((a,b)=>b.megas>a.megas?b:a);
    return {game,startLevel:chain.startLevel,complete:!!chain.settled,
      outcomeSequence:turns.map(t=>t.won?'W':'L').join(''),
      naturalEnd:chain.settled?stopOptions.at(-1):null,
      bestMegaOption:{afterTurns:best.afterTurns,reason:best.reason,level:best.level,megas:best.megas},
      stopOptions,turns};
  });
  return {storedSeed:seed,rawSeed,
    assumptions:{build:'index-kVDE62Ka.js',heldCardsKnown:held!==undefined,
      source:event?.source ?? config.source ?? null,
      startLevelOverridden:!event && own(config,'startLevel'),
      minigameUnlocksChecked:false,
      note:'All hypothetical stop options use the same supplied collection snapshot. No rewards are cumulatively granted between alternatives. Wheel result is conditional on eligibility/unlock/tokens. Existing event.chain restricts replay to its actual game.'},
    wheel,branches};
}

module.exports={normalizeSeed,replayTurn,predict,predictCard,wheelSetup};
