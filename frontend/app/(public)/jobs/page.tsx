"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Filter,
  Briefcase,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { publicApi } from "@/lib/api";

const categories = [
  { label: "All Disciplines", value: "" },
  { label: "Brand & Identity", value: "brand-identity" },
  { label: "UI / UX Design", value: "ui-ux-design" },
  { label: "3D & Motion", value: "3d-motion" },
  { label: "Art Direction", value: "art-direction" },
  { label: "Illustration", value: "illustration" },
  { label: "Photography & Film", value: "photo-film" },
];

const mockJobs = [
  {
    id: "job-1",
    title: "Senior Brand Identity Designer",
    client_name: "Studio Ardent",
    location: "London, UK",
    work_arrangement: "remote",
    employment_type: "contract",
    experience_level: "senior",
    category_name: "Brand & Visual Identity",
    salary_min: 95000,
    salary_max: 120000,
    currency: "USD",
    skills: [{ name: "Figma" }, { name: "Brand Guidelines" }, { name: "Typography" }, { name: "Art Direction" }],
    is_featured: true,
    created_at: "2026-10-28T12:00:00Z",
  },
  {
    id: "job-2",
    title: "Lead 3D Motion Graphic Artist",
    client_name: "Nova Kinetic",
    location: "New York, USA",
    work_arrangement: "hybrid",
    employment_type: "full_time",
    experience_level: "lead",
    category_name: "3D Art & Motion Design",
    salary_min: 130000,
    salary_max: 160000,
    currency: "USD",
    skills: [{ name: "Cinema 4D" }, { name: "Houdini" }, { name: "Octane" }, { name: "After Effects" }],
    is_featured: true,
    created_at: "2026-10-29T15:30:00Z",
  },
  {
    id: "job-3",
    title: "Design System & UI Specialist",
    client_name: "Aura Health",
    location: "Berlin, Germany",
    work_arrangement: "remote",
    employment_type: "freelance",
    experience_level: "mid",
    category_name: "UI / UX & Product Design",
    salary_min: 85000,
    salary_max: 105000,
    currency: "USD",
    skills: [{ name: "Design Systems" }, { name: "Tokens" }, { name: "Figma" }, { name: "Accessibility" }],
    is_featured: false,
    created_at: "2026-10-30T09:15:00Z",
  },
  {
    id: "job-4",
    title: "Creative Director — Fashion & Editorial",
    client_name: "Vogue Collective",
    location: "Paris, France",
    work_arrangement: "on_site",
    employment_type: "full_time",
    experience_level: "director",
    category_name: "Art Direction & Creative Strategy",
    salary_min: 150000,
    salary_max: 190000,
    currency: "EUR",
    skills: [{ name: "Fashion Direction" }, { name: "Print Production" }, { name: "Campaign Strategy" }],
    is_featured: true,
    created_at: "2026-10-31T11:00:00Z",
  },
  {
    id: "job-5",
    title: "Senior Product Illustrator & Concept Artist",
    client_name: "Hyperion Labs",
    location: "San Francisco, USA",
    work_arrangement: "remote",
    employment_type: "full_time",
    experience_level: "senior",
    category_name: "Illustration & Concept Art",
    salary_min: 110000,
    salary_max: 140000,
    currency: "USD",
    skills: [{ name: "Digital Painting" }, { name: "Character Design" }, { name: "Storyboarding" }],
    is_featured: false,
    created_at: "2026-10-27T16:20:00Z",
  },
];

export default function JobsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [workArrangement, setWorkArrangement] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jobs, setJobs] = useState(mockJobs);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        const res = await publicApi.getJobs({
          search: search || undefined,
          category_id: selectedCategory || undefined,
          work_arrangement: workArrangement || undefined,
          employment_type: employmentType || undefined,
        });
        if (res.data?.items && res.data.items.length > 0) {
          setJobs(res.data.items);
        } else {
          // Fallback filter on mock data for client demo
          const filtered = mockJobs.filter((j) => {
            if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (workArrangement && j.work_arrangement !== workArrangement) return false;
            if (employmentType && j.employment_type !== employmentType) return false;
            return true;
          });
          setJobs(filtered);
        }
      } catch (err) {
        // Fallback filter on mock data
        const filtered = mockJobs.filter((j) => {
          if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (workArrangement && j.work_arrangement !== workArrangement) return false;
          if (employmentType && j.employment_type !== employmentType) return false;
          return true;
        });
        setJobs(filtered);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [search, selectedCategory, workArrangement, employmentType]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Header Header Banner */}
        <section className="bg-white border-b border-[#EEEAF5] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-3">
              Curated Opportunities
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171526]">
              Explore Creative Positions
            </h1>
            <p className="mt-2 text-base text-[#777386] max-w-2xl">
              Discover verified roles from top agencies, innovative tech companies, and design studios.
            </p>

            {/* Search and Filters Bar */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777386]" />
                <input
                  type="text"
                  placeholder="Filter by job title, company, or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#FCFAFF] border border-[#EEEAF5] rounded-xl text-sm text-[#171526] outline-none focus:border-[#7957F5] focus:bg-white transition-all"
                />
              </div>

              <select
                value={workArrangement}
                onChange={(e) => setWorkArrangement(e.target.value)}
                className="px-4 py-3 bg-[#FCFAFF] border border-[#EEEAF5] rounded-xl text-sm text-[#171526] outline-none focus:border-[#7957F5]"
              >
                <option value="">Any Arrangement</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on_site">On-Site</option>
              </select>

              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="px-4 py-3 bg-[#FCFAFF] border border-[#EEEAF5] rounded-xl text-sm text-[#171526] outline-none focus:border-[#7957F5]"
              >
                <option value="">All Types</option>
                <option value="full_time">Full-Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="part_time">Part-Time</option>
              </select>
            </div>
          </div>
        </section>

        {/* Category Pills Bar */}
        <section className="bg-white border-b border-[#EEEAF5] py-3 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.value
                    ? "bg-[#7957F5] text-white shadow-sm"
                    : "bg-[#FCFAFF] border border-[#EEEAF5] text-[#777386] hover:text-[#171526] hover:border-[#7957F5]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Jobs List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-[#777386]">
              Showing <span className="text-[#171526]">{jobs.length}</span> positions
            </p>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-6 rounded-2xl bg-white border border-[#EEEAF5] hover:border-[#7957F5] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#777386]">{job.client_name}</span>
                    <span className="text-[#EEEAF5]">•</span>
                    <span className="text-xs text-[#777386] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location} ({job.work_arrangement})
                    </span>
                    <span className="text-[#EEEAF5]">•</span>
                    <span className="text-xs text-[#7957F5] font-medium">{job.category_name}</span>
                    {job.is_featured && (
                      <Badge variant="subtle" size="sm">
                        Featured
                      </Badge>
                    )}
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-lg font-bold text-[#171526] hover:text-[#7957F5] transition-colors"
                  >
                    {job.title}
                  </Link>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills?.map((s) => (
                      <span
                        key={s.name}
                        className="px-2.5 py-0.5 rounded-md bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-medium text-[#777386]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-[#EEEAF5] gap-3">
                  <p className="text-sm font-bold text-[#171526]">
                    {job.salary_min && job.salary_max
                      ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                      : "Competitive"}
                  </p>
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="rounded-full">
                      View Position
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#EEEAF5]">
                <Briefcase className="w-12 h-12 text-[#777386]/40 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#171526]">No positions found</h3>
                <p className="text-xs text-[#777386] mt-1">
                  Try adjusting your search query or discipline filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
