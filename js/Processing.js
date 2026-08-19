/* ---------- shared helpers ---------- */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
function firstNameOf(name){ return (name||'User').split(' ')[0]; }
function initialsFromName(name){ const parts=(name||'User').trim().split(/\s+/); if(parts.length===1) return parts[0].charAt(0).toUpperCase(); return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase(); }
function currentUser(){ const demo=getParam('demo')==='1'; const name=getParam('name')||(demo?'Ananya Rao':'Guest'); const email=getParam('email')||(demo?'ananya.rao@upsellx-demo.com':''); return {name,email,demo,loggedIn:!!(name)}; }

function renderNav(context){
  const navMid=$('navMid'), navRight=$('navRight');
  if(context==='guest'){
    if(navMid) navMid.style.display='flex';
    navRight.innerHTML=`<button class="nav-ghost" type="button" onclick="location.href='login.html'">Log In</button>
    <button class="nav-btn" type="button" onclick="location.href='login.html'">Get Started</button>`;
  } else if(context==='login'){
    if(navMid) navMid.style.display='none';
    navRight.innerHTML=`<button class="nav-ghost" type="button" onclick="location.href='index.html'">Back to home</button>`;
  } else {
    if(navMid) navMid.style.display='none';
    const user=currentUser();
    const initials=initialsFromName(user.name||'User');
    const exportBtn = context==='dashboard' ? `<button class="nav-btn" type="button" onclick="exportCSV()">Export CSV</button>` : '';
    navRight.innerHTML=`<div class="nav-user"><div class="avatar">${initials}</div><span class="nav-user-name">${escapeHtml(firstNameOf(user.name||'User'))}</span></div>${exportBtn}<button class="nav-ghost" type="button" onclick="location.href='index.html'">Log out</button>`;
  }
}

/* ---------- processing logic ---------- */
let procTimer=null;

function setTaskState(idx, s){
  const row=$('taskrow'+idx);
  row.className='taskrow '+(s==='pending'?'':s);
  const icon=row.querySelector('.ticon');
  const status=row.querySelector('.tstatus');
  if(s==='done'){
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    status.textContent='Done';
  } else if(s==='current'){
    icon.innerHTML='<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>';
    status.textContent='Running';
  } else {
    icon.innerHTML='';
    status.textContent='Pending';
  }
}
const THRESH=[15,35,55,75,90,100];
function updateProgressUI(p){
  $('ringVal').textContent=Math.round(p)+'%';
  $('ringProgress').setAttribute('stroke-dashoffset', (490.09*(1-p/100)).toFixed(2));
}
function updateTasksByProgress(p){
  for(let i=1;i<=6;i++){
    const prevThresh = i===1?0:THRESH[i-2];
    if(p>=THRESH[i-1]) setTaskState(i,'done');
    else if(p>=prevThresh) setTaskState(i,'current');
    else setTaskState(i,'pending');
  }
}
function goToDashboard(){
  // forward every query param received (name, email, file, size, bytes, rows, time, demo) unchanged
  location.href='Dashboard.html'+window.location.search;
}
function runProcessing(){
  let progress=0;
  updateProgressUI(0);
  updateTasksByProgress(0);
  clearInterval(procTimer);
  procTimer=setInterval(()=>{
    progress+=Math.random()*3+1.3;
    if(progress>=100){
      progress=100;
      clearInterval(procTimer);
      updateProgressUI(100);
      for(let i=1;i<=6;i++) setTaskState(i,'done');
      setTimeout(goToDashboard, 550);
      return;
    }
    updateProgressUI(progress);
    updateTasksByProgress(progress);
  }, 140);
}
function skipProcessing(){
  clearInterval(procTimer);
  updateProgressUI(100);
  for(let i=1;i<=6;i++) setTaskState(i,'done');
  setTimeout(goToDashboard, 250);
}

/* ---------- page init ---------- */
renderNav('auth');
const fname=getParam('file');
if(fname){ $('procSub').innerHTML='Sit tight while we clean, score, and segment <strong>'+escapeHtml(fname)+'</strong>.'; }
runProcessing();