"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS, UserRole, ROLE_CONFIGS } from "@/lib/constants";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { 
  Compass, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Shield,
  Globe2,
  Building2,
  HardHat,
  Truck,
  Users,
  ShieldCheck,
  UserPlus
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"ROLE_MATRIX" | "CUSTOM_FORM">("ROLE_MATRIX");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  const handle1ClickLogin = async (demo: typeof DEMO_USERS[0]) => {
    setLoggingInRole(demo.role);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const loggedUser = await login(demo.email, demo.password);
      setSuccessMsg(`Welcome, ${loggedUser.name}! Entering ${loggedUser.role} workspace...`);
    } catch (err: any) {
      setErrorMsg(err.detail || "Authentication failed. Please check credentials.");
    } finally {
      setLoggingInRole(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg("Please enter your registered Email or Mobile number.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const loggedUser = await login(identifier.trim(), password);
      setSuccessMsg(`Authenticated as ${loggedUser.name} (${loggedUser.role})`);
    } catch (err: any) {
      setErrorMsg(err.detail || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CENTRAL_ADMIN":
        return <Globe2 className="w-5 h-5 text-rose-700" />;
      case "DISTRICT_ADMIN":
        return <Building2 className="w-5 h-5 text-blue-700" />;
      case "FIELD_OFFICER":
        return <HardHat className="w-5 h-5 text-amber-700" />;
      case "DRIVER":
        return <Truck className="w-5 h-5 text-emerald-800" />;
      default:
        return <Users className="w-5 h-5 text-teal-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-stone-900">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-stone-900">
              NER–MargDarshak
            </span>
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-stone-900">
            Role-Based Access &amp; Gateway Authentication
          </h2>
          <p className="text-xs text-stone-500">
            Select your authorized government or field persona to enter your active operational workspace
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Switcher Pills */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setAuthMode("ROLE_MATRIX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === "ROLE_MATRIX"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-stone-600 hover:text-stone-900 border border-stone-200"
            }`}
          >
            Role Selection (Fast 1-Click)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("CUSTOM_FORM")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === "CUSTOM_FORM"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-stone-600 hover:text-stone-900 border border-stone-200"
            }`}
          >
            Custom Email / Password Login
          </button>
        </div>

        {/* 1. ROLE-BASED ACCESS MATRIX (5 DISTINCT CARDS) */}
        {authMode === "ROLE_MATRIX" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_USERS.map((demo) => {
                const roleConf = ROLE_CONFIGS[demo.role as UserRole];
                const isLoggingIn = loggingInRole === demo.role;

                return (
                  <div
                    key={demo.role}
                    className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-emerald-700/60 hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center border border-stone-200">
                            {getRoleIcon(demo.role)}
                          </div>
                          <RoleBadge role={demo.role} size="sm" showDot={true} />
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded border border-stone-200 font-bold">
                          RBAC Verified
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-stone-900">{demo.title}</h3>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {demo.name} • <span className="text-stone-700">{demo.district || demo.state || "All NER"}</span>
                        </p>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {roleConf?.description}
                      </p>

                      <div className="space-y-1 text-[11px] font-mono text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <div className="truncate">
                          <span className="text-stone-400">ID: </span>
                          <span className="font-semibold text-stone-800">{demo.email}</span>
                        </div>
                        <div>
                          <span className="text-stone-400">PWD: </span>
                          <span className="text-emerald-900 font-bold">{demo.password}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handle1ClickLogin(demo)}
                      disabled={isLoggingIn}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-emerald-800 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span>{isLoggingIn ? "Authenticating..." : "1-Click Test Login"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. CUSTOM CREDENTIALS FORM */}
        {authMode === "CUSTOM_FORM" && (
          <div className="max-w-md mx-auto w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Official Email or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="officer@nermargdarshak.gov.in"
                    className="w-full px-3.5 py-2.5 pl-10 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white transition-colors font-mono"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 pl-10 pr-10 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white transition-colors font-mono"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Footer Link to Register */}
        <div className="text-center text-xs text-stone-500 pt-2">
          Don't have an official account yet?{" "}
          <Link href="/register" className="font-bold text-emerald-800 hover:underline">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
