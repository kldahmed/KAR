import React, { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./global-live-map.css";
import MapLegend from "./MapLegend";
import MapSignalLayer from "./MapSignalLayer";
import MapRegionOverlay from "./MapRegionOverlay";
import MapPlaybackBar from "./MapPlaybackBar";
import { getMotionSettings } from "../lib/map/mapAnimationEngine";
import { buildMapLayers, buildPlaybackFrame } from "../lib/map/mapSignalEngine";
import { MODE_CONFIG } from "../lib/map/mapRegionEngine";

const MAP_MODES = [
  MODE_CONFIG.live,
  MODE_CONFIG.pressure,
  MODE_CONFIG.clusters,
  MODE_CONFIG.economic,
  MODE_CONFIG.sports,
  MODE_CONFIG.forecast,
  MODE_CONFIG.entities
];

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

function getCountryId(feature) {
  return String(
    feature?.properties?.ISO_A2 ||
      feature?.properties?.iso_a2 ||
      feature?.properties?.ADM0_A3 ||
      feature?.properties?.NAME ||
      ""
  )
    .toLowerCase()
    .slice(0, 2);
}

function formatDubaiTime(value) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(value));
  } catch {
    return "n/a";
  }
}

export default function GlobalLiveMap() {
  const [mode, setMode] = useState("live");
  const [mapState, setMapState] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [range, setRange] = useState("30m");
  const [playing, setPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefersReducedMotion(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMapState() {
      try {
        const [stateRes, geoRes] = await Promise.all([
          fetch("/api/global-map-state"),
          geoData ? Promise.resolve(null) : fetch(WORLD_GEOJSON_URL)
        ]);

        const state = await stateRes.json();
        if (mounted) {
          setMapState(state);
          if (!selectedNodeId && state?.countries?.length) {
            setSelectedNodeId(state.countries[0].id);
          }
        }

        if (!geoData && geoRes?.ok) {
          const world = await geoRes.json();
          if (mounted) setGeoData(world);
        }
      } catch {
        if (mounted) setMapState((prev) => prev || { countries: [], links: [], signals: [], timeline: {} });
      }
    }

    loadMapState();
    const interval = setInterval(loadMapState, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [geoData, selectedNodeId]);

  const motionSettings = useMemo(() => getMotionSettings(prefersReducedMotion), [prefersReducedMotion]);

  const layers = useMemo(() => buildMapLayers(mapState, mode), [mapState, mode]);

  const frameSignals = useMemo(
    () => buildPlaybackFrame(mapState, range, frameIndex, 24),
    [mapState, range, frameIndex]
  );

  useEffect(() => {
    if (!playing) return undefined;
    const ticker = setInterval(() => {
      setFrameIndex((prev) => (prev >= 23 ? 0 : prev + 1));
    }, prefersReducedMotion ? 1400 : 700);
    return () => clearInterval(ticker);
  }, [playing, prefersReducedMotion]);

  const selectedNode = layers.countryNodes.find((node) => node.id === selectedNodeId) || null;

  const countryColorMap = useMemo(() => {
    const map = new Map();
    layers.countryNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [layers.countryNodes]);

  return (
    <section className="glm-shell section-frame">
      <div className="glm-header">
        <div>
          <h2>Global Pulse Live Map</h2>
          <p>
            Orbital intelligence view driven by live signals, regional pressure, linked events, and explainable AI layers.
          </p>
        </div>
        <div className="glm-mode-switch">
          {MAP_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={mode === m.id ? "glm-mode active" : "glm-mode"}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glm-map-wrap">
        <MapContainer center={[25, 18]} zoom={2} minZoom={2} maxZoom={6} zoomControl={false} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />

          {geoData && (
            <GeoJSON
              data={geoData}
              style={(feature) => {
                const id = getCountryId(feature);
                const node = countryColorMap.get(id);
                const color = node?.color || "#1e293b";
                const opacity = node ? 0.25 + node.intensity * motionSettings.glowStrength : 0.1;
                return {
                  color: "rgba(148,163,184,0.42)",
                  weight: node ? 0.8 : 0.4,
                  fillColor: color,
                  fillOpacity: Math.min(0.7, opacity)
                };
              }}
            />
          )}

          <MapRegionOverlay regions={layers.regionPressure} countryNodes={layers.countryNodes} />

          <MapSignalLayer
            countryNodes={layers.countryNodes}
            linkLayer={layers.linkLayer}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            motionSettings={motionSettings}
            dubaiTimeFormatter={formatDubaiTime}
          />
        </MapContainer>
      </div>

      <div className="glm-footer-grid">
        <MapLegend stats={layers.stats} />

        <div className="glm-explain glass-panel">
          <div className="glm-explain-title">Active Region Explainability</div>
          {selectedNode ? (
            <>
              <h4>{selectedNode.name}</h4>
              <p>{selectedNode.explainability?.whyGlowing}</p>
              <div className="glm-explain-grid">
                <span>Pressure: {selectedNode.pressureLevel}</span>
                <span>Signals: {selectedNode.signalCount}</span>
                <span>Confidence: {selectedNode.explainability?.confidenceBand}</span>
                <span>Updated: {formatDubaiTime(selectedNode.lastUpdated)}</span>
              </div>
              <ul>
                {(selectedNode.explainability?.topDrivers || []).map((driver) => (
                  <li key={driver.driver}>
                    {driver.driver}: {driver.count}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No active region selected.</p>
          )}
        </div>
      </div>

      <MapPlaybackBar
        range={range}
        setRange={setRange}
        playing={playing}
        setPlaying={setPlaying}
        frameIndex={frameIndex}
        frameCount={24}
        signalCount={frameSignals.length}
      />
    </section>
  );
}
