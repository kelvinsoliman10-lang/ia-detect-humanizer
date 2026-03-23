
const API_KEY = "AIzaSyCd2404lg5NBujDVDBkIcG-p0219gzisqU";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function test() {
  console.log("Listando modelos disponibles para esta clave...");
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log("✅ ÉXITO: Los modelos disponibles son:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.error("❌ ERROR AL LISTAR:", data.error ? data.error.message : response.statusText);
    }
  } catch (e) {
    console.error("❌ ERROR TÉCNICO:", e.message);
  }
}

test();
