(() => {
'use strict';
const {models} = window.RWM_DATA;
const logoSource = model => window.RWM_LOGOS?.[model.logo] || model.logo;
const $ = (id) => document.getElementById(id);
const duration = 14000;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const bestBefore = Math.max(...models.map(m => m.before));
const sortedBefore = [...models].sort((a,b)=>b.before-a.before);
const sortedAfter = [...models].sort((a,b)=>b.after-a.after);
const initialRanks = Object.fromEntries(sortedBefore.map((m,i)=>[m.id,i+1]));
let currentTime=0, playing=false, lastTime=0, raf=0;
let chartInView=false, chartAutoplay=true;
const clamp = (v,min=0,max=1) => Math.min(max,Math.max(min,v));
const ease = t => t*t*t*(t*(t*6-15)+10);
const fmt = v => (v<0?'−':'')+Math.abs(v).toFixed(3);
const nodes=models.map(m=>{
 const row=document.createElement('div'); row.className='chart-row'; row.dataset.model=m.id;
 row.style.setProperty('--model-color',m.color);
 row.innerHTML=`<span class="rank"></span><span class="model-name"><img class="model-logo" src="${logoSource(m)}" alt="" aria-hidden="true"><span class="model-label">${m.name}</span></span><span class="bar-lane"><span class="bar"></span></span><span class="score"></span><span class="delta empty">—</span>`;
 row.title=`${m.name} · ${m.provider}\nWithout records: ${m.before.toFixed(5)}\nWith 320 records: ${m.after.toFixed(5)}`;
 $('chart-rows').append(row);
 return {row,rank:row.querySelector('.rank'),bar:row.querySelector('.bar'),score:row.querySelector('.score'),delta:row.querySelector('.delta')};
});
function valuesAt(ms){
 const phase=clamp((ms-2000)/7000);
 return models.map((m,i)=>{
  const delay=i*.009;
  const p=ease(clamp((phase-delay)/(1-delay)));
  return {m,value:m.before+(m.after-m.before)*p,p,index:i};
 });
}
function render(ms){
 currentTime=clamp(ms,0,duration);
 const values=valuesAt(currentTime);
 const order=[...values].sort((a,b)=>b.value-a.value||a.index-b.index);
 const ranks=Object.fromEntries(order.map((v,i)=>[v.m.id,i]));
 const phase=clamp((currentTime-2000)/7000);
 // Pairwise soft ranking gives continuous vertical movement as interpolated scores cross.
 // The smoothing window collapses at both endpoints so exact endpoint ranks are preserved.
 const width=.022*Math.sin(Math.PI*phase);
 const rowHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row'));
 values.forEach(({m,value,p,index})=>{
  let yRank=ranks[m.id];
  if(width>0.000001){
   yRank=0;
   for(const v of values) if(v.m.id!==m.id) yRank+=ease(clamp(.5+(v.value-value)/(2*width)));
  }
  const n=nodes[index];
  n.row.style.transform=`translateY(${yRank*rowHeight}px)`;
  n.rank.textContent=String(ranks[m.id]+1).padStart(2,'0');
  const zero=.4/1.4*100;
  const x=(value+.4)/1.4*100;
  n.bar.style.left=`${Math.min(zero,x)}%`;
  n.bar.style.width=`${Math.abs(x-zero)}%`;
  n.score.textContent=fmt(value);
  n.delta.textContent=p>0.00001?`+${(value-m.before).toFixed(3)}`:'—';
  n.delta.classList.toggle('empty',p<=0.00001);
 });
 const after=currentTime>=9000;
 const before=currentTime<=2000;
 $('condition-label').innerHTML=`<i></i> ${before?'NO EXPERIMENT RECORDS':after?'WITH 320 EXPERIMENT RECORDS':'ADDING EXPERIMENTAL EXPERIENCE'}`;
 $('condition-label').classList.toggle('with-records',!before);
 $('before-btn').classList.toggle('active',before);
 $('after-btn').classList.toggle('active',!before);
 $('before-btn').setAttribute('aria-pressed',String(before));
 $('after-btn').setAttribute('aria-pressed',String(!before));
 const count=values.filter(v=>v.value>bestBefore+1e-9).length;
 $('chart-count').textContent=`${count} / 13 above baseline`;
 if(before) $('insight-text').innerHTML='Before experience, prediction quality varies widely — from <strong>−0.362 to 0.621.</strong>';
 else if(after) $('insight-text').innerHTML='<strong>Every model now beats the original best.</strong> DeepSeek rises from #11 to #6.';
 else $('insight-text').innerHTML='Comparing <strong>no records vs. 320 experimental records.</strong>';
 $('timeline').value=currentTime;
 $('timeline').style.setProperty('--progress',`${currentTime/duration*100}%`);
 $('time-label').textContent=`0:${String(Math.floor(currentTime/1000)).padStart(2,'0')} / 0:14`;
}
function stop(){playing=false;cancelAnimationFrame(raf);$('play-btn').textContent='▶';$('play-btn').setAttribute('aria-label','Play leaderboard animation');}
function tick(now){
 if(!playing)return;
 if(!lastTime) lastTime=now;
 const next=currentTime+(now-lastTime);lastTime=now;render(next);
 if(next>=duration){
  if(chartAutoplay && chartInView && !document.hidden && !reduced.matches){
   render(0);
   raf=requestAnimationFrame(tick);
  } else stop();
 } else raf=requestAnimationFrame(tick);
}
function play(restart=false){
 stop();
 if(reduced.matches){render(duration);return;}
 if(restart||currentTime>=duration)render(0);
 playing=true;lastTime=0;$('play-btn').textContent='Ⅱ';$('play-btn').setAttribute('aria-label','Pause leaderboard animation');raf=requestAnimationFrame(tick);
}
function holdChart(){chartAutoplay=false;stop();}
function syncChartPlayback(){
 if(!chartInView || document.hidden || reduced.matches){stop();return;}
 if(chartAutoplay && !playing)play();
}
$('play-btn').addEventListener('click',()=>{
 if(playing)holdChart();
 else {chartAutoplay=true;play();}
});
const leadVideo = $('lead-video');
leadVideo.muted = true;
if (reduced.matches) {
 leadVideo.autoplay = false;
 leadVideo.removeAttribute('autoplay');
 leadVideo.pause();
} else {
 leadVideo.play().catch(() => {}); // Native controls remain available if autoplay is blocked.
}
$('hero-play').addEventListener('click',()=>{
 $('film').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
 leadVideo.currentTime=0;
 leadVideo.play().catch(() => {});
});
$('reset-btn').addEventListener('click',()=>{holdChart();render(0);});
$('replay-btn').addEventListener('click',()=>{chartAutoplay=true;play(true);});
$('before-btn').addEventListener('click',()=>{holdChart();render(0);});
$('after-btn').addEventListener('click',()=>{holdChart();render(duration);});
$('timeline').addEventListener('input',e=>{holdChart();render(Number(e.target.value));});
document.querySelectorAll('a[href="#data-table"]').forEach(link=>link.addEventListener('click',()=>document.querySelector('#data-table details').open=true));
window.addEventListener('resize',()=>render(currentTime));
document.addEventListener('visibilitychange',syncChartPlayback);
reduced.addEventListener('change',syncChartPlayback);
sortedAfter.forEach((m,i)=>{
 const row=document.createElement('tr');
 row.innerHTML=`<td><span class="table-model"><img class="model-logo" src="${logoSource(m)}" alt="" aria-hidden="true"><span>${m.name}</span></span></td><td>${m.before.toFixed(5)}</td><td>${m.after.toFixed(5)}</td><td>+${(m.after-m.before).toFixed(5)}</td><td>${initialRanks[m.id]} → ${i+1}</td>`;
 $('results-body').append(row);
});
const citation=`@misc{wang2026languagemodelsairesearch,
  title={Language Models as AI Research World Models},
  author={Zijun Wang and Zewen Liu and Minhua Lin and Zhaotian Weng and Zhan Shi and Bing He and Yisi Sang and Dakuo Wang and Benoit Dumoulin and Wei Jin and Yuyin Zhou and Cihang Xie and Hanqing Lu},
  year={2026},
  eprint={2610.12235},
  archivePrefix={arXiv},
  primaryClass={cs.CL},
  url={https://arxiv.org/abs/2610.12235}
}`;
$('cite-btn').addEventListener('click',async()=>{
 try{
  if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(citation);
  else {const t=document.createElement('textarea');t.value=citation;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('copy unavailable');}
  $('copy-status').textContent='Citation copied.';
 }catch{$('copy-status').textContent='Use Download BibTeX below.';}
});
window.RWM={renderAt:(seconds)=>{holdChart();render(seconds*1000);},getState:()=>({currentTime,playing,chartInView,chartAutoplay,values:valuesAt(currentTime).map(v=>({name:v.m.name,value:v.value}))})};
render(0);
if('IntersectionObserver' in window){
 const chartObserver=new IntersectionObserver(([entry])=>{
  chartInView=entry.isIntersecting && entry.intersectionRatio>=0.2;
  syncChartPlayback();
 },{threshold:[0,0.2]});
 chartObserver.observe($('leaderboard'));
} else {
 chartInView=true;
 syncChartPlayback();
}
})();
