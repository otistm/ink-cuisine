/* Ink Cuisine: Friday night service. Parties arrive at the door (S.door), get seated at a table (S.tables), read the
   menu, order, wait while the kitchen cooks (S.kq, S.stations), get served from the pass (S.pass), eat, pay and leave
   a dirty table behind. One tap on a table does the obvious thing. Too slow, and they walk out to a rival. */
"use strict";
let PID=0;
const party=id=>S.parties.find(p=>p.id===id);
const hotFor=()=>S.up.lamp?20:10;
const autoOrder=()=>13-foh().pace,autoBill=()=>15-foh().pace;

/* ---------- a night's guests ---------- */
function partyCount(){
  const n=6+S.buzz/9+vibe().crowd+S.week*.4+(S.news&&S.news.crowd||0);
  return Math.round(clamp(n,5,22));
}
function makeParty(kind){
  const V=vibe(),size=kind?1:rnd(V.size[0],V.size[1]),looks=Array.from({length:size},randomLook);
  if(kind){looks[0].glasses=true;looks[0].hair=pick(['crop','bob','bun','flat'])}
  const sur=pick(SURNAMES),f1=pick(FIRSTS);
  const name=size===1?f1+' '+sur[0]+'.':size===2?`${f1} and ${pick(FIRSTS.filter(x=>x!==f1))}`:`The ${sur}${/s$/.test(sur)?'es':'s'}`;
  return{id:++PID,size,looks,name,kind:kind||'',stage:'door',t:0,pat:0,max:0,table:-1,dishes:[],done:0,q:[],cold:0,
    w:{door:0,order:0,food:0,bill:0},expect:0,tilt:(Math.random()*3-1.5).toFixed(2),dirtyAtSeat:0};
}
function planNight(){
  const n=partyCount(),at=[];
  for(let i=0;i<n;i++)at.push(SERVICE*.9*(i+.2+Math.random()*.6)/n);
  S.arrivals=at.map(t=>({t,kind:''}));
  // the Quill Guide's inspector, and sometimes a food blogger, both dine alone and take notes
  if(S.insp.includes(S.week))S.arrivals[rnd(1,Math.floor(n*.7))].kind='insp';
  if(Math.random()<.4){const free=S.arrivals.map((a,i)=>i).filter(i=>i>0&&!S.arrivals[i].kind);if(free.length)S.arrivals[pick(free)].kind='blog'}
}

/* ---------- the stages of a party's evening ---------- */
function setStage(p,st,max=0){p.stage=st;p.t=0;p.max=max;p.pat=max;S.roomDirty=true}
function seat(p,ti){
  const T=S.tables[ti];
  S.door=S.door.filter(id=>id!==p.id);T.pid=p.id;p.table=ti;
  p.dirtyAtSeat=S.tables.filter(t=>t.dirty).length;
  setStage(p,'read');p.readFor=2.5+Math.random()*2;
  S.did.seat=true;snd('seat');haptic(10);drawDoor();
  if(p.kind==='insp'&&!S.inspSeen){S.inspSeen=true}
}
function chooseDish(course){
  const opts=S.menu.map((d,m)=>({d,m})).filter(x=>x.d.c===course);
  if(!opts.length)return -1;
  const w=opts.map(({d})=>Math.max(.4,quality(d))*clamp(1.7-d.price/fairPrice(d),.12,1.3));
  let r=Math.random()*w.reduce((a,b)=>a+b,0),k=0;while(k<w.length-1&&r>w[k])r-=w[k++];
  return opts[k].m;
}
function takeOrder(p){
  const list=[];
  for(let i=0;i<p.size;i++){
    if(Math.random()<.45)list.push(chooseDish('starter'));
    list.push(chooseDish('main'));
    if(Math.random()<.4)list.push(chooseDish('dessert'));
  }
  p.dishes=list.filter(m=>m>=0);p.done=0;p.q=[];
  p.dishes.forEach(m=>S.kq.push({pid:p.id,m}));
  const st=S.stations.length,cook=p.dishes.reduce((a,m)=>a+cookTime(S.menu[m],chef()),0);
  p.expect=cook/Math.min(st,p.dishes.length)+(S.kq.length-p.dishes.length)*2.2/st+3;
  setStage(p,'wait',(p.expect+22)*vibe().patience);
  S.did.order=true;snd('order');
}
function serve(p){
  const T=S.tables[p.table];
  const waited=S.clock-p.readyAt;if(waited>hotFor())p.cold=1;
  p.w.food=S.clock-p.orderedAt-p.expect;
  S.pass=S.pass.filter(id=>id!==p.id);
  setStage(p,'eat');p.eatFor=6*vibe().linger*(.8+p.size*.12);
  S.did.serve=true;snd('serve');haptic(12);drawPass();
  const el=room.querySelector(`[data-t="${p.table}"]`);if(el&&p.cold)floatAt(el,'Cold!','small');
}
// The bill: how the evening went, out of 5 stars.
function verdict(p){
  const V=vibe(),n=p.q.length||1,food=p.q.reduce((a,b)=>a+b,0)/n-p.cold*3;
  const dishes=p.dishes.map(m=>S.menu[m]);
  const ratio=dishes.reduce((a,d)=>a+d.price/fairPrice(d),0)/(dishes.length||1);
  const foodPts=clamp((food-V.bar)/8.5,0,1)*2.6;
  const svcPts=clamp(1.4-p.w.door/25-p.w.order/14-Math.max(0,p.w.food)/22-p.w.bill/20,0,1.4);
  const roomPts=clamp(.25+(S.up.decor|0)*.12+(foh().charm-5)*.05+(S.up.somm?.1:0)+(V.mood||0),0,1);
  const valPts=-clamp((ratio-1.05)*2.5,0,1.5)+(ratio<.9?.2:0);
  const stars=clamp(Math.round((foodPts+svcPts+roomPts+valPts)*2)/2,.5,5);
  // the inspector scores out of 100: food 50, service 30, the room 20
  const insp={food:Math.round(clamp((food-6)/10,0,1)*50),
    service:Math.round(clamp(30-p.w.door*.9-p.w.order*1.1-Math.max(0,p.w.food)*.7-p.w.bill*.6-p.cold*6,0,30)),
    room:Math.round(clamp(2+(S.up.decor|0)*4+(foh().charm-4)*.75+(S.up.somm?3:0)+(V.mood?2:0)-p.dirtyAtSeat*3,0,20))};
  return{stars,food,ratio,svcPts,insp};
}
function payBill(p,late){
  const T=S.tables[p.table],v=verdict(p),dishes=p.dishes.map(m=>S.menu[m]);
  let stars=v.stars;if(late)stars=Math.max(.5,stars-1);
  const sum=dishes.reduce((a,d)=>a+d.price,0)*(S.up.somm?1.15:1);
  const tip=late?0:stars>=4?sum*.06*(stars-3)*(1+(foh().charm-5)*.1):0;
  const pay=Math.round(sum+tip);
  S.till+=pay;S.earned+=pay;S.take+=pay;S.served++;S.covers+=p.size;S.starSum+=stars;
  S.buzz=clamp(S.buzz+(stars-3)*.8*(p.kind==='blog'?3:1),0,100);
  S.reviews.push({stars,name:p.name,kind:p.kind,d:dishes.length?pick(dishes).name:'',slow:v.svcPts<.6,cold:p.cold,pricey:v.ratio>1.2});
  if(p.kind==='insp')recordInspection(v.insp);
  leave(p);T.dirty=true;T.clearAt=S.up.porter?S.clock+3:Infinity;
  S.did.bill=true;snd('coin');haptic([12,40,12]);
  const el=room.querySelector(`[data-t="${p.table}"]`);
  if(el){const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height*.4;
    floatText('+'+money(pay),x,y);setTimeout(()=>floatText('★'.repeat(Math.floor(stars))+(stars%1?'½':''),x,y+22,'small'),250)}
  hud();
}
function recordInspection(x){
  S.scores.push({week:S.week,food:x.food,service:x.service,room:x.room,score:x.food+x.service+x.room});
}
function walkout(p){
  S.walked++;S.buzz=clamp(S.buzz-(p.kind==='blog'?8:3),0,100);
  const r=rnd(0,RIVALS.length-1);S.rivals[r]=clamp(S.rivals[r]+.6,0,100);
  p.rival=RIVALS[r].name;
  if(p.kind==='insp')S.scores.push({week:S.week,food:0,service:0,room:0,score:5,walked:true});
  S.kq=S.kq.filter(j=>j.pid!==p.id);S.pass=S.pass.filter(id=>id!==p.id);
  S.stations.forEach(s=>{if(s.job&&s.job.pid===p.id)s.job.waste=true});
  snd('walk');haptic(60);
  const el=p.table>=0?room.querySelector(`[data-t="${p.table}"]`):door.querySelector(`[data-pid="${p.id}"]`);
  if(el){const b=el.getBoundingClientRect();floatText('Off to '+p.rival,b.left+b.width/2,b.top+b.height/2,'small')}
  if(p.table>=0){const T=S.tables[p.table];T.dirty=p.dishes.length>0;T.clearAt=S.up.porter?S.clock+3:Infinity}
  S.door=S.door.filter(id=>id!==p.id);
  leave(p);drawDoor();drawPass();
}
function leave(p){p.stage='gone';S.roomDirty=true;if(p.table>=0){const T=S.tables[p.table];if(T.pid===p.id)T.pid=null}}
function clearTable(ti){const T=S.tables[ti];T.dirty=false;T.clearAt=Infinity;S.did.clear=true;S.roomDirty=true;snd('clear')}

/* ---------- the night, a frame at a time ---------- */
function tickService(dt){
  // arrivals
  while(S.arrivals.length&&S.clock>=S.arrivals[0].t){
    const a=S.arrivals.shift(),p=makeParty(a.kind);
    setStage(p,'door',(20+p.size*1.5)*vibe().patience);S.parties.push(p);S.door.push(p.id);snd('ding');drawDoor();
  }
  for(const p of S.parties){
    if(p.stage==='gone')continue;
    p.t+=dt;
    if(p.stage==='door'){p.w.door+=dt;p.pat-=dt;if(p.pat<=0)walkout(p)}
    else if(p.stage==='read'){if(p.t>=p.readFor)setStage(p,'order',18*vibe().patience)}
    else if(p.stage==='order'){p.w.order+=dt;p.pat-=dt;
      if(p.t>=autoOrder()){p.orderedAt=S.clock;takeOrder(p);S.auto++}else if(p.pat<=0)walkout(p)}
    else if(p.stage==='wait'){p.pat-=dt;if(p.pat<=0)walkout(p)}
    else if(p.stage==='eat'){if(p.t>=p.eatFor)setStage(p,'bill',16*vibe().patience)}
    else if(p.stage==='bill'){p.w.bill+=dt;p.pat-=dt;
      if(p.t>=autoBill()){payBill(p);S.auto++}else if(p.pat<=0)payBill(p,true)}
  }
  // the kitchen
  for(const s of S.stations){
    if(!s.job&&S.kq.length){s.job=S.kq.shift();s.t=0;s.dur=cookTime(S.menu[s.job.m],s.cook);S.kitchenDirty=true}
    if(!s.job)continue;
    s.t+=dt;
    if(s.t>=s.dur){
      const j=s.job,p=party(j.pid),d=S.menu[j.m];s.job=null;S.kitchenDirty=true;
      S.till-=d.cost;S.food+=d.cost;
      if(p&&!j.waste&&p.stage==='wait'){
        p.done++;p.q.push(quality(d,s.cook));
        if(p.done>=p.dishes.length){p.readyAt=S.clock;S.pass.push(p.id);S.roomDirty=true;snd('bell');drawPass()}
      }
      hud();
    }
  }
  // the porter clears tables
  S.tables.forEach((T,i)=>{if(T.dirty&&!T.pid&&S.clock>=T.clearAt)clearTable(i)});
  if(S.roomDirty){S.roomDirty=false;drawRoom()}else roomBars();
  if(S.kitchenDirty){S.kitchenDirty=false;drawKitchen()}else kitchenBars();
  doorBars();passBars();clockHud();
  // after last orders, the night ends once everyone has gone
  if(S.mode==='play'&&!S.arrivals.length&&S.clock>=SERVICE&&S.parties.every(p=>p.stage==='gone'))endService();
}

/* ---------- drawing the door, the room, the pass and the kitchen ---------- */
function mood(p){const f=p.max?p.pat/p.max:1;return f>.5?'happy':f>.22?'meh':'grr'}
function badge(p){return p.kind?`<i class="badge" title="Taking notes">${GLYPH.note}</i>`:''}
function doorHTML(p){
  if(!p)return `<div class="slot-empty"></div>`;
  const m=mood(p);
  return `<button class="guest ${m}" data-pid="${p.id}" style="--tilt:${p.tilt}deg" aria-label="${esc(p.name)}, party of ${p.size}">
    <div class="gfaces">${p.looks.map(l=>faceSVG(l,m)).join('')}</div>${badge(p)}
    <b>${esc(p.name)}</b><small>${p.size===1?'Table for one':'Party of '+p.size}</small>
    <div class="pbar"><i style="width:${p.pat/p.max*100}%"></i></div></button>`;
}
function drawDoor(){
  const ids=S.door.slice(0,3),more=S.door.length-3;
  door.innerHTML=`<span class="lab">At the door${more>0?` <em>+${more} more</em>`:''}</span><div class="guests">${[0,1,2].map(i=>doorHTML(party(ids[i]))).join('')}</div>`;
  door.querySelectorAll('.guest').forEach(el=>{const id=+el.dataset.pid;
    if(!S.seen.has(id)){S.seen.add(id);if(!RM)el.animate([{transform:'translateX(60px) rotate(var(--tilt))',opacity:0},{transform:'translateX(-5px) rotate(var(--tilt)) scaleX(.95)',opacity:1,offset:.7},{transform:'rotate(var(--tilt))'}],{duration:380,easing:'cubic-bezier(.3,.8,.4,1)'})}});
}
function doorBars(){
  door.querySelectorAll('.guest').forEach(el=>{const p=party(+el.dataset.pid);if(!p||p.stage!=='door')return;
    el.querySelector('.pbar i').style.width=Math.max(0,p.pat/p.max*100)+'%';
    const m=mood(p);if(!el.classList.contains(m)){el.classList.remove('happy','meh','grr');el.classList.add(m);el.querySelector('.gfaces').innerHTML=p.looks.map(l=>faceSVG(l,m)).join('')}});
}
// What a table shows, and whether tapping it does something right now.
function tableState(i){
  const T=S.tables[i],p=T.pid?party(T.pid):null;
  if(!p)return T.dirty?{k:'dirty',g:'broom',txt:'Needs clearing',can:1}:{k:'free',g:'',txt:S.door.length?'Free: tap to seat':'Free',can:S.door.length>0};
  if(p.stage==='read')return{k:'read',g:'menu',txt:'Reading the menu',p};
  if(p.stage==='order')return{k:'order',g:'hand',txt:'Ready to order',can:1,p};
  if(p.stage==='wait'){const up=S.pass.includes(p.id);return up?{k:'up',g:'bell',txt:'Food\'s up!',can:1,p}:{k:'wait',g:'pot',txt:`Cooking ${p.done} of ${p.dishes.length}`,p}}
  if(p.stage==='eat')return{k:'eat',g:'fork',txt:'Eating',p};
  if(p.stage==='bill')return{k:'bill',g:'bill',txt:'Wants the bill',can:1,p};
  return{k:'free',g:'',txt:'Free'};
}
function tableHTML(i){
  const st=tableState(i),p=st.p,m=p?mood(p):'happy';
  const art=tableSVG(vibe().k,{faces:p?p.looks:[],mood:m,plates:p&&(st.k==='eat'),eat:st.k==='eat',dirty:st.k==='dirty'});
  const bar=p&&p.max?`<div class="pbar"><i style="width:${p.pat/p.max*100}%"></i></div>`:p&&st.k==='eat'?`<div class="pbar eat"><i style="width:${Math.min(100,p.t/p.eatFor*100)}%"></i></div>`:'<div class="pbar none"></div>';
  return `<button class="table t-${st.k}${st.can?' can':''} ${m}" data-t="${i}" aria-label="Table ${i+1}: ${st.txt}">
    <span class="tno">${i+1}</span>${p?badge(p):''}<div class="tart">${art}</div>
    <div class="tstat">${st.g?`<i class="gl">${GLYPH[st.g]}</i>`:''}<span>${st.txt}</span></div>${bar}</button>`;
}
function drawRoom(){
  room.style.setProperty('--rows',Math.ceil(S.tables.length/2));
  room.innerHTML=S.tables.map((_,i)=>tableHTML(i)).join('');
}
function roomBars(){
  S.tables.forEach((T,i)=>{const p=T.pid&&party(T.pid);if(!p)return;const el=room.querySelector(`[data-t="${i}"]`);if(!el)return;
    const b=el.querySelector('.pbar i');if(b)b.style.width=Math.max(0,p.max?p.pat/p.max*100:Math.min(100,p.t/(p.eatFor||1)*100))+'%';
    const m=mood(p);if(p.max&&!el.classList.contains(m))S.roomDirty=true;
    if(p.stage==='wait'){const s=el.querySelector('.tstat span');const txt=S.pass.includes(p.id)?'Food\'s up!':`Cooking ${p.done} of ${p.dishes.length}`;if(s&&s.textContent!==txt)S.roomDirty=true}});
}
function drawPass(){
  const ids=S.pass;
  passEl.innerHTML=`<span class="lab">The pass</span><div class="plates">${ids.length?ids.map(id=>{const p=party(id);return p?`<button class="order" data-pid="${id}" aria-label="Food for table ${p.table+1}">
    <b>T${p.table+1}</b><span class="dishes">${p.dishes.slice(0,5).map(m=>dishIcon(S.menu[m])).join('')}${p.dishes.length>5?`<em>+${p.dishes.length-5}</em>`:''}</span><div class="heat"><i></i></div></button>`:''}).join('')
    :'<span class="none">Nothing waiting. The kitchen rings a bell when food is up.</span>'}</div>`;
  passBars();
}
function passBars(){
  passEl.querySelectorAll('.order').forEach(el=>{const p=party(+el.dataset.pid);if(!p)return;const f=1-(S.clock-p.readyAt)/hotFor();
    el.querySelector('.heat i').style.width=Math.max(0,f*100)+'%';el.classList.toggle('cold',f<=0)});
}
function drawKitchen(){
  kitchen.innerHTML=S.stations.map((s,i)=>`<div class="stn" data-s="${i}">${faceSVG(s.cook.look,s.job?'happy':'meh',i===0)}
    <div class="sjob">${s.job?dishIcon(S.menu[s.job.m]):'<span class="idle">Free</span>'}<div class="pbar"><i style="width:${s.job?s.t/s.dur*100:0}%"></i></div></div></div>`).join('')
    +`<div class="kq"><b>${S.kq.length}</b><span>to cook</span></div>`;
}
function kitchenBars(){kitchen.querySelectorAll('.stn').forEach(el=>{const s=S.stations[+el.dataset.s];if(s&&s.job)el.querySelector('.pbar i').style.width=Math.min(100,s.t/s.dur*100)+'%'})}

/* ---------- taps ---------- */
function freeTable(){return S.tables.findIndex(T=>!T.pid&&!T.dirty)}
door.addEventListener('click',e=>{
  const el=e.target.closest('.guest');if(!el||S.mode!=='play')return;
  const p=party(+el.dataset.pid);if(!p||p.stage!=='door')return;
  const ti=freeTable();
  if(ti<0){snd('bad');wiggle(el);toast(S.tables.some(T=>T.dirty&&!T.pid)?'Clear a table first':'No free tables yet');return}
  seat(p,ti);
});
room.addEventListener('click',e=>{
  const el=e.target.closest('.table');if(!el||S.mode!=='play')return;
  const i=+el.dataset.t,st=tableState(i),p=st.p;
  if(st.k==='free'){if(S.door.length)seat(party(S.door[0]),i);else{snd('bad');toast('Nobody waiting at the door')}}
  else if(st.k==='dirty')clearTable(i);
  else if(st.k==='order'){p.orderedAt=S.clock;takeOrder(p)}
  else if(st.k==='up')serve(p);
  else if(st.k==='bill')payBill(p);
  else{snd('bad');wiggle(el);toast(st.k==='read'?'Still reading the menu':st.k==='wait'?'The kitchen is on it':'Let them enjoy it')}
});
passEl.addEventListener('click',e=>{
  const el=e.target.closest('.order');if(!el||S.mode!=='play')return;
  const p=party(+el.dataset.pid);if(p&&p.stage==='wait')serve(p);
});

/* ---------- the top bar, floating text, toast ---------- */
function clockText(t){const m=Math.min(t,SERVICE+90)/SERVICE*240,h=6+Math.floor(m/60),mm=Math.floor(m%60);return `${h>12?h-12:h}:${String(mm).padStart(2,'0')}pm`}
function clockHud(){
  const f=Math.min(1,S.clock/SERVICE);$('#cfill').style.width=f*100+'%';
  const txt=S.clock>=SERVICE?'Last orders':clockText(S.clock),el=$('#ctime');if(el.textContent!==txt)el.textContent=txt;
}
function hud(){$('#till').textContent=money(S.till);$('#rname').textContent=S.name}
function floatAt(el,txt,cls=''){const r=el.getBoundingClientRect();floatText(txt,r.left+r.width/2,r.top+r.height*.4,cls)}
function floatText(txt,x,y,cls=''){
  const el=document.createElement('div');el.className='float '+cls;el.textContent=txt;
  el.style.left=x+'px';el.style.top=y+'px';fx.appendChild(el);
  el.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,-90%) scale(1.15)',opacity:1,offset:.25},{transform:'translate(-50%,-190%) scale(1)',opacity:0}],{duration:1100,easing:'ease-out'}).onfinish=()=>el.remove();
}
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),1600)}
function wiggle(el){if(!el||RM)return;el.animate([{transform:'translateX(0)'},{transform:'translateX(-5px) rotate(-2deg)'},{transform:'translateX(5px) rotate(2deg)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:260})}
