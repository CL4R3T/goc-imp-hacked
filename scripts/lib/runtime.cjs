const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {ROOT}=require('./paths.cjs');

function playwrightDirectory(){
  if(process.env.PLAYWRIGHT_MODULE_PATH){
    const target=path.resolve(process.env.PLAYWRIGHT_MODULE_PATH);
    return fs.statSync(target).isDirectory()?target:path.dirname(target);
  }
  try{return path.dirname(require.resolve('playwright',{paths:[ROOT]}));}catch{}
  const bundled=path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','playwright');
  if(fs.existsSync(path.join(bundled,'package.json')))return bundled;
  throw new Error('Playwright is unavailable. Run npm install, or set PLAYWRIGHT_MODULE_PATH.');
}
function loadPlaywright(){return require(playwrightDirectory());}
function loadBabel(){
  return require(process.env.CODEX_BABEL_BUNDLE||path.join(playwrightDirectory(),'lib','transform','babelBundle.js'));
}
function browserLaunchOptions(chromium){
  if(process.env.BROWSER_EXECUTABLE_PATH)return {headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH};
  const candidates=[
    chromium.executablePath(),
    process.env.PROGRAMFILES&&path.join(process.env.PROGRAMFILES,'Google','Chrome','Application','chrome.exe'),
    process.env['PROGRAMFILES(X86)']&&path.join(process.env['PROGRAMFILES(X86)'],'Microsoft','Edge','Application','msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome',
  ].filter(Boolean);
  const executablePath=candidates.find(candidate=>fs.existsSync(candidate));
  if(!executablePath)throw new Error('No browser found. Run npx playwright install chromium, or set BROWSER_EXECUTABLE_PATH.');
  return {headless:true,executablePath};
}
module.exports={loadPlaywright,loadBabel,browserLaunchOptions};
