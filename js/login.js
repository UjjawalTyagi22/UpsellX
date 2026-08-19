/* ---------- shared helpers ---------- */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }
function firstNameOf(name){ return (name||'User').split(' ')[0]; }
function initialsFromName(name){ const parts=(name||'User').trim().split(/\s+/); if(parts.length===1) return parts[0].charAt(0).toUpperCase(); return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase(); }
function deriveNameFromEmail(email){ const local=email.split('@')[0]||'user'; const parts=local.split(/[._\-0-9]+/).filter(Boolean); const named=parts.map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' '); return named||'User'; }
function currentUser(){ const demo=getParam('demo')==='1'; const name=getParam('name')||(demo?'Ananya Rao':''); const email=getParam('email')||(demo?'ananya.rao@upsellx-demo.com':''); return {name,email,demo,loggedIn:!!(name||demo)}; }

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

/* ---------- login logic ---------- */
function handleLogin(){
  const email=$('loginEmail').value.trim();
  const pass=$('loginPassword').value;
  const err=$('loginError');
  if(!email||!pass){ err.textContent='Enter both email and password to continue.'; err.style.display='block'; return; }
  if(!email.includes('@')||!email.includes('.')){ err.textContent='Enter a valid email address.'; err.style.display='block'; return; }
  err.style.display='none';
  const name=deriveNameFromEmail(email);
  location.href='upload.html?'+buildQuery({name:name, email:email});
}
function handleGoogleLogin(){
  location.href='upload.html?'+buildQuery({name:'Ananya Rao', email:'ananya.rao@upsellx-demo.com'});
}

/* ---------- page init ---------- */
renderNav('login');