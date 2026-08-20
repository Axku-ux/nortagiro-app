import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para leer .env.local (estándar de Vite)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint para enviar emails de invitación
app.post('/api/emails/invite', async (req, res) => {
  try {
    const { emails, campaignTitle, campaignId, organizationName } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Lista de correos inválida' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('Simulando envío de correo (RESEND_API_KEY no configurada)');
      return res.json({ success: true, simulated: true, count: emails.length });
    }

    const { data, error } = await resend.emails.send({
      from: 'ClimaPulse 360 <onboarding@resend.dev>', 
      to: emails,
      subject: `Invitación: Encuesta de Clima - ${campaignTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hola,</h2>
          <p>Te invitamos a participar en la encuesta de clima organizacional <strong>${campaignTitle}</strong> de ${organizationName}.</p>
          <p>Tu opinión es fundamental y 100% anónima.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/survey/${campaignId}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Comenzar Encuesta
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px;">© ${new Date().getFullYear()} ${organizationName}</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para generar insights con IA
app.post('/api/insights/generate', async (req, res) => {
  try {
    const { heatmapData, globalMetrics } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const prompt = `
      Actúa como un experto consultor de Talento y Cultura / RRHH.
      Analiza los siguientes datos de la encuesta de clima organizacional reciente y genera exactamente 3 insights clave.
      
      Datos globales:
      ${JSON.stringify(globalMetrics, null, 2)}
      
      Datos por dimensión y departamento (1 a 10):
      ${JSON.stringify(heatmapData, null, 2)}
      
      Reglas:
      1. Genera 1 'alert' (riesgo crítico o puntuación más baja).
      2. Genera 1 'praise' (felicitación, puntuación alta o mejora).
      3. Genera 1 'opportunity' (recomendación accionable de mejora).
      4. Sé directo, profesional y claro.
    `;

    const responseFormat = {
      type: Type.ARRAY,
      description: "Lista de 3 insights organizacionales",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Un ID único, ej: ins-1" },
          type: { type: Type.STRING, enum: ['alert', 'opportunity', 'praise'] },
          title: { type: Type.STRING, description: "Título breve y descriptivo del insight (máx 6 palabras)" },
          description: { type: Type.STRING, description: "Análisis profundo pero conciso de la situación." },
          department: { type: Type.STRING, description: "El departamento afectado, si aplica. Si es global, omitir o poner 'Global'." }
        },
        required: ["id", "type", "title", "description", "department"]
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseFormat,
        temperature: 0.2, // Baja temperatura para análisis de datos más determinista
      }
    });

    const text = response.text;
    if (!text) throw new Error("La respuesta de Gemini está vacía");

    const insights = JSON.parse(text);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Error generando insights' });
  }
});

// Endpoint base para healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`ClimaPulse API Server running on port ${port}`);
});
