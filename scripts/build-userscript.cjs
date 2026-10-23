const fs=require('node:fs');
const {rootPath}=require('./lib/paths.cjs');
const {version}=require(rootPath('package.json'));
const rules=fs.readFileSync(rootPath('src/generated/impossible-rules.cjs'),'utf8');
const predictor=fs.readFileSync(rootPath('src/core/predict-event.cjs'),'utf8')
  .replace("const fs = require('node:fs');",'')
  .replace("const r = require('../generated/impossible-rules.cjs');",'const r = RULES;')
  .split('if(require.main===module)')[0];
const ui=fs.readFileSync(rootPath('src/userscript/ui.js'),'utf8');
const summary=fs.readFileSync(rootPath('src/core/prediction-summary.cjs'),'utf8')
  .replace("const r=require('../generated/impossible-rules.cjs');",'const r=RULES;');
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
fs.writeFileSync(rootPath('dist/goc-impossible-predictor.user.js'),header+"(()=>{'use strict';\n"+'const USERSCRIPT_VERSION='+JSON.stringify(version)+';\n'+wrap('RULES',rules)+wrap('PREDICTOR',predictor)+wrap('SUMMARY',summary)+ui+'\n})();\n');
console.log('Built dist/goc-impossible-predictor.user.js');
