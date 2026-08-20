/* ---------- helpers ---------- */
function $(id){ return document.getElementById(id); }
function buildQuery(params){ return Object.entries(params).filter(([k,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'); }

/* ---------- validation rules ---------- */
// Name: letters + spaces only, 2-50 chars
const NAME_RE=/^[A-Za-z][A-Za-z\s]{1,49}$/;
// Email: standard shape check
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone: exactly 10 digits, first digit 6-9 (Indian mobile number format)
const PHONE_RE=/^[6-9]\d{9}$/;
// Password: min 8 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 symbol
const PASSWORD_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

function showErr(el,msg){ el.textContent=msg; el.style.display='block'; }
function hideErr(el){ el.style.display='none'; }

function validateName(){
  const v=$('suName').value.trim();
  const err=$('suNameError');
  if(!v){ showErr(err,'Full name is required.'); return false; }
  if(!NAME_RE.test(v)){ showErr(err,'Enter a valid name using letters only (2–50 characters).'); return false; }
  hideErr(err); return true;
}
function validateEmail(){
  const v=$('suEmail').value.trim();
  const err=$('suEmailError');
  if(!v){ showErr(err,'Email is required.'); return false; }
  if(!EMAIL_RE.test(v)){ showErr(err,'Enter a valid email address.'); return false; }
  hideErr(err); return true;
}
function validatePhone(){
  const v=$('suPhone').value.trim();
  const err=$('suPhoneError');
  if(!v){ showErr(err,'Phone number is required.'); return false; }
  if(!/^\d{10}$/.test(v)){ showErr(err,'Phone number must be exactly 10 digits.'); return false; }
  if(!PHONE_RE.test(v)){ showErr(err,'First digit must be 6, 7, 8, or 9.'); return false; }
  hideErr(err); return true;
}
function passwordScore(v){
  let score=0;
  if(v.length>=8) score++;
  if(/[a-z]/.test(v)&&/[A-Z]/.test(v)) score++;
  if(/\d/.test(v)) score++;
  if(/[^A-Za-z0-9\s]/.test(v)) score++;
  if(v.length>=12) score++;
  return score; // 0-5
}
function updatePasswordStrength(){
  const v=$('suPassword').value;
  const score=passwordScore(v);
  const fill=$('pwFill'), label=$('pwLabel');
  const pct=[0,20,40,60,80,100][score];
  fill.style.width=pct+'%';
  let color='#ffb4b4', text='Weak';
  if(!v){ color='rgba(255,255,255,.55)'; text='—'; }
  else if(score>=4){ color='#c8f5da'; text='Strong'; }
  else if(score>=3){ color='#ffe2ad'; text='Medium'; }
  fill.style.background=color;
  label.textContent=text;
  label.style.color=color;
}
function validatePassword(){
  const v=$('suPassword').value;
  const err=$('suPasswordError');
  if(!v){ showErr(err,'Password is required.'); return false; }
  if(!PASSWORD_RE.test(v)){ showErr(err,'Use 8+ characters with an uppercase letter, lowercase letter, number, and symbol.'); return false; }
  hideErr(err); return true;
}
function validateConfirm(){
  const v=$('suConfirm').value;
  const err=$('suConfirmError');
  if(!v){ showErr(err,'Please confirm your password.'); return false; }
  if(v!==$('suPassword').value){ showErr(err,'Passwords do not match.'); return false; }
  hideErr(err); return true;
}
function validateTerms(){
  const err=$('suTermsError');
  if(!$('suTerms').checked){ showErr(err,'You must agree to the Terms and Privacy Policy to continue.'); return false; }
  hideErr(err); return true;
}

/* ---------- submit ---------- */
function handleSignup(){
  const nameOk=validateName();
  const emailOk=validateEmail();
  const phoneOk=validatePhone();
  const passOk=validatePassword();
  const confirmOk=validateConfirm();
  const termsOk=validateTerms();

  if(!(nameOk && emailOk && phoneOk && passOk && confirmOk && termsOk)){
    const firstInvalid=document.querySelector('.field-error-dark[style*="block"]');
    if(firstInvalid) firstInvalid.previousElementSibling && firstInvalid.previousElementSibling.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }

  const name=$('suName').value.trim();
  const email=$('suEmail').value.trim();
  location.href='upload.html?'+buildQuery({name:name, email:email});
}

/* ---------- input restrictions + live feedback ---------- */
$('suPhone').addEventListener('input', e=>{
  e.target.value=e.target.value.replace(/\D/g,'').slice(0,10);
});
$('suPassword').addEventListener('input', updatePasswordStrength);

$('suName').addEventListener('blur', validateName);
$('suEmail').addEventListener('blur', validateEmail);
$('suPhone').addEventListener('blur', validatePhone);
$('suPassword').addEventListener('blur', validatePassword);
$('suConfirm').addEventListener('blur', validateConfirm);
$('suTerms').addEventListener('change', validateTerms);

/* ---------- page init ---------- */
updatePasswordStrength();