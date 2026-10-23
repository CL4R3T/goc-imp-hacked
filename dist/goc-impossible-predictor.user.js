// ==UserScript==
// @name         Game of Chance · Impossible 预测面板
// @namespace    local.goc.impossible-predictor
// @version      1.0.0
// @description  本地读取 Impossible 状态，预测逐局收益、抽卡及货币转盘；不修改游戏存档。
// @match        https://gameofchance.xyz/*
// @match        https://*.gameofchance.xyz/*
// @match        https://gameofchance.pages.dev/*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==

(()=>{'use strict';
const USERSCRIPT_VERSION="1.0.0";
const RULES=(()=>{const module={exports:{}};
// Impossible prediction rules.
"use strict";

const b1 = {
  "coin": {
    "name": "Coins"
  },
  "dice": {
    "name": "Dice"
  },
  "card": {
    "name": "Cards"
  },
  "d20": {
    "name": "D20s"
  },
  "roulette": {
    "name": "Roulette"
  },
  "lottery": {
    "name": "Lottery"
  },
  "dart": {
    "name": "World Map"
  },
  "rocket": {
    "name": "Solar System"
  },
  "element": {
    "name": "Periodic Table"
  },
  "animal": {
    "name": "Animal Kingdom"
  },
  "plant": {
    "name": "Plant Kingdom"
  }
};
const iH = Object.freeze(["coin", "dice", "card", "d20", "roulette", "lottery", "dart", "rocket", "element", "animal", "plant"]);
const fQ = {
  deal: .5,
  reveal: .75,
  wheel: .75
};
const bQ = e => fQ[e] ?? 1;
let ZR = 1;
const QR = e => bQ(e) * ZR;
const tc = (e, t) => Math.max(1, Math.round(Number(t) / QR(e)));
const CQ = 3;
const kQ = 13;
const plinkoRows = (e = 0) => Math.min(kQ, CQ + 2 * Math.ceil(Math.max(0, Math.floor(e)) / 2));
const bucketShowsChance = e => e % 2 === 0;
const plinkoPathForFace = (e, t, a = Math.random) => {
  const s = Math.max(0, Math.floor(t)),
    r = [];
  let i = 0;
  for (let o = 0; o < s; o += 1) {
    const l = a() < .5;
    r.push(l), l && (i += 1);
  }
  return bucketShowsChance(i) === !!e ? r : r.map(o => !o);
};
const createBucketValues = (e, t = 9, a = Math.random) => {
  const s = new Array(e + 1).fill(0),
    r = Math.max(0, Math.floor(t));
  if (r < 1) return s;
  const i = Math.floor((e + 1) / 2) + (e + 1) % 2,
    o = [];
  for (let l = 0; l + 1 < i; l += 2) {
    const c = 1 + Math.floor(a() * r);
    o.push(c, -c);
  }
  o.length < i && o.push(0);
  for (let l = o.length - 1; l > 0; l -= 1) {
    const c = Math.floor(a() * (l + 1));
    [o[l], o[c]] = [o[c], o[l]];
  }
  for (let l = 0; l <= e; l += 1) s[l] = o[Math.min(l, e - l)] ?? 0;
  return s;
};
const countRightSteps = (e = []) => e.filter(Boolean).length;
const WHEEL_SOURCES = [...iH];
const v3 = WHEEL_SOURCES.length;
const IQ = 5e4;
const wheelEligibility = (e = {}, t = {}) => WHEEL_SOURCES.map((a, s) => {
  const r = Number(e[a]?.totalActions),
    i = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : 0,
    o = !!t[a];
  return {
    source: a,
    index: s,
    actions: i,
    unlocked: o,
    eligible: o && i >= IQ
  };
});
const filterWheelSegments = (e, t = []) => {
  const a = [...new Set(e)].filter(i => Number.isInteger(i) && i >= 0 && i < v3),
    s = [...new Set(t)].filter(i => a.includes(i)),
    r = a.filter(i => !s.includes(i));
  return {
    available: a,
    removed: s,
    remaining: r
  };
};
const chooseWheelSegment = (e = [], t = Math.random, a = WHEEL_SOURCES.map((s, r) => r)) => {
  const {
    remaining: s
  } = filterWheelSegments(a, e);
  return s.length ? s[Math.min(s.length - 1, Math.floor(t() * s.length))] : null;
};
const vh = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const iP = ["hearts", "diamonds"];
const BQ = ["spades", "clubs"];
const DQ = e => iP.includes(e);
const OQ = 3;
const $Q = 25;
const dealHandSize = (e = 0) => Math.min($Q, OQ + 2 * Math.max(0, Math.floor(e)));
const redMinusBlack = (e, t = e.length) => e.slice(0, t).reduce((a, s) => a + (DQ(s.suit) ? 1 : -1), 0);
const zQ = e => vh[Math.min(vh.length - 1, Math.floor(e() * vh.length))];
const HQ = (e, t) => {
  const a = e ? iP : BQ;
  return a[Math.min(a.length - 1, Math.floor(t() * a.length))];
};
const dealForFace = (e, t, a = Math.random) => {
  const s = Array.from({
      length: t
    }, () => a() < .5),
    i = s.filter(Boolean).length * 2 > t !== e;
  return s.map(o => ({
    suit: HQ(i ? !o : o, a),
    rank: zQ(a)
  }));
};
const WQ = e => Math.abs(redMinusBlack(e));
const dealBonus = (e, t) => e.length === 0 ? 0 : (t ? 1 : -1) * WQ(e);
const Ji = "chance";
const Xi = "skull";
const Zi = "blank";
const oP = [Ji, Xi, Zi];
const SLOT_SYMBOL_WEIGHTS = {
  [Ji]: 20,
  [Xi]: 20,
  [Zi]: 11
};
const eee = oP.reduce((e, t) => e + SLOT_SYMBOL_WEIGHTS[t], 0);
const SLOT_PAYLINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
const Cx = 3;
const Kl = 3;
const cP = Cx * Kl;
const dP = "double";
const uP = "wipe";
const DS = "quiet";
const randomSlotSymbol = (e = Math.random) => {
  let t = e() * eee;
  for (const a of oP) if (t -= SLOT_SYMBOL_WEIGHTS[a], t < 0) return a;
  return Zi;
};
const slotLineSymbols = (e = []) => SLOT_PAYLINES.filter(([t, a, s]) => e[t] && e[t] === e[a] && e[a] === e[s]).map(([t]) => e[t]);
const hasSlotLine = (e = []) => slotLineSymbols(e).length > 0;
const slotEffect = (e = []) => {
  const t = slotLineSymbols(e),
    a = t.includes(Ji),
    s = t.includes(Xi);
  return a && s ? DS : a ? dP : s ? uP : DS;
};
const slotGridForWin = (e, t = Math.random) => {
  for (let a = 0; a < 400; a += 1) {
    const s = Array.from({
      length: cP
    }, () => randomSlotSymbol(t));
    if (hasSlotLine(s) === !!e) return s;
  }
  return e ? [Ji, Ji, Ji, Xi, Zi, Xi, Zi, Xi, Zi] : [Ji, Xi, Zi, Xi, Zi, Ji, Zi, Ji, Xi];
};
const slotBonus = (e, t = 0) => {
  const a = Math.max(0, Math.floor(Number(t) || 0));
  return a === 0 ? 0 : e === dP ? a : e === uP ? -a : 0;
};
const R2 = 900;
const r6 = 14;
const cee = 150;
const dee = 2400;
const pP = (e = 0) => Math.min(dee, tc("slot", R2 + cee * Math.max(0, Math.floor(Number(e) || 0))));
const uee = (e = 0) => Math.max(1, Math.round((r6 + Kl) * pP(e) / R2) - Kl);
const gee = 4294967296;
const x5 = 65536;
const w5 = 281474976710656;
const fee = w5 * 2;
const gP = e => {
  let t = Number(e) >>> 0 ^ 2781027879;
  return t = Math.imul(t ^ t >>> 16, 2146121005) >>> 0, t = Math.imul(t ^ t >>> 15, 2221713035) >>> 0, t = (t ^ t >>> 16) >>> 0, t & x5 - 1;
};
const encodeSeed = e => {
  const t = Number(e) >>> 0;
  return w5 + t * x5 + gP(t);
};
const isEncodedSeed = e => {
  if (!Number.isSafeInteger(e) || e < w5 || e >= fee) return !1;
  const t = e - w5,
    a = Math.floor(t / x5);
  return t - a * x5 === gP(a);
};
const bee = e => isEncodedSeed(e) ? Math.floor((e - w5) / x5) >>> 0 : Number(e) >>> 0;
const createSeed = (e = Math.random) => encodeSeed(Math.floor(e() * gee) >>> 0);
const seededRandom = (e = 0, t = 0, a = 0) => {
  let s = bee(e);
  return s = Math.imul(s ^ 2654435769, 2246822507) >>> 0, s = (s ^ s >>> 13) >>> 0, s = Math.imul(s ^ Number(t) >>> 0, 3266489909) >>> 0, s = (s ^ s >>> 16) >>> 0, s = Math.imul(s ^ Number(a) >>> 0, 668265263) >>> 0, s = (s ^ s >>> 15) >>> 0, () => {
    s = s + 1831565813 >>> 0;
    let r = s;
    return r = Math.imul(r ^ r >>> 15, r | 1), r ^= r + Math.imul(r ^ r >>> 7, r | 61), ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
};
const fP = (e = "") => {
  let t = 2166136261;
  const a = String(e);
  for (let s = 0; s < a.length; s += 1) t = Math.imul(t ^ a.charCodeAt(s), 16777619) >>> 0;
  return t >>> 0;
};
const outcomeRandom = (e, t) => seededRandom(e, t, 0);
const minigameRandom = (e, t, a) => seededRandom(e, t, fP(a) || 1);
const boardRandom = (e, t, a) => seededRandom(e, t, (fP(a) ^ 1542469173) >>> 0 || 2);
const cardRandom = e => seededRandom(e, 51837, 1067064189);
const wheelRandom = e => seededRandom(e, 16097, 2135567385);
const IMPOSSIBLE_THRESHOLD_PERCENT = 715112384e-14;
const kee = .5;
const x7 = 10;
const vee = 1.5;
const isImpossibleProbability = e => {
  const t = Number(e);
  return Number.isFinite(t) && t > 0 && t <= IMPOSSIBLE_THRESHOLD_PERCENT;
};
const startingLevel = e => {
  if (!isImpossibleProbability(e)) return 0;
  const t = Math.log2(IMPOSSIBLE_THRESHOLD_PERCENT) - Math.log2(Number(e));
  return Math.max(0, Math.floor(t));
};
const Aee = e => e < 100 ? Math.round(e) : Number(e.toPrecision(2));
const baseMegas = e => {
  const t = Number(e);
  return !Number.isFinite(t) || t < 0 ? x7 : Aee(x7 * vee ** Math.floor(t));
};
const _ee = 9;
const accumulatedBonus = e => {
  const t = Number(e?.bonus);
  return Number.isFinite(t) ? t : 0;
};
const totalMegas = e => e ? Math.max(0, baseMegas(e.level) + accumulatedBonus(e)) : x7;
const yP = e => Math.max(0, Math.floor(totalMegas(e)));
const Mee = e => Math.min(_ee, yP(e));
const c6 = "coin";
const Sx = "plinko";
const qm = "deal";
const Wm = "slot";
const xP = 3;
const wP = [8, 9, 10];
const Bf = wP[0];
const shinyTier = e => {
  const t = Math.floor(Number(e));
  return !Number.isFinite(t) || t < Bf ? null : Math.min(wP.length - 1, t - Bf);
};
const MINIGAMES = [{
  "id": "coin",
  "name": "Coin",
  "unlockLevel": null
}, {
  "id": "deal",
  "name": "The Deal",
  "unlockLevel": 4
}, {
  "id": "plinko",
  "name": "Plinko",
  "unlockLevel": 5
}, {
  "id": "slot",
  "name": "The Slot Machine",
  "unlockLevel": 6
}];
const Ax = e => MINIGAMES.find(t => t.id === e) || MINIGAMES[0];
const isMinigameUnlocked = (e, t = {}) => {
  const a = Ax(e).unlockLevel;
  return a === null ? !0 : Number(t?.[a] || 0) > 0;
};
const isWheelUnlocked = (e = {}) => Number(e?.[xP] || 0) > 0;
const createBoard = (e, t = Math.random) => {
  const a = e?.level ?? 0;
  if (e?.game === qm) return {
    cards: dealHandSize(a)
  };
  if (e?.game === Wm) return {
    cells: cP,
    runUp: uee(a),
    spinMs: pP(a)
  };
  const s = plinkoRows(a);
  return {
    rows: s,
    values: createBucketValues(s, Mee(e), t)
  };
};
const refreshBoard = (e, t = e?.seed) => e?.settled ? e : {
  ...e,
  seed: t,
  board: createBoard(e, boardRandom(t, e?.flips?.length || 0, e?.game))
};
const v5 = 1;
const WS = e => Number.isInteger(e) && e >= 0 && e < 4294967296;
const readEventSeed = e => {
  if (isEncodedSeed(e?.seed)) return e.seed;
  if (isEncodedSeed(e?.chain?.seed)) return e.chain.seed;
  if (e?.seedVersion !== v5) {
    if (WS(e?.seed)) return encodeSeed(e.seed);
    if (WS(e?.chain?.seed)) return encodeSeed(e.chain.seed);
  }
  const t = Object.prototype.hasOwnProperty.call(e || {}, "seed") || Object.prototype.hasOwnProperty.call(e?.chain || {}, "seed");
  if (e?.seedVersion === v5 || t) return null;
  let a = 2166136261;
  const s = String(e?.id || "");
  for (let r = 0; r < s.length; r += 1) a = Math.imul(a ^ s.charCodeAt(r), 16777619) >>> 0;
  return encodeSeed(a);
};
const createChain = ({
  source: e,
  probability: t = null,
  startedAt: a = Date.now(),
  game: s = c6,
  board: r = null,
  seed: i = createSeed()
} = {}) => {
  const o = startingLevel(t),
    l = {
      source: e,
      probability: t,
      seed: isEncodedSeed(i) ? i : encodeSeed(i),
      game: Ax(s).id,
      bonusLevel: o,
      startLevel: o,
      level: o,
      bonus: 0,
      flips: [],
      faces: [],
      settled: !1,
      startedAt: a
    };
  return {
    ...l,
    board: r || createBoard(l, boardRandom(l.seed, 0, l.game))
  };
};
const startOrResumeEvent = (e, t = c6) => {
  if (!e) return e;
  const a = readEventSeed(e);
  return a === null ? e : e.chain ? e.chain.board ? e : {
    ...e,
    chain: {
      ...e.chain,
      seed: a,
      board: createBoard(e.chain, boardRandom(a, e.chain.flips?.length || 0, e.chain.game))
    }
  } : {
    ...e,
    chain: createChain({
      source: e.source,
      probability: e.probability,
      game: t,
      seed: a,
      board: e.boards?.[t] || null
    })
  };
};
const resolveCall = (e, t = Math.random, a = !0) => {
  if (!e || e.settled) return e;
  const s = t() < kee,
    r = s === !!a,
    i = [...e.flips, s],
    o = [...(e.faces || []), r];
  return s ? {
    ...e,
    flips: i,
    faces: o,
    level: e.level + 1
  } : {
    ...e,
    flips: i,
    faces: o,
    settled: !0,
    settledAt: Date.now()
  };
};
const applyBonus = (e, t = 0) => {
  const a = Number(t);
  if (!e || !Number.isFinite(a) || a === 0) return e;
  const s = yP(e),
    r = Math.max(-s, Math.min(s, a));
  return r === 0 ? e : {
    ...e,
    bonus: accumulatedBonus(e) + r
  };
};
const payoutSource = e => e?.payoutSource && WHEEL_SOURCES.includes(e.payoutSource) ? e.payoutSource : e?.source;
// Per-source percentages, ordered by game (Coin/Deal/Plinko/Slots), then card band.
const ORDINARY_CARD_PERCENTS = {
  "coin": [1, 2, 3, 1, 2, 4, 1, 1, 1, 1, 5, 1, 1, 3, 1, 2],
  "dice": [2, 1, 1, 2, 1, 1, 1, 3, 1, 3, 5, 1, 1, 1, 2, 4],
  "card": [1, 2, 3, 5, 1, 1, 1, 1, 1, 3, 1, 1, 2, 4, 2, 1],
  "d20": [1, 1, 2, 1, 1, 1, 4, 1, 1, 1, 1, 5, 2, 3, 3, 2],
  "roulette": [1, 1, 4, 2, 1, 1, 2, 3, 1, 5, 1, 3, 1, 1, 1, 2],
  "lottery": [1, 1, 1, 1, 1, 1, 1, 5, 3, 2, 2, 3, 1, 4, 1, 2],
  "dart": [1, 1, 1, 2, 2, 1, 1, 1, 4, 1, 2, 3, 1, 1, 3, 5],
  "rocket": [2, 3, 2, 1, 1, 3, 1, 5, 1, 1, 1, 2, 1, 1, 4, 1],
  "element": [2, 1, 1, 1, 1, 2, 4, 2, 1, 1, 1, 3, 1, 1, 5, 3],
  "animal": [1, 3, 1, 5, 1, 1, 4, 1, 1, 1, 2, 2, 3, 1, 1, 2],
  "plant": [1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 4, 1, 1, 1, 5]
};
const gs = Object.keys(ORDINARY_CARD_PERCENTS);
const z8 = [0, 2, 3, 5];
const CARD_DECKS = [{
  game: c6,
  technique: "Coin",
  bands: z8
}, {
  game: qm,
  technique: "The Deal",
  bands: z8
}, {
  game: Sx,
  technique: "Plinko",
  bands: z8
}, {
  game: Wm,
  technique: "Slot Machine",
  bands: z8
}];
const i9 = e => CARD_DECKS.find(t => t.game === e) || CARD_DECKS[0];
const qs = "global";
const ub = .05;
const DECK_SHINIES = [{
  art: "Coin Colossus",
  target: "coin",
  percent: 10
}, {
  art: "Ouroterra",
  target: null,
  percent: 1
}, {
  art: "King Cardian",
  target: "card",
  percent: 10
}, {
  art: "Spinoracle",
  target: "roulette",
  percent: 10
}, {
  art: "Cubic Regent",
  target: "dice",
  percent: 10
}, {
  art: "Atomarch",
  target: "element",
  percent: 10
}, {
  art: "Icosa Titan",
  target: "d20",
  percent: 10
}, {
  art: "Royal Ruse",
  target: null,
  percent: 1
}, {
  art: "Dartalon",
  target: "dart",
  percent: 10
}, {
  art: "Astralflare",
  target: "rocket",
  percent: 10
}, {
  art: "Gaialith",
  target: null,
  percent: 1
}, {
  art: "Canopy Titan",
  target: "plant",
  percent: 10
}, {
  art: "Chestlord",
  target: null,
  percent: 1
}, {
  art: "Cloverlynx",
  target: "animal",
  percent: 10
}, {
  art: "Lototron",
  target: "lottery",
  percent: 10
}, {
  art: "Irisflare",
  target: null,
  percent: 1
}];
const mb = z8.length;
const zF = (e, t) => {
  const a = CARD_DECKS.findIndex(r => r.game === e),
    s = Math.floor(Number(t));
  return a < 0 || s < 0 || s >= mb ? null : DECK_SHINIES[a * mb + s] || null;
};
const pb = "unique";
const UNIQUE_SHINIES = [{
  art: "Terrapex",
  percent: 1,
  fromLevel: null
}, {
  art: "Fortujinn",
  percent: 1,
  fromLevel: null
}, {
  art: "Cryolume",
  percent: 1,
  fromLevel: null
}, {
  art: "Pipsight",
  percent: 1,
  fromLevel: null
}, {
  art: "Chromavyrm",
  percent: 2,
  fromLevel: 10
}, {
  art: "Stackjelly",
  percent: 1,
  fromLevel: null
}];
const hj = 1;
const Dse = 4;
const dw = e => bs(pb, e, qs);
const Use = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const G7 = (e, t, a) => {
  const s = CARD_DECKS.findIndex(o => o.game === e),
    r = CARD_DECKS[s];
  if (!r || t < 0 || t >= r.bands.length) return 0;
  const i = s * r.bands.length + t;
  return ORDINARY_CARD_PERCENTS[a]?.[i] ?? 0;
};
const ordinaryCardBand = (e, t = 0) => {
  const {
      bands: a
    } = i9(e),
    s = Math.max(0, Math.floor(Number(t) || 0));
  let r = 0;
  for (let i = 0; i < a.length; i += 1) s >= a[i] && (r = i);
  return r;
};
const bs = (e, t, a) => `${e}:${t}:${a}`;
const qse = e => {
  const [t, a, s] = String(e || "").split(":");
  return t && a !== void 0 && s ? {
    game: t,
    band: Number(a),
    source: s
  } : null;
};
const cardById = e => {
  const t = qse(e);
  if (!t) return null;
  if (t.game === pb) {
    const r = UNIQUE_SHINIES[t.band];
    if (!r || t.source !== qs) return null;
    const i = r.percent ?? hj;
    return {
      id: e,
      game: pb,
      band: t.band,
      source: qs,
      sourceName: "Every game mode",
      percent: i,
      technique: "Unique",
      global: !0,
      unique: !0,
      prismatic: i > hj,
      fromLevel: r.fromLevel ?? null,
      name: r.art,
      description: `Every game mode's actions become permanently ${i}% faster.`
    };
  }
  const a = CARD_DECKS.find(r => r.game === t.game);
  if (!a || t.band < 0 || t.band >= a.bands.length) return null;
  if (t.source === qs) {
    const r = zF(t.game, t.band);
    if (!r) return null;
    const i = r.target,
      o = i ? b1[i]?.name || i : "Every game mode";
    return {
      id: e,
      game: t.game,
      band: t.band,
      source: qs,
      sourceName: o,
      targetSource: i,
      percent: r.percent,
      technique: a.technique,
      global: !0,
      name: r.art,
      description: i ? `${o} actions become permanently ${r.percent}% faster.` : `Every game mode's actions become permanently ${r.percent}% faster.`
    };
  }
  if (!gs.includes(t.source)) return null;
  const s = b1[t.source]?.name || t.source;
  return {
    id: e,
    game: t.game,
    band: t.band,
    source: t.source,
    sourceName: s,
    percent: G7(t.game, t.band, t.source),
    technique: a.technique,
    name: `${a.technique} ${Use[t.band] || t.band + 1}`,
    description: `${s} actions become permanently ${G7(t.game, t.band, t.source)}% faster.`
  };
};
const Kse = CARD_DECKS.flatMap(e => e.bands.map((t, a) => bs(e.game, a, qs)));
const Vse = CARD_DECKS.map(e => bs(e.game, e.bands.length - 1, qs));
const shinyPoolAtTier = (e, t) => {
  const a = UNIQUE_SHINIES.map((s, r) => s.fromLevel === null || Number(t) >= s.fromLevel ? dw(r) : null).filter(Boolean);
  return e <= 0 ? [...Kse, ...a] : e === 1 ? [...Vse, ...a] : a;
};
const selectShinyPool = (e, t, a) => {
  for (let s = e; s > 0; s -= 1) {
    const r = shinyPoolAtTier(s, t);
    if (r.some(i => po(a, i) === 0)) return r;
  }
  return shinyPoolAtTier(0, t);
};
const rewardPool = (e, t, a = 0) => {
  const s = i9(t),
    r = shinyTier(a);
  if (r !== null) {
    const l = selectShinyPool(r, a, e);
    return l.map(c => ({
      id: c,
      weight: 1 / l.length
    }));
  }
  const i = ordinaryCardBand(s.game, a),
    o = (1 - ub) / gs.length;
  return [...gs.map(l => ({
    id: bs(s.game, i, l),
    weight: o
  })), {
    id: bs(s.game, i, qs),
    weight: ub
  }];
};
const drawCardId = (e, t, a = 0, s = Math.random) => {
  const r = i9(t),
    i = ordinaryCardBand(r.game, a),
    o = shinyTier(a);
  if (o !== null) {
    const c = selectShinyPool(o, a, e);
    return c[Math.min(c.length - 1, Math.floor(s() * c.length))];
  }
  if (s() < ub) return bs(r.game, i, qs);
  const l = gs[Math.min(gs.length - 1, Math.floor(s() * gs.length))];
  return bs(r.game, i, l);
};
const Zse = 3;
const duplicateTokens = e => {
  const t = cardById(e);
  return t ? t.prismatic ? Dse : t.global ? Zse : Math.ceil(t.percent / 2) : 0;
};
const po = (e, t) => Math.max(0, Math.floor(Number(e?.[t]) || 0));
const hb = (e, t) => po(e, t) > 0;
const drawCard = (e, t, a = 0, s = Math.random) => {
  const r = drawCardId(e, t, a, s),
    i = !hb(e, r);
  return {
    id: r,
    card: cardById(r),
    isNew: i,
    spin: i ? 0 : duplicateTokens(r),
    pool: rewardPool(e, t, a)
  };
};
module.exports = {
  "IMPOSSIBLE_THRESHOLD_PERCENT": IMPOSSIBLE_THRESHOLD_PERCENT,
  "MINIGAMES": MINIGAMES,
  "WHEEL_SOURCES": WHEEL_SOURCES,
  "accumulatedBonus": accumulatedBonus,
  "applyBonus": applyBonus,
  "cardById": cardById,
  "cardRandom": cardRandom,
  "chooseWheelSegment": chooseWheelSegment,
  "countRightSteps": countRightSteps,
  "createChain": createChain,
  "dealBonus": dealBonus,
  "dealForFace": dealForFace,
  "drawCard": drawCard,
  "drawCardId": drawCardId,
  "duplicateTokens": duplicateTokens,
  "encodeSeed": encodeSeed,
  "filterWheelSegments": filterWheelSegments,
  "isEncodedSeed": isEncodedSeed,
  "isImpossibleProbability": isImpossibleProbability,
  "isMinigameUnlocked": isMinigameUnlocked,
  "isWheelUnlocked": isWheelUnlocked,
  "minigameRandom": minigameRandom,
  "outcomeRandom": outcomeRandom,
  "payoutSource": payoutSource,
  "plinkoPathForFace": plinkoPathForFace,
  "readEventSeed": readEventSeed,
  "redMinusBlack": redMinusBlack,
  "refreshBoard": refreshBoard,
  "resolveCall": resolveCall,
  "shinyPoolAtTier": shinyPoolAtTier,
  "shinyTier": shinyTier,
  "slotBonus": slotBonus,
  "slotEffect": slotEffect,
  "slotGridForWin": slotGridForWin,
  "startOrResumeEvent": startOrResumeEvent,
  "totalMegas": totalMegas,
  "wheelEligibility": wheelEligibility,
  "wheelRandom": wheelRandom
};

return module.exports;})();
const PREDICTOR=(()=>{const module={exports:{}};
// Offline replay of the supplied Game of Chance build. Does not read or modify game saves.
const r=RULES;
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

return module.exports;})();
const SUMMARY=(()=>{const module={exports:{}};
const r=RULES;

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

return module.exports;})();
// Browser adapter and UI. Uses page data only; never calls a game action or writes storage.
const EXPECTED_BUILD='index-kVDE62Ka.js';
const INSTANCE='__GOC_IMPOSSIBLE_PREDICTOR_V1__';
const HOST_ID='goc-impossible-predictor';
const SOURCE_NAMES={coin:'Coins',dice:'Dice',card:'Cards',d20:'D20',roulette:'Roulette',lottery:'Lottery',dart:'Darts',rocket:'Rockets',element:'Elements',animal:'Animals',plant:'Plants'};
const GAME_NAMES={coin:'Coin',deal:'The Deal',plinko:'Plinko',slot:'Slots'};
if(window[INSTANCE]?.destroy) window[INSTANCE].destroy();
let disposed=false,collapsed=true,allowUnknown=false,follow=true,showClaimed=false;
let wheelTarget=null,selectedId=null,manual=null,snapshot=null,lastSignature='';
let lastAutoId=null,lastDBRead=0,dbBusy=false,dbSnapshot=null,uiMessage='',drag=null;
let detectedBuild=null,previewEvent=null;
const host=document.createElement('div');
host.id=HOST_ID;
host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483646;width:106px;max-width:calc(100vw - 20px);font:13px system-ui,sans-serif;color-scheme:dark;';
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`<style>
:host{all:initial;font:13px/1.5 system-ui,sans-serif;color:#e9eef6;color-scheme:dark}*{box-sizing:border-box}
[hidden]{display:none!important}.launcher{width:100%;padding:8px 10px;color:#ffd36d;background:#171d29ee;border:1px solid #645438;border-radius:20px;box-shadow:0 3px 16px #0005}
.panel{background:#10141eeF;border:1px solid #3b414f;border-radius:14px;box-shadow:0 14px 55px #0008;overflow:hidden;backdrop-filter:blur(16px)}
header{display:flex;align-items:center;gap:8px;padding:10px 13px;background:#1b202c;cursor:move;touch-action:none;user-select:none}header strong{font-size:13px;color:#ffd36d;flex:1}header button{padding:2px 8px}
button,input,select,textarea{font:inherit;color:inherit}button{border:1px solid #414958;background:#252c3a;border-radius:6px;padding:5px 9px;cursor:pointer}button:hover{background:#354156}button:disabled{cursor:default;opacity:.5}input[type=checkbox]{accent-color:#ffc65a}
.body{max-height:min(78vh,820px);overflow:auto;padding:12px}.status{font-size:11px;color:#9eacbf;margin-bottom:8px}.good{color:#7ce5af}.bad{color:#ff999d}.amber{color:#ffd36d}.muted{color:#96a1b2}.tiny{font-size:11px}.mono{font-family:ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.row label{display:flex;align-items:center;gap:5px}.row select{flex:1;min-width:0}select,textarea{background:#0c1018;border:1px solid #414958;border-radius:6px;padding:6px;width:100%}
.event{font-weight:650;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.box{background:#171d29;border:1px solid #303949;border-radius:9px;padding:10px;margin-top:10px}
.outcome{font-size:15px;margin:5px 0}.currencies{margin-bottom:10px}.wheel-summary{border-top:1px solid #303747;padding-top:10px;margin-top:9px}.wheel-summary select{width:auto;flex:1}.game-summary td:first-child{width:20%}.game-summary td:nth-child(2){width:44%}.game-summary td{padding:8px 4px}.game-summary .tiny{line-height:1.55}

table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0}th,td{padding:6px 5px;text-align:left;border-bottom:1px solid #303747;vertical-align:top}th{font-size:11px;color:#96a1b2;font-weight:500}details>summary{cursor:pointer;list-style-position:inside;color:#dbe6f6}textarea{min-height:100px;resize:vertical;margin-top:7px}.empty{padding:18px 4px;color:#a8b5c8}.toolbar{margin-top:11px;border-top:1px solid #303747;padding-top:9px}.warn{border:1px solid #79603b;color:#ffd36d;background:#30291c;border-radius:7px;padding:8px;margin:8px 0}.error{white-space:pre-wrap;color:#ffb7bb}.break{overflow-wrap:anywhere}
</style><button class="launcher" data-action="open" title="打开预测面板，自动读取当前 Impossible 事件">Imp 预测</button><section class="panel" hidden><header><strong>Impossible · 预测</strong><button data-action="refresh" title="刷新读取">↻</button><button data-action="collapse" title="关闭面板">×</button></header><div class="body" hidden><div class="status">正在连接游戏状态…</div></div></section>`;
document.documentElement.appendChild(host);
const body=shadow.querySelector('.body');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
const number=value=>Number.isFinite(value)?value.toLocaleString('en-US'):'—';

function findBuild(){
  const scripts=[...document.scripts].map(s=>s.src).filter(Boolean);
  return scripts.map(s=>{try{return new URL(s,location.href).pathname.split('/').at(-1);}catch{return '';}}).find(s=>/^index-[\w-]+\.js$/.test(s))||null;
}
function isContext(value){return value && Array.isArray(value.impossibleEvents) && typeof value.impossibleCards==='object';}
function findLive(){
  const anchors=[document.getElementById('root'),...document.querySelectorAll('#root > *,body > #root > *')].filter(Boolean);
  let first=null;
  for(const element of anchors){
    const key=Object.getOwnPropertyNames(element).find(k=>k.startsWith('__reactContainer$')||k.startsWith('__reactFiber$'));
    if(key){first=element[key];break;}
  }
  if(!first)return null;
  // HostRoot's stateNode.current points to the committed tree, avoiding stale alternates.
  first=first.stateNode?.current||first.current||first;
  const stack=[first],seen=new Set();
  let value=null,preview=null;
  while(stack.length && seen.size<50000){
    const fiber=stack.pop();
    if(!fiber||seen.has(fiber))continue;
    seen.add(fiber);
    const props=fiber.memoizedProps;
    if(isContext(props?.value))value=props.value;
    let dep=fiber.dependencies?.firstContext;
    for(let count=0;dep&&count<30;count++,dep=dep.next){if(isContext(dep.memoizedValue))value ||= dep.memoizedValue;}
    if(props?.event?.id && typeof props.onStart==='function' && typeof props.onDismiss==='function')preview=props.event;
    if(fiber.sibling)stack.push(fiber.sibling);
    if(fiber.child)stack.push(fiber.child);
  }
  if(!value)return null;
  previewEvent=preview;
  return {kind:'live',label:'页面实时状态',events:value.impossibleEvents,cards:value.impossibleCards,
    tokens:value.impossibleSpinCurrency,activeId:value.activeImpossibleEvent?.id||null,
    progress:Array.isArray(value.impossibleWheelProgress)?value.impossibleWheelProgress:null};
}

function finalCounts(events){
  const counts={};
  for(const event of events)if(event.chain?.claimed && event.chain?.settled){
    const level=Math.max(0,Math.floor(Number(event.chain.level)||0));counts[level]=(counts[level]||0)+1;
  }
  return counts;
}
async function readDatabase(){
  if(dbBusy||disposed)return;
  dbBusy=true;lastDBRead=Date.now();
  let db=null;
  try{
    if(indexedDB.databases){
      const databases=await indexedDB.databases();
      if(!databases.some(d=>d.name==='gameofchance'))throw new Error('未找到已有游戏数据库。');
    }
    db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open('gameofchance');
      let timedOut=false;
      const deadline=setTimeout(()=>{timedOut=true;reject(new Error('读取存档超时。'));},5000);
      req.onupgradeneeded=()=>{req.transaction.abort();}; // Never create a new database.
      req.onerror=()=>{clearTimeout(deadline);reject(req.error||new Error('无法打开已有存档。'));};
      req.onsuccess=()=>{clearTimeout(deadline);if(disposed||timedOut){req.result.close();if(!timedOut)reject(new Error('面板已关闭。'));}else resolve(req.result);};
    });
    if(!db.objectStoreNames.contains('keyval'))throw new Error('存档结构不匹配。');
    const keys=['goc_game_state',...RULES.WHEEL_SOURCES.map(s=>'stats_'+s)];
    const entries=await new Promise((resolve,reject)=>{
      const tx=db.transaction('keyval','readonly'),store=tx.objectStore('keyval'),output={};
      for(const key of keys){const req=store.get(key);req.onsuccess=()=>{output[key]=req.result;};}
      tx.oncomplete=()=>resolve(output);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('读取存档中断。'));
    });
    const decode=v=>typeof v==='string'?JSON.parse(v):v;
    const state=decode(entries.goc_game_state),imp=state?.impossibleChainState;
    if(!Array.isArray(imp?.events))throw new Error('存档中没有 Impossible 状态。');
    const stats={};
    for(const source of RULES.WHEEL_SOURCES){
      try{stats[source]=decode(entries['stats_'+source])||{};}catch{stats[source]={};}
    }
    dbSnapshot={kind:'idb',label:'存档快照（可能滞后）',events:imp.events,cards:imp.cards||{},
      tokens:imp.spinCurrency||0,activeId:imp.activeEventId||null,
      progress:RULES.wheelEligibility(stats,state.unlockedGames||{})};
    uiMessage='已读取本地存档快照。';
  }catch(error){uiMessage='备用读取：'+error.message;}
  finally{db?.close();dbBusy=false;if(!disposed)refresh(true);}
}

function manualSnapshot(config){
  let event=config.event;
  if(!event){
    const seed=PREDICTOR.normalizeSeed(config.seed);
    event={id:'manual-'+seed,label:'手动输入的事件',source:config.source,
      seed,seedVersion:1,probability:config.probabilityPercent??RULES.IMPOSSIBLE_THRESHOLD_PERCENT/2**(config.startLevel||0)};
  }
  return {kind:'manual',label:'手动数据',events:[event],cards:config.heldCards,
    tokens:config.spinCurrency,activeId:event.id,progress:null,config};
}
function chooseEvent(state){
  const autoId=previewEvent?.id||state.activeId;
  if(follow&&autoId&&autoId!==lastAutoId){selectedId=autoId;lastAutoId=autoId;wheelTarget=null;}
  const events=state.events.filter(e=>showClaimed||!e.chain?.claimed||e.id===state.activeId);
  if(!events.some(e=>e.id===selectedId))selectedId=events.at(-1)?.id||null;
  return {event:events.find(e=>e.id===selectedId),events};
}
function configFor(state,event,counts){
  if(state.kind==='manual')return {...state.config,removedSources:[]};
  const available=state.progress?.filter(p=>p.eligible).map(p=>p.source);
  const config={event:clone(event),spinCurrency:state.tokens,wheelUnlocked:RULES.isWheelUnlocked(counts),
    removedSources:[]};
  if(state.cards!==undefined)config.heldCards=clone(state.cards);
  if(available)config.availableSources=available;
  return config;
}
function newCardHtml(card){
  if(card.status==='available')return '<span class="good">有</span><div class="tiny muted">'+esc(card.operation)+'</div>';
  if(card.status==='already_new')return '<span class="good">已获新卡</span>';
  if(card.status==='already_duplicate')return '<span class="muted">已获重复卡</span>';
  if(card.status==='none')return '<span class="muted">无</span>';
  return '<span class="amber tiny">待读取收藏</span>';
}
function gamesHtml(result,counts){
  const rows=result.branches.map(branch=>{
    const info=SUMMARY.summarizeBranch(branch);
    const locked=snapshot?.kind!=='manual'&&!RULES.isMinigameUnlocked(branch.game,counts);
    return '<tr data-game="'+branch.game+'"><td><strong>'+esc(GAME_NAMES[branch.game])+'</strong>'+(locked?'<div class="tiny muted">未解锁</div>':'')+'</td><td><strong class="amber mono">'+number(info.maxMegas)+'</strong>'+(info.complete?'':'<span class="tiny amber">（仅模拟范围内）</span>')+'<div class="tiny muted">'+esc(info.operation)+'</div></td><td>'+newCardHtml(info.newCard)+'</td></tr>';
  }).join('');
  return '<table class="game-summary"><thead><tr><th>小游戏</th><th>最多 Mega / 结算方式</th><th>新卡 / 结算方式</th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function wheelHtml(result,config,state){
  if(result.wheel.status==='already_spun')return '<div class="wheel-summary tiny">已转出 <strong class="amber">'+esc(SOURCE_NAMES[result.wheel.source]||result.wheel.source)+'</strong></div>';
  if(!Array.isArray(config.availableSources))return '<div class="wheel-summary tiny amber">需读取可用币种，才能计算最少关闭组合。</div>';
  const available=RULES.WHEEL_SOURCES.filter(s=>config.availableSources.includes(s));
  if(!available.length)return '<div class="wheel-summary tiny muted">尚无符合条件的转盘币种。</div>';
  const original=config.event?.source||config.source;
  if(!available.includes(wheelTarget))wheelTarget=available.includes(original)?original:result.wheel.source||available[0];
  const plan=SUMMARY.minimumWheelRemoval(result.storedSeed,available,wheelTarget);
  const removal=plan.cost===0?'不用关闭':plan.removedSources.map(s=>SOURCE_NAMES[s]||s).join('、');
  return '<div class="wheel-summary"><label class="row tiny">转盘目标 <select data-control="wheel-target" aria-label="目标币种">'+available.map(s=>'<option value="'+s+'" '+(s===wheelTarget?'selected':'')+'>'+esc(SOURCE_NAMES[s]||s)+'</option>').join('')+'</select></label><div class="wheel-plan" style="margin-top:7px">'+(plan.cost===0?'':'最少关闭：')+'<strong class="amber">'+esc(removal)+'</strong></div><div class="tiny muted">'+plan.cost+' token'+(Number.isFinite(state.tokens)?'，当前 '+number(state.tokens):'')+(config.wheelUnlocked===false?' · 转盘未解锁':'')+'</div></div>';
}
function toolbar(state,events){
  let html='<details class="toolbar" data-import><summary class="tiny muted">工具</summary><div class="status tiny muted" style="margin-top:8px">'+esc(state?.label||'尚未连接')+' · '+esc(detectedBuild||'未识别主包')+'</div>';
  if(state){
    html+='<details data-events><summary class="tiny muted">查看其他事件</summary><div class="row tiny"><label><input type="checkbox" data-control="follow" '+(follow?'checked':'')+'>跟随当前事件</label><label><input type="checkbox" data-control="claimed" '+(showClaimed?'checked':'')+'>显示已领取</label></div><select data-control="event" style="margin-top:7px" aria-label="选择 Impossible 事件">'+events.map(e=>'<option value="'+esc(e.id)+'" '+(e.id===selectedId?'selected':'')+'>'+esc((e.chain?.claimed?'[已领取] ':e.chain?'[游玩中] ':'')+(e.label||e.id))+'</option>').join('')+'</select></details>';
  }
  return html+(uiMessage?'<div class="tiny muted">'+esc(uiMessage)+'</div>':'')+'<div class="row" style="margin-top:8px"><button data-action="idb">读取存档快照</button><button data-action="live">恢复自动读取</button><button data-action="diagnostics">诊断信息</button></div><textarea data-input placeholder="备用：粘贴预测 JSON"></textarea><button data-action="import">载入 JSON</button><div class="tiny muted break" data-diagnostics></div></details>';
}
function render(state,event,events,result,config,counts,error){
  const importOpen=!!body.querySelector('[data-import][open]');
  const eventsOpen=!!body.querySelector('[data-events][open]');
  const input=body.querySelector('[data-input]')?.value||'';
  if(shadow.activeElement?.matches('textarea'))return;
  let html='';
  if(detectedBuild!==EXPECTED_BUILD)html+='<div class="warn tiny">'+(detectedBuild?'游戏版本不同，需核对规则。':'未识别游戏版本。')+'<label class="row"><input type="checkbox" data-control="allow" '+(allowUnknown?'checked':'')+'>继续使用已有规则</label></div>';
  if(event)html+='<div class="event" title="'+esc(event.label||event.id)+'">'+esc(event.label||event.id)+'</div>';
  if(state&&state.kind!=='live')html+='<div class="tiny amber">'+esc(state.label)+'</div>';
  if(event?.chain?.claimed)html+='<div class="tiny amber">已领取，仅供回看。</div>';
  if(error)html+='<div class="error box">'+esc(error)+'</div>';
  else if(result){
    const outcome=SUMMARY.naturalOutcome(result.storedSeed,result.branches[0].startLevel);
    const direct=config.event?.chain?RULES.payoutSource(config.event.chain):config.event?.source||config.source;
    const directName=SOURCE_NAMES[direct]||direct||'未知';
    const defaultWheel=result.wheel.source?SOURCE_NAMES[result.wheel.source]||result.wheel.source:'不可用';
    html+='<div class="outcome">'+(event.chain?.settledBy==='player'?'若不停手：':'')+(outcome?'第 <strong class="bad">'+outcome.failureRound+'</strong> 轮失败 · 最终 <strong>Lvl '+outcome.finalLevel+'</strong>':'尚未找到失败轮次')+'</div><div class="currencies tiny muted">来源：'+esc(directName)+' · '+(result.wheel.status==='already_spun'?'已转出：':'转盘结果：')+esc(defaultWheel)+'</div>';
    html+=gamesHtml(result,counts)+wheelHtml(result,config,state);
  }else html+='<div class="empty">'+(event?'请先核对版本。':state?'没有可预测的事件。':'请先打开一个 Impossible 事件。')+'</div>';
  html+=toolbar(state,events);body.innerHTML=html;
  const imp=body.querySelector('[data-import]');if(importOpen)imp.open=true;
  const selector=body.querySelector('[data-events]');if(selector&&eventsOpen)selector.open=true;
  body.querySelector('[data-input]').value=input;
}

function refresh(force=false){
  if(disposed)return;
  detectedBuild=findBuild();
  let state,error=null;
  try{state=manual?manualSnapshot(manual):findLive()||dbSnapshot;}catch(e){error=e.message;}
  snapshot=state;
  if(!manual && !state && Date.now()-lastDBRead>8000 && !dbBusy)readDatabase();
  if(state?.kind!=='live')previewEvent=null;
  const {event,events}=state?chooseEvent(state):{event:null,events:[]};
  const counts=state?finalCounts(state.events):{};
  const config=event?configFor(state,event,counts):null;
  const signature=JSON.stringify({kind:state?.kind,events:events.map(e=>[e.id,e.label,!!e.chain?.claimed]),config,
    counts,follow,showClaimed,wheelTarget,allowUnknown,detectedBuild,uiMessage,error});
  if(!force&&signature===lastSignature)return;
  let result=null;
  if(config&&(detectedBuild===EXPECTED_BUILD||allowUnknown)){
    try{result=PREDICTOR.predict(config);}catch(e){error='预测失败：'+e.message;}
  }
  render(state,event,events,result,config,counts,error);
  if(!shadow.activeElement?.matches('textarea'))lastSignature=signature;
}

shadow.addEventListener('change',event=>{
  const target=event.target;
  if(!target.matches('[data-control]'))return;
  if(target.dataset.control==='event'){selectedId=target.value;follow=false;wheelTarget=null;}
  if(target.dataset.control==='follow'){follow=target.checked;lastAutoId=null;}
  if(target.dataset.control==='claimed')showClaimed=target.checked;
  if(target.dataset.control==='allow')allowUnknown=target.checked;
  if(target.dataset.control==='wheel-target')wheelTarget=target.value;
  refresh(true);
});
function setPanelOpen(open){
  collapsed=!open;
  body.hidden=collapsed;
  shadow.querySelector('.panel').hidden=collapsed;
  shadow.querySelector('.launcher').hidden=!collapsed;
  host.style.width=collapsed?'106px':'470px';
  if(open){
    // Reconnect on every open, even if another event was selected or JSON was loaded previously.
    manual=null;follow=true;showClaimed=false;lastAutoId=null;previewEvent=null;lastSignature='';uiMessage='';
    refresh(true);
    body.scrollTop=0;
  }
}
shadow.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='open'){setPanelOpen(true);return;}
  if(action==='collapse'){setPanelOpen(false);return;}
  if(action==='refresh'){lastSignature='';refresh(true);}
  if(action==='idb')readDatabase();
  if(action==='live'){manual=null;uiMessage='已恢复自动读取。';lastAutoId=null;refresh(true);}
  if(action==='import'){
    try{manual=JSON.parse(shadow.querySelector('[data-input]').value);PREDICTOR.predict(manual);uiMessage='已载入手动数据。';selectedId=null;lastAutoId=null;previewEvent=null;refresh(true);}
    catch(e){manual=null;uiMessage='JSON 无法用于预测：'+e.message;refresh(true);}
  }
  if(action==='diagnostics'){
    const target=shadow.querySelector('[data-diagnostics]');
    target.textContent=JSON.stringify({script:USERSCRIPT_VERSION,build:detectedBuild,expectedBuild:EXPECTED_BUILD,
      source:snapshot?.kind||null,eventCount:snapshot?.events.length||0,hasCards:snapshot?.cards!==undefined,
      wheelProgressKnown:Array.isArray(snapshot?.progress),lastMessage:uiMessage});
  }
});
const header=shadow.querySelector('header');
header.addEventListener('pointerdown',event=>{
  if(event.target.closest('button')||event.button!==0)return;
  const box=host.getBoundingClientRect();drag={x:event.clientX,y:event.clientY,left:box.left,top:box.top};
  header.setPointerCapture(event.pointerId);
});
header.addEventListener('pointermove',event=>{
  if(!drag)return;
  host.style.left=Math.max(5,Math.min(innerWidth-host.offsetWidth-5,drag.left+event.clientX-drag.x))+'px';
  host.style.top=Math.max(5,Math.min(innerHeight-40,drag.top+event.clientY-drag.y))+'px';
  host.style.bottom='auto';host.style.right='auto';
});
header.addEventListener('pointerup',()=>{drag=null;});header.addEventListener('pointercancel',()=>{drag=null;});
const timer=setInterval(()=>{if(!document.hidden&&!collapsed)refresh();},900);
function onFocus(){if(!collapsed)refresh(true);}window.addEventListener('focus',onFocus);
window[INSTANCE]={version:USERSCRIPT_VERSION,refresh:()=>refresh(true),destroy(){disposed=true;clearInterval(timer);window.removeEventListener('focus',onFocus);host.remove();delete window[INSTANCE];}};

})();
