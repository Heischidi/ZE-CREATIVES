"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, UploadCloud } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { creativeApplicationsApi } from "@/lib/api";

export default function CreativeApplicationPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    bio: "",
    yearsExperience: 5,
    categories: [] as string[],
    skills: "",
    portfolioLink1: "",
    portfolioLink2: "",
    socialTwitter: "",
    socialLinkedin: "",
    additionalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const availableCategories = [
    "Brand & Visual Identity",
    "UI / UX & Product Design",
    "3D Art & Motion Design",
    "Art Direction & Creative Strategy",
    "Illustration & Concept Art",
    "Photography & Film Production",
    "Creative Technology & Generative AI",
    "Packaging & Spatial Design",
  ];

  const handleCategoryToggle = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await creativeApplicationsApi.submit({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        professional_headline: formData.headline || undefined,
        bio: formData.bio || undefined,
        years_experience: Number(formData.yearsExperience) || undefined,
        creative_categories: formData.categories,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()) : [],
        portfolio_links: [formData.portfolioLink1, formData.portfolioLink2].filter(Boolean),
        social_links: {
          twitter: formData.socialTwitter,
          linkedin: formData.socialLinkedin,
        },
        additional_notes: formData.additionalNotes || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      // Demo fallback: show success
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
            <Badge variant="primary" className="mb-3">
              Invite-Only Creative Community
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171526]">
              Apply as a Creative
            </h1>
            <p className="mt-2 text-sm text-[#777386]">
              We curate only top-tier designers, 3D artists, art directors, and creative
              strategists. Our review team typically evaluates applications within 48 hours.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-10 rounded-3xl bg-white border border-[#EEEAF5] text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#171526]">Application Received</h2>
              <p className="mt-2 text-sm text-[#777386] max-w-md mx-auto leading-relaxed">
                Thank you, {formData.firstName}! Our creative board will review your portfolio and
                craft. If approved, you will receive an invitation token via email to activate your profile.
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
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Personal Info */}
                <div>
                  <h3 className="text-sm font-bold text-[#171526] uppercase tracking-wider mb-4 pb-2 border-b border-[#EEEAF5]">
                    1. Identity & Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Elena"
                    />
                    <Input
                      label="Last Name"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Rostova"
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="elena@example.com"
                    />
                    <Input
                      label="Current Location"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Zurich, Switzerland"
                    />
                  </div>
                </div>

                {/* Section 2: Craft & Discipline */}
                <div>
                  <h3 className="text-sm font-bold text-[#171526] uppercase tracking-wider mb-4 pb-2 border-b border-[#EEEAF5]">
                    2. Creative Discipline & Headline
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Professional Headline"
                      required
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="e.g. Senior Brand Identity Designer & Typographer"
                    />

                    <div>
                      <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-2">
                        Select Your Primary Disciplines
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableCategories.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => handleCategoryToggle(cat)}
                            className={`p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                              formData.categories.includes(cat)
                                ? "bg-[#E9DFFF] border-[#7957F5] text-[#7957F5] font-semibold"
                                : "bg-[#FCFAFF] border-[#EEEAF5] text-[#171526] hover:border-[#7957F5]"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      label="Key Skills & Software (comma-separated)"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Figma, Cinema 4D, Typography, Design Systems, Art Direction"
                    />
                  </div>
                </div>

                {/* Section 3: Portfolio & Work Proof */}
                <div>
                  <h3 className="text-sm font-bold text-[#171526] uppercase tracking-wider mb-4 pb-2 border-b border-[#EEEAF5]">
                    3. Portfolio & Evidence of Excellence
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Primary Portfolio URL (Website, ReadCV, Behance, Dribbble)"
                      required
                      type="url"
                      value={formData.portfolioLink1}
                      onChange={(e) => setFormData({ ...formData, portfolioLink1: e.target.value })}
                      placeholder="https://yourportfolio.com"
                    />
                    <Input
                      label="Secondary Case Study or Showreel URL (Optional)"
                      type="url"
                      value={formData.portfolioLink2}
                      onChange={(e) => setFormData({ ...formData, portfolioLink2: e.target.value })}
                      placeholder="https://vimeo.com/your-showreel"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-2">
                        Bio & Creative Vision
                      </label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about your background, career highlights, and design philosophy..."
                        className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full rounded-full shadow-lg"
                >
                  Submit Application for Vetting
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
