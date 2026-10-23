const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadPlaywright,browserLaunchOptions,rootPath,outputPath}=require('../helpers/browser.cjs');
const {chromium}=loadPlaywright();
const r=require('../../src/rules/impossible-rules.cjs');
const allCards=require('../helpers/cards.cjs');
const p=require('../../src/core/predict-event.cjs');
const userScript=fs.readFileSync(rootPath('dist/goc-impossible-predictor.user.js'),'utf8');
const example=require('../../examples/event.json');
const event={id:'demo-event',label:'示例 Impossible 事件',source:'coin',probability:r.IMPOSSIBLE_THRESHOLD_PERCENT/32,
  seed:example.seed,seedVersion:1,chain:null};
const trophyEvents=[3,4,5,6].map(level=>({...event,id:'unlock-'+level,chain:{settled:true,claimed:true,level}}));
const state={impossibleEvents:[...trophyEvents,event],impossibleCards:{},impossibleSpinCurrency:0,
  activeImpossibleEvent:event,impossibleWheelProgress:r.WHEEL_SOURCES.map((source,index)=>({source,index,eligible:true,unlocked:true,actions:50000}))};
const fixture=fs.readFileSync(rootPath('tests/fixtures/game-page.html'),'utf8');
async function attach(page,initial){
  await page.evaluate(value=>{
    window.__calls=0;window.__storageWrites=0;window.__idbWrites=0;
    const freeze=x=>{if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
    const prepare=v=>({...freeze(v),flipImpossibleChain(){window.__calls++;throw new Error('Game action called');}});
    const provider={memoizedProps:{value:prepare(value)},child:null};
    const root={stateNode:{current:null},child:provider};root.stateNode.current=root;
    document.getElementById('root')['__reactContainer$fixture']=root;
    window.__test={setContext(v){provider.memoizedProps={value:prepare(v)};},setWheel(removed){
      provider.child={memoizedProps:{removed,available:Array.from({length:11},(_,i)=>i),isSpinning:false,onToggleRemoved(){window.__calls++;}}};
    },setPreview(event){provider.child=event?{memoizedProps:{event,onStart(){window.__calls++;},onDismiss(){window.__calls++;}}}:null;
    },detach(){delete document.getElementById('root')['__reactContainer$fixture'];}};
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(...args){window.__storageWrites++;return original.apply(this,args);};
    const transaction=IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction=function(...args){if(args[1]&&args[1]!=='readonly')window.__idbWrites++;return transaction.apply(this,args);};
  },initial);
  await page.addScriptTag({content:userScript});
}
(async()=>{
  const browser=await chromium.launch(browserLaunchOptions(chromium));
  const context=await browser.newContext({viewport:{width:1260,height:1050}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let requests=0;
  await context.route('**/*',async route=>{requests++;await route.fulfill({status:200,contentType:'text/html',body:fixture});});
  try{
    await page.goto('https://gameofchance.xyz/');
    const otherEvent={...event,id:'other-event',label:'另一个事件',seed:r.encodeSeed(1)};
    await attach(page,{...state,activeImpossibleEvent:null,impossibleEvents:[...state.impossibleEvents,otherEvent]});
    const panel=page.locator('#goc-impossible-predictor');
    const text=()=>panel.locator('.body').innerText();
    const openTools=async()=>{await panel.locator('[data-import]').evaluate(el=>el.open=true);};
    assert.equal(await panel.locator('.panel').isVisible(),false);
    assert.equal(await panel.locator('.launcher').isVisible(),true);
    assert.ok((await panel.boundingBox()).width<=110);
    await page.evaluate(value=>window.__test.setContext(value),{...state,impossibleEvents:[...state.impossibleEvents,otherEvent]});
    await panel.locator('[data-action="open"]').click();
    await panel.locator('.outcome').waitFor();
    assert.equal(await panel.locator('[data-control="event"]').inputValue(),event.id);
    assert.equal(await panel.locator('[data-import]').evaluate(el=>el.open),false);
    assert.match(await text(),/第 7 轮失败 · 最终 Lvl 11/);
    assert.match(await text(),/来源：Coins · 转盘结果：Lottery/);
    assert.equal(await panel.locator('[data-game]').count(),4);
    assert.deepEqual(await panel.locator('[data-game] td:nth-child(2) > strong').allTextContents(),['860','870','857','680']);
    assert.ok((await panel.locator('[data-game] td:nth-child(2)').allTextContents()).every(t=>t.includes('再玩 6 轮后结算')));
    assert.ok((await panel.locator('[data-game] td:nth-child(3)').allTextContents()).every(t=>t.includes('有')&&t.includes('现在结算')));
    assert.doesNotMatch(await text(),/seed |Stackjelly|Coin IV/);
    assert.equal(await panel.locator('[data-branch]').count(),0);
    await panel.locator('[data-control="wheel-target"]').selectOption('dart');
    assert.match(await panel.locator('.wheel-plan').innerText(),/Coins、Dice/);
    assert.match(await text(),/2 token，当前 0/);
    await panel.locator('[data-control="wheel-target"]').selectOption('lottery');
    assert.match(await panel.locator('.wheel-plan').innerText(),/不用关闭/);
    await panel.locator('[data-control="wheel-target"]').selectOption('roulette');
    assert.match(await panel.locator('.wheel-plan').innerText(),/最少关闭：Lottery/);
    // Existing game wheel selections must not alter the explicitly labelled default currency.
    await page.evaluate(()=>{window.__test.setWheel([0,1]);window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();});
    assert.match(await panel.locator('.currencies').innerText(),/转盘结果：Lottery/);
    await panel.locator('[data-action="collapse"]').click();
    await page.evaluate(value=>{window.__test.setContext(value.state);window.__test.setPreview(value.event);},
      {state:{...state,activeImpossibleEvent:null,impossibleEvents:[...state.impossibleEvents,otherEvent]},event});
    await panel.locator('[data-action="open"]').click();
    assert.equal(await panel.locator('[data-control="event"]').inputValue(),event.id);
    await openTools();await panel.locator('[data-events]').evaluate(el=>el.open=true);
    await panel.locator('[data-control="event"]').selectOption(otherEvent.id);
    assert.equal(await panel.locator('[data-control="follow"]').isChecked(),false);
    await panel.locator('[data-action="collapse"]').click();
    await page.evaluate(value=>{window.__test.setPreview(null);window.__test.setContext(value);},state);
    await panel.locator('[data-action="open"]').click();
    assert.equal(await panel.locator('[data-control="event"]').inputValue(),event.id);
    assert.equal(await panel.locator('[data-control="follow"]').isChecked(),true);
    const fullCollection=Object.fromEntries(allCards.map(card=>[card.id,1]));
    await page.evaluate(value=>{window.__test.setContext(value);window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();},{...state,impossibleCards:fullCollection});
    assert.deepEqual(await panel.locator('[data-game] td:nth-child(3)').allTextContents(),['无','无','无','无']);
    const chain=p.replayTurn(r.createChain({source:'coin',game:'deal',seed:example.seed,probability:event.probability})).chain;
    const updated={...event,chain};
    await page.evaluate(value=>{window.__test.setContext(value);window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();},
      {...state,impossibleEvents:[...trophyEvents,updated],activeImpossibleEvent:updated});
    assert.equal(await panel.locator('[data-game]').count(),1);
    assert.match(await panel.locator('[data-game="deal"]').innerText(),/870.*再玩 5 轮后结算/s);
    assert.match(await panel.locator('.outcome').innerText(),/第 7 轮失败/);
    await page.evaluate(()=>{document.scripts[0].src='/assets/index-unknown.js';window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();});
    assert.equal(await panel.locator('[data-game]').count(),0);
    await panel.locator('[data-control="allow"]').check();
    assert.equal(await panel.locator('[data-game]').count(),1);
    await page.evaluate(()=>{document.scripts[0].src='/assets/index-kVDE62Ka.js';window.__test.setContext({
      impossibleEvents:[],impossibleCards:{},impossibleSpinCurrency:0,activeImpossibleEvent:null,impossibleWheelProgress:[]
    });window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();});
    assert.match(await text(),/没有可预测的事件/);
    await openTools();
    await panel.locator('[data-input]').fill(JSON.stringify({seed:example.seed,startLevel:5}));
    await panel.locator('[data-action="import"]').click();
    assert.match(await text(),/手动数据/);
    assert.match(await text(),/待读取收藏/);
    assert.match(await text(),/需读取可用币种/);
    const hostile={...event,id:'hostile',label:'<img src=x onerror="window.__calls++">'};
    await page.evaluate(value=>window.__test.setContext(value),{...state,impossibleEvents:[hostile],activeImpossibleEvent:hostile});
    await panel.locator('[data-action="live"]').click();
    assert.equal(await panel.locator('img').count(),0);
    assert.match(await panel.locator('.event').innerText(),/<img src=x/);
    await page.evaluate(value=>{window.__test.setContext(value);window.__test.setWheel([]);window.__GOC_IMPOSSIBLE_PREDICTOR_V1__.refresh();},state);
    await panel.locator('[data-control="wheel-target"]').selectOption('dart');
    await panel.locator('[data-import]').evaluate(el=>el.open=false);
    await panel.locator('.body').evaluate(el=>el.scrollTop=0);
    await panel.screenshot({path:outputPath('screenshots/panel-preview.png')});
    const before=await page.evaluate(()=>({calls:window.__calls,storage:window.__storageWrites,idb:window.__idbWrites}));
    assert.deepEqual(before,{calls:0,storage:0,idb:0});
    await page.evaluate(async ({events,sources})=>{
      const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('gameofchance',1);
        req.onupgradeneeded=()=>req.result.createObjectStore('keyval');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      await new Promise((resolve,reject)=>{const tx=db.transaction('keyval','readwrite'),store=tx.objectStore('keyval');
        store.put({impossibleChainState:{events,cards:{},spinCurrency:0,activeEventId:'demo-event'},
          unlockedGames:Object.fromEntries(sources.map(s=>[s,true]))},'goc_game_state');
        for(const source of sources)store.put({totalActions:50000},'stats_'+source);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();window.__idbWrites=0;window.__test.detach();
    },{events:state.impossibleEvents,sources:r.WHEEL_SOURCES});
    await openTools();await panel.locator('[data-action="idb"]').click();
    await panel.locator('.body > .amber').filter({hasText:'存档快照'}).waitFor();
    assert.equal(await panel.locator('[data-game]').count(),4);
    assert.deepEqual(await page.evaluate(()=>({calls:window.__calls,storage:window.__storageWrites,idb:window.__idbWrites})),before);
    await panel.locator('[data-action="collapse"]').click();
    assert.equal(await panel.locator('.body').isVisible(),false);
    await panel.locator('[data-action="open"]').click();
    assert.equal(await panel.locator('.body').isVisible(),true);
    assert.deepEqual(errors,[]);assert.equal(requests,1);
    const emptyContext=await browser.newContext({viewport:{width:390,height:844}});
    await emptyContext.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
    const emptyPage=await emptyContext.newPage();await emptyPage.goto('https://gameofchance.xyz/');
    await attach(emptyPage,{impossibleEvents:[],impossibleCards:{},impossibleWheelProgress:[]});
    await emptyPage.locator('#goc-impossible-predictor [data-action="open"]').click();
    await emptyPage.evaluate(()=>{window.__listDatabases=indexedDB.databases.bind(indexedDB);indexedDB.databases=undefined;});
    const emptyPanel=emptyPage.locator('#goc-impossible-predictor');
    await emptyPanel.locator('[data-import]').evaluate(el=>el.open=true);
    await emptyPanel.locator('[data-action="idb"]').click();
    await emptyPanel.getByText('备用读取：',{exact:false}).waitFor();
    assert.deepEqual(await emptyPage.evaluate(()=>window.__listDatabases()),[]);
    assert.equal(await emptyPage.evaluate(()=>window.__idbWrites),0);
    const bounds=await emptyPanel.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
    await emptyContext.close();
    const report={browser:'Chromium, isolated headless profile',scriptVersion:require(rootPath('package.json')).version,
      tested:['compact failure-round/final-level summary','default direct and wheel currencies',
        'maximum Mega with precise stop instructions','new-card availability across all stop points',
        'minimum wheel removal per target','collapsed launch and current-event following',
        'React progress updates','version gate','unknown inputs','HTML escaping',
        'readonly IndexedDB and no creation of missing database','mobile width'],
      gameActions:0,gameStorageWrites:0,userscriptNetworkRequests:0,pageErrors:errors};
    fs.writeFileSync(outputPath('reports/browser.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
