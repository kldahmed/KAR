import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod, withTimeout } from "./_api-utils.js";

function buildFallbackAircraft() {
	return [
		{ id: "fallback-1", lat: 25.2048, lng: 55.2708, callsign: "GULF-OPS-1", altitude: 32500 },
		{ id: "fallback-2", lat: 24.4539, lng: 54.3773, callsign: "UAE-AIR-2", altitude: 28750 },
		{ id: "fallback-3", lat: 21.4858, lng: 39.1925, callsign: "REDSEA-3", altitude: 30100 },
	];
}

export default async function handler(req, res) {
	applyApiHeaders(req, res, "GET, OPTIONS");
	if (handlePreflight(req, res)) return;
	if (rejectUnsupportedMethod(req, res, "GET")) return;

	const timeout = withTimeout(9000);

	try {
		const response = await fetch("https://opensky-network.org/api/states/all", {
			signal: timeout.signal,
			headers: { "User-Agent": "kar-radar/1.0", Accept: "application/json" }
		});

		if (!response.ok) {
			return res.status(200).json({ aircraft: buildFallbackAircraft(), fallback: true });
		}

		let data = null;
		try {
			data = await response.json();
		} catch {
			return res.status(200).json({ aircraft: buildFallbackAircraft(), fallback: true });
		}

		const aircraft = (Array.isArray(data?.states) ? data.states : [])
			.filter((state) => state && state[5] && state[6] && state[7] > 5000 && state[5] > 25 && state[5] < 65 && state[6] > 10 && state[6] < 40)
			.slice(0, 80)
			.map((state, index) => ({
				id: `opensky-${index}`,
				lat: state[6],
				lng: state[5],
				callsign: (state[1] || "").trim() || `TRACK-${index + 1}`,
				altitude: state[7]
			}));

		return res.status(200).json({
			aircraft: aircraft.length > 0 ? aircraft : buildFallbackAircraft(),
			fallback: aircraft.length === 0
		});
	} catch {
		return res.status(200).json({ aircraft: buildFallbackAircraft(), fallback: true });
	} finally {
		timeout.clear();
	}
}
