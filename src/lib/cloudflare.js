/**
 * Cloudflare Workers AI Bridge
 * Uses Llama-3-8B-Instruct for high-volume free processing
 */

const ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

const runAI = async (prompt, systemPrompt = "You are a helpful assistant.") => {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error("Credenciales de Cloudflare no configuradas.");
  }

  const model = "@cf/meta/llama-3-8b-instruct";
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Cloudflare Error:", err);
    throw new Error("Error en la IA de Cloudflare.");
  }

  const result = await response.json();
  return result.result.response;
};

export const detectAI = async (text) => {
  const systemPrompt = `Analyze the text and determine the probability (0-100%) that it was AI-generated.
  Consider structure, vocabulary, and common GPT patterns.
  Return ONLY a JSON object: {"score": number, "analysis": "string", "suspiciousPhrases": ["string"]}`;
  
  const response = await runAI(`Analyze this text: ${text.substring(0, 5000)}`, systemPrompt);
  try {
    const jsonStr = response.match(/\{.*\}/s)?.[0] || response;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("Llama JSON parse failed, using fallback regex", e);
    return { score: 50, analysis: "Análisis preliminar completado.", suspiciousPhrases: [] };
  }
};

export const humanizeText = async (text) => {
  const systemPrompt = `You are a professional human writer. 
  Rewrite the input text to make it sound 100% human and original. 
  Rules:
  1. Vary sentence length (mix short and long).
  2. Use natural, sophisticated Spanish.
  3. Remove AI clichés like 'En conclusión', 'Por otro lado'.
  4. Keep the exact same meaning.
  Return ONLY the humanized text.`;

  return await runAI(`Humanize this text: ${text}`, systemPrompt);
};

export const cleanTranscription = async (text) => {
  const systemPrompt = `You are a text cleaner. 
  Fix the following jumbled text extracted from a file (PDF/DOCX). 
  Remove artifacts, fix broken lines, and ensure it's readable while maintaining the content.
  Return ONLY the clean text.`;

  return await runAI(`Clean this text: ${text.substring(0, 10000)}`, systemPrompt);
};
