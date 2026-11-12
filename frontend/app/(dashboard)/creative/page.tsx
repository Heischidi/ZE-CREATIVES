"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, getDashboardRoute } from "@/store/auth";
import {
  Sparkles,
  Eye,
  Briefcase,
  FolderKanban,
  Settings,
  Plus,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Globe,
  Film,
  Image as ImageIcon,
  Play,
  RefreshCw,
  Edit,
  Trash2,
  Bookmark,
  Send,
  Search,
  DollarSign,
  MapPin,
  FileText,
  Check,
  X,
  Bell,
  Megaphone,
  Award,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  creativeProfileApi,
  jobApplicationsApi,
  publicApi,
  messagingApi,
  notificationsApi,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreativeTab =
  | "portfolio"
  | "jobs"
  | "applications"
  | "messages"
  | "profile";

interface CreativeProfileData {
  id: string;
  user_id: string;
  professional_headline?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  years_experience?: number | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  project_rate_min?: number | null;
  project_rate_max?: number | null;
  currency?: string;
  availability: string;
  is_public: boolean;
  profile_views: number;
  onboarding_completed: boolean;
  social_links?: {
    website?: string | null;
    linkedin?: string | null;
    behance?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    github?: string | null;
    dribbble?: string | null;
    youtube?: string | null;
  };
  user?: {
    id?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
    is_primary: boolean;
  }[];
  skills?: {
    id: string;
    name?: string | null;
    proficiency_level?: number | null;
  }[];
  work_experiences?: {
    id: string;
    title: string;
    company: string;
    location?: string | null;
    employment_type?: string | null;
    is_current: boolean;
    description?: string | null;
  }[];
  education?: {
    id: string;
    institution: string;
    degree?: string | null;
    field_of_study?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    is_current: boolean;
    description?: string | null;
  }[];
}

interface PortfolioProjectItem {
  id: string;
  title: string;
  description?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  cover_image_url?: string | null;
  project_url?: string | null;
  video_url?: string | null;
  tools_used?: string[];
  is_featured: boolean;
  is_public: boolean;
  created_at?: string | null;
}

interface MarketplaceJobItem {
  id: string;
  title: string;
  company_name?: string | null;
  client_user_id?: string | null;
  is_client_verified?: boolean;
  category?: { id: string; name: string } | null;
  location?: string | null;
  country?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  is_salary_disclosed?: boolean;
  is_featured?: boolean;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  preferred_skills?: string | null;
  custom_questions?: string[];
  views_count?: number;
  applications_count?: number;
  published_at?: string | null;
}

interface MyApplicationItem {
  id: string;
  job_id: string;
  job_title: string;
  client_name: string;
  client_user_id?: string | null;
  category?: string | null;
  location?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  is_salary_disclosed?: boolean;
  status: string;
  cover_letter?: string | null;
  custom_answers?: Record<string, string>;
  client_notes?: string | null;
  portfolio_project_ids?: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ConversationItem {
  id: string;
  subject?: string | null;
  last_message_at?: string | null;
  last_message?: string | null;
  other_participant?: {
    id: string;
    name: string;
    avatar_url?: string | null;
    role?: string;
  } | null;
}

interface ChatMessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at?: string | null;
  is_me: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at?: string | null;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at?: string | null;
}

export default function CreativeDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.role !== "creative") {
      router.replace(getDashboardRoute(user.role));
    }
  }, [mounted, isAuthenticated, user, router]);

  // ─── Studio Navigation & Global States ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CreativeTab>("portfolio");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // ─── Core Data States ───────────────────────────────────────────────────────
  const [profile, setProfile] = useState<CreativeProfileData | null>(null);
  const [projects, setProjects] = useState<PortfolioProjectItem[]>([]);
  const [marketplaceJobs, setMarketplaceJobs] = useState<MarketplaceJobItem[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplicationItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // ─── Portfolio Modal States ─────────────────────────────────────────────────
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projDescription, setProjDescription] = useState("");
  const [projCategoryId, setProjCategoryId] = useState("");
  const [projMediaType, setProjMediaType] = useState<"image" | "video">("image");
  const [projCoverUrl, setProjCoverUrl] = useState("");
  const [projVideoUrl, setProjVideoUrl] = useState("");
  const [projExternalUrl, setProjExternalUrl] = useState("");
  const [projTools, setProjTools] = useState("Figma, Cinema 4D, After Effects");
  const [projFeatured, setProjFeatured] = useState(true);
  const [projPublic, setProjPublic] = useState(true);
  const [savingProject, setSavingProject] = useState(false);

  // ─── Job Board & Application Modal States ───────────────────────────────────
  const [jobSearch, setJobSearch] = useState("");
  const [jobArrangementFilter, setJobArrangementFilter] = useState("all");
  const [showSavedJobsOnly, setShowSavedJobsOnly] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applyingJob, setApplyingJob] = useState<MarketplaceJobItem | null>(null);
  const [coverLetterInput, setCoverLetterInput] = useState("");
  const [customAnswersInput, setCustomAnswersInput] = useState<
    Record<string, string>
  >({});
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  // ─── Application Tracker States ─────────────────────────────────────────────
  const [appStageFilter, setAppStageFilter] = useState("all");

  // ─── Messaging & Notifications States ───────────────────────────────────────
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // ─── Profile, Skills, Experience & Education Form States ────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [yearsExp, setYearsExp] = useState("5");
  const [hourlyMin, setHourlyMin] = useState("85");
  const [hourlyMax, setHourlyMax] = useState("140");
  const [projectMin, setProjectMin] = useState("5000");
  const [projectMax, setProjectMax] = useState("25000");
  const [currency, setCurrency] = useState("USD");
  const [skillsInput, setSkillsInput] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [behanceUrl, setBehanceUrl] = useState("");
  const [dribbbleUrl, setDribbbleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // New Experience & Education Inputs
  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");

  // Load saved jobs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("ze_creative_saved_jobs");
        if (raw) setSavedJobIds(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) => {
      const next = prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId];
      if (typeof window !== "undefined") {
        localStorage.setItem("ze_creative_saved_jobs", JSON.stringify(next));
      }
      return next;
    });
  };

  // ─── Fetch All Creative Studio Data ─────────────────────────────────────────
  const fetchStudioData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const [
          profRes,
          projRes,
          jobsRes,
          appsRes,
          catsRes,
          convosRes,
          notifRes,
          annRes,
        ] = await Promise.allSettled([
          creativeProfileApi.get(),
          creativeProfileApi.listPortfolioProjects(),
          publicApi.getJobs({ per_page: 50 }),
          jobApplicationsApi.listMyApplications(),
          publicApi.getCategories(),
          messagingApi.listConversations(),
          notificationsApi.list(),
          publicApi.getAnnouncements("creative"),
        ]);

        if (profRes.status === "fulfilled" && profRes.value.data) {
          const p: CreativeProfileData = profRes.value.data;
          setProfile(p);
          setFirstName(p.user?.first_name || "");
          setLastName(p.user?.last_name || "");
          setPhone(p.user?.phone || "");
          setHeadline(p.professional_headline || "");
          setBio(p.bio || "");
          setLocation(p.location || "");
          setCountry(p.country || "");
          setYearsExp(
            p.years_experience !== null && p.years_experience !== undefined
              ? String(p.years_experience)
              : "5"
          );
          setHourlyMin(p.hourly_rate_min ? String(p.hourly_rate_min) : "");
          setHourlyMax(p.hourly_rate_max ? String(p.hourly_rate_max) : "");
          setProjectMin(p.project_rate_min ? String(p.project_rate_min) : "");
          setProjectMax(p.project_rate_max ? String(p.project_rate_max) : "");
          setCurrency(p.currency || "USD");
          setSkillsInput(
            (p.skills || [])
              .map((s) => s.name)
              .filter(Boolean)
              .join(", ")
          );
          setWebsiteUrl(p.social_links?.website || "");
          setBehanceUrl(p.social_links?.behance || "");
          setDribbbleUrl(p.social_links?.dribbble || "");
          setInstagramUrl(p.social_links?.instagram || "");
          setLinkedinUrl(p.social_links?.linkedin || "");
          setGithubUrl(p.social_links?.github || "");
          setYoutubeUrl(p.social_links?.youtube || "");
        }

        if (projRes.status === "fulfilled" && Array.isArray(projRes.value.data)) {
          setProjects(projRes.value.data);
        }

        if (jobsRes.status === "fulfilled" && jobsRes.value.data?.items) {
          const jList: MarketplaceJobItem[] = jobsRes.value.data.items;
          setMarketplaceJobs(jList);
          if (jList.length > 0) {
            setExpandedJobId((prev) => prev || jList[0].id);
          }
        }

        if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value.data)) {
          setMyApplications(appsRes.value.data);
        }

        if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value.data)) {
          setCategories(catsRes.value.data);
          if (catsRes.value.data.length > 0 && !projCategoryId) {
            setProjCategoryId(catsRes.value.data[0].id);
          }
        }

        if (
          convosRes.status === "fulfilled" &&
          Array.isArray(convosRes.value.data)
        ) {
          const cList: ConversationItem[] = convosRes.value.data;
          setConversations(cList);
          if (cList.length > 0) {
            setActiveConversationId((prev) => prev || cList[0].id);
          }
        }

        if (
          notifRes.status === "fulfilled" &&
          Array.isArray(notifRes.value.data)
        ) {
          setNotifications(notifRes.value.data);
        }

        if (annRes.status === "fulfilled" && Array.isArray(annRes.value.data)) {
          setAnnouncements(annRes.value.data);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projCategoryId]
  );

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === "creative") {
      fetchStudioData();
    }
  }, [mounted, isAuthenticated, user, fetchStudioData]);

  // Load messages when activeConversationId changes
  const fetchMessagesForConversation = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await messagingApi.getMessages(convId);
      if (Array.isArray(res.data)) {
        setChatMessages(res.data);
      }
    } catch {
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessagesForConversation(activeConversationId);
    }
  }, [activeConversationId, fetchMessagesForConversation]);

  // ─── Derived Telemetry & Filters ────────────────────────────────────────────
  const appliedJobIds = useMemo(
    () => new Set(myApplications.map((a) => a.job_id)),
    [myApplications]
  );

  const shortlistedOrInterviewCount = useMemo(
    () =>
      myApplications.filter((a) =>
        ["shortlisted", "interview_scheduled", "offered", "hired"].includes(
          a.status
        )
      ).length,
    [myApplications]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filteredMarketplaceJobs = useMemo(() => {
    return marketplaceJobs.filter((j) => {
      if (showSavedJobsOnly && !savedJobIds.includes(j.id)) return false;
      if (
        jobArrangementFilter !== "all" &&
        j.work_arrangement !== jobArrangementFilter
      )
        return false;
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchCompany = (j.company_name || "").toLowerCase().includes(q);
        const matchSkills = (j.preferred_skills || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchSkills) return false;
      }
      return true;
    });
  }, [
    marketplaceJobs,
    showSavedJobsOnly,
    savedJobIds,
    jobArrangementFilter,
    jobSearch,
  ]);

  const filteredMyApplications = useMemo(() => {
    if (appStageFilter === "all") return myApplications;
    return myApplications.filter((a) => a.status === appStageFilter);
  }, [myApplications, appStageFilter]);

  // ─── Handlers: Availability & Portfolio CRUD ────────────────────────────────
  const handleAvailabilityChange = async (newAvailability: string) => {
    try {
      await creativeProfileApi.update({ availability: newAvailability });
      setProfile((prev) =>
        prev ? { ...prev, availability: newAvailability } : prev
      );
      setNotice({
        type: "success",
        text: `Availability updated to ${newAvailability
          .replace(/_/g, " ")
          .toUpperCase()}.`,
      });
    } catch {
      setNotice({
        type: "warning",
        text: "Could not update availability status.",
      });
    }
  };

  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    setProjTitle("");
    setProjDescription("");
    setProjCategoryId(categories[0]?.id || "");
    setProjMediaType("image");
    setProjCoverUrl("");
    setProjVideoUrl("");
    setProjExternalUrl(websiteUrl || "");
    setProjTools("Figma, Cinema 4D, After Effects");
    setProjFeatured(true);
    setProjPublic(true);
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (p: PortfolioProjectItem) => {
    setEditingProjectId(p.id);
    setProjTitle(p.title);
    setProjDescription(p.description || "");
    setProjCategoryId(p.category_id || categories[0]?.id || "");
    setProjMediaType(p.video_url ? "video" : "image");
    setProjCoverUrl(p.cover_image_url || "");
    setProjVideoUrl(p.video_url || "");
    setProjExternalUrl(p.project_url || "");
    setProjTools((p.tools_used || []).join(", "));
    setProjFeatured(p.is_featured);
    setProjPublic(p.is_public);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    setSavingProject(true);

    const defaultCover =
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

    const payload: Record<string, unknown> = {
      title: projTitle.trim(),
      description: projDescription.trim() || null,
      category_id: projCategoryId || null,
      cover_image_url: projCoverUrl.trim() || defaultCover,
      video_url:
        projMediaType === "video"
          ? projVideoUrl.trim() ||
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          : null,
      project_url: projExternalUrl.trim() || null,
      tools_used: projTools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_featured: projFeatured,
      is_public: projPublic,
    };

    try {
      if (editingProjectId) {
        await creativeProfileApi.updatePortfolioProject(
          editingProjectId,
          payload
        );
        setNotice({
          type: "success",
          text: `Updated portfolio project "${projTitle}".`,
        });
      } else {
        await creativeProfileApi.addPortfolioProject(payload);
        setNotice({
          type: "success",
          text: `Published "${projTitle}" to your live portfolio showcase.`,
        });
      }
      setIsProjectModalOpen(false);
      await fetchStudioData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Could not save portfolio project.",
      });
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    try {
      await creativeProfileApi.deletePortfolioProject(id);
      setNotice({
        type: "info",
        text: `Removed "${title}" from portfolio.`,
      });
      await fetchStudioData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Could not delete portfolio project.",
      });
    }
  };

  // ─── Handlers: Apply to Job Brief ───────────────────────────────────────────
  const openApplyModal = (job: MarketplaceJobItem) => {
    setApplyingJob(job);
    setCoverLetterInput(
      `Hi ${
        job.company_name || "Hiring Team"
      } — I would love to be considered for the ${
        job.title
      } role. My background in ${
        headline || "creative direction and systems design"
      } aligns closely with your brief.`
    );
    const initialAnswers: Record<string, string> = {};
    (job.custom_questions || []).forEach((q) => {
      initialAnswers[q] = "";
    });
    setCustomAnswersInput(initialAnswers);
    setSelectedProjectIds(projects.slice(0, 2).map((p) => p.id));
  };

  const handleSubmitJobApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    setSubmittingApplication(true);
    try {
      await jobApplicationsApi.apply(applyingJob.id, {
        cover_letter: coverLetterInput.trim(),
        portfolio_project_ids: selectedProjectIds,
        custom_answers: customAnswersInput,
      });
      setNotice({
        type: "success",
        text: `Application submitted for "${applyingJob.title}" at ${applyingJob.company_name}!`,
      });
      setApplyingJob(null);
      await fetchStudioData(true);
      setActiveTab("applications");
    } catch (err: any) {
      setNotice({
        type: "warning",
        text:
          err?.response?.data?.detail ||
          "Could not submit job application.",
      });
    } finally {
      setSubmittingApplication(false);
    }
  };

  // ─── Handlers: Messaging & Notifications ────────────────────────────────────
  const handleMessageClient = async (
    clientUserId: string,
    clientName: string,
    roleTitle: string
  ) => {
    const existing = conversations.find(
      (c) => c.other_participant?.id === clientUserId
    );
    if (existing) {
      setActiveConversationId(existing.id);
      setActiveTab("messages");
      return;
    }

    try {
      const res = await messagingApi.createConversation({
        recipient_user_id: clientUserId,
        subject: `Regarding: ${roleTitle}`,
        initial_message: `Hi ${clientName} team — following up regarding the ${roleTitle} opportunity on Ze: Creatives.`,
      });
      await fetchStudioData(true);
      if (res.data?.conversation_id) {
        setActiveConversationId(res.data.conversation_id);
      }
      setActiveTab("messages");
    } catch {
      setNotice({
        type: "warning",
        text: "Could not start conversation with client.",
      });
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !messageInput.trim()) return;
    setSendingMessage(true);
    try {
      await messagingApi.sendMessage(activeConversationId, messageInput.trim());
      setMessageInput("");
      await fetchMessagesForConversation(activeConversationId);
      await fetchStudioData(true);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      await fetchStudioData(true);
    } catch {
      // ignore
    }
  };

  // ─── Handlers: Profile, Experience & Education ──────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await creativeProfileApi.update({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || null,
        professional_headline: headline.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        country: country.trim() || null,
        years_experience: yearsExp ? Number(yearsExp) : null,
        hourly_rate_min: hourlyMin ? Number(hourlyMin) : null,
        hourly_rate_max: hourlyMax ? Number(hourlyMax) : null,
        project_rate_min: projectMin ? Number(projectMin) : null,
        project_rate_max: projectMax ? Number(projectMax) : null,
        currency: currency || "USD",
        website_url: websiteUrl.trim() || null,
        behance_url: behanceUrl.trim() || null,
        dribbble_url: dribbbleUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        custom_skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNotice({
        type: "success",
        text: "Creative profile, rates, social links, and skills saved.",
      });
      await fetchStudioData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Could not save profile updates.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim()) return;
    try {
      await creativeProfileApi.addExperience({
        title: expTitle.trim(),
        company: expCompany.trim(),
        location: expLocation.trim() || null,
        is_current: true,
        description: expDescription.trim() || null,
      });
      setExpTitle("");
      setExpCompany("");
      setExpLocation("");
      setExpDescription("");
      setNotice({ type: "success", text: "Work experience added to CV." });
      await fetchStudioData(true);
    } catch {
      setNotice({ type: "warning", text: "Could not add work experience." });
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await creativeProfileApi.deleteExperience(id);
      await fetchStudioData(true);
    } catch {
      // ignore
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInstitution.trim()) return;
    try {
      await creativeProfileApi.addEducation({
        institution: eduInstitution.trim(),
        degree: eduDegree.trim() || null,
        field_of_study: eduField.trim() || null,
      });
      setEduInstitution("");
      setEduDegree("");
      setEduField("");
      setNotice({ type: "success", text: "Education added to CV." });
      await fetchStudioData(true);
    } catch {
      setNotice({ type: "warning", text: "Could not add education." });
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await creativeProfileApi.deleteEducation(id);
      await fetchStudioData(true);
    } catch {
      // ignore
    }
  };

  if (!mounted || !isAuthenticated || user?.role !== "creative") {
    return null;
  }

  const fullName =
    `${profile?.user?.first_name || user.first_name || ""} ${
      profile?.user?.last_name || user.last_name || ""
    }`.trim() || "Verified Creative";

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatSalary = (
    min?: number | null,
    max?: number | null,
    cur = "USD",
    disclosed = true
  ) => {
    if (!disclosed) return "Competitive";
    const sym =
      cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : `${cur} `;
    if (min && max)
      return `${sym}${min.toLocaleString()} – ${sym}${max.toLocaleString()}`;
    if (min) return `From ${sym}${min.toLocaleString()}`;
    if (max) return `Up to ${sym}${max.toLocaleString()}`;
    return "Disclosed";
  };

  const stageBadgeVariant = (status: string) => {
    if (["shortlisted", "offered", "hired"].includes(status)) return "success";
    if (["interview_scheduled", "under_review"].includes(status))
      return "secondary";
    if (status === "rejected") return "warning";
    return "subtle";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── Platform Broadcast Announcement Banner ─────────────────────── */}
          {announcements.length > 0 && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#171526] via-[#251E42] to-[#171526] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#7957F5]/30 border border-[#9B7CF7]/40 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-[#E9DFFF]" />
                </span>
                <div>
                  <p className="text-xs font-extrabold tracking-wide text-[#E9DFFF]">
                    {announcements[0].title}
                  </p>
                  <p className="text-xs text-white/80 mt-0.5">
                    {announcements[0].content}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-[#E9DFFF] self-start sm:self-center shrink-0">
                Creative Notice
              </span>
            </div>
          )}

          {/* ─── Action Feedback Toast ──────────────────────────────────────── */}
          {notice && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-semibold ${
                notice.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : notice.type === "info"
                  ? "bg-[#E9DFFF]/50 border-[#7957F5]/30 text-[#171526]"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice.text}</span>
              </div>
              <button
                onClick={() => setNotice(null)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ─── Live Creative Studio Header ────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7957F5] to-[#9B7CF7] text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#171526]">
                    {fullName}
                  </h1>
                  <ShieldCheck className="w-5 h-5 text-[#7957F5]" />
                  <Badge variant="success" size="sm">
                    Verified Creative
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-[#7957F5] mt-0.5">
                  {profile?.professional_headline ||
                    "Multidisciplinary Creative Specialist"}
                </p>
                <p className="text-xs text-[#777386] mt-0.5">
                  {profile?.location || "Global"} •{" "}
                  {profile?.years_experience
                    ? `${profile.years_experience}+ yrs experience`
                    : "Vetted Member"}
                  {profile?.hourly_rate_min
                    ? ` • $${profile.hourly_rate_min}–$${
                        profile.hourly_rate_max || profile.hourly_rate_min
                      }/hr`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => fetchStudioData(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-[#EEEAF5] bg-[#FCFAFF] hover:bg-[#E9DFFF]/30 text-xs font-bold text-[#171526] transition-colors"
                title="Sync Creative Studio"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#7957F5] ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Sync
              </button>

              <select
                value={profile?.availability || "available"}
                onChange={(e) => handleAvailabilityChange(e.target.value)}
                className="px-4 py-2.5 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs font-bold text-[#171526] outline-none cursor-pointer"
              >
                <option value="available">🟢 Available Now</option>
                <option value="open_to_offers">🟡 Open to Offers</option>
                <option value="not_available">🔴 Booked / Unavailable</option>
              </select>

              {profile?.id && (
                <Link href={`/creatives/${profile.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full py-2.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Public
                    Showcase Page
                  </Button>
                </Link>
              )}

              <Button
                size="sm"
                onClick={openCreateProjectModal}
                className="rounded-full py-2.5 bg-[#7957F5] hover:bg-[#6844E2] shadow-md"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Project / Reel
              </Button>
            </div>
          </div>

          {/* ─── External Portfolio Link Bar ────────────────────────────────── */}
          {websiteUrl && (
            <div className="mb-6 p-4 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Globe className="w-4 h-4 text-[#7957F5]" />
                <span className="font-bold text-[#171526]">
                  External Portfolio Domain:
                </span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7957F5] hover:underline font-semibold"
                >
                  {websiteUrl} ↗
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="text-xs font-semibold text-[#777386] hover:text-[#171526]"
                >
                  Edit Links
                </button>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1 hover:bg-[#d9caff] transition-colors"
                >
                  Open Live Site ↗
                </a>
              </div>
            </div>
          )}

          {/* ─── Studio Telemetry Grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div
              onClick={() => setActiveTab("portfolio")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Portfolio Projects
                </p>
                <FolderKanban className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1.5">
                {projects.length}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                Live in public directory
              </p>
            </div>

            <div
              onClick={() => setActiveTab("applications")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Active Applications
                </p>
                <Briefcase className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {myApplications.length}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                Submitted to clients
              </p>
            </div>

            <div
              onClick={() => {
                setAppStageFilter("shortlisted");
                setActiveTab("applications");
              }}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Shortlisted & Offers
                </p>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">
                {shortlistedOrInterviewCount}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                Active client interest
              </p>
            </div>

            <div
              onClick={() => setActiveTab("messages")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Client Threads & Alerts
                </p>
                <MessageSquare className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {conversations.length}
              </p>
              <p className="text-[11px] text-[#7957F5] font-semibold mt-0.5">
                {unreadNotificationsCount} unread alerts
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Profile Impressions
                </p>
                <Eye className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {profile?.profile_views || 0}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {profile?.is_public ? "Publicly Indexed" : "Hidden"}
              </p>
            </div>
          </div>

          {/* ─── 5-Tab Creative Studio Navigation ───────────────────────────── */}
          <div className="flex overflow-x-auto border-b border-[#EEEAF5] mb-8 gap-1">
            {[
              {
                id: "portfolio",
                label: `Portfolio & Motion Reels (${projects.length})`,
                icon: FolderKanban,
              },
              {
                id: "jobs",
                label: `Explore & Apply to Roles (${marketplaceJobs.length})`,
                icon: Sparkles,
              },
              {
                id: "applications",
                label: `Application Tracker (${myApplications.length})`,
                icon: Briefcase,
              },
              {
                id: "messages",
                label: `Client Messages & Alerts (${conversations.length})`,
                icon: MessageSquare,
              },
              {
                id: "profile",
                label: "Craft Profile, Skills & CV",
                icon: Settings,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CreativeTab)}
                  className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? "border-[#7957F5] text-[#7957F5]"
                      : "border-transparent text-[#777386] hover:text-[#171526]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-16 rounded-3xl bg-white border border-[#EEEAF5] text-center">
              <RefreshCw className="w-7 h-7 text-[#7957F5] animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#171526]">
                Loading Creative Studio...
              </p>
              <p className="text-xs text-[#777386] mt-1">
                Syncing your portfolio deliverables, job applications, and client messages.
              </p>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════════
                  TAB 1: PORTFOLIO & MOTION REELS STUDIO
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "portfolio" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-[#171526]">
                        Showcase Projects & Motion Reels
                      </h3>
                      <p className="text-xs text-[#777386]">
                        Projects published here are immediately visible on your public showcase page and when applying to client roles.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={openCreateProjectModal}
                      className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Project / Reel
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <FolderKanban className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h4 className="text-base font-extrabold text-[#171526]">
                        Your portfolio showcase is empty
                      </h4>
                      <p className="text-xs text-[#777386] max-w-md mx-auto mt-1 mb-5">
                        Add case studies, high-resolution visual work, or playable video reels so clients can evaluate your craft.
                      </p>
                      <Button
                        size="sm"
                        onClick={openCreateProjectModal}
                        className="rounded-full bg-[#7957F5]"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Publish First
                        Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((p) => {
                        const isVideo = Boolean(p.video_url);
                        return (
                          <div
                            key={p.id}
                            className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm overflow-hidden flex flex-col group hover:border-[#7957F5] transition-all"
                          >
                            <div className="relative h-48 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                              {isVideo ? (
                                <>
                                  <video
                                    src={p.video_url!}
                                    preload="metadata"
                                    className="w-full h-full object-cover opacity-85"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                                    <div className="w-10 h-10 rounded-full bg-[#7957F5] text-white flex items-center justify-center shadow-lg">
                                      <Play className="w-4 h-4 fill-white ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute top-3 left-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <Film className="w-3 h-3 text-[#9B7CF7]" />{" "}
                                    Motion Reel
                                  </span>
                                </>
                              ) : (
                                <>
                                  <img
                                    src={
                                      p.cover_image_url ||
                                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
                                    }
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-3 left-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3 text-pink-400" />{" "}
                                    Visual Case Study
                                  </span>
                                </>
                              )}

                              {p.is_featured && (
                                <span className="absolute top-3 right-3 bg-[#7957F5] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                  ★ Featured
                                </span>
                              )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <Badge variant="subtle" size="sm">
                                    {p.category_name || "Creative Case Study"}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-[#777386]">
                                    {p.is_public ? "Public" : "Private"}
                                  </span>
                                </div>
                                <h4 className="text-sm font-extrabold text-[#171526] line-clamp-1">
                                  {p.title}
                                </h4>
                                {p.description && (
                                  <p className="text-xs text-[#777386] mt-1 line-clamp-2 leading-relaxed">
                                    {p.description}
                                  </p>
                                )}

                                {p.tools_used && p.tools_used.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {p.tools_used.slice(0, 4).map((t) => (
                                      <span
                                        key={t}
                                        className="px-2 py-0.5 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[10px] font-semibold text-[#171526]"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-[#EEEAF5] flex items-center justify-between">
                                {p.project_url ? (
                                  <a
                                    href={p.project_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#7957F5] font-bold hover:underline text-xs"
                                  >
                                    Live Case Study ↗
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-[#777386]">
                                    Portfolio Deliverable
                                  </span>
                                )}

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditProjectModal(p)}
                                    className="p-1.5 rounded-lg border border-[#EEEAF5] hover:bg-[#FCFAFF] text-[#777386] hover:text-[#171526]"
                                    title="Edit project"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProject(p.id, p.title)
                                    }
                                    className="p-1.5 rounded-lg border border-[#EEEAF5] hover:bg-rose-50 text-[#777386] hover:text-rose-600"
                                    title="Delete project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 2: EXPLORE & APPLY TO CLIENT ROLES
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "jobs" && (
                <div className="space-y-6">
                  {/* Search & Filter Bar */}
                  <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowSavedJobsOnly(false)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          !showSavedJobsOnly
                            ? "bg-[#7957F5] text-white"
                            : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                        }`}
                      >
                        All Active Roles ({marketplaceJobs.length})
                      </button>
                      <button
                        onClick={() => setShowSavedJobsOnly(true)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          showSavedJobsOnly
                            ? "bg-[#7957F5] text-white"
                            : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        Saved Roles ({savedJobIds.length})
                      </button>

                      <select
                        value={jobArrangementFilter}
                        onChange={(e) =>
                          setJobArrangementFilter(e.target.value)
                        }
                        className="rounded-full bg-[#FCFAFF] border border-[#EEEAF5] px-3.5 py-1.5 text-xs font-semibold text-[#171526] outline-none"
                      >
                        <option value="all">All Arrangements</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-Site</option>
                      </select>
                    </div>

                    <div className="relative w-full md:w-72">
                      <Search className="w-3.5 h-3.5 text-[#777386] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="Search role title, studio, tools..."
                        className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                      />
                    </div>
                  </div>

                  {filteredMarketplaceJobs.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <Briefcase className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-[#171526]">
                        No active roles match your current filter
                      </h3>
                      <p className="text-xs text-[#777386] mt-1">
                        Try clearing your search or switching back to All Active Roles.
                      </p>
                    </div>
                  ) : (
                    filteredMarketplaceJobs.map((j) => {
                      const isExpanded = expandedJobId === j.id;
                      const hasApplied = appliedJobIds.has(j.id);
                      const isSaved = savedJobIds.includes(j.id);
                      const respList = (j.responsibilities || "")
                        .split(/[;\n]/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const reqList = (j.requirements || "")
                        .split(/[;\n]/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const skillList = (j.preferred_skills || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      return (
                        <div
                          key={j.id}
                          className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5]/40 transition-all overflow-hidden"
                        >
                          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#EEEAF5]/70">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF] px-2.5 py-0.5 rounded-full">
                                  {j.category?.name || "Design & Creative"}
                                </span>
                                <span className="text-xs font-bold text-[#171526]">
                                  {j.company_name || "Verified Client Studio"}
                                </span>
                                {j.is_client_verified && (
                                  <Badge variant="subtle" size="sm">
                                    ✓ Verified Client
                                  </Badge>
                                )}
                                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-emerald-600" />
                                  {formatSalary(
                                    j.salary_min,
                                    j.salary_max,
                                    j.currency,
                                    j.is_salary_disclosed
                                  )}
                                </span>
                              </div>
                              <h3 className="text-lg font-extrabold text-[#171526]">
                                {j.title}
                              </h3>
                              <p className="text-xs text-[#777386] mt-0.5">
                                {j.location || "Remote"} •{" "}
                                {(j.work_arrangement || "remote").toUpperCase()}{" "}
                                •{" "}
                                {(j.employment_type || "full_time")
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => toggleSaveJob(j.id)}
                                className={`p-2 rounded-full border transition-colors ${
                                  isSaved
                                    ? "bg-[#E9DFFF] border-[#7957F5] text-[#7957F5]"
                                    : "bg-[#FCFAFF] border-[#EEEAF5] text-[#777386]"
                                }`}
                                title="Bookmark role"
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>

                              <Link href={`/jobs/${j.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{" "}
                                  Full Page
                                </Button>
                              </Link>

                              {hasApplied ? (
                                <Badge variant="success" size="sm">
                                  ✓ Applied
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openApplyModal(j)}
                                  className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                                >
                                  <Send className="w-3.5 h-3.5 mr-1" /> Apply
                                  Now
                                </Button>
                              )}

                              <button
                                onClick={() =>
                                  setExpandedJobId(isExpanded ? null : j.id)
                                }
                                className="p-2 rounded-full border border-[#EEEAF5] hover:bg-[#FCFAFF] text-[#777386]"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#7957F5]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-6 sm:p-8 space-y-5 bg-[#FCFAFF]/50">
                              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5]">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-2">
                                  1. Scope, Vision & Deliverables
                                </h4>
                                <p className="text-xs text-[#777386] leading-relaxed">
                                  {j.description}
                                </p>
                                {respList.length > 0 && (
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#EEEAF5] text-xs text-[#777386]">
                                    {respList.map((r, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2"
                                      >
                                        <Check className="w-3.5 h-3.5 text-[#7957F5] shrink-0 mt-0.5" />
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5]">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-2">
                                    2. Candidate Requirements
                                  </h4>
                                  <ul className="space-y-1.5 text-xs text-[#777386]">
                                    {reqList.map((req, idx) => (
                                      <li key={idx}>• {req}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5]">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-2">
                                    3. Required Tools & Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {skillList.map((sk) => (
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
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 3: APPLICATION TRACKER & PIPELINE FEEDBACK
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "applications" && (
                <div className="space-y-6">
                  {/* Stage Filter Pills */}
                  <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5] flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all", label: "All Applications" },
                      { id: "submitted", label: "Submitted" },
                      { id: "under_review", label: "Under Review" },
                      { id: "shortlisted", label: "Shortlisted" },
                      { id: "interview_scheduled", label: "Interview Scheduled" },
                      { id: "offered", label: "Offered" },
                      { id: "hired", label: "Hired" },
                      { id: "rejected", label: "Passed" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setAppStageFilter(st.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          appStageFilter === st.id
                            ? "bg-[#7957F5] text-white"
                            : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {filteredMyApplications.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <Briefcase className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-[#171526]">
                        No job applications in this view
                      </h3>
                      <p className="text-xs text-[#777386] mt-1 mb-5">
                        Explore open roles from verified clients and submit your portfolio in 1 click.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("jobs")}
                        className="rounded-full bg-[#7957F5]"
                      >
                        Explore Active Roles
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMyApplications.map((a) => (
                        <div
                          key={a.id}
                          className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-base font-extrabold text-[#171526]">
                                  {a.job_title}
                                </h3>
                                <Badge
                                  variant={stageBadgeVariant(a.status) as any}
                                  size="sm"
                                >
                                  {a.status.replace(/_/g, " ").toUpperCase()}
                                </Badge>
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                  {formatSalary(
                                    a.salary_min,
                                    a.salary_max,
                                    a.currency,
                                    a.is_salary_disclosed
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-[#777386]">
                                <strong className="text-[#171526]">
                                  {a.client_name}
                                </strong>{" "}
                                • {a.category || "Design & Creative"} •{" "}
                                {a.location || "Remote"}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/jobs/${a.job_id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{" "}
                                  View Role Brief
                                </Button>
                              </Link>
                              {a.client_user_id && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleMessageClient(
                                      a.client_user_id!,
                                      a.client_name,
                                      a.job_title
                                    )
                                  }
                                  className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 mr-1" />{" "}
                                  Message Client
                                </Button>
                              )}
                            </div>
                          </div>

                          {a.client_notes && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
                              <span className="font-extrabold">
                                Client Hiring Team Note:{" "}
                              </span>
                              {a.client_notes}
                            </div>
                          )}

                          {a.cover_letter && (
                            <p className="text-xs text-[#777386] bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                              <strong className="text-[#171526]">
                                Your Cover Note:{" "}
                              </strong>
                              {a.cover_letter}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 4: CLIENT MESSAGES & NOTIFICATIONS INBOX
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  {/* Live Notifications / Role Invitations Bar */}
                  {notifications.length > 0 && (
                    <div className="p-5 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#7957F5]" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                            Recent Role Invitations & Stage Alerts (
                            {notifications.length})
                          </h3>
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={handleMarkAllNotificationsRead}
                            className="text-xs font-bold text-[#7957F5] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {notifications.slice(0, 4).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 rounded-2xl border text-xs ${
                              n.is_read
                                ? "bg-[#FCFAFF] border-[#EEEAF5] text-[#777386]"
                                : "bg-[#E9DFFF]/40 border-[#7957F5]/40 text-[#171526]"
                            }`}
                          >
                            <p className="font-extrabold text-[#171526]">
                              {n.title}
                            </p>
                            <p className="mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Split-Pane Conversations */}
                  <div className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                    <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#EEEAF5] bg-[#FCFAFF]/60 flex flex-col">
                      <div className="p-4 border-b border-[#EEEAF5]">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                          Client Conversations ({conversations.length})
                        </h3>
                      </div>

                      {conversations.length === 0 ? (
                        <div className="p-8 text-center my-auto">
                          <MessageSquare className="w-7 h-7 text-[#7957F5] mx-auto mb-2" />
                          <p className="text-xs font-bold text-[#171526]">
                            No client threads yet
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#EEEAF5] overflow-y-auto max-h-[440px]">
                          {conversations.map((c) => {
                            const isSelected = activeConversationId === c.id;
                            return (
                              <button
                                key={c.id}
                                onClick={() => setActiveConversationId(c.id)}
                                className={`w-full text-left p-4 transition-colors ${
                                  isSelected
                                    ? "bg-[#E9DFFF]/50 border-l-4 border-[#7957F5]"
                                    : "hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-extrabold text-[#171526] truncate">
                                    {c.other_participant?.name ||
                                      "Client Studio"}
                                  </p>
                                  <span className="text-[10px] font-semibold text-[#7957F5] uppercase">
                                    {c.other_participant?.role || "client"}
                                  </span>
                                </div>
                                {c.subject && (
                                  <p className="text-[11px] font-bold text-[#7957F5] truncate mt-0.5">
                                    {c.subject}
                                  </p>
                                )}
                                <p className="text-xs text-[#777386] line-clamp-1 mt-1">
                                  {c.last_message || "No messages yet"}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-8 flex flex-col justify-between bg-white">
                      {activeConversationId ? (
                        <>
                          <div className="p-4 sm:p-5 border-b border-[#EEEAF5] bg-[#FCFAFF]/40">
                            <h4 className="text-sm font-extrabold text-[#171526]">
                              {conversations.find(
                                (c) => c.id === activeConversationId
                              )?.other_participant?.name || "Client Thread"}
                            </h4>
                            <p className="text-xs text-[#7957F5] font-semibold">
                              {
                                conversations.find(
                                  (c) => c.id === activeConversationId
                                )?.subject
                              }
                            </p>
                          </div>

                          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[340px]">
                            {loadingMessages ? (
                              <p className="text-xs text-[#777386] text-center py-8">
                                Loading messages...
                              </p>
                            ) : (
                              chatMessages.map((m) => (
                                <div
                                  key={m.id}
                                  className={`flex flex-col ${
                                    m.is_me ? "items-end" : "items-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                      m.is_me
                                        ? "bg-[#7957F5] text-white rounded-br-none"
                                        : "bg-[#FCFAFF] border border-[#EEEAF5] text-[#171526] rounded-bl-none"
                                    }`}
                                  >
                                    <p className="font-bold text-[10px] opacity-80 mb-1">
                                      {m.is_me ? "You" : m.sender_name}
                                    </p>
                                    <p>{m.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <form
                            onSubmit={handleSendChatMessage}
                            className="p-4 border-t border-[#EEEAF5] flex items-center gap-3 bg-[#FCFAFF]/40"
                          >
                            <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              placeholder="Reply to client..."
                              className="flex-1 rounded-full bg-white border border-[#EEEAF5] px-4 py-2.5 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={sendingMessage || !messageInput.trim()}
                              className="rounded-full bg-[#7957F5] hover:bg-[#6844E2] px-5"
                            >
                              <Send className="w-3.5 h-3.5 mr-1" />
                              Send
                            </Button>
                          </form>
                        </>
                      ) : (
                        <div className="p-12 text-center my-auto">
                          <MessageSquare className="w-8 h-8 text-[#7957F5] mx-auto mb-2" />
                          <p className="text-sm font-bold text-[#171526]">
                            Select a conversation to view messages
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 5: CRAFT PROFILE, SKILLS, EXPERIENCE & EDUCATION EDITOR
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Main Profile, Rates, Skills & Links */}
                  <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm p-6 sm:p-8">
                    <h2 className="text-lg font-extrabold text-[#171526] mb-1">
                      Creative Identity, Rates & Skills
                    </h2>
                    <p className="text-xs text-[#777386] mb-6">
                      Powers your public showcase page (`/creatives/{profile?.id}`) and client search matching.
                    </p>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <Input
                          label="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                        <Input
                          label="Phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <Input
                        label="Professional Headline"
                        required
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g. Senior Art & Brand Identity Director"
                      />

                      <div>
                        <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                          Creative Bio & Craft Philosophy
                        </label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="Location (City)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="London, UK"
                        />
                        <Input
                          label="Country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="United Kingdom"
                        />
                        <Input
                          label="Years Experience"
                          type="number"
                          value={yearsExp}
                          onChange={(e) => setYearsExp(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Input
                          label="Hourly Min ($)"
                          type="number"
                          value={hourlyMin}
                          onChange={(e) => setHourlyMin(e.target.value)}
                        />
                        <Input
                          label="Hourly Max ($)"
                          type="number"
                          value={hourlyMax}
                          onChange={(e) => setHourlyMax(e.target.value)}
                        />
                        <Input
                          label="Project Min ($)"
                          type="number"
                          value={projectMin}
                          onChange={(e) => setProjectMin(e.target.value)}
                        />
                        <Input
                          label="Project Max ($)"
                          type="number"
                          value={projectMax}
                          onChange={(e) => setProjectMax(e.target.value)}
                        />
                      </div>

                      <Input
                        label="Craft Skills & Software (comma separated)"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="Figma, Design Systems, Typography, Cinema 4D, Houdini"
                      />

                      <div className="pt-3 border-t border-[#EEEAF5] grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Personal Portfolio Website"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://yourportfolio.design"
                        />
                        <Input
                          label="Behance URL"
                          value={behanceUrl}
                          onChange={(e) => setBehanceUrl(e.target.value)}
                        />
                        <Input
                          label="Dribbble URL"
                          value={dribbbleUrl}
                          onChange={(e) => setDribbbleUrl(e.target.value)}
                        />
                        <Input
                          label="LinkedIn URL"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end pt-4 border-t border-[#EEEAF5]">
                        <Button
                          type="submit"
                          disabled={savingProfile}
                          className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                        >
                          {savingProfile
                            ? "Saving Profile..."
                            : "Save Creative Profile"}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Work Experience & Education CV Builder */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Work Experience */}
                    <div className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#7957F5]" />
                        <h3 className="text-sm font-extrabold text-[#171526]">
                          Work Experience & Studio History
                        </h3>
                      </div>

                      {profile?.work_experiences &&
                        profile.work_experiences.length > 0 && (
                          <div className="space-y-2.5">
                            {profile.work_experiences.map((w) => (
                              <div
                                key={w.id}
                                className="p-3.5 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-start justify-between gap-2"
                              >
                                <div>
                                  <p className="text-xs font-extrabold text-[#171526]">
                                    {w.title} • {w.company}
                                  </p>
                                  {w.location && (
                                    <p className="text-[11px] text-[#777386]">
                                      {w.location}
                                    </p>
                                  )}
                                  {w.description && (
                                    <p className="text-[11px] text-[#777386] mt-1">
                                      {w.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteExperience(w.id)}
                                  className="text-[#777386] hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                      <form
                        onSubmit={handleAddExperience}
                        className="space-y-3 pt-2 border-t border-[#EEEAF5]"
                      >
                        <div className="grid grid-cols-2 gap-2.5">
                          <Input
                            label="Role Title"
                            required
                            value={expTitle}
                            onChange={(e) => setExpTitle(e.target.value)}
                            placeholder="Art Director"
                          />
                          <Input
                            label="Studio / Company"
                            required
                            value={expCompany}
                            onChange={(e) => setExpCompany(e.target.value)}
                            placeholder="Pentagram"
                          />
                        </div>
                        <Input
                          label="Highlight / Summary"
                          value={expDescription}
                          onChange={(e) => setExpDescription(e.target.value)}
                          placeholder="Led global rebrands and design systems..."
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-full w-full"
                        >
                          + Add Experience Entry
                        </Button>
                      </form>
                    </div>

                    {/* Education */}
                    <div className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#7957F5]" />
                        <h3 className="text-sm font-extrabold text-[#171526]">
                          Education & Credentials
                        </h3>
                      </div>

                      {profile?.education && profile.education.length > 0 && (
                        <div className="space-y-2.5">
                          {profile.education.map((ed) => (
                            <div
                              key={ed.id}
                              className="p-3.5 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-start justify-between gap-2"
                            >
                              <div>
                                <p className="text-xs font-extrabold text-[#171526]">
                                  {ed.institution}
                                </p>
                                <p className="text-[11px] text-[#777386]">
                                  {ed.degree} {ed.field_of_study}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteEducation(ed.id)}
                                className="text-[#777386] hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={handleAddEducation}
                        className="space-y-3 pt-2 border-t border-[#EEEAF5]"
                      >
                        <Input
                          label="Institution / School"
                          required
                          value={eduInstitution}
                          onChange={(e) => setEduInstitution(e.target.value)}
                          placeholder="Royal College of Art"
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                          <Input
                            label="Degree"
                            value={eduDegree}
                            onChange={(e) => setEduDegree(e.target.value)}
                            placeholder="BA / MA"
                          />
                          <Input
                            label="Discipline"
                            value={eduField}
                            onChange={(e) => setEduField(e.target.value)}
                            placeholder="Visual Communication"
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-full w-full"
                        >
                          + Add Education Entry
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL 1: ADD / EDIT PORTFOLIO PROJECT OR MOTION REEL
           ═══════════════════════════════════════════════════════════════════ */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EEEAF5] my-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7957F5]">
                  {editingProjectId
                    ? "Edit Portfolio Work"
                    : "New Portfolio Deliverable"}
                </span>
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="text-xs font-bold text-[#777386]"
                >
                  ✕ Close
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-[#171526] mb-1">
                {editingProjectId
                  ? "Update Case Study / Reel"
                  : "Publish Work to Portfolio"}
              </h3>
              <p className="text-xs text-[#777386] mb-5">
                Showcase high-resolution imagery or playable MP4/WebM motion reels to clients.
              </p>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <Input
                  label="Project Title"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Aether OS — Spatial Design System"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Discipline
                    </label>
                    <select
                      value={projCategoryId}
                      onChange={(e) => setProjCategoryId(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-3 py-2.5 text-xs text-[#171526] outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Media Format
                    </label>
                    <select
                      value={projMediaType}
                      onChange={(e) =>
                        setProjMediaType(e.target.value as "image" | "video")
                      }
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-3 py-2.5 text-xs text-[#171526] outline-none"
                    >
                      <option value="image">🖼️ Visual Case Study</option>
                      <option value="video">🎬 Video / Motion Reel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Case Study Summary & Impact
                  </label>
                  <textarea
                    rows={2}
                    value={projDescription}
                    onChange={(e) => setProjDescription(e.target.value)}
                    placeholder="Describe your creative role, deliverables, and brand outcomes..."
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <Input
                  label="Cover Image URL"
                  value={projCoverUrl}
                  onChange={(e) => setProjCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />

                {projMediaType === "video" && (
                  <Input
                    label="Playable Video Reel URL (MP4 / WebM)"
                    value={projVideoUrl}
                    onChange={(e) => setProjVideoUrl(e.target.value)}
                    placeholder="https://example.com/motion-reel.mp4"
                  />
                )}

                <Input
                  label="External Case Study URL"
                  value={projExternalUrl}
                  onChange={(e) => setProjExternalUrl(e.target.value)}
                  placeholder="https://elenarostova.design/project"
                />

                <Input
                  label="Tools Used (comma separated)"
                  value={projTools}
                  onChange={(e) => setProjTools(e.target.value)}
                  placeholder="Figma, Cinema 4D, After Effects"
                />

                <div className="flex items-center gap-5 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#171526] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projFeatured}
                      onChange={(e) => setProjFeatured(e.target.checked)}
                      className="accent-[#7957F5]"
                    />
                    Featured Work
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#171526] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projPublic}
                      onChange={(e) => setProjPublic(e.target.checked)}
                      className="accent-[#7957F5]"
                    />
                    Visible in Public Directory
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsProjectModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingProject}
                    className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                  >
                    {savingProject ? "Saving..." : "Publish to Portfolio"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL 2: 1-CLICK JOB APPLICATION COMPOSER
           ═══════════════════════════════════════════════════════════════════ */}
        {applyingJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EEEAF5] my-8 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7957F5]">
                  Submit Creative Application
                </span>
                <button
                  onClick={() => setApplyingJob(null)}
                  className="text-xs font-bold text-[#777386]"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#171526]">
                  {applyingJob.title}
                </h3>
                <p className="text-xs text-[#777386] mt-0.5">
                  {applyingJob.company_name} •{" "}
                  {formatSalary(
                    applyingJob.salary_min,
                    applyingJob.salary_max,
                    applyingJob.currency,
                    applyingJob.is_salary_disclosed
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmitJobApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Cover Note to Client Hiring Team
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={coverLetterInput}
                    onChange={(e) => setCoverLetterInput(e.target.value)}
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                {applyingJob.custom_questions &&
                  applyingJob.custom_questions.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#EEEAF5]">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                        Client Screening Questions
                      </p>
                      {applyingJob.custom_questions.map((q) => (
                        <div key={q}>
                          <label className="block text-xs font-semibold text-[#171526] mb-1">
                            {q}
                          </label>
                          <input
                            type="text"
                            required
                            value={customAnswersInput[q] || ""}
                            onChange={(e) =>
                              setCustomAnswersInput((prev) => ({
                                ...prev,
                                [q]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] px-3.5 py-2 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                {projects.length > 0 && (
                  <div className="pt-2 border-t border-[#EEEAF5]">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-2">
                      Attach Portfolio Projects ({selectedProjectIds.length}{" "}
                      selected)
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {projects.map((p) => {
                        const checked = selectedProjectIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] text-xs cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedProjectIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== p.id)
                                    : [...prev, p.id]
                                )
                              }
                              className="accent-[#7957F5]"
                            />
                            <span className="font-bold text-[#171526]">
                              {p.title}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setApplyingJob(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingApplication}
                    className="rounded-full bg-[#7957F5] hover:bg-[#6844E2] px-6"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {submittingApplication
                      ? "Submitting..."
                      : "Submit Application"}
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
