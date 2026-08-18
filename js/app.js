/* ============================================================
   UpsellX — Complete Single-Page Application (js/app.js)
   ============================================================ */

/* ---------------- STATE ---------------- */
const state = {
  loggedIn: false,
  userEmail: '',
  userName: '',
  file: null,
  fileName: '',
  fileSizeText: '',
  rowCount: null,
  uploadTimeText: '',
  dashboardReady: false,
  filter: 'all'
};

let segChart = null;
let procTimer = null;

const $ = id => document.getElementById(id);

/* ---------------- NAV / ROUTING ---------------- */
function goTo(name) {
  ['landing', 'login', 'upload', 'processing', 'dashboard'].forEach(s => {
    const el = $('screen-' + s);
    if (el) el.classList.toggle('active', s === name);
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
  renderNav(name);
}

function scrollToSection(id) {
  if (!$('screen-landing').classList.contains('active')) {
    goTo('landing');
  }
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 90;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, 40);
}

function onLogoClick() {
  if (!state.loggedIn) {
    goTo('landing');
  } else if (state.dashboardReady) {
    goTo('dashboard');
  } else {
    goTo('upload');
  }
}

function renderNav(screen) {
  const navMid = $('navMid');
  const navRight = $('navRight');
  if (!navRight) return;

  if (screen === 'landing') {
    if (navMid) navMid.style.display = 'flex';
    navRight.innerHTML = `
      <button class="nav-ghost" type="button" onclick="goTo('login')">Log In</button>
      <button class="nav-btn" type="button" onclick="goTo('login')">Get Started</button>`;
  } else if (screen === 'login') {
    if (navMid) navMid.style.display = 'none';
    navRight.innerHTML = `
      <button class="nav-ghost" type="button" onclick="goTo('landing')">Back to home</button>`;
  } else {
    if (navMid) navMid.style.display = 'none';
    const initials = initialsFromName(state.userName || 'User');
    const exportBtn = screen === 'dashboard'
      ? `<button class="nav-btn" type="button" onclick="exportCSV()">Export CSV</button>`
      : '';
    navRight.innerHTML = `
      <div class="nav-user">
        <div class="avatar">${initials}</div>
        <span class="nav-user-name">${escapeHtml(firstNameOf(state.userName))}</span>
      </div>
      ${exportBtn}
      <button class="nav-ghost" type="button" onclick="logout()">Log out</button>`;
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function firstNameOf(name) {
  return (name || 'User').split(' ')[0];
}

function initialsFromName(name) {
  const parts = (name || 'User').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function deriveNameFromEmail(email) {
  const local = (email || '').split('@')[0] || 'user';
  const parts = local.split(/[._\-0-9]+/).filter(Boolean);
  const named = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  return named || 'User';
}

function niceNow() {
  return new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}

/* ---------------- LOGIN ---------------- */
function handleLogin() {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPassword').value;
  const err = $('loginError');

  if (!email || !pass) {
    err.textContent = 'Enter both email and password to continue.';
    err.style.display = 'block';
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    err.textContent = 'Enter a valid email address.';
    err.style.display = 'block';
    return;
  }

  err.style.display = 'none';
  state.loggedIn = true;
  state.userEmail = email;
  state.userName = deriveNameFromEmail(email);
  goTo('upload');
}

function handleGoogleLogin() {
  state.loggedIn = true;
  state.userEmail = 'ananya.rao@upsellx-demo.com';
  state.userName = 'Ananya Rao';
  goTo('upload');
}

function logout() {
  clearInterval(procTimer);
  state.loggedIn = false;
  state.userEmail = '';
  state.userName = '';
  state.file = null;
  state.fileName = '';
  state.rowCount = null;
  state.dashboardReady = false;
  state.filter = 'all';

  if ($('loginEmail')) $('loginEmail').value = '';
  if ($('loginPassword')) $('loginPassword').value = '';
  if ($('loginError')) $('loginError').style.display = 'none';

  removeFile();
  goTo('landing');
}

function viewDemoDashboard() {
  state.loggedIn = true;
  state.userEmail = 'ananya.rao@upsellx-demo.com';
  state.userName = 'Ananya Rao';
  state.fileName = 'sample_telecom_cdr.csv';
  state.rowCount = 12480;
  state.uploadTimeText = niceNow();
  computeDashboard();
  goTo('dashboard');
}

/* ---------------- UPLOAD ---------------- */
function handleDragOver(e) {
  e.preventDefault();
  $('dropzone').classList.add('drag-active');
}

function handleDragLeave(e) {
  $('dropzone').classList.remove('drag-active');
}

function handleDrop(e) {
  e.preventDefault();
  $('dropzone').classList.remove('drag-active');
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) processSelectedFile(f);
}

function onFileInputChange(e) {
  const f = e.target.files && e.target.files[0];
  if (f) processSelectedFile(f);
}

function processSelectedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const err = $('uploadError');

  if (!['csv', 'xlsx', 'xls'].includes(ext)) {
    err.textContent = 'Unsupported file type. Please upload a .csv or .xlsx file.';
    err.style.display = 'block';
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    err.textContent = 'File is larger than 25 MB. Please upload a smaller file.';
    err.style.display = 'block';
    return;
  }

  err.style.display = 'none';
  parseFile(file, ext);
}

function parseFile(file, ext) {
  state.file = file;
  state.fileName = file.name;
  state.fileSizeText = formatBytes(file.size);
  state.rowCount = null;
  showFilePreview();

  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = String(e.target.result).split(/\r\n|\n/).filter(l => l.trim().length > 0);
      state.rowCount = Math.max(0, lines.length - 1);
    };
    reader.readAsText(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const range = XLSX.utils.decode_range(ws['!ref']);
        state.rowCount = Math.max(0, range.e.r - range.s.r);
      } catch (_) { state.rowCount = null; }
    };
    reader.readAsArrayBuffer(file);
  }
}

function showFilePreview() {
  $('fpName').textContent = state.fileName;
  $('fpSize').textContent = state.fileSizeText + ' · Ready to process';
  $('filePreview').style.display = 'flex';
  $('continueBtn').disabled = false;
}

function removeFile() {
  state.file = null;
  state.fileName = '';
  state.rowCount = null;
  if ($('filePreview')) $('filePreview').style.display = 'none';
  if ($('continueBtn')) $('continueBtn').disabled = true;
  if ($('fileInput')) $('fileInput').value = '';
  if ($('uploadError')) $('uploadError').style.display = 'none';
}

function uploadAnother() {
  state.dashboardReady = false;
  removeFile();
  goTo('upload');
}

function continueToProcessing() {
  if (!state.file) return;
  state.uploadTimeText = niceNow();
  goTo('processing');
  runProcessing();
}

/* ---------------- PROCESSING ---------------- */
function setTaskState(idx, s) {
  const row = $('taskrow' + idx);
  if (!row) return;
  row.className = 'taskrow ' + (s === 'pending' ? '' : s);
  const icon = row.querySelector('.ticon');
  const status = row.querySelector('.tstatus');

  if (s === 'done') {
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    status.textContent = 'Done';
  } else if (s === 'current') {
    icon.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>`;
    status.textContent = 'Running';
  } else {
    icon.innerHTML = '';
    status.textContent = 'Pending';
  }
}

const THRESH = [15, 35, 55, 75, 90, 100];
function updateProgressUI(p) {
  $('ringVal').textContent = Math.round(p) + '%';
  $('ringProgress').setAttribute('stroke-dashoffset', (490.09 * (1 - p / 100)).toFixed(2));
}

function updateTasksByProgress(p) {
  for (let i = 1; i <= 6; i++) {
    const prevThresh = i === 1 ? 0 : THRESH[i - 2];
    if (p >= THRESH[i - 1]) setTaskState(i, 'done');
    else if (p >= prevThresh) setTaskState(i, 'current');
    else setTaskState(i, 'pending');
  }
}

function runProcessing() {
  let progress = 0;
  updateProgressUI(0);
  updateTasksByProgress(0);
  clearInterval(procTimer);

  procTimer = setInterval(() => {
    progress += Math.random() * 3 + 1.3;
    if (progress >= 100) {
      progress = 100;
      clearInterval(procTimer);
      updateProgressUI(100);
      for (let i = 1; i <= 6; i++) setTaskState(i, 'done');
      setTimeout(() => { computeDashboard(); goTo('dashboard'); }, 550);
      return;
    }
    updateProgressUI(progress);
    updateTasksByProgress(progress);
  }, 140);
}

function skipProcessing() {
  clearInterval(procTimer);
  updateProgressUI(100);
  for (let i = 1; i <= 6; i++) setTaskState(i, 'done');
  setTimeout(() => { computeDashboard(); goTo('dashboard'); }, 250);
}

/* ---------------- DASHBOARD ---------------- */
function estimateRowsFromSize(bytes) {
  const est = Math.round(bytes / 42);
  return Math.min(60000, Math.max(300, est));
}

const SAMPLE = [
  { name: 'Rohit Mehta', plan: 'Postpaid Premium · 3.2 yrs', seg: 'up', score: 92 },
  { name: 'Sanya Kapoor', plan: 'Postpaid Standard · 1.8 yrs', seg: 'up', score: 88 },
  { name: 'Arjun Verma', plan: 'Prepaid · 4 complaints (30d)', seg: 'risk', score: 81 },
  { name: 'Priya Nair', plan: 'Postpaid Premium · 2.1 yrs', seg: 'up', score: 85 },
  { name: 'Karan Thakur', plan: 'Prepaid · Low usage', seg: 'low', score: 24 },
  { name: 'Divya Joshi', plan: 'Postpaid Standard · 6 complaints (30d)', seg: 'risk', score: 76 },
  { name: 'Manav Gupta', plan: 'Postpaid Premium · 5.4 yrs', seg: 'up', score: 79 },
  { name: 'Neha Sharma', plan: 'Prepaid · Low usage', seg: 'low', score: 18 },
  { name: 'Aditya Rao', plan: 'Prepaid · Steady usage', seg: 'low', score: 33 },
  { name: 'Ishita Bose', plan: 'Postpaid Standard · 2.6 yrs', seg: 'up', score: 74 },
  { name: 'Vikram Singh', plan: 'Postpaid Premium · 5 complaints (30d)', seg: 'risk', score: 70 },
  { name: 'Meera Iyer', plan: 'Prepaid · Low usage', seg: 'low', score: 21 },
  { name: 'Suresh Pillai', plan: 'Postpaid Standard · 4.1 yrs', seg: 'low', score: 41 },
  { name: 'Ananya Das', plan: 'Postpaid Premium · 1.4 yrs', seg: 'up', score: 81 },
  { name: 'Farhan Sheikh', plan: 'Prepaid · Low usage', seg: 'low', score: 15 },
  { name: 'Ritu Malhotra', plan: 'Postpaid Standard · 3 complaints (30d)', seg: 'risk', score: 68 },
  { name: 'Nikhil Reddy', plan: 'Prepaid · Growing usage', seg: 'low', score: 47 },
  { name: 'Sneha Kulkarni', plan: 'Postpaid Premium · 2.9 yrs', seg: 'up', score: 90 },
  { name: 'Amitabh Rana', plan: 'Prepaid · Low usage', seg: 'low', score: 12 },
  { name: 'Tanvi Chauhan', plan: 'Postpaid Standard · 1.1 yrs', seg: 'low', score: 38 },
];

function segColor(seg) {
  return seg === 'up' ? '#1f6644' : seg === 'risk' ? '#8c2424' : '#a8a49b';
}
function segGradient(seg) {
  if (seg === 'up') return 'linear-gradient(135deg,#3aa876,#1f6644)';
  if (seg === 'risk') return 'linear-gradient(135deg,#b04949,#8c2424)';
  return 'linear-gradient(135deg,#a8a49b,#8b877e)';
}
function initialsOf(name) {
  const p = name.split(' ');
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function computeDashboard() {
  const fileName = state.fileName || 'sample_telecom_cdr.csv';
  const time = state.uploadTimeText || niceNow();
  let total = state.rowCount;
  if (!total || total <= 0) {
    total = state.file ? estimateRowsFromSize(state.file.size) : 12480;
  }

  const upsellCount = Math.round(total * 0.187);
  const riskCount = Math.round(total * 0.09);
  const lowCount = Math.max(0, total - upsellCount - riskCount);

  $('dashSubtitle').textContent = `From ${fileName} · uploaded ${time}`;
  $('statTotal').textContent = total.toLocaleString('en-IN');
  $('statUp').textContent = upsellCount.toLocaleString('en-IN');
  $('statUpSub').textContent = (total ? (upsellCount / total * 100).toFixed(1) : '0') + '% of customer base';
  $('statRisk').textContent = riskCount.toLocaleString('en-IN');
  $('statRiskSub').textContent = (total ? (riskCount / total * 100).toFixed(1) : '0') + '% — retain before you upsell';
  $('barUp').style.width = Math.min(100, (upsellCount / total * 100)).toFixed(1) + '%';
  $('barRisk').style.width = Math.min(100, (riskCount / total * 100)).toFixed(1) + '%';

  $('tabAll').textContent = total.toLocaleString('en-IN');
  $('tabUp').textContent = upsellCount.toLocaleString('en-IN');
  $('tabRisk').textContent = riskCount.toLocaleString('en-IN');
  $('tabLow').textContent = lowCount.toLocaleString('en-IN');

  const labels = ['High Upsell', 'Retain First', 'Low Priority'];
  const data = [upsellCount, riskCount, lowCount];
  const colors = ['#1f6644', '#8c2424', '#ccc9c0'];

  if (segChart) segChart.destroy();
  const ctx = $('segChart').getContext('2d');
  segChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'rgba(255,255,255,.9)',
        borderWidth: 3,
        hoverOffset: 5
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#e2dfd8',
          borderWidth: 1,
          titleColor: '#111',
          bodyColor: '#6a6760',
          padding: 11
        }
      },
      animation: { animateRotate: true, duration: 500 }
    }
  });

  $('chartCenter').textContent = total.toLocaleString('en-IN');
  $('legend').innerHTML = labels.map((l, i) => `
    <div class="lgrow">
      <div class="lgdot" style="background:${colors[i]}"></div>
      <div class="lgname">${l}</div>
      <div class="lgpct" style="color:${colors[i]}">${Math.round(data[i] / total * 100)}%</div>
    </div>`).join('');

  $('actionList').innerHTML = `
    <div class="action-row">
      <div class="aico"><svg viewBox="0 0 24 24" fill="none" stroke="#5b43d6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>
      <div class="atext"><b>Push premium data add-on</b><span>${upsellCount.toLocaleString('en-IN')} customers score 70+ on upsell — mostly Postpaid Premium users nearing their plan limit.</span></div>
    </div>
    <div class="action-row">
      <div class="aico" style="background:#f8eded"><svg viewBox="0 0 24 24" fill="none" stroke="#8c2424" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
      <div class="atext"><b>Route to retention team first</b><span>${riskCount.toLocaleString('en-IN')} customers flagged high churn risk — repeated complaints in the last 30 days.</span></div>
    </div>
    <div class="action-row">
      <div class="aico" style="background:#eceff2"><svg viewBox="0 0 24 24" fill="none" stroke="#6a6760" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
      <div class="atext"><b>Deprioritize outreach</b><span>${lowCount.toLocaleString('en-IN')} customers show low usage and low upsell probability — safe to skip this cycle.</span></div>
    </div>`;

  state.dashboardReady = true;
  setFilter('all');
}

function setFilter(seg) {
  state.filter = seg;
  document.querySelectorAll('#segTabs .tab').forEach(t => t.classList.toggle('tab-active', t.dataset.seg === seg));
  renderCustomerList(seg);
}

function renderCustomerList(seg) {
  const list = seg === 'all' ? SAMPLE : SAMPLE.filter(c => c.seg === seg);
  const wrap = $('custList');

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-note">No customers in this segment (preview sample).</div>';
    return;
  }

  wrap.innerHTML = list.map(c => {
    const badgeLabel = c.seg === 'up' ? 'High Upsell' : c.seg === 'risk' ? 'Retain First' : 'Low Priority';
    const scoreLbl = c.seg === 'risk' ? 'risk' : 'score';
    return `<div class="custrow">
      <div class="cbar" style="background:${segColor(c.seg)}"></div>
      <div class="cinit" style="background:${segGradient(c.seg)}">${initialsOf(c.name)}</div>
      <div class="cinfo"><div class="cname">${escapeHtml(c.name)}</div><div class="cplan">${escapeHtml(c.plan)}</div></div>
      <span class="cbadge ${c.seg}">${badgeLabel}</span>
      <div class="cscore"><div class="cscore-val" style="color:${segColor(c.seg)}">${c.score}</div><div class="cscore-lbl">${scoreLbl}</div></div>
    </div>`;
  }).join('');
}

function exportCSV() {
  const rows = [['Name', 'Plan', 'Segment', 'Score']];
  SAMPLE.forEach(c => rows.push([c.name, c.plan, c.seg === 'up' ? 'High Upsell' : c.seg === 'risk' ? 'Retain First' : 'Low Priority', c.score]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `UpsellX_Segments_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Allow enter key on login inputs
  if ($('loginPassword')) {
    $('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  }
  if ($('loginEmail')) {
    $('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  }
  renderNav('landing');
});
