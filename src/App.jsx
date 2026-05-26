import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSpaceWeatherData } from './services/api';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ModuleGrid from './components/ModuleGrid';
import Modal from './components/Modal';
import { generateSummary } from './services/ai';

function App() {
  const [data, setData] = useState({ plasma: [], mag: [], xrays: [], kp: [], protons: [], f107: [] });
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState(null);

  // LLM Provider state management with localStorage persistence
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('helios_ai_provider') || 'ollama');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('helios_ai_model') || 'gemma4:e4b');

  // Track if initial telemetry load is complete
  const isLoaded = useRef(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('helios_ai_provider', aiProvider);
    localStorage.setItem('helios_ai_model', aiModel);
  }, [aiProvider, aiModel]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchSpaceWeatherData();
      setData(fetchedData);
      setLastSync(new Date().toISOString());
      
      setIsSummarizing(true);
      const summary = await generateSummary(fetchedData, aiProvider, aiModel);
      setAiSummary(summary);
      setIsSummarizing(false);
      isLoaded.current = true;
    } catch (error) {
      console.error("Failed to fetch space weather data:", error);
    } finally {
      setLoading(false);
    }
  }, [aiProvider, aiModel]);

  // Dynamically regenerate summary when provider or model settings are updated
  const regenerateSummary = useCallback(async () => {
    if (!data.plasma.length && !data.kp.length) return;
    setIsSummarizing(true);
    try {
      const summary = await generateSummary(data, aiProvider, aiModel);
      setAiSummary(summary);
    } catch (error) {
      console.error("Failed to regenerate summary:", error);
    } finally {
      setIsSummarizing(false);
    }
  }, [data, aiProvider, aiModel]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []); // Only on mount

  // React to LLM Provider/Model changes (after initial telemetry load is done)
  useEffect(() => {
    if (isLoaded.current) {
      regenerateSummary();
    }
  }, [aiProvider, aiModel]);

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
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-8">
        <HeroSection 
          kpData={data.kp} 
          aiSummary={aiSummary} 
          isSummarizing={isSummarizing}
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
