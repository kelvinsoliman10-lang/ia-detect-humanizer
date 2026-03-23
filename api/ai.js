
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, text } = req.body;
  const CLOUD_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const CLOUD_API_TOKEN = process.env.VITE_CLOUDFLARE_API_TOKEN;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  try {
    let systemPrompt = "";
    if (action === 'detect') {
      systemPrompt = "Analyze the text and determine the probability (0-100%) that it was AI-generated. Return ONLY a JSON object: {\"score\": number, \"analysis\": \"string\", \"suspiciousPhrases\": [\"string\"]}";
    } else if (action === 'humanize') {
      systemPrompt = `Eres un Humanizador de Textos de nivel experto.
      Instrucciones Críticas:
      - REESCRIBE el texto con máxima fluidez y naturalidad humana.
      - MANTÉN SOCIAL EL REGISTRO: Si el original es formal, la salida debe ser 100% formal, técnica y profesional.
      - PROHIBICIÓN ABSOLUTA: No añadas ni una sola palabra de relleno, muletilla o comentario personal.
      - GRAMÁTICA: Tu gramática debe ser perfecta y sofisticada.
      - FORMATO: Respeta cada salto de línea y espacio.
      - SIN PREÁMBULOS: Devuelve solo el texto humanizado.`;
    }

    // --- PRIORIDAD 1: GEMINI 1.5 FLASH (SI HAY API KEY) ---
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'TU_API_KEY_AQUI' && GEMINI_API_KEY.startsWith('AIza')) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\nTEXTO A PROCESAR:\n${text}` }]
          }]
        })
      });

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        if (data.candidates && data.candidates[0].content) {
          const responseText = data.candidates[0].content.parts[0].text.trim();
          res.setHeader('X-AI-Engine', 'Gemini-1.5-Flash');
          return res.status(200).json({ response: responseText, engine: 'gemini' });
        }
      }
      console.warn("Gemini failing or empty response, falling back...");
    }

    // --- PRIORIDAD 2: CLOUDFLARE LLAMA 3.1 (FALLBACK) ---
    if (!CLOUD_ACCOUNT_ID || !CLOUD_API_TOKEN) {
      return res.status(500).json({ error: 'Missing AI credentials' });
    }

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

    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();
      return res.status(cfResponse.status).json({ error: 'AI Error', details: errorText });
    }

    const result = await cfResponse.json();
    res.setHeader('X-AI-Engine', 'Cloudflare-Llama-3.1');
    return res.status(200).json({ response: result.result.response, engine: 'cloudflare' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
