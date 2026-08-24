/* ---------- shared helpers (duplicated per page so each page/js pair is self-contained) ---------- */
function $(id) { return document.getElementById(id); }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function getParam(name) { return new URLSearchParams(window.location.search).get(name); }
function getAllParams() { const p = new URLSearchParams(window.location.search); const o = {}; for (const [k, v] of p.entries()) o[k] = v; return o; }
function buildQuery(params) { return Object.entries(params).filter(([k, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&'); }
function formatBytes(bytes) { if (bytes < 1024) return bytes + ' B'; const kb = bytes / 1024; if (kb < 1024) return kb.toFixed(1) + ' KB'; return (kb / 1024).toFixed(1) + ' MB'; }
function niceNow() { return new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }); }
function firstNameOf(name) { return (name || 'User').split(' ')[0]; }
function initialsFromName(name) { const parts = (name || 'User').trim().split(/\s+/); if (parts.length === 1) return parts[0].charAt(0).toUpperCase(); return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase(); }
function deriveNameFromEmail(email) { const local = email.split('@')[0] || 'user'; const parts = local.split(/[._\-0-9]+/).filter(Boolean); const named = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '); return named || 'User'; }

/* NAYA — ab URL params pe bharosa nahi karte. Seedha backend se
   poochte hain "yeh JWT cookie kiska hai" — cookie hamesha
   browser mein maujood hai, isliye yeh URL params se zyada
   reliable hai (page-to-page carry karne ki zaroorat nahi). */
async function currentUser() {
  try {
    const res = await fetch('http://127.0.0.1:8000/auth/me', { credentials: 'include' });
    if (!res.ok) return { name: '', email: '', loggedIn: false };
    const data = await res.json();
    return { name: data.name, email: data.email, loggedIn: true };
  } catch (e) {
    return { name: '', email: '', loggedIn: false };
  }
}

/* renderNav ab async hai kyunki currentUser() backend call karta hai */
async function renderNav(context) {
  const navMid = $('navMid'), navRight = $('navRight');
  if (context === 'guest') {
    if (navMid) navMid.style.display = 'none';
    navRight.innerHTML = `<button class="nav-ghost" type="button" onclick="scrollToHowItWorks()">How it Works</button>
    <button class="nav-ghost" type="button" onclick="location.href='login.html'">Log In</button>
    <button class="nav-btn" type="button" onclick="location.href='login.html'">Get Started</button>`;
  } else if (context === 'login') {
    if (navMid) navMid.style.display = 'none';
    navRight.innerHTML = `<button class="nav-ghost" type="button" onclick="location.href='index.html'">Back to home</button>`;
  } else {
    if (navMid) navMid.style.display = 'none';
    const user = await currentUser();
    const initials = initialsFromName(user.name || 'User');
    const exportBtn = context === 'dashboard' ? `<button class="nav-btn" type="button" onclick="exportCSV()">Export CSV</button>` : '';
    navRight.innerHTML = `<div class="nav-user"><div class="avatar">${initials}</div><span class="nav-user-name">${escapeHtml(firstNameOf(user.name || 'User'))}</span></div>${exportBtn}<button class="nav-ghost" type="button" onclick="location.href='index.html'">Log out</button>`;
  }
}


/* ---------- smooth scroll to how-it-works section ---------- */
function scrollToHowItWorks() {
  const el = $('howItWorks');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ---------- footer modal (Privacy / Terms / Contact) ---------- */
const MODAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    body: `
      <h4>Information We Collect</h4>
      <p>When you use UpsellX we collect account details you provide (name, email), the customer datasets you upload for analysis, and basic usage data such as pages visited and actions taken within the app.</p>
      <h4>How We Use It</h4>
      <p>We use this information to run the upsell and churn scoring pipeline, generate your dashboard, maintain your account, and improve the product. Uploaded datasets are used only to produce your predictions.</p>
      <h4>Data Sharing</h4>
      <p>We do not sell your data. We may share limited information with trusted infrastructure and analytics providers under confidentiality obligations, or when required to comply with the law.</p>
      <h4>Data Security</h4>
      <p>Data is encrypted in transit and at rest, and access is restricted to authorized personnel only.</p>
      <h4>Your Rights</h4>
      <ul>
        <li>Access, correct, or delete your account information</li>
        <li>Export or permanently delete any dataset you've uploaded</li>
        <li>Withdraw consent for non-essential data processing at any time</li>
      </ul>
      <h4>Cookies</h4>
      <p>We use essential cookies to keep you signed in, and optional analytics cookies to help us understand how the product is used.</p>
      <h4>Changes to This Policy</h4>
      <p>We may update this policy from time to time. Material changes will be communicated before they take effect.</p>
    `
  },
  terms: {
    title: 'Terms of Service',
    body: `
      <h4>Acceptance of Terms</h4>
      <p>By creating an account or using UpsellX, you agree to be bound by these terms. If you don't agree, please don't use the service.</p>
      <h4>Description of Service</h4>
      <p>UpsellX is an AI-powered platform that analyzes customer call and care data to produce upsell and churn-risk scores and segments.</p>
      <h4>Account Responsibilities</h4>
      <p>You're responsible for keeping your login credentials secure and for all activity that happens under your account.</p>
      <h4>Acceptable Use</h4>
      <ul>
        <li>Only upload data you own or have the rights to use</li>
        <li>No attempting to reverse-engineer or disrupt the service</li>
        <li>No unlawful, abusive, or harmful use of the platform</li>
      </ul>
      <h4>Data Ownership</h4>
      <p>You retain full ownership of any data you upload. We process it solely to deliver the service back to you.</p>
      <h4>Service Availability</h4>
      <p>UpsellX is provided "as is." We work to keep it reliable but don't guarantee uninterrupted or error-free access.</p>
      <h4>Limitation of Liability</h4>
      <p>Predictions and segments are informational and intended to support, not replace, your own business judgment. UpsellX isn't liable for indirect or consequential damages arising from use of the service.</p>
      <h4>Termination</h4>
      <p>We may suspend or terminate accounts that violate these terms. You're free to stop using UpsellX at any time.</p>
    `
  },
  contact: {
    title: 'Get in Touch',
    body: `
      <p>Have a question, feedback, or want a walkthrough of UpsellX? We'd love to hear from you.</p>
      <a class="contact-row" href="mailto:ujjawalt207@gmail.com">
        <div class="contact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#5b43d6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg></div>
        <div class="contact-meta"><div class="clabel-mini">Email</div><div class="cval-mini">ujjawalt207@gmail.com</div></div>
      </a>
      <a class="contact-row" href="tel:+919119799322">
        <div class="contact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="#5b43d6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
        <div class="contact-meta"><div class="clabel-mini">Phone</div><div class="cval-mini">+91 91197 99322</div></div>
      </a>
      <div class="modal-note">We typically reply within 1–2 business days.</div>
    `
  }
};
function openModal(key) {
  const data = MODAL_CONTENT[key];
  if (!data) return;
  $('modalTitle').textContent = data.title;
  $('modalBody').innerHTML = data.body;
  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function handleOverlayClick(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); }
});

/* ---------- page init ---------- */
/* Landing page hamesha 'guest' style nav dikhata hai (public page),
   isliye currentUser() call hi nahi hota yahan — await ki zaroorat nahi. */
renderNav('guest');