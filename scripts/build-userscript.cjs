const fs=require('node:fs');
const path=require('node:path');
const rootPath=(...parts)=>path.join(__dirname,'..',...parts);
const {version}=require(rootPath('package.json'));
const read=file=>fs.readFileSync(rootPath(file),'utf8');
function browserModule(file){
  const source=read(file);
  const dependency=/const r\s*=\s*require\((['"])\.\.\/rules\/impossible-rules\.cjs\1\);/g;
  if([...source.matchAll(dependency)].length!==1)throw new Error('Rule import needs review: '+file);
  return source.replace(dependency,'const r=RULES;');
}
const rules=read('src/rules/impossible-rules.cjs');
const predictor=browserModule('src/core/predict-event.cjs');
const summary=browserModule('src/core/prediction-summary.cjs');
const ui=read('src/userscript/ui.js');
const header=`// ==UserScript==
// @name         Game of Chance · Impossible 预测面板
// @namespace    local.goc.impossible-predictor
// @version      ${version}
// @description  本地读取 Impossible 状态，预测逐局收益、抽卡及货币转盘；不修改游戏存档。
// @match        https://gameofchance.xyz/*
// @match        https://*.gameofchance.xyz/*
// @match        https://gameofchance.pages.dev/*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==

`;
const wrap=(name,source)=>`const ${name}=(()=>{const module={exports:{}};\n${source}\nreturn module.exports;})();\n`;
fs.mkdirSync(rootPath('dist'),{recursive:true});
const script=header+"(()=>{'use strict';\n"+'const USERSCRIPT_VERSION='+JSON.stringify(version)+';\n'+wrap('RULES',rules)+wrap('PREDICTOR',predictor)+wrap('SUMMARY',summary)+ui+'\n})();\n';
fs.writeFileSync(rootPath('dist/goc-impossible-predictor.user.js'),script);
console.log('Built dist/goc-impossible-predictor.user.js');
