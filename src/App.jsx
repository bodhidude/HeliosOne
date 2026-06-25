import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSpaceWeatherData } from './services/api';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ModuleGrid from './components/ModuleGrid';
import Modal from './components/Modal';
import { generateSummary, sendChatMessage } from './services/ai';

function App() {
  const [data, setData] = useState({ plasma: [], mag: [], xrays: [], kp: [], protons: [], f107: [], forecast: [] });
  const [chatHistory, setChatHistory] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState(null);

  // LLM Provider state management with localStorage persistence
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('helios_ai_provider') || 'ollama');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('helios_ai_model') || 'gemma4:e4b');

  // Bring Your Own Key state management
  const [saveKeys, setSaveKeys] = useState(() => localStorage.getItem('helios_save_keys') === 'true');
  const [geminiKey, setGeminiKey] = useState(() => {
    return localStorage.getItem('helios_save_keys') === 'true'
      ? localStorage.getItem('helios_gemini_key') || ''
      : '';
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    return localStorage.getItem('helios_save_keys') === 'true'
      ? localStorage.getItem('helios_openai_key') || ''
      : '';
  });
  const [anthropicKey, setAnthropicKey] = useState(() => {
    return localStorage.getItem('helios_save_keys') === 'true'
      ? localStorage.getItem('helios_anthropic_key') || ''
      : '';
  });

  // Track if initial telemetry load is complete
  const isLoaded = useRef(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('helios_ai_provider', aiProvider);
    localStorage.setItem('helios_ai_model', aiModel);
    localStorage.setItem('helios_save_keys', saveKeys);
    if (saveKeys) {
      localStorage.setItem('helios_gemini_key', geminiKey);
      localStorage.setItem('helios_openai_key', openaiKey);
      localStorage.setItem('helios_anthropic_key', anthropicKey);
    } else {
      localStorage.removeItem('helios_gemini_key');
      localStorage.removeItem('helios_openai_key');
      localStorage.removeItem('helios_anthropic_key');
    }
  }, [aiProvider, aiModel, saveKeys, geminiKey, openaiKey, anthropicKey]);

  // Refs for LLM settings so fetchData closure doesn't go stale
  const aiProviderRef = useRef(aiProvider);
  const aiModelRef = useRef(aiModel);
  const keysRef = useRef({ geminiKey, openaiKey, anthropicKey });
  useEffect(() => { aiProviderRef.current = aiProvider; }, [aiProvider]);
  useEffect(() => { aiModelRef.current = aiModel; }, [aiModel]);
  useEffect(() => { keysRef.current = { geminiKey, openaiKey, anthropicKey }; }, [geminiKey, openaiKey, anthropicKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchSpaceWeatherData();
      setData(fetchedData);
      setLastSync(new Date().toISOString());
      
      setIsSummarizing(true);
      setChatHistory([]);
      const summary = await generateSummary(fetchedData, aiProviderRef.current, aiModelRef.current, keysRef.current);
      setChatHistory([{ role: 'assistant', content: summary }]);
      setIsSummarizing(false);
      isLoaded.current = true;
    } catch (error) {
      console.error("Failed to fetch space weather data:", error);
      setChatHistory([{ role: 'assistant', content: `[ ERROR: ${(error.message || 'TELEMETRY SYNC FAILED').toUpperCase()} ]` }]);
    } finally {
      setIsSummarizing(false);
      setLoading(false);
    }
  }, []); // Stable reference — uses refs for LLM settings

  // Dynamically regenerate summary when provider or model settings are updated
  const regenerateSummary = useCallback(async () => {
    if (!data.plasma.length && !data.kp.length) return;
    setIsSummarizing(true);
    setChatHistory([]);
    try {
      const summary = await generateSummary(data, aiProvider, aiModel, { geminiKey, openaiKey, anthropicKey });
      setChatHistory([{ role: 'assistant', content: summary }]);
    } catch (error) {
      console.error("Failed to regenerate summary:", error);
      setChatHistory([{ role: 'assistant', content: `[ ERROR: ${(error.message || 'SUMMARY GENERATION FAILED').toUpperCase()} ]` }]);
    } finally {
      setIsSummarizing(false);
    }
  }, [data, aiProvider, aiModel, geminiKey, openaiKey, anthropicKey]);

  // Handle follow-up messages
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isAiResponding) return;

    const userMessage = { role: 'user', content: text };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsAiResponding(true);

    try {
      const reply = await sendChatMessage(data, updatedHistory, aiProvider, aiModel, { geminiKey, openaiKey, anthropicKey });
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `[ ERROR: CONNECTION TO HELIOS-AI LOST. ${(error.message || 'UNKNOWN ERROR').toUpperCase()} ]` }
      ]);
    } finally {
      setIsAiResponding(false);
    }
  }, [chatHistory, data, aiProvider, aiModel, isAiResponding, geminiKey, openaiKey, anthropicKey]);

  // Initial load — only runs once
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // React to LLM Provider/Model changes (after initial telemetry load is done)
  useEffect(() => {
    if (isLoaded.current) {
      regenerateSummary();
    }
  }, [aiProvider, aiModel, regenerateSummary]);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 space-y-8">
      <Header 
        lastSync={lastSync} 
        loading={loading} 
        onSync={fetchData} 
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
        aiModel={aiModel}
        setAiModel={setAiModel}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        openaiKey={openaiKey}
        setOpenaiKey={setOpenaiKey}
        anthropicKey={anthropicKey}
        setAnthropicKey={setAnthropicKey}
        saveKeys={saveKeys}
        setSaveKeys={setSaveKeys}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-8">
        <HeroSection 
          kpData={data.kp} 
          forecast={data.forecast}
          chatHistory={chatHistory}
          isSummarizing={isSummarizing}
          isAiResponding={isAiResponding}
          onSendMessage={handleSendMessage}
          onOpenModal={setModalContent} 
        />
        <ModuleGrid data={data} onOpenModal={setModalContent} />
      </main>

      {modalContent && (
        <Modal content={modalContent} onClose={() => setModalContent(null)} />
      )}
    </div>
  );
}

export default App;
