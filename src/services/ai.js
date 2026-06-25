import { getLatest } from './utils';

function extractTelemetry(dashboardData) {
  const kp = getLatest(dashboardData.kp, 'Kp');
  const windSpeed = getLatest(dashboardData.plasma, 'speed');
  const bz = getLatest(dashboardData.mag, 'bz_gsm');
  
  const protonPoints = (dashboardData.protons || []).filter(d => d.energy === ">=10 MeV" && !isNaN(parseFloat(d.flux)));
  const protonFlux = getLatest(protonPoints, 'flux');
  
  const f107 = getLatest(dashboardData.f107 || [], 'flux');

  return {
    kp: kp ?? 'N/A',
    windSpeed: windSpeed ?? 'N/A',
    bz: bz ?? 'N/A',
    protonFlux: protonFlux ?? 'N/A',
    f107: f107 ?? 'N/A'
  };
}

export async function generateSummary(dashboardData, provider = null, model = null, keys = {}) {
  const telemetry = extractTelemetry(dashboardData);

  const headers = {
    'Content-Type': 'application/json',
  };
  if (keys.geminiKey) headers['X-Gemini-Key'] = keys.geminiKey;
  if (keys.openaiKey) headers['X-OpenAI-Key'] = keys.openaiKey;
  if (keys.anthropicKey) headers['X-Anthropic-Key'] = keys.anthropicKey;

  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telemetry,
        provider,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    const json = await response.json();
    return json.summary;
  } catch (err) {
    console.error("AI Summary Generation Failed:", err);
    throw err;
  }
}

export async function sendChatMessage(dashboardData, messages, provider = null, model = null, keys = {}) {
  const telemetry = extractTelemetry(dashboardData);

  const headers = {
    'Content-Type': 'application/json',
  };
  if (keys.geminiKey) headers['X-Gemini-Key'] = keys.geminiKey;
  if (keys.openaiKey) headers['X-OpenAI-Key'] = keys.openaiKey;
  if (keys.anthropicKey) headers['X-Anthropic-Key'] = keys.anthropicKey;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telemetry,
        messages,
        provider,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    const json = await response.json();
    return json.message;
  } catch (err) {
    console.error("AI Chat Failed:", err);
    throw err;
  }
}

export async function fetchAiStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error("Status API offline");
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch AI status:", err);
    return null;
  }
}
