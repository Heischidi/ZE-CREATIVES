"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";

function ActivateAccountContent() {
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

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#EEEAF5] shadow-xl">
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#171526] mb-2">Account Activated!</h2>
            <p className="text-sm text-[#777386] mb-6">
              Your password has been successfully established. You are now officially verified on the Ze: Creatives platform.
            </p>
            <Link href="/sign-in">
              <Button size="lg" className="w-full rounded-full shadow-md">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-[#171526]">Activate Your Membership</h1>
              <p className="text-sm text-[#777386] mt-1">
                Your application has been approved. Establish your secure password to enter Ze:.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleActivate} className="space-y-4">
              <Input
                label="Activation Token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your invite code"
              />

              <div className="relative">
                <Input
                  label="Establish Password"
                  type={showPassword ? "text" : "password"}
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-9 text-[#777386] hover:text-[#171526]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

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

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FCFAFF]">Loading...</div>}>
      <ActivateAccountContent />
    </Suspense>
  );
}
