const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(){ menu.setAttribute('aria-expanded','false'); navigation.classList.remove('open'); }
menu?.addEventListener('click',()=>{ const open=menu.getAttribute('aria-expanded')!=='true'; menu.setAttribute('aria-expanded',String(open)); navigation.classList.toggle('open',open); });
navigation?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
const dialog=document.querySelector('.figure-dialog');
let figureTrigger;
document.querySelectorAll('[data-figure]').forEach(button=>button.addEventListener('click',()=>{figureTrigger=button;const img=dialog.querySelector('img');img.src=button.dataset.figure;img.alt=button.dataset.caption;dialog.querySelector('#figure-caption').textContent=button.dataset.caption;dialog.showModal();}));
dialog?.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog?.addEventListener('close',()=>figureTrigger?.focus());
const filters=[...document.querySelectorAll('[data-filter]')];
const papers=[...document.querySelectorAll('.publication')];
const search=document.querySelector('#paper-search');
let category='all';
function filterPapers(){ const q=(search?.value||'').trim().toLocaleLowerCase();let count=0;papers.forEach(p=>{const show=(category==='all'||p.dataset.category===category)&&p.textContent.toLocaleLowerCase().includes(q);p.hidden=!show;if(show)count++;});document.querySelector('.results-status').textContent=`${count} ${count===1?'publication':'publications'}${q?' matching your search':''}`;document.querySelector('.empty-state').hidden=count>0; }
filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;filters.forEach(f=>f.setAttribute('aria-pressed',String(f===b)));filterPapers();}));
search?.addEventListener('input',filterPapers);

// Live GitHub star / fork counts; the numbers in the HTML are the fallback.
document.querySelectorAll('[data-gh-stars]').forEach(el=>{const repo=el.dataset.ghStars;fetch(`https://api.github.com/repos/${repo}`).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;el.textContent=d.stargazers_count.toLocaleString('en-US');const f=document.querySelector(`[data-gh-forks="${repo}"]`);if(f)f.textContent=d.forks_count.toLocaleString('en-US');}).catch(()=>{});});
