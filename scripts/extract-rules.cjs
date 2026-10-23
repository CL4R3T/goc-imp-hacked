// Extract only statically referenced declarations; never execute the browser bundle.
const fs = require('node:fs');
const crypto = require('node:crypto');
const {rootPath}=require('./lib/paths.cjs');
const babel = require('./lib/runtime.cjs').loadBabel();
const source = fs.readFileSync(rootPath('samples/upstream/index-kVDE62Ka.js'), 'utf8');
const ast = babel.babelParse(source, 'index.js', true);
const names = {
  vx:'IMPOSSIBLE_THRESHOLD_PERCENT', bo:'isImpossibleProbability', bP:'startingLevel', Lf:'baseMegas',
  l6:'totalMegas', w7:'accumulatedBonus', Vee:'createChain', Jee:'startOrResumeEvent', Xee:'resolveCall',
  Zee:'settleChain', jh:'applyBonus', Iee:'refreshBoard', jx:'createBoard', Nx:'createImpossibleEvent',
  Z8:'readEventSeed', i6:'createSeed', S3:'encodeSeed', C5:'isEncodedSeed', o6:'seededRandom',
  yee:'outcomeRandom', xee:'minigameRandom', kx:'boardRandom', wee:'cardRandom', Cee:'wheelRandom',
  vQ:'plinkoRows', TQ:'createBucketValues', PQ:'plinkoPathForFace', FQ:'countRightSteps',
  RQ:'bucketShowsChance', GQ:'dealHandSize', UQ:'redMinusBlack', qQ:'dealForFace', YQ:'dealBonus',
  tee:'SLOT_PAYLINES', lP:'SLOT_SYMBOL_WEIGHTS', see:'slotGridForWin', nee:'slotEffect', ree:'slotBonus',
  mP:'slotLineSymbols', aee:'hasSlotLine', Ff:'randomSlotSymbol',
  C7:'MINIGAMES', Tee:'isMinigameUnlocked', Cme:'newUnlocksAtLevel', Fee:'isWheelUnlocked',
  BS:'wheelEligibility', sP:'filterWheelSegments', LQ:'chooseWheelSegment', s6:'WHEEL_SOURCES',
  Qee:'canSpinWheel', e0e:'recordWheelSpin', t0e:'markClaimed', _x:'payoutSource', a0e:'payout',
  vn:'CARD_DECKS', cw:'ORDINARY_CARD_ART', UF:'DECK_SHINIES', y6:'UNIQUE_SHINIES',
  V3:'ALL_CARDS', R5:'cardById', YF:'cardSpeedPercent', WF:'duplicateTokens',
  Jse:'rewardPool', Xse:'drawCardId', Qse:'drawCard', HF:'ordinaryCardBand', CP:'shinyTier',
  gj:'shinyPoolAtTier', qF:'selectShinyPool', Gse:'CARD_SPEED_CAP',
};
let scope;
babel.traverse(ast, {Program(path) { scope = path.scope; path.stop(); }});
const selected = new Map();
function include(name) {
  if (selected.has(name)) return;
  const binding = scope.getBinding(name);
  if (!binding || binding.kind === 'module') throw new Error('External dependency: ' + name);
  const path = binding.path;
  if (!path.isVariableDeclarator() && !path.isFunctionDeclaration()) throw new Error('Unsupported: ' + name);
  selected.set(name, path);
  path.traverse({ReferencedIdentifier(ref) {
    const dependency = ref.scope.getBinding(ref.node.name);
    if (dependency && dependency.scope === scope) include(ref.node.name);
  }});
}
Object.keys(names).forEach(include);
const declarations = [...selected.entries()].sort((a,b)=>a[1].node.start-b[1].node.start).map(([name,path])=>{
  const raw = source.slice(path.node.start,path.node.end);
  return '// Original symbol: ' + name + '\n' + (path.isVariableDeclarator() ? path.parent.kind + ' ' + raw + ';' : raw);
}).join('\n\n');
const exportsText = '\nmodule.exports = {' + Object.entries(names).map(([before,after])=>after+':'+before).join(',') + '};\n';
const pluginPath = rootPath('scripts/lib/rename-plugin.cjs');
const output = babel.babelTransform(declarations + exportsText, 'rules.js', false, [[pluginPath, {names}]], []);
const sha = crypto.createHash('sha256').update(source).digest('hex');
fs.mkdirSync(rootPath('src/generated'),{recursive:true});
fs.writeFileSync(rootPath('src/generated/impossible-rules.cjs'), '// Extracted from index-kVDE62Ka.js; SHA256 ' + sha + '\n// Top-level rule symbols renamed; original behavior preserved. No application bootstrap.\n' + output.code.replace(/\n\/\/# sourceMappingURL=.*$/s, '') + '\n');
fs.writeFileSync(rootPath('src/generated/symbol-map.json'), JSON.stringify(names,null,2)+'\n');
console.log('Extracted ' + selected.size + ' declarations, ' + Object.keys(names).length + ' named entry points.');
