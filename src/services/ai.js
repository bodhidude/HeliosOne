function extractTelemetry(dashboardData) {
  const getLatest = (arr, key) => {
    if (!arr || !arr.length) return 'N/A';
    for (let i = arr.length - 1; i >= 0; i--) {
      const val = parseFloat(arr[i][key]);
      if (!isNaN(val)) return val;
    }
    return 'N/A';
  };

  const kp = getLatest(dashboardData.kp, 'Kp');
  const windSpeed = getLatest(dashboardData.plasma, 'speed');
  const bz = getLatest(dashboardData.mag, 'bz_gsm');
  
  const protonPoints = (dashboardData.protons || []).filter(d => d.energy === ">=10 MeV" && !isNaN(parseFloat(d.flux)));
  const protonFlux = getLatest(protonPoints, 'flux');
  
  const f107 = getLatest(dashboardData.f107 || [], 'flux');

  return {
    kp,
    windSpeed,
    bz,
    protonFlux,
    f107
  };
}

export async function generateSummary(dashboardData, provider = null, model = null) {
  const telemetry = extractTelemetry(dashboardData);

  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    return err.message || "HELIOS-AI ENCOUNTERED A TELEMETRY ERROR. SUMMARY UNAVAILABLE.";
  }
}

export async function sendChatMessage(dashboardData, messages, provider = null, model = null) {
  const telemetry = extractTelemetry(dashboardData);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
