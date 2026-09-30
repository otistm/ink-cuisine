/* Ink Cuisine: procedural sound effects. */
"use strict";
let AC=null;
function tone(f,d,type,v,when=0,slide){
  const t0=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+d);
  g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.0008,t0+d);
  o.connect(g).connect(AC.destination);o.start(t0);o.stop(t0+d+.03);
}
function snd(k){
  if(S.muted)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    if(k==='pick')tone(720,.05,'triangle',.05);
    else if(k==='seat'){tone(330,.08,'triangle',.07);tone(495,.1,'triangle',.05,.07)}
    else if(k==='order'){tone(1200,.03,'square',.02);tone(900,.03,'square',.02,.05);tone(1500,.03,'square',.02,.1)}
    else if(k==='sizzle'){for(let i=0;i<7;i++)tone(2400+Math.random()*1800,.04,'sawtooth',.008,i*.03)}
    else if(k==='bell'){tone(2093,.5,'sine',.06);tone(3136,.35,'sine',.025,.01)}
    else if(k==='serve'){[523,659,784].forEach((f,i)=>tone(f,.14,'triangle',.06,i*.06))}
    else if(k==='clear'){tone(1600,.04,'triangle',.03);tone(1300,.05,'triangle',.03,.06);tone(1800,.04,'triangle',.02,.11)}
    else if(k==='coin'){tone(1568,.08,'square',.025);tone(2093,.16,'square',.025,.07)}
    else if(k==='walk')tone(190,.4,'sawtooth',.045,0,80);
    else if(k==='bad')tone(150,.12,'square',.035);
    else if(k==='ding'){tone(1568,.35,'sine',.05);tone(1318,.4,'sine',.04,.08)}
    else if(k==='idea'){tone(660,.1,'sine',.04);tone(990,.16,'sine',.04,.08)}
    else if(k==='flop')tone(330,.35,'triangle',.05,0,120);
    else if(k==='star'){[784,988,1175,1568].forEach((f,i)=>tone(f,.3,'sine',.05,i*.12))}
  }catch(e){}
}
