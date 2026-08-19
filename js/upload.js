/* ---------- shared helpers ---------- */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }
function formatBytes(bytes){ if(bytes<1024) return bytes+' B'; const kb=bytes/1024; if(kb<1024) return kb.toFixed(1)+' KB'; return (kb/1024).toFixed(1)+' MB'; }
function niceNow(){ return new Date().toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}); }
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

/* ---------- upload logic ---------- */
const state={ file:null, fileName:'', fileSizeText:'', rowCount:null };

function handleDragOver(e){ e.preventDefault(); e.currentTarget.classList.add('drag-active'); }
function handleDragLeave(e){ e.currentTarget.classList.remove('drag-active'); }
function handleDrop(e){
  e.preventDefault(); e.currentTarget.classList.remove('drag-active');
  const f=e.dataTransfer.files && e.dataTransfer.files[0];
  if(f) processSelectedFile(f);
}
function onFileInputChange(e){
  const f=e.target.files && e.target.files[0];
  if(f) processSelectedFile(f);
}
function processSelectedFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  const err=$('uploadError');
  if(!['csv','xlsx','xls'].includes(ext)){
    err.textContent='Unsupported file type. Please upload a .csv or .xlsx file.'; err.style.display='block'; return;
  }
  if(file.size>25*1024*1024){
    err.textContent='File is larger than 25MB. Please upload a smaller file.'; err.style.display='block'; return;
  }
  err.style.display='none';
  parseFile(file, ext);
}
function parseFile(file, ext){
  state.file=file; state.fileName=file.name; state.fileSizeText=formatBytes(file.size); state.rowCount=null;
  showFilePreview();
  if(ext==='csv'){
    const reader=new FileReader();
    reader.onload=e=>{
      const lines=String(e.target.result).split(/\r\n|\n/).filter(l=>l.trim().length>0);
      state.rowCount=Math.max(0,lines.length-1);
    };
    reader.readAsText(file);
  } else {
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=new Uint8Array(e.target.result);
        const wb=XLSX.read(data,{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const range=XLSX.utils.decode_range(ws['!ref']);
        state.rowCount=Math.max(0, range.e.r-range.s.r);
      }catch(err){ state.rowCount=null; }
    };
    reader.readAsArrayBuffer(file);
  }
}
function showFilePreview(){
  $('fpName').textContent=state.fileName;
  $('fpSize').textContent=state.fileSizeText+' · Ready to process';
  $('filePreview').style.display='flex';
  $('continueBtn').disabled=false;
}
function removeFile(){
  state.file=null; state.fileName=''; state.rowCount=null;
  $('filePreview').style.display='none';
  $('continueBtn').disabled=true;
  $('fileInput').value='';
  $('uploadError').style.display='none';
}
function continueToProcessing(){
  if(!state.file) return;
  const user=currentUser();
  const q=buildQuery({
    name: user.name, email: user.email,
    file: state.fileName, size: state.fileSizeText,
    bytes: state.file.size, rows: state.rowCount || '',
    time: niceNow()
  });
  location.href='Processing.html?'+q;
}

/* ---------- page init ---------- */
renderNav('auth');