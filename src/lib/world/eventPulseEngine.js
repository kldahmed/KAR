/**
 * eventPulseEngine.js — Detects major events and creates visual pulse data.
 * Each pulse has coordinates, intensity, radius, and linked regions.
 */

const REGION_COORDS = {
  "الشرق الأوسط": { lat: 26, lng: 46, x: 62, y: 38 },
  "أوروبا": { lat: 50, lng: 15, x: 52, y: 22 },
  "آسيا": { lat: 35, lng: 100, x: 78, y: 30 },
  "أفريقيا": { lat: 5, lng: 22, x: 52, y: 52 },
  "أمريكا الشمالية": { lat: 40, lng: -100, x: 22, y: 28 },
  "أمريكا الجنوبية": { lat: -15, lng: -55, x: 30, y: 62 },
  "الأسواق العالمية": { lat: 40, lng: 0, x: 50, y: 30 },
};

const REGION_EN = {
  "الشرق الأوسط": "Middle East",
  "أوروبا": "Europe",
  "آسيا": "Asia-Pacific",
  "أفريقيا": "Africa",
  "أمريكا الشمالية": "North America",
  "أمريكا الجنوبية": "Latin America",
  "الأسواق العالمية": "Global Markets",
};

// Linked region pairs — events in one can create arcs to another
const LINKED_PAIRS = [
  { from: "الشرق الأوسط", to: "الأسواق العالمية", signals: ["energy_signal", "economic_pressure"] },
  { from: "الشرق الأوسط", to: "أوروبا", signals: ["conflict_escalation", "energy_signal"] },
  { from: "أوروبا", to: "الأسواق العالمية", signals: ["economic_pressure", "sanctions_pressure"] },
  { from: "آسيا", to: "الأسواق العالمية", signals: ["economic_pressure"] },
  { from: "أمريكا الشمالية", to: "الأسواق العالمية", signals: ["economic_pressure", "sanctions_pressure"] },
  { from: "أفريقيا", to: "أوروبا", signals: ["conflict_escalation", "political_transition"] },
];

/**
 * Generate pulses from events.
 * @param {Array} events - Global events array
 * @param {Array} storeItems - Intelligence store items
 * @returns {Object} { pulses, links, regionIntensity }
 */
export function generateEventPulses(events, storeItems = []) {
  if (!events || !events.length) return { pulses: [], links: [], regionIntensity: {} };

  // Compute region intensity
  const regionIntensity = {};
  Object.keys(REGION_COORDS).forEach(r => { regionIntensity[r] = { count: 0, severity: 0, signals: new Set() }; });

  events.forEach(e => {
    const region = e.region || mapCountryToRegion(e.country);
    if (region && regionIntensity[region]) {
      regionIntensity[region].count++;
      regionIntensity[region].severity += (e.severity || 0);
      (e.relatedSignals || []).forEach(s => regionIntensity[region].signals.add(s));
    }
  });

  // Generate pulses for top events
  const topEvents = [...events]
    .sort((a, b) => (b.severity || 0) - (a.severity || 0))
    .slice(0, 12);

  const pulses = topEvents.map(e => {
    const region = e.region || mapCountryToRegion(e.country);
    const coords = REGION_COORDS[region] || REGION_COORDS["الأسواق العالمية"];
    const intensity = Math.min(1, (e.severity || 30) / 80);

    return {
      id: e.id || e.title,
      title: e.title,
      region,
      regionEn: REGION_EN[region] || region,
      x: coords.x + (Math.random() - 0.5) * 4,
      y: coords.y + (Math.random() - 0.5) * 4,
      intensity,
      radius: 6 + intensity * 14,
      color: intensity >= 0.7 ? "#ef4444" : intensity >= 0.4 ? "#f59e0b" : "#38bdf8",
      severity: e.severity || 0,
      category: e.category,
      signals: e.relatedSignals || [],
    };
  });

  // Generate links between regions based on shared signals
  const links = [];
  const regionSignals = {};
  Object.entries(regionIntensity).forEach(([region, data]) => {
    regionSignals[region] = [...data.signals];
  });

  LINKED_PAIRS.forEach(pair => {
    const fromSigs = regionSignals[pair.from] || [];
    const toSigs = regionSignals[pair.to] || [];
    const shared = pair.signals.filter(s => fromSigs.includes(s) || toSigs.includes(s));
    if (shared.length > 0) {
      const fromCoords = REGION_COORDS[pair.from];
      const toCoords = REGION_COORDS[pair.to];
      links.push({
        from: pair.from,
        to: pair.to,
        fromX: fromCoords.x,
        fromY: fromCoords.y,
        toX: toCoords.x,
        toY: toCoords.y,
        signals: shared,
        strength: Math.min(1, shared.length * 0.4),
        color: shared.includes("conflict_escalation") ? "#ef4444"
          : shared.includes("energy_signal") ? "#fbbf24"
          : "#38bdf8",
      });
    }
  });

  // Normalize region intensity to 0-1
  const normalizedRegions = {};
  Object.entries(regionIntensity).forEach(([region, data]) => {
    const avgSev = data.count > 0 ? data.severity / data.count : 0;
    normalizedRegions[region] = {
      ...data,
      signals: [...data.signals],
      avgSeverity: avgSev,
      intensity: Math.min(1, (avgSev * 0.6 + data.count * 4) / 80),
      color: avgSev >= 60 ? "#ef4444" : avgSev >= 40 ? "#f59e0b" : avgSev >= 20 ? "#38bdf8" : "#22c55e",
    };
  });

  return { pulses, links, regionIntensity: normalizedRegions };
}

function mapCountryToRegion(country) {
  if (!country) return "الأسواق العالمية";
  const c = country.toLowerCase();
  if (/iran|iraq|israel|saudi|uae|qatar|yemen|syria|lebanon|jordan|bahrain|oman|kuwait|palestine|egypt/i.test(c))
    return "الشرق الأوسط";
  if (/uk|france|germany|italy|spain|ukraine|russia|poland|turkey|greece|sweden|norway/i.test(c))
    return "أوروبا";
  if (/china|japan|india|korea|pakistan|indonesia|australia|thailand|taiwan|philippines|vietnam/i.test(c))
    return "آسيا";
  if (/nigeria|south africa|ethiopia|kenya|morocco|algeria|libya|sudan|congo|tunisia|ghana/i.test(c))
    return "أفريقيا";
  if (/us|usa|united states|canada|mexico/i.test(c))
    return "أمريكا الشمالية";
  if (/brazil|argentina|chile|colombia|peru|venezuela/i.test(c))
    return "أمريكا الجنوبية";
  return "الأسواق العالمية";
}

export { REGION_COORDS, REGION_EN };
