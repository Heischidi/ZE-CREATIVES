"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  Briefcase,
  FolderKanban,
  Settings,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Globe,
  Film,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreativeProject {
  id: string;
  title: string;
  category: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  views: number;
  portfolioUrl?: string;
}

const initialApps = [
  {
    id: "app-1",
    jobTitle: "Senior Brand Identity Designer",
    company: "Studio Ardent",
    status: "Shortlisted",
    appliedDate: "3 days ago",
    statusColor: "secondary",
    pay: "$95,000 - $120,000 / year",
  },
  {
    id: "app-2",
    jobTitle: "Lead 3D Motion Graphic Artist",
    company: "Nova Kinetic",
    status: "Reviewing",
    appliedDate: "5 days ago",
    statusColor: "warning",
    pay: "$130,000 - $160,000 / year",
  },
  {
    id: "app-3",
    jobTitle: "Design System & UI Specialist",
    company: "Aura Health",
    status: "Interview Scheduled",
    appliedDate: "1 week ago",
    statusColor: "success",
    pay: "$85,000 - $105,000 / year",
  },
];

const initialProjects: CreativeProject[] = [
  {
    id: "proj-1",
    title: "KRONOS — Haute Horlogerie Identity",
    category: "Brand Identity",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    views: 420,
    portfolioUrl: "https://elenarostova.design/kronos",
  },
  {
    id: "proj-2",
    title: "Sovereign — 3D Motion Identity Reel",
    category: "3D Motion",
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    views: 680,
    portfolioUrl: "https://elenarostova.design/sovereign-motion",
  },
  {
    id: "proj-3",
    title: "Aura Botanica Packaging System",
    category: "Packaging Design",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80",
    views: 295,
    portfolioUrl: "https://elenarostova.design/aura-botanica",
  },
];

export default function CreativeDashboardPage() {
  const [activeTab, setActiveTab] = useState<"applications" | "portfolio" | "profile">("applications");
  const [availability, setAvailability] = useState("Available Now");
  const [projects, setProjects] = useState<CreativeProject[]>(initialProjects);
  const [portfolioLink, setPortfolioLink] = useState("https://elenarostova.design");
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Modal fields
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Brand Identity");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: CreativeProject = {
      id: `proj-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      mediaType: newMediaType,
      mediaUrl:
        newMediaUrl.trim() ||
        (newMediaType === "video"
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"),
      views: 1,
      portfolioUrl: newPortfolioUrl || portfolioLink,
    };

    setProjects([newProj, ...projects]);
    setIsAddProjectModalOpen(false);
    setNewTitle("");
    setNewMediaUrl("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <div className="p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#171526]">
                    Welcome, Elena
                  </h1>
                  <ShieldCheck className="w-5 h-5 text-[#7957F5]" />
                  <Badge variant="subtle" size="sm">
                    Verified Creative
                  </Badge>
                </div>
                <p className="text-xs text-[#777386] mt-0.5">
                  Senior Visual Designer & 3D Motion Artist • Verified Member
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="px-3.5 py-2 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs font-semibold text-[#171526] outline-none"
              >
                <option value="Available Now">🟢 Available Now</option>
                <option value="Open to Offers">🟡 Open to Offers</option>
                <option value="Booked">🔴 Booked</option>
              </select>
              <Link href="/creatives/cr-1">
                <Button size="sm" variant="secondary" className="rounded-full">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Public Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* External Portfolio Link Bar */}
          <div className="mb-8 p-4 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Globe className="w-4 h-4 text-[#7957F5]" />
              <span className="font-bold text-[#171526]">Your External Portfolio Website:</span>
              <a
                href={portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7957F5] hover:underline font-semibold"
              >
                {portfolioLink} ↗
              </a>
            </div>
            <a
              href={portfolioLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1 hover:bg-[#d9caff] transition-colors"
            >
              Test Live Portfolio Link ↗
            </a>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Active Applications</p>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1">{initialApps.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Profile Impressions</p>
              <p className="text-2xl font-extrabold text-[#171526] mt-1">1,842</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Portfolio Deliverables</p>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1">{projects.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Verified Craft Badge</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">100%</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#EEEAF5] mb-6">
            <button
              onClick={() => setActiveTab("applications")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "applications"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              💼 Application Tracker ({initialApps.length})
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "portfolio"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              🎨 Portfolio & Motion Reels ({projects.length})
            </button>
          </div>

          {/* Applications View */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              {initialApps.map((a) => (
                <div
                  key={a.id}
                  className="p-6 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-[#171526]">{a.jobTitle}</h3>
                      <Badge variant={a.statusColor as any} size="sm">
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#777386]">
                      {a.company} • Submitted {a.appliedDate} • Compensation: <strong className="text-emerald-700">{a.pay}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/jobs/job-1`}>
                      <Button size="sm" variant="outline" className="rounded-full">
                        View Role Requirements
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Portfolio View with Pictures and Videos */}
          {activeTab === "portfolio" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#171526]">Showcase Projects & Motion Reels</h3>
                  <p className="text-xs text-[#777386]">
                    Both high-resolution pictures and playable video reels are showcased to clients.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddProjectModalOpen(true)}
                  className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Project / Reel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white border border-[#EEEAF5] shadow-sm overflow-hidden flex flex-col group hover:border-[#7957F5] transition-all"
                  >
                    <div className="relative h-44 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                      {p.mediaType === "video" ? (
                        <>
                          <video
                            src={p.mediaUrl}
                            preload="metadata"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-10 h-10 rounded-full bg-[#7957F5] text-white flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Film className="w-3 h-3 text-[#7957F5]" /> Video Reel
                          </span>
                        </>
                      ) : (
                        <>
                          <img
                            src={p.mediaUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-pink-400" /> Picture
                          </span>
                        </>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Badge variant="subtle" size="sm" className="mb-1.5">
                          {p.category}
                        </Badge>
                        <h4 className="text-sm font-bold text-[#171526] line-clamp-1">{p.title}</h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#EEEAF5] flex items-center justify-between text-xs text-[#777386]">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {p.views} views
                        </span>
                        {p.portfolioUrl && (
                          <a
                            href={p.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#7957F5] font-semibold hover:underline flex items-center gap-0.5 text-[11px]"
                          >
                            Live Case Study ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Project Modal */}
        {isAddProjectModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#EEEAF5] animate-fadeIn">
              <h3 className="text-xl font-bold text-[#171526] mb-1">Add Work to Portfolio</h3>
              <p className="text-xs text-[#777386] mb-6">
                Upload image deliverables or attach playable video motion reels.
              </p>

              <form onSubmit={handleAddProject} className="space-y-4">
                <Input
                  label="Project Title"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kinetic Brand Identity System"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-3 py-2.5 text-xs text-[#171526] outline-none"
                    >
                      <option value="Brand Identity">Brand Identity</option>
                      <option value="3D Motion">3D Motion</option>
                      <option value="Packaging Design">Packaging Design</option>
                      <option value="UI / UX Design">UI / UX Design</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Media Type
                    </label>
                    <select
                      value={newMediaType}
                      onChange={(e) => setNewMediaType(e.target.value as "image" | "video")}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-3 py-2.5 text-xs text-[#171526] outline-none"
                    >
                      <option value="image">🖼️ Picture / Gallery</option>
                      <option value="video">🎬 Video / Motion Reel</option>
                    </select>
                  </div>
                </div>

                <Input
                  label={newMediaType === "video" ? "Video Reel URL (MP4 / WebM)" : "Image URL (High-Res)"}
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder={
                    newMediaType === "video"
                      ? "https://example.com/reel.mp4"
                      : "https://images.unsplash.com/photo-..."
                  }
                />

                <Input
                  label="External Case Study URL (Optional)"
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  placeholder="https://elenarostova.design/project"
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddProjectModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                  >
                    Publish to Portfolio
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
