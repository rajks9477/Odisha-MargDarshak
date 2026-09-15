export type UserRole = "DRIVER" | "FIELD_OFFICER" | "DISTRICT_ADMIN" | "CENTRAL_ADMIN" | "CITIZEN";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  state?: string;
  district?: string;
  department?: string;
  employee_id?: string;
  designation?: string;
  verified_at?: string;
  created_at: string;
  permissions?: string[];
}

export interface FleetVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  capacity_tonnes: number;
  status: string;
  district?: string;
  state?: string;
  assigned_driver_id?: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  ip_address?: string;
  details?: string;
  created_at: string;
}
