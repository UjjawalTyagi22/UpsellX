/* ---------- shared helpers ---------- */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }
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

/* ---------- dashboard logic ---------- */
let segChart=null;
function estimateRowsFromSize(bytes){
  const est=Math.round(bytes/42);
  return Math.min(60000, Math.max(300, est));
}
const SAMPLE=[
  {name:'Rohit Mehta', plan:'Postpaid Premium · 3.2 yrs', seg:'up', score:92},
  {name:'Sanya Kapoor', plan:'Postpaid Standard · 1.8 yrs', seg:'up', score:88},
  {name:'Arjun Verma', plan:'Prepaid · 4 complaints (30d)', seg:'risk', score:81},
  {name:'Priya Nair', plan:'Postpaid Premium · 2.1 yrs', seg:'up', score:85},
  {name:'Karan Thakur', plan:'Prepaid · Low usage', seg:'low', score:24},
  {name:'Divya Joshi', plan:'Postpaid Standard · 6 complaints (30d)', seg:'risk', score:76},
  {name:'Manav Gupta', plan:'Postpaid Premium · 5.4 yrs', seg:'up', score:79},
  {name:'Neha Sharma', plan:'Prepaid · Low usage', seg:'low', score:18},
  {name:'Aditya Rao', plan:'Prepaid · Steady usage', seg:'low', score:33},
  {name:'Ishita Bose', plan:'Postpaid Standard · 2.6 yrs', seg:'up', score:74},
  {name:'Vikram Singh', plan:'Postpaid Premium · 5 complaints (30d)', seg:'risk', score:70},
  {name:'Meera Iyer', plan:'Prepaid · Low usage', seg:'low', score:21},
  {name:'Suresh Pillai', plan:'Postpaid Standard · 4.1 yrs', seg:'low', score:41},
  {name:'Ananya Das', plan:'Postpaid Premium · 1.4 yrs', seg:'up', score:81},
  {name:'Farhan Sheikh', plan:'Prepaid · Low usage', seg:'low', score:15},
  {name:'Ritu Malhotra', plan:'Postpaid Standard · 3 complaints (30d)', seg:'risk', score:68},
  {name:'Nikhil Reddy', plan:'Prepaid · Growing usage', seg:'low', score:47},
  {name:'Sneha Kulkarni', plan:'Postpaid Premium · 2.9 yrs', seg:'up', score:90},
  {name:'Amitabh Rana', plan:'Prepaid · Low usage', seg:'low', score:12},
  {name:'Tanvi Chauhan', plan:'Postpaid Standard · 1.1 yrs', seg:'low', score:38},
];
function segColor(seg){ return seg==='up'?'#1f6644':seg==='risk'?'#8c2424':'#a8a49b'; }
function segGradient(seg){
  if(seg==='up') return 'linear-gradient(135deg,#3aa876,#1f6644)';
  if(seg==='risk') return 'linear-gradient(135deg,#b04949,#8c2424)';
  return 'linear-gradient(135deg,#a8a49b,#8b877e)';
}
function initialsOf(name){ const p=name.split(' '); return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase(); }

function computeDashboard(){
  const fileName=getParam('file') || 'sample_telecom_cdr.csv';
  const time=getParam('time') || niceNow();
  const rowsParam=getParam('rows');
  const bytesParam=getParam('bytes');
  const isDemo=getParam('demo')==='1';

  let total;
  if(rowsParam && !isNaN(parseInt(rowsParam)) && parseInt(rowsParam)>0){ total=parseInt(rowsParam); }
  else if(bytesParam && !isNaN(parseInt(bytesParam))){ total=estimateRowsFromSize(parseInt(bytesParam)); }
  else { total=12480; }

  const upsellCount=Math.round(total*0.187);
  const riskCount=Math.round(total*0.09);
  const lowCount=Math.max(0, total-upsellCount-riskCount);

  $('dashSubtitle').textContent=`From ${fileName} · uploaded ${time}`;
  $('statTotal').textContent=total.toLocaleString('en-IN');
  $('statUp').textContent=upsellCount.toLocaleString('en-IN');
  $('statUpSub').textContent=(total? (upsellCount/total*100).toFixed(1):'0')+'% of customer base';
  $('statRisk').textContent=riskCount.toLocaleString('en-IN');
  $('statRiskSub').textContent=(total? (riskCount/total*100).toFixed(1):'0')+'% — retain before you upsell';
  $('barUp').style.width=Math.min(100,(upsellCount/total*100)).toFixed(1)+'%';
  $('barRisk').style.width=Math.min(100,(riskCount/total*100)).toFixed(1)+'%';

  $('tabAll').textContent=total.toLocaleString('en-IN');
  $('tabUp').textContent=upsellCount.toLocaleString('en-IN');
  $('tabRisk').textContent=riskCount.toLocaleString('en-IN');
  $('tabLow').textContent=lowCount.toLocaleString('en-IN');

  const labels=['High Upsell','Retain First','Low Priority'];
  const data=[upsellCount,riskCount,lowCount];
  const colors=['#1f6644','#8c2424','#ccc9c0'];
  if(segChart) segChart.destroy();
  const ctx=$('segChart').getContext('2d');
  segChart=new Chart(ctx,{type:'doughnut',data:{labels:labels,datasets:[{data:data,backgroundColor:colors,borderColor:'rgba(255,255,255,.9)',borderWidth:3,hoverOffset:5}]},
    options:{cutout:'70%',plugins:{legend:{display:false},tooltip:{backgroundColor:'#fff',borderColor:'#e2dfd8',borderWidth:1,titleColor:'#111',bodyColor:'#6a6760',padding:11}},animation:{animateRotate:true,duration:500}}});
  $('chartCenter').textContent=total.toLocaleString('en-IN');
  $('legend').innerHTML=labels.map((l,i)=>`<div class="lgrow"><div class="lgdot" style="background:${colors[i]}"></div><div class="lgname">${l}</div><div class="lgpct" style="color:${colors[i]}">${Math.round(data[i]/total*100)}%</div></div>`).join('');

  $('actionList').innerHTML=`
  <div class="action-row"><div class="aico"><svg viewBox="0 0 24 24" fill="none" stroke="#5b43d6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>
  <div class="atext"><b>Push premium data add-on</b><span>${upsellCount.toLocaleString('en-IN')} customers score 70+ on upsell — mostly Postpaid Premium users nearing their plan limit.</span></div></div>
  <div class="action-row"><div class="aico" style="background:#f8eded"><svg viewBox="0 0 24 24" fill="none" stroke="#8c2424" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
  <div class="atext"><b>Route to retention team first</b><span>${riskCount.toLocaleString('en-IN')} customers flagged high churn risk — repeated complaints in the last 30 days.</span></div></div>
  <div class="action-row"><div class="aico" style="background:#eceff2"><svg viewBox="0 0 24 24" fill="none" stroke="#6a6760" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
  <div class="atext"><b>Deprioritize outreach</b><span>${lowCount.toLocaleString('en-IN')} customers show low usage and low upsell probability — safe to skip this cycle.</span></div></div>`;

  setFilter('all');
}
function setFilter(seg){
  document.querySelectorAll('#segTabs .tab').forEach(t=>t.classList.toggle('tab-active', t.dataset.seg===seg));
  renderCustomerList(seg);
}
function renderCustomerList(seg){
  const list = seg==='all' ? SAMPLE : SAMPLE.filter(c=>c.seg===seg);
  const wrap=$('custList');
  if(!list.length){ wrap.innerHTML='<div class="empty-note">No customers in this segment (preview sample).</div>'; return; }
  wrap.innerHTML=list.map(c=>{
    const badgeClass=c.seg;
    const badgeLabel=c.seg==='up'?'High Upsell':c.seg==='risk'?'Retain First':'Low Priority';
    const scoreLbl=c.seg==='risk'?'risk':'score';
    return `<div class="custrow">
      <div class="cbar" style="background:${segColor(c.seg)}"></div>
      <div class="cinit" style="background:${segGradient(c.seg)}">${initialsOf(c.name)}</div>
      <div class="cinfo"><div class="cname">${escapeHtml(c.name)}</div><div class="cplan">${escapeHtml(c.plan)}</div></div>
      <span class="cbadge ${badgeClass}">${badgeLabel}</span>
      <div class="cscore"><div class="cscore-val" style="color:${segColor(c.seg)}">${c.score}</div><div class="cscore-lbl">${scoreLbl}</div></div>
    </div>`;
  }).join('');
}
function exportCSV(){
  const rows=[['Name','Plan','Segment','Score']];
  SAMPLE.forEach(c=>rows.push([c.name,c.plan,c.seg==='up'?'High Upsell':c.seg==='risk'?'Retain First':'Low Priority',c.score]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`UpsellX_Segments_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}
function uploadAnother(){
  const user=currentUser();
  location.href='upload.html?'+buildQuery({name:user.name, email:user.email});
}

/* ---------- page init ---------- */
renderNav('dashboard');
computeDashboard();