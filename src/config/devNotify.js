// Dev-only WhatsApp notify utility (no deps). Optional and safe by default.
// How it works:
// - Uses WhatsApp Cloud API (Meta) if environment variables are present.
// - Does nothing if variables are missing or not in development.
//
// Required env vars (set in your shell before starting dev server):
//   VITE_WA_ACCESS_TOKEN   -> Your WhatsApp Cloud API access token
//   VITE_WA_PHONE_ID       -> Your WhatsApp Business phone number ID
//   VITE_WA_TO_PHONE       -> Destination phone in international format
//
// Example (PowerShell):
//   $env:VITE_WA_ACCESS_TOKEN = "EAA..."; $env:VITE_WA_PHONE_ID = "123456789"; $env:VITE_WA_TO_PHONE = "651986295558"
//
// Then call notifyDevOnComplete("Mensaje"); after finishing an action.

export async function notifyDevOnComplete(message) {
  try {
    // Only run in dev and when envs are available
    const isDev = import.meta?.env?.DEV;
    const token = import.meta?.env?.VITE_WA_ACCESS_TOKEN;
    const phoneId = import.meta?.env?.VITE_WA_PHONE_ID;
    const to = import.meta?.env?.VITE_WA_TO_PHONE;
    if (!isDev || !token || !phoneId || !to) return false;

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message || "Proceso completado." },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    // Non-blocking: don't throw; just return status
    return res.ok;
  } catch {
    return false;
  }
}
