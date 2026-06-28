let M=null, VIEW='home', SUBJ=null;
const $=s=>document.querySelector(s), app=$('#app');
const KEY='cbse2027_done';
const done=()=>JSON.parse(localStorage.getItem(KEY)||'{}');
const toggleDone=p=>{const d=done();d[p]=!d[p];localStorage.setItem(KEY,JSON.stringify(d));};
const kb=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB';

// theme
const setTheme=t=>{document.documentElement.dataset.theme=t;localStorage.setItem('cbse_theme',t);$('#theme').textContent=t==='dark'?'☀️':'🌙';};
setTheme(localStorage.getItem('cbse_theme')||'dark');
$('#theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

// viewer
function open(item){
  const ext=(item.path.match(/\.(\w+)$/)||[,'pdf'])[1];
  $('#viewer-title').textContent=item.title;
  $('#viewer-frame').src=item.path;
  $('#viewer-dl').href=item.path; $('#viewer-dl').download=item.title.replace(/[^\w]+/g,'_')+'.'+ext;
  $('#viewer-open').href=item.path;
  $('#viewer').classList.remove('hidden');
}
$('#viewer-close').onclick=()=>{$('#viewer').classList.add('hidden');$('#viewer-frame').src='';};
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#viewer-close').click();});

// tabs
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); VIEW=t.dataset.view; SUBJ=null; $('#search').value=''; render();
});

// search
$('#search').oninput=()=>render();

function itemRow(it){
  const d=done()[it.path];
  const el=document.createElement('div'); el.className='item';
  el.innerHTML=`<span class="pic">📄</span><div class="txt"><div class="t"></div><div class="s">${kb(it.size)}</div></div><div class="chk ${d?'done':''}">${d?'✓':''}</div>`;
  el.querySelector('.t').textContent=it.title;
  el.querySelector('.txt').onclick=()=>open(it);
  el.querySelector('.pic').onclick=()=>open(it);
  el.querySelector('.chk').onclick=e=>{e.stopPropagation();toggleDone(it.path);render();};
  return el;
}
function listInto(parent,arr,empty){
  if(!arr||!arr.length){const e=document.createElement('div');e.className='empty';e.textContent=empty;parent.appendChild(e);return;}
  arr.forEach(it=>parent.appendChild(itemRow(it)));
}
const q=()=>$('#search').value.trim().toLowerCase();
const filt=arr=>{const s=q();return s?arr.filter(it=>it.title.toLowerCase().includes(s)):arr;};

function home(){
  const st=M.stats;
  const d=done(); const total=M.stats.pyq+M.stats.final+M.stats.halfyearly;
  const doneCount=Object.keys(d).filter(k=>d[k]).length;
  app.innerHTML=`<div class="hero"><h2>Your CBSE 2027 Prep Hub</h2>
    <p>Everything in one place — chapter PYQ banks, predicted papers, English infographics, formula sheets & class notes.</p>
    <div class="statgrid">
      <div class="stat"><b>${st.pyq}</b><span>PYQ Chapters</span></div>
      <div class="stat"><b>${st.halfyearly}</b><span>Half-Yearly</span></div>
      <div class="stat"><b>${st.final}</b><span>Final Papers</span></div>
      <div class="stat"><b>${st.infographics||0}</b><span>Infographics</span></div>
      <div class="stat"><b>${st.formula+st.notes}</b><span>Sheets & Notes</span></div>
      <div class="stat"><b>${doneCount}/${total}</b><span>Marked Done</span></div>
    </div></div>
    <div class="sectitle">Jump to a subject</div><div class="grid" id="subjcards"></div>`;
  const g=$('#subjcards');
  Object.entries(M.subjects).forEach(([k,s])=>{
    const c=document.createElement('div');c.className='card';c.dataset.subj=k;
    c.innerHTML=`<div class="ic">${s.icon}</div><div class="nm">${s.pretty}</div>
      <div class="meta">${s.pyq.length} PYQ · ${s.halfyearly.length} half-yearly · ${s.final.length} final</div>
      <span class="arrow">→</span>`;
    c.onclick=()=>{SUBJ=k;VIEW='subject';render();};
    g.appendChild(c);
  });
}

function subjectCards(kind,label){
  app.innerHTML=`<div class="sectitle">${label} — pick a subject</div><div class="grid" id="g"></div>`;
  const g=$('#g');
  Object.entries(M.subjects).forEach(([k,s])=>{
    const n=s[kind].length;
    const c=document.createElement('div');c.className='card';c.dataset.subj=k;
    c.innerHTML=`<div class="ic">${s.icon}</div><div class="nm">${s.pretty}</div><div class="meta">${n} item${n!=1?'s':''}</div><span class="arrow">→</span>`;
    c.onclick=()=>{SUBJ=k;render();};
    g.appendChild(c);
  });
}

function subjectDetail(){
  const s=M.subjects[SUBJ];
  app.innerHTML=`<span class="backlink" id="back">← All subjects</span>
    <div class="subhead"><span class="big">${s.icon}</span><h2>${s.pretty}</h2></div>
    <div class="sectitle">PYQ Banks <span class="pill">${s.pyq.length}</span></div><div id="a"></div>
    <div class="sectitle">Half-Yearly Papers <span class="pill">${s.halfyearly.length}</span></div><div id="b"></div>
    <div class="sectitle">Final Predicted Papers <span class="pill">${s.final.length}</span></div><div id="c"></div>`;
  $('#back').onclick=()=>{VIEW='home';SUBJ=null;render();};
  const wrap=id=>{const d=document.createElement('div');d.style.display='grid';d.style.gap='8px';$(id).appendChild(d);return d;};
  listInto(wrap('#a'),s.pyq,'No PYQ banks yet.');
  listInto(wrap('#b'),s.halfyearly,'Half-yearly papers generating…');
  listInto(wrap('#c'),s.final,'No final papers.');
}

function flatView(kind,label){
  // collect across subjects, allow subject filter via cards first
  if(!SUBJ){subjectCards(kind,label);return;}
  const s=M.subjects[SUBJ];
  const arr=filt(s[kind]);
  app.innerHTML=`<span class="backlink" id="back">← ${label} subjects</span>
    <div class="subhead"><span class="big">${s.icon}</span><h2>${s.pretty} · ${label}</h2></div>`;
  if(arr.length>1){const r=document.createElement('button');r.className='rand';r.textContent='🎲 Open a random set';r.onclick=()=>open(arr[Math.floor(Math.random()*arr.length)]);app.appendChild(r);}
  const d=document.createElement('div');d.style.display='grid';d.style.gap='8px';app.appendChild(d);
  listInto(d,arr,'Nothing here yet.');
  $('#back').onclick=()=>{SUBJ=null;render();};
}

function extras(){
  const s=q();
  const fs=filt(M.extras.formula), nt=filt(M.extras.notes);
  app.innerHTML=`<div class="sectitle">Formula Sheets <span class="pill">${M.extras.formula.length}</span></div><div id="f"></div>
    <div class="sectitle">Class Notes <span class="pill">${M.extras.notes.length}</span></div><div id="n"></div>`;
  const w=id=>{const d=document.createElement('div');d.style.display='grid';d.style.gap='8px';$(id).appendChild(d);return d;};
  listInto(w('#f'),fs,'No formula sheets.');
  listInto(w('#n'),nt,'No notes.');
}

function infographics(){
  const arr=filt(M.extras.infographics||[]);
  app.innerHTML=`<div class="sectitle">English Chapter Infographics <span class="pill">${(M.extras.infographics||[]).length}</span></div>
    <p style="color:var(--muted);font-size:13.5px;margin:-6px 0 18px">Visual study-maps for Class 12 English (Flamingo &amp; Vistas), grounded in NCERT text. Click any to view full size.</p>
    <div class="gallery" id="gal"></div>`;
  const g=$('#gal');
  if(!arr.length){const e=document.createElement('div');e.className='empty';e.textContent='No infographics yet.';g.appendChild(e);return;}
  arr.forEach(it=>{
    const c=document.createElement('div');c.className='thumb';
    c.innerHTML=`<div class="thumbimg" style="background-image:url('${it.path}')"></div><div class="thumbcap">${it.title}</div>`;
    c.onclick=()=>open(it);
    g.appendChild(c);
  });
}

function render(){
  if(!M)return;
  if(VIEW==='home')home();
  else if(VIEW==='subject')subjectDetail();
  else if(VIEW==='pyq')flatView('pyq','PYQ Banks');
  else if(VIEW==='halfyearly')flatView('halfyearly','Half-Yearly');
  else if(VIEW==='final')flatView('final','Final Papers');
  else if(VIEW==='infographics')infographics();
  else if(VIEW==='extras')extras();
}

fetch('manifest.json?'+Date.now()).then(r=>r.json()).then(d=>{M=d;render();})
  .catch(e=>{app.innerHTML='<p class="empty">Could not load manifest.json — run build_site.py first.</p>';});
