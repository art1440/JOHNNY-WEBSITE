/**
 * Verion Life: lead database for the website + dashboard.
 * Lives inside a Google Sheet (Extensions → Apps Script). Setup steps: README.md.
 *
 *  POST (website form)          → adds one row per lead. No key needed, like any contact form.
 *  GET  ?action=list&key=…      → all leads, for the dashboard. Key required.
 *  POST action=update&key=…     → dashboard saves stage / note / call time / activity. Key required.
 *
 * Run setup() once from the editor: it creates the "Leads" tab and prints your dashboard key.
 */
const SHEET_NAME = 'Leads';
const COLS = ['id', 'submitted_at', 'full_name', 'first_name', 'last_name', 'phone', 'email',
  'protecting', 'age_range', 'coverage_amount', 'tobacco', 'status', 'note', 'appt', 'activity',
  'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid', 'updated_at',
  'call_at', 'call_local', 'call_timezone'];   // the call time the client picked on the form
const FROM_FORM = ['full_name', 'first_name', 'last_name', 'phone', 'email', 'protecting', 'age_range',
  'coverage_amount', 'tobacco', 'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid',
  'call_at', 'call_local', 'call_timezone'];
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
