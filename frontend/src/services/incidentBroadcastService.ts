"use client";

export interface GeoTaggedIncident {
  id: string;
  road_id: string;
  road_name: string;
  corridor_name: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  latitude: number;
  longitude: number;
  gps_accuracy: number;
  reporter_name: string;
  reporter_role: string;
  reporter_department: string;
  image_url?: string;
  image_name?: string;
  action_taken?: string;
  recommended_detour?: string;
  created_at: string;
  status: "VERIFIED" | "PENDING" | "RESOLVED";
}

const STORAGE_KEY = "ner_field_incidents_broadcast_v3";

// Initial realistic default field incidents with real-world mountain disaster photos
const DEFAULT_INCIDENTS: GeoTaggedIncident[] = [
  {
    id: "INC-NER-FIELD-01",
    road_id: "NH-6-SONAPUR-01",
    road_name: "NH-6 Sonapur Tunnel Mountain Pass",
    corridor_name: "NH-6 Guwahati-Shillong-Silchar Mountain Corridor",
    type: "LANDSLIDE",
    severity: "CRITICAL",
    description: "Major slope failure & 200m mudflow debris completely blocking both lanes near Sonapur Tunnel mouth KM-142.",
    latitude: 25.105,
    longitude: 92.361,
    gps_accuracy: 3.2,
    reporter_name: "Er. Tashi Norbu",
    reporter_role: "FIELD_OFFICER",
    reporter_department: "PWD Border Roads & Disaster Response",
    image_url: "/images/incidents/sonapur_landslide.jpg",
    image_name: "sonapur_mudslide_km142.jpg",
    action_taken: "2x PWD Heavy JCB Excavators & Dozers deployed on north face. Clearance ETA: 4.5 hrs.",
    recommended_detour: "Haflong-Umrangso All-Weather Green Bypass (Safe for all HCVs & Medical Reefers)",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: "VERIFIED",
  },
  {
    id: "INC-NER-FIELD-02",
    road_id: "NH-10-SEVOKE-01",
    road_name: "NH-10 Teesta Valley Lifeline (Siliguri - Gangtok)",
    corridor_name: "NH-10 Sikkim Mountain Corridor",
    type: "ROAD_DAMAGE",
    severity: "HIGH",
    description: "Teesta river embankment scouring at 29th Mile Likuvir. Single-lane alternating movement.",
    latitude: 27.170,
    longitude: 88.530,
    gps_accuracy: 4.1,
    reporter_name: "Er. Subhasish Das",
    reporter_role: "FIELD_OFFICER",
    reporter_department: "Sikkim State PWD Roads & Bridges",
    image_url: "/images/incidents/teesta_scour.jpg",
    image_name: "teesta_scour_29mile.jpg",
    action_taken: "Traffic police regulating convoy movement. Heavy freight diverted via Lava.",
    recommended_detour: "Lava-Algarah-Gorubathan Mountain Detour",
    created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    status: "VERIFIED",
  },
];

export const IncidentBroadcastService = {
  getIncidents(): GeoTaggedIncident[] {
    if (typeof window === "undefined") return DEFAULT_INCIDENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INCIDENTS));
      return DEFAULT_INCIDENTS;
    } catch {
      return DEFAULT_INCIDENTS;
    }
  },

  addIncident(incident: GeoTaggedIncident): GeoTaggedIncident[] {
    const current = this.getIncidents();
    const updated = [incident, ...current.filter((i) => i.id !== incident.id)];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Broadcast custom event for active tab components
        window.dispatchEvent(
          new CustomEvent("ner_incident_broadcast_event", {
            detail: { incident, allIncidents: updated },
          })
        );
      } catch (e) {
        console.error("Failed to save incident to localStorage", e);
      }
    }
    return updated;
  },

  getIncidentsForCorridor(corridorOrRoadName: string): GeoTaggedIncident[] {
    const all = this.getIncidents();
    if (!corridorOrRoadName) return [];
    const query = corridorOrRoadName.toLowerCase();
    return all.filter(
      (inc) =>
        inc.road_name.toLowerCase().includes(query) ||
        inc.corridor_name.toLowerCase().includes(query) ||
        inc.road_id.toLowerCase().includes(query) ||
        query.includes(inc.road_id.toLowerCase()) ||
        query.includes("nh-6") && inc.road_id.includes("NH-6") ||
        query.includes("nh-10") && inc.road_id.includes("NH-10") ||
        query.includes("nh-27") && inc.road_id.includes("NH-27") ||
        query.includes("nh-13") && inc.road_id.includes("NH-13") ||
        query.includes("nh-306") && inc.road_id.includes("NH-306") ||
        query.includes("nh-53") && inc.road_id.includes("NH-53")
    );
  },

  subscribe(callback: (incidents: GeoTaggedIncident[]) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = () => {
      callback(this.getIncidents());
    };
    window.addEventListener("ner_incident_broadcast_event", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ner_incident_broadcast_event", handler);
      window.removeEventListener("storage", handler);
    };
  },
};
