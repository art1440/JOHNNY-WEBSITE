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

## Client dashboard (`crm.html`) and login (`login/`)

Clients sign in at **`/login/`** (linked from the site footer, "Panel del agente") with their own email and password,
then land on the dashboard: Overview, Leads, Calendar, Inbox, Reviews, Settings.

**Two modes**
- **Demo** (`DASHBOARD_API_URL` empty): the login page says it's a demo and any email/password opens sample data.
  The *Live demo* button simulates a new lead. Nothing is saved anywhere but the viewer's browser.
- **Live** (`DASHBOARD_API_URL` set): every quote from the website is saved to a Google Sheet and shows up on the
  dashboard within 20 seconds (click the green *Live* pill to refresh now). Stage, notes and call times are saved back
  to the sheet. Sessions last 30 days per device. Texts and review requests are still demo only.

### One-time setup (about 10 minutes)

1. Create a new Google Sheet (e.g. *Verion Life leads*) with the Google account that should own the data.
2. **Extensions → Apps Script**. Delete what's there, paste all of `apps-script/Code.gs`, click **Save**.
3. Pick **setup** in the function menu, click **Run**, and allow access when Google asks.
4. **Deploy → New deployment →** gear icon **→ Web app**. *Execute as:* **Me**. *Who has access:* **Anyone**.
   Click **Deploy**, copy the **Web app URL** (ends in `/exec`).
   ("Anyone" lets website visitors submit the form. Leads can only be read after signing in.)
5. Paste that URL into `DASHBOARD_API_URL` in `config.js`, commit and push.
6. Reload the Google Sheet. A **Verion Life** menu appears: **Add or reset a login…** → enter the client's email and a
   password (10+ characters). Send them the login link and the password separately.
7. Open `/login/`, sign in, then submit a test quote on the website and watch it arrive.

**Managing logins** (Verion Life menu in the sheet): add or reset a password (signs that person out everywhere),
remove a login, show logins with last sign-in date, sign everyone out. Passwords are stored salted and hashed in the
script's properties, never in the sheet. 8 wrong passwords lock that email for 15 minutes.

If you change `Code.gs` later: **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.
Keep the `id` column in the sheet; other columns can be added, hidden or reordered.

## Getting found on Google

The home page and `/login/` are indexable; the dashboard itself is `noindex` (it's behind a login anyway).
`sitemap.xml` lists both pages.

1. Go to [Google Search Console](https://search.google.com/search-console) → **Add property → URL prefix** →
   `https://art1440.github.io/JOHNNY-WEBSITE/`.
2. Verify with the **HTML tag** method: copy the `<meta name="google-site-verification" …>` tag into the `<head>`
   of `index.html` (or send it to your developer), push, then click **Verify**.
3. **Sitemaps** → submit `sitemap.xml`.
4. **URL inspection** → paste the `/login/` URL → **Request indexing**.

Google usually takes a few days to a few weeks to show a new site. A searcher typing *"Verion Life login"* finds it
much more reliably on your own domain (e.g. `verionlife.com/login`) than on `github.io`: buy the domain, add it under
the repo's **Settings → Pages → Custom domain**, and update the URLs in `sitemap.xml` and the `canonical` tags.

## Photos
See `images/README.md`. Drop files with the listed names and they appear automatically.
Testimonials marked "Sample — replace" are placeholders. Publish only real, permissioned reviews.
