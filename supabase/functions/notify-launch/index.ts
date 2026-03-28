import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "npm:zod";
import { Resend } from "npm:resend";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const payloadSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(["product", "research"]),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("No estás autorizado.");
    }
    const token = authHeader.split('Bearer ')[1];

    const FIREBASE_API_KEY = Deno.env.get('VITE_FIREBASE_API_KEY');
    const FIREBASE_PROJECT_ID = Deno.env.get('VITE_FIREBASE_PROJECT_ID');
    
    if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
      throw new Error("Faltan credenciales VITE_FIREBASE_PROJECT_ID o VITE_FIREBASE_API_KEY.");
    }

    // Verify token using Firebase Identity Toolkit
    const verifyResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token })
    });
    const verifyData = await verifyResp.json();
    if (!verifyResp.ok || !verifyData.users || verifyData.users.length === 0) {
        throw new Error("Autenticación inválida de administrador.");
    }

    const payload = await req.json();
    const { itemId, itemType } = payloadSchema.parse(payload);

    // Get Item Details from Firebase
    const collection = itemType === "product" ? "products" : "research";
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${itemId}?key=${FIREBASE_API_KEY}`;
    
    const dbResponse = await fetch(firestoreUrl);
    if (!dbResponse.ok) {
      throw new Error(`Item no encontrado en Firestore.`);
    }
    const itemData = await dbResponse.json();
    const fields = itemData.fields;

    // Get Subscribers directly from Resend Audience API
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const audienceId = Deno.env.get('RESEND_AUDIENCE_ID');
    if (!resendApiKey || !audienceId) throw new Error("Falta la llave secreta RESEND_API_KEY o RESEND_AUDIENCE_ID.");
    
    const resend = new Resend(resendApiKey);
    const { data: contactsData, error: contactsError } = await resend.contacts.list({
      audienceId: audienceId,
    });
    
    if (contactsError) throw new Error(`Error obteniendo audiencia de Resend: ${contactsError.message}`);
    
    let emails = contactsData?.data?.filter((c: any) => !c.unsubscribed)?.map((c: any) => c.email) || [];
    emails = [...new Set(emails)];

    if (emails.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No hay suscriptores activos para enviar." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Acme <onboarding@resend.dev>';

    // Batch send via Resend using templates
    const batches = [];
    for (let i = 0; i < emails.length; i += 50) {
        const batchEmails = emails.slice(i, i + 50);
        
        batches.push(batchEmails.map(email => {
            const payload: any = {
                from: senderEmail,
                to: [email],
                headers: {
                    "List-Unsubscribe": `<https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
                }
            };

            if (itemType === "product") {
                const name = fields?.name_es?.stringValue || fields?.name?.mapValue?.fields?.es?.stringValue || "";
                const desc = fields?.description_es?.stringValue || fields?.description?.mapValue?.fields?.es?.stringValue || "";
                const img = fields?.photos?.stringValue || fields?.image?.stringValue || "https://www.fiberstech.com/assets/images/logo/logo_NFT.png";
                
                const productSlug = fields?.slug?.stringValue || itemId;

                payload.template = {
                    id: "plantilla-para-nuevo-producto-1",
                    variables: {
                        PRODUCT: name,
                        DESCRIPTION: desc,
                        PRODUCT_IMG_URL: img,
                        PRODUCT_WEB_LINK: `https://fiberstech.com/productos/${productSlug}`,
                        UNSUBSCRIBE_LINK: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`,
                        UNSUBSCRIBE_URL: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`
                    }
                };
            } else {
                const title = fields?.title?.stringValue || fields?.title?.mapValue?.fields?.es?.stringValue || "";
                const summary = fields?.summary_30w?.mapValue?.fields?.es?.stringValue || fields?.fullSummary?.mapValue?.fields?.es?.stringValue || "";
                const journal = fields?.journal?.stringValue || "";
                const slug = fields?.slug?.stringValue || itemId;
                const date = fields?.date?.stringValue || "";
                
                payload.template = {
                    id: "scientific-publication-announcement",
                    variables: {
                        TITULO: title,
                        ABSTRACT: summary,
                        REVISTA: journal,
                        FECHA_PUBLICACION: date,
                        LINK_INVESTIGACION: `https://fiberstech.com/investigacion/${slug}`,
                        UNSUBSCRIBE_LINK: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`,
                        UNSUBSCRIBE_URL: `https://fiberstech.com/desuscribirse?email=${encodeURIComponent(email)}`
                    }
                };
            }
            return payload;
        }));
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
            console.error("Error enviando batch:", await batchResp.text());
        } else {
            successCount += batch.length;
        }
    }

    return new Response(JSON.stringify({ success: true, message: `Se enviaron ${successCount} correos exitosamente.` }), {
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
