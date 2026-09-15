export interface NERLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  category: "CAPITAL" | "HUB" | "DISTRICT" | "PASS" | "CHECKPOINT";
}

export const NER_LOCATIONS_DATABASE: NERLocation[] = [
  // Assam
  { id: "GW_AS", name: "Guwahati Central Logistic Terminal", district: "Kamrup Metropolitan", state: "Assam", latitude: 26.185, longitude: 91.745, category: "CAPITAL" },
  { id: "SIL_AS", name: "Silchar Food & Medical Depot", district: "Cachar", state: "Assam", latitude: 24.833, longitude: 92.779, category: "HUB" },
  { id: "DIB_AS", name: "Dibrugarh Valley Depot", district: "Dibrugarh", state: "Assam", latitude: 27.472, longitude: 94.912, category: "DISTRICT" },
  { id: "JOR_AS", name: "Jorhat Tea & Supply Transit", district: "Jorhat", state: "Assam", latitude: 26.750, longitude: 94.216, category: "DISTRICT" },
  { id: "TEZ_AS", name: "Tezpur Military Gateway", district: "Sonitpur", state: "Assam", latitude: 26.652, longitude: 92.793, category: "HUB" },
  { id: "NAG_AS", name: "Nagaon Central Crossing", district: "Nagaon", state: "Assam", latitude: 26.345, longitude: 92.684, category: "DISTRICT" },
  { id: "HAF_AS", name: "Haflong Hill Depot", district: "Dima Hasao", state: "Assam", latitude: 25.176, longitude: 93.018, category: "DISTRICT" },
  { id: "TIN_AS", name: "Tinsukia Commercial Railhead", district: "Tinsukia", state: "Assam", latitude: 27.492, longitude: 95.358, category: "DISTRICT" },
  { id: "BON_AS", name: "Bongaigaon Refinery Junction", district: "Bongaigaon", state: "Assam", latitude: 26.502, longitude: 90.558, category: "DISTRICT" },
  { id: "DPR_AS", name: "Dhubri Riverport Depot", district: "Dhubri", state: "Assam", latitude: 26.020, longitude: 89.980, category: "DISTRICT" },
  { id: "KMP_AS", name: "Kamrup Rural Transit Hub", district: "Kamrup", state: "Assam", latitude: 26.312, longitude: 91.597, category: "DISTRICT" },
  { id: "LUM_AS", name: "Lumding Railway Junction", district: "Hojai", state: "Assam", latitude: 25.750, longitude: 93.180, category: "HUB" },
  { id: "UMR_AS", name: "Umrangso Hydro Ridge", district: "Dima Hasao", state: "Assam", latitude: 25.510, longitude: 92.740, category: "PASS" },

  // Meghalaya
  { id: "SHL_ML", name: "Shillong Capital Depot", district: "East Khasi Hills", state: "Meghalaya", latitude: 25.578, longitude: 91.893, category: "CAPITAL" },
  { id: "JOW_ML", name: "Jowai Coal & Grain Depot", district: "West Jaintia Hills", state: "Meghalaya", latitude: 25.446, longitude: 92.203, category: "DISTRICT" },
  { id: "TUR_ML", name: "Tura Hills Terminal", district: "West Garo Hills", state: "Meghalaya", latitude: 25.514, longitude: 90.220, category: "DISTRICT" },
  { id: "NGR_ML", name: "Nongpoh Transit Stop", district: "Ri Bhoi", state: "Meghalaya", latitude: 25.903, longitude: 91.881, category: "CHECKPOINT" },
  { id: "SON_ML", name: "Sonapur Landslide Pass", district: "East Jaintia Hills", state: "Meghalaya", latitude: 25.105, longitude: 92.361, category: "PASS" },
  { id: "LUM_ML", name: "Lumshnong Mineral Ridge", district: "East Jaintia Hills", state: "Meghalaya", latitude: 24.950, longitude: 92.650, category: "PASS" },
  { id: "CHE_ML", name: "Sohra (Cherrapunji) Station", district: "East Khasi Hills", state: "Meghalaya", latitude: 25.270, longitude: 91.730, category: "DISTRICT" },

  // Mizoram
  { id: "AIZ_MZ", name: "Aizawl Central Granary Depot", district: "Aizawl", state: "Mizoram", latitude: 23.730, longitude: 92.717, category: "CAPITAL" },
  { id: "KOL_MZ", name: "Kolasib Mountain Gate", district: "Kolasib", state: "Mizoram", latitude: 24.225, longitude: 92.678, category: "DISTRICT" },
  { id: "VAI_MZ", name: "Vairengte Inter-State Checkpost", district: "Kolasib", state: "Mizoram", latitude: 24.505, longitude: 92.756, category: "CHECKPOINT" },
  { id: "LUN_MZ", name: "Lunglei Southern Hub", district: "Lunglei", state: "Mizoram", latitude: 22.880, longitude: 92.740, category: "DISTRICT" },
  { id: "CHA_MZ", name: "Champhai Border Depot", district: "Champhai", state: "Mizoram", latitude: 23.475, longitude: 93.328, category: "DISTRICT" },
  { id: "SER_MZ", name: "Serchhip Hill Depot", district: "Serchhip", state: "Mizoram", latitude: 23.340, longitude: 92.850, category: "DISTRICT" },

  // Arunachal Pradesh
  { id: "ITA_AR", name: "Itanagar Capital Complex", district: "Papum Pare", state: "Arunachal Pradesh", latitude: 27.084, longitude: 93.605, category: "CAPITAL" },
  { id: "TAW_AR", name: "Tawang High Altitude Army Depot", district: "Tawang", state: "Arunachal Pradesh", latitude: 27.586, longitude: 91.866, category: "DISTRICT" },
  { id: "BOM_AR", name: "Bomdila Pass Station", district: "West Kameng", state: "Arunachal Pradesh", latitude: 27.264, longitude: 92.416, category: "DISTRICT" },
  { id: "PAS_AR", name: "Pasighat Siang River Hub", district: "East Siang", state: "Arunachal Pradesh", latitude: 28.066, longitude: 95.326, category: "DISTRICT" },
  { id: "ZIR_AR", name: "Ziro Valley Depot", district: "Lower Subansiri", state: "Arunachal Pradesh", latitude: 27.550, longitude: 93.830, category: "DISTRICT" },
  { id: "ALO_AR", name: "Aalo (Along) Central Hub", district: "West Siang", state: "Arunachal Pradesh", latitude: 28.170, longitude: 94.800, category: "DISTRICT" },
  { id: "SEL_AR", name: "Sela Pass High-Altitude Tunnel", district: "West Kameng", state: "Arunachal Pradesh", latitude: 27.502, longitude: 92.103, category: "PASS" },

  // Nagaland
  { id: "KOH_NL", name: "Kohima Mountain Ridge Depot", district: "Kohima", state: "Nagaland", latitude: 25.675, longitude: 94.108, category: "CAPITAL" },
  { id: "DIM_NL", name: "Dimapur Commercial Freight Railhead", district: "Dimapur", state: "Nagaland", latitude: 25.906, longitude: 93.727, category: "HUB" },
  { id: "MOK_NL", name: "Mokokchung Central Transit", district: "Mokokchung", state: "Nagaland", latitude: 26.326, longitude: 94.524, category: "DISTRICT" },
  { id: "WOK_NL", name: "Wokha Agricultural Depot", district: "Wokha", state: "Nagaland", latitude: 26.098, longitude: 94.260, category: "DISTRICT" },
  { id: "MON_NL", name: "Mon Hill Border Hub", district: "Mon", state: "Nagaland", latitude: 26.740, longitude: 95.050, category: "DISTRICT" },
  { id: "TUE_NL", name: "Tuensang Eastern Ridge", district: "Tuensang", state: "Nagaland", latitude: 26.280, longitude: 94.830, category: "DISTRICT" },

  // Manipur
  { id: "IMP_MN", name: "Imphal Valley Central Logistics Hub", district: "Imphal West", state: "Manipur", latitude: 24.817, longitude: 93.936, category: "CAPITAL" },
  { id: "CHU_MN", name: "Churachandpur Southern Depot", district: "Churachandpur", state: "Manipur", latitude: 24.333, longitude: 93.680, category: "DISTRICT" },
  { id: "SEN_MN", name: "Senapati Highway Checkpost", district: "Senapati", state: "Manipur", latitude: 25.260, longitude: 94.020, category: "CHECKPOINT" },
  { id: "UKH_MN", name: "Ukhrul Hill Station", district: "Ukhrul", state: "Manipur", latitude: 25.110, longitude: 94.360, category: "DISTRICT" },
  { id: "JIR_MN", name: "Jiribam Railhead & Gate", district: "Jiribam", state: "Manipur", latitude: 24.800, longitude: 93.120, category: "HUB" },

  // Tripura
  { id: "AGT_TR", name: "Agartala Supply & Food Terminal", district: "West Tripura", state: "Tripura", latitude: 23.831, longitude: 91.286, category: "CAPITAL" },
  { id: "UDA_TR", name: "Udaipur Gomati Hub", district: "Gomati", state: "Tripura", latitude: 23.533, longitude: 91.480, category: "DISTRICT" },
  { id: "DHA_TR", name: "Dharmanagar Northern Rail Depot", district: "North Tripura", state: "Tripura", latitude: 24.370, longitude: 92.160, category: "HUB" },
  { id: "AMB_TR", name: "Ambassa Central Depot", district: "Dhalai", state: "Tripura", latitude: 23.920, longitude: 91.850, category: "DISTRICT" },

  // Sikkim
  { id: "GAN_SK", name: "Gangtok Transit Logistics Depot", district: "Gangtok", state: "Sikkim", latitude: 27.338, longitude: 88.606, category: "CAPITAL" },
  { id: "NAM_SK", name: "Namchi Southern Depot", district: "Namchi", state: "Sikkim", latitude: 27.166, longitude: 88.350, category: "DISTRICT" },
  { id: "MAN_SK", name: "Mangan Northern Gateway", district: "Mangan", state: "Sikkim", latitude: 27.500, longitude: 88.530, category: "PASS" },
  { id: "GYA_SK", name: "Gyalshing Western Station", district: "Gyalshing", state: "Sikkim", latitude: 27.280, longitude: 88.250, category: "DISTRICT" },
  { id: "RNG_SK", name: "Rangpo Border Checkpost", district: "Pakyong", state: "Sikkim", latitude: 27.170, longitude: 88.530, category: "CHECKPOINT" }
];

export function searchNERLocations(query: string): NERLocation[] {
  if (!query || query.trim().length === 0) return NER_LOCATIONS_DATABASE.slice(0, 10);
  const q = query.toLowerCase().trim();
  return NER_LOCATIONS_DATABASE.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
  );
}

export function findNERLocationByName(name: string): NERLocation | undefined {
  if (!name) return undefined;
  const q = name.toLowerCase();
  return NER_LOCATIONS_DATABASE.find(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      q.includes(loc.name.toLowerCase()) ||
      loc.district.toLowerCase().includes(q) ||
      q.includes(loc.district.toLowerCase())
  );
}
