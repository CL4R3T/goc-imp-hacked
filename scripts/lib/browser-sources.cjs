const fs=require('node:fs');
const {rootPath}=require('./paths.cjs');

function replaceOnce(source,before,after){
  if(source.split(before).length!==2)throw new Error('Browser adapter needs review: '+before);
  return source.replace(before,after);
}
function loadBrowserSources(){
  let predictor=fs.readFileSync(rootPath('src/core/predict-event.cjs'),'utf8');
  predictor=replaceOnce(predictor,"const fs = require('node:fs');",'');
  predictor=replaceOnce(predictor,"const r = require('../generated/impossible-rules.cjs');",'const r = RULES;');
  const cliMarker='if(require.main===module)';
  if(predictor.split(cliMarker).length!==2)throw new Error('Predictor CLI boundary needs review.');
  predictor=predictor.split(cliMarker)[0];
  const summary=replaceOnce(fs.readFileSync(rootPath('src/core/prediction-summary.cjs'),'utf8'),
    "const r=require('../generated/impossible-rules.cjs');",'const r=RULES;');
  return {predictor,summary,ui:fs.readFileSync(rootPath('src/userscript/ui.js'),'utf8')};
}
module.exports={loadBrowserSources};
