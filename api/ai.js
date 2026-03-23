
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, text } = req.body;
  const CLOUD_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUD_ACCOUNT_ID;
  const CLOUD_API_TOKEN = process.env.VITE_CLOUDFLARE_API_TOKEN || process.env.CLOUD_API_TOKEN;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  try {
    let systemPrompt = "";
    if (action === 'detect') {
      systemPrompt = "Analyze the text and determine the probability (0-100%) that it was AI-generated. Return ONLY a JSON object: {\"score\": number, \"analysis\": \"string\", \"suspiciousPhrases\": [\"string\"]}";
    } else if (action === 'humanize') {
      systemPrompt = `Eres un Humanizador de Textos de nivel experto. 
      Instrucciones Críticas:
      - REESCRIBE el texto con máxima fluidez y naturalidad humana.
      - MANTÉN SOCIAL EL REGISTRO: Si el original es formal, la salida debe ser 100% formal y técnica.
      - PROHIBICIÓN ABSOLUTA: No añadas palabras de relleno, muletillas o comentarios personales.
      - GRAMÁTICA: Tu gramática debe ser perfecta.
      - FORMATO: Respeta cada salto de línea y espacio original.
      - SIN PREÁMBULOS: Devuelve solo el texto convertido.`;
    }

    // --- PRIORIDAD 1: GEMINI (SMART SELECTOR) ---
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'TU_API_KEY_AQUI' && GEMINI_API_KEY.length > 20) {
      const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro'];
      let lastError = null;

      for (const modelId of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
          
          const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemPrompt}\n\nTEXTO A PROCESAR:\n${text}` }]
              }]
            })
          });

          const data = await geminiResponse.json();
          
          if (geminiResponse.ok && data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const responseText = data.candidates[0].content.parts[0].text.trim();
            res.setHeader('X-AI-Engine', `Gemini-${modelId}`);
            return res.status(200).json({ response: responseText, engine: 'gemini' });
          } else {
            if (geminiResponse.status === 404) {
              lastError = data.error;
              continue; 
            }
            if (data.error) {
              return res.status(geminiResponse.status).json({ error: 'Gemini Error', details: data.error.message });
            }
          }
        } catch (geminiErr) {
          console.error(`Network error with ${modelId}`);
        }
      }
      
      // SI TODO FALLA, intentamos listar modelos para diagnosticar
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();
        if (listData.models) {
          const available = listData.models.map(m => m.name.replace('models/', '')).join(', ');
          return res.status(404).json({ 
            error: 'Incompatibilidad de Modelos', 
            details: `Tu clave solo soporta: ${available}. Por favor repórtame esta lista.` 
          });
        }
      } catch (e) {}

      if (lastError) {
        return res.status(404).json({ error: 'Gemini Model Error', details: lastError.message });
      }
    }

    // --- PRIORIDAD 2: CLOUDFLARE LLAMA 3.1 (FALLBACK) ---
    if (CLOUD_ACCOUNT_ID && CLOUD_API_TOKEN) {
      const model = "@cf/meta/llama-3.1-8b-instruct";
      const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUD_ACCOUNT_ID}/ai/run/${model}`;

      const cfResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUD_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ]
        })
      });

      if (cfResponse.ok) {
        const result = await cfResponse.json();
        res.setHeader('X-AI-Engine', 'Cloudflare-Llama-3.1');
        return res.status(200).json({ response: result.result.response, engine: 'cloudflare' });
      }
    }

    return res.status(404).json({ error: 'No AI engines available. Please check GEMINI_API_KEY in Vercel settings.' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
