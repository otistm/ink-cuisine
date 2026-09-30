/* Ink Cuisine: small helpers, saved progress, the game state S, and how a dish's stats and fair price are worked out. */
"use strict";
const $=s=>document.querySelector(s);
const app=$('#app'),door=$('#door'),room=$('#room'),passEl=$('#pass'),kitchen=$('#kitchen'),fx=$('#fx'),scr=$('#screen');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const haptic=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const money=n=>(n<0?'-$':'$')+Math.abs(Math.round(n));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// inkcuisine: {best:{stars,week,rank,name}, muted}. inkcuisine-run: the season in progress, saved at the start of each week.
// Never rename or remove a field here; add new ones with defaults.
let BEST={};
try{BEST=JSON.parse(localStorage.getItem('inkcuisine')||'{}')||{}}catch(e){BEST={}}
function saveBest(){try{localStorage.setItem('inkcuisine',JSON.stringify(BEST))}catch(e){}}
function loadRun(){try{const r=JSON.parse(localStorage.getItem('inkcuisine-run')||'null');return r&&r.v===1&&r.week<WEEKS&&r.menu&&r.menu.length===MENU_SLOTS.length?r:null}catch(e){return null}}
function saveRun(r){try{r?localStorage.setItem('inkcuisine-run',JSON.stringify(r)):localStorage.removeItem('inkcuisine-run')}catch(e){}}

const S={mode:'menu',week:0,name:'',cuisine:0,vibe:0,chef:0,sous:0,foh:0,menu:[],till:0,buzz:0,rivals:[],up:{},insp:[],scores:[],earned:0,
  news:null,ideas:0,muted:!!BEST.muted,seen:new Set()};
// The parts of S that make up a season in progress, copied so a lost week can be replayed from its start.
function snapshot(){return JSON.parse(JSON.stringify({v:1,week:S.week,name:S.name,cuisine:S.cuisine,vibe:S.vibe,chef:S.chef,sous:S.sous,foh:S.foh,
  menu:S.menu,till:S.till,buzz:S.buzz,rivals:S.rivals,up:S.up,insp:S.insp,scores:S.scores,earned:S.earned,news:S.news,ideas:S.ideas}))}
function restore(r){
  S.week=r.week|0;S.name=r.name||'Ink Cuisine';S.cuisine=r.cuisine|0;S.vibe=r.vibe|0;S.chef=r.chef|0;S.sous=r.sous|0;S.foh=r.foh|0;
  S.menu=(r.menu||[]).map(d=>Object.assign({},d));S.till=r.till|0;S.buzz=r.buzz??START.buzz;
  S.rivals=RIVALS.map((x,i)=>r.rivals&&r.rivals[i]!=null?r.rivals[i]:x.buzz);
  S.up=Object.assign({table:0,decor:0},r.up||{});S.insp=(r.insp||[]).slice();S.scores=(r.scores||[]).map(x=>Object.assign({},x));
  S.earned=r.earned|0;S.news=r.news?Object.assign({},r.news):null;S.ideas=r.ideas|0;
}
// Who's working, and the room they're working in.
const cuisine=()=>CUISINES[S.cuisine],vibe=()=>VIBES[S.vibe],chef=()=>CHEFS[S.chef],sous=()=>SOUS[S.sous],foh=()=>FOH[S.foh];
const tableCount=()=>START.tables+(S.up.table|0);
function crew(){const c=[Object.assign({role:'Head chef'},chef()),Object.assign({role:'Sous chef'},sous())];if(S.up.line)c.push(Object.assign({role:'Line cook'},LINE_COOK));return c}
function wages(){return chef().wage+sous().wage+foh().wage+UPGRADES.reduce((a,u)=>a+(u.wage&&S.up[u.k]?u.wage:0),0)}
function ideasFor(c=chef()){return 2+Math.floor(c.flair/2)}

/* ---------- dishes ---------- */
// A dish on the menu keeps its own numbers, worked out when the chef first cooked it for you.
function makeDish(ci,course,i,c,tw=-1,fail=false){
  const C=CUISINES[ci],b=C[course][i],t=tw>=0?C.twists[tw]:null;
  const bonus=Math.round((c.skill-6)*.5)+(c.spec===C.k?1:0),flair=Math.round((c.flair-5)*.35);
  let taste=b[2]+bonus+(t?t[1]:0),wow=b[3]+flair+(t?t[2]:0);
  if(fail){taste-=2;wow-=1}
  return{c:course,i,tw,fail:!!fail,icon:b[1],name:t?`${b[0]} ${t[0]}`:b[0],taste:clamp(taste,1,10),wow:clamp(wow,0,10),
    time:b[4]+(t?t[3]:0),cost:b[5]+(t?t[4]:0),price:0};
}
// What a guest in this room thinks the dish is worth.
function fairPrice(d){return Math.max(4,Math.round((d.cost*2+d.taste*1.6+d.wow*1.2)*vibe().price))}
function valueOf(d){const r=d.price/fairPrice(d);return r<.85?'A steal':r<=1.06?'Fair':r<=1.25?'Pricey':'Steep'}
// How good a plate of it is, as a guest in this room judges it.
const quality=(d,cook)=>d.taste+(cook?(cook.skill-6)*.3:0)+d.wow*vibe().wowW;
// Seconds on the stove for a given cook.
const cookTime=(d,cook)=>d.time*.62/(.55+cook.pace*.09);
const dishIcon=(d,cls='ico')=>dishSVG(d.icon,cls);
