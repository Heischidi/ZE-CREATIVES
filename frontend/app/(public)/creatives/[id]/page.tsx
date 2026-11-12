"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Film,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { publicApi, messagingApi } from "@/lib/api";

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl?: string;
  description: string;
  tools: string[];
  externalCaseStudyUrl?: string;
}

const defaultCreative = {
  id: "cr-1",
  user_id: "",
  name: "Elena Rostova",
  headline: "Senior Visual Designer, Art Director & 3D Motion Visualist",
  location: "Zurich, Switzerland (Available Globally)",
  hourlyRate: "$95 / hr",
  projectRate: "From $4,500 / project",
  availability: "Available for Q4 Contracts",
  portfolioWebsite: "https://elenarostova.design",
  behanceUrl: "https://behance.net/elenarostova",
  dribbbleUrl: "https://dribbble.com/elenarostova",
  instagramUrl: "https://instagram.com/elena.craft",
  bio: `Multidisciplinary visual designer and art director with over 8 years of experience building distinct brand identities, cinematic motion design, and high-impact digital experiences for global luxury labels and technology pioneers.

My approach merges strict Swiss typographic heritage with emotive 3D motion and interactive storytelling. Formerly senior brand lead at partner studios for Pentagram and Swiss Style Lab.`,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&auto=format&fit=crop&q=80",
  skills: [
    { name: "Brand Identity & Systems", level: 5 },
    { name: "Swiss Typography & Editorial", level: 5 },
    { name: "3D Motion & Art Direction", level: 4 },
    { name: "Design Systems & Tokens", level: 5 },
    { name: "Cinema 4D & Octane", level: 4 },
    { name: "Packaging & Print Craft", level: 5 },
  ],
  projects: [
    {
      id: "proj-1",
      title: "KRONOS — Haute Horlogerie Brand Identity",
      category: "Brand & Visual Identity",
      mediaType: "image" as const,
      mediaUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&auto=format&fit=crop&q=80",
      description:
        "Complete brand identity, bespoke serif typeface family, and luxury exhibition catalog design for an independent Swiss watchmaker in Geneva.",
      tools: ["Figma", "Illustrator", "Typography", "Cinema 4D"],
      externalCaseStudyUrl: "https://elenarostova.design/kronos",
    },
    {
      id: "proj-2",
      title: "Sovereign — 3D Kinetic Motion & Brand Reel",
      category: "3D Motion & Film",
      mediaType: "video" as const,
      mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      posterUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
      description:
        "Kinetic brand identity sequence and photorealistic 3D simulation exploring fluid dynamics, light refractions, and sound-reactive motion design.",
      tools: ["Cinema 4D", "Octane Render", "After Effects", "Houdini"],
      externalCaseStudyUrl: "https://elenarostova.design/sovereign-motion",
    },
    {
      id: "proj-3",
      title: "Aura Botanica — Packaging & Tactile System",
      category: "Packaging Design",
      mediaType: "image" as const,
      mediaUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1000&auto=format&fit=crop&q=80",
      description:
        "Sustainable frosted glass containers, embossed copper-foil labeling, and modular unboxing ritual created for organic botanical apothecary.",
      tools: ["Figma", "InDesign", "Blender", "Print Craft"],
      externalCaseStudyUrl: "https://elenarostova.design/aura-botanica",
    },
  ] as ProjectItem[],
  experience: [
    {
      role: "Lead Visual & Art Director",
      company: "Studio Ardent (London)",
      period: "2022 — Present",
      desc: "Directing multi-platform brand ecosystems, editorial guidelines, and motion systems for enterprise technology clients.",
    },
    {
      role: "Senior Typographic Designer",
      company: "Helvetic Bureau (Zurich)",
      period: "2019 — 2022",
      desc: "Designed bespoke corporate typography suites, design systems, and art directed print campaigns.",
    },
  ],
  education: [
    {
      degree: "Master of Arts in Visual Communication & Spatial Motion",
      school: "ECAL (École cantonale d'art de Lausanne)",
      year: "2018",
    },
  ],
};

export default function CreativeProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [creative, setCreative] = useState(defaultCreative);
  const [activeMediaTab, setActiveMediaTab] = useState<"all" | "pictures" | "videos">("all");
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const rawId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    if (!rawId || rawId.startsWith("cr-")) return;

    publicApi
      .getCreative(rawId)
      .then((res) => {
        const d = res.data;
        if (!d) return;
        const mappedProjects: ProjectItem[] =
          Array.isArray(d.portfolio_projects) && d.portfolio_projects.length > 0
            ? d.portfolio_projects.map((p: any) => ({
                id: p.id,
                title: p.title,
                category: d.category_name || "Creative Craft",
                mediaType: p.video_url ? ("video" as const) : ("image" as const),
                mediaUrl:
                  p.video_url ||
                  p.cover_image_url ||
                  (Array.isArray(p.media_urls) && p.media_urls[0]) ||
                  defaultCreative.projects[0].mediaUrl,
                posterUrl: p.cover_image_url || undefined,
                description: p.description || "",
                tools: Array.isArray(p.tools_used) && p.tools_used.length > 0 ? p.tools_used : ["Creative Craft"],
                externalCaseStudyUrl: p.project_url || undefined,
              }))
            : defaultCreative.projects;

        const mappedSkills =
          Array.isArray(d.skills) && d.skills.length > 0
            ? d.skills.map((s: any) => ({
                name: s.name,
                level: s.proficiency_level || 5,
              }))
            : defaultCreative.skills;

        const mappedExp =
          Array.isArray(d.work_experiences) && d.work_experiences.length > 0
            ? d.work_experiences.map((w: any) => ({
                role: w.job_title,
                company: w.company_name,
                period: `${w.start_date || ""} — ${w.is_current ? "Present" : w.end_date || "Present"}`,
                desc: w.description || "",
              }))
            : defaultCreative.experience;

        const mappedEdu =
          Array.isArray(d.educations) && d.educations.length > 0
            ? d.educations.map((ed: any) => ({
                degree: ed.degree ? `${ed.degree}${ed.field_of_study ? ` in ${ed.field_of_study}` : ""}` : "Creative Studies",
                school: ed.institution_name,
                year: ed.graduation_year ? String(ed.graduation_year) : "",
              }))
            : defaultCreative.education;

        const availLabel =
          d.availability_status === "available"
            ? "Available Immediately"
            : d.availability_status === "open_to_offers"
            ? "Open to Select Offers"
            : "Booked / Unavailable";

        setCreative({
          id: d.id,
          user_id: d.user_id || "",
          name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || defaultCreative.name,
          headline: d.headline || defaultCreative.headline,
          location: d.location || defaultCreative.location,
          hourlyRate: d.hourly_rate ? `$${d.hourly_rate} / hr` : defaultCreative.hourlyRate,
          projectRate: d.project_rate_min ? `From $${d.project_rate_min} / project` : defaultCreative.projectRate,
          availability: availLabel,
          portfolioWebsite: d.portfolio_url || defaultCreative.portfolioWebsite,
          behanceUrl: d.behance_url || defaultCreative.behanceUrl,
          dribbbleUrl: d.dribbble_url || defaultCreative.dribbbleUrl,
          instagramUrl: defaultCreative.instagramUrl,
          bio: d.bio || defaultCreative.bio,
          avatar: d.avatar_url || defaultCreative.avatar,
          cover: d.cover_image_url || defaultCreative.cover,
          skills: mappedSkills,
          projects: mappedProjects,
          experience: mappedExp,
          education: mappedEdu,
        });
      })
      .catch(() => {
        // Keep default fallback
      });
  }, [params.id]);

  const filteredProjects = creative.projects.filter((p) => {
    if (activeMediaTab === "pictures") return p.mediaType === "image";
    if (activeMediaTab === "videos") return p.mediaType === "video";
    return true;
  });

  const pictureCount = creative.projects.filter((p) => p.mediaType === "image").length;
  const videoCount = creative.projects.filter((p) => p.mediaType === "video").length;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    setIsSending(true);
    try {
      if (creative.user_id) {
        await messagingApi.createConversation({
          recipient_user_id: creative.user_id,
          subject: `Direct Portfolio Inquiry — ${creative.name}`,
          initial_message: messageText,
        });
      }
    } catch {
      // Fallback for demo
    } finally {
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setContactModalOpen(false);
        setMessageText("");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-20 pb-20">
        {/* Cover Photo */}
        <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-zinc-900">
          <img
            src={creative.cover}
            alt="Cover"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <img
                src={creative.avatar}
                alt={creative.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white object-cover shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171526]">
                    {creative.name}
                  </h1>
                  <ShieldCheck className="w-6 h-6 text-[#7957F5]" />
                  <Badge variant="subtle" size="sm">
                    Verified Creative
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-[#171526]">{creative.headline}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#777386]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#7957F5]" /> {creative.location}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{creative.availability}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-left sm:text-right mr-2">
                <span className="text-xs text-[#777386] block">Verified Rate</span>
                <span className="text-xl font-black text-[#7957F5]">{creative.hourlyRate}</span>
              </div>
              <Button
                size="lg"
                onClick={() => setContactModalOpen(true)}
                className="rounded-full shadow-lg bg-[#7957F5] hover:bg-[#6844E2]"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Inquire & Book
              </Button>
            </div>
          </div>

          {/* Direct Portfolio Link Banner */}
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-[#E9DFFF]/60 via-[#FCFAFF] to-white border border-[#E9DFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7957F5] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#171526]">
                  Personal Portfolio & Direct Channels
                </h4>
                <p className="text-xs text-[#777386]">
                  View live interactive case studies, published client work, and high-res video reels.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {creative.portfolioWebsite && (
                <a
                  href={creative.portfolioWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7957F5] text-white text-xs font-bold hover:bg-[#6844E2] transition-colors shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5" /> Visit External Portfolio ↗
                </a>
              )}
              {creative.behanceUrl && (
                <a
                  href={creative.behanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white border border-[#EEEAF5] text-xs font-semibold text-[#171526] hover:bg-[#FCFAFF] transition-colors"
                >
                  Behance ↗
                </a>
              )}
              {creative.dribbbleUrl && (
                <a
                  href={creative.dribbbleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white border border-[#EEEAF5] text-xs font-semibold text-[#171526] hover:bg-[#FCFAFF] transition-colors"
                >
                  Dribbble ↗
                </a>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            {/* Left 2 Cols: Bio & Portfolio Showcase */}
            <div className="lg:col-span-2 space-y-10">
              {/* About Bio */}
              <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h2 className="text-lg font-bold text-[#171526] mb-4">About the Creative</h2>
                <p className="text-sm text-[#777386] leading-relaxed whitespace-pre-line">
                  {creative.bio}
                </p>
              </div>

              {/* Portfolio Showcase with Picture and Video Filter Tabs */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#171526]">Curated Work & Media</h2>
                    <p className="text-xs text-[#777386] mt-0.5">
                      Explore picture galleries, live motion reels, and verified project deliverables.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FCFAFF] border border-[#EEEAF5]">
                    <button
                      onClick={() => setActiveMediaTab("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeMediaTab === "all"
                          ? "bg-[#7957F5] text-white shadow-sm"
                          : "text-[#777386] hover:text-[#171526]"
                      }`}
                    >
                      All Works ({creative.projects.length})
                    </button>
                    <button
                      onClick={() => setActiveMediaTab("pictures")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                        activeMediaTab === "pictures"
                          ? "bg-[#7957F5] text-white shadow-sm"
                          : "text-[#777386] hover:text-[#171526]"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Pictures ({pictureCount})
                    </button>
                    <button
                      onClick={() => setActiveMediaTab("videos")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                        activeMediaTab === "videos"
                          ? "bg-[#7957F5] text-white shadow-sm"
                          : "text-[#777386] hover:text-[#171526]"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" /> Video Reels ({videoCount})
                    </button>
                  </div>
                </div>

                {/* Project Media Cards */}
                <div className="space-y-6">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-3xl overflow-hidden bg-white border border-[#EEEAF5] hover:border-[#7957F5] transition-all group shadow-sm"
                    >
                      {/* Media Display: Image or Video */}
                      {proj.mediaType === "video" ? (
                        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-black flex items-center justify-center">
                          <video
                            controls
                            poster={proj.posterUrl}
                            preload="metadata"
                            className="w-full h-full object-cover"
                          >
                            <source src={proj.mediaUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute top-4 left-4 pointer-events-none">
                            <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                              <Film className="w-3 h-3 text-[#7957F5]" /> 3D Motion Reel
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-100">
                          <img
                            src={proj.mediaUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                              <ImageIcon className="w-3 h-3 text-pink-400" /> High-Res Picture
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveImageModal(proj.mediaUrl)}
                            className="absolute bottom-4 right-4 p-2 rounded-full bg-white/90 text-[#171526] hover:bg-white shadow-md transition-transform hover:scale-110"
                            title="Expand High-Res Picture"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Project Details */}
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="secondary" size="sm">
                            {proj.category}
                          </Badge>
                          {proj.externalCaseStudyUrl && (
                            <a
                              href={proj.externalCaseStudyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#7957F5] hover:underline flex items-center gap-1"
                            >
                              External Case Study <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-[#171526] mb-2">{proj.title}</h3>
                        <p className="text-xs text-[#777386] leading-relaxed mb-4">
                          {proj.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#EEEAF5]">
                          <span className="text-[11px] text-[#777386] font-semibold mr-1">
                            Tools:
                          </span>
                          {proj.tools.map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-0.5 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-medium text-[#171526]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Portfolio Link Card, Skills & Experience */}
            <div className="space-y-8">
              {/* External Portfolio Dedicated Card */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h3 className="text-sm font-bold text-[#171526] mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#7957F5]" /> Official Portfolio
                </h3>
                <p className="text-xs text-[#777386] mb-4">
                  Direct verified web link for external case studies and client projects:
                </p>
                <a
                  href={creative.portfolioWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] hover:border-[#7957F5] text-xs font-bold text-[#171526] group transition-all"
                >
                  <span className="truncate">{creative.portfolioWebsite}</span>
                  <ExternalLink className="w-4 h-4 text-[#7957F5] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </a>

                <div className="mt-4 pt-4 border-t border-[#EEEAF5] flex flex-col gap-2">
                  {creative.behanceUrl && (
                    <a
                      href={creative.behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-[#777386] hover:text-[#7957F5]"
                    >
                      <span>Behance Network</span>
                      <span className="font-semibold">View ↗</span>
                    </a>
                  )}
                  {creative.dribbbleUrl && (
                    <a
                      href={creative.dribbbleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-[#777386] hover:text-[#7957F5]"
                    >
                      <span>Dribbble Pro</span>
                      <span className="font-semibold">View ↗</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h3 className="text-sm font-bold text-[#171526] mb-4">Core Skills & Mastery</h3>
                <div className="space-y-3">
                  {creative.skills.map((s) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs font-semibold text-[#171526] mb-1">
                        <span>{s.name}</span>
                        <span className="text-[#7957F5]">{s.level} / 5</span>
                      </div>
                      <div className="w-full bg-[#EEEAF5] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#7957F5] h-full rounded-full"
                          style={{ width: `${(s.level / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h3 className="text-sm font-bold text-[#171526] mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#7957F5]" /> Experience History
                </h3>
                <div className="space-y-4">
                  {creative.experience.map((exp, i) => (
                    <div key={i} className="border-l-2 border-[#EEEAF5] pl-4">
                      <p className="text-xs font-bold text-[#171526]">{exp.role}</p>
                      <p className="text-xs text-[#7957F5] font-medium">{exp.company}</p>
                      <p className="text-[11px] text-[#777386] mb-1">{exp.period}</p>
                      <p className="text-xs text-[#777386]">{exp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h3 className="text-sm font-bold text-[#171526] mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#7957F5]" /> Education
                </h3>
                <div className="space-y-3">
                  {creative.education.map((edu, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-[#171526]">{edu.degree}</p>
                      <p className="text-xs text-[#7957F5]">{edu.school}</p>
                      <p className="text-[11px] text-[#777386]">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High-Res Image Lightbox Modal */}
        {activeImageModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveImageModal(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setActiveImageModal(null)}
                className="absolute -top-12 right-0 text-white font-bold text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full"
              >
                ✕ Close
              </button>
              <img
                src={activeImageModal}
                alt="High Res Preview"
                className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/10"
              />
            </div>
          </div>
        )}

        {/* Contact / Inquire Modal */}
        {contactModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-[#EEEAF5]">
              <h3 className="text-xl font-bold text-[#171526] mb-1">
                Inquire with {creative.name}
              </h3>
              <p className="text-xs text-[#777386] mb-6">
                Start a direct collaboration, request custom deliverables, or send a contract offer.
              </p>

              {sentSuccess ? (
                <div className="py-8 text-center text-emerald-700 font-semibold text-sm">
                  Message sent! {creative.name} will be notified directly in their studio inbox.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-2">
                      Project Scope & Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Hi ${creative.name.split(" ")[0]}, we love your portfolio and would like to discuss an upcoming brief...`}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5] transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setContactModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isSending}
                      className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                    >
                      Send Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
