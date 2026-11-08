(() => {
  'use strict';
  const data = window.LM2LM_DATA;
  if (!data) return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let domain = 'ar', metric = 'avg4', entered = reduced.matches;
  const {methods, providers} = data.display;
  const providerFor = id => providers[methods[id].provider];
  function modelIdentity(id) {
    const method = methods[id], provider = providerFor(id);
    const subtitle = method.provider === 'alibaba' ? method.model : method.description;
    return `<img class="model-logo" src="${escape(window.LM2LM_LOGOS?.[provider.logo] || provider.logo)}" alt="" aria-hidden="true"><span class="model-text"><span class="method-name">${escape(method.label)}</span><small class="model-secondary">${escape(subtitle)}</small></span>`;
  }
  const rows = new Map();
  for (const item of data.main.ar.rows) {
    const row = document.createElement('div');
    row.className = 'chart-row' + (item.id === 'lm2lm' ? ' ours' : '');
    row.dataset.model = item.id;
    row.style.setProperty('--bar-color', providerFor(item.id).color);
    row.innerHTML = `<div class="model-label" title="${escape(methods[item.id].description)}">${modelIdentity(item.id)}</div><div class="bar-lane" aria-hidden="true"><i class="bar"></i></div><span class="chart-score"></span>`;
    $('#chart-rows').append(row);
    rows.set(item.id, row);
  }

  const shortDescriptions = {
    'OLMo-3':'Autoregressive transformer', 'Qwen3':'Qwen architecture & tokenizer',
    'NanoChat':'Depth-parameterized transformer', 'Marin':'Marin architecture',
    'E2D2-SW':'Sliding-window encoder–decoder', 'E2D2':'Encoder–decoder diffusion',
    'MDM':'Full-sequence masked diffusion', 'BD3LM':'Block diffusion'
  };
  for (const kind of ['ar','diffusion']) {
    const familyOrder = kind === 'ar' ? ['OLMo-3','Qwen3','NanoChat','Marin'] : ['E2D2-SW','E2D2','MDM','BD3LM'];
    $(`#${kind}-families`).innerHTML = familyOrder.map(name => {
      const env = data.environments.find(e => e.family === name);
      return `<article class="family-card"><h4>${escape(name)}</h4><p>${escape(shortDescriptions[name])}</p><div class="family-tags"><span>${env.trainingTaskCount} train tasks</span>${env.heldoutTaskCount ? `<span class="test-tag">${env.heldoutTaskCount} held-out</span>` : '<span class="train-only">Training only</span>'}</div></article>`;
    }).join('');
  }

  function scaleFor() {
    if (domain === 'ar' && metric === 'avg4') return {min:-25,max:25,ticks:[-20,-10,0,10,20]};
    if (domain === 'ar') return {min:0,max:25,ticks:[0,5,10,15,20,25]};
    if (metric === 'avg4') return {min:-5,max:10,ticks:[-5,0,5,10]};
    return {min:0,max:10,ticks:[0,2,4,6,8,10]};
  }
  function renderChart() {
    const panel = data.main[domain];
    const sorted = [...panel.rows].sort((a,b) => b[metric]-a[metric]);
    const scale = scaleFor();
    const pos = n => (n-scale.min)/(scale.max-scale.min)*100;
    const rowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row'));
    $('#chart-grid').innerHTML = scale.ticks.map(n=>`<i class="${n===0?'zero':''}" style="left:${pos(n)}%"></i>`).join('');
    $('#chart-axis').innerHTML = scale.ticks.map(n=>`<span style="left:${pos(n)}%">${n < 0 ? '−'+Math.abs(n) : n}</span>`).join('');
    sorted.forEach((item,rank) => {
      const row = rows.get(item.id), value = item[metric];
      row.style.transform = `translateY(${rank*rowHeight}px)`;
      row.querySelector('.chart-score').textContent = value.toFixed(2).replace('-','−');
      row.setAttribute('aria-label', `${methods[item.id].label}, ${methods[item.id].model}, ${metric === 'avg4' ? 'Avg@4' : 'Best@4'}: ${value.toFixed(2)} ${panel.unit}`);
      const bar = row.querySelector('.bar');
      bar.style.left = `${entered ? pos(Math.min(0,value)) : pos(0)}%`;
      bar.style.width = `${entered ? Math.abs(value)/(scale.max-scale.min)*100 : 0}%`;
    });
    $('#result-context').textContent = `${domain==='ar'?'Autoregressive':'Diffusion'} · ${panel.states} held-out research states`;
    $('#chart-unit').textContent = domain==='ar' ? 'Gain · 10⁻³ BPB ↑' : 'Gain · 10⁻² nats/token ↑';
    $('#metric-label').textContent = metric === 'avg4' ? 'AVG@4' : 'BEST@4';
    const ours = panel.rows.find(r=>r.id==='lm2lm')[metric];
    const baseline = panel.rows.find(r=>r.id==='gpt6_sol_icl')[metric];
    $('#chart-takeaway').innerHTML = `<strong>${(ours/baseline).toFixed(2)}×</strong><span>${metric==='avg4'?'Average':'Best-of-four'} experimental gain vs. GPT-6 Sol with 300 records. <b>${ours.toFixed(2)} vs. ${baseline.toFixed(2)}.</b></span>`;
    $('#results-table caption').textContent = `${domain==='ar'?'Autoregressive':'Diffusion'} held-out results · gains in ${panel.unit}. Paper Table 1.`;
    $('#results-table tbody').innerHTML = panel.rows.map(r=>`<tr class="${r.id==='lm2lm'?'ours':''}"><th scope="row"><span class="table-model">${modelIdentity(r.id)}</span></th><td>${r.avg4.toFixed(2)}</td><td>${r.best4.toFixed(2)}</td><td>${r.negativePct.toFixed(1)}</td><td>${r.winVsBasePct===null?'—':r.winVsBasePct.toFixed(1)}</td></tr>`).join('');
    $$('[data-domain]').forEach(b=>{const active=b.dataset.domain===domain;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
    $$('[data-metric]').forEach(b=>{const active=b.dataset.metric===metric;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  }
  $$('[data-domain]').forEach(button=>button.addEventListener('click',()=>{domain=button.dataset.domain;entered=true;renderChart();}));
  $$('[data-metric]').forEach(button=>button.addEventListener('click',()=>{metric=button.dataset.metric;entered=true;renderChart();}));
  renderChart();
  const observer = new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){entered=true;requestAnimationFrame(renderChart);observer.disconnect();}
  }, {threshold:.25});
  observer.observe($('#results-chart'));
  let resizeFrame;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(renderChart);});

  function miniBars(target, items, maximum) {
    $(target).innerHTML = items.map(item=>`<div class="mini-bar-row ${item.ours?'ours':''}"><div class="mini-bar-label"><span>${escape(item.label)}</span><b>${item.value.toFixed(2)}</b></div><div class="mini-bar-lane" aria-hidden="true"><i style="width:${item.value/maximum*100}%"></i></div></div>`).join('');
  }
  $('#transfer-bars').innerHTML = [...data.transfer.rows].sort((a,b)=>b.avg4-a.avg4).map(item=>`<div class="mini-bar-row ${item.id==='lm2lm'?'ours':''}" data-model="${escape(item.id)}" style="--bar-color:${escape(providerFor(item.id).color)}"><div class="mini-bar-label"><span class="transfer-model">${modelIdentity(item.id)}</span><b>${item.avg4.toFixed(2)}</b></div><div class="mini-bar-lane" aria-hidden="true"><i style="width:${item.avg4/60*100}%"></i></div></div>`).join('');
  miniBars('#ablation-bars', [...data.calibration.ablation.rows].sort((a,b)=>b.avg4-a.avg4).map(r=>({label:r.id==='top_rated'?'Top-rated calibration · LM2LM':r.id==='static200'?'Static records · 200 runs':'Random calibration',value:r.avg4,ours:r.id==='top_rated'})),20);

  const video = $('#lead-video');
  function applyMotionPreference() {
    if(reduced.matches){video.pause();video.autoplay=false;video.poster='assets/film-poster.jpg?v=cb9f59af675d';entered=true;renderChart();}
    else {video.autoplay=true;video.poster='assets/film-start.jpg?v=304615145472';video.play().catch(()=>{});}
  }
  applyMotionPreference();
  reduced.addEventListener('change',applyMotionPreference);
  $('#play-film').addEventListener('click',()=>{
    $('#film').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
    video.currentTime=0;video.play().catch(()=>{});
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){video.dataset.wasPlaying=String(!video.paused);video.pause();}
    else if(video.dataset.wasPlaying==='true'&&!reduced.matches){video.play().catch(()=>{});}
  });

  $('#copy-citation').addEventListener('click',async()=>{
    try {
      const response = await fetch('assets/citation.bib');
      if(!response.ok) throw new Error('Citation unavailable');
      const citation = await response.text();
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(citation);
      else {
        const area=document.createElement('textarea');area.value=citation;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copy unavailable');
      }
      $('#copy-status').textContent='BibTeX copied.';
    } catch { $('#copy-status').textContent='Use the BibTeX download in the footer.'; }
  });
  window.LM2LM = {getState:()=>({domain,metric,entered,rows:[...data.main[domain].rows].sort((a,b)=>b[metric]-a[metric]).map(r=>({id:r.id,value:r[metric]}))})};
})();
