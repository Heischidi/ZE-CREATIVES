"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore, getDashboardRoute } from "@/store/auth";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getDashboardRoute(user.role));
      } else {
        router.push("/jobs");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        (err.request && !err.response
          ? "Cannot reach the API server. Check NEXT_PUBLIC_API_URL in Vercel and wait 30–60s if Render is waking up."
          : "Invalid credentials or account pending review.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillMock = (role: "admin" | "creative" | "client") => {
    if (role === "admin") {
      setEmail("admin@zecreatives.com");
      setPassword("AdminZe2026!");
    } else if (role === "creative") {
      setEmail("elena@zecreatives.com");
      setPassword("CreativeZe2026!");
    } else {
      setEmail("client@zecreatives.com");
      setPassword("ClientZe2026!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FCFAFF] px-4 py-12">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-extrabold text-[#171526]">
          Ze<span className="text-[#7957F5]">:</span> Creatives
        </span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#EEEAF5] shadow-[0_16px_40px_rgba(23,21,38,0.06)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#171526]">Welcome Back</h1>
          <p className="text-xs text-[#777386] mt-1.5">
            Access your curated creative network and collaborations
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            required
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
            <div className="flex justify-end mt-1.5">
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-[#7957F5] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full rounded-full shadow-md"
          >
            Sign In to Platform
          </Button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-8 pt-6 border-t border-[#EEEAF5]">
          <p className="text-[11px] font-bold text-[#777386] uppercase tracking-wider mb-2 text-center">
            Demo Credentials Helper
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fillMock("admin")}
              className="px-2.5 py-1 rounded-lg bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-medium text-[#171526] hover:border-[#7957F5]"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillMock("creative")}
              className="px-2.5 py-1 rounded-lg bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-medium text-[#171526] hover:border-[#7957F5]"
            >
              Creative Demo
            </button>
            <button
              type="button"
              onClick={() => fillMock("client")}
              className="px-2.5 py-1 rounded-lg bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-medium text-[#171526] hover:border-[#7957F5]"
            >
              Client Demo
            </button>
          </div>
        </div>

        {/* Invite notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#777386]">
            Don't have an account yet?{" "}
            <Link href="/apply/creative" className="font-semibold text-[#7957F5] hover:underline">
              Apply for membership
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
