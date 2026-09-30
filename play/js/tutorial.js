/* Ink Cuisine: the soft opening. A friends-and-family night before week 1, with your head chef as coach: seat a party,
   take their order, watch the kitchen, serve from the pass, take the bill, clear the table, then run two tables alone,
   one of them a guest with a notebook. No pressure: nobody loses patience, the front of house leaves it to you,
   plates never go cold. Nothing carries over: the season goes back to its start afterwards.
   The game reports what just happened with coach(event): seat, order, cooked, serve, bill, clear, plus tick. S.tut is {i, on}. */
"use strict";
/* Each step: when (the event that shows it; none = right after the previous one), until (the event that moves on,
   or 'next' / 'finish' for explanations closed with the x), target (what to ring; a selector, or a function giving one),
   pos (top or bottom of the screen), show (something to set up as the step appears), ready (true once the step is done
   anyway, checked a few times a second, so doing things out of order never leaves the tutorial stuck). */
const tutFirst=()=>S.parties[0];
const stageOf=p=>p?p.stage:'';
const tableOf=p=>p&&p.table>=0?`.table[data-t="${p.table}"]`:'';
const TUT=[
  {until:'next',pos:'top',text:()=>`Welcome to ${esc(S.name)}! Before the real opening, a soft opening: friends and family only, and nobody in a hurry. Let's walk through a service.`},
  {until:'seat',pos:'bottom',target:'.guest',ready:()=>tutFirst()&&stageOf(tutFirst())!=='door',show:()=>tutParty('Mum and Dad',2),
    text:()=>`Guests wait at the door. Tap them to sit them at a free table.`},
  {when:'seat',until:'order',pos:'bottom',target:()=>tableOf(tutFirst()),ready:()=>tutFirst().dishes.length>0,
    text:()=>`They read the menu first. When a hand goes up, tap the table to take their order.`},
  {when:'order',until:'cooked',pos:'top',target:'.kitchen',ready:()=>S.pass.length>0||stageOf(tutFirst())!=='wait',
    text:()=>`Orders go straight to the kitchen. ${chef().short} and ${sous().short} each cook one dish at a time. Watch the bars fill.`},
  {when:'cooked',until:'serve',pos:'top',target:'.pass .order',ready:()=>['eat','bill','gone'].includes(stageOf(tutFirst())),
    text:()=>`Hear the bell? Food's up on the pass. Tap the table, or the plates, to serve it. On a real night, plates go cold if they wait.`},
  {when:'serve',until:'bill',pos:'top',target:()=>tableOf(tutFirst()),ready:()=>stageOf(tutFirst())==='gone',
    text:()=>`Let them eat. When they want the bill, the table bobs again. Tap it to get paid.`},
  {when:'bill',until:'next',pos:'top',target:'.till',
    text:()=>`Every guest pays and leaves a review. Good reviews build buzz, and buzz brings bigger crowds. Keep people waiting and they walk out to a rival.`},
  {until:'clear',pos:'top',target:'.table.t-dirty',ready:()=>!S.tables.some(T=>T.dirty),
    text:()=>`They left a mess. Tap the table to clear it, so it's ready for the next guests.`},
  {when:'clear',until:'next',pos:'bottom',target:'.door',show:()=>{tutParty('The neighbours',3);setTimeout(()=>S.tut&&tutParty('A quiet guest',1,'insp'),900)},
    text:()=>`Here come the neighbours, and someone dining alone with a notebook. That's how the Quill Guide's inspector looks. Treat them very well.`},
  {until:'done',pos:'bottom',ready:()=>S.parties.length>=3&&S.parties.every(p=>p.stage==='gone')&&!S.tables.some(T=>T.dirty),
    text:()=>`Now you run it: seat them, take orders, serve, bill and clear. Busy tables bob, so you always know who needs you.`},
  {until:'finish',pos:'top',text:()=>`Well done! That's a service. Next Friday is the real thing: a full room, and the Quill Guide somewhere in it.`},
];
function tutParty(name,size,kind=''){
  const p=makeParty(kind);
  if(!kind){p.size=size;p.looks=Array.from({length:size},randomLook)}
  p.name=name;setStage(p,'door',30);S.parties.push(p);S.door.push(p.id);snd('ding');drawDoor();
}
function startTutorial(){
  hide();leaveTutorial();
  S.morning=snapshot();saveRun(S.morning);
  S.tut={i:0,on:false};
  startService();S.arrivals=[];$('#hint').hidden=true;
  setTimeout(()=>coach('start'),500);
}
function finishTutorial(){
  hideCoach();S.tut=null;BEST.tutDone=true;saveBest();
  restore(S.morning);introScreen();
}
function leaveTutorial(){hideCoach();S.tut=null}

/* ---------- the chef's bubble ---------- */
function hideCoach(){const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'))}
// How long a tip stays up before its ring turns into the close button: longer tips get more reading time.
const readMs=text=>Math.max(2600,Math.min(7000,1400+text.split(/\s+/).length*190));
const XSVG='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>';
// The bubble lets taps through, so it never blocks the room underneath; only its own buttons take taps.
function bubble(text,o){
  hideCoach();
  const dur=RM?1200:readMs(text);
  const c=document.createElement('div');c.id='coach';c.className='coach at-'+(o.pos||'top');c.setAttribute('role','status');c.setAttribute('aria-live','polite');
  c.innerHTML=`${faceSVG(chef().look,'happy',true)}<div class="coach-body"><small>${o.label}</small><p>${text}</p><div class="coach-btns">${o.links||''}</div></div>
    <span class="ctimer" style="--dur:${dur}ms" aria-hidden="true"><svg viewBox="0 0 28 28"><circle class="track" cx="14" cy="14" r="11"/><circle class="prog" cx="14" cy="14" r="11" pathLength="100"/></svg></span>`;
  document.body.appendChild(c);
  highlight(o.target);
  c._t=setTimeout(()=>{if(!c.isConnected)return;
    const t=c.querySelector('.ctimer'),x=document.createElement('button');
    x.className='cx';x.setAttribute('aria-label','Close tip');x.innerHTML=XSVG;x.onclick=o.onClose;
    t.classList.add('out');setTimeout(()=>t.isConnected&&t.replaceWith(x),180)},dur);
  return c;
}
function highlight(target){
  document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));
  const sel=typeof target==='function'?target():target;
  if(!sel)return;const el=document.querySelector(sel);if(el)el.classList.add('coach-hi');
}
// again: the tip is coming back after a pause, so don't set its step up a second time
function showStep(again){
  const T=S.tut,st=TUT[T.i];T.on=true;
  if(!again&&st.show)st.show();
  const u=st.until;
  // closing: explanations move on, the last one finishes, and action steps just tuck the tip away until you do the thing
  const onClose=u==='finish'?()=>{snd('pick');finishTutorial()}:u==='next'?()=>{snd('pick');advance()}:()=>{const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}};
  const c=bubble(st.text(),{pos:st.pos,target:st.target,label:`${esc(chef().short)} · ${T.i+1} of ${TUT.length}`,onClose,
    links:u==='finish'?'':`<button class="linkbtn" data-c="skip">Skip to week 1</button>`});
  const sk=c.querySelector('[data-c=skip]');if(sk)sk.onclick=()=>{snd('pick');finishTutorial()};
  // the ring stays on its target as the screen redraws
  requestAnimationFrame(()=>highlight(st.target));
}
function advance(ev){
  const T=S.tut;hideCoach();T.i++;T.on=false;const nx=TUT[T.i];
  if(nx&&(!nx.when||nx.when===ev))setTimeout(()=>{if(S.tut&&!S.tut.on&&TUT[S.tut.i]===nx)showStep()},350);
}
function coach(ev){
  if(!S.tut)return;
  const T=S.tut,st=TUT[T.i];if(!st)return;
  if(T.on){if(st.until===ev||(ev==='tick'&&st.ready&&st.ready()))advance(st.until);return}
  if(ev!=='tick'&&(!st.when||st.when===ev))showStep();
}
// Redraws replace the tables, guests and plates, so put the ring back after each one.
function coachRedraw(){
  if(!S.tut)return;
  const st=TUT[S.tut.i];if(S.tut.on&&st&&st.target)highlight(st.target);
}
