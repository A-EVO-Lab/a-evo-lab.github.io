(() => {
  'use strict';
  const data = window.LM2LM_DATA;
  if (!data) return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => value.toFixed(2).replace('-','−');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let domain = 'ar', metric = 'avg4', entered = reduced.matches;
  const {methods} = data.display;
  // Rows carry the method name only. Colour marks LM2LM against the baselines; the longer description is the row's tooltip.
  const modelIdentity = id => `<span class="method-name">${escape(methods[id].label)}</span>`;
  const rows = new Map();
  for (const item of data.main.ar.rows) {
    const row = document.createElement('div');
    row.className = 'chart-row' + (item.id === 'lm2lm' ? ' ours' : '');
    row.dataset.model = item.id;
    row.innerHTML = `<div class="model-label" title="${escape(methods[item.id].description)}">${modelIdentity(item.id)}</div><div class="bar-lane" aria-hidden="true"><i class="bar">${item.id === 'lm2lm' ? '<span class="bar-note"></span>' : ''}</i></div><span class="chart-score"></span>`;
    $('#chart-rows').append(row);
    rows.set(item.id, row);
  }

  const familyGroups = [
    ['Autoregressive', ['OLMo-3','Qwen3','NanoChat','Marin']],
    ['Diffusion', ['E2D2-SW','E2D2','MDM','BD3LM']]
  ];
  const totals = {train:0, heldout:0, states:0};
  $('#tasks-table tbody').innerHTML = familyGroups.map(([group, names]) =>
    `<tr class="group"><th scope="colgroup" colspan="5">${escape(group)}</th></tr>` + names.map(name => {
      const env = data.environments.find(e => e.family === name);
      totals.train += env.trainingTaskCount; totals.heldout += env.heldoutTaskCount; totals.states += env.heldoutStates;
      return `<tr><th scope="row">${escape(name)}</th><td class="text">${escape(env.trainingData)}</td><td>${env.trainingTaskCount}</td><td>${env.heldoutTaskCount || '—'}</td><td>${env.heldoutStates || '—'}</td></tr>`;
    }).join('')
  ).join('');
  $('#tasks-table').insertAdjacentHTML('beforeend', `<tfoot><tr><th scope="row">Total</th><td></td><td>${totals.train}</td><td>${totals.heldout}</td><td>${totals.states}</td></tr></tfoot>`);

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
      row.querySelector('.chart-score').textContent = num(value);
      row.setAttribute('aria-label', `${methods[item.id].label}, ${methods[item.id].model}, ${metric === 'avg4' ? 'Avg@4' : 'Best@4'}: ${value.toFixed(2)} ${panel.unit}`);
      const bar = row.querySelector('.bar');
      bar.style.left = `${entered ? pos(Math.min(0,value)) : pos(0)}%`;
      bar.style.width = `${entered ? Math.abs(value)/(scale.max-scale.min)*100 : 0}%`;
    });
    $('#chart-unit').textContent = `Gain in ${domain==='ar' ? '10⁻³ BPB' : '10⁻² nats/token'}`;
    const ours = panel.rows.find(r=>r.id==='lm2lm')[metric];
    const baseline = panel.rows.find(r=>r.id==='gpt6_sol_icl')[metric];
    const ratio = (ours/baseline).toFixed(2);
    // The ratio to GPT-6 Sol + records is written inside LM2LM's own bar.
    rows.get('lm2lm').querySelector('.bar-note').innerHTML = `<b>${ratio}×</b><span> GPT-6 Sol + records</span>`;
    $('#results-caption').innerHTML = `${domain==='ar'?'Autoregressive':'Diffusion'} held-out results, with gains in ${panel.unitHtml}.`;
    $('#results-table tbody').innerHTML = [...panel.rows].sort((a,b)=>b.avg4-a.avg4).map(r=>`<tr class="${r.id==='lm2lm'?'ours':''}"><th scope="row">${modelIdentity(r.id)}</th><td>${num(r.avg4)}</td><td>${num(r.best4)}</td><td>${r.negativePct.toFixed(1)}</td><td>${r.winVsBasePct===null?'—':r.winVsBasePct.toFixed(1)}</td><td>${r.lm2lmWinVsRowPct==null?'—':r.lm2lmWinVsRowPct.toFixed(1)}</td></tr>`).join('');
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
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{renderChart();renderFigures();});});

  function miniBars(target, items, maximum) {
    $(target).innerHTML = items.map(item=>`<div class="mini-bar-row ${item.ours?'ours':''}"><div class="mini-bar-label"><span>${escape(item.label)}</span><b>${item.value.toFixed(2)}</b></div><div class="mini-bar-lane" aria-hidden="true"><i style="width:${item.value/maximum*100}%"></i></div></div>`).join('');
  }
  $('#transfer-bars').innerHTML = [...data.transfer.rows].sort((a,b)=>b.avg4-a.avg4).map(item=>{
    const method = methods[item.id];
    return `<div class="mini-bar-row ${item.id==='lm2lm'?'ours':''}" data-model="${escape(item.id)}"><div class="mini-bar-label"><span>${escape(method.label)}</span><b>${item.avg4.toFixed(2)}</b></div><div class="mini-bar-lane" aria-hidden="true"><i style="width:${item.avg4/60*100}%"></i></div></div>`;
  }).join('');
  miniBars('#ablation-bars', [...data.calibration.ablation.rows].sort((a,b)=>b.avg4-a.avg4).map(r=>({label:r.id==='top_rated'?'Top-rated calibration (LM2LM)':r.id==='static200'?'Static records':'Random calibration',value:r.avg4,ours:r.id==='top_rated'})),20);

  // Line charts built from the paper's own figure data (assets/paper-figures.js). Each chart is one inline SVG:
  // light gridlines, optional reference and calibration lines, then one polyline with dots (and interval whiskers) per series.
  const F = window.LM2LM_FIGURES;
  const signed = value => String(value).replace('-', '−');
  function lineChart(cfg) {
    const {width: W, height: H, margin: m, x, y} = cfg;
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const sx = v => +(m.l + (v - x.min) / (x.max - x.min) * iw).toFixed(1);
    const sy = v => +(m.t + ih - (v - y.min) / (y.max - y.min) * ih).toFixed(1);
    let out = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(cfg.label)}">`;
    for (const t of y.ticks) out += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${m.l - 8}" y="${sy(t)}" text-anchor="end" dominant-baseline="central">${signed(t)}</text>`;
    for (const t of x.ticks) out += `<text x="${sx(t)}" y="${m.t + ih + 20}" text-anchor="middle">${escape(x.format ? x.format(t) : t)}</text>`;
    out += `<text x="${m.l + iw / 2}" y="${H - 4}" text-anchor="middle">${escape(x.title)}</text>`;
    for (const v of cfg.vlines || []) out += `<line class="vline" x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${m.t + ih}"/>`;
    if (cfg.ref) {
      out += `<line class="ref" x1="${m.l}" x2="${W - m.r}" y1="${sy(cfg.ref.y)}" y2="${sy(cfg.ref.y)}"/>`;
      if (cfg.ref.label) out += `<text x="${m.l + 4}" y="${sy(cfg.ref.y) - 6}">${escape(cfg.ref.label)}</text>`;
    }
    for (const s of cfg.series) {
      out += `<g class="${s.cls}">`;
      for (const p of s.points) if (p.lo != null) out += `<line class="whisker" x1="${sx(p.x)}" x2="${sx(p.x)}" y1="${sy(p.lo)}" y2="${sy(p.hi)}"/>`;
      out += `<polyline class="line" points="${s.points.map(p => `${sx(p.x)},${sy(p.y)}`).join(' ')}"/>`;
      for (const p of s.points) out += `<circle class="dot" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.big ? 5 : 3.5}"/>`;
      out += '</g>';
    }
    for (const a of cfg.marks || []) out += `<text class="mark${a.cls ? ' ' + a.cls : ''}" x="${sx(a.x) + (a.dx || 0)}" y="${sy(a.y) + (a.dy || 0)}" text-anchor="${a.anchor || 'middle'}">${escape(a.text)}</text>`;
    return out + '</svg>';
  }

  function costPanel(key, width) {
    const c = F.cost, p = c.panels[key];
    const icl = ys => ys.map((v, i) => ({x: c.icl.costK[i], y: v}));
    const ours = p.lm2lm.map((v, i) => ({x: c.lm2lm.costK[i], y: v, big: c.lm2lm.steps[i] === c.lm2lm.defaultStep}));
    const chosen = ours.find(point => point.big), last = c.icl.costK.length - 1;
    const lowest = i => Math.min(p.baseIcl[i], p.gptIcl[i]);
    // One decimal, rounding halves up as the paper does (40.050 reads "$40.1k"; toFixed alone gives 40.0).
    const usdK = value => (Math.round(value * 10 + 1e-6) / 10).toFixed(1);
    return `<div class="panel"><h4>${escape(p.title)} <small>Avg@4, ${escape(p.unit)}</small></h4>` + lineChart({
      label: `${p.title} held-out states: Avg@4 against data-generation cost. LM2LM reaches ${chosen.y.toFixed(2)} at $${usdK(chosen.x)}k (step ${c.lm2lm.defaultStep}); with 300 records at $${usdK(c.icl.costK[last])}k, GPT-6 Sol reaches ${p.gptIcl[last].toFixed(2)} and the base model ${p.baseIcl[last].toFixed(2)}.`,
      width, height: 270, margin: {l: 38, r: 14, t: 12, b: 46},
      x: {min: -3, max: 66, ticks: [0, 20, 40, 60], format: t => t ? `$${t}k` : '$0', title: 'Data-generation cost'},
      y: key === 'ar' ? {min: -14, max: 24, ticks: [-10, 0, 10, 20]} : {min: -6.5, max: 11, ticks: [-4, 0, 4, 8]},
      ref: {y: 0},
      series: [{cls: 's-base', points: icl(p.baseIcl)}, {cls: 's-ink', points: icl(p.gptIcl)}, {cls: 's-ours', points: ours}],
      marks: [
        // The label sits below the point on the AR panel and above-left on the diffusion panel, clear of the other curves.
        {x: chosen.x, y: chosen.y, text: `step ${c.lm2lm.defaultStep}`, ...(key === 'ar' ? {dy: 22} : {dx: -6, dy: -10, anchor: 'end'})},
        {x: 0, y: lowest(0), dx: -4, dy: 20, anchor: 'start', text: 'K = 0'},
        {x: c.icl.costK[last], y: Math.max(p.baseIcl[last], p.gptIcl[last]), dy: -10, text: `K = ${c.icl.records[last]}`}
      ]
    }) + '</div>';
  }

  // `labels(staticPoints, lm2lmPoints)` returns the values written on the chart itself (lineChart marks).
  function reliabilityPanel(width, metric, title, y, ref, summary, labels) {
    const r = F.reliability;
    // Offset the two series by one step either way so their interval bars do not overlap, as in the paper's figure.
    const points = (list, dx) => list.map(p => ({x: p.step + dx, y: p[metric][0], lo: p[metric][1], hi: p[metric][2]}));
    const end = list => signed(list[list.length - 1][metric][0].toFixed(2));
    const fixed = points(r.static, -1), ours = points(r.lm2lm, 1);
    return `<div class="panel"><h4>${escape(title)}</h4>` + lineChart({
      label: `${title} by training step. At step 128: LM2LM ${end(r.lm2lm)}, static records ${end(r.static)}. ${summary}`,
      width, height: 232, margin: {l: 36, r: 10, t: 10, b: 46},
      x: {min: -4, max: 134, ticks: [0, 32, 64, 96, 128], title: 'Training step'},
      y, ref, vlines: r.calibrations,
      series: [{cls: 's-base', points: fixed}, {cls: 's-ours', points: ours}],
      marks: labels(fixed, ours)
    }) + '</div>';
  }
  const two = value => signed(value.toFixed(2));
  const above = (p, text, extra) => ({x: p.x, y: p.hi, dy: -7, text, ...extra});
  const below = (p, text, extra) => ({x: p.x, y: p.lo, dy: 16, text, ...extra});
  const last = list => list[list.length - 1];
  const atStep = (list, step) => list.find(p => Math.abs(p.x - step) <= 1);

  // Each SVG is drawn at its panel's actual pixel width, so chart text stays at its CSS size on every screen.
  // A panel inside a closed <details> measures 0 and is drawn when the block is opened.
  function fill(target, count, build) {
    const host = $(target);
    if (!host.children.length) host.innerHTML = '<div class="panel"></div>'.repeat(count);
    const width = Math.round(host.firstElementChild.clientWidth);
    if (width) host.innerHTML = build(width);
  }
  function renderFigures() {
    if (!F) return;
    fill('#cost-panels', 2, width => costPanel('ar', width) + costPanel('diffusion', width));
    fill('#reliability-panels', 2, width =>
      reliabilityPanel(width, 'rank', 'Pairwise ranking accuracy', {min: 0.2, max: 0.9, ticks: [0.2, 0.4, 0.6, 0.8]}, {y: 0.5, label: 'chance'}, 'Chance level is 0.5.',
        (fixed, ours) => [
          above(fixed[0], two(fixed[0].y), {dx: -2, anchor: 'end'}),
          below(last(fixed), `Static ${two(last(fixed).y)}`, {dx: 4, anchor: 'end'}),
          above(last(ours), `LM2LM ${two(last(ours).y)}`, {dx: 4, anchor: 'end', cls: 'ours'})
        ]) +
      reliabilityPanel(width, 'gap', 'Predicted − real reward', {min: -0.4, max: 3, ticks: [0, 1, 2, 3]}, {y: 0, label: 'unbiased'}, 'Zero means unbiased.',
        (fixed, ours) => [
          above(atStep(fixed, 96), `Static ${two(atStep(fixed, 96).y)}`),
          below(last(ours), `LM2LM ${two(last(ours).y)}`, {dx: 4, anchor: 'end', cls: 'ours'})
        ]));
  }
  renderFigures();
  $$('details.more').forEach(block => block.addEventListener('toggle', renderFigures));

  const video = $('#lead-video');
  function applyMotionPreference() {
    if(reduced.matches){video.pause();video.autoplay=false;video.poster='assets/film-poster.jpg?v=cb9f59af675d';entered=true;renderChart();}
    else {video.autoplay=true;video.poster='assets/film-start.jpg?v=304615145472';video.play().catch(()=>{});}
  }
  applyMotionPreference();
  reduced.addEventListener('change',applyMotionPreference);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){video.dataset.wasPlaying=String(!video.paused);video.pause();}
    else if(video.dataset.wasPlaying==='true'&&!reduced.matches){video.play().catch(()=>{});}
  });

  $('#copy-citation').addEventListener('click',async()=>{
    const citation = $('#bibtex').textContent.trim() + '\n';
    let copied = false;
    // The async clipboard API can be denied (embedded views, missing permission); fall back to a selection copy.
    try { await navigator.clipboard.writeText(citation); copied = true; } catch {}
    if(!copied){
      const area=document.createElement('textarea');area.value=citation;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();
      try { copied = document.execCommand('copy'); } catch {}
      area.remove();
    }
    $('#copy-status').textContent = copied ? 'BibTeX copied.' : 'Copy failed. Use “Download .bib” instead.';
  });
  window.LM2LM = {getState:()=>({domain,metric,entered,rows:[...data.main[domain].rows].sort((a,b)=>b[metric]-a[metric]).map(r=>({id:r.id,value:r[metric]}))})};
})();
