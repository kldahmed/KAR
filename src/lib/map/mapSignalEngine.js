import { buildExplainability, summarizeRegionPressure } from "./mapRegionEngine";
import { calcSignalRadius, pressureToVisualIntensity } from "./mapAnimationEngine";

export const PALETTE = {
  conflict: "#ef4444",
  economy: "#f59e0b",
  sports: "#a855f7",
  news: "#38bdf8",
  forecast: "#f3d38a",
  stable: "#22c55e",
  flow: "#22d3ee"
};

export function getCountryColor(country, mode = "live") {
  if (mode === "sports") return country.dominantCategory === "sports" ? PALETTE.sports : "#1e293b";
  if (mode === "economic") return country.dominantCategory === "economy" ? PALETTE.economy : "#1e293b";
  if (mode === "forecast") {
    if (country.trendDirection === "up") return PALETTE.forecast;
    if (country.trendDirection === "down") return PALETTE.stable;
    return "#334155";
  }

  if (country.pressureLevel === "high") return PALETTE.conflict;
  if (country.pressureLevel === "medium") return PALETTE.economy;
  return PALETTE.news;
}

export function buildMapLayers(mapState, mode = "live") {
  const countries = Array.isArray(mapState?.countries) ? mapState.countries : [];
  const links = Array.isArray(mapState?.links) ? mapState.links : [];
  const signals = Array.isArray(mapState?.signals) ? mapState.signals : [];

  const regionPressure = summarizeRegionPressure(countries);

  const countryNodes = countries.map((country) => {
    const explainability = buildExplainability(country, signals);
    return {
      ...country,
      radius: calcSignalRadius(country.signalCount, mode),
      color: getCountryColor(country, mode),
      intensity: pressureToVisualIntensity(country.pressureLevel, country.confidence),
      explainability
    };
  });

  const linkLayer = links
    .map((link) => {
      const sourceNode = countryNodes.find((node) => node.id === link.source);
      const targetNode = countryNodes.find((node) => node.id === link.target);
      if (!sourceNode || !targetNode) return null;
      return {
        ...link,
        sourceCoordinates: sourceNode.centerCoordinates,
        targetCoordinates: targetNode.centerCoordinates,
        color:
          link.categories.includes("economy")
            ? PALETTE.economy
            : link.categories.includes("sports")
            ? PALETTE.sports
            : PALETTE.flow
      };
    })
    .filter(Boolean);

  const denseRegions = regionPressure.filter((region) => region.signalCount >= 6);

  return {
    countryNodes,
    linkLayer,
    regionPressure,
    denseRegions,
    stats: {
      activeCountries: countryNodes.length,
      highPressureCountries: countryNodes.filter((node) => node.pressureLevel === "high").length,
      activeLinks: linkLayer.length
    }
  };
}

export function buildPlaybackFrame(mapState, rangeKey = "30m", frameIndex = 0, frameCount = 20) {
  const timeline = mapState?.timeline?.[rangeKey] || [];
  if (!timeline.length) return [];

  const sliceSize = Math.max(1, Math.ceil(timeline.length / frameCount));
  return timeline.slice(0, Math.min(timeline.length, (frameIndex + 1) * sliceSize));
}
