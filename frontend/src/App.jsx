import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiSun, FiMoon, FiClipboard, FiCheck, FiFileText } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);
  const [inputMethod, setInputMethod] = useState('upload');
  const [manualText, setManualText] = useState('');

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file?.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://agreewise-lxez.onrender.com/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      toast.error('Error uploading file. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) {
      toast.error('Please enter contract text');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://agreewise-lxez.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: manualText }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      toast.error('Error analyzing text. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const copyToClipboard = () => {
    if (!analysis) return;
    const text = `
      Risk Score: ${analysis.riskScore}
      Crucial Points:
      ${analysis.crucialPoints.join('\n')}
      Final Verdict: ${analysis.verdict ? 'Safe to proceed' : 'Not recommended'}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'risk-low';
      case 'medium': return 'risk-medium';
      case 'high': return 'risk-high';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 min-h-screen transition-colors duration-300">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center mb-12">
            <div className="logo-container mb-2">
              <svg className="w-16 h-16 text-primary animate-float" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300">
              AgreeWise
              </h1>
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors shadow-lg"
              >
                {isDarkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
              </button>
            </div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl text-center">
              Upload your contract or paste the text below for instant AI-powered analysis and risk assessment
            </p>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setInputMethod('upload')}
              className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all ${
                inputMethod === 'upload'
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <FiUpload size={20} />
                <span>Upload PDF</span>
              </div>
            </button>
            <button
              onClick={() => setInputMethod('manual')}
              className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all ${
                inputMethod === 'manual'
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <FiFileText size={20} />
                <span>Manual Input</span>
              </div>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {inputMethod === 'upload' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`dropzone bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
                    isDragActive ? 'dropzone-active' : ''
                  } hover:border-primary hover:bg-primary/5 transition-all`}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <FiUpload className="w-16 h-16 text-primary animate-bounce-gentle" />
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                      {isDragActive
                        ? "Drop your contract here"
                        : "Drag & drop your contract, or click to select"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports PDF files
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste your contract text here..."
                  className="w-full h-64 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-lg"
                />
                <button
                  onClick={handleManualSubmit}
                  className="w-full py-4 px-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/30"
                >
                  Analyze Contract
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 flex justify-center"
            >
              <div className="relative">
                <div className="animate-spin-slow rounded-full h-20 w-20 border-4 border-primary border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {analysis && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-12 space-y-8"
              >
                <div className="card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Analysis Results
                    </h2>
                    <button
                      onClick={copyToClipboard}
                      className="button button-primary"
                    >
                      {copied ? <FiCheck size={20} /> : <FiClipboard size={20} />}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Risk Level
                      </span>
                      <div className={`risk-badge ${getRiskColor(analysis.riskScore)} mt-2`}>
                        {analysis.riskScore.charAt(0).toUpperCase() + analysis.riskScore.slice(1)}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Crucial Points
                      </span>
                      <ul className="mt-3 space-y-3">
                        {analysis.crucialPoints.map((point, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl text-gray-700 dark:text-gray-300 hover:shadow-lg transition-all cursor-default"
                          >
                            {point}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Final Verdict
                      </span>
                      <div className={`mt-2 text-xl font-bold ${
                        analysis.verdict ? 'text-success' : 'text-danger'
                      }`}>
                        {analysis.verdict ? '✅ Safe to proceed' : '❌ Not recommended'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
}

export default App;