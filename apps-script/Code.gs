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
 * New-lead email alerts go to the Sheet owner by default; change them with "Set alert emails".
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
  let res;
  try {
    if (p.action === 'update') res = authed_(p) ? update_(p) : { ok: false, error: 'unauthorized' };
    else if (p.action === 'login') res = login_(p);
    else res = addLead_(p);
  } finally {
    lock.releaseLock();
  }
  if (res.alert) { alertNewLead_(res.alert); delete res.alert; }   // never blocks or breaks saving the lead
  return json_(res);
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
  return { ok: true, id: id, alert: p };
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
    .addItem('Set alert emails', 'setAlertEmails')
    .addItem('Send a test alert', 'sendTestAlert')
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

/* ===================== New-lead email alerts ===================== */
const INTEREST = { 'life-insurance': 'Life insurance', 'grow-savings': 'Save & grow money', 'living-benefits': 'Living benefits', 'all-3': 'All 3 benefits',
  family: 'Spouse & kids', spouse: 'Spouse / partner', 'final-expenses': 'Final expenses', mortgage: 'Mortgage / debts' };
const SAVINGS = { '100-200': '$100–$200 / month', '200-300': '$200–$300 / month', '300-400': '$300–$400 / month', '500+': '$500+ / month' };

function alertEmails_() {
  const saved = PropertiesService.getScriptProperties().getProperty('ALERT_EMAILS');
  if (saved !== null) return saved;                       // '' means alerts are turned off
  return Session.getEffectiveUser().getEmail() || '';     // default: the Sheet owner
}

function alertNewLead_(p) {
  try {
    const to = alertEmails_();
    if (!to) return;
    const m = alertMessage_(p);
    MailApp.sendEmail({ to: to, subject: m.subject, htmlBody: m.html, body: m.text, name: 'Verion Life leads', replyTo: /@/.test(p.email || '') ? String(p.email) : undefined });
  } catch (err) {
    console.error('Lead alert email failed: ' + err);     // shows under Executions; the lead is already saved
  }
}

function alertMessage_(p) {
  const name = String(p.full_name || p.first_name || 'New lead').trim();
  const pr = Math.round(+p.priority);
  const prio = pr >= 1 && pr <= 10 ? pr : 0;
  const heat = prio >= 8 ? 'Hot lead' : prio >= 5 ? 'Interested' : prio ? 'Just looking' : '';
  const callShort = shortCall_(p.call_local);
  const subject = 'New lead: ' + name + (prio ? ' · ' + prio + '/10' : '') + (callShort ? ' · call ' + callShort : '');

  const phone = String(p.phone || ''), tel = phone.replace(/[^\d+]/g, ''), email = String(p.email || '');
  const page = String(p.page || '');
  const dash = /^https:\/\//.test(page) ? page.replace(/[?#].*$/, '').replace(/[^\/]*$/, '') + 'crm.html' : '';
  const where = page ? page.replace(/^https?:\/\//, '').replace(/[?#].*$/, '').replace(/\/$/, '') : '';
  const ads = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return p[k]; }).filter(Boolean).join(' / ') || (p.gclid ? 'Google Ads' : p.fbclid ? 'Facebook / Instagram ad' : '');

  const rows = [
    ['Wants a call', p.call_local ? p.call_local + (p.call_timezone ? ' (' + p.call_timezone + ')' : '') : ''],
    ['Interested in', INTEREST[p.protecting || p.interest] || p.protecting || ''],
    ['Age range', p.age_range || ''],
    ['Can save', SAVINGS[p.coverage_amount || p.savings_monthly] || p.coverage_amount || ''],
    ['From', where],
    ['Ad', ads],
  ].filter(function (r) { return r[1]; });

  const bar = prio ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 2px"><tr>' +
    Array.from({ length: 10 }, function (_, k) {
      return '<td style="width:22px;height:8px;padding:0 2px"><div style="height:8px;border-radius:3px;background:' + (k < prio ? (prio >= 8 ? '#3ccf6a' : prio >= 5 ? '#8ef0a0' : '#c2d0c6') : '#e8efe9') + '"></div></td>';
    }).join('') + '</tr></table>' : '';

  const html =
    '<div style="background:#f3fff3;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0a2a14">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #d6f5dc;border-radius:20px;padding:26px 24px">' +
    '<div style="font-size:13px;color:#3d7a52;letter-spacing:.02em">NEW LEAD · VERION LIFE</div>' +
    '<div style="font-size:24px;font-weight:600;margin:6px 0 2px">' + esc_(name) + '</div>' +
    (prio ? '<div style="font-size:14px;color:#17803a;font-weight:600">' + prio + '/10 · ' + heat + '</div>' + bar +
      '<div style="font-size:12px;color:#6f8a76">How important a more secure financial future is to them</div>' : '') +
    '<div style="margin:20px 0 6px">' +
    (tel ? '<a href="tel:' + esc_(tel) + '" style="display:inline-block;background:#98ff98;background-image:linear-gradient(#c8ffc8,#98ff98 50%,#3ccf6a);color:#0a2a14;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px;margin:0 8px 8px 0">Call ' + esc_(phone) + '</a>' : '') +
    (email ? '<a href="mailto:' + esc_(email) + '" style="display:inline-block;border:1px solid #c7e6cd;color:#0a2a14;text-decoration:none;padding:11px 18px;border-radius:999px;margin:0 8px 8px 0">' + esc_(email) + '</a>' : '') +
    '</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-top:1px solid #e8efe9;margin-top:10px">' +
    rows.map(function (r) { return '<tr><td style="padding:10px 0;color:#5a7563;border-bottom:1px solid #f0f4f1;width:38%">' + r[0] + '</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f0f4f1">' + esc_(r[1]) + '</td></tr>'; }).join('') +
    '</table>' +
    (dash ? '<div style="margin-top:20px"><a href="' + esc_(dash) + '" style="color:#1e8a42;font-weight:600;text-decoration:none">Open the dashboard →</a></div>' : '') +
    '</div><div style="text-align:center;font-size:11px;color:#8aa093;margin-top:12px">Sent by your Verion Life lead sheet. Change who gets these in the Sheet: Verion dashboard → Set alert emails.</div></div>';

  const text = subject + '\n\n' + (phone ? 'Phone: ' + phone + '\n' : '') + (email ? 'Email: ' + email + '\n' : '') + (prio ? 'Priority: ' + prio + '/10 (' + heat + ')\n' : '') +
    rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + (dash ? '\n\nDashboard: ' + dash : '');
  return { subject: subject, html: html, text: text };
}

// "Viernes, 20 de noviembre, 5:30 pm" → "vie 20, 5:30 pm" (keeps the subject line short on a phone)
function shortCall_(s) {
  s = String(s || '').trim();
  const m = s.match(/^(\S+?),?\s+(\d{1,2})\s+de\s+\S+,?\s+(.+)$/i);
  return m ? m[1].slice(0, 3).toLowerCase() + ' ' + m[2] + ', ' + m[3] : s;
}

function esc_(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

function setAlertEmails() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('New-lead email alerts', 'Who should get an email for every new lead?\nNow: ' + (alertEmails_() || 'nobody (off)') +
    '\n\nSeparate several addresses with commas. Type OFF to turn alerts off.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().trim();
  if (/^off$/i.test(v)) { PropertiesService.getScriptProperties().setProperty('ALERT_EMAILS', ''); return ui.alert('Alerts are off.'); }
  const list = v.split(/[,;\s]+/).filter(Boolean);
  if (!list.length || !list.every(function (x) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x); })) return ui.alert('That doesn’t look like an email address. Nothing changed.');
  PropertiesService.getScriptProperties().setProperty('ALERT_EMAILS', list.join(','));
  ui.alert('Saved. New leads will be emailed to: ' + list.join(', '));
}

function sendTestAlert() {
  const ui = SpreadsheetApp.getUi(), to = alertEmails_();
  if (!to) return ui.alert('Alerts are off. Use "Set alert emails" first.');
  const inTwoHours = new Date(Date.now() + 2 * 3600 * 1000);
  const m = alertMessage_({
    full_name: 'Test Lead (sample)', phone: '(555) 010-0000', email: 'test@example.com', priority: '9', protecting: 'all-3',
    age_range: '35-49', coverage_amount: '200-300', page: 'https://verionlife.netlify.app/',
    call_local: Utilities.formatDate(inTwoHours, Session.getScriptTimeZone(), 'EEEE, d MMM, h:mm a'), call_timezone: Session.getScriptTimeZone(),
  });
  MailApp.sendEmail({ to: to, subject: '[TEST] ' + m.subject, htmlBody: m.html, body: m.text, name: 'Verion Life leads' });
  ui.alert('Test alert sent to ' + to + '. Check your inbox (and spam, the first time).');
}
