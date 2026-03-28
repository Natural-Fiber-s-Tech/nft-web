import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
        throw new Error("No estás autorizado para ejecutar esta tarea programada.");
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const audienceId = Deno.env.get('RESEND_AUDIENCE_ID');
    
    if (!resendApiKey || !audienceId) throw new Error("Falta RESEND_API_KEY o RESEND_AUDIENCE_ID.");

    const resend = new Resend(resendApiKey);
    const { data: contactsData, error: contactsError } = await resend.contacts.list({
      audienceId: audienceId,
    });
    
    if (contactsError) throw new Error(`Error obteniendo audiencia: ${contactsError.message}`);
    
    let emails = contactsData?.data?.filter((c: any) => !c.unsubscribed)?.map((c: any) => c.email) || [];
    emails = [...new Set(emails)];

    if (emails.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No hay suscriptores activos para enviar el boletín." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Acme <onboarding@resend.dev>';

    const batches = [];
    for (let i = 0; i < emails.length; i += 50) {
        const batchEmails = emails.slice(i, i + 50);
        batches.push(batchEmails.map(email => ({
            from: senderEmail,
            to: [email],
            headers: {
                "List-Unsubscribe": `<https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
            },
            template: {
                id: "monthly-science-highlights",
                variables: {
                    CATALOGO_LINK: "https://fiberstech.com/products",
                    UNSUBSCRIBE_LINK: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`,
                    UNSUBSCRIBE_URL: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`
                }
            }
        })));
    }

    let successCount = 0;
    for (const batch of batches) {
        const batchResp = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(batch)
        });
        
        if (!batchResp.ok) {
            console.error("Error enviando batch del boletín:", await batchResp.text());
        } else {
            successCount += batch.length;
        }
    }

    return new Response(JSON.stringify({ success: true, message: `Boletín mensual enviado a ${successCount} correos de la Audiencia.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
