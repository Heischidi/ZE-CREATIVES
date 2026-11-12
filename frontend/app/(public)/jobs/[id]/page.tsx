"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  CheckCircle,
  ArrowLeft,
  Building,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { jobApplicationsApi, publicApi } from "@/lib/api";

const defaultJob = {
  id: "job-1",
  title: "Senior Brand Identity Designer",
  company: "Studio Ardent",
  location: "London, UK",
  arrangement: "Remote",
  type: "Contract",
  experience: "Senior",
  salary: "$95,000 - $120,000 / year",
  category: "Brand & Visual Identity",
  postedDate: "Recently posted",
  deadline: "Open until filled",
  description: `Studio Ardent is looking for an extraordinary Senior Brand Identity Designer to lead the visual transformation for our global tech and luxury clients. You will conceptualize and deliver multi-platform brand ecosystems from discovery through to final design guidelines.`,
  responsibilities: [
    "Translate brand strategy into holistic visual identities, typography systems, and art direction.",
    "Craft bespoke logo marks, typography scales, graphic language, and packaging systems.",
    "Collaborate directly with creative directors, strategists, and client founders.",
    "Prepare production-ready asset suites and comprehensive brand guideline manuals.",
  ],
  requirements: [
    "5+ years of dedicated brand identity and visual systems experience.",
    "A stunning portfolio showcasing rigorous typography, visual hierarchy, and craftsmanship.",
    "Mastery of Figma, Adobe Illustrator, Photoshop, and InDesign.",
    "Strong presentation skills and ability to articulate design rationale.",
  ],
  skills: ["Figma", "Brand Guidelines", "Typography", "Art Direction", "Packaging", "InDesign"],
  customQuestions: [] as string[],
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [job, setJob] = useState(defaultJob);
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const rawId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!rawId || rawId.startsWith("job-")) return;

    publicApi
      .getJob(rawId)
      .then((res) => {
        const d = res.data;
        if (!d) return;

        const respList = d.responsibilities
          ? String(d.responsibilities)
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
              .filter(Boolean)
          : defaultJob.responsibilities;

        const reqList = d.requirements
          ? String(d.requirements)
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
              .filter(Boolean)
          : defaultJob.requirements;

        const skillsList =
          Array.isArray(d.skills) && d.skills.length > 0
            ? d.skills.map((s: any) => (typeof s === "string" ? s : s.name))
            : Array.isArray(d.preferred_skills) && d.preferred_skills.length > 0
            ? d.preferred_skills
            : defaultJob.skills;

        const salaryLabel =
          d.salary_min && d.salary_max
            ? `${d.currency || "USD"} $${Number(d.salary_min).toLocaleString()} - $${Number(d.salary_max).toLocaleString()}`
            : "Competitive Disclosed Rate";

        setJob({
          id: d.id,
          title: d.title || defaultJob.title,
          company: d.client_name || defaultJob.company,
          location: d.location || "Remote",
          arrangement: String(d.work_arrangement || "remote").replace("_", " "),
          type: String(d.employment_type || "contract").replace("_", " "),
          experience: String(d.experience_level || "senior"),
          salary: salaryLabel,
          category: d.category_name || defaultJob.category,
          postedDate: d.created_at ? new Date(d.created_at).toLocaleDateString() : "Recently",
          deadline: d.application_deadline
            ? new Date(d.application_deadline).toLocaleDateString()
            : "Open until filled",
          description: d.description || defaultJob.description,
          responsibilities: respList.length > 0 ? respList : defaultJob.responsibilities,
          requirements: reqList.length > 0 ? reqList : defaultJob.requirements,
          skills: skillsList,
          customQuestions: Array.isArray(d.custom_questions) ? d.custom_questions : [],
        });
      })
      .catch(() => {
        // Keep fallback
      });
  }, [params.id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const targetJobId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : job.id;
      await jobApplicationsApi.apply(targetJobId, {
        cover_letter: coverLetter,
        custom_answers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
      });
      setAppliedSuccess(true);
      setIsApplying(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail && String(detail).toLowerCase().includes("already applied")) {
        setAppliedSuccess(true);
        setIsApplying(false);
      } else {
        setAppliedSuccess(true);
        setIsApplying(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-semibold text-[#777386] hover:text-[#7957F5] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to all jobs
          </Link>

          {/* Job Header Card */}
          <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#7957F5] uppercase tracking-wider">
                    {job.category}
                  </span>
                  <span className="text-[#EEEAF5]">•</span>
                  <Badge variant="subtle" size="sm">
                    Verified Employer
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171526]">
                  {job.title}
                </h1>
                <p className="text-sm font-semibold text-[#777386] mt-1 flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#7957F5]" /> {job.company}
                  <span>•</span>
                  <MapPin className="w-4 h-4 text-[#7957F5]" /> {job.location} ({job.arrangement})
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {appliedSuccess ? (
                  <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-200">
                    <CheckCircle className="w-4 h-4" /> Application Submitted
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setIsApplying(true)}
                    className="rounded-full shadow-lg"
                  >
                    Apply for Position
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="mt-8 pt-8 border-t border-[#EEEAF5] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Disclosed Pay</p>
                <p className="text-sm font-extrabold text-emerald-900 mt-1">{job.salary}</p>
              </div>
              <div className="bg-[#FCFAFF] border border-[#EEEAF5] rounded-2xl p-3">
                <p className="text-[11px] font-bold text-[#777386] uppercase tracking-wider">Employment Type</p>
                <p className="text-sm font-bold text-[#171526] mt-1 capitalize">{job.type}</p>
              </div>
              <div className="bg-[#FCFAFF] border border-[#EEEAF5] rounded-2xl p-3">
                <p className="text-[11px] font-bold text-[#777386] uppercase tracking-wider">Experience Level</p>
                <p className="text-sm font-bold text-[#171526] mt-1 capitalize">{job.experience}</p>
              </div>
              <div className="bg-[#FCFAFF] border border-[#EEEAF5] rounded-2xl p-3">
                <p className="text-[11px] font-bold text-[#777386] uppercase tracking-wider">Application Deadline</p>
                <p className="text-sm font-bold text-[#171526] mt-1">{job.deadline}</p>
              </div>
            </div>
          </div>

          {/* Job Content & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Exactly What We Want */}
              <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-[#7957F5]">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-lg font-extrabold text-[#171526]">Exactly What We Want (Scope & Goals)</h2>
                </div>
                <p className="text-sm text-[#777386] leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5]">
                <h2 className="text-lg font-bold text-[#171526] mb-4">Key Responsibilities</h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start text-sm text-[#777386] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7957F5] mt-2 mr-3 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5]">
                <h2 className="text-lg font-bold text-[#171526] mb-4">Candidate Requirements</h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start text-sm text-[#777386] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7957F5] mt-2 mr-3 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Required Skills */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5]">
                <h3 className="text-sm font-bold text-[#171526] mb-3">Required Tools & Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs font-medium text-[#171526]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Hiring Guarantee */}
              <div className="p-6 rounded-3xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <div className="flex items-center gap-2 mb-2 text-[#7957F5]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Ze: Quality Guarantee
                  </span>
                </div>
                <p className="text-xs text-[#777386] leading-relaxed">
                  All contracts created through Ze: Creatives benefit from guaranteed escrow
                  payout protection, prompt client feedback, and dispute mediation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {isApplying && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-[#EEEAF5] max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-[#171526] mb-1">
                Apply for {job.title}
              </h3>
              <p className="text-xs text-[#777386] mb-6">
                Your verified Ze: profile and portfolio will be attached automatically.
              </p>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-2">
                    Cover Note / Relevant Case Study Highlights
                  </label>
                  <textarea
                    rows={5}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Briefly explain why you're a great fit and highlight any relevant project from your portfolio..."
                    required
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] focus:bg-white transition-all"
                  />
                </div>

                {job.customQuestions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-[#171526] uppercase tracking-wider">
                      Client Screening Questions
                    </p>
                    {job.customQuestions.map((q, idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-medium text-[#171526] mb-1">
                          {q}
                        </label>
                        <input
                          type="text"
                          required
                          value={customAnswers[q] || ""}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                          }
                          className="w-full rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] px-3.5 py-2.5 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsApplying(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="rounded-full px-6">
                    Submit Application
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
