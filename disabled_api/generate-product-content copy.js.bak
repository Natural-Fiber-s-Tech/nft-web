import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body;

    // Handle different input formats (Vite vs standalone)
    if (req.body && Buffer.isBuffer(req.body)) {
      // Vite middleware passes raw buffer
      body = req.body;
    } else {
      // Standard formidable parsing for standalone use
      const form = formidable();
      const [fields, files] = await form.parse(req);

      const pdfFile = files.pdf && files.pdf[0];
      if (!pdfFile) {
        return res.status(400).json({ error: "No PDF file provided" });
      }

      body = fs.readFileSync(pdfFile.filepath);
    }

    // For Vite middleware, we need to parse the multipart data manually
    if (Buffer.isBuffer(body)) {
      const boundary = req.headers["content-type"]?.split("boundary=")[1];
      if (!boundary) {
        return res.status(400).json({ error: "Invalid multipart form data" });
      }

      // Simple multipart parsing for PDF extraction
      const bodyStr = body.toString("binary");
      const parts = bodyStr.split(`--${boundary}`);

      let pdfBuffer = null;

      for (const part of parts) {
        if (part.includes("filename=") && part.includes(".pdf")) {
          // Find the start of binary data (after double CRLF)
          const dataStart = part.indexOf("\r\n\r\n") + 4;
          if (dataStart > 3) {
            const binaryData = part.substring(dataStart);
            // Remove the trailing boundary
            const endIndex = binaryData.lastIndexOf("\r\n--");
            const cleanBinaryData =
              endIndex > 0 ? binaryData.substring(0, endIndex) : binaryData;
            pdfBuffer = Buffer.from(cleanBinaryData, "binary");
            break;
          }
        }
      }

      if (!pdfBuffer) {
        return res.status(400).json({ error: "No PDF file found in request" });
      }

      body = pdfBuffer;
    }

    // Extract text from PDF
    const pdfData = await pdf(body);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length < 100) {
      return res.status(400).json({ error: "PDF content too short or empty" });
    }

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Genera contenido para un CMS de productos en formato JSON.

IMPORTANTE: Responde SOLAMENTE con JSON válido. No uses markdown ni explicaciones.

DEBES generar este JSON exacto con TODOS los campos:
{
  "name": {"es": "Nombre del producto", "en": "Product name"},
  "tagline": {"es": "Subtítulo descriptivo corto", "en": "Short descriptive tagline"},
  "description": {"es": "Descripción corta para vista card (máximo 2 líneas)", "en": "Short description for card view (max 2 lines)"},
  "descriptionDetail": {"es": "Descripción detallada para vista completa", "en": "Detailed description for full view"},
  "category": {"es": "Categoría del producto", "en": "Product category"},
  "features": {
    "es": ["Feature corto 1", "Feature corto 2", "Feature corto 3", "Feature corto 4"],
    "en": ["Short feature 1", "Short feature 2", "Short feature 3", "Short feature 4"]
  },
  "featuresDetail": [
    {
      "title": {"es": "Feature corto 1", "en": "Short feature 1"},
      "description": {"es": "Descripción de aproximadamente diez palabras explicando el feature", "en": "Description of approximately ten words explaining the feature"}
    },
    {
      "title": {"es": "Feature corto 2", "en": "Short feature 2"},
      "description": {"es": "Descripción de aproximadamente diez palabras explicando el feature", "en": "Description of approximately ten words explaining the feature"}
    },
    {
      "title": {"es": "Feature corto 3", "en": "Short feature 3"},
      "description": {"es": "Descripción de aproximadamente diez palabras explicando el feature", "en": "Description of approximately ten words explaining the feature"}
    },
    {
      "title": {"es": "Feature corto 4", "en": "Short feature 4"},
      "description": {"es": "Descripción de aproximadamente diez palabras explicando el feature", "en": "Description of approximately ten words explaining the feature"}
    }
  ],
  "capabilities": {
    "es": ["Capacidad 1", "Capacidad 2", "Capacidad 3", "Capacidad 4"],
    "en": ["Capability 1", "Capability 2", "Capability 3", "Capability 4"]
  },
  "specifications": {
    "es": {
      "Tipo": "Tipo de equipo",
      "Peso": "Peso del equipo",
      "Dimensiones": "Dimensiones",
      "Alimentación": "Especificación eléctrica"
    },
    "en": {
      "Type": "Equipment type",
      "Weight": "Equipment weight", 
      "Dimensions": "Dimensions",
      "Power Supply": "Electrical specification"
    }
  }
}

REGLAS:
- Generar exactamente 4 features (máximo 4 palabras cada uno)
- Generar exactamente 4 featuresDetail expandido de los 4 features anteriores (los featuresDetail.title deben coincidir con features, y en featuresDetail.description debe haber una breve explicación del feature - 10 palabras aprox.)
- NO incluir campo "icon" en featuresDetail
- Generar al menos 4 capabilities

Análisis de equipos NFT para caracterización de fibras animales (alpaca, llama, cabras).

Contenido del PDF:
${pdfText.slice(0, 15000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // DEBUG: Log de la respuesta completa del modelo
    console.log("🤖 DEBUG - Respuesta RAW completa del modelo Gemini:");
    console.log("================================");
    console.log(text);
    console.log("================================");

    // Clean and parse JSON response with better error handling
    let cleanText = text.trim();

    // Remove markdown code blocks if present
    cleanText = cleanText.replace(/```json\n?|\n?```/g, "");

    // Try to find JSON object in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    // Additional cleanup
    cleanText = cleanText.trim();

    let generatedContent;
    try {
      generatedContent = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Raw response:", text);
      console.error("Cleaned text:", cleanText);

      // Try alternative cleaning approach
      const alternativeClean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/^\s*[\w\s]*?\{/, "{") // Remove text before opening brace
        .replace(/\}[\w\s]*?$/, "}") // Remove text after closing brace
        .trim();

      try {
        generatedContent = JSON.parse(alternativeClean);
      } catch (secondParseError) {
        throw new Error(
          `Error parsing AI response: ${
            parseError.message
          }. Raw response: ${text.substring(0, 500)}...`
        );
      }
    }

    // Cleanup temp file
    fs.unlinkSync(pdfFile.filepath);

    // DEBUG: Log del contenido generado
    console.log(
      "🔍 DEBUG - Contenido generado por Gemini:",
      JSON.stringify(generatedContent, null, 2)
    );

    res.status(200).json(generatedContent);
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({
      error: "Error generating content",
      details: error.message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
