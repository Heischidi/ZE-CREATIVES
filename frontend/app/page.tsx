"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Users,
  Compass,
  Star,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  Palette,
  Camera,
  Film,
  PenTool,
  Code,
  Music,
  Scissors,
  Check,
  Heart,
  Bookmark,
  Share2,
  Target,
  Zap,
  CreditCard,
  UserPlus,
  FileCheck,
  Award,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const disciplinePills = [
  { name: "Design", icon: Palette, slug: "design" },
  { name: "Photography", icon: Camera, slug: "photography" },
  { name: "Video", icon: Film, slug: "video" },
  { name: "Animation", icon: Layers, slug: "animation" },
  { name: "Writing", icon: PenTool, slug: "writing" },
  { name: "Fashion", icon: Scissors, slug: "fashion" },
  { name: "Music", icon: Music, slug: "music" },
  { name: "Development", icon: Code, slug: "development" },
];

const featuredOpportunities = [
  {
    id: "job-1",
    title: "Graphic Designer",
    company: "Nova Studio",
    companyAvatar: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=100&auto=format&fit=crop&q=80",
    image: "/images/hero-sculpture.jpg",
    category: "Design",
    type: "Full-time",
    location: "Lagos, Nigeria · Remote ok",
    salary: "$800 - $1,200/mo",
    postedDate: "Posted 2 days ago",
  },
  {
    id: "job-2",
    title: "Video Editor",
    company: "Lumina Media",
    companyAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    image: "/images/job_camera.jpg",
    category: "Video",
    type: "Contract",
    location: "Abuja, Nigeria · Remote",
    salary: "$500 - $900/mo",
    postedDate: "Posted 3 days ago",
  },
  {
    id: "job-3",
    title: "Illustrator",
    company: "Vibe Brands",
    companyAvatar: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&auto=format&fit=crop&q=80",
    image: "/images/hero-sculpture.jpg",
    category: "Illustration",
    type: "Featured",
    location: "Lagos, Nigeria · Remote",
    salary: "$200 - $600/project",
    postedDate: "Posted 4 days ago",
  },
  {
    id: "job-4",
    title: "Frontend Developer (React)",
    company: "Orbit Tech",
    companyAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    image: "/images/job_ribbons.jpg",
    category: "Development",
    type: "Full-time",
    location: "Remote",
    salary: "$2k - $3.5k/mo",
    postedDate: "Posted 5 days ago",
  },
];

const featuredCreatives = [
  {
    id: "cr-1",
    name: "Ada Okator",
    role: "Graphic Designer",
    location: "Lagos, Nigeria",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cr-2",
    name: "Daniel Kalu",
    role: "Photographer",
    location: "Abuja, Nigeria",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cr-3",
    name: "Tomi Adebayo",
    role: "UI/UX Designer",
    location: "Lagos, Nigeria",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cr-4",
    name: "Chisom Eze",
    role: "Illustrator",
    location: "Remote",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cr-5",
    name: "Nnamdi Martins",
    role: "Video Editor",
    location: "Lagos, Nigeria",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "cr-6",
    name: "Zara Yusuf",
    role: "Writer",
    location: "Remote",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (category && category !== "all") params.set("category", category);
    if (location) params.set("location", location);
    if (remoteOnly) params.set("remote", "true");
    router.push(`/jobs?${params.toString()}`);
  };

  const toggleSaveJob = (id: string) => {
    setSavedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 overflow-hidden">
        {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Column (Content & Search) */}
            <div className="lg:col-span-7 z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8E7F0] border border-[#EEEAF5] text-[#7957F5] text-[11px] font-bold tracking-wider uppercase mb-6">
                CREATIVE JOBS. REAL OPPORTUNITIES.
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl xl:text-[68px] font-light text-[#171526] tracking-tight leading-[1.08] mb-6">
                Your next <br />
                <span className="font-normal">creative chapter</span> <br />
                <span className="font-normal">starts here.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#777386] font-normal leading-relaxed max-w-xl mb-9">
                Discover inspiring opportunities, connect with ambitious brands, and
                turn your creative skills into meaningful work.
              </p>

              {/* Unified Search Bar */}
              <form
                onSubmit={handleSearch}
                className="bg-white rounded-full border border-[#EEEAF5] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-2 flex flex-col md:flex-row items-center gap-2 md:gap-0 max-w-2xl mb-5"
              >
                {/* Keyword Input */}
                <div className="flex items-center gap-2.5 px-4 py-2 flex-1 w-full md:w-auto">
                  <Search className="w-4 h-4 text-[#777386]" />
                  <input
                    type="text"
                    placeholder="Job title, skill or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm text-[#171526] placeholder-[#777386]/70 outline-none bg-transparent"
                  />
                </div>

                <div className="hidden md:block w-px h-6 bg-[#EEEAF5]" />

                {/* Category Select */}
                <div className="flex items-center gap-2 px-3 py-2 w-full md:w-auto">
                  <Layers className="w-4 h-4 text-[#777386]" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-sm text-[#171526] outline-none bg-transparent cursor-pointer"
                  >
                    <option value="all">All categories</option>
                    <option value="design">Design</option>
                    <option value="video">Video</option>
                    <option value="photography">Photography</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div className="hidden md:block w-px h-6 bg-[#EEEAF5]" />

                {/* Location Input */}
                <div className="flex items-center gap-2 px-3 py-2 w-full md:w-auto">
                  <MapPin className="w-4 h-4 text-[#777386]" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-24 text-sm text-[#171526] placeholder-[#777386]/70 outline-none bg-transparent"
                  />
                </div>

                <div className="hidden md:block w-px h-6 bg-[#EEEAF5]" />

                {/* Remote Only Toggle */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      remoteOnly ? "bg-[#7957F5] border-[#7957F5]" : "border-[#777386]"
                    }`}
                  >
                    {remoteOnly && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                  <span className="text-xs text-[#777386] whitespace-nowrap">Remote only</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-[#171526] text-white text-sm font-medium hover:bg-black transition-all shadow-sm whitespace-nowrap"
                >
                  Explore jobs ➔
                </button>
              </form>

              {/* Discipline Pills */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {disciplinePills.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <Link
                      key={pill.name}
                      href={`/jobs?category=${pill.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EEEAF5] text-xs font-medium text-[#171526] hover:border-[#7957F5] hover:text-[#7957F5] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#7957F5]" />
                      {pill.name}
                    </Link>
                  );
                })}
              </div>

              {/* Social Proof Avatar Stack */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Creative 1"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Creative 2"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Creative 3"
                  />
                </div>
                <span className="text-xs font-medium text-[#777386]">
                  <strong className="text-[#171526] font-semibold">12K+</strong> creatives & clients already on ZE:creatives
                </span>
              </div>
            </div>

            {/* Right Column (3D Organic Sculpture Artwork + Pinned Job Card) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px]">
                {/* 3D Botanical Sculpture */}
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(121,87,245,0.12)] border border-[#EEEAF5]/80 bg-gradient-to-tr from-[#FCFAFF] to-[#F8E7F0]/40">
                  <img
                    src="/images/hero-sculpture.jpg"
                    alt="3D Iridescent Botanical Sculpture"
                    className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Pinned Glassmorphic Job Card */}
                <div className="absolute top-10 right-2 sm:-right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#EEEAF5] shadow-[0_16px_36px_rgba(0,0,0,0.1)] w-64 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#7957F5] flex items-center justify-center text-white text-[10px]">
                        ✦
                      </div>
                      <span className="text-xs font-bold text-[#171526]">PixelForge</span>
                    </div>
                    <Bookmark className="w-3.5 h-3.5 text-[#777386] hover:text-[#7957F5] cursor-pointer" />
                  </div>

                  <h3 className="text-sm font-semibold text-[#171526] mb-1">
                    UI/UX Designer
                  </h3>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#777386] mb-2.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Full-time</span>
                    <span>·</span>
                    <span>$3k - $5k/mo</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EEEAF5]">
                    <span className="text-[11px] text-[#777386] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Remote
                    </span>
                    <Link
                      href="/jobs/job-1"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#7957F5] text-white text-[11px] font-medium hover:bg-[#6844e3] transition-colors"
                    >
                      View job ➔
                    </Link>
                  </div>
                </div>

                {/* Handwritten Annotation Note */}
                <div className="absolute -bottom-6 right-8 hidden sm:flex items-center gap-2">
                  <span className="font-serif italic text-sm text-[#7957F5] font-medium tracking-wide">
                    Creative talent builds better brands. ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURED OPPORTUNITIES ──────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#171526] tracking-tight">
                Featured opportunities
              </h2>
              <p className="text-sm text-[#777386] mt-1">
                Handpicked jobs from top brands looking for creative talent.
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-[#7957F5] hover:text-[#6844e3] flex items-center gap-1 transition-colors"
            >
              View all jobs ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOpportunities.map((job) => (
              <div
                key={job.id}
                className="group bg-white rounded-2xl border border-[#EEEAF5] overflow-hidden shadow-[0_4px_18px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(121,87,245,0.08)] hover:border-[#7957F5]/30 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Art */}
                <div className="relative h-44 w-full overflow-hidden bg-[#F8E7F0]/30">
                  <img
                    src={job.image}
                    alt={job.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => toggleSaveJob(job.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-[#777386] hover:text-[#7957F5] transition-colors"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        savedJobs[job.id] ? "fill-[#7957F5] text-[#7957F5]" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Company */}
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={job.companyAvatar}
                        alt={job.company}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-[#777386]">
                        {job.company}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-base font-bold text-[#171526] group-hover:text-[#7957F5] transition-colors mb-3 line-clamp-1">
                      <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                    </h3>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#F8E7F0] text-[#7957F5] text-[11px] font-semibold">
                        {job.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[#777386] text-[11px]">
                        {job.type}
                      </span>
                    </div>

                    {/* Location */}
                    <p className="text-xs text-[#777386] flex items-center gap-1 mb-4">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-[#EEEAF5] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#171526]">{job.salary}</span>
                    <span className="text-[11px] text-[#777386]">{job.postedDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURED CREATIVES ──────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#171526] tracking-tight">
                Featured creatives
              </h2>
              <p className="text-sm text-[#777386] mt-1">
                Explore talented creatives ready to bring your vision to life.
              </p>
            </div>
            <Link
              href="/creatives"
              className="text-xs font-semibold text-[#7957F5] hover:text-[#6844e3] flex items-center gap-1 transition-colors"
            >
              View all creatives ➔
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCreatives.map((creative) => (
              <Link
                key={creative.id}
                href={`/creatives/${creative.id}`}
                className="group bg-white rounded-2xl border border-[#EEEAF5] p-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_24px_rgba(121,87,245,0.08)] hover:border-[#7957F5]/30 transition-all duration-300 flex flex-col items-center"
              >
                {/* Portrait Image */}
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-[#F8E7F0]/30">
                  <img
                    src={creative.avatar}
                    alt={creative.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <h3 className="text-sm font-bold text-[#171526] group-hover:text-[#7957F5] transition-colors line-clamp-1">
                  {creative.name}
                </h3>
                <p className="text-[11px] text-[#777386] mt-0.5 mb-1 line-clamp-1">
                  {creative.role}
                </p>
                <p className="text-[10px] text-[#777386]/80 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {creative.location}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── FOR EMPLOYERS BANNER ─────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
          <div className="relative bg-white rounded-3xl border border-[#EEEAF5] p-8 sm:p-12 overflow-hidden shadow-[0_12px_40px_rgba(121,87,245,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-5">
                <span className="text-xs font-bold text-[#7957F5] uppercase tracking-wider block mb-3">
                  FOR EMPLOYERS
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#171526] tracking-tight leading-tight mb-4">
                  Great work starts with the right people.
                </h2>
                <p className="text-sm sm:text-base text-[#777386] leading-relaxed mb-8">
                  Reach talented creatives, get quality applicants, and bring your ideas to life — faster.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/apply/client"
                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-[#171526] text-white text-sm font-medium hover:bg-black transition-all shadow-sm"
                  >
                    Post a job ➔
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-white border border-[#EEEAF5] text-[#171526] text-sm font-medium hover:border-[#7957F5] hover:text-[#7957F5] transition-all"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              {/* Center Artwork */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-[#EEEAF5]">
                  <img
                    src="/images/hero-sculpture.jpg"
                    alt="Creative Excellence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Value Points */}
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F8E7F0] flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-[#7957F5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171526] mb-1">
                      Targeted creative talent
                    </h3>
                    <p className="text-xs text-[#777386] leading-relaxed">
                      Reach the right skills and styles for your project.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F8E7F0] flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-[#7957F5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171526] mb-1">
                      Streamlined hiring
                    </h3>
                    <p className="text-xs text-[#777386] leading-relaxed">
                      Manage applications and reviews with ease.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F8E7F0] flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-[#7957F5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171526] mb-1">
                      Flexible pricing
                    </h3>
                    <p className="text-xs text-[#777386] leading-relaxed">
                      Pay per post or choose a tailored plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
          <div className="text-left mb-12">
            <span className="text-xs font-bold text-[#7957F5] uppercase tracking-wider block mb-2">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl font-bold text-[#171526] tracking-tight mb-2">
              Simple steps. Big opportunities.
            </h2>
            <p className="text-sm text-[#777386] max-w-2xl mb-3">
              Get started in just a few clicks and be part of a growing community of creative talent and forward-thinking brands.
            </p>
            <Link
              href="/apply/creative"
              className="text-xs font-semibold text-[#7957F5] hover:text-[#6844e3] flex items-center gap-1 transition-colors"
            >
              Learn more ➔
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: "1. Create an account",
                desc: "Choose whether you're a creative or a client.",
                icon: UserPlus,
              },
              {
                step: "2. Find or post a job",
                desc: "Browse opportunities or publish a listing.",
                icon: Briefcase,
              },
              {
                step: "3. Apply or review",
                desc: "Creatives apply; clients review and connect.",
                icon: FileCheck,
              },
              {
                step: "4. Get hired",
                desc: "Start your next creative project.",
                icon: Award,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#EEEAF5] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center relative group hover:border-[#7957F5]/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E9DFFF] flex items-center justify-center mb-4 text-[#7957F5] group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171526] mb-1.5">
                    {item.step}
                  </h3>
                  <p className="text-xs text-[#777386] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
