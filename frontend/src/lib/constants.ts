export const ODISHA_DISTRICTS = [
  "Angul",
  "Balangir",
  "Balasore",
  "Bargarh",
  "Bhadrak",
  "Boudh",
  "Cuttack",
  "Deogarh",
  "Dhenkanal",
  "Gajapati",
  "Ganjam",
  "Jagatsinghpur",
  "Jajpur",
  "Jharsuguda",
  "Kalahandi",
  "Kandhamal",
  "Kendrapara",
  "Kendujhar",
  "Khordha",
  "Koraput",
  "Malkangiri",
  "Mayurbhanj",
  "Nabarangpur",
  "Nayagarh",
  "Nuapada",
  "Puri",
  "Rayagada",
  "Sambalpur",
  "Subarnapur",
  "Sundargarh"
] as const;

export type OdishaDistrict = typeof ODISHA_DISTRICTS[number];

export const ODISHA_STATES = [
  "Odisha"
] as const;

export const ODISHA_DISTRICTS_MAP: Record<string, string[]> = {
  "Odisha": [...ODISHA_DISTRICTS]
};

// Backward-compatibility aliases for existing imports
export const NER_STATES = [
  "Odisha"
] as const;

export type NERState = "Odisha";

export const NER_DISTRICTS: Record<string, string[]> = {
  "Odisha": [...ODISHA_DISTRICTS]
};

export const GOV_DEPARTMENTS = [
  "Works Department (Roads & Bridges, Odisha)",
  "Odisha State Disaster Management Authority (OSDMA / DDMA)",
  "Odisha Disaster Rapid Action Force (ODRAF)",
  "National Highways Authority of India (NHAI RO Odisha)",
  "Department of Food Supplies & Consumer Welfare (Odisha)",
  "Health & Family Welfare Department (Odisha)",
  "Commerce & Transport Department (Odisha)",
  "Odisha State Police / Highway Traffic Cell",
  "Fire & Emergency Services (Odisha)"
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
    description: "Public road accessibility status, incident & blockage reporting, weather disruption alerts across Odisha.",
    defaultStatus: "ACTIVE",
    dashboardPath: "/dashboard/citizen"
  },
  DRIVER: {
    role: "DRIVER",
    label: "Commercial / Supply Driver",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Essential commodity transport, assigned corridor navigation, delay reporting & emergency diversions.",
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
    label: "State Command Center / OSDMA",
    badgeColor: "bg-stone-100 text-stone-900 border-stone-300 font-semibold",
    description: "Odisha state-wide intelligence, regional connectivity analytics, cross-district user management & audit logs.",
    defaultStatus: "PENDING_APPROVAL",
    dashboardPath: "/dashboard/central-admin"
  }
};

export const DEMO_USERS = [
  {
    role: "CENTRAL_ADMIN" as UserRole,
    title: "Central Admin (State Command)",
    name: "Shri Asit Tripathy",
    email: "admin@odishamargdarshak.gov.in",
    password: "Admin@Odisha2026",
    badge: "OSDMA / State Admin",
    state: "Odisha",
    district: "Khordha"
  },
  {
    role: "DRIVER" as UserRole,
    title: "Driver (Essential Carrier)",
    name: "Biren Behera",
    email: "driver.biren@odishamargdarshak.in",
    password: "Driver@Pass123",
    badge: "Heavy Commercial Operator",
    state: "Odisha",
    district: "Cuttack"
  },
  {
    role: "FIELD_OFFICER" as UserRole,
    title: "Field Officer (Bhadrak / Baitarani)",
    name: "Er. Soumya Ranjan Nayak",
    email: "officer.bhadrak@odishamargdarshak.gov.in",
    password: "Officer@Bhadrak2026",
    badge: "Works Dept Executive Engineer",
    state: "Odisha",
    district: "Bhadrak"
  },
  {
    role: "CITIZEN" as UserRole,
    title: "Citizen (Bhubaneswar, Khordha)",
    name: "Rashmita Sahoo",
    email: "citizen.bhubaneswar@odishamargdarshak.in",
    password: "Citizen@Pass123",
    badge: "Resident Commuter",
    state: "Odisha",
    district: "Khordha"
  },
  {
    role: "DISTRICT_ADMIN" as UserRole,
    title: "District Admin (Balasore DDMA)",
    name: "Dr. Priyadarshi Mohapatra",
    email: "district.balasore@odishamargdarshak.gov.in",
    password: "Admin@Balasore2026",
    badge: "DDMA Nodal Officer",
    state: "Odisha",
    district: "Balasore"
  }
];
