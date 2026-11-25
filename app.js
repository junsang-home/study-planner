
{
const DAYS=['월','화','수','목','금','토','일'];
const DC=['#f08a5d','#e0a800','#4cb050','#119e86','#3b8ee0','#5a74e6','#e84b5a'];
const CATS={read:['독서','#14a085'],eng:['영어','#5a5fd6'],math:['수학','#e8702e'],write:['쓰기/한자','#d94f7c'],art:['예체능','#a259c4'],etc:['기타','#7b8794']};
const CK='<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const all=[0,1,2,3,4,5,6],wd=[0,1,2,3,4];
function blank(){return {tasks:[],events:[],checks:{}}}
const lsg=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lss=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const qs=new URLSearchParams(location.search);
let FID=qs.get('f')||lsg('kp-f'),MODE=qs.get('f')?(qs.get('m')==='kid'?'kid':'parent'):(lsg('kp-m')||'parent');
if(FID&&!/^[a-z0-9]{20,40}$/.test(FID))FID=null;
if(FID){lss('kp-f',FID);lss('kp-m',MODE);if(!qs.get('f'))history.replaceState(null,'',location.pathname+'?f='+FID+(MODE==='kid'?'&m=kid':'')+location.hash)}
let S=null;
try{S=JSON.parse(lsg('kp-cache-'+FID))}catch(e){}
if(!S||!Array.isArray(S.tasks))S=blank();
function mig(){for(const e of S.events){if(!e.slots){e.slots={};(e.days||[]).forEach(i=>e.slots[i]={start:e.start||'',end:e.end||''});delete e.days}e.dates=e.dates||{};e.mode=e.mode||'weekly';e.start=e.start||'15:00';e.end=e.end||'16:00'}}
mig();
const VIEWS=()=>MODE==='kid'?['today','week','schedule','month']:['week','today','schedule','month','edit'];
let view=VIEWS().includes(location.hash.slice(1))?location.hash.slice(1):(MODE==='kid'?'today':(S.tasks.length||S.events.length?'week':'edit'));
let off=0,moff=0,firstWeek=true;
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const dow=d=>(d.getDay()+6)%7;
function monday(o){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-dow(d)+o*7);return d}
function dayDate(o,i){const d=monday(o);d.setDate(d.getDate()+i);return d}
const md=d=>(d.getMonth()+1)+'/'+d.getDate();
const tasksOf=i=>S.tasks.filter(t=>t.days.includes(i)&&t.name.trim());
const EC=['#e8702e','#5a5fd6','#14a085','#d94f7c','#a259c4','#3b8ee0','#e0a800','#7b8794'];
const evsOn=(o,i)=>evsD(dayDate(o,i));
const evsD=d=>{const k=key(d),i=dow(d),r=[];for(const [x,e] of S.events.entries()){if(!e.name.trim())continue;const s=e.mode==='dates'?e.dates[k]:e.slots[i];if(s)r.push({name:e.name,start:s.start||'',end:s.end||'',once:e.mode==='dates',c:EC[x%EC.length]})}return r.sort((a,b)=>a.start.localeCompare(b.start))};
const fmtD=k=>{const d=new Date(k+'T00:00');return isNaN(d)?k:`${d.getFullYear()}. ${md(d)} (${DAYS[dow(d)]})`};
const slotTxt=e=>`<time>${esc(e.start)}${e.end?' ~ '+esc(e.end):''}</time><span>${esc(e.name)}${e.once?' <em class="tag">비정기</em>':''}</span>`;
const isOn=(k,id)=>!!(S.checks[k]&&S.checks[k][id]);
function statD(d){const k=key(d),ts=tasksOf(dow(d)),n=ts.filter(t=>isOn(k,t.id)).length;return {k,ts,n,all:ts.length&&n===ts.length}}
function stat(o,i){const k=key(dayDate(o,i)),ts=tasksOf(i),n=ts.filter(t=>isOn(k,t.id)).length;return {k,ts,n,all:ts.length&&n===ts.length}}
const FB='https://www.gstatic.com/firebasejs/10.12.2/';
let ref=null,F=null,pendingPlan=false,planTimer=null,deferred=false;
const cache=()=>{if(FID)lss('kp-cache-'+FID,JSON.stringify(S))};
const syncTxt=t=>{const el=$('sync');if(el)el.textContent=t};
function save(){cache();pendingPlan=true;clearTimeout(planTimer);syncTxt('저장 중');
  planTimer=setTimeout(()=>{if(!ref){pendingPlan=false;return}F.updateDoc(ref,{tasks:S.tasks,events:S.events}).then(()=>{pendingPlan=false;syncTxt('저장됨, 실시간 공유 중')}).catch(()=>{pendingPlan=false;syncTxt('저장 실패, 연결 확인 필요')})},700)}
function saveCheck(k,id,on){cache();if(ref)F.updateDoc(ref,new F.FieldPath('checks',k,id),on?true:F.deleteField()).catch(()=>syncTxt('저장 실패, 연결 확인 필요'))}
function liveRender(){const ae=document.activeElement;if(view==='edit'&&ae&&$('view').contains(ae)&&/INPUT|SELECT/.test(ae.tagName)){deferred=true;return}render()}
document.addEventListener('focusout',()=>{if(deferred)setTimeout(()=>{const ae=document.activeElement;if(!(ae&&/INPUT|SELECT/.test(ae.tagName))){deferred=false;render()}},50)});
async function connect(){
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.apiKey||/여기/.test(cfg.apiKey)){syncTxt('config.js에 Firebase 설정을 넣어야 공유됨');return}
  syncTxt('연결 중');
  try{
    const [A,B,C]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js'),import(FB+'firebase-firestore.js')]);F=C;
    const app=A.initializeApp(cfg);await B.signInAnonymously(B.getAuth(app));
    let db;try{db=C.initializeFirestore(app,{localCache:C.persistentLocalCache()})}catch(e){db=C.getFirestore(app)}
    ref=C.doc(db,'families',FID);
    const snap=await C.getDoc(ref);
    if(!snap.exists())await C.setDoc(ref,{tasks:S.tasks,events:S.events,checks:S.checks,created:Date.now()});
    C.onSnapshot(ref,s=>{const d=s.data();if(!d)return;if(!pendingPlan){S.tasks=d.tasks||[];S.events=d.events||[];mig()}S.checks=d.checks||{};cache();liveRender();
      syncTxt(s.metadata.fromCache?'오프라인 상태 (연결되면 자동 저장)':'실시간 공유 중'+(MODE==='kid'?' (아이 모드)':''))},()=>syncTxt('연결 실패. 가족 링크와 Firebase 규칙 확인 필요'));
  }catch(e){console.warn(e);syncTxt('연결 실패. config.js와 Firebase 설정 확인 필요')}
}
function newCode(){const a=new Uint8Array(24);crypto.getRandomValues(a);return Array.from(a,x=>'abcdefghijkmnpqrstuvwxyz23456789'[x%32]).join('')}
function setFamily(f,m){FID=f;MODE=m;lss('kp-f',f);lss('kp-m',m);S=blank();try{S=JSON.parse(lsg('kp-cache-'+f))||S}catch(e){}
  history.replaceState(null,'',location.pathname+'?f='+f+(m==='kid'?'&m=kid':''));view=m==='kid'?'today':'edit';render();connect()}
const urlFor=m=>location.origin+location.pathname+'?f='+FID+(m==='kid'?'&m=kid':'');
function rSetup(){
  $('view').innerHTML=`<div class="panel" style="max-width:560px"><h2>처음 설정</h2>
  <p>이 기기가 부모님 기기라면 새 가족 계획표를 만들기. 아이 기기는 부모님 화면의 QR이나 아이용 링크로 열기.</p>
  <div class="row-btns"><button class="btn pri" data-act="newfam">새 가족 계획표 만들기</button></div>
  <h2>이미 만든 계획표가 있을 때</h2><p class="note" style="margin:0 0 8px">부모님 화면의 편집 탭, 가족과 공유에 있는 가족 코드 입력</p>
  <div class="line"><input type="text" id="code" placeholder="가족 코드" autocomplete="off" style="flex:1 1 220px;min-height:44px;font-size:16px;padding:0 12px;border:2px solid var(--line);border-radius:10px;background:var(--paper)"><button class="btn" data-act="joinfam">연결하기</button></div></div>`}
function pill(t,k,big){const c=CATS[t.cat]?.[1]||'#7b8794',on=isOn(k,t.id);
  return `<button class="pill${on?' on':''}${big?' big':''}" style="--c:${c}" data-act="tog" data-k="${k}" data-id="${esc(t.id)}" aria-pressed="${on}"><span class="box">${CK}</span><span>${esc(t.name)}</span></button>`}
function header(){
    $('ttl').innerHTML='하루 공부계획표<svg class="cherry" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4c-2 8-8 12-10 18M20 4c2 8 6 13 8 20" stroke="#3f8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M20 4c5-2 10 0 12 4-5 1-9 0-12-4z" fill="#5cb85c"/><circle cx="10" cy="28" r="8" fill="#e23a4a"/><circle cx="28" cy="29" r="8" fill="#d42c3d"/><circle cx="7.5" cy="25" r="2.2" fill="#fff" opacity=".7"/><circle cx="25.5" cy="26" r="2.2" fill="#fff" opacity=".7"/></svg>';
  document.title='하루 공부계획표';
  const a=dayDate(off,0),b=dayDate(off,6);
  const mf=new Date(new Date().getFullYear(),new Date().getMonth()+moff,1);
  $('sub').textContent=view==='month'?`${mf.getFullYear()}년 ${mf.getMonth()+1}월${moff===0?' (이번 달)':''}`:view==='week'?`${a.getFullYear()}년 ${md(a)} ~ ${md(b)}${off===0?' (이번 주)':''}`:view==='today'?`${md(new Date())} ${DAYS[dow(new Date())]}요일`:view==='schedule'?`${md(a)} ~ ${md(b)} 일정${off===0?' (이번 주)':''}`:'할 일과 일정을 요일별로 설정';
  $('tabs').innerHTML=FID?VIEWS().map(v=>`<button data-act="tab" data-v="${v}" aria-current="${v===view}">${{week:'주간',today:'오늘',schedule:'일정표',month:'한 달',edit:'편집'}[v]}</button>`).join(''):'';
  $('wk').innerHTML=!FID?'':(['week','month','schedule'].includes(view)?'<button data-act="pdf">PDF 저장</button>':'')+(view==='month'?`<button data-act="mo" data-d="-1" aria-label="이전 달">이전</button>${moff?'<button data-act="mo" data-d="0">이번 달</button>':''}<button data-act="mo" data-d="1" aria-label="다음 달">다음</button>`:(view==='week'||view==='schedule')?`<button data-act="wk" data-d="-1" aria-label="이전 주">이전</button>${off?'<button data-act="wk" data-d="0">이번 주</button>':''}<button data-act="wk" data-d="1" aria-label="다음 주">다음</button>`:'');
}
function rWeek(){
  const ti=dow(new Date());
  const cols=DAYS.map((d,i)=>{const s=stat(off,i),dt=dayDate(off,i),now=off===0&&i===ti;
    return `<div class="day${now?' now':''}" style="--dc:${DC[i]}" id="col${i}"><div class="badge">${d}<small>${md(dt)}</small></div>
    ${s.ts.map(t=>pill(t,s.k)).join('')||'<div class="empty">할 일 없음</div>'}
    ${evsOn(off,i).map(e=>`<div class="ev${e.once?' once':''}"><b>${esc(e.start)}</b>${esc(e.name)}</div>`).join('')}
    <div class="stamp${s.all?' done':''}" data-k="${s.k}">${s.all?'오늘 다 했어요!':s.ts.length?s.n+' / '+s.ts.length:'쉬는 날'}</div></div>`}).join('');
  const lg=Object.values(CATS).filter(([n,c])=>S.tasks.some(t=>CATS[t.cat]?.[1]===c)).map(([n,c])=>`<span><i style="--c:${c}"></i>${n}</span>`).join('');
  const none=!S.tasks.length&&!S.events.length;
  $('view').innerHTML=`${none?'<div class="panel" style="margin-bottom:14px"><h2>아직 입력한 내용 없음</h2><p style="margin:0 0 12px">편집 탭에서 할 일과 일정을 요일별로 입력하면 이곳에 주간 계획표가 만들어짐</p><button class="btn pri" data-act="tab" data-v="edit">입력하러 가기</button></div>':''}<div class="cols" id="cols">${cols}</div><div class="legend">${lg}</div>`;
  if(firstWeek&&off===0){firstWeek=false;const c=$('cols'),el=$('col'+ti);if(c&&el&&c.scrollWidth>c.clientWidth)c.scrollLeft=el.offsetLeft-c.offsetLeft-8}
}
function star(f,c){return `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="${f?c:'none'}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/></svg>`}
function rToday(){
  const i=dow(new Date()),s=stat(0,i),pct=s.ts.length?Math.round(s.n/s.ts.length*100):0;
  const stars=DAYS.map((d,j)=>{const x=stat(0,j);return `<div class="star">${star(x.all,DC[j])}${d}</div>`}).join('');
  const evs=evsOn(0,i);
  $('view').innerHTML=`<div class="today"><div><div class="list">${s.ts.map(t=>pill(t,s.k,1)).join('')||'<div class="empty">오늘은 정해진 할 일이 없음. 편집 탭에서 추가 가능</div>'}</div></div>
  <div class="list"><div class="panel"><h2>오늘의 진행</h2><div class="big-num">${s.n} / ${s.ts.length}</div><div class="bar"><i style="width:${pct}%"></i></div>
  <div class="stamp${s.all?' done':''}" style="margin-top:12px">${s.all?'오늘 다 했어요!':'하나씩 체크해 보기'}</div></div>
  <div class="panel"><h2>이번 주 별</h2><div class="stars">${stars}</div></div>
  <div class="panel"><h2>오늘 일정</h2>${evs.map(e=>`<div class="slot">${slotTxt(e)}</div>`).join('')||'<div class="empty">일정 없음</div>'}</div></div></div>`;
}
function rSched(){
  const ti=dow(new Date());
  $('view').innerHTML=`<div class="sched">${DAYS.map((d,i)=>{const ev=evsOn(off,i);return `<div class="srow" style="--dc:${DC[i]}"><div class="badge"${off===0&&i===ti?' style="outline:3px solid var(--ink);outline-offset:2px"':''}>${d}<small>${md(dayDate(off,i))}</small></div><div>${ev.map(e=>`<div class="slot">${slotTxt(e)}</div>`).join('')||'<div class="empty">일정 없음</div>'}</div></div>`}).join('')}</div>
  <div class="row-btns"><button class="btn" data-act="tab" data-v="edit">일정 편집하기</button></div>`;
}
function chips(kind,o){return `<div class="chips">${DAYS.map((d,i)=>`<button class="chip${o.days.includes(i)?' on':''}" style="--dc:${DC[i]}" data-act="chip" data-kind="${kind}" data-id="${esc(o.id)}" data-i="${i}" aria-pressed="${o.days.includes(i)}">${d}</button>`).join('')}</div>`}
function slotRow(e,src,k,label){const a=`data-id="${esc(e.id)}" data-src="${src}" data-k="${esc(k)}"`;
  return `<div class="line srw"><b>${esc(label)}</b><input type="time" data-f="sstart" ${a} value="${esc(e[src][k].start)}" aria-label="${esc(label)} 시작"> ~ <input type="time" data-f="send" ${a} value="${esc(e[src][k].end)}" aria-label="${esc(label)} 끝">${src==='dates'?`<button class="ico" data-act="deldate" ${a} aria-label="날짜 삭제">✕</button>`:''}</div>`}
function evEd(e){const id=esc(e.id),wk=e.mode!=='dates';
  const rows=wk?Object.keys(e.slots).sort().map(i=>slotRow(e,'slots',i,DAYS[i]+'요일')).join(''):Object.keys(e.dates).sort().map(k=>slotRow(e,'dates',k,fmtD(k))).join('');
  return `<div class="erow eved" style="--c:#7b8794">
  <div class="line"><input type="text" data-f="ename" data-id="${id}" value="${esc(e.name)}" placeholder="일정 이름 (예: 수학학원)" aria-label="일정 이름">
  <div class="seg"><button data-act="mode" data-id="${id}" data-m="weekly" aria-pressed="${wk}">매주 반복</button><button data-act="mode" data-id="${id}" data-m="dates" aria-pressed="${!wk}">날짜 지정</button></div>
  <button class="ico" data-act="del" data-kind="ev" data-id="${id}" aria-label="일정 삭제">✕</button></div>
  <div class="line"><span class="lbl">기본 시간</span><input type="time" data-f="estart" data-id="${id}" value="${esc(e.start)}" aria-label="기본 시작"> ~ <input type="time" data-f="eend" data-id="${id}" value="${esc(e.end)}" aria-label="기본 끝"><button class="btn" data-act="applyall" data-id="${id}">전체를 기본 시간으로</button></div>
  ${wk?`<div class="line">${chips('ev',{id:e.id,days:Object.keys(e.slots).map(Number)})}</div>`:`<div class="line"><input type="date" id="nd-${id}" aria-label="날짜 선택"><button class="btn" data-act="adddate" data-id="${id}">날짜 추가</button></div>`}
  ${rows||`<div class="empty">${wk?'요일을 누르면 시간 입력칸이 생김 (기본 시간으로 채워짐)':'날짜를 골라 추가 (기본 시간으로 채워짐)'}</div>`}</div>`}
function rEdit(){
  const opts=c=>Object.entries(CATS).map(([k,[n]])=>`<option value="${k}"${k===c?' selected':''}>${n}</option>`).join('');
  $('view').innerHTML=`<h2>할 일 (매주 반복)</h2><p class="note" style="margin:0 0 10px">이름 입력, 과목 선택, 하는 요일 누르기</p><div class="ed">${S.tasks.map((t,j)=>`<div class="erow" style="--c:${CATS[t.cat]?.[1]}">
    <input type="text" data-f="tname" data-id="${esc(t.id)}" value="${esc(t.name)}" placeholder="할 일 이름" aria-label="할 일 이름">
    <select data-f="tcat" data-id="${esc(t.id)}" aria-label="과목">${opts(t.cat)}</select>${chips('task',t)}
    <button class="ico" data-act="mv" data-id="${esc(t.id)}" data-d="-1" aria-label="위로"${j?'':' disabled'}>▲</button>
    <button class="ico" data-act="mv" data-id="${esc(t.id)}" data-d="1" aria-label="아래로"${j<S.tasks.length-1?'':' disabled'}>▼</button>
    <button class="ico" data-act="del" data-kind="task" data-id="${esc(t.id)}" aria-label="삭제">✕</button></div>`).join('')||'<div class="empty">아래 버튼으로 첫 할 일 추가</div>'}</div>
  <div class="row-btns"><button class="btn pri" data-act="addt">할 일 추가</button></div>
  <h2>일정 (학원, 수업 등)</h2><p class="note" style="margin:0 0 10px">매주 반복: 요일을 누르고 요일마다 시간 입력 (요일별로 달라도 됨)<br>날짜 지정: 비정기 학원처럼 날짜를 골라 하나씩 추가</p><div class="ed">${S.events.map(evEd).join('')||'<div class="empty">아래 버튼으로 첫 일정 추가</div>'}</div>
  <div class="row-btns"><button class="btn pri" data-act="adde">일정 추가</button></div>
  <h2>가족과 공유</h2><div class="panel" style="margin-bottom:22px"><p style="margin-top:0">아이 기기에서 QR을 찍거나 아이용 링크 열기 (아이 모드: 편집 탭 없이 체크만 가능)</p><div id="qr" class="qr"></div>
  <div class="line" style="margin-top:10px"><input type="text" readonly value="${esc(urlFor('kid'))}" aria-label="아이용 링크" class="ro"><button class="btn pri" data-act="copy" data-u="kid">아이용 링크 복사</button></div>
  <div class="line" style="margin-top:8px"><input type="text" readonly value="${esc(urlFor('parent'))}" aria-label="부모용 링크" class="ro"><button class="btn" data-act="copy" data-u="parent">부모용 링크 복사</button></div>
  <div class="line" style="margin-top:8px"><input type="text" readonly value="${esc(FID)}" aria-label="가족 코드" class="ro"><button class="btn" data-act="copy" data-u="code">가족 코드 복사</button></div>
  <p class="note">부모용 링크는 다른 보호자 기기용 (편집 가능). 링크와 코드가 곧 열쇠라서 가족 밖에는 보내지 않기</p></div>
  <h2>관리</h2><div class="row-btns"><button class="btn" data-act="ask" data-what="week">이번 주 체크 지우기</button><button class="btn" data-act="imp">옮겨 오기</button><button class="btn warn" data-act="ask" data-what="clear">모두 비우기</button><button class="btn" data-act="ask" data-what="leave">이 기기 연결 끊기</button></div>`;
}
function rMonth(){
  const now=new Date();now.setHours(0,0,0,0);
  const f=new Date(now.getFullYear(),now.getMonth()+moff,1),mon=f.getMonth();
  const st=new Date(f);st.setDate(1-dow(f));
  const last=new Date(f.getFullYear(),mon+1,0),en=new Date(last);en.setDate(last.getDate()+6-dow(last));
  let cells='';
  for(const d=new Date(st);d<=en;d.setDate(d.getDate()+1)){
    const s=statD(d),ev=evsD(d),out=d.getMonth()!==mon,td=+d===+now,i=dow(d);
    cells+=`<button class="mc${out?' out':''}${td?' td':''}" data-act="goday" data-k="${key(d)}" aria-label="${md(d)} 주간 보기">
      <span class="mn" style="${i===6?'color:#e84b5a':i===5?'color:#3b8ee0':''}">${d.getDate()}</span>
      ${ev.map(e=>`<span class="me${e.once?' once':''}" style="--c:${e.c}"><b>${esc(e.start)}</b> ${esc(e.name)}</span>`).join('')}
      ${s.ts.length?`<span class="mp${s.all?' ok':''}">${s.all?star(1,'#e0a800'):''}${s.n}/${s.ts.length}</span>`:''}</button>`}
  const names=[...new Map(S.events.map((e,x)=>[e.name,EC[x%EC.length]])).entries()].filter(([n])=>n.trim());
  $('view').innerHTML=`<div class="mh">${DAYS.map((d,i)=>`<span style="${i===6?'color:#e84b5a':i===5?'color:#3b8ee0':''}">${d}</span>`).join('')}</div><div class="mg">${cells}</div>
  <div class="legend">${names.map(([n,c])=>`<span><i style="--c:${c}"></i>${esc(n)}</span>`).join('')}<span>숫자: 공부 체크 수</span><span>날짜를 누르면 그 주 계획표로 이동</span></div>`;
}
function lib(src){return new Promise((ok,no)=>{const x=document.createElement('script');x.src=src;x.onload=ok;x.onerror=no;document.head.appendChild(x)})}
function fname(){const a=dayDate(off,0),f=new Date(new Date().getFullYear(),new Date().getMonth()+moff,1);
  return view==='month'?`공부계획표_${f.getFullYear()}-${pad(f.getMonth()+1)}.pdf`:view==='schedule'?`일정표_${key(a)}.pdf`:`공부계획표_주간_${key(a)}.pdf`}
let busy=false;
async function makePdf(){
  if(busy)return;busy=true;toast('PDF 만드는 중');
  try{
    if(!window.html2canvas)await lib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if(!window.jspdf)await lib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const box=document.createElement('div');box.className='pr';
    const v=$('view').cloneNode(true);v.removeAttribute('id');
    if(view==='week'){v.querySelectorAll('.pill.on').forEach(p=>p.classList.remove('on'));v.querySelectorAll('.stamp').forEach(x=>{if(x.textContent!=='쉬는 날'){x.className='stamp blank';x.textContent='오늘 다 했어요!'}})}
    v.querySelectorAll('.row-btns,#cols>.panel').forEach(x=>x.remove());
    v.querySelectorAll('.panel').forEach(x=>{if(x.querySelector('[data-v=edit]'))x.remove()});
    box.innerHTML='<h1>'+$('ttl').innerHTML+'</h1><p class="sub"></p>';box.querySelector('.sub').textContent=$('sub').textContent;box.appendChild(v);
    document.body.appendChild(box);
    try{await document.fonts?.ready}catch(e){}
    const cv=await html2canvas(box,{scale:2,backgroundColor:'#ffffff',logging:false});box.remove();
    const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const W=285,H=198,r=Math.min(W/cv.width,H/cv.height),w=cv.width*r,h=cv.height*r;
    pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',(297-w)/2,6,w,h);
    const url=URL.createObjectURL(pdf.output('blob')),ln=document.createElement('a');ln.href=url;ln.download=fname();document.body.appendChild(ln);ln.click();ln.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    toast('PDF 저장됨. 파일을 열어 인쇄하면 됨');
  }catch(e){toast('PDF 만들기 실패. 인터넷 연결 확인 후 다시 시도')}
  finally{busy=false;document.querySelector('.pr')?.remove()}
}
async function drawQR(){const el=$('qr');if(!el)return;try{if(!window.qrcode)await lib('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');const q=qrcode(0,'M');q.addData(urlFor('kid'));q.make();if($('qr'))$('qr').innerHTML=q.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){el.textContent='QR을 불러오지 못함. 아이용 링크를 보내 주세요'}}
function render(){header();if(!FID){rSetup();return}if(!VIEWS().includes(view))view=VIEWS()[0];({week:rWeek,today:rToday,schedule:rSched,month:rMonth,edit:rEdit})[view]();if(view==='edit')drawQR()}
let undo=null,tt=null;
function toast(msg,fn){undo=fn;$('pop').innerHTML=`<div class="toast">${esc(msg)}${fn?'<button data-act="undo">되돌리기</button>':''}</div>`;clearTimeout(tt);tt=setTimeout(()=>{$('pop').innerHTML='';undo=null},5000)}
const ASK={leave:['이 기기에서 가족 계획표 연결을 끊을까요? 계획표 내용은 그대로 남음',()=>{lss('kp-f',null);lss('kp-m',null);FID=null;ref=null;history.replaceState(null,'',location.pathname);location.reload()}],week:['이번 주 체크를 모두 지울까요?',()=>{for(let i=0;i<7;i++){const k=key(dayDate(0,i));delete S.checks[k];if(ref)F.updateDoc(ref,new F.FieldPath('checks',k),F.deleteField())}cache()}],clear:['할 일, 일정, 체크를 모두 비울까요?',()=>{S.tasks=[];S.events=[];S.checks={};cache();if(ref)F.setDoc(ref,{tasks:[],events:[],checks:{},created:Date.now()})}]};
const find=(kind,id)=>(kind==='ev'?S.events:S.tasks).find(o=>o.id===id);
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id;
  if(a==='newfam'){setFamily(newCode(),'parent');return}
  if(a==='joinfam'){const v=($('code').value||'').trim().toLowerCase();if(!/^[a-z0-9]{20,40}$/.test(v)){toast('가족 코드를 다시 확인');return}setFamily(v,'parent');return}
  if(a==='copy'){const u=b.dataset.u==='code'?FID:urlFor(b.dataset.u);(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('복사됨'),()=>{const i=b.previousElementSibling;if(i&&i.select){i.select();toast('선택된 글자를 길게 눌러 복사')}});return}
  if(a==='tab'){view=b.dataset.v;location.hash=view;render();return}
  if(a==='pdf'){makePdf();return}
  if(a==='mo'){const d=+b.dataset.d;moff=d?moff+d:0;render();return}
  if(a==='goday'){const d=new Date(b.dataset.k+'T00:00');d.setDate(d.getDate()-dow(d));off=Math.round((d-monday(0))/6048e5);view='week';location.hash='week';render();return}
  if(a==='wk'){const d=+b.dataset.d;off=d?off+d:0;render();return}
  if(a==='tog'){const k=b.dataset.k;S.checks[k]=S.checks[k]||{};const on=!S.checks[k][id];if(on)S.checks[k][id]=true;else delete S.checks[k][id];saveCheck(k,id,on);render();return}
  if(a==='chip'){const o=find(b.dataset.kind,id),i=+b.dataset.i;if(!o)return;if(b.dataset.kind==='ev'){if(o.slots[i])delete o.slots[i];else o.slots[i]={start:o.start,end:o.end};save();render();return}o.days=o.days.includes(i)?o.days.filter(x=>x!==i):[...o.days,i].sort();save();render();return}
  if(a==='addt'){S.tasks.push({id:uid(),name:'',cat:'read',days:[]});save();render();const ins=document.querySelectorAll('[data-f=tname]');ins[ins.length-1]?.focus();return}
  if(a==='adde'){S.events.push({id:uid(),name:'',mode:'weekly',start:'15:00',end:'16:00',slots:{},dates:{}});save();render();const ins=document.querySelectorAll('[data-f=ename]');ins[ins.length-1]?.focus();return}
  if(a==='mv'){const j=S.tasks.findIndex(t=>t.id===id),k=j+ +b.dataset.d;if(j<0||k<0||k>=S.tasks.length)return;[S.tasks[j],S.tasks[k]]=[S.tasks[k],S.tasks[j]];save();render();return}
  if(a==='del'){const arr=b.dataset.kind==='ev'?S.events:S.tasks,j=arr.findIndex(o=>o.id===id);if(j<0)return;const [o]=arr.splice(j,1);save();render();toast(`'${o.name||'이름 없음'}' 삭제됨`,()=>{arr.splice(j,0,o);save();render()});return}
  if(a==='mode'){const o=find('ev',id);if(o){o.mode=b.dataset.m;save();render()}return}
  if(a==='applyall'){const o=find('ev',id);if(!o)return;for(const m of [o.slots,o.dates])for(const k in m)m[k]={start:o.start,end:o.end};save();render();toast('모든 시간을 기본 시간으로 바꿈');return}
  if(a==='adddate'){const o=find('ev',id),v=document.getElementById('nd-'+id)?.value;if(!o)return;if(!v){toast('날짜를 먼저 선택');return}o.dates[v]=o.dates[v]||{start:o.start,end:o.end};save();render();return}
  if(a==='deldate'){const o=find('ev',id),k=b.dataset.k;if(!o||!o.dates[k])return;const old=o.dates[k];delete o.dates[k];save();render();toast(fmtD(k)+' 삭제됨',()=>{o.dates[k]=old;save();render()});return}
  if(a==='imp'){$('pop').innerHTML=`<div class="modal"><div><p style="margin-top:0;font-weight:700">Claude 계획표의 새 앱으로 옮기기에서 복사한 내용을 붙여 넣기 (지금 입력된 할 일과 일정은 바뀜)</p><textarea id="impt" style="width:100%;height:140px;font-size:16px;border:2px solid var(--line);border-radius:10px;padding:8px;background:var(--paper);color:var(--ink)"></textarea><p class="row-btns" style="margin:10px 0 0"><button class="btn pri" data-act="impok">가져오기</button><button class="btn" data-act="no">취소</button></p></div></div>`;$('impt').focus();return}
  if(a==='impok'){let d=null;try{d=JSON.parse($('impt').value.trim())}catch(e){}
    if(!d||!Array.isArray(d.tasks)||!Array.isArray(d.events)){toast('내용이 올바르지 않음. 처음부터 끝까지 다시 복사');return}
    S.tasks=d.tasks.filter(t=>t&&typeof t.id==='string').map(t=>({id:t.id,name:String(t.name||''),cat:CATS[t.cat]?t.cat:'etc',days:(t.days||[]).filter(n=>n>=0&&n<7)}));
    S.events=d.events.filter(e=>e&&typeof e.id==='string').map(e=>({id:e.id,name:String(e.name||''),mode:e.mode==='dates'?'dates':'weekly',start:String(e.start||'15:00'),end:String(e.end||'16:00'),slots:e.slots||{},dates:e.dates||{},days:e.days}));
    for(const e of S.events)if(e.days===undefined)delete e.days;mig();
    const c=d.checks&&typeof d.checks==='object'?d.checks:{};for(const k in c){if(!/^\d{4}-\d\d-\d\d$/.test(k)||typeof c[k]!=='object')continue;S.checks[k]=S.checks[k]||{};for(const id in c[k])if(c[k][id]===true)S.checks[k][id]=true}
    cache();if(ref)F.updateDoc(ref,{tasks:S.tasks,events:S.events,checks:S.checks}).catch(()=>syncTxt('저장 실패, 연결 확인 필요'));
    $('pop').innerHTML='';render();toast(`할 일 ${S.tasks.length}개, 일정 ${S.events.length}개 옮겨 옴`);return}
  if(a==='undo'){if(undo)undo();$('pop').innerHTML='';undo=null;return}
  if(a==='ask'){const w=b.dataset.what;$('pop').innerHTML=`<div class="modal"><div><p style="margin-top:0;font-weight:700">${esc(ASK[w][0])}</p><div class="row-btns" style="margin:0"><button class="btn pri" data-act="yes" data-what="${w}">확인</button><button class="btn" data-act="no">취소</button></div></div></div>`;return}
  if(a==='yes'){ASK[b.dataset.what][1]();$('pop').innerHTML='';render();return}
  if(a==='no'){$('pop').innerHTML='';return}
});
document.addEventListener('input',e=>{const t=e.target,f=t.dataset.f;if(!f)return;
  if(f==='name'){S.name=t.value;header()}
  else if(f==='tname'){const o=find('task',t.dataset.id);if(o)o.name=t.value}
  else if(f==='ename'){const o=find('ev',t.dataset.id);if(o)o.name=t.value}
  else if(f==='estart'||f==='eend'){const o=find('ev',t.dataset.id);if(o)o[f==='estart'?'start':'end']=t.value}
  else if(f==='sstart'||f==='send'){const o=find('ev',t.dataset.id),m=o&&o[t.dataset.src],x=m&&m[t.dataset.k];if(x)x[f==='sstart'?'start':'end']=t.value}
  else if(f==='tcat'){const o=find('task',t.dataset.id);if(o){o.cat=t.value;t.closest('.erow').style.setProperty('--c',CATS[o.cat][1])}}
  save()});
document.addEventListener('change',e=>{if(e.target.dataset.f==='tcat'){const o=find('task',e.target.dataset.id);if(o){o.cat=e.target.value;save()}}});
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(VIEWS().includes(h)&&h!==view){view=h;render()}});
render();
if(FID)connect();
}
