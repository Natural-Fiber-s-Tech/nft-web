import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "npm:zod";
import { Resend } from "npm:resend";
import { renderWelcomeEmail } from "./emailTemplate.tsx";

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
    if (!resendApiKey) throw new Error("Falta la llave secreta RESEND_API_KEY.");
    const resend = new Resend(resendApiKey);

    // 1. Guardar en Resend Audience como única fuente de verdad
    const audienceId = Deno.env.get('RESEND_AUDIENCE_ID');
    if (!audienceId) throw new Error("Falta configurar RESEND_AUDIENCE_ID.");

    const contactResp = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        unsubscribed: false,
      }),
    });

    if (!contactResp.ok) {
      const errorData = await contactResp.text();
      console.error("Resend API contact creation error:", errorData);
      throw new Error("No pudimos agregarte a la audiencia.");
    }

    // 2. Enviar correo de Bienvenida
    const htmlContent = await renderWelcomeEmail();
    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Acme <onboarding@resend.dev>';

    const { error: emailError } = await resend.emails.send({
      from: senderEmail,
      to: [email],
      subject: '¡Gracias por suscribirte!',
      html: htmlContent,
    });

    if (emailError) console.error(`Aviso (Envío Bienvenida Fallido): ${emailError.message}`);

    return new Response(JSON.stringify({ success: true, message: "Suscripción completada exitosamente en Resend." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    const status = error instanceof z.ZodError ? 400 : 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});
