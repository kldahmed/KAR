const REGION_GROUPS = {
  "Middle East": "middle-east",
  Europe: "europe",
  "North America": "north-america",
  "Asia-Pacific": "asia-pacific",
  Africa: "africa",
  "Latin America": "latin-america",
  "Global Markets": "global-markets"
};

export const MODE_CONFIG = {
  live: { id: "live", label: "Live Signals" },
  pressure: { id: "pressure", label: "Regional Pressure" },
  clusters: { id: "clusters", label: "Event Clusters" },
  economic: { id: "economic", label: "Economic Stress" },
  sports: { id: "sports", label: "Sports Layer" },
  forecast: { id: "forecast", label: "Forecast Zones" },
  entities: { id: "entities", label: "Entity Relations" }
};

export function resolveRegionGroup(region) {
  if (!region) return "global-markets";
  return REGION_GROUPS[region] || region.toLowerCase().replace(/\s+/g, "-");
}

export function pressureToNumeric(level) {
  if (level === "high") return 0.9;
  if (level === "medium") return 0.6;
  return 0.3;
}

export function trendDirectionDelta(trendDirection) {
  if (trendDirection === "up") return 1;
  if (trendDirection === "down") return -1;
  return 0;
}

export function summarizeRegionPressure(countries) {
  const grouped = new Map();

  countries.forEach((country) => {
    const key = country.region || "Global Markets";
    const current = grouped.get(key) || {
      id: resolveRegionGroup(key),
      name: key,
      region: key,
      signalCount: 0,
      pressureScore: 0,
      confidence: 0,
      countries: [],
      trendScore: 0,
      lastUpdated: country.lastUpdated
    };

    current.signalCount += country.signalCount || 0;
    current.pressureScore += pressureToNumeric(country.pressureLevel) * (country.signalCount || 1);
    current.confidence += (country.confidence || 0.45) * (country.signalCount || 1);
    current.trendScore += trendDirectionDelta(country.trendDirection);
    current.lastUpdated =
      new Date(country.lastUpdated).getTime() > new Date(current.lastUpdated).getTime()
        ? country.lastUpdated
        : current.lastUpdated;
    current.countries.push(country.id);

    grouped.set(key, current);
  });

  return [...grouped.values()].map((group) => {
    const divisor = Math.max(1, group.signalCount);
    const pressure = group.pressureScore / divisor;
    return {
      ...group,
      pressureLevel: pressure > 0.72 ? "high" : pressure > 0.46 ? "medium" : "low",
      pressure,
      confidence: group.confidence / divisor,
      trendDirection: group.trendScore > 1 ? "up" : group.trendScore < -1 ? "down" : "stable"
    };
  });
}

export function buildExplainability(country, signals) {
  const matchedSignals = signals.filter((signal) => signal.country === country.id);
  const sourceCount = new Set(matchedSignals.map((signal) => signal.source)).size;
  const driverCounts = matchedSignals.reduce((acc, signal) => {
    acc[signal.category] = (acc[signal.category] || 0) + 1;
    return acc;
  }, {});
  const topDrivers = Object.entries(driverCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([driver, count]) => ({ driver, count }));

  const confidenceBand = country.confidence >= 0.72 ? "strong" : country.confidence >= 0.55 ? "medium" : "weak";

  return {
    whyGlowing: topDrivers.length
      ? `${topDrivers[0].driver} is the dominant pressure driver with ${topDrivers[0].count} linked signals.`
      : "Low activity baseline monitoring.",
    sourceCount,
    confidenceBand,
    topDrivers
  };
}
