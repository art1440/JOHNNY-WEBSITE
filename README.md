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
| `protecting` | family · spouse · final-expenses · mortgage |
| `age_range` | 18-34 · 35-49 · 50-64 · 65+ |
| `coverage_amount` | <100k · 100-250k · 250-500k · 500k+ |
| `tobacco` | yes · no |
| `source`, `tags` | Verion Life website / website-lead,coverage:250-500k |
| `page`, `referrer`, `submitted_at` | page URL, referring site, ISO timestamp |
| `utm_*`, `gclid`, `fbclid` | only when present in the page URL (ad tracking) |

Build in the CRM: pipeline stages, new-lead email/SMS alert, follow-up reminders, reporting.

## Client dashboard (`crm.html`)

A demo CRM in the SermaWebDesign dashboard style: Overview, Leads (filters, search, detail pane,
stage changes, "Send text", "Mark booked"), Calendar, Inbox, Reviews, Settings.
It is front end only, with sample data. Changes are stored in the viewer's browser, nothing is sent.

- **Live demo:** click *Live demo* (top right) to simulate a lead arriving. With `CRM_DEMO: true` in
  `config.js`, a quote submitted on the website in the same browser also appears in the dashboard live.
  Set it to `false` once the real CRM webhook is connected.
- Linked from the site footer ("Panel del agente") and hidden from search engines (`noindex`), but it has no login: anyone can open it. Don't put real client data in it.

## Photos
See `images/README.md`. Drop files with the listed names and they appear automatically.
Testimonials marked "Sample — replace" are placeholders. Publish only real, permissioned reviews.
