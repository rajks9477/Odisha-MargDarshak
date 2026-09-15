"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  NER_STATES, 
  NER_DISTRICTS, 
  GOV_DEPARTMENTS, 
  ROLE_CONFIGS, 
  UserRole, 
  NERState 
} from "@/lib/constants";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { 
  UserPlus, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldAlert, 
  Clock, 
  Briefcase
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  // Multi-step progress (1: Basic Info, 2: Role Selection, 3: Gov/Field Metadata, 4: Result)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CITIZEN");

  // Gov & Field specific fields
  const [state, setState] = useState<NERState>("Assam");
  const [district, setDistrict] = useState<string>("Kamrup Metropolitan");
  const [department, setDepartment] = useState<string>(GOV_DEPARTMENTS[0]);
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");

  const isGovRole = ["FIELD_OFFICER", "DISTRICT_ADMIN", "CENTRAL_ADMIN"].includes(role);

  // When state changes, update available districts
  const handleStateChange = (newState: NERState) => {
    setState(newState);
    const availableDistricts = NER_DISTRICTS[newState] || [];
    if (availableDistricts.length > 0) {
      setDistrict(availableDistricts[0]);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setErrorMsg("Please fill out all required personal fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters with uppercase, lowercase, and numbers.");
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isGovRole) {
      setStep(3);
    } else {
      submitRegistration();
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeId.trim()) {
      setErrorMsg("Employee / Officer ID is required for official verification.");
      return;
    }
    if (!designation.trim()) {
      setErrorMsg("Designation is required for official verification.");
      return;
    }

    submitRegistration();
  };

  const submitRegistration = async () => {
    setLoading(true);
    setErrorMsg(null);

    const payload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirm_password: confirmPassword,
      role,
      state: state || undefined,
      district: district || undefined,
    };

    if (isGovRole) {
      payload.department = department;
      payload.employee_id = employeeId.trim();
      payload.designation = designation.trim();
    }

    try {
      const res = await register(payload);
      setRegistrationResult(res);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#FAF8F5] text-stone-900 font-sans">
      <div className="w-full max-w-xl space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-amber-700 p-0.5 shadow-sm">
            <div className="w-full h-full bg-[#FAF8F5] rounded-[14px] flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-emerald-800" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Create NER–MargDarshak Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Register for regional accessibility & logistics coordination
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-[#E8E2D8] rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? "bg-emerald-700 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              1
            </span>
            <span className="text-xs font-bold text-stone-700 hidden sm:inline">Basic Info</span>
          </div>

          <div className="h-0.5 w-8 sm:w-16 bg-[#E8E2D8]" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? "bg-emerald-700 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold text-stone-700 hidden sm:inline">Role Select</span>
          </div>

          <div className="h-0.5 w-8 sm:w-16 bg-[#E8E2D8]" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? "bg-emerald-700 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              3
            </span>
            <span className="text-xs font-bold text-stone-700 hidden sm:inline">Verification</span>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <h2 className="text-sm font-bold text-stone-900 border-b border-[#F0EAE1] pb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-700" /> Step 1: Personal & Login Credentials
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tenzing Norbu / Dr. Ananya Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.gov.in"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile (e.g. 9864012345)"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars (A-Z, a-z, 0-9)"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Role Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Role Selection */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" /> Step 2: Select Your Platform Role
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="space-y-2.5">
                {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((r) => {
                  const cfg = ROLE_CONFIGS[r];
                  const isSelected = role === r;
                  const isGov = ["FIELD_OFFICER", "DISTRICT_ADMIN", "CENTRAL_ADMIN"].includes(r);

                  return (
                    <div
                      key={r}
                      onClick={() => setRole(r)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-[#E9F5ED] border-emerald-700 ring-2 ring-emerald-700/20"
                          : "bg-[#FAF8F5] hover:bg-white border-[#E8E2D8]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={isSelected}
                        onChange={() => setRole(r)}
                        className="mt-1 accent-emerald-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-stone-900">{cfg.label}</span>
                          <RoleBadge role={r} size="sm" showDot={false} />
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{cfg.description}</p>
                        {isGov && (
                          <div className="mt-2 text-[10px] font-mono font-bold text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Requires Department / District Admin Approval
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGovRole ? (
                  <>
                    <span>Proceed to Department Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>{loading ? "Activating Account..." : "Complete Registration"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Government Verification Details */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" /> Step 3: Official Government Information
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F4EE] border border-[#E4D5C5] text-[#7F5539] text-xs leading-relaxed font-medium">
                <strong>Important Security Protocol:</strong> Official government accounts (Field Officers, District Admins, Central Admins) are provisioned in <code>PENDING_APPROVAL</code> state. Your department administrator will verify your Officer ID before granting active session access.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Department / Organisation</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                >
                  {GOV_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Assigned NER State</label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value as NERState)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                  >
                    {NER_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Assigned District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                  >
                    {(NER_DISTRICTS[state] || []).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Official Employee / Badge ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. AS-PWD-KM-9921"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">Official Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Executive Engineer / Zonal Inspector"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D8] focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-stone-900 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Submitting Official Application...</span>
                ) : (
                  <>
                    <span>Submit for Official Approval</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success & Outcome */}
          {step === 4 && registrationResult && (
            <div className="text-center py-4 space-y-4">
              {registrationResult.status === "ACTIVE" ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E9F5ED] text-emerald-800 mx-auto flex items-center justify-center border border-[#C2E2CC]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Account Created & Activated!</h3>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto">
                    Welcome, <strong>{name}</strong>! Your account has been activated with role <strong>{role}</strong>.
                  </p>
                  <button
                    onClick={() => router.push(ROLE_CONFIGS[role]?.dashboardPath || "/dashboard/citizen")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center border border-amber-200">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Application Submitted for Department Approval</h3>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Applicant:</span>
                      <span className="text-stone-900 font-bold">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Requested Role:</span>
                      <RoleBadge role={role} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Department:</span>
                      <span className="text-stone-900 font-semibold">{department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Jurisdiction:</span>
                      <span className="text-stone-900 font-semibold">{district}, {state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Current Status:</span>
                      <span className="text-amber-800 font-mono font-bold">PENDING_APPROVAL</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
                    Your account cannot authenticate until verified by a District Magistrate or Central Admin. You can test approving this account by logging in as the Central Admin demo account!
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Link
                      href="/login"
                      className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
                    >
                      Return to Login
                    </Link>
                    <Link
                      href="/"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                    >
                      Open Demo Hub
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer note */}
          {step < 4 && (
            <div className="mt-6 pt-5 border-t border-[#F0EAE1] text-center">
              <p className="text-xs text-stone-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
