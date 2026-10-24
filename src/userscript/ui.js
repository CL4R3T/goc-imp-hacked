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
let detectedBuild=null,previewEvent=null,lastVisibleEventId=null,panelPosition=null;
const host=document.createElement('div');
host.id=HOST_ID;
host.style.cssText='display:none;position:fixed;right:18px;bottom:18px;z-index:2147483646;width:106px;max-width:calc(100vw - 20px);font:13px system-ui,sans-serif;color-scheme:dark;';
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
.outcome{font-size:15px;margin:5px 0}.currencies{margin-bottom:10px}.wheel-summary{border-top:1px solid #303747;padding-top:10px;margin-top:9px}.wheel-summary select{width:auto;flex:1}.game-summary{table-layout:fixed}.game-summary th:first-child{width:16%}.game-summary th:nth-child(2){width:31%}.game-summary td{padding:8px 4px;overflow-wrap:anywhere}.game-summary .tiny{line-height:1.55}.new-card{margin-top:7px}.new-card+.new-card{border-top:1px solid #303747;padding-top:7px}

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
function newCardHtml(card,complete){
  if(card.status==='available'||card.status==='already_new'){
    const cards=card.cards.map(item=>{
      const source=item.targetSource||item.source;
      const target=source==='global'?'全模式':SOURCE_NAMES[source]||source;
      return '<div class="new-card" data-card="'+esc(item.id)+'"><div class="tiny good">'+esc(target)+' 加速 +'+esc(item.percent)+'%</div><div class="tiny">最高 <strong class="amber mono">'+number(item.maxMegas)+'</strong> Mega</div><div class="tiny muted">'+esc(item.operation)+'</div></div>';
    }).join('');
    return (card.status==='already_new'?'<span class="good">已获新卡</span>':'')+(!complete?'<div class="tiny amber">（仅模拟范围内）</div>':'')+cards;
  }
  if(card.status==='already_duplicate')return '<span class="muted">已获重复卡</span>';
  if(card.status==='none')return '<span class="muted">无</span>';
  return '<span class="amber tiny">待读取收藏</span>';
}
function gamesHtml(result,counts){
  const rows=result.branches.map(branch=>{
    const info=SUMMARY.summarizeBranch(branch);
    const locked=snapshot?.kind!=='manual'&&!RULES.isMinigameUnlocked(branch.game,counts);
    return '<tr data-game="'+branch.game+'"><td><strong>'+esc(GAME_NAMES[branch.game])+'</strong>'+(locked?'<div class="tiny muted">未解锁</div>':'')+'</td><td><strong class="amber mono">'+number(info.maxMegas)+'</strong>'+(info.complete?'':'<span class="tiny amber">（仅模拟范围内）</span>')+'<div class="tiny muted">'+esc(info.operation)+'</div></td><td>'+newCardHtml(info.newCard,info.complete)+'</td></tr>';
  }).join('');
  return '<table class="game-summary"><thead><tr><th>小游戏</th><th>最多 Mega / 结算方式</th><th>新卡加成 / 最高 Mega / 结算方式</th></tr></thead><tbody>'+rows+'</tbody></table>';
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
  let live=null;
  previewEvent=null;
  try{live=findLive();state=manual?manualSnapshot(manual):live||dbSnapshot;}catch(e){error=e.message;}
  // Observe live event transitions even while collapsed; saved events do not open the UI.
  const visibleEventId=live?(previewEvent?.id||live.activeId):null;
  const newlyOpened=visibleEventId&&visibleEventId!==lastVisibleEventId;
  const eventClosed=live&&!visibleEventId&&lastVisibleEventId;
  // A missing live connection alone is not evidence that the player exited the event.
  if(live)lastVisibleEventId=visibleEventId;
  if(newlyOpened){setPanelOpen(true);return;}
  if(eventClosed&&!collapsed){setPanelOpen(false);return;}
  if(collapsed)return;
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
  if(!open&&!collapsed){
    panelPosition={left:host.style.left,top:host.style.top,right:host.style.right,bottom:host.style.bottom};
    drag=null;
  }
  if(!open||collapsed)Object.assign(host.style,open&&panelPosition?panelPosition:{left:'auto',top:'auto',right:'18px',bottom:'18px'});
  collapsed=!open;
  host.style.display='';
  body.hidden=collapsed;
  shadow.querySelector('.panel').hidden=collapsed;
  shadow.querySelector('.launcher').hidden=!collapsed;
  host.style.width=collapsed?'106px':'600px';
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
const timer=setInterval(()=>{if(!document.hidden)refresh();},900);
function onFocus(){refresh(true);}window.addEventListener('focus',onFocus);
window[INSTANCE]={version:USERSCRIPT_VERSION,refresh:()=>refresh(true),destroy(){disposed=true;clearInterval(timer);window.removeEventListener('focus',onFocus);host.remove();delete window[INSTANCE];}};
refresh();
