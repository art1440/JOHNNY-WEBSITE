/* =====================================================================
   Verion Life — site settings. This is the only file you need to edit
   to connect the website to your CRM.
   ===================================================================== */
window.VERION_CONFIG = {
  /* Where new leads are sent (one form-encoded POST per lead).
     Paste the "Inbound Webhook" URL from your CRM automation/workflow, e.g.
       GoHighLevel:  Automation → Workflow → Trigger "Inbound Webhook"
       HubSpot / others: a Zapier or Make "Catch Hook" URL
     Leave empty to test: leads are only printed to the browser console. */
  LEAD_WEBHOOK_URL: "",

  /* Your lead database: the Google Sheet web app URL (ends in /exec).
     Setup: README.md → "Leads on the dashboard". When set, every quote from
     the website is saved to the sheet and shows up on the dashboard (crm.html). */
  DASHBOARD_API_URL: "",

  /* Your CRM's booking calendar link (GoHighLevel calendar, Calendly, etc.).
     When set, people can book a call right after submitting the form. */
  BOOKING_URL: "",

  /* Your Instagram profile link, e.g. "https://instagram.com/yourhandle".
     Leave empty and the button stays on the page but goes nowhere. */
  INSTAGRAM_URL: "",

  /* Demo dashboard (crm.html): also keep a copy of each form submission in
     the visitor's own browser so it pops up live in the dashboard opened in
     the same browser. Handy for showing the system off; set to false once
     the real CRM webhook is connected. */
  CRM_DEMO: true,

  /* Tag added to every lead so you can filter/automate on it in the CRM. */
  LEAD_SOURCE: "Verion Life website",

  /* Call-time picker (form step 4), in the visitor's local time.
     start/end = first and last slot hour (24h), step = minutes between slots,
     leadMinutes = how soon a slot can be booked (slots closer than this disable live). */
  CALL_HOURS: { start: 9, end: 19, step: 30, leadMinutes: 30 },
};
