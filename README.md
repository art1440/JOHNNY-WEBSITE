# Seguro de vida en español (template)

Spanish-first, bilingual (ES/EN toggle) life insurance landing page for Hispanic families.
Static site: `index.html`, `styles.css`, `app.js`, `config.js`. No build step; host anywhere static
(GitHub Pages: Settings → Pages → deploy from this branch).

Preview locally:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 (add `?lang=en` to open in English, handy for English-language ads).

## What's on the page

1. **Hero + quiz.** Six one-tap questions that advance on their own; between questions the agent's avatar shows
   a short "typing…" pause so it feels like a conversation with a real person. The headline word rotates
   (su familia → sus hijos → su pareja → su hogar → su tranquilidad).
2. **Así de sencillo.** The three-step process.
3. **No soy un call center.** Agent photo, license, NPN, states, a "verify my license" link and a signature.
4. **Testimonios.** Three placeholders, each tagged "Ejemplo, reemplazar".
5. **Preguntas frecuentes.** Spanish service, SSN/ITIN, medical exam, cost, work insurance, privacy.
6. **Closing call/WhatsApp band**, then a legal footer.

A WhatsApp button floats in once the quiz scrolls off screen. Its "¡Hola!" bubble pops once per visit.

## Info needed to finish it

Most of this goes in **`config.js`** and fills in everywhere automatically:

| Item | Where |
|---|---|
| Agent full name, first name, initials | `config.js` |
| Phone number shown on the page | `config.js` → `PHONE` |
| WhatsApp number (with country code) | `config.js` → `WHATSAPP` |
| State license #, NPN, licensed states | `config.js` |
| Years of experience | `config.js` → `YEARS` |
| Office hours | `config.js` → `HOURS_ES` / `HOURS_EN` |
| CRM webhook URL + booking calendar link | `config.js` → `LEAD_WEBHOOK_URL`, `BOOKING_URL` |
| Agent photo | `images/agente.jpg` (see `images/README.md`) |
| 3 real testimonials (name, city, quote, with permission) | `index.html`, section "TESTIMONIALS" |
| Carrier logos you're appointed with | `index.html`, `.carriers` list |
| Privacy policy + terms pages | footer links (currently `#`) |
| Short personal story (optional) | `index.html`, "No soy un call center" section |

### Check before publishing

- **FAQ answers** are generic and true for most agents. Confirm them for your carriers, especially the
  SSN/ITIN answer.
- **"Verify my license" link** points to NIPR's public lookup (`LICENSE_LOOKUP_URL`). Confirm it opens, or swap
  in your state's Department of Insurance lookup.
- **Testimonials** are samples. Publish only real, permissioned reviews, and remove the "Ejemplo" tags when you do.
- The consent text under the last question covers calls, texts and WhatsApp. Have it checked against your
  compliance requirements.

## Leads

Each submission sends **one** form-encoded POST to `LEAD_WEBHOOK_URL` (GoHighLevel inbound webhook,
Zapier/Make "Catch Hook", n8n…). Field names match the English site, so the same CRM workflow works for both:

| Field | Values |
|---|---|
| `first_name`, `last_name`, `full_name` | María / González / María González |
| `phone`, `email`, `zip` | (713) 555-0123 / optional / 77001 |
| `protecting` | family · partner · final-expenses · mortgage |
| `age_range` | 18-34 · 35-49 · 50-64 · 65+ |
| `coverage_amount` | <100k · 100-250k · 250-500k · not-sure |
| `tobacco` | yes · no |
| `contact_method` | whatsapp · call · text |
| `language` | es · en (whichever the visitor was using) |
| `source`, `tags` | `LEAD_SOURCE` / website-lead, hispanic-site, lang:es, contact:whatsapp, coverage:… |
| `page`, `referrer`, `submitted_at` | page URL, referring site, ISO timestamp |
| `utm_*`, `gclid`, `fbclid` | only when present in the page URL |

With `LEAD_WEBHOOK_URL` empty the form still works, but leads are only printed to the browser console.

## Editing copy

Spanish text lives in the HTML. Each translatable element carries its English version in a `data-en`
attribute right next to it, so both languages are edited in one place.
