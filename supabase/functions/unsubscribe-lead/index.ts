import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "npm:zod";
import { Resend } from "npm:resend";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const payloadSchema = z.object({
  email: z.string().email({ message: "El formato de correo es inválido." }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { email } = payloadSchema.parse(payload);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const audienceId = Deno.env.get('RESEND_AUDIENCE_ID');

    if (!resendApiKey || !audienceId) {
      throw new Error("Faltan credenciales RESEND_API_KEY o RESEND_AUDIENCE_ID.");
    }

    const resend = new Resend(resendApiKey);

    // 1. Marcar el contacto como desuscrito usando fetch directamente
    try {
      const patchUrl = `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`;
      const patchResp = await fetch(patchUrl, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ unsubscribed: true })
      });
      
      if (!patchResp.ok) {
        const errorText = await patchResp.text();
        console.error("Resend API error:", errorText);
        throw new Error("No pudimos actualizar la audiencia (Es posible que el correo no esté suscrito todavía).");
      }
    } catch (e) {
      console.error("Fallback error try/catch:", e);
      throw new Error(e.message || "Fallo de conexión interno.");
    }

    return new Response(JSON.stringify({ success: true, message: "Suscripción cancelada exitosamente de Resend API." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});
