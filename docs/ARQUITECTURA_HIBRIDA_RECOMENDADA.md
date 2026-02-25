# 🏗️ Arquitectura Híbrida Recomendada: GitHub + Base de Datos

## 🎯 Análisis: ¿Qué necesita cada funcionalidad?

### **✅ MANTENER en GitHub (CMS Actual)**
| Funcionalidad | ¿Por qué GitHub es mejor? |
|---------------|--------------------------|
| **Productos estáticos** | Contenido editorial, versionado, backup automático |
| **Servicios** | Catálogo fijo, cambios poco frecuentes |
| **Equipo** | Lista de miembros, biografías, fotos |
| **Publicaciones científicas** | Papers estáticos, no cambian frecuentemente |

### **❌ MIGRAR a Base de Datos**
| Funcionalidad | ¿Por qué necesita DB? | Problema actual |
|---------------|----------------------|-----------------|
| **Leads/Contactos** | Crecimiento ilimitado | GitHub no es bueno para miles de registros |
| **Envío de emails** | Logs, seguimiento, reenvíos | GitHub solo guarda archivos, no procesa |
| **CVs de candidatos** | Búsqueda, filtrado, metadata | PDFs en GitHub son difíciles de gestionar |
| **Documentos técnicos** | Versiones, control de acceso | GitHub es público o todo privado |
| **Inventario de productos** | Stock, precios dinámicos | Cambios frecuentes causarían muchos commits |

---

## 🎨 Arquitectura Híbrida Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│                  Hosted en Vercel (Gratis)                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─────────────────┬────────────────────────────┐
               │                 │                            │
               ▼                 ▼                            ▼
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
│   CONTENIDO ESTÁTICO │ │  DATOS DINÁMICOS │ │   ARCHIVOS BINARIOS     │
│    (GitHub CMS)      │ │   (Base de Datos)│ │   (Cloud Storage)       │
├──────────────────────┤ ├──────────────────┤ ├─────────────────────────┤
│ ✅ Productos         │ │ ✅ Leads/Contactos│ │ ✅ CVs (PDFs)          │
│ ✅ Servicios         │ │ ✅ Newsletter     │ │ ✅ Docs técnicos       │
│ ✅ Equipo            │ │ ✅ Cotizaciones   │ │ ✅ Imágenes grandes    │
│ ✅ Research          │ │ ✅ Inventario     │ │ ✅ Videos              │
│ ✅ Textos SEO        │ │ ✅ Logs de emails │ │                         │
└──────────────────────┘ └──────────────────┘ └─────────────────────────┘
         │                       │                         │
         │                       │                         │
    API Serverless         API Serverless          API Serverless
    (Vercel Functions)     (Vercel Functions)      (Vercel Functions)
         │                       │                         │
         ▼                       ▼                         ▼
    GitHub API            MongoDB/Supabase        Cloudinary/S3
    (Gratis)              ($0-10/mes)             (Gratis tier)
```

---

## 💡 Solución Recomendada: Supabase (PostgreSQL)

### **¿Por qué Supabase?**

| Característica | Ventaja |
|----------------|---------|
| **💰 Costo** | Gratis hasta 500MB DB + 1GB almacenamiento |
| **⚡ Performance** | PostgreSQL rápido y escalable |
| **🔐 Auth integrado** | Sistema de usuarios ya incluido |
| **📁 Storage** | Almacenamiento de archivos (CVs, PDFs) |
| **🔄 Real-time** | Actualizaciones en tiempo real |
| **📊 Admin UI** | Panel visual para ver datos |
| **🔌 API REST/GraphQL** | Auto-generada desde las tablas |
| **🚀 Serverless** | Compatible con Vercel Functions |

### **Alternativas:**
- **MongoDB Atlas:** Gratis 512MB, NoSQL, flexible
- **PlanetScale:** MySQL serverless, gratis 5GB
- **Neon:** PostgreSQL serverless, gratis 3GB
- **Firebase:** Bueno para real-time, $0.25/GB storage

**Recomendación:** **Supabase** por su plan gratuito generoso y facilidades de almacenamiento de archivos.

---

## 📊 Esquema de Base de Datos Propuesto

### **Tabla: `leads`** (Potenciales clientes)
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(255),
  message TEXT,
  source VARCHAR(50), -- 'contact_form', 'landing_page', etc.
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

### **Tabla: `product_inquiries`** (Consultas de productos)
```sql
CREATE TABLE product_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  product_slug VARCHAR(255) NOT NULL,
  quantity INT,
  budget_range VARCHAR(50),
  urgency VARCHAR(50), -- 'immediate', 'this_month', '3_months', 'researching'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inquiries_product ON product_inquiries(product_slug);
CREATE INDEX idx_inquiries_lead ON product_inquiries(lead_id);
```

### **Tabla: `email_logs`** (Registro de emails enviados)
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  subject VARCHAR(500),
  template_name VARCHAR(100),
  status VARCHAR(50), -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
  provider_id VARCHAR(255), -- ID de SendGrid/Resend/etc
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);

CREATE INDEX idx_email_lead ON email_logs(lead_id);
CREATE INDEX idx_email_status ON email_logs(status);
```

### **Tabla: `job_applications`** (CVs recibidos)
```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(255) NOT NULL,
  cv_url VARCHAR(500), -- URL en Supabase Storage
  cv_filename VARCHAR(255),
  cover_letter TEXT,
  linkedin_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'received', -- 'received', 'reviewing', 'interview', 'rejected', 'hired'
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_applications_position ON job_applications(position);
CREATE INDEX idx_applications_status ON job_applications(status);
```

### **Tabla: `technical_documents`** (Documentos técnicos)
```sql
CREATE TABLE technical_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'datasheet', 'whitepaper', 'manual', 'certification'
  product_slug VARCHAR(255), -- Relacionar con producto de GitHub
  file_url VARCHAR(500), -- URL en Supabase Storage
  file_size INT,
  file_type VARCHAR(50),
  version VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_docs_product ON technical_documents(product_slug);
CREATE INDEX idx_docs_category ON technical_documents(category);
CREATE INDEX idx_docs_public ON technical_documents(is_public);
```

### **Tabla: `newsletter_subscribers`** (Suscriptores)
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  preferences JSONB -- {"topics": ["nft", "research"], "frequency": "weekly"}
);

CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);
```

---

## 🔌 Integración: Vercel Functions + Supabase

### **Instalación:**
```bash
npm install @supabase/supabase-js
```

### **Configuración (`api/_lib/supabase.js`):**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
```

### **Ejemplo: Endpoint para guardar lead (`api/leads/create.js`):**
```javascript
const { supabase } = require('../_lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
  }

  try {
    const { name, email, phone, company, message, source } = req.body;

    // Validación
    if (!email || !name) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'missing_fields' }));
    }

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { name, email, phone, company, message, source: source || 'contact_form' }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: error.message }));
    }

    // TODO: Enviar email de confirmación al lead
    // TODO: Notificar al equipo de ventas

    return res.end(JSON.stringify({ ok: true, lead: data[0] }));
  } catch (err) {
    console.error('Error creating lead:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'server_error' }));
  }
};
```

### **Ejemplo: Subir CV (`api/jobs/apply.js`):**
```javascript
const { supabase } = require('../_lib/supabase');
const formidable = require('formidable');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
  }

  try {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB max
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'invalid_upload' }));
      }

      const { name, email, phone, position, cover_letter, linkedin_url } = fields;
      const cvFile = files.cv;

      if (!cvFile || !email || !name || !position) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'missing_fields' }));
      }

      // 1. Subir CV a Supabase Storage
      const fileName = `${Date.now()}_${cvFile.originalFilename}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('cvs')
        .upload(fileName, cvFile.filepath, {
          contentType: cvFile.mimetype,
          cacheControl: '3600'
        });

      if (uploadError) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: 'upload_failed' }));
      }

      // 2. Obtener URL pública
      const { data: urlData } = supabase
        .storage
        .from('cvs')
        .getPublicUrl(fileName);

      // 3. Guardar aplicación en DB
      const { data: appData, error: dbError } = await supabase
        .from('job_applications')
        .insert([{
          name,
          email,
          phone,
          position,
          cv_url: urlData.publicUrl,
          cv_filename: cvFile.originalFilename,
          cover_letter,
          linkedin_url
        }])
        .select();

      if (dbError) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: dbError.message }));
      }

      // TODO: Enviar email de confirmación
      // TODO: Notificar a HR

      return res.end(JSON.stringify({ ok: true, application: appData[0] }));
    });
  } catch (err) {
    console.error('Error processing application:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'server_error' }));
  }
};
```

---

## 📧 Sistema de Emails Automatizados

### **Opción 1: Resend (Recomendado)**
- ✅ Gratis: 3,000 emails/mes
- ✅ API simple
- ✅ React Email (templates con JSX)
- ✅ Logs y analytics

```bash
npm install resend
```

```javascript
// api/_lib/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(lead) {
  const { data, error } = await resend.emails.send({
    from: 'FibersTech <noreply@fiberstech.com>',
    to: [lead.email],
    subject: '¡Gracias por contactarnos!',
    html: `
      <h1>Hola ${lead.name},</h1>
      <p>Recibimos tu mensaje y nos pondremos en contacto pronto.</p>
      <p>Mientras tanto, te invitamos a conocer nuestros productos:</p>
      <a href="https://fiberstech.com/products">Ver Productos</a>
    `
  });

  if (error) {
    console.error('Email error:', error);
    return false;
  }

  // Guardar log en Supabase
  await supabase.from('email_logs').insert([{
    lead_id: lead.id,
    subject: '¡Gracias por contactarnos!',
    template_name: 'welcome',
    status: 'sent',
    provider_id: data.id
  }]);

  return true;
}

module.exports = { sendWelcomeEmail };
```

### **Opción 2: SendGrid**
- Gratis: 100 emails/día
- Mejor para volumen alto

### **Opción 3: Mailgun**
- Gratis: 5,000 emails/mes (3 meses)
- Bueno para transaccionales

---

## 📁 Variables de Entorno Adicionales

Agregar en Vercel:

```bash
# === SUPABASE ===
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui # Solo para admin

# === EMAIL ===
RESEND_API_KEY=re_tu_api_key_aqui
FROM_EMAIL=noreply@fiberstech.com

# === NOTIFICACIONES ===
SALES_EMAIL=ventas@fiberstech.com # Para notificar nuevos leads
HR_EMAIL=rrhh@fiberstech.com # Para CVs recibidos
```

---

## 🎯 Plan de Migración (Paso a Paso)

### **Fase 1: Setup Básico (1 día)**
1. ✅ Crear cuenta en Supabase
2. ✅ Crear tablas: `leads`, `email_logs`
3. ✅ Instalar `@supabase/supabase-js`
4. ✅ Crear `api/_lib/supabase.js`
5. ✅ Configurar variables en Vercel

### **Fase 2: Formulario de Contacto (1 día)**
1. ✅ Crear `api/leads/create.js`
2. ✅ Actualizar formulario en frontend
3. ✅ Integrar Resend para emails
4. ✅ Probar flujo completo

### **Fase 3: Upload de CVs (2 días)**
1. ✅ Crear tabla `job_applications`
2. ✅ Configurar Supabase Storage (bucket `cvs`)
3. ✅ Crear `api/jobs/apply.js`
4. ✅ Formulario de aplicación en frontend
5. ✅ Panel admin para ver CVs

### **Fase 4: Documentos Técnicos (2 días)**
1. ✅ Crear tabla `technical_documents`
2. ✅ Configurar bucket `documents` en Storage
3. ✅ CRUD endpoints para documentos
4. ✅ Panel admin para gestionar docs
5. ✅ Control de acceso (públicos vs privados)

### **Fase 5: Analytics y Logs (1 día)**
1. ✅ Dashboard de leads
2. ✅ Reportes de emails enviados
3. ✅ Métricas de descargas de documentos

---

## 💰 Costos Estimados

### **Plan Gratis (< 1000 leads/mes):**
```
Vercel: $0
Supabase: $0 (hasta 500MB DB + 1GB storage)
Resend: $0 (hasta 3000 emails/mes)
Cloudinary: $0 (plan gratis para imágenes)
─────────────
TOTAL: $0/mes
```

### **Plan Escalado (> 5000 leads/mes):**
```
Vercel Pro: $20/mes (optional, más funciones serverless)
Supabase Pro: $25/mes (8GB DB + 100GB storage)
Resend: $20/mes (50k emails/mes)
─────────────
TOTAL: $65/mes
```

---

## 📊 Comparación Final: Arquitectura Híbrida vs Solo Backend

| Aspecto | Híbrida (Recomendado) | Solo Backend |
|---------|----------------------|--------------|
| **Costo inicial** | $0 | $50-100/mes |
| **Costo escalado** | $25-65/mes | $100-300/mes |
| **Complejidad** | Media | Alta |
| **Tiempo setup** | 1 semana | 2-3 semanas |
| **Backups contenido** | Automático (Git) | Manual |
| **Versionado** | Sí (Git) | No (salvo custom) |
| **Performance** | Excelente | Buena |
| **Escalabilidad** | Ilimitada | Depende servidor |

---

## ✅ Conclusión y Recomendación

### **🎯 Arquitectura Híbrida Óptima:**

```
┌────────────────────────────────────────┐
│  CONTENIDO EDITORIAL → GitHub CMS      │
│  - Productos catálogo                  │
│  - Servicios                           │
│  - Equipo                              │
│  - Research                            │
│                                        │
│  DATOS TRANSACCIONALES → Supabase     │
│  - Leads/Contactos                     │
│  - Consultas de productos              │
│  - CVs de candidatos                   │
│  - Documentos técnicos                 │
│  - Logs de emails                      │
│  - Newsletter                          │
└────────────────────────────────────────┘
```

### **Por qué esta arquitectura es superior:**

1. **💰 Económica:** $0 hasta escalar, luego $25-65/mes
2. **🔒 Segura:** Git versionado + PostgreSQL transaccional
3. **⚡ Rápida:** CDN (Vercel) + DB optimizada
4. **📈 Escalable:** Serverless auto-escala
5. **🛠️ Mantenible:** Separación clara de responsabilidades
6. **🔄 Flexible:** Fácil cambiar DB sin afectar contenido

### **NO migrar a backend tradicional porque:**
- ❌ Más caro ($100+/mes)
- ❌ Más complejo (servidor, nginx, PM2, etc.)
- ❌ Pierdes versionado de Git
- ❌ Mantenimiento manual de backups
- ❌ Escalar requiere más servidores

---

---

## 🎯 ACTUALIZACIÓN: Para Productos Bajo Pedido (Sin Stock)

Si tus productos se fabrican bajo pedido y **NO hay inventario físico**, entonces:

### **✅ MANTENER en GitHub:**
- Catálogo de productos (información estática)
- Servicios
- Equipo
- Publicaciones científicas

### **✅ AGREGAR a Supabase (NO requiere backend tradicional):**
- **Leads/Contactos** - Potenciales clientes
- **Cotizaciones** - Solicitudes de productos customizados
- **CVs** - Aplicaciones de empleo
- **Documentos técnicos** - PDFs de especificaciones
- **Email logs** - Registro de comunicaciones

### **❌ NO NECESITAS:**
- ❌ Control de inventario
- ❌ Sistema de stock
- ❌ Backend tradicional (VPS/servidor)
- ❌ Node.js corriendo 24/7

### **Arquitectura Final:**
```
Frontend (React) → Vercel Functions (serverless) → Supabase (DB + Storage)
                                                 → Resend (emails)
```

**Costos:** $0-45/mes (vs $220-450/mes con backend tradicional)

Ver documento completo: `SERVERLESS_VS_BACKEND.md`

---

## 📞 Siguiente Paso

¿Quieres que implemente esta arquitectura serverless? Puedo:

1. ✅ Configurar Supabase con las tablas propuestas
2. ✅ Crear endpoints serverless para leads y cotizaciones
3. ✅ Integrar sistema de emails con Resend
4. ✅ Actualizar formularios de contacto
5. ✅ Crear panel admin para gestionar leads

**Dime qué funcionalidad priorizar y empiezo ahora mismo.**

