// Impossible prediction rules.
"use strict";

// Verified against the downloaded bundles on 2026-10-27; prediction rules match.
const SUPPORTED_BUILDS = Object.freeze(['index-BYtwn7Gy.js', 'index-kVDE62Ka.js']);

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
  "SUPPORTED_BUILDS": SUPPORTED_BUILDS,
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
