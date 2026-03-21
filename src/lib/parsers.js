import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Configure PDF.js worker using Vite's ?url import for local hosting
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false 
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' '); // Clean excessive spacing
      fullText += pageText + '\n\n';
    }
    
    if (!fullText.trim()) throw new Error('El PDF no contiene texto extraíble (podría ser una imagen).');
    return fullText;
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    throw new Error(`Error en PDF: ${error.message || 'Archivo corrupto o no compatible'}`);
  }
};

export const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const extractTextFromPPTX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let fullText = '';
  
  // PPTX slides are in ppt/slides/
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  // Sort slides numerically
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
    return numA - numB;
  });

  for (const slidePath of slideFiles) {
    const content = await zip.file(slidePath).async('string');
    // Simple regex to extract text from <a:t> tags
    const matches = content.match(/<a:t>([^<]*)<\/a:t>/g);
    if (matches) {
      const slideText = matches.map(m => m.replace(/<a:t>|<\/a:t>/g, '')).join(' ');
      fullText += `--- Diapositiva ---\n${slideText}\n\n`;
    }
  }
  
  return fullText;
};

export const extractText = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromDOCX(file);
    case 'pptx':
      return await extractTextFromPPTX(file);
    case 'txt':
      return await file.text();
    default:
      throw new Error('Formato de archivo no soportado. Usa PDF, DOCX, PPTX o TXT.');
  }
};
