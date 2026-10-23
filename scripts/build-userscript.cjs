const fs=require('node:fs');
const {rootPath,outputPath}=require('./lib/paths.cjs');
const {loadBrowserSources}=require('./lib/browser-sources.cjs');
const {buildRuntimeRules}=require('./lib/runtime-rules.cjs');
const {version}=require(rootPath('package.json'));
const sources=loadBrowserSources();
const {predictor,summary,ui}=sources;
const {code:rules,report}=buildRuntimeRules(sources);
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
fs.writeFileSync(outputPath('reports/bundle.json'),JSON.stringify({...report,version,scriptBytes:Buffer.byteLength(script)},null,2)+'\n');
console.log('Built dist/goc-impossible-predictor.user.js');
