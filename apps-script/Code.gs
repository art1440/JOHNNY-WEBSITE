/**
 * Verion Life: lead database + logins for the website and the client dashboard.
 * Lives inside a Google Sheet (Extensions → Apps Script). Setup steps: README.md.
 *
 *  Website form   POST (form-encoded)              → adds one row per lead. No login needed, like any contact form.
 *  Dashboard      POST (JSON) {action:'login'}       → email + password → session token (30 days)
 *                 POST (JSON) {action:'list'|'update'|'logout', token}
 *
 * Logins are managed from the sheet: menu "Verion Life" → "Add or reset a login…".
 * Passwords are stored salted and hashed in Script Properties, never in the sheet.
 */
const SHEET_NAME = 'Leads';
const SESSION_DAYS = 30;
const MAX_FAILS = 8;          // wrong passwords per email before a 15-minute lockout
const HASH_ROUNDS = 1500;
const COLS = ['id', 'submitted_at', 'full_name', 'first_name', 'last_name', 'phone', 'email',
  'protecting', 'age_range', 'coverage_amount', 'tobacco', 'status', 'note', 'appt', 'activity',
  'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid', 'updated_at'];
const FROM_FORM = ['full_name', 'first_name', 'last_name', 'phone', 'email', 'protecting', 'age_range',
  'coverage_amount', 'tobacco', 'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'];
const STAGES = ['new', 'contacted', 'booked', 'lost'];

/* ------------------------------------------------------------------ setup + sheet menu */
function setup() {
  sheet_();
  Logger.log('Ready. Reload the Google Sheet, then use the "Verion Life" menu → "Add or reset a login…" to create your first login.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Verion Life')
    .addItem('Add or reset a login…', 'addUserDialog')
    .addItem('Remove a login…', 'removeUserDialog')
    .addItem('Show logins', 'listUsersDialog')
    .addSeparator()
    .addItem('Sign everyone out', 'signOutAll')
    .addToUi();
}

function addUserDialog() {
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('Add or reset a login', 'Email address:', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  const email = normEmail_(a.getResponseText());
  if (!/^\S+@\S+\.\S+$/.test(email)) return ui.alert('That doesn’t look like an email address.');
  const b = ui.prompt('Password for ' + email, 'At least 10 characters. Send it to them privately (not in the same message as the link).', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  const pw = b.getResponseText();
  if (pw.length < 10) return ui.alert('Use at least 10 characters.');
  setUser_(email, pw);
  endSessionsFor_(email);
  ui.alert(email + ' can now sign in.');
}

function removeUserDialog() {
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('Remove a login', 'Email address to remove:', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  const email = normEmail_(a.getResponseText());
  if (!getUser_(email)) return ui.alert('No login found for ' + email + '.');
  props_().deleteProperty('u_' + email);
  endSessionsFor_(email);
  ui.alert(email + ' was removed and signed out everywhere.');
}

function listUsersDialog() {
  const all = props_().getProperties();
  const rows = Object.keys(all).filter(function (k) { return k.indexOf('u_') === 0; }).map(function (k) {
    const u = JSON.parse(all[k]);
    return k.slice(2) + '   (last sign-in: ' + (u.last ? u.last.slice(0, 10) : 'never') + ')';
  });
  SpreadsheetApp.getUi().alert(rows.length ? rows.join('\n') : 'No logins yet.');
}

function signOutAll() {
  const p = props_(), all = p.getProperties();
  Object.keys(all).forEach(function (k) { if (k.indexOf('s_') === 0) p.deleteProperty(k); });
  try { SpreadsheetApp.getUi().alert('Everyone has been signed out.'); } catch (e) { /* run from the editor */ }
}

/* ------------------------------------------------------------------ web app */
function doGet() {
  return json_({ ok: true, service: 'verion-life' });
}

function doPost(e) {
  const type = (e && e.postData && e.postData.type) || '';
  if (type && type.indexOf('application/x-www-form-urlencoded') !== 0 && type.indexOf('multipart/') !== 0) {
    let body = null;
    try { body = JSON.parse(e.postData.contents); } catch (x) { /* not JSON */ }
    if (body && body.action) return json_(api_(body));
  }
  return withLock_(function () { return json_(addLead_((e && e.parameter) || {})); });
}

function api_(b) {
  if (b.action === 'login') return login_(b);
  const s = session_(b.token);
  if (!s) return { ok: false, error: 'unauthorized' };
  if (b.action === 'list') return { ok: true, user: s.email, leads: readAll_() };
  if (b.action === 'update') return withLock_(function () { return update_(b); });
  if (b.action === 'logout') { props_().deleteProperty('s_' + b.token); return { ok: true }; }
  return { ok: false, error: 'unknown action' };
}

/* ------------------------------------------------------------------ accounts */
function login_(b) {
  const email = normEmail_(b.email), password = String(b.password || '');
  const cache = CacheService.getScriptCache(), failKey = 'fail_' + email;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_FAILS) return { ok: false, error: 'locked' };
  const u = getUser_(email);
  const attempt = hash_(u ? u.salt : 'no-such-user', password);   // same work either way
  if (!u || !safeEqual_(attempt, u.hash)) {
    cache.put(failKey, String(fails + 1), 900);
    Utilities.sleep(300);
    return { ok: false, error: 'bad_login' };
  }
  cache.remove(failKey);
  pruneSessions_();
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('s_' + token, JSON.stringify({ email: email, exp: Date.now() + SESSION_DAYS * 864e5 }));
  u.last = new Date().toISOString();
  props_().setProperty('u_' + email, JSON.stringify(u));
  return { ok: true, token: token, user: email };
}

function session_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return null;
  const raw = props_().getProperty('s_' + token);
  if (!raw) return null;
  const s = JSON.parse(raw);
  if (s.exp < Date.now() || !getUser_(s.email)) { props_().deleteProperty('s_' + token); return null; }
  return s;
}

function setUser_(email, password) {
  const salt = Utilities.getUuid().replace(/-/g, '');
  const prev = getUser_(email) || {};
  props_().setProperty('u_' + email, JSON.stringify({ salt: salt, hash: hash_(salt, password), created: prev.created || new Date().toISOString(), last: prev.last || '' }));
}
function getUser_(email) { const raw = props_().getProperty('u_' + email); return raw ? JSON.parse(raw) : null; }
function endSessionsFor_(email) {
  const p = props_(), all = p.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') === 0) { try { if (JSON.parse(all[k]).email === email) p.deleteProperty(k); } catch (e) { p.deleteProperty(k); } }
  });
}
function pruneSessions_() {
  const p = props_(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') === 0) { try { if (JSON.parse(all[k]).exp < now) p.deleteProperty(k); } catch (e) { p.deleteProperty(k); } }
  });
}
function hash_(salt, password) {
  let h = salt + '|' + password;
  for (let i = 0; i < HASH_ROUNDS; i++) {
    h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + '|' + salt, Utilities.Charset.UTF_8));
  }
  return h;
}
function hex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }
function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function normEmail_(e) { return String(e || '').trim().toLowerCase().slice(0, 200); }
function props_() { return PropertiesService.getScriptProperties(); }

/* ------------------------------------------------------------------ leads */
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
  if ('appt' in p) set('appt', /^\d{0,15}$/.test(String(p.appt)) ? String(p.appt) : '');
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
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}
// plain text only: anything that starts like a formula is stored as text
function clean_(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 500);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
