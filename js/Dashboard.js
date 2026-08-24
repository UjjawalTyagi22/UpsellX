/* ---------- shared helpers (UNCHANGED — same as before) ---------- */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }
function niceNow(){ return new Date().toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}); }
function firstNameOf(name){ return (name||'User').split(' ')[0]; }
function initialsFromName(name){ const parts=(name||'User').trim().split(/\s+/); if(parts.length===1) return parts[0].charAt(0).toUpperCase(); return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase(); }
/* NAYA — ab URL params pe bharosa nahi karte. Seedha backend se
   poochte hain "yeh JWT cookie kiska hai" — yehi asli, reliable
   tarika hai kyunki cookie hamesha browser mein maujood hai,
   URL params ki tarah page-to-page carry nahi karni padti. */
async function currentUser(){
  try{
    const res = await fetch('http://127.0.0.1:8000/auth/me', { credentials: 'include' });
    if(!res.ok) return { name:'Guest', email:'', loggedIn:false };
    const data = await res.json();
    return { name: data.name, email: data.email, loggedIn: true };
  } catch(e){
    return { name:'Guest', email:'', loggedIn:false };
  }
}

/* renderNav ab async hai kyunki currentUser() ab backend call karta hai */
async function renderNav(context){
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
    const user = await currentUser();
    const initials=initialsFromName(user.name||'User');
    const exportBtn = context==='dashboard' ? `<button class="nav-btn" type="button" onclick="exportCSV()">Export CSV</button>` : '';
    navRight.innerHTML=`<div class="nav-user"><div class="avatar">${initials}</div><span class="nav-user-name">${escapeHtml(firstNameOf(user.name||'User'))}</span></div>${exportBtn}<button class="nav-ghost" type="button" onclick="location.href='index.html'">Log out</button>`;
  }
}

/* ---------- dashboard logic ---------- */
let segChart=null;

/* seg colors — same as before, unchanged */
function segColor(seg){ return seg==='up'?'#1f6644':seg==='risk'?'#8c2424':'#a8a49b'; }
function segGradient(seg){
  if(seg==='up') return 'linear-gradient(135deg,#3aa876,#1f6644)';
  if(seg==='risk') return 'linear-gradient(135deg,#b04949,#8c2424)';
  return 'linear-gradient(135deg,#a8a49b,#8b877e)';
}
function initialsOf(name){ const p=String(name).split(' '); return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase(); }

/* -----------------------------------------------------------
   NAYA — backend ke "recommendation_type" ko humare purane
   seg system (up / risk / low) mein map karta hai, taaki
   baaki sara UI code (colors, badges) bina change kiye chale.
----------------------------------------------------------- */
function segOf(recommendation){
  if(!recommendation) return 'low';
  if(recommendation.recommendation_type === 'UPSELL') return 'up';
  if(recommendation.recommendation_type === 'RETENTION') return 'risk';
  return 'low';
}

/* Customer row ke liye "plan" wali subtitle line banata hai */
function planTextOf(result){
  const rec = result.recommendation;
  if(rec && rec.plan){
    return `${rec.plan.plan_name} · ${rec.reason}`;
  }
  return (rec && rec.reason) ? rec.reason : 'No recommendation available';
}

/* -----------------------------------------------------------
   NAYA — computeDashboard() ab sessionStorage se REAL result
   padhta hai (jo Processing.js ne save kiya tha), fake SAMPLE
   data ki jagah.
----------------------------------------------------------- */
function computeDashboard(){

  const stored = sessionStorage.getItem('upsellResults');

  // Agar koi result hi nahi mila (jaise user seedha Dashboard.html
  // pe aa gaya bina upload kiye), to usko wapas upload page bhejo.
  if(!stored){
    alert('No results found. Please upload a file first.');
    location.href = 'upload.html';
    return;
  }

  let data;
  try{
    data = JSON.parse(stored);
  } catch(e){
    alert('Saved result was corrupted. Please upload again.');
    location.href = 'upload.html';
    return;
  }

  const summary = data.summary;
  const results = data.results;

  // Baaki page (renderCustomerList, exportCSV) is list ko use karega
  window.CUSTOMER_RESULTS = results;

  const total     = summary.total;
  const upsellCount = summary.upsell_count;
  const riskCount   = summary.retention_count;
  const lowCount    = summary.no_recommendation_count;

  $('dashSubtitle').textContent = `From ${data.filename} · uploaded ${niceNow()}`;
  $('statTotal').textContent = total.toLocaleString('en-IN');
  $('statUp').textContent = upsellCount.toLocaleString('en-IN');
  $('statUpSub').textContent = (total ? (upsellCount/total*100).toFixed(1) : '0') + '% of customer base';
  $('statRisk').textContent = riskCount.toLocaleString('en-IN');
  $('statRiskSub').textContent = (total ? (riskCount/total*100).toFixed(1) : '0') + '% — retain before you upsell';
  $('barUp').style.width = Math.min(100, (upsellCount/total*100)).toFixed(1) + '%';
  $('barRisk').style.width = Math.min(100, (riskCount/total*100)).toFixed(1) + '%';

  $('tabAll').textContent = total.toLocaleString('en-IN');
  $('tabUp').textContent = upsellCount.toLocaleString('en-IN');
  $('tabRisk').textContent = riskCount.toLocaleString('en-IN');
  $('tabLow').textContent = lowCount.toLocaleString('en-IN');

  const labels = ['High Upsell','Retain First','Low Priority'];
  const chartData = [upsellCount, riskCount, lowCount];
  const colors = ['#1f6644','#8c2424','#ccc9c0'];

  if(segChart) segChart.destroy();
  const ctx = $('segChart').getContext('2d');
  segChart = new Chart(ctx,{
    type:'doughnut',
    data:{ labels:labels, datasets:[{ data:chartData, backgroundColor:colors, borderColor:'rgba(255,255,255,.9)', borderWidth:3, hoverOffset:5 }] },
    options:{ cutout:'70%', plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#fff',borderColor:'#e2dfd8',borderWidth:1,titleColor:'#111',bodyColor:'#6a6760',padding:11} }, animation:{animateRotate:true,duration:500} }
  });
  $('chartCenter').textContent = total.toLocaleString('en-IN');
  $('legend').innerHTML = labels.map((l,i)=>`<div class="lgrow"><div class="lgdot" style="background:${colors[i]}"></div><div class="lgname">${l}</div><div class="lgpct" style="color:${colors[i]}">${total ? Math.round(chartData[i]/total*100) : 0}%</div></div>`).join('');

  $('actionList').innerHTML = `
  <div class="action-row"><div class="aico"><svg viewBox="0 0 24 24" fill="none" stroke="#5b43d6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>
  <div class="atext"><b>Push relevant add-on plan</b><span>${upsellCount.toLocaleString('en-IN')} customers matched a strong upsell trigger (international, night, or voicemail usage).</span></div></div>
  <div class="action-row"><div class="aico" style="background:#f8eded"><svg viewBox="0 0 24 24" fill="none" stroke="#8c2424" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
  <div class="atext"><b>Route to retention team first</b><span>${riskCount.toLocaleString('en-IN')} customers have a churn probability of 70% or higher.</span></div></div>
  <div class="action-row"><div class="aico" style="background:#eceff2"><svg viewBox="0 0 24 24" fill="none" stroke="#6a6760" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
  <div class="atext"><b>Deprioritize outreach</b><span>${lowCount.toLocaleString('en-IN')} customers show no strong upsell or churn signal — safe to skip this cycle.</span></div></div>`;

  setFilter('all');
}

function setFilter(seg){
  document.querySelectorAll('#segTabs .tab').forEach(t=>t.classList.toggle('tab-active', t.dataset.seg===seg));
  renderCustomerList(seg);
}

function renderCustomerList(seg){
  const all = window.CUSTOMER_RESULTS || [];
  const list = seg==='all' ? all : all.filter(r => segOf(r.recommendation) === seg);
  const wrap = $('custList');

  if(!list.length){
    wrap.innerHTML = '<div class="empty-note">No customers in this segment.</div>';
    return;
  }

  /* Added `index` to map function below to generate 1, 2, 3... sequence */
  wrap.innerHTML = list.map((r, index) => {
    const seg = segOf(r.recommendation);
    const badgeLabel = seg==='up' ? 'High Upsell' : seg==='risk' ? 'Retain First' : 'Low Priority';
    const scorePct = Math.round((r.churn_score || 0) * 100);
    const idText = String(r.customer_id);
    const rowNumber = index + 1; // Generates 1, 2, 3, 4...

    return `<div class="custrow">
      <div class="cbar" style="background:${segColor(seg)}"></div>
      <div class="cinit" style="background:${segGradient(seg)}">${rowNumber}</div>
      <div class="cinfo"><div class="cname">${escapeHtml(idText)}</div><div class="cplan">${escapeHtml(planTextOf(r))}</div></div>
      <span class="cbadge ${seg}">${badgeLabel}</span>
      <div class="cscore"><div class="cscore-val" style="color:${segColor(seg)}">${scorePct}%</div><div class="cscore-lbl">churn risk</div></div>
    </div>`;
  }).join('');
}

/* -----------------------------------------------------------
   NAYA — CSV export bhi ab real results se banta hai
----------------------------------------------------------- */
function exportCSV(){
  const all = window.CUSTOMER_RESULTS || [];
  const rows = [['Customer ID','Recommendation','Plan','Price','Churn Risk %','Reason']];

  all.forEach(r=>{
    const seg = segOf(r.recommendation);
    const label = seg==='up' ? 'High Upsell' : seg==='risk' ? 'Retain First' : 'Low Priority';
    const plan = r.recommendation && r.recommendation.plan;

    rows.push([
      r.customer_id,
      label,
      plan ? plan.plan_name : '-',
      plan ? plan.price : '-',
      Math.round((r.churn_score || 0) * 100),
      (r.recommendation && r.recommendation.reason) || ''
    ]);
  });

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `UpsellX_Segments_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function uploadAnother(){
  await currentUser(); // just to keep session alive / confirm login
  location.href='upload.html';
}

/* ---------- page init ---------- */
/* renderNav ab async hai, isliye ek chhota init function bana ke chalate hain */
async function initPage(){
  await renderNav('dashboard');
  computeDashboard();
}
initPage();