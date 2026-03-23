
const API_KEY = "AIzaSyCd2404lg5NBujDVDBkIcG-p0219gzisqU";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function test() {
  console.log("Verificando clave en Google AI Studio...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Hola, responde solo con la palabra OK si funcionas." }]
        }]
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log("✅ ÉXITO: La clave funciona perfectamente.");
      console.log("Respuesta de Gemini:", data.candidates[0].content.parts[0].text);
    } else {
      console.error("❌ ERROR DE API:", data.error ? data.error.message : response.statusText);
      console.log("Detalles:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("❌ ERROR TÉCNICO:", e.message);
  }
}

test();
