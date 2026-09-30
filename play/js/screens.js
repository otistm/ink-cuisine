/* Ink Cuisine: the season's flow and every screen. Title, setting up the restaurant (name, cuisine, vibe, head chef,
   the team, then the menu), the week's intro, Friday service, last orders, the books, the office between weeks
   (menu, hiring and fit-out, the city table), the Quill Guide at the end, pause. The season is saved each week. */
"use strict";

/* ---------- a new restaurant ---------- */
function newSeason(){
  restore({v:1,week:0,name:pick(NAME_IDEAS),cuisine:0,vibe:0,chef:0,sous:0,foh:0,menu:MENU_SLOTS.map(()=>null),till:START.till,buzz:START.buzz,
    up:{table:0,decor:0},insp:INSPECT_WINDOWS.map(([a,b])=>rnd(a,b)),scores:[],earned:0,news:null,ideas:0});
  S.setup={step:0};
}
function rollNews(){
  const n=pick(S.week===0?NEWS.filter(x=>!x.rb&&!(x.crowd<0)):NEWS),r=rnd(0,RIVALS.length-1);
  S.news={t:n.t.replace('{r}',RIVALS[r].name),crowd:n.crowd||0};
  if(n.rb)S.rivals[r]=clamp(S.rivals[r]+n.rb,0,100);
}
// rivals drift a little each week
function rivalsWeek(){S.rivals=S.rivals.map((b,i)=>clamp(b+rnd(-2,3)+(RIVALS[i].buzz-b)*.08,0,100))}
function cityTable(){
  const all=RIVALS.map((r,i)=>({name:r.name,cuisine:r.cuisine,buzz:S.rivals[i],last:r.stars})).concat([{name:S.name,cuisine:cuisine().adj,buzz:S.buzz,you:true,last:null}]);
  return all.sort((a,b)=>b.buzz-a.buzz||(a.you?-1:1));
}
const rank=()=>cityTable().findIndex(x=>x.you)+1;
const ord=n=>n+(n%100>10&&n%100<14?'th':['th','st','nd','rd'][n%10]||'th');

/* ---------- a Friday service ---------- */
function startService(){
  S.parties=[];S.door=[];S.kq=[];S.pass=[];S.clock=0;S.served=0;S.walked=0;S.covers=0;S.starSum=0;S.take=0;S.food=0;S.auto=0;
  S.reviews=[];S.did={};S.seen.clear();S.inspSeen=false;S.buzzStart=S.buzz;S.tillStart=S.till;S.scoresStart=S.scores.length;
  S.tables=Array.from({length:tableCount()},()=>({pid:null,dirty:false,clearAt:Infinity}));
  S.stations=crew().map(cook=>({cook,job:null,t:0,dur:0}));
  planNight();
  $('#hint').hidden=S.week>0;
  hide();drawDoor();drawRoom();drawPass();drawKitchen();hud();clockHud();
  S.mode='play';last=performance.now();
}
function endService(){if(S.mode!=='play')return;S.mode='ending';snd('ding');setTimeout(lastOrders,700)}
// Week 1's hints: one line naming the next useful thing to do, until you've done each once.
function hints(){
  if(S.week>0)return;let h='';
  const st=S.tables.map((_,i)=>tableState(i));
  if(!S.did.seat&&S.door.length&&freeTable()>=0)h='Guests at the door. Tap them to seat them.';
  else if(!S.did.order&&st.some(x=>x.k==='order'))h=`Table ${st.findIndex(x=>x.k==='order')+1} is ready to order. Tap it.`;
  else if(!S.did.serve&&S.pass.length)h='Food\'s up! Tap the table (or the plates) to serve it.';
  else if(!S.did.bill&&st.some(x=>x.k==='bill'))h=`Table ${st.findIndex(x=>x.k==='bill')+1} wants the bill. Tap it to get paid.`;
  else if(!S.did.clear&&st.some(x=>x.k==='dirty'))h='Tap a dirty table to clear it for the next guests.';
  const el=$('#hint');if(el.textContent!==h)el.textContent=h;
}

/* ---------- screens ---------- */
function show(html){scr.innerHTML=`<div class="sc">${html}</div>`;scr.classList.add('show');scr.scrollTop=0;const b=scr.querySelector('.btn:not([disabled])');b&&b.focus({preventScroll:true})}
function hide(){scr.classList.remove('show');scr.innerHTML=''}
function recordBest(stars){
  const B=BEST.best||{},r=rank();
  const better=B.stars==null||stars>B.stars||(stars===B.stars&&(S.week>(B.week|0)||(S.week===B.week&&r<(B.rank||99))));
  if(better){BEST.best={stars,week:S.week,rank:r,name:S.name};saveBest()}
}
function bestLine(){
  const B=BEST.best;if(!B)return '';
  if(B.week>=WEEKS-1)return `Best: ${B.stars?`${B.stars} star${B.stars>1?'s':''} in the Quill Guide`:'no stars yet'}, ${ord(B.rank)} in town (${esc(B.name)})`;
  return `Best: reached week ${B.week+1} (${esc(B.name)})`;
}
function titleScreen(){
  S.mode='menu';const R=loadRun();
  show(`<div class="logo">${clocheSVG(pick(Object.keys(DISH)),0)}</div>
    <h1>Ink Cuisine</h1>
    <p class="tag">Hire a chef. Plan a menu. Win a star.</p>
    ${R?`<button class="btn" data-act="carry">Carry on: week ${R.week+1}</button><p class="kick soft">${esc(R.name)}, ${CUISINES[R.cuisine].adj.toLowerCase()}, ${VIBES[R.vibe].name.toLowerCase()}</p><button class="btn quiet" data-act="new">Open a new restaurant</button>`
      :`<button class="btn" data-act="new">Open a restaurant</button>`}
    <p class="best">${bestLine()}</p>
    <p class="ver">Version ${VERSION}${ONLINE?' · ':''}${feedbackLink()}</p>`);
  if(!RM){const box=scr.querySelector('.logo');let k=0;const icons=Object.keys(DISH);
    const lift=()=>{if(!box.isConnected)return;const lid=box.querySelector('.lid');
      lid.animate([{transform:'none'},{transform:'translateY(3px) scale(1.04,.94)',offset:.15},{transform:'translate(6px,-30px) rotate(8deg)',offset:.55},{transform:'translate(6px,-30px) rotate(8deg)',offset:.8},{transform:'none'}],{duration:2600,easing:'cubic-bezier(.3,.7,.3,1)'})
        .onfinish=()=>{if(!box.isConnected)return;box.innerHTML=clocheSVG(icons[++k%icons.length],0);setTimeout(lift,900)}};
    setTimeout(lift,700)}
}

/* ---------- setting up: name, cuisine, vibe, head chef, the team ---------- */
const STEPS=5;
function stepKick(n){return `<p class="kick">Step ${n+1} of ${STEPS+1}</p>`}
function optCard(act,i,on,inner){return `<button class="opt${on?' on':''}" data-act="${act}" data-i="${i}" aria-pressed="${on}">${inner}</button>`}
function statRow(label,n){return `<span class="dstat"><b>${label}</b>${pips(n)}</span>`}
function setupScreen(){
  S.mode='setup';const st=S.setup.step;
  const nav=(ok=true)=>`<button class="btn" data-act="next"${ok?'':' disabled'}>Next</button>${st?'<button class="btn quiet" data-act="back">Back</button>':'<button class="btn quiet" data-act="menu">Cancel</button>'}`;
  if(st===0){
    show(`${stepKick(0)}<h1>Name it</h1><p class="story">An empty dining room on a busy street, and a sign with nothing on it yet. What's it called?</p>
      <input id="rname-in" class="namein" maxlength="24" value="${esc(S.name)}" aria-label="Restaurant name" autocomplete="off" spellcheck="false">
      <button class="btn quiet" data-act="roll">Try another name</button>${nav()}`);
    const inp=$('#rname-in');inp.oninput=()=>{S.name=inp.value.trim()};
  }else if(st===1){
    show(`${stepKick(1)}<h1>The cuisine</h1><p class="story">What does ${esc(S.name)} cook?</p>
      <div class="opts">${CUISINES.map((c,i)=>optCard('pick',i,S.cuisine===i,`${dishSVG(c.icon,'ico big')}<div><b>${c.name}</b><span>${c.line}</span></div>`)).join('')}</div>${nav()}`);
  }else if(st===2){
    show(`${stepKick(2)}<h1>The vibe</h1><p class="story">How does it feel to walk in?</p>
      <div class="opts">${VIBES.map((v,i)=>optCard('pick',i,S.vibe===i,`<div class="vart">${tableSVG(v.k)}</div><div><b>${v.name}</b><span>${v.line}</span><small>${v.does}</small></div>`)).join('')}</div>${nav()}`);
  }else if(st===3){
    show(`${stepKick(3)}<h1>Head chef</h1><p class="story">You'll plan every menu together. Pick someone you can work with.</p>
      <div class="opts">${CHEFS.map((c,i)=>optCard('pick',i,S.chef===i,`${faceSVG(c.look,'happy',true,'face big')}<div><b>${c.name}</b><span>${c.bio}</span>
        ${statRow('Flair',c.flair)}${statRow('Skill',c.skill)}${statRow('Pace',c.pace)}
        <small>${c.spec?`Best at ${CUISINES.find(x=>x.k===c.spec).adj}${c.spec===cuisine().k?' ✓':''}`:'Cooks anything, a bit wildly'} · ${money(c.wage)} a week</small></div>`)).join('')}</div>${nav()}`);
  }else if(st===4){
    const cost=chef().wage+sous().wage+foh().wage+START.rent;
    show(`${stepKick(4)}<h1>The team</h1><p class="story">${chef().short} needs a sous chef in the kitchen, and someone has to run the floor.</p>
      <h2 class="grp">Sous chef</h2><div class="opts">${SOUS.map((c,i)=>optCard('sous',i,S.sous===i,`${faceSVG(c.look,'happy',false,'face big')}<div><b>${c.name}</b><span>${c.bio}</span>
        ${statRow('Skill',c.skill)}${statRow('Pace',c.pace)}<small>${money(c.wage)} a week</small></div>`)).join('')}</div>
      <h2 class="grp">Front of house</h2><div class="opts">${FOH.map((c,i)=>optCard('foh',i,S.foh===i,`${faceSVG(c.look,'happy',false,'face big')}<div><b>${c.name}</b><span>${c.bio}</span>
        ${statRow('Charm',c.charm)}${statRow('Pace',c.pace)}<small>${money(c.wage)} a week</small></div>`)).join('')}</div>
      <p class="till-big">Wages and rent: <b>${money(cost)}</b> a week<br>In the bank: <b>${money(S.till)}</b></p>
      <button class="btn" data-act="next">Plan the menu with ${chef().short}</button><button class="btn quiet" data-act="back">Back</button>`);
  }
}

/* ---------- the week ---------- */
function introScreen(){
  S.mode='intro';
  if(!S.news){rollNews()}
  S.morning=snapshot();saveRun(S.morning);
  const r=rank();
  show(`<p class="kick">Week ${S.week+1} of ${WEEKS} · Friday night</p><h1>${esc(S.name)}</h1>
    <p class="story">${S.news.t}</p>
    <div class="stats"><div><b>${Math.round(S.buzz)}</b><span>buzz</span></div><div><b>${ord(r)}</b><span>in town</span></div><div><b>${money(S.till)}</b><span>in the bank</span></div></div>
    <button class="btn" data-act="start">Open the doors</button>
    ${S.week===0?`<div class="howto"><h2>How to run the floor</h2>
      <p><b>Seat.</b> Guests wait at the door. Tap them (or a free table) to sit them down.</p>
      <p><b>Take orders.</b> When a table raises a hand, tap it. The kitchen starts cooking straight away.</p>
      <p><b>Serve.</b> A bell rings when a table's food is up. Tap the table or the plates on the pass before they go cold.</p>
      <p><b>Get paid.</b> Tap a table that wants the bill, then tap it again to clear it.</p>
      <p>Your front of house helps out, but slowly. Keep people waiting and they walk out to a rival.</p>
      <p><b>The Quill Guide.</b> Its inspector eats here in secret three times this season. They dine alone and take notes. Stars come out after week ${WEEKS}.</p></div>`:''}`);
}
function lastOrders(){
  S.mode='summary';
  const avg=S.served?S.starSum/S.served:0,db=S.buzz-S.buzzStart;
  const pickR=[...S.reviews].sort(()=>Math.random()-.5).slice(0,3);
  const quote=r=>{const k=Math.max(1,Math.min(5,Math.round(r.stars)));let pool=REVIEWS[k];
    if(k<=2&&r.cold)pool=[REVIEWS[2][1]];else if(k<=3&&r.slow)pool=[REVIEWS[2][0],REVIEWS[3][1]];else if(k<=3&&r.pricey)pool=[REVIEWS[2][2]];
    return pick(pool).replace('{d}',r.d.toLowerCase())};
  const insp=S.scores.length>S.scoresStart?S.scores[S.scores.length-1]:null;
  show(`<p class="kick">Week ${S.week+1}, ${clockText(S.clock)}</p><h1>Last orders</h1>
    <div class="stats"><div><b>${S.covers}</b><span>covers</span></div><div><b>${S.walked}</b><span>walked out</span></div><div><b>${avg?avg.toFixed(1):'–'}</b><span>stars on average</span></div></div>
    <p class="till-big">Buzz <b>${Math.round(S.buzz)}</b> <span class="delta">${db>=0?'+':'−'}${Math.abs(Math.round(db))}</span> · took <b>${money(S.take)}</b></p>
    <div class="reviews">${pickR.map(r=>`<div class="review">${starsHTML(Math.round(r.stars),5)}<p>“${esc(quote(r))}”</p><small>${esc(r.name)}${r.kind==='blog'?', food blogger':''}</small></div>`).join('')||'<p class="story">Nobody stayed long enough to say anything.</p>'}</div>
    ${insp?`<p class="story note">${insp.walked?'A guest dining alone gave up and left, still scribbling in a notebook. That didn\'t look good.':'A guest dining alone paid in cash, tucked a notebook away and slipped out without a word.'}</p>`:''}
    <button class="btn" data-act="books">Do the books</button>`);
}
function booksScreen(){
  S.mode='books';
  const w=wages(),rent=START.rent;S.till-=w+rent;
  const net=S.take-S.food-w-rent;
  S.weekWages=w;
  show(`<p class="kick">Week ${S.week+1}, after close</p><h1>The books</h1>
    <div class="ledger">
      <div><span>Takings</span><b>${money(S.take)}</b></div>
      <div><span>Ingredients</span><b>−${money(S.food).slice(1)}</b></div>
      <div><span>Wages</span><b>−${money(w).slice(1)}</b></div>
      <div><span>Rent</span><b>−${money(rent).slice(1)}</b></div>
      <div class="tot"><span>This week</span><b>${money(net)}</b></div>
      <div class="tot"><span>In the bank</span><b>${money(S.till)}</b></div>
    </div>
    ${S.till<0?`<button class="btn" data-act="broke">Uh oh</button>`
      :S.week===WEEKS-1?`<button class="btn" data-act="guide">The Quill Guide is out</button>`
      :`<button class="btn" data-act="office">To the office</button>`}`);
}
function brokeScreen(){
  recordBest(0);S.mode='end';
  show(`<p class="kick">Week ${S.week+1}</p><h1>The bank said no</h1>
    <p class="story">The wages bounced and the landlord changed the locks. ${chef().short} takes the good knives home. Maybe fewer wages, or higher prices?</p>
    <button class="btn" data-act="retry">Try week ${S.week+1} again</button><button class="btn quiet" data-act="menu">Back to the menu</button>
    <p class="ver">${feedbackLink()}</p>`);
}

/* ---------- the office between services ---------- */
function rumour(x){
  if(x.walked)return 'The inspector left before eating. That visit will count against you.';
  const f=x.food>=40?'adored the food':x.food>=30?'liked the food':x.food>=20?'found the food ordinary':'left half their plate';
  const s=x.service>=24?'the service was brisk':x.service>=16?'the service was fine':'they waited far too long';
  const r=x.room>=14?'loved the room':x.room>=8?'found the room pleasant':'thought the room felt tired';
  return `Word is the inspector ${f}, said ${s}, and ${r}.`;
}
function officeScreen(){
  S.mode='office';const c=chef(),last=S.scores.filter(x=>x.week===S.week).pop();
  show(`<p class="kick">Saturday morning, before week ${S.week+2}</p><h1>The office</h1>
    <p class="till-big">In the bank: <b>${money(S.till)}</b> · buzz <b>${Math.round(S.buzz)}</b> · ${ord(rank())} in town</p>
    ${last?`<p class="story note">${rumour(last)}</p>`:''}
    <div class="nav">
      <button class="navrow" data-act="menuboard">${faceSVG(c.look,'happy',true,'face')}<div><b>Menu with ${c.short}</b><span>${S.ideas} new idea${S.ideas===1?'':'s'} this week. Rework dishes and set prices.</span></div></button>
      <button class="navrow" data-act="hire"><i class="gl">${GLYPH.broom}</i><div><b>Hire and fit out</b><span>More tables, more hands, a nicer room.</span></div></button>
      <button class="navrow" data-act="city"><i class="gl">${GLYPH.note}</i><div><b>The city table</b><span>Who's got the buzz, and who the Quill Guide loved last year.</span></div></button>
    </div>
    <button class="btn" data-act="nextweek">On to week ${S.week+2}</button>`);
}
function hireScreen(){
  S.mode='hire';
  const row=u=>{
    const lvl=u.max?S.up[u.k]|0:S.up[u.k]?1:0,done=u.max?lvl>=u.max:!!lvl;
    const cost=u.costs?u.costs[lvl]:u.cost,what=u.k==='table'?`${u.does} You have ${tableCount()}.`:u.k==='decor'&&lvl?`${u.does} Done up ${lvl} of ${u.max} times.`:u.does;
    const label=u.wage?(cost?money(cost):'Hire'):money(cost);
    return `<div class="buy${done?' owned':''}"><div><b>${u.name}</b><span>${what}</span>${u.wage?`<em>${money(u.wage)} a week</em>`:''}</div>
      ${done?`<em>${u.wage?'On the team':'Done'}</em>`:`<button class="price" data-act="up" data-k="${u.k}"${S.till<(cost||0)?' disabled':''}>${label}</button>`}</div>`;
  };
  show(`<p class="kick">The office</p><h1>Hire and fit out</h1>
    <p class="till-big">In the bank: <b>${money(S.till)}</b> · wages <b>${money(wages())}</b> a week</p>
    <div class="buys">${UPGRADES.map(row).join('')}</div>
    <button class="btn" data-act="office">Back to the office</button>`);
}
function buy(k){
  const u=UPGRADES.find(x=>x.k===k);if(!u)return;
  const lvl=u.max?S.up[k]|0:S.up[k]?1:0;if(u.max?lvl>=u.max:lvl)return;
  const cost=u.costs?u.costs[lvl]:u.cost||0;if(S.till<cost)return;
  S.till-=cost;S.up[k]=u.max?lvl+1:true;snd('coin');hireScreen();
}
function cityScreen(){
  S.mode='city';const T=cityTable(),top=T[0].buzz||1;
  show(`<p class="kick">The city table</p><h1>Who's hot</h1>
    <div class="city">${T.map((x,i)=>`<div class="crow${x.you?' you':''}"><b class="rk">${i+1}</b><div><b>${esc(x.name)}</b><small>${esc(x.cuisine)}${x.last?` · ${x.last} star${x.last>1?'s':''} last year`:''}</small>
      <div class="bbar"><i style="width:${x.buzz/top*100}%"></i></div></div><b class="bz">${Math.round(x.buzz)}</b></div>`).join('')}</div>
    <p class="story">The Quill Guide comes out after week ${WEEKS}. Its inspector has eaten here ${S.scores.length} of 3 times so far${S.scores.length?'':' (as far as anyone knows)'}.</p>
    <button class="btn" data-act="office">Back to the office</button>`);
}

/* ---------- the Quill Guide ---------- */
function guideScreen(){
  S.mode='end';
  // any visit the inspector somehow didn't make counts as a quiet, middling meal
  const sc=S.scores.map(x=>x.score);while(sc.length<3)sc.push(40);
  const avg=sc.reduce((a,b)=>a+b,0)/sc.length+(rank()===1?4:rank()<=3?2:0);
  const stars=STAR_AT.filter(t=>avg>=t).length;
  const T=cityTable().map(x=>Object.assign(x,{stars:x.you?stars:RIVAL_STAR_AT.filter(t=>x.buzz>=t).length}))
    .sort((a,b)=>b.stars-a.stars||b.buzz-a.buzz);
  recordBest(stars);saveRun(null);
  const words=['No star this year. The inspector was polite, and that was all.','One star: "A very good restaurant. Worth a stop."','Two stars: "Excellent cooking. Worth a detour."','Three stars: "Exceptional. Worth a special journey."'][stars];
  show(`<p class="kick">This year's guide</p><h1>The Quill Guide</h1>
    <div class="bigstars">${starsHTML(stars)}</div>
    <p class="story"><b>${esc(S.name)}</b>. ${words}</p>
    <div class="city">${T.map(x=>`<div class="crow${x.you?' you':''}"><div><b>${esc(x.name)}</b><small>${esc(x.cuisine)}</small></div>${x.stars?starsHTML(x.stars,x.stars):'<small>–</small>'}</div>`).join('')}</div>
    <p class="kick soft">Inspections: ${sc.map(Math.round).join(', ')} out of 100.</p>
    <button class="btn" data-act="new">Open a new restaurant</button><button class="btn quiet" data-act="menu">Back to the menu</button>
    <p class="ver">${feedbackLink()}</p>`);
  const b=scr.querySelectorAll('.bigstars .star');
  b.forEach((s,i)=>{if(i<stars){setTimeout(()=>snd('star'),400+i*450);if(!RM)s.animate([{transform:'scale(0) rotate(-90deg)'},{transform:'scale(1.3) rotate(10deg)',offset:.7},{transform:'none'}],{duration:500,delay:400+i*450,fill:'backwards',easing:'cubic-bezier(.3,.7,.3,1)'})}});
}
function pauseScreen(){
  if(S.mode!=='play')return;S.mode='paused';
  show(`<h1>Paused</h1><p class="story">The kitchen holds its breath. The guests do too, for now.</p>
    <button class="btn" data-act="resume">Resume</button>
    <button class="btn quiet" data-act="retry">Restart week ${S.week+1}</button>
    <button class="btn quiet" data-act="sound">Sound: ${S.muted?'off':'on'}</button>
    <button class="btn quiet" data-act="menu">Quit to the menu</button>
    <p class="ver">${feedbackLink()}</p>`);
}

scr.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,i=+b.dataset.i;snd('pick');
  if(a==='new'){newSeason();setupScreen()}
  else if(a==='carry'){const R=loadRun();if(R){restore(R);introScreen()}else{newSeason();setupScreen()}}
  else if(a==='roll'){S.name=pick(NAME_IDEAS.filter(n=>n!==S.name));setupScreen()}
  else if(a==='next'){
    if(S.setup.step===0&&!S.name){toast('Give it a name first');return}
    if(S.setup.step===4){if(!S.setup.ideas){S.setup.ideas=1;S.ideas=ideasFor()+6}menuScreen('setup');return}
    S.setup.step++;setupScreen()}
  else if(a==='back'){if(b.dataset.to)S.setup.step=+b.dataset.to;else S.setup.step=Math.max(0,S.setup.step-1);setupScreen()}
  else if(a==='pick'){const k=['','cuisine','vibe','chef'][S.setup.step];if(k){S[k]=i;if(k==='cuisine')S.menu=MENU_SLOTS.map(()=>null);const top=scr.scrollTop;setupScreen();scr.scrollTop=top}}
  else if(a==='sous'||a==='foh'){S[a]=i;const top=scr.scrollTop;setupScreen();scr.scrollTop=top}
  else if(a==='ws')workshop(i);
  else if(a==='price')nudgePrice(i,+b.dataset.d);
  else if(a==='accept')wsAccept();
  else if(a==='push')wsPush();
  else if(a==='another')wsAnother();
  else if(a==='wsback'){S.ws=null;menuScreen()}
  else if(a==='opening'){S.setup=null;S.ideas=0;introScreen()}
  else if(a==='start')startService();
  else if(a==='books')booksScreen();
  else if(a==='broke')brokeScreen();
  else if(a==='guide')guideScreen();
  else if(a==='office'){if(S.mode==='books'){S.ideas=ideasFor()}officeScreen()}
  else if(a==='menuboard')menuScreen('office');
  else if(a==='hire')hireScreen();
  else if(a==='up')buy(b.dataset.k);
  else if(a==='city')cityScreen();
  else if(a==='nextweek'){S.week++;S.ideas=0;S.news=null;rivalsWeek();introScreen()}
  else if(a==='retry'){restore(S.morning);startService()}
  else if(a==='resume'){hide();S.mode='play';last=performance.now()}
  else if(a==='sound'){S.muted=!S.muted;BEST.muted=S.muted;saveBest();b.textContent='Sound: '+(S.muted?'off':'on')}
  else if(a==='menu')titleScreen();
  else if(a==='feedback')showFeedback();
});

/* ---------- loop and startup ---------- */
let last=performance.now(),hintT=0;
function loop(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(S.mode==='play'){S.clock+=dt;tickService(dt);if((hintT+=dt)>.4){hintT=0;hints()}}
  requestAnimationFrame(loop);
}
function start(){
  $('#pauseBtn').addEventListener('click',pauseScreen);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseScreen()});
  newSeason();
  requestAnimationFrame(loop);
  titleScreen();
}
