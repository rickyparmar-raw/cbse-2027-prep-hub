let M=null, VIEW='home', SUBJ=null, QZ=null, QSTATE=null;
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
    <div class="sectitle">Jump to a subject</div><div class="grid" id="subjcards"></div>
    <div class="sectitle">Browse by type</div><div class="grid typegrid" id="typecards"></div>
    <div class="sectitle" id="ig-title" style="display:none">Recent infographics</div><div class="gallery" id="ig-preview"></div>`;
  const g=$('#subjcards');
  Object.entries(M.subjects).forEach(([k,s])=>{
    const c=document.createElement('div');c.className='card';c.dataset.subj=k;
    c.innerHTML=`<div class="ic">${s.icon}</div><div class="nm">${s.pretty}</div>
      <div class="meta">${s.pyq.length} PYQ · ${s.halfyearly.length} half-yearly · ${s.final.length} final</div>
      <span class="arrow">→</span>`;
    c.onclick=()=>{SUBJ=k;VIEW='subject';render();};
    g.appendChild(c);
  });
  // browse-by-type quick nav
  const types=[
    {v:'pyq',ic:'📚',t:'PYQ Banks',n:`${st.pyq} chapters`},
    {v:'halfyearly',ic:'📝',t:'Half-Yearly',n:`${st.halfyearly} papers`},
    {v:'final',ic:'🎯',t:'Final Papers',n:`${st.final} papers`},
    {v:'infographics',ic:'🖼️',t:'Infographics',n:`${st.infographics||0} study-maps`},
    {v:'extras',ic:'📐',t:'Formula & Notes',n:`${st.formula+st.notes} files`},
  ];
  const tg=$('#typecards');
  types.forEach(x=>{
    const c=document.createElement('div');c.className='card';
    c.innerHTML=`<div class="ic">${x.ic}</div><div class="nm">${x.t}</div><div class="meta">${x.n}</div>`;
    c.onclick=()=>{document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===x.v));VIEW=x.v;SUBJ=null;render();};
    tg.appendChild(c);
  });
  // infographics preview strip (first 4)
  const igs=(M.extras.infographics||[]).slice(0,4);
  if(igs.length){
    $('#ig-title').style.display='';
    const ip=$('#ig-preview');
    igs.forEach(it=>{
      const c=document.createElement('div');c.className='thumb';
      c.innerHTML=`<div class="thumbimg" style="background-image:url('${it.path}')"></div><div class="thumbcap">${it.title}</div>`;
      c.onclick=()=>open(it);
      ip.appendChild(c);
    });
  }
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

function quizSubjects(){
  app.innerHTML=`<div class="sectitle">Quiz — pick a subject</div>
    <p style="color:var(--muted);font-size:13.5px;margin:-10px 0 20px">Interactive MCQ & Assertion-Reason practice, auto-scored. Pulled from the real PYQ banks.</p>
    <div class="grid" id="qg"></div>`;
  const g=$('#qg');
  if(!QZ){g.innerHTML='<div class="empty">Quiz data not loaded.</div>';return;}
  const subjMeta={Physics:'⚛️',Chemistry:'🧪',Mathematics:'📐',Physical_Education:'🏃'};
  let any=false;
  Object.entries(QZ).forEach(([k,v])=>{
    const nq=v.chapters.reduce((a,c)=>a+c.questions.length,0);
    if(!nq)return; any=true;
    const c=document.createElement('div');c.className='card';
    c.innerHTML=`<div class="ic">${v.icon||subjMeta[k]||'📘'}</div><div class="nm">${k.replace('_',' ')}</div><div class="meta">${nq} questions · ${v.chapters.length} chapters</div>`;
    c.onclick=()=>{QSTATE={subj:k};render();};
    g.appendChild(c);
  });
  if(!any)g.innerHTML='<div class="empty">No auto-gradable questions available yet.</div>';
}

function quizChapters(){
  const v=QZ[QSTATE.subj];
  app.innerHTML=`<span class="backlink" id="back">← All subjects</span>
    <div class="subhead"><span class="big">${v.icon||'📘'}</span><h2>${QSTATE.subj.replace('_',' ')} Quiz</h2></div>
    <p style="color:var(--muted);font-size:13.5px;margin:8px 0 20px">Pick a chapter, or test the whole subject.</p>
    <div style="margin-bottom:18px"><button class="rand" id="allq">🎲 Quiz all chapters (20 random)</button></div>
    <div id="qc" style="display:grid;gap:8px"></div>`;
  $('#back').onclick=()=>{QSTATE=null;render();};
  $('#allq').onclick=()=>{
    let pool=[];v.chapters.forEach(c=>c.questions.forEach(q=>pool.push(q)));
    pool=pool.sort(()=>Math.random()-0.5).slice(0,20);
    startQuiz('All chapters',pool);
  };
  const wrap=$('#qc');
  v.chapters.forEach(c=>{
    const el=document.createElement('div');el.className='item';
    el.innerHTML=`<span class="pic">❓</span><div class="txt"><div class="t"></div><div class="s">${c.questions.length} questions</div></div><span style="color:var(--faint)">→</span>`;
    el.querySelector('.t').textContent=c.title;
    el.onclick=()=>startQuiz(c.title, c.questions.slice().sort(()=>Math.random()-0.5));
    wrap.appendChild(el);
  });
}

function startQuiz(title, questions){
  QSTATE.quiz={title, questions, i:0, score:0, answered:false, picks:[]};
  renderQuestion();
}

function renderQuestion(){
  const Q=QSTATE.quiz, item=Q.questions[Q.i];
  app.innerHTML=`<span class="backlink" id="back">← Exit quiz</span>
    <div class="qbar"><span>${Q.title}</span><span>${Q.i+1} / ${Q.questions.length} · Score ${Q.score}</span></div>
    <div class="qprog"><div class="qprog-fill" style="width:${(Q.i/Q.questions.length)*100}%"></div></div>
    <div class="qcard">
      <div class="qtext">${item.q}</div>
      <div class="qopts" id="opts"></div>
      <div id="qfeed"></div>
      <div id="qnav"></div>
    </div>`;
  $('#back').onclick=()=>{if(confirm('Exit this quiz? Progress is lost.')){QSTATE={subj:QSTATE.subj};render();}};
  const opts=$('#opts');
  item.opts.forEach((o,idx)=>{
    const b=document.createElement('button');b.className='qopt';
    b.innerHTML=`<span class="qlet">${String.fromCharCode(65+idx)}</span><span>${o}</span>`;
    b.onclick=()=>pick(idx);
    opts.appendChild(b);
  });
  if(window.MathJax&&MathJax.typesetPromise)MathJax.typesetPromise([app]);
}

function pick(idx){
  const Q=QSTATE.quiz, item=Q.questions[Q.i];
  if(Q.answered)return;
  Q.answered=true; Q.picks.push(idx);
  const correct=item.correct;
  if(idx===correct)Q.score++;
  document.querySelectorAll('.qopt').forEach((b,i)=>{
    b.classList.add('locked');
    if(i===correct)b.classList.add('right');
    else if(i===idx)b.classList.add('wrong');
  });
  $('#qfeed').innerHTML=idx===correct
    ?`<div class="feed ok">✓ Correct</div>`
    :`<div class="feed no">✗ Correct answer: ${String.fromCharCode(65+correct)}</div>`;
  const nav=$('#qnav');
  const last=Q.i===Q.questions.length-1;
  const btn=document.createElement('button');btn.className='rand';btn.textContent=last?'See result':'Next question →';
  btn.onclick=()=>{ if(last){quizResult();} else {Q.i++;Q.answered=false;renderQuestion();} };
  nav.appendChild(btn);
}

function quizResult(){
  const Q=QSTATE.quiz, pct=Math.round(Q.score/Q.questions.length*100);
  const msg=pct>=80?'Excellent — exam ready.':pct>=60?'Solid. A bit more revision.':pct>=40?'Getting there — review the weak spots.':'Needs work. Revisit the chapter.';
  app.innerHTML=`<div class="result">
      <div class="rpct">${pct}%</div>
      <div class="rscore">${Q.score} / ${Q.questions.length} correct</div>
      <div class="rmsg">${msg}</div>
      <div class="rbtns">
        <button class="rand" id="retry">Retry</button>
        <button class="rand alt" id="more">Another chapter</button>
      </div>
    </div>`;
  $('#retry').onclick=()=>startQuiz(Q.title, Q.questions.slice().sort(()=>Math.random()-0.5));
  $('#more').onclick=()=>{QSTATE={subj:QSTATE.subj};render();};
}

function quizView(){
  if(!QSTATE){quizSubjects();return;}
  if(QSTATE.quiz){QSTATE.quiz.answered?renderQuestion():renderQuestion();return;}
  quizChapters();
}

function render(){
  if(!M)return;
  if(VIEW==='home')home();
  else if(VIEW==='subject')subjectDetail();
  else if(VIEW==='pyq')flatView('pyq','PYQ Banks');
  else if(VIEW==='halfyearly')flatView('halfyearly','Half-Yearly');
  else if(VIEW==='final')flatView('final','Final Papers');
  else if(VIEW==='quiz')quizView();
  else if(VIEW==='infographics')infographics();
  else if(VIEW==='extras')extras();
}

fetch('manifest.json?'+Date.now()).then(r=>r.json()).then(d=>{M=d;render();})
  .catch(e=>{app.innerHTML='<p class="empty">Could not load manifest.json — run build_site.py first.</p>';});
fetch('quiz_data.json?'+Date.now()).then(r=>r.json()).then(d=>{QZ=d;}).catch(e=>{QZ=null;});
