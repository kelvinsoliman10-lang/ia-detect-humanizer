/**
 * Advanced Local AI Detector
 * Focuses on Perplexity, Burstiness, and Structural Uniformity
 */

export const analyzeText = (text) => {
  console.log("Analizando texto. Longitud:", text?.length);
  if (!text || text.trim().length < 20) {
    return {
      score: 5,
      analysis: "Texto muy breve. Escribe al menos un par de frases para un análisis mejor.",
      suspiciousPhrases: []
    };
  }

  // 1. Text Normalization (PDF intelligence)
  // Remove excessive whitespace, normalize line breaks, and fix common PDF extraction artifacts
  const normalized = text.trim()
    .replace(/\s+/g, ' ')
    .replace(/([a-z])-\s+([a-z])/gi, '$1$2') // Fix hyphenated words at line breaks
    .replace(/[^\x20-\x7E\s]/g, ''); // Remove non-printable chars

  const sentences = normalized.match(/[^.!?]+[.!?]+/g) || [normalized];
  const words = normalized.toLowerCase().match(/\b\b[A-Za-zÀ-ÿ0-9]+\b/g) || [];
  
  if (words.length < 5) return { score: 10, analysis: "Análisis limitado por longitud (min 5 palabras).", suspiciousPhrases: [] };

  // 2. Vocabulary Entropy (Perplexity)
  const wordFreq = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  
  let entropy = 0;
  const totalWords = words.length;
  Object.values(wordFreq).forEach(f => {
    const p = f / totalWords;
    entropy -= p * Math.log2(p);
  });

  // AI typical entropy: < 8.5. Human: > 9.0.
  // We use a non-linear scale to be more sensitive near the threshold.
  const perplexityScore = Math.max(0, Math.min(100, Math.pow((9.4 - entropy) * 15, 1.2)));

  // 3. Sentence Length Variance (Burstiness)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);
  
  // AI burstiness: < 2.5 (very uniform). Human: > 6.0.
  const burstinessScore = Math.max(0, Math.min(100, 100 - (stdDev * 15)));

  // 4. Linguistic Fingerprints (Structural analysis)
  const aiKeywords = [
    /\b(en conclusión|no obstante|por otro lado|es importante destacar|además|asimismo|en resumen|fundamentalmente|optimización|paradigma)\b/gi,
    /\b(in conclusion|furthermore|moreover|it is important to note|consequently|overall|effectively|leverage|utilize)\b/gi,
    /\b(explora|descubre|misterioso|intrincado|tapiz|vibrante|balanceado)\b/gi // Common GPT-4 filler words/adjectives
  ];

  let patternMatches = 0;
  const suspiciousPhrases = [];
  aiKeywords.forEach(p => {
    const matches = normalized.match(p);
    if (matches) {
      patternMatches += matches.length;
      if (suspiciousPhrases.length < 5) suspiciousPhrases.push(matches[0]);
    }
  });

  // Check for "Uniformity" - AI often starts sentences with the same words (The, He, It, This)
  const sentenceStarts = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
  const startFreq = {};
  sentenceStarts.forEach(s => { startFreq[s] = (startFreq[s] || 0) + 1; });
  const startRepetition = Object.values(startFreq).filter(f => f > 1).length / sentenceStarts.length;

  const patternScore = Math.min(100, (patternMatches * 15) + (startRepetition * 500));

  // 5. Detection Override: If "Human Fillers" exist, drop score significantly
  const humanFillers = /\b(la verdad es que|yo creo que|pues|en fin|básicamente|como que|o sea|por cierto|fíjate que)\b/gi;
  const fillerMatches = normalized.match(humanFillers)?.length || 0;
  const humanBonus = Math.min(40, fillerMatches * 15);

  // Final Score with weighting
  let finalScore = (perplexityScore * 0.4) + (burstinessScore * 0.3) + (patternScore * 0.3);
  
  // Apply human bonus (reduction of AI score)
  finalScore = Math.max(1, finalScore - humanBonus);

  // Penalty for extremely low variance (nearly certain AI)
  if (stdDev < 1.8) finalScore = Math.max(finalScore, 85);

  const score = Math.round(Math.min(100, finalScore));

  return {
    score,
    analysis: getDetailedAnalysis(score, entropy, stdDev, fillerMatches),
    suspiciousPhrases: [...new Set(suspiciousPhrases)],
    metrics: {
      perplexity: Math.round(entropy * 10), // Scale to 0-100 approx
      burstiness: Math.round(stdDev * 10),
      fillerCount: fillerMatches
    }
  };
};

const getDetailedAnalysis = (score, entropy, stdDev, fillers) => {
  if (score < 15) return "Autenticidad Humana: El texto posee una 'perplejidad' natural y un ritmo (burstiness) muy irregular, propios de un autor humano.";
  if (score < 40) return "Autoría Probable: Aunque la estructura es limpia, la presencia de muletillas naturales (" + fillers + " detectadas) y variabilidad gramatical alejan este texto de una IA.";
  if (score < 70) return "Patrones Híbridos: Se detectan transiciones mecánicas y longitudes de oración sospechosamente constantes. Requiere revisión.";
  return "Huella Digital de AI: La uniformidad estructural y el vocabulario altamente predecible son firmas claras de modelos como GPT-4.";
};
