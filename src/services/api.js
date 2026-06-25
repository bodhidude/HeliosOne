const BASE_URL = 'https://services.swpc.noaa.gov/products';

export async function fetchSpaceWeatherData() {
  const endpoints = {
    plasma: `${BASE_URL}/solar-wind/plasma-1-day.json`,
    mag: `${BASE_URL}/solar-wind/mag-1-day.json`,
    xrays: `https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json`,
    kp: `${BASE_URL}/noaa-planetary-k-index.json`,
    protons: `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json`,
    f107: `https://services.swpc.noaa.gov/products/summary/10cm-flux.json`,
    forecast: `https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`,
  };

  const results = await Promise.all(
    Object.values(endpoints).map(url => fetch(url).then(res => res.json()).catch(() => null))
  );

  const [plasmaData, magData, xraysData, kpData, protonsData, f107Data, forecastData] = results;

  return {
    plasma: normalizeData(plasmaData),
    mag: normalizeData(magData),
    xrays: normalizeData(xraysData),
    kp: normalizeData(kpData),
    protons: normalizeData(protonsData),
    f107: normalizeData(f107Data),
    forecast: normalizeData(forecastData),
  };
}

function normalizeData(data) {
  if (!data) return [];
  // Handle single-object responses (e.g. F10.7 summary endpoint)
  if (!Array.isArray(data)) return [data];
  if (!data.length) return [];
  if (Array.isArray(data[0])) {
    const keys = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      keys.forEach((k, i) => {
        obj[k] = row[i];
      });
      return obj;
    });
  }
  return data;
}
