/* =====================================================================
   Site settings. Edit the values here; the page fills them in everywhere
   (header, quiz card, agent section, footer, WhatsApp and phone links).
   ===================================================================== */
window.SITE = {
  /* ---- Agent ---- */
  AGENT_NAME:  "Juan Pérez",      // full name as it should appear
  AGENT_FIRST: "Juan",            // used in "Soy Juan", "Escríbale a Juan"
  INITIALS:    "JP",              // shown if images/agente.jpg is missing

  PHONE:    "(555) 555-5555",     // shown on the page
  WHATSAPP: "15555555555",        // digits only, with country code (1 = USA)

  LICENSE: "0000000",             // state license number
  NPN:     "00000000",            // National Producer Number
  STATES:  "Texas · Florida · California",
  YEARS:   "10",                  // years of experience ("Llevo 10 años…")

  HOURS_ES: "Lunes a sábado, 9 a.m. – 7 p.m.",
  HOURS_EN: "Monday to Saturday, 9 a.m. – 7 p.m.",

  /* Public license lookup. NIPR covers every state; a state DOI page works too. */
  LICENSE_LOOKUP_URL: "https://nipr.com/help/look-up-a-license",

  /* ---- Leads ----
     One form-encoded POST per lead. Paste the Inbound Webhook URL from your
     CRM (GoHighLevel workflow, Zapier/Make "Catch Hook", etc.).
     Empty = test mode: leads are only printed to the browser console. */
  LEAD_WEBHOOK_URL: "",

  /* Optional booking calendar (GoHighLevel, Calendly…). When set, the thank-you
     screen shows a "Pick a time" button. */
  BOOKING_URL: "",

  LEAD_SOURCE: "Sitio web hispano",
};
