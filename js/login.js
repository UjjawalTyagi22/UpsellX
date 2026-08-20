/* ---------- helpers ---------- */
function $(id){ return document.getElementById(id); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }
function deriveNameFromEmail(email){
  const local=email.split('@')[0]||'user';
  const parts=local.split(/[._\-0-9]+/).filter(Boolean);
  const named=parts.map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
  return named||'User';
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