"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  ChevronRight,
  Filter,
  Sparkles,
  ExternalLink,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const categories = [
  "All Disciplines",
  "Brand & Identity",
  "UI / UX Design",
  "3D & Motion",
  "Art Direction",
  "Illustration",
  "Photography & Film",
];

const mockCreatives = [
  {
    id: "cr-1",
    name: "Elena Rostova",
    headline: "Senior Visual Designer & Typographer",
    category: "Brand & Identity",
    location: "Zurich, CH",
    rate: "$95/hr",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    tags: ["Editorial", "Luxury Branding", "Typography", "Figma"],
    availability: "Available Now",
    rating: 4.95,
    portfolioUrl: "https://elenarostova.design",
    hasVideoReel: true,
    photoCount: 6,
  },
  {
    id: "cr-2",
    name: "Marcus Vance",
    headline: "Houdini 3D Artist & Motion Director",
    category: "3D & Motion",
    location: "Los Angeles, US",
    rate: "$120/hr",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=80",
    tags: ["3D Motion", "Houdini", "CGI", "Octane"],
    availability: "Available Now",
    rating: 5.0,
    portfolioUrl: "https://marcusvance3d.art",
    hasVideoReel: true,
    photoCount: 8,
  },
  {
    id: "cr-3",
    name: "Aisha Kamau",
    headline: "Digital Product Designer & Creative Lead",
    category: "UI / UX Design",
    location: "Nairobi / Remote",
    rate: "$85/hr",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    tags: ["Fintech UI", "Design Systems", "Mobile", "Prototyping"],
    availability: "Taking Inquiries",
    rating: 4.92,
    portfolioUrl: "https://aishakamau.design",
    hasVideoReel: false,
    photoCount: 12,
  },
  {
    id: "cr-4",
    name: "Julien Mercer",
    headline: "Fashion & Commercial Film Director",
    category: "Photography & Film",
    location: "Paris, FR",
    rate: "$140/hr",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80",
    tags: ["Cinematography", "Color Grading", "DaVinci", "Commercial"],
    availability: "Available Now",
    rating: 4.98,
    portfolioUrl: "https://julienmercerfilms.com",
    hasVideoReel: true,
    photoCount: 15,
  },
  {
    id: "cr-5",
    name: "Sofia Chen",
    headline: "Illustrator & Worldbuilder",
    category: "Illustration",
    location: "Toronto, CA",
    rate: "$75/hr",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    tags: ["Visual Storytelling", "Concept Art", "Procreate", "Editorial"],
    availability: "Available Now",
    rating: 4.88,
    portfolioUrl: "https://sofiachen.art",
    hasVideoReel: false,
    photoCount: 14,
  },
  {
    id: "cr-6",
    name: "Liam O'Connor",
    headline: "Creative Strategy & Brand Positioning Lead",
    category: "Art Direction",
    location: "Dublin / London",
    rate: "$110/hr",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80",
    tags: ["Brand Architecture", "Creative Strategy", "Copywriting", "Art Direction"],
    availability: "Taking Inquiries",
    rating: 4.96,
    portfolioUrl: "https://liamoconnor.agency",
    hasVideoReel: false,
    photoCount: 9,
  },
];


export default function CreativesDirectoryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Disciplines");

  const filteredCreatives = mockCreatives.filter((cr) => {
    if (search && !cr.name.toLowerCase().includes(search.toLowerCase()) && !cr.headline.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "All Disciplines" && cr.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Banner */}
        <section className="bg-white border-b border-[#EEEAF5] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-3">
              Elite Talent Roster
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171526]">
              Discover Vetted Creative Minds
            </h1>
            <p className="mt-2 text-base text-[#777386] max-w-2xl">
              Every creative on Ze: is individually vetted for technical craft, storytelling, and professional delivery.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777386]" />
                <input
                  type="text"
                  placeholder="Search by name, headline, or specialism..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#FCFAFF] border border-[#EEEAF5] rounded-xl text-sm text-[#171526] outline-none focus:border-[#7957F5] focus:bg-white transition-all"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-[#FCFAFF] border border-[#EEEAF5] rounded-xl text-sm text-[#171526] outline-none focus:border-[#7957F5]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Directory Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <p className="text-sm font-semibold text-[#777386] mb-6">
            Showing <span className="text-[#171526]">{filteredCreatives.length}</span> verified creatives
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCreatives.map((cr) => (
              <div
                key={cr.id}
                className="rounded-3xl overflow-hidden bg-white border border-[#EEEAF5] hover:border-[#7957F5] hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Cover Image */}
                <div className="h-44 w-full relative overflow-hidden bg-zinc-100">
                  <img
                    src={cr.cover}
                    alt={cr.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-emerald-700 shadow-sm">
                      {cr.availability}
                    </span>
                  </div>
                </div>

                {/* Profile Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 -mt-12 mb-3 relative">
                      <img
                        src={cr.avatar}
                        alt={cr.name}
                        className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-md"
                      />
                      <div className="pt-6">
                        <h3 className="font-bold text-[#171526] text-base flex items-center gap-1.5">
                          {cr.name}
                          <ShieldCheck className="w-4 h-4 text-[#7957F5]" />
                        </h3>
                        <span className="text-xs text-[#777386] flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {cr.location}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#171526] mb-1">{cr.headline}</p>
                    <p className="text-xs text-[#7957F5] font-medium mb-3">{cr.category}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {cr.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md bg-[#FCFAFF] border border-[#EEEAF5] text-[10px] text-[#777386]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Media & External Portfolio Badges */}
                    <div className="pt-2 border-t border-[#EEEAF5]/60 mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {cr.hasVideoReel && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            <Film className="w-3 h-3" /> Video Reel
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                          <ImageIcon className="w-3 h-3" /> {cr.photoCount} Photos
                        </span>
                      </div>

                      {cr.portfolioUrl && (
                        <a
                          href={cr.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-[#7957F5] hover:underline flex items-center gap-1"
                        >
                          Portfolio <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EEEAF5] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#777386] block">Starting at</span>
                      <span className="text-base font-extrabold text-[#7957F5]">{cr.rate}</span>
                    </div>
                    <Link href={`/creatives/${cr.id}`}>
                      <Button size="sm" variant="secondary" className="rounded-full">
                        View Portfolio
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
