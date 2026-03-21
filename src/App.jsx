import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Copy,
  Check,
  Zap,
  Info,
  Activity,
  BarChart3,
  Divide
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import DetectionGauge from './components/DetectionGauge';
import { extractText } from './lib/parsers';
import { detectAI, humanizeText, cleanTranscription } from './lib/cloudflare';
import { analyzeText as localDetect } from './lib/detector';
import { humanize as localHumanize } from './lib/humanizer';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [result, setResult] = useState(null);
  const [humanizedText, setHumanizedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setIsScanning(true);
    setError('');
    setResult(null);
    try {
      const extractedContent = await extractText(selectedFile);
      let contentToAnalyze = extractedContent;

      try {
        // AI Cleaning Pass (might fail due to CORS)
        contentToAnalyze = await cleanTranscription(extractedContent);
      } catch (aiErr) {
        console.warn("AI Cleaning failed, using raw text:", aiErr);
      }
      
      setText(contentToAnalyze);
      
      try {
        const analysis = await detectAI(contentToAnalyze);
        setResult(analysis);
      } catch (detectErr) {
        console.warn("Cloudflare Detection failed, using local detector:", detectErr);
        setResult(localDetect(contentToAnalyze));
      }
      
      setIsScanning(false);
    } catch (err) {
      console.error("File processing error:", err);
      setError(err.message || "Error al procesar el archivo.");
      setFile(null);
      setIsScanning(false);
    }
  };

  const handleScan = async () => {
    if (!text.trim()) return setError('Por favor, ingresa algún texto.');
    setIsScanning(true);
    setError('');
    try {
      try {
        const analysis = await detectAI(text);
        setResult(analysis);
      } catch (err) {
        console.warn("Cloudflare failed, using local fallback");
        setResult(localDetect(text));
      }
    } catch (err) {
      setError("Error en el análisis.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setIsHumanizing(true);
    setError('');
    try {
      try {
        const response = await humanizeText(text);
        setHumanizedText(response);
      } catch (err) {
        console.warn("Cloudflare humanizer failed, using local fallback");
        setHumanizedText(localHumanize(text));
      }
      
      // Re-analyze
      try {
        const autoResult = await detectAI(humanizedText || text);
        setResult(autoResult);
      } catch (err) {
        setResult(localDetect(humanizedText || text));
      }
    } catch (err) {
      setError("Error al humanizar.");
    } finally {
      setIsHumanizing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(humanizedText || text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setText('');
    setFile(null);
    setResult(null);
    setHumanizedText('');
    setError('');
  };

  return (
    <div className="app-container">
      <div className="background-blur" />

      <nav className="navbar">
        <div className="logo-container" onClick={reset}>
          <div className="logo-icon" style={{ background: 'none', padding: 0, boxShadow: 'none' }}>
            <img src="/logo.png" alt="Humanly" style={{ height: '250px', objectFit: 'contain' }} />
          </div>
          <div className="brand-info">
            <span className="logo-text">Humanly</span>
            <span className="beta-badge">BETA</span>
          </div>
        </div>
        
        <div className="nav-actions">
          <div className="beta-info">Public Beta v1.0</div>
          <div className="badge-free">100% Free Access</div>
        </div>
      </nav>

      <main className="pro-layout">
        <AnimatePresence mode="wait">
          <motion.div 
            key="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="workspace"
          >
              <div className="editor-side">
                <div className="card-header">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={reset} className="btn-tab">Nuevo</button>
                    <button className="btn-tab active">Editor</button>
                  </div>
                  {file && (
                    <div className="file-pill">
                      <Info size={12} />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>

                <div className="main-input-wrapper" style={{ position: 'relative' }}>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Comienza a escribir o arrastra un documento..."
                    className="pro-textarea custom-scrollbar"
                  />
                  
                  <div className="floating-actions">
                    <FileUpload onFileSelect={handleFileSelect} compact={true} />
                    <button 
                      onClick={handleScan}
                      disabled={isScanning || !text.trim()}
                      className="btn btn-primary"
                    >
                      {isScanning ? <Loader2 size={16} className="animate-spin" /> : <span>Analizar IA</span>}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {humanizedText && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="humanized-result-box"
                    >
                      <div className="box-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Sparkles size={14} />
                          <span>Mejora Aplicada</span>
                        </div>
                        <button onClick={copyToClipboard} className="btn-action">
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="result-content custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {humanizedText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="analysis-side">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                      <DetectionGauge score={result.score} />
                      
                      <div className="analysis-details">
                        <h4>Introspección de Red</h4>
                        <p>{result.analysis}</p>
                        
                        {result.metrics && (
                          <div className="metrics-grid">
                            <div className="metric-card">
                              <span className="m-label">Perplejidad</span>
                              <span className="m-value">{result.metrics.perplexity}</span>
                              <div className="m-bar"><div className="m-fill" style={{ width: `${result.metrics.perplexity}%` }} /></div>
                            </div>
                            <div className="metric-card">
                              <span className="m-label">Variabilidad</span>
                              <span className="m-value">{result.metrics.burstiness}</span>
                              <div className="m-bar"><div className="m-fill" style={{ width: `${result.metrics.burstiness}%` }} /></div>
                            </div>
                          </div>
                        )}

                        {result.suspiciousPhrases?.length > 0 && (
                          <div className="phrases-grid">
                            {result.suspiciousPhrases.map((p, i) => (
                              <span key={i} className="phrase-tag">"{p}"</span>
                            ))}
                          </div>
                        )}

                        {!humanizedText && (
                          <button 
                            onClick={handleHumanize}
                            disabled={isHumanizing}
                            className="btn btn-large"
                            style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
                          >
                            {isHumanizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            <span>{isHumanizing ? 'Procesando...' : 'Humanizar Texto'}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="empty-analysis">
                      <div className="empty-icon"><ShieldCheck size={40} /></div>
                      <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Listo para Escanear</h4>
                      <p>Sube un archivo o escribe algo para ver el análisis de autenticidad en tiempo real.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="toast-error"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
