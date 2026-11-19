# Verion Life website

Static site: `index.html` (home + qualifying form), shared `styles.css` / `main.js`.
Host anywhere static (GitHub Pages: Settings → Pages → Deploy from `main`).

## Connect your CRM (one file: `config.js`)

1. **Leads:** in your CRM, create an automation triggered by an *Inbound Webhook* (GoHighLevel),
   or a Zapier/Make "Catch Hook" that creates the contact in your CRM. Paste its URL into `LEAD_WEBHOOK_URL`.
2. **Calendar:** paste your CRM booking-calendar link (or Calendly) into `BOOKING_URL`.
   After submitting, leads get a "Pick a time for your call" button with name/email/phone prefilled.
3. Submit a test lead, then map the fields in your CRM workflow.

Each submission sends **one** form-encoded POST with these fields:

| Field | Example |
|---|---|
| `first_name`, `last_name`, `full_name` | Jane / Smith / Jane Smith |
| `phone`, `email` | (555) 123-4567 / jane@example.com |
| `interest` (also sent as `protecting`) | life-insurance · grow-savings · living-benefits · all-3 |
| `age_range` | 18-34 · 35-49 · 50-64 · 65+ |
| `savings_monthly` (also sent as `coverage_amount`) | 100-200 · 200-300 · 300-400 · 500+ |
| `priority` | 1–10: how important building a more secure financial future is |
| `call_date`, `call_time`, `call_day` | 2026-11-20 / 10:30 / viernes |
| `call_at`, `call_timezone`, `call_local` | ISO UTC time / America/New_York / viernes, 20 de noviembre, 10:30 am |
| `source`, `tags` | Verion Life website / website-lead,savings:200-300,priority:8 |
| `page`, `referrer`, `submitted_at` | page URL, referring site, ISO timestamp |
| `utm_*`, `gclid`, `fbclid` | only when present in the page URL (ad tracking) |

Build in the CRM: pipeline stages, new-lead email/SMS alert, follow-up reminders, reporting.

## Client dashboard (`crm.html`)

Overview, Leads (filters, search, stage, notes, "Mark booked"), Calendar, Inbox, Reviews, Settings.
Linked from the site footer ("Panel del agente"), hidden from search engines.

**Two modes**
- **Demo** (`DASHBOARD_API_URL` empty): sample leads, *Live demo* button simulates a new lead. Nothing is saved anywhere but the viewer's browser.
- **Live** (`DASHBOARD_API_URL` set): every quote sent from the website is saved to a Google Sheet and appears on the
  dashboard within 20 seconds (click the green *Live* pill to refresh right away). Stage, notes and call times are saved back
  to the sheet, so any device sees the same thing. The dashboard asks for a key once per device.
  Texts and review requests are still demo only: nothing is actually sent.

### Leads on the dashboard: one-time Google Sheet setup (about 5 minutes)

1. Create a new Google Sheet (name it e.g. *Verion Life leads*).
2. In the sheet: **Extensions → Apps Script**. Delete what's there, paste all of `apps-script/Code.gs`, click **Save**.
3. In the function menu at the top pick **setup**, click **Run**, and allow access when Google asks.
   Open **Execution log**: it prints `Your dashboard key: …`. Save that key somewhere safe.
4. **Deploy → New deployment →** gear icon **→ Web app**. *Execute as:* **Me**. *Who has access:* **Anyone**. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
   ("Anyone" is needed so website visitors can submit the form. Reading leads always needs the key.)
5. Paste that URL into `DASHBOARD_API_URL` in `config.js`, commit and push.
6. Open `crm.html`, enter the key. Done: submit a test quote on the website and watch it arrive.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
Keep the `id` column in the sheet; you can add, hide or reorder other columns freely.

## Photos
See `images/README.md`. Drop files with the listed names and they appear automatically.
Testimonials marked "Sample — replace" are placeholders. Publish only real, permissioned reviews.
