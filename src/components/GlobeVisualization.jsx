import React, { useEffect, useMemo, useRef, useState } from "react";

const ENDPOINTS = [
  "/api/news",
  "/api/global-events",
  "/api/x-feed",
  "/api/radar",
  "/api/intelnews",
  "/api/agent-state",
];

const REGION_COORDS = {
  "middle east": [25, 45],
  "gulf": [25, 52],
  "uae": [24.45, 54.38],
  "dubai": [25.2, 55.27],
  "abu dhabi": [24.45, 54.38],
  "saudi": [24.0, 45.0],
  "iran": [32.0, 54.0],
  "iraq": [33.0, 44.0],
  "syria": [34.8, 38.8],
  "lebanon": [33.9, 35.8],
  "israel": [31.4, 35.1],
  "gaza": [31.5, 34.45],
  "yemen": [15.5, 48.5],
  "red sea": [21.0, 43.0],
  "hormuz": [26.6, 56.6],
  "ukraine": [49.0, 31.2],
  "russia": [55.7, 37.6],
  "europe": [50.0, 15.0],
  "china": [35.0, 105.0],
  "taiwan": [23.7, 120.9],
  "south china sea": [12.0, 115.0],
  "japan": [36.0, 138.0],
  "korea": [37.5, 127.0],
  "india": [20.0, 78.0],
  "pakistan": [30.0, 69.0],
  "afghanistan": [34.0, 67.0],
  "usa": [40.0, -95.0],
  "united states": [40.0, -95.0],
  "north america": [47.0, -100.0],
  "south america": [-15.0, -58.0],
  "africa": [0.0, 20.0],
  "asia": [30.0, 100.0],
  "global": [18.0, 20.0],
};

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function inferRiskLevel(record) {
  const joined = normalizeText(`${record.title || ""} ${record.summary || ""} ${record.category || ""} ${record.urgency || ""}`);
  if (record.urgency === "high" || /breaking|urgent|attack|strike|missile|drone|explosion|war|conflict|critical/.test(joined)) {
    return "high";
  }
  if (record.urgency === "medium" || /tension|escalat|sanction|military|alert|risk|emerging/.test(joined)) {
    return "medium";
  }
  return "low";
}

function riskToMarker(riskLevel) {
  if (riskLevel === "high") return { kind: "breaking", color: "#f43f5e" };
  if (riskLevel === "medium") return { kind: "tension", color: "#fb923c" };
  return { kind: "monitored", color: "#facc15" };
}

function eventKey(item) {
  const titleKey = normalizeText(item.title).split(" ").slice(0, 10).join(" ");
  const regionKey = normalizeText(item.region || "global");
  const hourBucket = Math.floor(new Date(item.timestamp || Date.now()).getTime() / (60 * 60 * 1000));
  return `${titleKey}|${regionKey}|${hourBucket}`;
}

function inferCoords(record) {
  if (Number.isFinite(record?.lat) && Number.isFinite(record?.lon)) {
    return [record.lat, record.lon];
  }
  if (Number.isFinite(record?.lat) && Number.isFinite(record?.lng)) {
    return [record.lat, record.lng];
  }
  if (Array.isArray(record?.centerCoordinates) && record.centerCoordinates.length >= 2) {
    return [Number(record.centerCoordinates[0]), Number(record.centerCoordinates[1])];
  }
  if (Array.isArray(record?.coords) && record.coords.length >= 2) {
    // global-events stores coords as [lon, lat]
    return [Number(record.coords[1]), Number(record.coords[0])];
  }

  const region = normalizeText(record?.region || record?.country || record?.location || "");
  if (region && REGION_COORDS[region]) return REGION_COORDS[region];

  const hay = normalizeText(`${record?.title || ""} ${record?.summary || ""} ${record?.text || ""} ${record?.region || ""}`);
  for (const [key, coords] of Object.entries(REGION_COORDS)) {
    if (hay.includes(key)) return coords;
  }
  return null;
}

function normalizeRecord(record, fallbackSource) {
  const title = String(record?.title || record?.headline || record?.text || record?.callsign || "").trim();
  if (!title) return null;

  const summary = String(record?.summary || record?.description || record?.explanation || record?.text || "").trim();
  const regionRaw = Array.isArray(record?.region) ? record.region[0] : record?.region;
  const region = String(regionRaw || record?.country || record?.location || "Global").trim();
  const source = String(record?.source || record?.sourceType || record?.authorName || fallbackSource || "unknown").trim();
  const timestamp = new Date(record?.timestamp || record?.time || record?.latestUpdate || record?.createdAt || Date.now()).toISOString();
  const coords = inferCoords({ ...record, summary, region });
  if (!coords) return null;

  const riskLevel = inferRiskLevel({ ...record, title, summary });
  const marker = riskToMarker(riskLevel);

  return {
    id: String(record?.id || `${fallbackSource}-${title.slice(0, 24)}-${timestamp}`),
    key: "",
    title,
    summary,
    region,
    source,
    timestamp,
    riskLevel,
    markerKind: marker.kind,
    color: marker.color,
    lat: Number(coords[0]),
    lon: Number(coords[1]),
    confidence: Number(record?.confidence || 0.7),
  };
}

async function fetchJson(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function flattenEndpointPayload(endpoint, payload) {
  if (!payload || typeof payload !== "object") return [];

  if (endpoint === "/api/news" || endpoint === "/api/intelnews") {
    return (Array.isArray(payload.news) ? payload.news : []).map((row) => normalizeRecord(row, endpoint));
  }

  if (endpoint === "/api/global-events") {
    return (Array.isArray(payload.events) ? payload.events : []).map((row) =>
      normalizeRecord(
        {
          ...row,
          source: Array.isArray(row.sources) && row.sources.length ? row.sources[0] : "global-events",
          urgency: row.eventType === "breaking_news" ? "high" : "medium",
        },
        "global-events"
      )
    );
  }

  if (endpoint === "/api/x-feed") {
    const rows = Array.isArray(payload.posts)
      ? payload.posts
      : Array.isArray(payload.signals)
      ? payload.signals
      : [];
    return rows.map((row) => normalizeRecord(row, "x-feed"));
  }

  if (endpoint === "/api/radar") {
    return (Array.isArray(payload.aircraft) ? payload.aircraft : []).map((row) =>
      normalizeRecord(
        {
          ...row,
          title: `Air Track ${row.callsign || "Unknown"}`,
          summary: `Altitude ${Math.round(Number(row.altitude || 0))} ft`,
          source: "radar",
          urgency: "low",
          region: Number(row.lng || row.lon || 0) >= 42 ? "Middle East" : "Europe",
          lat: Number(row.lat),
          lon: Number(row.lng || row.lon),
        },
        "radar"
      )
    );
  }

  if (endpoint === "/api/agent-state") {
    const memoryItems = payload?.memory?.items;
    const rows = Array.isArray(memoryItems) ? memoryItems.slice(-80) : [];
    return rows.map((row, idx) =>
      normalizeRecord(
        {
          id: row.id || `agent-${idx}`,
          title: row.title || row.text || "Agent Signal",
          summary: row.summary || row.text || "",
          source: row.source || "agent-state",
          urgency: row.urgency || "low",
          region: Array.isArray(row.region) && row.region.length ? row.region[0] : row.region,
          timestamp: row.timestamp,
          confidence: row.confidence,
        },
        "agent-state"
      )
    );
  }

  return [];
}

function dedupeEvents(items) {
  const bestByKey = new Map();
  items.filter(Boolean).forEach((item) => {
    const key = eventKey(item);
    const prev = bestByKey.get(key);
    const rank = item.riskLevel === "high" ? 3 : item.riskLevel === "medium" ? 2 : 1;
    const prevRank = prev ? (prev.riskLevel === "high" ? 3 : prev.riskLevel === "medium" ? 2 : 1) : 0;
    if (!prev) {
      bestByKey.set(key, { ...item, key, sources: [item.source] });
      return;
    }

    const latest = new Date(item.timestamp).getTime() > new Date(prev.timestamp).getTime() ? item.timestamp : prev.timestamp;
    const picked = rank > prevRank ? item : prev;
    bestByKey.set(key, {
      ...picked,
      key,
      timestamp: latest,
      sources: [...new Set([...(prev.sources || [prev.source]), item.source])],
      source: [...new Set([...(prev.sources || [prev.source]), item.source])].slice(0, 2).join(" + "),
    });
  });

  return [...bestByKey.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function latLonTo3D(lat, lon, radius = 1) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return {
    x: radius * Math.cos(latRad) * Math.cos(lonRad),
    y: radius * Math.sin(latRad),
    z: radius * Math.cos(latRad) * Math.sin(lonRad),
  };
}

function rotatePoint(point, latRot, lonRot) {
  let { x, y, z } = point;
  const cosLon = Math.cos(lonRot);
  const sinLon = Math.sin(lonRot);
  const xTemp = x * cosLon - z * sinLon;
  const zTemp = x * sinLon + z * cosLon;
  x = xTemp;
  z = zTemp;

  const cosLat = Math.cos(latRot);
  const sinLat = Math.sin(latRot);
  const yTemp = y * cosLat - z * sinLat;
  const zTemp2 = y * sinLat + z * cosLat;
  y = yTemp;
  z = zTemp2;
  return { x, y, z };
}

export default function GlobeVisualization({ worldState, feedStatus, language = "ar", mode = "advanced" }) {
  const canvasRef = useRef(null);
  const clickableRef = useRef([]);
  const animationRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const rotationRef = useRef({ lat: 0.25, lon: 0.4 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const markersRef = useRef([]);
  const seenIdsRef = useRef(new Set());
  const pulseMapRef = useRef(new Map());

  const [isDragging, setIsDragging] = useState(false);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);

  const maxMarkers = mode === "simplified" ? 60 : 140;

  const agentCoreEvents = useMemo(() => {
    const out = [];
    const strategicEvents = Array.isArray(worldState?.strategicSummary?.topGlobalEvents)
      ? worldState.strategicSummary.topGlobalEvents
      : [];

    strategicEvents.slice(0, 20).forEach((row, idx) => {
      const normalized = normalizeRecord(
        {
          id: `core-${idx}`,
          title: row.title,
          summary: row.summary,
          region: row.region || row.country,
          source: "agent-core",
          urgency: row.urgency,
          confidence: row.confidence,
          timestamp: row.time,
        },
        "agent-core"
      );
      if (normalized) out.push(normalized);
    });

    return out;
  }, [worldState]);

  useEffect(() => {
    markersRef.current = events;
  }, [events]);

  useEffect(() => {
    const now = Date.now();
    const currentIds = new Set(events.map((event) => event.id));

    events.forEach((event) => {
      if (!seenIdsRef.current.has(event.id)) {
        seenIdsRef.current.add(event.id);
        pulseMapRef.current.set(event.id, now);
      }
    });

    for (const eventId of seenIdsRef.current) {
      if (!currentIds.has(eventId)) {
        seenIdsRef.current.delete(eventId);
      }
    }

    for (const [id, startAt] of pulseMapRef.current.entries()) {
      if (now - startAt > 12000 || !currentIds.has(id)) {
        pulseMapRef.current.delete(id);
      }
    }
  }, [events]);

  useEffect(() => {
    let alive = true;

    const loadAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled(ENDPOINTS.map((endpoint) => fetchJson(endpoint).then((payload) => ({ endpoint, payload }))));
      if (!alive) return;

      const flattened = [];
      results.forEach((result) => {
        if (result.status !== "fulfilled" || !result.value?.payload) return;
        const normalized = flattenEndpointPayload(result.value.endpoint, result.value.payload);
        flattened.push(...normalized);
      });

      const merged = dedupeEvents([...flattened, ...agentCoreEvents]).slice(0, maxMarkers);
      setEvents(merged);
      setLastRefresh(Date.now());
      setLoading(false);

      const nextMs = 30000 + Math.floor(Math.random() * 30000);
      refreshTimerRef.current = setTimeout(loadAll, nextMs);
    };

    loadAll();

    return () => {
      alive = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [agentCoreEvents, maxMarkers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: 500, height: 500 };
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const globeRadius = Math.min(centerX, centerY) * 0.4;
      const rotation = rotationRef.current;
      const now = Date.now();

      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, globeRadius + 90);
      bgGrad.addColorStop(0, "rgba(30, 41, 59, 0.85)");
      bgGrad.addColorStop(0.55, "rgba(15, 23, 42, 0.95)");
      bgGrad.addColorStop(1, "rgba(2, 6, 23, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(100, 180, 220, 0.08)";
      ctx.lineWidth = 0.7;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 12) {
          const p = rotatePoint(latLonTo3D(lat, lon, 1), rotation.lat, rotation.lon);
          if (p.z > -0.35) {
            const sx = centerX + p.x * globeRadius;
            const sy = centerY - p.y * globeRadius;
            if (first) {
              ctx.moveTo(sx, sy);
              first = false;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
        }
        ctx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 12) {
          const p = rotatePoint(latLonTo3D(lat, lon, 1), rotation.lat, rotation.lon);
          if (p.z > -0.35) {
            const sx = centerX + p.x * globeRadius;
            const sy = centerY - p.y * globeRadius;
            if (first) {
              ctx.moveTo(sx, sy);
              first = false;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
        }
        ctx.stroke();
      }

      const clickable = [];
      const rows = markersRef.current;
      for (let i = 0; i < rows.length; i += 1) {
        const marker = rows[i];
        const p = rotatePoint(latLonTo3D(marker.lat, marker.lon, 1), rotation.lat, rotation.lon);
        if (p.z <= -0.42) continue;
        const sx = centerX + p.x * globeRadius;
        const sy = centerY - p.y * globeRadius;
        const zBoost = Math.max(0.25, (p.z + 1) / 2);
        const baseRadius = marker.riskLevel === "high" ? 4.8 : marker.riskLevel === "medium" ? 4.2 : 3.7;
        const radius = baseRadius + zBoost;

        if (marker.riskLevel === "high") {
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28 + zBoost * 8);
          halo.addColorStop(0, "rgba(244, 63, 94, 0.28)");
          halo.addColorStop(0.55, "rgba(244, 63, 94, 0.11)");
          halo.addColorStop(1, "rgba(244, 63, 94, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, 28 + zBoost * 8, 0, Math.PI * 2);
          ctx.fill();
        }

        const pulseStart = pulseMapRef.current.get(marker.id);
        if (pulseStart) {
          const age = now - pulseStart;
          if (age <= 12000) {
            const wave = Math.sin(age * 0.013) * 0.5 + 0.5;
            const pulseR = 9 + wave * 16;
            ctx.strokeStyle = marker.riskLevel === "high" ? "rgba(244, 63, 94, 0.25)" : "rgba(250, 204, 21, 0.2)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.fillStyle = marker.color;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(15, 23, 42, 0.65)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 0.6, 0, Math.PI * 2);
        ctx.stroke();

        clickable.push({ x: sx, y: sy, r: Math.max(8, radius + 4), marker, z: p.z });
      }

      clickableRef.current = clickable;

      const shine = ctx.createRadialGradient(
        centerX - globeRadius * 0.25,
        centerY - globeRadius * 0.28,
        0,
        centerX,
        centerY,
        globeRadius * 1.25
      );
      shine.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      shine.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handlePointerDown = (clientX, clientY) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    const current = rotationRef.current;
    const nextLon = current.lon + dx * 0.005;
    const nextLat = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, current.lat + dy * 0.005));
    rotationRef.current = { lat: nextLat, lon: nextLon };
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    let nearest = null;
    let nearestDist = Number.POSITIVE_INFINITY;
    const points = clickableRef.current;
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const dist = Math.hypot(point.x - x, point.y - y);
      if (dist <= point.r && dist < nearestDist) {
        nearest = point;
        nearestDist = dist;
      }
    }
    setSelected(nearest ? nearest.marker : null);
  };

  const counts = useMemo(() => {
    const breaking = events.filter((event) => event.markerKind === "breaking").length;
    const tension = events.filter((event) => event.markerKind === "tension").length;
    const monitored = events.filter((event) => event.markerKind === "monitored").length;
    return { breaking, tension, monitored };
  }, [events]);

  const healthySources = Number(feedStatus?.stats?.healthySources || feedStatus?.healthySources || 0);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        overflow: "hidden",
        borderRadius: "50%",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onClick={handleCanvasClick}
        onTouchStart={(e) => {
          if (e.touches.length !== 1) return;
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length !== 1) return;
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handlePointerUp}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          padding: "8px 10px",
          borderRadius: 10,
          background: "rgba(2, 6, 23, 0.6)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          color: "#cbd5e1",
          fontSize: 11,
          lineHeight: 1.45,
          backdropFilter: "blur(4px)",
        }}
      >
        <div>Live: {loading ? "syncing..." : "online"}</div>
        <div>Healthy sources: {healthySources}</div>
        <div>Markers: {events.length}</div>
        <div>Breaking {counts.breaking} | Tension {counts.tension} | Monitored {counts.monitored}</div>
        <div>Refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-GB") : "-"}</div>
      </div>

      {selected ? (
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            width: "min(280px, 72%)",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(2, 6, 23, 0.78)",
            border: "1px solid rgba(100, 180, 220, 0.35)",
            color: "#e2e8f0",
            fontSize: 12,
            lineHeight: 1.55,
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ color: selected.color, fontWeight: 800, marginBottom: 6 }}>{selected.title}</div>
          <div>Region: {selected.region || "Global"}</div>
          <div>Source: {selected.source || "unknown"}</div>
          <div>Timestamp: {new Date(selected.timestamp).toLocaleString(language === "ar" ? "ar-SA" : "en-GB")}</div>
          <div>Risk: {selected.riskLevel}</div>
        </div>
      ) : null}
    </div>
  );
}
