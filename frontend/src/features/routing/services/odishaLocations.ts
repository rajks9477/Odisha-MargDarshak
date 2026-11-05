export interface OdishaLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  category: "CAPITAL" | "HUB" | "DISTRICT" | "PASS" | "CHECKPOINT" | "PORT";
}

// Backward-compatibility type alias
export type NERLocation = OdishaLocation;

export const ODISHA_LOCATIONS_DATABASE: OdishaLocation[] = [
  // State Capital & Major Hubs
  { id: "BBSR_KHO", name: "Bhubaneswar Central Logistics & Government Command", district: "Khordha", state: "Odisha", latitude: 20.296, longitude: 85.824, category: "CAPITAL" },
  { id: "CTC_CTC", name: "Cuttack Malgodown Commercial Wholesale Hub", district: "Cuttack", state: "Odisha", latitude: 20.463, longitude: 85.882, category: "HUB" },
  { id: "PURI_PUR", name: "Puri Coastal Relief & Logistics Depot", district: "Puri", state: "Odisha", latitude: 19.813, longitude: 85.831, category: "DISTRICT" },
  { id: "PRD_JAG", name: "Paradip Deepwater Port & Petrochemical Terminal", district: "Jagatsinghpur", state: "Odisha", latitude: 20.264, longitude: 86.671, category: "PORT" },
  { id: "DHM_BHD", name: "Dhamra All-Weather Port & LNG Terminal", district: "Bhadrak", state: "Odisha", latitude: 20.803, longitude: 86.974, category: "PORT" },
  { id: "GPL_GAN", name: "Gopalpur Commercial Port & Maritime Hub", district: "Ganjam", state: "Odisha", latitude: 19.268, longitude: 84.908, category: "PORT" },

  // Coastal Districts
  { id: "BAL_BAL", name: "Balasore Industrial Corridor & Port Depot", district: "Balasore", state: "Odisha", latitude: 21.494, longitude: 86.932, category: "HUB" },
  { id: "BHD_BHD", name: "Bhadrak Baitarani Flood Control Hub", district: "Bhadrak", state: "Odisha", latitude: 21.054, longitude: 86.495, category: "DISTRICT" },
  { id: "JAJ_JAJ", name: "Jajpur Road Industrial & Steel Logistics Hub", district: "Jajpur", state: "Odisha", latitude: 20.851, longitude: 86.138, category: "HUB" },
  { id: "KEN_KEN", name: "Kendrapara Coastal Delta Depot", district: "Kendrapara", state: "Odisha", latitude: 20.501, longitude: 86.423, category: "DISTRICT" },
  { id: "JAG_JAG", name: "Jagatsinghpur Civil Supply Base", district: "Jagatsinghpur", state: "Odisha", latitude: 20.268, longitude: 86.168, category: "DISTRICT" },
  { id: "BER_GAN", name: "Berhampur MKCG Southern Medical Logistics Hub", district: "Ganjam", state: "Odisha", latitude: 19.315, longitude: 84.794, category: "HUB" },

  // Northern & Mineral Corridor
  { id: "BRP_MAY", name: "Baripada Similipal Biosphere Depot", district: "Mayurbhanj", state: "Odisha", latitude: 21.934, longitude: 86.736, category: "DISTRICT" },
  { id: "KJR_KJR", name: "Kendujhar (Keonjhar) Mineral Freight Terminal", district: "Kendujhar", state: "Odisha", latitude: 21.629, longitude: 85.582, category: "DISTRICT" },
  { id: "RKL_SUN", name: "Rourkela Steel City Logistics & Rail Gateway", district: "Sundargarh", state: "Odisha", latitude: 22.260, longitude: 84.854, category: "HUB" },
  { id: "SUN_SUN", name: "Sundargarh Western Mining Depot", district: "Sundargarh", state: "Odisha", latitude: 22.122, longitude: 84.034, category: "DISTRICT" },
  { id: "JHG_JHG", name: "Jharsuguda Multi-Modal Logistics Park (MMLP)", district: "Jharsuguda", state: "Odisha", latitude: 21.855, longitude: 84.006, category: "HUB" },

  // Central Industrial & Agro Corridor
  { id: "ANG_ANG", name: "Angul Nalco Industrial Express Corridor", district: "Angul", state: "Odisha", latitude: 20.844, longitude: 85.101, category: "HUB" },
  { id: "DHN_DHN", name: "Dhenkanal Central Agriculture & Rice Hub", district: "Dhenkanal", state: "Odisha", latitude: 20.662, longitude: 85.596, category: "DISTRICT" },
  { id: "SBP_SBP", name: "Sambalpur VIMSAR Burla Western Command", district: "Sambalpur", state: "Odisha", latitude: 21.467, longitude: 83.978, category: "HUB" },
  { id: "BRG_BRG", name: "Bargarh Grain & Rice Bowl Transit Terminal", district: "Bargarh", state: "Odisha", latitude: 21.334, longitude: 83.623, category: "DISTRICT" },
  { id: "DEO_DEO", name: "Deogarh Forest Corridor Transit Base", district: "Deogarh", state: "Odisha", latitude: 21.536, longitude: 84.733, category: "DISTRICT" },

  // Western & Southern Tribal Belt
  { id: "BLG_BLG", name: "Balangir Western Agro Rail Freight Base", district: "Balangir", state: "Odisha", latitude: 20.711, longitude: 83.487, category: "DISTRICT" },
  { id: "SUB_SUB", name: "Subarnapur (Sonepur) Mahanadi Confluence Depot", district: "Subarnapur", state: "Odisha", latitude: 20.838, longitude: 83.916, category: "DISTRICT" },
  { id: "BOU_BOU", name: "Boudh Central River Basin Transit Hub", district: "Boudh", state: "Odisha", latitude: 20.840, longitude: 84.327, category: "DISTRICT" },
  { id: "NAY_NAY", name: "Nayagarh Sugar & Agri Corridor Terminal", district: "Nayagarh", state: "Odisha", latitude: 20.128, longitude: 85.106, category: "DISTRICT" },
  { id: "KDM_KDM", name: "Kandhamal (Phulbani) Highland Tribal Logistics", district: "Kandhamal", state: "Odisha", latitude: 20.479, longitude: 84.234, category: "DISTRICT" },
  { id: "KAL_KAL", name: "Kalahandi (Bhawanipatna) Southern Agro Hub", district: "Kalahandi", state: "Odisha", latitude: 19.907, longitude: 83.167, category: "DISTRICT" },
  { id: "NUP_NUP", name: "Nuapada Western Border Transit Gate", district: "Nuapada", state: "Odisha", latitude: 20.835, longitude: 82.528, category: "CHECKPOINT" },
  { id: "RAY_RAY", name: "Rayagada Paper & Bauxite Heavy Railhead", district: "Rayagada", state: "Odisha", latitude: 19.167, longitude: 83.417, category: "HUB" },
  { id: "GAJ_GAJ", name: "Gajapati (Paralakhemundi) Eastern Ghats Post", district: "Gajapati", state: "Odisha", latitude: 18.775, longitude: 84.091, category: "DISTRICT" },
  { id: "KOR_KOR", name: "Koraput SLN Medical & Coffee Hill Terminal", district: "Koraput", state: "Odisha", latitude: 18.814, longitude: 82.711, category: "DISTRICT" },
  { id: "JEY_KOR", name: "Jeypore Southern Aviation & Logistics Node", district: "Koraput", state: "Odisha", latitude: 18.858, longitude: 82.569, category: "HUB" },
  { id: "NAB_NAB", name: "Nabarangpur Forest Produce Distribution Center", district: "Nabarangpur", state: "Odisha", latitude: 19.231, longitude: 82.551, category: "DISTRICT" },
  { id: "MLK_MLK", name: "Malkangiri Swabhiman Anchal Remote Relief Base", district: "Malkangiri", state: "Odisha", latitude: 18.344, longitude: 81.895, category: "DISTRICT" },

  // Mountain Passes & Critical Ghat Checkpoints
  { id: "KAN_PASS", name: "Kanjipani Ghat Landslide Pass (NH-20)", district: "Kendujhar", state: "Odisha", latitude: 21.517, longitude: 85.503, category: "PASS" },
  { id: "KAL_PASS", name: "Kalinga Ghat Mountain Pass (SH-41)", district: "Kandhamal", state: "Odisha", latitude: 20.083, longitude: 84.533, category: "PASS" },
  { id: "AND_CHK", name: "Anandapur Baitarani Flood Monitoring Point", district: "Kendujhar", state: "Odisha", latitude: 21.217, longitude: 85.983, category: "CHECKPOINT" },
  { id: "HIR_CHK", name: "Hirakud Reservoir Dam Flood Gate Control", district: "Sambalpur", state: "Odisha", latitude: 21.528, longitude: 83.873, category: "CHECKPOINT" }
];

// Compatibility alias
export const NER_LOCATIONS_DATABASE = ODISHA_LOCATIONS_DATABASE;

export function searchOdishaLocations(query: string): OdishaLocation[] {
  if (!query || query.trim().length === 0) return ODISHA_LOCATIONS_DATABASE.slice(0, 10);
  const q = query.toLowerCase().trim();
  return ODISHA_LOCATIONS_DATABASE.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
  );
}

// Backward-compatible alias
export const searchNERLocations = searchOdishaLocations;

export function findOdishaLocationByName(name: string): OdishaLocation | undefined {
  if (!name) return undefined;
  const q = name.toLowerCase();
  return ODISHA_LOCATIONS_DATABASE.find(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      q.includes(loc.name.toLowerCase()) ||
      loc.district.toLowerCase().includes(q) ||
      loc.id.toLowerCase() === q
  );
}

// Backward-compatible alias
export const findNERLocationByName = findOdishaLocationByName;
