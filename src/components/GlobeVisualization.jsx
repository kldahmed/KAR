import React, { useEffect, useRef, useState } from "react";

/**
 * GlobeVisualization — Interactive 3D globe with data points
 * Uses Canvas + custom 3D math (no heavy libraries needed)
 */
export default function GlobeVisualization({ worldState, language = "ar" }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ lat: 0, lon: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // Threat data points (latitude, longitude, intensity, type)
  const getThreatPoints = () => {
    const hotspots = [];
    const regions = worldState?.strategicSummary?.regionsWithHighestTension || [];
    const topEvents = worldState?.strategicSummary?.topGlobalEvents || [];

    // Region-based threat points
    const regionCoords = {
      "Middle East": [20, 45],
      "Ukraine": [49, 31],
      "Taiwan": [23.7, 120.9],
      "South China Sea": [12, 115],
      "Russia": [61, 105],
      "Iran": [32, 54],
      "North Korea": [40, 127],
      "Gaza": [31.9, 34.4],
      "Syria": [34.8, 38.8],
      "Yemen": [15.4, 48.5],
    };

    regions.forEach((region) => {
      if (regionCoords[region]) {
        const [lat, lon] = regionCoords[region];
        hotspots.push({ lat, lon, intensity: 0.8, type: "region", label: region });
      }
    });

    topEvents.forEach((event, idx) => {
      const region = event.region || event.country || "Global";
      if (regionCoords[region]) {
        const [lat, lon] = regionCoords[region];
        hotspots.push({ lat, lon, intensity: 0.9 + (idx * 0.05), type: "event", label: event.title });
      }
    });

    return hotspots.slice(0, 12);
  };

  // Convert lat/lon to 3D cartesian
  const latLonTo3D = (lat, lon, radius = 1) => {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    return {
      x: radius * Math.cos(latRad) * Math.cos(lonRad),
      y: radius * Math.sin(latRad),
      z: radius * Math.cos(latRad) * Math.sin(lonRad),
    };
  };

  // Apply rotation to 3D point
  const rotatePoint = (point, latRot, lonRot) => {
    let { x, y, z } = point;

    // Rotate around Y axis (longitude)
    const cosLon = Math.cos(lonRot);
    const sinLon = Math.sin(lonRot);
    [x, z] = [x * cosLon - z * sinLon, x * sinLon + z * cosLon];

    // Rotate around X axis (latitude)
    const cosLat = Math.cos(latRot);
    const sinLat = Math.sin(latRot);
    [y, z] = [y * cosLat - z * sinLat, y * sinLat + z * cosLat];

    return { x, y, z };
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.35;

    const threatPoints = getThreatPoints();
    const latRot = rotation.lat;
    const lonRot = rotation.lon;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw globe sphere (wireframe)
      ctx.strokeStyle = "rgba(103, 232, 249, 0.25)";
      ctx.lineWidth = 1;

      // Draw latitude lines
      for (let lat = -90; lat <= 90; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 10) {
          const p = rotatePoint(latLonTo3D(lat, lon, 1), latRot, lonRot);
          const screenX = centerX + p.x * radius;
          const screenY = centerY - p.y * radius;

          if (p.z > 0.1) {
            if (first) {
              ctx.moveTo(screenX, screenY);
              first = false;
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }
        }
        ctx.stroke();
      }

      // Draw longitude lines
      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 10) {
          const p = rotatePoint(latLonTo3D(lat, lon, 1), latRot, lonRot);
          const screenX = centerX + p.x * radius;
          const screenY = centerY - p.y * radius;

          if (p.z > 0.1) {
            if (first) {
              ctx.moveTo(screenX, screenY);
              first = false;
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }
        }
        ctx.stroke();
      }

      // Draw threat points
      threatPoints.forEach((point) => {
        const p3d = rotatePoint(latLonTo3D(point.lat, point.lon, 1), latRot, lonRot);

        // Only draw if visible (front hemisphere)
        if (p3d.z > 0.2) {
          const screenX = centerX + p3d.x * radius;
          const screenY = centerY - p3d.y * radius;

          // Glow effect
          const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 12);
          const color = point.type === "event" ? "#f87171" : "#fb923c";
          glow.addColorStop(0, color + "60");
          glow.addColorStop(1, color + "00");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
          ctx.fill();

          // Core dot
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 4 * point.intensity, 0, Math.PI * 2);
          ctx.fill();

          // Border
          ctx.strokeStyle = color + "80";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 4 * point.intensity, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw orbit equator
      ctx.strokeStyle = "rgba(167, 139, 250, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = rotatePoint(latLonTo3D(0, lon, 1), latRot, lonRot);
        const screenX = centerX + p.x * radius;
        const screenY = centerY - p.y * radius;
        if (lon === -180) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [rotation, worldState]);

  // Mouse/Touch handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      lat: prev.lat + dy * 0.01,
      lon: prev.lon + dx * 0.01,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setRotation((prev) => ({
      lat: prev.lat + dy * 0.01,
      lon: prev.lon + dx * 0.01,
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
