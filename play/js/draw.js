/* Ink Cuisine: every face, dish, table, star and the cloche, as ink SVG.
   Shading is hatching, dots and stripes, never color. Faces draw in a 40 × 50 box, dishes in 40 × 40, tables in 120 × 72. */
"use strict";
const INK='var(--ink)',PAPER='var(--paper)';
const FILLS={paper:PAPER,dots:'url(#dots)',hatch:'url(#hatch)',stripes:'url(#stripes)',ink:INK,none:'none'};
const sh=(d,f,sw)=>`<path d="${d}" style="fill:${FILLS[f]||f};stroke:${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ln=(d,sw)=>`<path d="${d}" style="fill:none;stroke:${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" style="fill:${INK}"/>`;
const circ=(x,y,r,f,sw)=>`<circle cx="${x}" cy="${y}" r="${r}" style="fill:${FILLS[f]||f};stroke:${INK}" stroke-width="${sw}"/>`;
const ell=(x,y,rx,ry,rot,f,sw)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" style="fill:${FILLS[f]||f};stroke:${INK}" stroke-width="${sw}"/>`;
const r1=n=>Math.round(n*10)/10;

/* ---------- faces ---------- */
// look: {hair, glasses, beard, mustache, earrings, dot}. mood: happy, meh, grr. toque: a chef's hat.
const HAIRS=['crop','bun','curls','flat','long','beehive','bob','cap','bald'];
function hairBack(h){
  if(h==='long')return sh('M7.5 42 Q5 15 20 13.5 Q35 15 32.5 42 Q29 43 27 40 L13 40 Q11 43 7.5 42 Z','ink',2);
  if(h==='bob')return sh('M8 36 Q5.5 14 20 13.5 Q34.5 14 32 36 Q27 37.5 26 34 L14 34 Q13 37.5 8 36 Z','ink',2);
  if(h==='beehive')return ell(20,9,9.5,10,0,'hatch',2);
  return '';
}
function hairTop(h){
  const cap='M8.3 25 Q8.5 13 20 13 Q31.5 13 31.7 25 Q27 18.5 20 19 Q13 18.5 8.3 25 Z';
  if(h==='crop'||h==='long'||h==='beehive')return sh(cap,'ink',2);
  if(h==='bob')return sh('M8.3 25 Q8.5 13 20 13 Q31.5 13 31.7 25 L31.7 22 Q20 23 14 18 Q12 22 8.3 25 Z','ink',2);
  if(h==='flat')return sh(cap,'hatch',2);
  if(h==='bun')return circ(20,10,4.6,'ink',2)+sh(cap,'ink',2);
  if(h==='curls'){let o='';for(let i=0;i<9;i++){const a=Math.PI*(1.05+i*.1125);o+=circ(r1(20+Math.cos(a)*11.5),r1(25+Math.sin(a)*11.5),3.9,'paper',1.8)}return o}
  if(h==='cap')return sh('M8.5 22 Q9 12 20 12 Q31 12 31.5 22 Z','stripes',2)+ln('M28 21.5 Q34 20.5 38 22.5',2.4);
  return '';
}
function toqueSVG(){
  return sh('M10 17 Q4 12 9 6 Q11 0 17 2 Q20 -3 24 2 Q30 0 31 6 Q36 12 30 17 Z','paper',2)+sh('M10.5 14.5 H29.5 V19 H10.5 Z','paper',2)+ln('M15 8 V13 M20 6 V13 M25 8 V13',1.3);
}
function faceSVG(look={},mood='happy',toque=false,cls='face'){
  const h=toque?'none':look.hair||'crop';
  const mouth=mood==='grr'?ln('M15 34 Q20 30 25 34',2):mood==='meh'?ln('M15.5 32.5 H24.5',2):ln('M14.5 30.5 Q20 35.5 25.5 30.5',2);
  const brows=mood==='grr'?ln('M12.5 21 L17 22.8 M27.5 21 L23 22.8',1.8):'';
  return `<svg class="${cls}" viewBox="0 -4 40 50" aria-hidden="true">${hairBack(h)}${circ(20,26,12,'paper',2)}
    ${look.earrings?circ(7.6,30,1.8,'paper',1.4)+circ(32.4,30,1.8,'paper',1.4):''}
    ${dot(15.5,25.5,1.6)}${dot(24.5,25.5,1.6)}${brows}${look.dot?dot(20,20.5,1):''}
    ${look.beard?sh('M8.4 27 Q9 40.5 20 40.5 Q31 40.5 31.6 27 Q27.5 34.5 20 34.5 Q12.5 34.5 8.4 27 Z','hatch',1.8):''}
    ${mouth}${look.mustache?sh('M14.5 30 Q17.5 27.5 20 29.4 Q22.5 27.5 25.5 30 Q22 31.4 20 30.5 Q18 31.4 14.5 30 Z','ink',1):''}
    ${look.glasses?circ(15.5,25.5,3.6,'none',1.6)+circ(24.5,25.5,3.6,'none',1.6)+ln('M19.1 25.3 H20.9',1.6):''}
    ${toque?toqueSVG():hairTop(h)}</svg>`;
}
function randomLook(){
  return{hair:pick(HAIRS),glasses:Math.random()<.22,beard:Math.random()<.14,mustache:Math.random()<.1,earrings:Math.random()<.2};
}

/* ---------- dishes, on a plate, in a 40 × 40 box ---------- */
const plate=(sw=2)=>ell(20,31,17.5,6.5,0,'paper',sw)+ell(20,30.4,11,3.6,0,'none',sw*.55);
const DISH={
  soup:()=>sh('M6.5 21 Q7 33.5 20 33.5 Q33 33.5 33.5 21 Z','paper',2)+ell(20,21,13.5,3.4,0,'hatch',2)+ln('M15 16 q-2 -3 0 -6 q2 -3 0 -6 M24 16 q-2 -3 0 -6 q2 -3 0 -6',1.4),
  salad:()=>plate()+ell(13,25,6,3.4,-20,'paper',1.8)+ell(27,25,6,3.4,20,'paper',1.8)+ell(20,23,6.5,3.8,0,'hatch',1.8)+ell(16,21,4.4,2.6,-35,'paper',1.6)+ell(24,21,4.4,2.6,35,'paper',1.6)+circ(20,19,2.4,'ink',1),
  steak:()=>plate()+sh('M7 27 Q6 19 15 18.5 Q24 16 30 20 Q35 24 30 28.5 Q20 32 12 30.5 Q7.5 30 7 27 Z','hatch',2)+ln('M13 21 L10 27 M19 20 L16 28 M25 20 L22 28',1.6)+ell(31,18,3.5,1.8,-30,'paper',1.4)+ln('M28.5 20 L33 16.5',1.2),
  fish:()=>plate()+sh('M6.5 25 Q14 16.5 26 23 L33 18.5 Q31.5 25 33 31.5 L26 27 Q14 33.5 6.5 25 Z','paper',2)+ln('M13 22.5 q2 2.5 0 5 M17 21.8 q2 3.2 0 6.4 M21 22 q2 3 0 6',1.3)+dot(10,24.2,1.1)+ell(19,17.5,4,1.7,-15,'paper',1.3),
  pasta:()=>plate()+ell(20,24,11,6.5,0,'paper',2)+ln('M11 24 q4 -6 9 -2 q5 4 9 -2 M12 27 q4 -4 8 0 q5 3 8 -2 M14 21 q5 -3 10 1',1.3)+ell(22,19,3.4,1.8,-25,'hatch',1.3)+dot(15,22,1)+dot(26,26,1),
  sushi:()=>plate()+[9.5,20,30.5].map(x=>sh(`M${x-5} 29 Q${x-5.5} 23.5 ${x} 23.5 Q${x+5.5} 23.5 ${x+5} 29 Z`,'dots',1.6)+sh(`M${x-6.5} 25 Q${x} 18 ${x+6.5} 23.5 Q${x} 23.5 ${x-6.5} 25 Z`,'stripes',1.6)).join(''),
  bowl:()=>sh('M6 21 Q6.5 33.5 20 33.5 Q33.5 33.5 34 21 Z','paper',2)+sh('M8 21 Q10 13.5 20 14 Q30 13.5 32 21 Z','dots',1.8)+ell(20,21,14,2.4,0,'paper',2)+ln('M24 6 L31 20 M28 5 L33 19',1.6),
  taco:()=>plate()+sh('M7 27 Q7.5 13 20 13 Q32.5 13 33 27 Z','paper',2)+sh('M9 24 Q10 17 13 19.5 Q15 15 18 18.5 Q20 14.5 23 18.5 Q26 15.5 27.5 19.5 Q31 17.5 31 24 Z','hatch',1.6)+ln('M7 27 H33',2),
  tart:()=>plate()+sh('M8 28 L33 22 L22 13 Z','hatch',2)+sh('M8 28 L33 22 L33 25.5 L8 31.5 Z','stripes',1.8)+ell(25,14.5,2.2,1.4,-20,'paper',1.2),
  dumpling:()=>plate()+[[11,26],[29,26],[20,22]].map(([x,y])=>sh(`M${x-7} ${y+3} Q${x} ${y-9} ${x+7} ${y+3} Q${x} ${y+5} ${x-7} ${y+3} Z`,'paper',1.8)+ln(`M${x-3} ${y-2} l1 2 M${x} ${y-3} v2.6 M${x+3} ${y-2} l-1 2`,1.2)).join(''),
  cake:()=>plate()+sh('M8 29 L31 29 L31 17 L8 22 Z','paper',2)+ln('M8 25.6 L31 22.8 M8 26.2 L31 25.6',1.2)+sh('M8 22 L31 17 L31 19.5 L8 24 Z','ink',1.2)+circ(24,14.6,2.6,'hatch',1.6)+ln('M24 12 q1 -3 4 -4',1.2),
  scoop:()=>sh('M9 22 L31 22 Q30 30 20 30 Q10 30 9 22 Z','paper',2)+ln('M20 30 V35 M14 36 H26',2)+circ(15,17.5,5.3,'dots',1.8)+circ(25,17.5,5.3,'paper',1.8)+circ(20,12.5,5.3,'hatch',1.8),
  bird:()=>plate()+sh('M7 26 Q6 15 19 14.5 Q31 14 32 24 Q31 29.5 20 29.5 Q8 29.5 7 26 Z','hatch',2)+ln('M9 19 L4.5 14.5 M30 19 L35 14',2.2)+circ(4,14,1.6,'paper',1.4)+circ(35.5,13.5,1.6,'paper',1.4)+ln('M14 19 q6 -3 12 0',1.2),
  bread:()=>plate()+sh('M6.5 25 Q6 18 14 18 L27 17.5 Q34 17.5 33.5 24 Q33 28.5 26 28.5 L13 28.5 Q7 28.5 6.5 25 Z','paper',2)+ln('M12 21 l3 4 M18 20.5 l3 4 M24 20.5 l3 4',1.6)+ell(20,27.5,11,1.6,0,'hatch',1),
  shell:()=>plate()+[[11,24],[20,20],[29,24]].map(([x,y])=>circ(x,y,5.5,'paper',1.8)+ln(`M${x} ${y} m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0`,1.2)).join(''),
  skewer:()=>plate()+ln('M5 30 L35 16',2)+[[11,27],[18,24],[25,20.5]].map(([x,y],i)=>ell(x,y,4.2,3.4,-25,i%2?'paper':'hatch',1.8)).join(''),
};
function dishSVG(icon,cls='ico'){return `<svg class="${cls}" viewBox="0 3 40 36" aria-hidden="true">${(DISH[icon]||DISH.bowl)()}</svg>`}

/* ---------- small glyphs for what a table is doing ---------- */
const GLYPH={
  menu:`<svg viewBox="0 0 24 24">${sh('M5 3 H17 L19 5 V21 H5 Z','paper',1.8)}${ln('M8 8 H16 M8 11.5 H16 M8 15 H13',1.4)}</svg>`,
  hand:`<svg viewBox="0 0 24 24">${sh('M8 21 V11 Q8 9.5 9.2 9.5 Q10.4 9.5 10.4 11 V4.5 Q10.4 3 11.6 3 Q12.8 3 12.8 4.5 V10 V5.5 Q12.8 4 14 4 Q15.2 4 15.2 5.5 V11 V7.5 Q15.2 6 16.4 6 Q17.6 6 17.6 7.5 V15 Q17.6 21 12 21 Z','paper',1.7)}${ln('M8 12 Q5.5 11 5.3 14 L8 17.5',1.7)}</svg>`,
  pot:`<svg viewBox="0 0 24 24">${sh('M4 10 H20 V17 Q20 20 17 20 H7 Q4 20 4 17 Z','hatch',1.8)}${ln('M2 11 H4 M20 11 H22 M8 7 q-1 -2 0 -4 M12 7 q-1 -2 0 -4 M16 7 q-1 -2 0 -4',1.5)}</svg>`,
  bell:`<svg viewBox="0 0 24 24">${sh('M4 18 Q4 8 12 8 Q20 8 20 18 Z','paper',1.8)}${ln('M2.5 18.5 H21.5 M12 8 V5.5',2)}${circ(12,5,1.4,'ink',1)}</svg>`,
  fork:`<svg viewBox="0 0 24 24">${ln('M7 3 V9 Q7 11.5 9 11.5 Q11 11.5 11 9 V3 M9 3 V21 M16 21 V3 Q19.5 5 19.5 11 H16',1.8)}</svg>`,
  bill:`<svg viewBox="0 0 24 24">${sh('M6 3 H18 V21 L15.5 19 L13.5 21 L11 19 L8.5 21 L6 19 Z','paper',1.7)}${ln('M9 8 H15 M9 11.5 H15 M9 15 H12.5',1.4)}</svg>`,
  broom:`<svg viewBox="0 0 24 24">${ln('M17 3 L11 13',1.8)}${sh('M8 12 L14 15 L11 21 Q6 20 4 17 Z','stripes',1.6)}</svg>`,
  note:`<svg viewBox="0 0 24 24">${sh('M6 3 H18 V21 H6 Z','paper',1.8)}${ln('M6 3 V21 M9.5 8 H15 M9.5 11.5 H15 M9.5 15 H13',1.4)}${ln('M19 4 L21 6 L14 17 L12 17.5 L12.5 15.5 Z',1.3)}</svg>`,
};

/* ---------- tables, side on, in a 120 × 72 box. faces peek over the top; plates sit on it ---------- */
function tableSVG(vk,o={}){
  const faces=o.faces||[],n=faces.length;
  let back='',top='',front='';
  const xs=n?faces.map((_,i)=>r1(60+(i-(n-1)/2)*Math.min(30,90/n))):[];
  // guests sit behind the table, heads just above the tabletop
  const people=faces.map((f,i)=>`<svg x="${xs[i]-17}" y="${o.eat?2:-1}" width="34" height="42.5" viewBox="0 -4 40 50">${faceSVG(f,o.mood||'happy').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`).join('');
  const Y=40; // tabletop
  if(vk==='candle'){
    top=sh(`M14 ${Y} H106 L110 ${Y+22} H10 Z`,'paper',2.2)+ln(`M18 ${Y+22} q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0`,1.3)
      +(n?'':sh(`M57 ${Y-12} H63 V${Y} H57 Z`,'paper',1.6)+sh(`M60 ${Y-20} q-3 4 0 7 q3 -3 0 -7 Z`,'ink',1));
  }else if(vk==='rustic'){
    top=sh(`M8 ${Y} H112 V${Y+6} H8 Z`,'stripes',2.2)+ln(`M16 ${Y+6} V${Y+30} M104 ${Y+6} V${Y+30} M16 ${Y+22} H104`,3)+(n?'':sh(`M48 ${Y-7} Q60 ${Y-16} 72 ${Y-7} Z`,'dots',1.8));
  }else if(vk==='sleek'){
    top=sh(`M12 ${Y} H108 V${Y+4} H12 Z`,'ink',1.5)+ln(`M60 ${Y+4} V${Y+28} M46 ${Y+29} H74`,2.6)+(n?'':ln(`M58 ${Y} V${Y-12} M58 ${Y-12} q-4 -4 -2 -9 M58 ${Y-12} q4 -4 6 -8`,1.6));
  }else if(vk==='diner'){
    top=sh(`M10 ${Y} H110 V${Y+7} H10 Z`,'paper',2.2)+ln(`M10 ${Y+3.5} H110`,1.2)+ln(`M60 ${Y+7} V${Y+28} M48 ${Y+29} H72`,2.6)
      +(n?'':sh(`M52 ${Y-13} H60 V${Y} H52 Z`,'hatch',1.5)+sh(`M64 ${Y-10} H71 V${Y} H64 Z`,'paper',1.5)+ln(`M67.5 ${Y-10} V${Y-14}`,1.5));
  }else{
    top=ell(60,Y+2,50,4.5,0,'paper',2.2)+ln(`M60 ${Y+6} V${Y+28} M48 ${Y+29} H72`,2.6)
      +(n?'':sh(`M54 ${Y-2} L56 ${Y-10} H64 L66 ${Y-2} Z`,'stripes',1.5)+ell(56,Y-14,4,2.4,-30,'paper',1.3)+ell(64,Y-14,4,2.4,30,'paper',1.3)+ell(60,Y-17,2.4,4,0,'hatch',1.3));
  }
  if(o.plates)front+=xs.map(x=>ell(x,Y-1.5,8,2.4,0,'paper',1.6)+(o.eat?sh(`M${x-4} ${Y-2.5} Q${x} ${Y-7} ${x+4} ${Y-2.5} Z`,'hatch',1.2):'')).join('');
  if(o.dirty)front+=[34,58,84].map((x,i)=>ell(x,Y-1.5,8,2.4,i*6-6,'paper',1.6)).join('')+ln(`M42 ${Y-4} L50 ${Y-7} M70 ${Y-3} L76 ${Y-8}`,1.6)+dot(46,Y-1.5,1)+dot(66,Y-1,1)+dot(95,Y-2,1);
  return `<svg class="tbl" viewBox="0 0 120 72" aria-hidden="true">${back}${people}${top}${front}</svg>`;
}

/* ---------- stars, the cloche, the kitchen ---------- */
function starPath(cx,cy,R,r){let d='';for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,q=i%2?r:R;d+=(i?'L':'M')+r1(cx+Math.cos(a)*q)+' '+r1(cy+Math.sin(a)*q)}return d+'Z'}
function starSVG(on=true,cls='star'){return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${sh(starPath(12,12.6,10.5,4.6),on?'ink':'paper',1.8)}</svg>`}
function starsHTML(n,of=3){let o='';for(let i=0;i<of;i++)o+=starSVG(i<n);return `<span class="stars" aria-label="${n} of ${of} stars">${o}</span>`}
// The cloche over a plate. lift (0 to 1) raises the lid to show the dish underneath.
function clocheSVG(icon='bird',lift=0){
  const y=-lift*26;
  return `<svg viewBox="0 -30 100 100" aria-hidden="true">${ell(50,66,44,9,0,'paper',2.6)}
    <svg x="18" y="20" width="64" height="58" viewBox="0 3 40 36">${(DISH[icon]||DISH.bird)()}</svg>
    <g class="lid" transform="translate(0 ${r1(y)})">${sh('M10 62 Q10 22 50 22 Q90 22 90 62 Z','paper',2.8)}${ln('M22 48 Q26 34 38 29',2)}${circ(50,17,5,'paper',2.6)}${sh('M6 62 H94 V66 H6 Z','ink',1)}</g></svg>`;
}
