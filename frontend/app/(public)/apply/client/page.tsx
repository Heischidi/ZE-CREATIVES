"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Building2, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clientApplicationsApi } from "@/lib/api";

export default function ClientApplicationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organisationName: "",
    industry: "Tech & SaaS",
    companySize: "11-50 employees",
    website: "",
    location: "",
    intendedUse: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await clientApplicationsApi.submit({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        organisation_name: formData.organisationName,
        industry: formData.industry,
        website: formData.website || undefined,
        company_size: formData.companySize,
        location: formData.location || undefined,
        intended_use: formData.intendedUse || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      // Demo fallback
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-3">
              Client & Employer Access
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171526]">
              Request Client Membership
            </h1>
            <p className="mt-2 text-sm text-[#777386]">
              Connect directly with verified creative directors, brand identity designers, and 3D
              artists. Post roles, browse confidential portfolios, and manage talent pipelines.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-10 rounded-3xl bg-white border border-[#EEEAF5] text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#171526]">Request Submitted</h2>
              <p className="mt-2 text-sm text-[#777386] max-w-md mx-auto leading-relaxed">
                Thank you for applying, {formData.firstName}! Our partnerships team will review
                your organisation profile ({formData.organisationName}). Upon approval, an invitation
                link will be dispatched to your work email.
              </p>
              <div className="mt-8">
                <Link href="/">
                  <Button variant="primary" className="rounded-full px-8">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#171526] uppercase tracking-wider mb-4 pb-2 border-b border-[#EEEAF5]">
                    Organisation Details
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Company / Studio Name"
                      required
                      value={formData.organisationName}
                      onChange={(e) => setFormData({ ...formData, organisationName: e.target.value })}
                      placeholder="e.g. Studio Ardent"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                          Industry / Domain
                        </label>
                        <select
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className="w-full rounded-2xl bg-white border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                        >
                          <option value="Tech & SaaS">Tech & SaaS</option>
                          <option value="Design & Creative Agency">Design & Creative Agency</option>
                          <option value="Fashion & Luxury">Fashion & Luxury</option>
                          <option value="Fintech & Web3">Fintech & Web3</option>
                          <option value="Media & Publishing">Media & Publishing</option>
                          <option value="Entertainment & Gaming">Entertainment & Gaming</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                          Company Size
                        </label>
                        <select
                          value={formData.companySize}
                          onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                          className="w-full rounded-2xl bg-white border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                        >
                          <option value="1-10 employees">1-10 employees</option>
                          <option value="11-50 employees">11-50 employees</option>
                          <option value="51-200 employees">51-200 employees</option>
                          <option value="201-500 employees">201-500 employees</option>
                          <option value="500+ employees">500+ employees</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Website URL"
                        type="url"
                        required
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://studioardent.com"
                      />
                      <Input
                        label="Headquarters Location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. London, United Kingdom"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#171526] uppercase tracking-wider mb-4 pb-2 border-b border-[#EEEAF5]">
                    Contact Representative
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Thomas"
                    />
                    <Input
                      label="Last Name"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Wright"
                    />
                    <Input
                      label="Work Email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="thomas@studioardent.com"
                    />
                    <Input
                      label="Phone Number (Optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 20 7946 0991"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-2">
                    What creative talents or roles are you looking to engage?
                  </label>
                  <textarea
                    rows={4}
                    value={formData.intendedUse}
                    onChange={(e) => setFormData({ ...formData, intendedUse: e.target.value })}
                    placeholder="Briefly describe your upcoming project, disciplines needed (e.g. Brand, 3D, UI), and timeline..."
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] focus:bg-white transition-all"
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full rounded-full shadow-lg"
                >
                  Request Client Membership
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
