import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiModel = (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast and efficient for detection
};

export const detectAI = async (text, apiKey) => {
  if (!apiKey) throw new Error("Se requiere una API Key de Gemini.");
  
  const model = getGeminiModel(apiKey);
  const prompt = `Analiza detalladamente el siguiente texto y determina la probabilidad (0-100%) de que haya sido generado por una IA (como GPT, Gemini, Claude).
  Considera la estructura de las oraciones, el vocabulario, la coherencia y patrones típicos de modelos de lenguaje.
  
  Devuelve el resultado ÚNICAMENTE en formato JSON con la siguiente estructura:
  {
    "score": número del 0 al 100,
    "analysis": "Breve explicación de por qué obtuvo ese puntaje",
    "suspiciousPhrases": ["frase 1", "frase 2"]
  }
  
  TEXTO:
  ${text.substring(0, 10000)} // Límite para evitar tokens excesivos en análisis rápido`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error en detección:", error);
    throw new Error("No se pudo analizar el texto. Verifica tu API Key.");
  }
};

export const humanizeText = async (text, apiKey) => {
  if (!apiKey) throw new Error("Se requiere una API Key de Gemini.");
  
  const model = getGeminiModel(apiKey);
  const prompt = `Actúa como un escritor humano experto con un estilo natural, variado y cautivador.
  Tu tarea es REESCRIBIR el siguiente texto para que suene 100% humano y sea indetectable por escáneres de IA.
  
  REGLAS:
  1. Varía la longitud de las oraciones (mezcla oraciones cortas e impactantes con largas y fluidas).
  2. Usa un vocabulario rico pero natural, evitando muletillas de IA como "En conclusión", "Por otro lado", "Es importante destacar".
  3. Mantén exactamente el mismo significado e información original.
  4. Agrega sutilezas estilísticas manuales.
  
  TEXTO A HUMANIZAR:
  ${text}
  
  Devuelve ÚNICAMENTE el texto reescrito:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error en humanización:", error);
    throw new Error("No se pudo humanizar el texto.");
  }
};
