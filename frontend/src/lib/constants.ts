export const NER_STATES = [
  "Arunachal Pradesh",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura"
] as const;

export type NERState = typeof NER_STATES[number];

export const NER_DISTRICTS: Record<NERState, string[]> = {
  "Arunachal Pradesh": [
    "Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", 
    "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", 
    "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", 
    "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding", "Kamle", "Pakke Kessang", "Shi Yomi", "Leparada", "Itanagar Capital Complex"
  ],
  "Assam": [
    "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", 
    "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", 
    "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", 
    "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", 
    "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", 
    "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong", "Bajali", "Tamulpur"
  ],
  "Manipur": [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", 
    "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", 
    "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
  ],
  "Meghalaya": [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", 
    "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", 
    "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
  ],
  "Mizoram": [
    "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", 
    "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha"
  ],
  "Nagaland": [
    "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", 
    "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha", "Zünheboto"
  ],
  "Sikkim": [
    "Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", 
    "Unakoti", "West Tripura"
  ]
};

export const GOV_DEPARTMENTS = [
  "Public Works Department (PWD Roads & Bridges)",
  "State Disaster Management Authority (SDMA / DDMA)",
  "Border Roads Organisation (BRO)",
  "Department of Food, Civil Supplies & Consumer Affairs",
  "Department of Health & Family Welfare",
  "Department of Transport & Logistics",
  "National Highways & Infrastructure Development Corp (NHIDCL)",
  "State Disaster Response Force (SDRF)",
  "State Police / Traffic Coordination Cell"
];

export type UserRole = "CITIZEN" | "DRIVER" | "FIELD_OFFICER" | "DISTRICT_ADMIN" | "CENTRAL_ADMIN";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  defaultStatus: UserStatus;
  dashboardPath: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  CITIZEN: {
    role: "CITIZEN",
    label: "Citizen / Commuter",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Public road accessibility status, incident & blockage reporting, weather disruption alerts.",
    defaultStatus: "ACTIVE",
    dashboardPath: "/dashboard/citizen"
  },
  DRIVER: {
    role: "DRIVER",
    label: "Commercial / Supply Driver",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Essential commodity transport, assigned route navigation, delay reporting & emergency diversions.",
    defaultStatus: "ACTIVE",
    dashboardPath: "/dashboard/driver"
  },
  FIELD_OFFICER: {
    role: "FIELD_OFFICER",
    label: "Field Official / Engineer",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    description: "Geo-tagged ground incident verification, road & bridge clearance updates, checkpoint telemetry.",
    defaultStatus: "PENDING_APPROVAL",
    dashboardPath: "/dashboard/officer"
  },
  DISTRICT_ADMIN: {
    role: "DISTRICT_ADMIN",
    label: "District Administrator / DDMA",
    badgeColor: "bg-indigo-50 text-indigo-900 border-indigo-200",
    description: "District logistics command, officer approval & clearance, emergency diversion routes authorization.",
    defaultStatus: "PENDING_APPROVAL",
    dashboardPath: "/dashboard/district-admin"
  },
  CENTRAL_ADMIN: {
    role: "CENTRAL_ADMIN",
    label: "NER Central Command / MDoNER",
    badgeColor: "bg-stone-100 text-stone-900 border-stone-300 font-semibold",
    description: "NER-wide intelligence, regional connectivity analytics, cross-state user management & audit logs.",
    defaultStatus: "PENDING_APPROVAL",
    dashboardPath: "/dashboard/central-admin"
  }
};

export const DEMO_USERS = [
  {
    role: "CENTRAL_ADMIN" as UserRole,
    title: "Central Admin (NER Command)",
    name: "Shri Rajesh Sharma",
    email: "admin@nermargdarshak.gov.in",
    password: "Admin@NER2026",
    badge: "MDoNER / NER Director",
    state: "Assam",
    district: "Kamrup Metropolitan"
  },
  {
    role: "DRIVER" as UserRole,
    title: "Driver (Essential Carrier)",
    name: "Biren Gogoi",
    email: "driver.biren@nermargdarshak.in",
    password: "Driver@Pass123",
    badge: "Heavy Commercial Operator",
    state: "Assam",
    district: "Dibrugarh"
  },
  {
    role: "FIELD_OFFICER" as UserRole,
    title: "Field Officer (Tawang, Arunachal)",
    name: "Er. Tashi Norbu",
    email: "officer.tawang@nermargdarshak.gov.in",
    password: "Officer@Tawang2026",
    badge: "PWD Executive Engineer",
    state: "Arunachal Pradesh",
    district: "Tawang"
  },
  {
    role: "CITIZEN" as UserRole,
    title: "Citizen (Gangtok, Sikkim)",
    name: "Rinzin Doma",
    email: "citizen.gangtok@nermargdarshak.in",
    password: "Citizen@Pass123",
    badge: "Resident Commuter",
    state: "Sikkim",
    district: "Gangtok"
  },
  {
    role: "DISTRICT_ADMIN" as UserRole,
    title: "District Admin (Kamrup Metro)",
    name: "Dr. Ananya Baruah",
    email: "district.kamrup@nermargdarshak.gov.in",
    password: "Admin@Kamrup2026",
    badge: "DDMA Nodal Officer",
    state: "Assam",
    district: "Kamrup Metropolitan"
  }
];
