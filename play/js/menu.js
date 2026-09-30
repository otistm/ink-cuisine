/* Ink Cuisine: planning the menu with the head chef. The menu board lists six dishes (two starters, three mains,
   a dessert) with their prices. Tapping one opens the workshop: the chef pitches a dish, and you put it on the menu,
   ask them to push it further (a twist, which can flop) or ask for something else. Each idea after the first costs
   one of the chef's ideas for the week (ideasFor). */
"use strict";

/* ---------- the menu board ---------- */
function pips(n,of=10){let o='';for(let i=0;i<of;i++)o+=`<i class="${i<n?'on':''}"></i>`;return `<span class="pips" aria-label="${n} of ${of}">${o}</span>`}
function dishStats(d){return `<span class="dstat"><b>Taste</b>${pips(d.taste)}</span><span class="dstat"><b>Wow</b>${pips(d.wow)}</span>`}
function menuScreen(from){
  S.menuFrom=from||S.menuFrom;S.mode='menuboard';
  const setup=S.menuFrom==='setup',full=S.menu.every(Boolean),c=chef();
  const rows=MENU_SLOTS.map((course,i)=>{
    const d=S.menu[i];
    if(!d)return `<button class="mrow empty" data-act="ws" data-i="${i}"><small>${COURSE_NAME[course]}</small><b>Plan this with ${c.short}</b><span>Tap to hear an idea</span></button>`;
    const fair=fairPrice(d),v=valueOf(d);
    return `<div class="mrow"><small>${COURSE_NAME[course]}</small>
      <div class="mdish">${dishIcon(d,'ico big')}<div><b>${esc(d.name)}</b>${dishStats(d)}<em>Costs ${money(d.cost)} a plate · fair price ${money(fair)}</em></div></div>
      <div class="mprice"><button class="pm" data-act="price" data-i="${i}" data-d="-1" aria-label="Lower the price">−</button>
        <span><b>${money(d.price)}</b><em class="v-${v.split(' ').pop().toLowerCase()}">${v}</em></span>
        <button class="pm" data-act="price" data-i="${i}" data-d="1" aria-label="Raise the price">+</button>
        <button class="linkbtn" data-act="ws" data-i="${i}">Rework</button></div></div>`;
  }).join('');
  show(`<p class="kick">${setup?'Before opening night':'Saturday morning'}</p><h1>The menu</h1>
    <div class="chefline">${faceSVG(c.look,'happy',true)}<p>${setup?`${c.short} has ${S.ideas} ideas to play with. Plan all six dishes, then set the prices.`
      :`${c.short} has ${S.ideas} new idea${S.ideas===1?'':'s'} this week. Rework a dish, or nudge the prices.`}</p></div>
    <div class="menuboard">${rows}</div>
    <p class="kick soft">Guests order less of anything priced above fair, and grumble about it.</p>
    <button class="btn" data-act="${setup?'opening':'office'}"${full?'':' disabled'}>${setup?'Open the doors':'Back to the office'}</button>
    ${setup?'<button class="btn quiet" data-act="back" data-to="4">Back to the team</button>':''}`);
}
function nudgePrice(i,d){const x=S.menu[i];if(!x)return;x.price=clamp(x.price+d,2,99);const top=scr.scrollTop;menuScreen();scr.scrollTop=top}

/* ---------- the workshop ---------- */
// A fresh pitch for a slot: one the chef hasn't pitched in this sitting, and not already on the menu.
function pitch(){
  const W=S.ws,course=MENU_SLOTS[W.i],C=cuisine(),n=C[course].length;
  const onMenu=S.menu.map((d,k)=>k!==W.i&&d&&d.c===course?d.i:-1);
  let pool=[...Array(n).keys()].filter(i=>!W.seen.includes(i)&&!onMenu.includes(i));
  if(!pool.length){W.seen=[];pool=[...Array(n).keys()].filter(i=>!onMenu.includes(i)&&(!W.cur||i!==W.cur.i))}
  if(!pool.length)pool=[...Array(n).keys()];
  const i=pick(pool);W.seen.push(i);
  W.cur=makeDish(S.cuisine,course,i,chef());
  W.line=pick(chef().say).replace('{d}',`<b>${esc(W.cur.name)}</b>`);
}
function workshop(i){
  S.ws={i,seen:[],cur:null,line:'',free:true};pitch();workshopScreen();
}
function workshopScreen(){
  S.mode='workshop';const W=S.ws,d=W.cur,c=chef(),old=S.menu[W.i],course=MENU_SLOTS[W.i];
  const canIdea=S.ideas>0,canPush=canIdea&&d.tw<0;
  show(`<p class="kick">${COURSE_NAME[course]} · with ${c.short}</p>
    <div class="pitch">${faceSVG(c.look,W.flop?'meh':'happy',true,'face big')}<div class="bubble"><p>${W.line}</p></div></div>
    <div class="dcard">${dishIcon(d,'ico hero')}<h2>${esc(d.name)}</h2>${dishStats(d)}
      <p class="dmeta">Cooks in ${d.time} min · costs ${money(d.cost)} a plate · worth about ${money(fairPrice(d))}${old?`<br>Now on the menu: ${esc(old.name)} (taste ${old.taste}, wow ${old.wow})`:''}</p></div>
    <button class="btn" data-act="accept">Put it on the menu</button>
    <div class="wsbtns">
      <button class="btn quiet" data-act="push"${canPush?'':' disabled'}>${d.tw>=0?'That\'s as far as it goes':'Push it further'}</button>
      <button class="btn quiet" data-act="another"${canIdea?'':' disabled'}>Something else</button>
    </div>
    <p class="kick soft">${S.ideas?`${S.ideas} idea${S.ideas===1?'':'s'} left.`:`No ideas left. ${c.short} needs a rest.`} Pushing it adds a twist; ${c.short}'s flair decides if it lands.</p>
    <button class="btn quiet" data-act="wsback">${old?'Keep '+esc(old.name):'Back to the menu'}</button>`);
  const card=scr.querySelector('.dcard');if(card&&!RM)card.animate([{transform:'scale(.9,1.1)',opacity:.3},{transform:'scale(1.03,.97)',opacity:1,offset:.6},{transform:'none'}],{duration:380,easing:'cubic-bezier(.3,.7,.3,1)'});
}
function wsPush(){
  const W=S.ws,c=chef();if(S.ideas<=0||W.cur.tw>=0)return;S.ideas--;
  const ok=Math.random()<.25+c.flair*.07,C=cuisine(),tw=rnd(0,C.twists.length-1);
  W.cur=makeDish(S.cuisine,W.cur.c,W.cur.i,c,tw,!ok);W.flop=!ok;
  W.line=ok?`${pick(c.push)} <b>${esc(W.cur.name)}</b>.`:`${pick(c.fail)}`;
  snd(ok?'idea':'flop');workshopScreen();
}
function wsAnother(){
  if(S.ideas<=0)return;S.ideas--;S.ws.flop=false;
  const c=chef();pitch();S.ws.line=`${pick(c.no)} ${S.ws.line}`;snd('idea');workshopScreen();
}
function wsAccept(){
  const W=S.ws,d=W.cur;d.price=fairPrice(d);S.menu[W.i]=d;
  const c=chef();snd('serve');toast(pick(c.yes));S.ws=null;menuScreen();
}
