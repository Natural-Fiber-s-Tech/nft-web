export async function renderWelcomeEmail(): Promise<string> {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Fiberstech</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin-top: 30px; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        
        <tr>
            <td align="center" style="padding: 30px 0 10px 0;">
                <img src="https://www.fiberstech.com/assets/images/logo/logo_NFT.png" alt="Fiberstech Logo" width="180" style="display: block; border: 0;">
                </td>
        </tr>

        <tr>
            <td align="center" style="padding: 0 40px;">
                <div style="height: 3px; width: 40px; background-color: #dc2626; margin-bottom: 20px;"></div>
            </td>
        </tr>

        <tr>
            <td style="padding: 10px 40px 40px 40px;">
                <h2 style="color: #111827; font-size: 24px; text-align: center; margin-bottom: 20px;">¡Gracias por unirte a nuestra comunidad!</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Es un gusto saludarte. Te confirmamos que te has suscrito correctamente a la red de <strong>Natural Fiber’s Tech (NFT)</strong>.
                </p>

                <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-top: 15px;">
                    A partir de ahora, serás el primero en recibir actualizaciones exclusivas sobre:
                </p>

                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                    <tr>
                        <td width="40" valign="top" style="padding-bottom: 15px;">
                            <div style="color: #dc2626; font-size: 20px;">•</div>
                        </td>
                        <td style="padding-bottom: 15px;">
                            <strong style="color: #111827;">Innovación en Productos:</strong> Lanzamientos de nuevos equipos de análisis de fibras (IA y Deep Tech).
                        </td>
                    </tr>
                    <tr>
                        <td width="40" valign="top" style="padding-bottom: 15px;">
                            <div style="color: #dc2626; font-size: 20px;">•</div>
                        </td>
                        <td style="padding-bottom: 15px;">
                            <strong style="color: #111827;">Investigación Científica:</strong> Publicaciones, papers y avances en la caracterización de fibras animales.
                        </td>
                    </tr>
                    <tr>
                        <td width="40" valign="top">
                            <div style="color: #dc2626; font-size: 20px;">•</div>
                        </td>
                        <td>
                            <strong style="color: #111827;">Casos de Éxito:</strong> Cómo nuestras herramientas optimizan la productividad en la industria textil.
                        </td>
                    </tr>
                </table>

                <p style="font-size: 15px; line-height: 1.6; color: #6b7280; font-style: italic; background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
                    "Nuestra misión es transformar la producción animal a través del conocimiento científico y la innovación tecnológica."
                </p>
            </td>
        </tr>

        <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
                <a href="https://fiberstech.com" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Visitar nuestro sitio web</a>
            </td>
        </tr>

        <tr>
            <td style="padding: 30px; background-color: #111827; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    <strong>Natural Fiber's Tech</strong><br>
                    Centro de I+D autorizado por CONCYTEC<br>
                    Calle Las Secoyas 186, La Molina, Lima - Perú.
                </p>
                <p style="margin-top: 15px;">
                    <a href="https://www.facebook.com/p/Natural-Fibers-Tech-SAC-100064291801913/" style="color: #ffffff; text-decoration: none; font-size: 11px; margin: 0 10px;">Facebook</a>
                    <a href="https://www.linkedin.com/company/fibers-tech/" style="color: #ffffff; text-decoration: none; font-size: 11px; margin: 0 10px;">LinkedIn</a>
                    <a href="https://www.youtube.com/@naturalfiberstech953" style="color: #ffffff; text-decoration: none; font-size: 11px; margin: 0 10px;">YouTube</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
