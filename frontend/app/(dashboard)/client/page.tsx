"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Building,
  Filter,
  DollarSign,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface JobItem {
  id: string;
  title: string;
  category: string;
  status: string;
  pay: string;
  arrangement: string;
  type: string;
  experience: string;
  whatWeWant: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  applicantsCount: number;
  views: number;
  created: string;
}

const initialJobs: JobItem[] = [
  {
    id: "job-1",
    title: "Senior Brand Identity Designer",
    category: "Brand & Visual Identity",
    status: "Active",
    pay: "$95,000 - $120,000 / year",
    arrangement: "Remote",
    type: "Contract (6 Months)",
    experience: "Senior (5+ Years)",
    whatWeWant:
      "We need an experienced visual identity specialist to spearhead brand transformations for our luxury and technology clients. You will own the entire visual design process: from creative discovery, typography hierarchies, and bespoke icon systems to comprehensive brand guideline books.",
    responsibilities: [
      "Develop cohesive brand systems, color palettes, and typographic scales.",
      "Design master brand guideline manuals and digital design tokens.",
      "Direct creative discovery workshops with client founders.",
      "Deliver production-ready vector assets and design system libraries.",
    ],
    requirements: [
      "5+ years of demonstrable branding agency or senior freelance experience.",
      "Exceptional typography mastery and layout craftsmanship.",
      "Fluency in Figma, Adobe Illustrator, and InDesign.",
      "Strong storytelling ability to present creative rationale to stakeholders.",
    ],
    skills: ["Figma", "Brand Guidelines", "Typography", "Art Direction", "InDesign"],
    applicantsCount: 14,
    views: 380,
    created: "Oct 28, 2026",
  },
  {
    id: "job-2",
    title: "Lead 3D Motion Graphic Artist",
    category: "3D Art & Motion Design",
    status: "Active",
    pay: "$130,000 - $160,000 / year",
    arrangement: "Hybrid (New York)",
    type: "Full-Time",
    experience: "Lead (7+ Years)",
    whatWeWant:
      "Looking for a master 3D visualist to craft hero brand reveal animations, commercial 3D spots, and kinetic design systems. The ideal candidate blends high-end procedural simulations with impeccable art direction and dynamic camera work.",
    responsibilities: [
      "Create high-impact 3D animation sequences for product launches and campaigns.",
      "Build procedural simulations (cloth, fluid, lighting) in Houdini / Cinema 4D.",
      "Collaborate with sound designers and editors for final master delivery.",
      "Establish 3D motion standards for internal and client projects.",
    ],
    requirements: [
      "7+ years in high-end motion design, commercial animation, or VFX studios.",
      "High proficiency in Houdini, Cinema 4D, Redshift/Octane, and After Effects.",
      "A showreel demonstrating dynamic pacing, photorealistic lighting, and kinetic rhythm.",
    ],
    skills: ["Cinema 4D", "Houdini", "Octane", "After Effects", "Redshift"],
    applicantsCount: 9,
    views: 240,
    created: "Oct 29, 2026",
  },
];

const initialApplicants = [
  {
    id: "app-1",
    name: "Elena Rostova",
    headline: "Senior Visual Designer & Typographer",
    jobTitle: "Senior Brand Identity Designer",
    appliedDate: "Yesterday",
    status: "Shortlisted",
    rate: "$95/hr",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    portfolioUrl: "/creatives/cr-1",
  },
  {
    id: "app-2",
    name: "Marcus Vance",
    headline: "Houdini 3D Artist & Motion Director",
    jobTitle: "Lead 3D Motion Graphic Artist",
    appliedDate: "2 days ago",
    status: "Interview Scheduled",
    rate: "$120/hr",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    portfolioUrl: "/creatives/cr-2",
  },
];

export default function ClientDashboardPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "applicants" | "marketplace">("jobs");
  const [expandedJobId, setExpandedJobId] = useState<string | null>("job-1");
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);

  // Form states for new job
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCategory, setNewJobCategory] = useState("Brand & Visual Identity");
  const [newJobPay, setNewJobPay] = useState("$100,000 - $130,000 / year");
  const [newJobArrangement, setNewJobArrangement] = useState("Remote");
  const [newJobType, setNewJobType] = useState("Full-Time");
  const [newJobWhatWeWant, setNewJobWhatWeWant] = useState("");
  const [newJobRequirements, setNewJobRequirements] = useState("");
  const [newJobSkills, setNewJobSkills] = useState("Figma, Creative Direction");

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    const reqArray = newJobRequirements
      ? newJobRequirements.split("\n").filter((r) => r.trim().length > 0)
      : ["Proven creative experience in the discipline.", "Portfolio demonstrating mastery of craft."];

    const skillsArray = newJobSkills
      ? newJobSkills.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      : ["Design", "Creativity"];

    const createdJob: JobItem = {
      id: `job-${Date.now()}`,
      title: newJobTitle,
      category: newJobCategory,
      status: "Active",
      pay: newJobPay,
      arrangement: newJobArrangement,
      type: newJobType,
      experience: "Mid to Senior Level",
      whatWeWant:
        newJobWhatWeWant.trim() ||
        "Seeking an ambitious creative talent to deliver innovative visual solutions, collaborate closely with our core studio team, and elevate our client deliverables.",
      responsibilities: [
        "Lead conceptual design and creative execution.",
        "Produce high-fidelity deliverables and design specs.",
        "Maintain quality and alignment with brand vision.",
      ],
      requirements: reqArray,
      skills: skillsArray,
      applicantsCount: 0,
      views: 1,
      created: "Just now",
    };

    setJobs([createdJob, ...jobs]);
    setExpandedJobId(createdJob.id);
    setIsPostingModalOpen(false);

    // Reset inputs
    setNewJobTitle("");
    setNewJobWhatWeWant("");
    setNewJobRequirements("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Organisation Banner */}
          <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#E9DFFF] text-[#7957F5] flex items-center justify-center font-bold text-xl shadow-inner">
                SA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#171526]">
                    Studio Ardent
                  </h1>
                  <Badge variant="subtle" size="sm">
                    Verified Client
                  </Badge>
                </div>
                <p className="text-xs text-[#777386] mt-0.5">
                  Design & Creative Agency • London, UK • Enterprise Tier
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/jobs">
                <Button variant="outline" size="md" className="rounded-full">
                  <Search className="w-4 h-4 mr-1.5" /> Public Job Board
                </Button>
              </Link>
              <Button
                size="md"
                onClick={() => setIsPostingModalOpen(true)}
                className="rounded-full shadow-md bg-[#7957F5] hover:bg-[#6844E2]"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Post New Job
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Your Active Openings</p>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1">{jobs.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Total Received Applicants</p>
              <p className="text-2xl font-extrabold text-[#171526] mt-1">23</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Shortlisted Creatives</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">5</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Avg. Salary Disclosed</p>
              <p className="text-2xl font-extrabold text-[#171526] mt-1">100%</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-[#EEEAF5] mb-6 gap-2">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "jobs"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              💼 Manage Job Openings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("applicants")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "applicants"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              👥 Applicant Review ({initialApplicants.length})
            </button>
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "marketplace"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              🌐 Browse Marketplace Jobs
            </button>
          </div>

          {/* Tab 1: Manage Postings with Core Details */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              <div className="bg-[#E9DFFF]/30 border border-[#E9DFFF] rounded-2xl p-4 flex items-center justify-between text-xs text-[#171526]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7957F5]" />
                  <span>
                    Each job below highlights <strong>Exact Scope & Deliverables</strong>, <strong>Candidate Requirements</strong>, and <strong>Disclosed Compensation</strong>.
                  </span>
                </div>
                <span className="font-semibold text-[#7957F5]">Transparent Hiring Standard</span>
              </div>

              {jobs.map((j) => {
                const isExpanded = expandedJobId === j.id;

                return (
                  <div
                    key={j.id}
                    className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5]/40 transition-all overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEEAF5]/70 bg-gradient-to-r from-white via-white to-[#FCFAFF]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF] px-2.5 py-0.5 rounded-full">
                            {j.category}
                          </span>
                          <Badge variant="success" size="sm">
                            {j.status}
                          </Badge>
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-600" /> {j.pay}
                          </span>
                          <span className="text-xs text-[#777386] flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {j.arrangement}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-[#171526]">{j.title}</h3>
                        <p className="text-xs text-[#777386] mt-0.5">
                          Posted {j.created} • {j.views} views • {j.type}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF]/60 px-3 py-1.5 rounded-full">
                          {j.applicantsCount} Applicants
                        </span>
                        <Link href={`/jobs/${j.id}`}>
                          <Button size="sm" variant="outline" className="rounded-full">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Public Page
                          </Button>
                        </Link>
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : j.id)}
                          className="p-2 rounded-full border border-[#EEEAF5] hover:bg-[#FCFAFF] text-[#777386] transition-colors"
                          title="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#7957F5]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Core Details Expandable Drawer */}
                    {isExpanded && (
                      <div className="p-6 sm:p-8 space-y-6 bg-[#FCFAFF]/50 animate-fadeIn">
                        {/* 1. What Exactly We Want */}
                        <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                          <div className="flex items-center gap-2 mb-2 text-[#7957F5]">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526]">
                              1. Exactly What We Want (Scope & Deliverables)
                            </h4>
                          </div>
                          <p className="text-sm text-[#777386] leading-relaxed">
                            {j.whatWeWant}
                          </p>

                          {j.responsibilities && j.responsibilities.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#EEEAF5]">
                              <p className="text-xs font-bold text-[#171526] mb-2">Key Responsibilities:</p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#777386]">
                                {j.responsibilities.map((resp, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#7957F5] flex-shrink-0 mt-0.5" />
                                    <span>{resp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* 2. Requirements & Skills */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526] mb-3">
                              2. Candidate Requirements
                            </h4>
                            <ul className="space-y-2">
                              {j.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-[#777386]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#7957F5] mt-1.5 flex-shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526] mb-3">
                              3. Pay & Must-Have Skills
                            </h4>
                            <div className="mb-4">
                              <span className="text-xs text-[#777386] block">Verified Compensation:</span>
                              <span className="text-base font-extrabold text-emerald-700">
                                {j.pay}
                              </span>
                              <span className="text-[11px] text-[#777386] block mt-0.5">
                                Arrangement: {j.arrangement} • {j.type}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-[#171526] block mb-2">
                                Required Technical Tools:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {j.skills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2.5 py-1 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-semibold text-[#171526]"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Applicants Review */}
          {activeTab === "applicants" && (
            <div className="space-y-4">
              {initialApplicants.map((ap) => (
                <div
                  key={ap.id}
                  className="p-6 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={ap.avatar}
                      alt={ap.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#EEEAF5]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#171526]">{ap.name}</h3>
                        <Badge variant="subtle" size="sm">
                          Verified Creative
                        </Badge>
                      </div>
                      <p className="text-xs text-[#777386]">{ap.headline}</p>
                      <p className="text-xs text-[#7957F5] mt-1 font-semibold">
                        Applied for: {ap.jobTitle} • Rate: {ap.rate} ({ap.appliedDate})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ap.status}</Badge>
                    <Link href={ap.portfolioUrl}>
                      <Button size="sm" variant="outline" className="rounded-full">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Portfolio & Work
                      </Button>
                    </Link>
                    <Button size="sm" className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Marketplace Overview */}
          {activeTab === "marketplace" && (
            <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm text-center">
              <Sparkles className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#171526]">
                Explore All Creative Marketplace Roles
              </h3>
              <p className="text-xs text-[#777386] max-w-lg mx-auto mt-1 mb-6">
                Benchmark market rates, discover industry-standard requirements, and view active postings across 20+ creative disciplines.
              </p>
              <Link href="/jobs">
                <Button size="md" className="rounded-full bg-[#7957F5]">
                  Open Full Jobs Board ↗
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Post Job Modal with Exact What We Want, Requirements & Pay */}
        {isPostingModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-[#EEEAF5] my-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#7957F5]">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">New Opportunity</span>
                </div>
                <button
                  onClick={() => setIsPostingModalOpen(false)}
                  className="text-xs font-bold text-[#777386] hover:text-[#171526]"
                >
                  ✕ Close
                </button>
              </div>

              <h3 className="text-2xl font-extrabold text-[#171526] mb-1">
                Post Role with Core Details
              </h3>
              <p className="text-xs text-[#777386] mb-6">
                Specify exactly what you want, key requirements, and clear compensation for creative candidates.
              </p>

              <form onSubmit={handleCreateJob} className="space-y-4">
                {/* 1. Job Title */}
                <Input
                  label="Role Title"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Lead Brand Identity & Motion Director"
                />

                {/* 2. Discipline & Arrangement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Creative Discipline
                    </label>
                    <select
                      value={newJobCategory}
                      onChange={(e) => setNewJobCategory(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="Brand & Visual Identity">Brand & Visual Identity</option>
                      <option value="UI / UX & Product Design">UI / UX & Product Design</option>
                      <option value="3D Art & Motion Design">3D Art & Motion Design</option>
                      <option value="Film Production & Videography">Film Production & Videography</option>
                      <option value="Art Direction">Art Direction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Work Arrangement
                    </label>
                    <select
                      value={newJobArrangement}
                      onChange={(e) => setNewJobArrangement(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-Site">On-Site</option>
                    </select>
                  </div>
                </div>

                {/* 3. Compensation & Pay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Pay & Compensation (Disclosed)"
                    required
                    value={newJobPay}
                    onChange={(e) => setNewJobPay(e.target.value)}
                    placeholder="e.g. $100,000 - $130,000 / year or $95/hr"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={newJobType}
                      onChange={(e) => setNewJobType(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>

                {/* 4. What Exactly We Want */}
                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    What Exactly We Want (Overview & Scope)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newJobWhatWeWant}
                    onChange={(e) => setNewJobWhatWeWant(e.target.value)}
                    placeholder="Describe what exactly your team needs, project goals, and key deliverables..."
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] transition-colors"
                  />
                </div>

                {/* 5. Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Candidate Requirements (one per line)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newJobRequirements}
                    onChange={(e) => setNewJobRequirements(e.target.value)}
                    placeholder="5+ years experience in brand systems&#10;Stunning portfolio demonstrating typography&#10;Proficiency in Figma and Adobe Suite"
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] transition-colors"
                  />
                </div>

                {/* 6. Skills */}
                <Input
                  label="Required Skills / Software (comma separated)"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  placeholder="Figma, Cinema 4D, Typography, Octane"
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsPostingModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                  >
                    Publish Role With Core Details
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
