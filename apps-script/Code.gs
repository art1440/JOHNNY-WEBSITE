/**
 * Verion Life: lead database for the website + dashboard.
 * Lives inside a Google Sheet (Extensions → Apps Script). Setup steps: README.md.
 *
 *  POST (website form)          → adds one row per lead. No key needed, like any contact form.
 *  GET  ?action=list&key=…      → all leads, for the dashboard. Key required.
 *  POST action=update&key=…     → dashboard saves stage / note / call time / activity. Key required.
 *  POST action=login&user=…&pass=… → dashboard sign-in. Right password → the dashboard key.
 *
 * Run setup() once from the editor: it creates the "Leads" tab and prints your dashboard key.
 * Logins: open the Sheet → menu "Verion dashboard" → "Add or change a login".
 * Passwords are stored only as salted hashes (Script Properties), never in the sheet.
 */
const SHEET_NAME = 'Leads';
const COLS = ['id', 'submitted_at', 'full_name', 'first_name', 'last_name', 'phone', 'email',
  'protecting', 'age_range', 'coverage_amount', 'tobacco', 'status', 'note', 'appt', 'activity',
  'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid', 'updated_at',
  'call_at', 'call_local', 'call_timezone',    // older leads: exact call time picked on the form
  'priority',                                  // IUL form: 1–10, how important a secure financial future is
  'call_window',                               // best time to call: morning / afternoon / evening
  'state'];                                    // two-letter US state code
const FROM_FORM = ['full_name', 'first_name', 'last_name', 'phone', 'email', 'protecting', 'age_range',
  'coverage_amount', 'tobacco', 'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid',
  'call_at', 'call_local', 'call_timezone', 'priority', 'call_window', 'state'];
const STAGES = ['new', 'contacted', 'booked', 'lost'];

function setup() {
  sheet_();
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('DASHBOARD_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    props.setProperty('DASHBOARD_KEY', key);
  }
  Logger.log('Your dashboard key: ' + key);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'ping') return json_({ ok: true });
  if (!authed_(p)) return json_({ ok: false, error: 'unauthorized' });
  return json_({ ok: true, leads: readAll_() });
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (p.action === 'update') return json_(authed_(p) ? update_(p) : { ok: false, error: 'unauthorized' });
    if (p.action === 'login') return json_(login_(p));
    return json_(addLead_(p));
  } finally {
    lock.releaseLock();
  }
}

function addLead_(p) {
  if (p.company) return { ok: true };                                  // spam-bot honeypot
  if (!p.phone && !p.email) return { ok: false, error: 'empty' };
  const sh = sheet_(), head = head_(sh);
  const id = clean_(p.id || ('w' + Date.now()), 40);
  if (rowOf_(sh, head, id)) return { ok: true, id: id, duplicate: true }; // a retry of the same submission
  const now = new Date().toISOString();
  sh.appendRow(head.map(function (c) {
    if (c === 'id') return id;
    if (c === 'status') return 'new';
    if (c === 'submitted_at') return clean_(p.submitted_at || now, 40);
    if (c === 'updated_at') return now;
    return FROM_FORM.indexOf(c) > -1 ? clean_(p[c]) : '';
  }));
  return { ok: true, id: id };
}

function update_(p) {
  const sh = sheet_(), head = head_(sh), r = rowOf_(sh, head, String(p.id || ''));
  if (!r) return { ok: false, error: 'not found' };
  const set = function (c, v) { const i = head.indexOf(c); if (i > -1) sh.getRange(r, i + 1).setValue(v); };
  if (STAGES.indexOf(p.status) > -1) set('status', p.status);
  if ('note' in p) set('note', clean_(p.note, 2000));
  if ('appt' in p) set('appt', /^\d{0,15}$/.test(p.appt) ? p.appt : '');
  if ('activity' in p) set('activity', clean_(p.activity, 20000));
  set('updated_at', new Date().toISOString());
  return { ok: true };
}

function readAll_() {
  const values = sheet_().getDataRange().getValues();
  const head = values.shift() || [];
  return values.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const o = {};
    head.forEach(function (h, i) { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
  } else {
    // sheets made before a column existed: add the missing headers at the end
    const head = head_(sh), missing = COLS.filter(function (c) { return head.indexOf(c) < 0; });
    if (missing.length) sh.getRange(1, head.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return sh;
}
function head_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }
function rowOf_(sh, head, id) {
  const col = head.indexOf('id') + 1, n = sh.getLastRow();
  if (!col || n < 2 || !id) return 0;
  const ids = sh.getRange(2, col, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}
function authed_(p) {
  const key = PropertiesService.getScriptProperties().getProperty('DASHBOARD_KEY');
  return !!key && p.key === key;
}
// plain text only: anything that starts like a formula is stored as text
function clean_(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ===================== Dashboard logins ===================== */
const MAX_TRIES = 5, LOCK_SECONDS = 600;   // 5 wrong passwords → that username waits 10 minutes

function login_(p) {
  const user = String(p.user || '').trim().toLowerCase(), pass = String(p.pass || '');
  if (!user || !pass) return { ok: false, error: 'bad' };
  const cache = CacheService.getScriptCache(), k = 'fail:' + user;
  const fails = +cache.get(k) || 0;
  if (fails >= MAX_TRIES) return { ok: false, error: 'locked' };
  const rec = users_()[user];
  if (!rec || hash_(rec.s, pass) !== rec.h) {
    cache.put(k, String(fails + 1), LOCK_SECONDS);
    Utilities.sleep(400);                      // slows down guessing
    return { ok: false, error: fails + 1 >= MAX_TRIES ? 'locked' : 'bad' };
  }
  cache.remove(k);
  const key = PropertiesService.getScriptProperties().getProperty('DASHBOARD_KEY');
  return key ? { ok: true, key: key, user: user } : { ok: false, error: 'setup' };
}

function users_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('USERS') || '{}'); } catch (e) { return {}; }
}
function saveUsers_(u) { PropertiesService.getScriptProperties().setProperty('USERS', JSON.stringify(u)); }

// salted SHA-256, stretched so a stolen hash is slow to crack
function hash_(salt, pass) {
  let b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pass, Utilities.Charset.UTF_8);
  for (let i = 0; i < 500; i++) b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b.concat(Utilities.newBlob(salt).getBytes()));
  return Utilities.base64Encode(b);
}

/* ---------- Menu in the Sheet ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Verion dashboard')
    .addItem('Add or change a login', 'showLoginDialog')
    .addItem('Remove a login', 'removeLoginPrompt')
    .addItem('List logins', 'listLogins')
    .addSeparator()
    .addItem('Sign out every device', 'signOutEverywhere')
    .addToUi();
}

function showLoginDialog() {
  const html = HtmlService.createHtmlOutput(
    '<style>body{font:14px system-ui,sans-serif;margin:0;padding:4px 2px}label{display:block;margin:12px 0 4px;color:#3d5c46}' +
    'input{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid #c7d8cb;border-radius:8px;font:inherit}' +
    'button{margin-top:16px;padding:9px 18px;border:0;border-radius:999px;background:#3ccf6a;color:#0a2a14;font:inherit;font-weight:600;cursor:pointer}' +
    '#m{margin-top:10px;color:#b3261e;min-height:1.2em}</style>' +
    '<label>Username</label><input id="u" autocomplete="off" placeholder="e.g. johnny">' +
    '<label>Password (at least 8 characters)</label><input id="p" type="password" autocomplete="new-password">' +
    '<button id="b">Save login</button><div id="m"></div>' +
    '<script>document.getElementById("b").onclick=function(){var u=document.getElementById("u").value,p=document.getElementById("p").value,m=document.getElementById("m");' +
    'm.textContent="Saving…";google.script.run.withSuccessHandler(function(r){if(r.ok){m.style.color="#1e8a42";m.textContent="Saved. You can sign in as \u201c"+r.user+"\u201d.";setTimeout(function(){google.script.host.close()},1800)}else m.textContent=r.error})' +
    '.withFailureHandler(function(e){m.textContent=e.message}).saveLogin(u,p)};</script>'
  ).setWidth(340).setHeight(260);
  SpreadsheetApp.getUi().showModalDialog(html, 'Dashboard login');
}

function saveLogin(user, pass) {
  user = String(user || '').trim().toLowerCase();
  if (!/^[a-z0-9._@-]{2,40}$/.test(user)) return { ok: false, error: 'Username: 2–40 letters, numbers, dots, dashes or @.' };
  if (String(pass || '').length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  const salt = Utilities.getUuid(), u = users_();
  u[user] = { s: salt, h: hash_(salt, String(pass)) };
  saveUsers_(u);
  CacheService.getScriptCache().remove('fail:' + user);
  return { ok: true, user: user };
}

function removeLoginPrompt() {
  const ui = SpreadsheetApp.getUi(), r = ui.prompt('Remove a login', 'Username to remove:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const user = r.getResponseText().trim().toLowerCase(), u = users_();
  if (!u[user]) return ui.alert('No login called "' + user + '".');
  delete u[user]; saveUsers_(u);
  ui.alert('Removed "' + user + '". If they were signed in somewhere, also use "Sign out every device".');
}

function listLogins() {
  const names = Object.keys(users_());
  SpreadsheetApp.getUi().alert(names.length ? 'Logins: ' + names.join(', ') : 'No logins yet. Use "Add or change a login".');
}

// new dashboard key: every signed-in device is sent back to the sign-in screen
function signOutEverywhere() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Sign out every device?', 'Everyone will need to sign in again with their username and password.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('DASHBOARD_KEY', Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  ui.alert('Done. All devices are signed out.');
}
