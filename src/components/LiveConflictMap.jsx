import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const REGIONS = [
  { name: "Middle East", lat: 31.5, lng: 35.5, status: "active", color: "#e74c3c" },
  { name: "Ukraine", lat: 49.0, lng: 32.0, status: "active", color: "#e74c3c" },
  { name: "Red Sea", lat: 18.0, lng: 40.0, status: "escalation", color: "#f39c12" },
  { name: "Taiwan Strait", lat: 24.0, lng: 121.0, status: "tension", color: "#f3d38a" }
];

const STATUS_LABELS = {
  active: "نزاع نشط",
  escalation: "تصعيد",
  tension: "توتر"
};
const STATUS_COLORS = {
  active: "#e74c3c",
  escalation: "#f39c12",
  tension: "#f3d38a"
};

export default function LiveConflictMap() {
  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px #0003", margin: "18px 0" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>خريطة النزاعات العالمية</div>
      <div style={{ height: "320px", borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
        <MapContainer center={[30, 40]} zoom={3} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {REGIONS.map((region, idx) => (
            <Marker key={idx} position={[region.lat, region.lng]}>
              <Popup>
                <div style={{ color: STATUS_COLORS[region.status], fontWeight: "700" }}>{region.name}</div>
                <div style={{ color: "#fff" }}>{STATUS_LABELS[region.status]}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div style={{ display: "flex", gap: "18px", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
        <span style={{ color: "#e74c3c" }}>● نزاع نشط</span>
        <span style={{ color: "#f39c12" }}>● تصعيد</span>
        <span style={{ color: "#f3d38a" }}>● توتر</span>
      </div>
    </div>
  );
}
