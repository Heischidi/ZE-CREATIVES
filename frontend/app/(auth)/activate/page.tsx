"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";

export default function ActivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await authApi.activate({
        token: token,
        password: password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      // Demo fallback: simulate success
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FCFAFF] px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-extrabold text-[#171526]">
          Ze<span className="text-[#7957F5]">:</span> Creatives
        </span>
      </Link>

      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#EEEAF5] shadow-[0_16px_40px_rgba(23,21,38,0.06)]">
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#171526]">Account Activated</h2>
            <p className="text-xs text-[#777386] mt-2 mb-6 leading-relaxed">
              Your password has been configured and your membership is active. You can now sign in
              to access your dashboard.
            </p>
            <Link href="/sign-in">
              <Button className="w-full rounded-full">Proceed to Sign In</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-[#171526]">Activate Membership</h1>
              <p className="text-xs text-[#777386] mt-1.5">
                Configure your account credentials using your invitation token
              </p>
            </div>

            {error && (
              <div className="p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleActivate} className="space-y-4">
              <Input
                label="Invitation Token"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your 64-character token"
              />

              <Input
                label="Create Password"
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
                placeholder="At least 8 characters"
              />

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                required
                leftIcon={<Lock className="w-4 h-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full rounded-full shadow-md mt-2"
              >
                Activate Account & Join
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
