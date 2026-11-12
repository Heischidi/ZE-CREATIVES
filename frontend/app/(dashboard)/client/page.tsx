"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, getDashboardRoute } from "@/store/auth";
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
  Building2,
  DollarSign,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Check,
  RefreshCw,
  Edit,
  Trash2,
  Bookmark,
  Send,
  Globe,
  ShieldCheck,
  Sliders,
  Megaphone,
  X,
  UserCheck,
  UserX,
  Award,
  Pause,
  Play,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  clientProfileApi,
  jobsApi,
  jobApplicationsApi,
  publicApi,
  messagingApi,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientTab =
  | "jobs"
  | "applicants"
  | "talent"
  | "messages"
  | "organisation";

interface ClientProfileData {
  id: string;
  user_id: string;
  organisation_name: string;
  industry?: string | null;
  company_size?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  location?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  is_verified: boolean;
  onboarding_completed: boolean;
  user?: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
  } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ClientJobItem {
  id: string;
  title: string;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  preferred_skills?: string | null;
  location?: string | null;
  country?: string | null;
  status: string;
  category_id?: string | null;
  category?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  is_salary_disclosed?: boolean;
  is_featured?: boolean;
  custom_questions?: string[];
  application_deadline?: string | null;
  views_count: number;
  applications_count: number;
  created_at?: string | null;
  published_at?: string | null;
}

interface ApplicantItem {
  id: string;
  job_id: string;
  job_title: string;
  status: string;
  cover_letter?: string | null;
  custom_answers?: Record<string, string>;
  client_notes?: string | null;
  portfolio_project_ids?: string[];
  created_at?: string | null;
  is_viewed: boolean;
  creative?: {
    profile_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    years_experience?: number | null;
    hourly_rate_min?: number | null;
    hourly_rate_max?: number | null;
    currency?: string;
    availability?: string;
    avatar_url?: string | null;
    website_url?: string | null;
    skills?: string[];
    portfolio_projects?: {
      id: string;
      title: string;
      description?: string | null;
      cover_image_url?: string | null;
      project_url?: string | null;
      tools_used?: string[];
    }[];
  } | null;
}

interface DirectoryCreativeItem {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string | null;
  professional_headline?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  years_experience?: number | null;
  availability?: string | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  currency?: string;
  profile_views?: number;
  website_url?: string | null;
  skills?: { skill_id?: string | null; name?: string | null; custom?: string | null }[];
  portfolio_projects?: {
    id: string;
    title: string;
    cover_image_url?: string | null;
    project_url?: string | null;
    description?: string | null;
    tools_used?: string[];
  }[];
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

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at?: string | null;
}

const PIPELINE_STAGES = [
  { value: "all", label: "All Stages" },
  { value: "submitted", label: "New / Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "offered", label: "Offer Extended" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Passed / Rejected" },
];

export default function ClientDashboardPage() {
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
    if (user.role !== "client") {
      router.replace(getDashboardRoute(user.role));
    }
  }, [mounted, isAuthenticated, user, router]);

  // ─── Navigation & Global States ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ClientTab>("jobs");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // ─── Data States ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [jobs, setJobs] = useState<ClientJobItem[]>([]);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [talentPool, setTalentPool] = useState<DirectoryCreativeItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // ─── Jobs Tab States ────────────────────────────────────────────────────────
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [savingJob, setSavingJob] = useState(false);

  // Job Composer Form Fields
  const [jobFormTitle, setJobFormTitle] = useState("");
  const [jobFormCategoryId, setJobFormCategoryId] = useState("");
  const [jobFormArrangement, setJobFormArrangement] = useState("remote");
  const [jobFormType, setJobFormType] = useState("full_time");
  const [jobFormExperience, setJobFormExperience] = useState("senior");
  const [jobFormLocation, setJobFormLocation] = useState("Remote / New York, NY");
  const [jobFormCountry, setJobFormCountry] = useState("United States");
  const [jobFormSalaryMin, setJobFormSalaryMin] = useState("110000");
  const [jobFormSalaryMax, setJobFormSalaryMax] = useState("145000");
  const [jobFormCurrency, setJobFormCurrency] = useState("USD");
  const [jobFormDescription, setJobFormDescription] = useState("");
  const [jobFormResponsibilities, setJobFormResponsibilities] = useState("");
  const [jobFormRequirements, setJobFormRequirements] = useState("");
  const [jobFormSkills, setJobFormSkills] = useState("Figma, Design Systems, Brand Direction");
  const [jobFormQuestions, setJobFormQuestions] = useState("");
  const [jobFormPublishNow, setJobFormPublishNow] = useState(true);

  // ─── Applicants Tab States ──────────────────────────────────────────────────
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [inspectingApplicant, setInspectingApplicant] = useState<ApplicantItem | null>(null);
  const [applicantNotesInput, setApplicantNotesInput] = useState("");
  const [updatingApplicantStatus, setUpdatingApplicantStatus] = useState(false);

  // ─── Talent Finder & Shortlist States ───────────────────────────────────────
  const [talentSearch, setTalentSearch] = useState("");
  const [talentAvailabilityFilter, setTalentAvailabilityFilter] = useState("all");
  const [showSavedShortlistOnly, setShowSavedShortlistOnly] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [invitingCreative, setInvitingCreative] = useState<DirectoryCreativeItem | null>(null);
  const [inviteJobId, setInviteJobId] = useState<string>("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // ─── Messaging States ───────────────────────────────────────────────────────
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // ─── Organisation Settings Form States ──────────────────────────────────────
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgSize, setOrgSize] = useState("11-50");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgLocation, setOrgLocation] = useState("");
  const [orgCountry, setOrgCountry] = useState("");
  const [orgLinkedin, setOrgLinkedin] = useState("");
  const [orgTwitter, setOrgTwitter] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Load saved shortlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("ze_client_shortlist");
        if (raw) setShortlistedIds(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleShortlistCreative = (creativeId: string) => {
    setShortlistedIds((prev) => {
      const next = prev.includes(creativeId)
        ? prev.filter((id) => id !== creativeId)
        : [...prev, creativeId];
      if (typeof window !== "undefined") {
        localStorage.setItem("ze_client_shortlist", JSON.stringify(next));
      }
      return next;
    });
  };

  // ─── Fetch All Client Workspace Data ────────────────────────────────────────
  const fetchWorkspaceData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        profRes,
        catsRes,
        jobsRes,
        appsRes,
        creativesRes,
        convosRes,
        annRes,
      ] = await Promise.allSettled([
        clientProfileApi.get(),
        publicApi.getCategories(),
        jobsApi.list({ per_page: 50 }),
        jobApplicationsApi.listClientApplicants(),
        publicApi.getCreatives({ per_page: 50 }),
        messagingApi.listConversations(),
        publicApi.getAnnouncements("client"),
      ]);

      if (profRes.status === "fulfilled" && profRes.value.data) {
        const p: ClientProfileData = profRes.value.data;
        setProfile(p);
        setOrgName(p.organisation_name || "");
        setOrgIndustry(p.industry || "Design & Technology");
        setOrgSize(p.company_size || "11-50");
        setOrgWebsite(p.website_url || "");
        setOrgLocation(p.location || "");
        setOrgCountry(p.country || "");
        setOrgLinkedin(p.linkedin_url || "");
        setOrgTwitter(p.twitter_url || "");
        setOrgDescription(p.description || "");
        setContactFirstName(p.user?.first_name || "");
        setContactLastName(p.user?.last_name || "");
        setContactPhone(p.user?.phone || "");
      }

      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value.data)) {
        setCategories(catsRes.value.data);
        if (catsRes.value.data.length > 0 && !jobFormCategoryId) {
          setJobFormCategoryId(catsRes.value.data[0].id);
        }
      }

      if (jobsRes.status === "fulfilled" && jobsRes.value.data?.items) {
        const jItems: ClientJobItem[] = jobsRes.value.data.items;
        setJobs(jItems);
        if (jItems.length > 0) {
          setExpandedJobId((prev) => prev || jItems[0].id);
          setInviteJobId((prev) => prev || jItems[0].id);
        }
      }

      if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value.data)) {
        setApplicants(appsRes.value.data);
      }

      if (creativesRes.status === "fulfilled" && creativesRes.value.data?.items) {
        setTalentPool(creativesRes.value.data.items);
      }

      if (convosRes.status === "fulfilled" && Array.isArray(convosRes.value.data)) {
        const cList: ConversationItem[] = convosRes.value.data;
        setConversations(cList);
        if (cList.length > 0) {
          setActiveConversationId((prev) => prev || cList[0].id);
        }
      }

      if (annRes.status === "fulfilled" && Array.isArray(annRes.value.data)) {
        setAnnouncements(annRes.value.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobFormCategoryId]);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === "client") {
      fetchWorkspaceData();
    }
  }, [mounted, isAuthenticated, user, fetchWorkspaceData]);

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

  // ─── Derived Telemetry ──────────────────────────────────────────────────────
  const activeJobsCount = useMemo(
    () => jobs.filter((j) => j.status === "active").length,
    [jobs]
  );
  const totalJobViews = useMemo(
    () => jobs.reduce((acc, j) => acc + (j.views_count || 0), 0),
    [jobs]
  );
  const shortlistedApplicantsCount = useMemo(
    () =>
      applicants.filter((a) =>
        ["shortlisted", "interview_scheduled"].includes(a.status)
      ).length,
    [applicants]
  );
  const hiredOrOfferedCount = useMemo(
    () => applicants.filter((a) => ["offered", "hired"].includes(a.status)).length,
    [applicants]
  );

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (jobStatusFilter !== "all" && j.status !== jobStatusFilter) return false;
      if (jobSearchQuery.trim()) {
        const q = jobSearchQuery.toLowerCase();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchSkills = (j.preferred_skills || "").toLowerCase().includes(q);
        const matchCat = (j.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSkills && !matchCat) return false;
      }
      return true;
    });
  }, [jobs, jobStatusFilter, jobSearchQuery]);

  // Filtered Applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      if (selectedJobFilter !== "all" && a.job_id !== selectedJobFilter) return false;
      if (selectedStageFilter !== "all" && a.status !== selectedStageFilter)
        return false;
      if (applicantSearch.trim()) {
        const q = applicantSearch.toLowerCase();
        const name = (a.creative?.full_name || "").toLowerCase();
        const headline = (a.creative?.headline || "").toLowerCase();
        const role = (a.job_title || "").toLowerCase();
        if (!name.includes(q) && !headline.includes(q) && !role.includes(q))
          return false;
      }
      return true;
    });
  }, [applicants, selectedJobFilter, selectedStageFilter, applicantSearch]);

  // Filtered Talent Pool
  const filteredTalent = useMemo(() => {
    return talentPool.filter((c) => {
      if (showSavedShortlistOnly && !shortlistedIds.includes(c.id)) return false;
      if (
        talentAvailabilityFilter !== "all" &&
        c.availability !== talentAvailabilityFilter
      )
        return false;
      if (talentSearch.trim()) {
        const q = talentSearch.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const headline = (c.professional_headline || "").toLowerCase();
        const bio = (c.bio || "").toLowerCase();
        const skillMatch = (c.skills || []).some((s) =>
          (s.name || s.custom || "").toLowerCase().includes(q)
        );
        if (
          !fullName.includes(q) &&
          !headline.includes(q) &&
          !bio.includes(q) &&
          !skillMatch
        )
          return false;
      }
      return true;
    });
  }, [
    talentPool,
    showSavedShortlistOnly,
    shortlistedIds,
    talentAvailabilityFilter,
    talentSearch,
  ]);

  // ─── Handlers: Job Creation, Editing & Lifecycle ────────────────────────────
  const openCreateJobModal = () => {
    setEditingJobId(null);
    setJobFormTitle("");
    setJobFormCategoryId(categories[0]?.id || "");
    setJobFormArrangement("remote");
    setJobFormType("full_time");
    setJobFormExperience("senior");
    setJobFormLocation(profile?.location || "Remote / New York, NY");
    setJobFormCountry(profile?.country || "United States");
    setJobFormSalaryMin("110000");
    setJobFormSalaryMax("145000");
    setJobFormCurrency("USD");
    setJobFormDescription("");
    setJobFormResponsibilities("");
    setJobFormRequirements("");
    setJobFormSkills("Figma, Design Systems, Art Direction");
    setJobFormQuestions("");
    setJobFormPublishNow(true);
    setIsJobModalOpen(true);
  };

  const openEditJobModal = (j: ClientJobItem) => {
    setEditingJobId(j.id);
    setJobFormTitle(j.title);
    setJobFormCategoryId(j.category_id || categories[0]?.id || "");
    setJobFormArrangement(j.work_arrangement || "remote");
    setJobFormType(j.employment_type || "full_time");
    setJobFormExperience(j.experience_level || "senior");
    setJobFormLocation(j.location || "Remote");
    setJobFormCountry(j.country || "United States");
    setJobFormSalaryMin(j.salary_min ? String(j.salary_min) : "");
    setJobFormSalaryMax(j.salary_max ? String(j.salary_max) : "");
    setJobFormCurrency(j.currency || "USD");
    setJobFormDescription(j.description || "");
    setJobFormResponsibilities(j.responsibilities || "");
    setJobFormRequirements(j.requirements || "");
    setJobFormSkills(j.preferred_skills || "");
    setJobFormQuestions((j.custom_questions || []).join("\n"));
    setJobFormPublishNow(j.status === "active");
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormTitle.trim()) return;
    setSavingJob(true);

    const payload: Record<string, unknown> = {
      title: jobFormTitle.trim(),
      category_id: jobFormCategoryId || null,
      description: jobFormDescription.trim() || null,
      responsibilities: jobFormResponsibilities.trim() || null,
      requirements: jobFormRequirements.trim() || null,
      preferred_skills: jobFormSkills.trim() || null,
      location: jobFormLocation.trim() || "Remote",
      country: jobFormCountry.trim() || "United States",
      work_arrangement: jobFormArrangement,
      employment_type: jobFormType,
      experience_level: jobFormExperience,
      salary_min: jobFormSalaryMin ? Number(jobFormSalaryMin) : null,
      salary_max: jobFormSalaryMax ? Number(jobFormSalaryMax) : null,
      currency: jobFormCurrency || "USD",
      is_salary_disclosed: true,
      custom_questions: jobFormQuestions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean),
    };

    try {
      if (editingJobId) {
        payload.status = jobFormPublishNow ? "active" : "draft";
        await jobsApi.update(editingJobId, payload);
        setNotice({
          type: "success",
          text: `Updated role "${jobFormTitle}" successfully.`,
        });
      } else {
        payload.publish_immediately = jobFormPublishNow;
        const res = await jobsApi.create(payload);
        if (res.data?.id) {
          setExpandedJobId(res.data.id);
        }
        setNotice({
          type: "success",
          text: jobFormPublishNow
            ? `Published "${jobFormTitle}" to the live Ze: Creatives marketplace.`
            : `Saved "${jobFormTitle}" as a draft.`,
        });
      }
      setIsJobModalOpen(false);
      await fetchWorkspaceData(true);
    } catch (err: any) {
      setNotice({
        type: "warning",
        text:
          err?.response?.data?.detail ||
          "Could not save job brief. Please verify all fields.",
      });
    } finally {
      setSavingJob(false);
    }
  };

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await jobsApi.updateStatus(jobId, newStatus);
      setNotice({
        type: "success",
        text: `Job status updated to ${newStatus.toUpperCase()}.`,
      });
      await fetchWorkspaceData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Failed to update job status.",
      });
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    try {
      await jobsApi.delete(jobId);
      setNotice({
        type: "info",
        text: `Removed job posting "${title}".`,
      });
      await fetchWorkspaceData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Could not delete job posting.",
      });
    }
  };

  // ─── Handlers: Applicant Status Pipeline ────────────────────────────────────
  const openApplicantModal = (app: ApplicantItem) => {
    setInspectingApplicant(app);
    setApplicantNotesInput(app.client_notes || "");
  };

  const handleUpdateApplicantStage = async (
    applicationId: string,
    newStage: string
  ) => {
    setUpdatingApplicantStatus(true);
    try {
      await jobApplicationsApi.updateStatus(applicationId, {
        status: newStage,
        notes: applicantNotesInput.trim() || undefined,
      });
      setNotice({
        type: "success",
        text: `Candidate moved to ${newStage.replace(/_/g, " ").toUpperCase()}. Notification sent to Creative Studio.`,
      });
      setInspectingApplicant((prev) =>
        prev && prev.id === applicationId
          ? { ...prev, status: newStage, client_notes: applicantNotesInput }
          : prev
      );
      await fetchWorkspaceData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Could not update candidate stage.",
      });
    } finally {
      setUpdatingApplicantStatus(false);
    }
  };

  // ─── Handlers: Direct Talent Invitation & Messaging ─────────────────────────
  const handleSendJobInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingCreative) return;
    setSendingInvite(true);
    try {
      const res = await clientProfileApi.inviteCreative({
        creative_profile_id: invitingCreative.id,
        job_id: inviteJobId || undefined,
        message: inviteMessage.trim() || undefined,
      });
      setNotice({
        type: "success",
        text:
          res.data?.message ||
          `Direct invitation sent to ${invitingCreative.first_name} ${invitingCreative.last_name}.`,
      });
      const convId = res.data?.conversation_id;
      setInvitingCreative(null);
      setInviteMessage("");
      await fetchWorkspaceData(true);
      if (convId) {
        setActiveConversationId(convId);
      }
    } catch {
      setNotice({
        type: "warning",
        text: "Could not send invitation to creative.",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleMessageUser = async (
    recipientUserId: string,
    recipientName: string,
    contextSubject?: string
  ) => {
    // Check if conversation already exists with this user
    const existing = conversations.find(
      (c) => c.other_participant?.id === recipientUserId
    );
    if (existing) {
      setInspectingApplicant(null);
      setActiveConversationId(existing.id);
      setActiveTab("messages");
      return;
    }

    try {
      const res = await messagingApi.createConversation({
        recipient_user_id: recipientUserId,
        subject:
          contextSubject ||
          `Opportunity at ${profile?.organisation_name || "Our Studio"}`,
        initial_message: `Hi ${recipientName.split(" ")[0]} — reaching out from ${
          profile?.organisation_name || "our team"
        } regarding our creative role on Ze: Creatives.`,
      });
      setInspectingApplicant(null);
      await fetchWorkspaceData(true);
      if (res.data?.conversation_id) {
        setActiveConversationId(res.data.conversation_id);
      }
      setActiveTab("messages");
    } catch {
      setNotice({
        type: "warning",
        text: "Could not open conversation thread.",
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
      await fetchWorkspaceData(true);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Handler: Save Organisation Profile ─────────────────────────────────────
  const handleSaveOrganisation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await clientProfileApi.update({
        organisation_name: orgName.trim(),
        industry: orgIndustry.trim() || null,
        company_size: orgSize,
        website_url: orgWebsite.trim() || null,
        location: orgLocation.trim() || null,
        country: orgCountry.trim() || null,
        linkedin_url: orgLinkedin.trim() || null,
        twitter_url: orgTwitter.trim() || null,
        description: orgDescription.trim() || null,
        first_name: contactFirstName.trim() || undefined,
        last_name: contactLastName.trim() || undefined,
        phone: contactPhone.trim() || null,
      });
      setNotice({
        type: "success",
        text: "Organisation profile and brand identity updated.",
      });
      await fetchWorkspaceData(true);
    } catch {
      setNotice({
        type: "warning",
        text: "Failed to update organisation settings.",
      });
    } finally {
      setSavingOrg(false);
    }
  };

  if (!mounted || !isAuthenticated || user?.role !== "client") {
    return null;
  }

  const orgInitials = (profile?.organisation_name || "Client Studio")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const formatSalary = (j: ClientJobItem) => {
    if (!j.is_salary_disclosed) return "Competitive";
    const cur = j.currency || "USD";
    const sym = cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : `${cur} `;
    if (j.salary_min && j.salary_max) {
      return `${sym}${j.salary_min.toLocaleString()} – ${sym}${j.salary_max.toLocaleString()}`;
    }
    if (j.salary_min) return `From ${sym}${j.salary_min.toLocaleString()}`;
    if (j.salary_max) return `Up to ${sym}${j.salary_max.toLocaleString()}`;
    return "Disclosed in Brief";
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
                Platform Notice
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

          {/* ─── Live Organisation Header Banner ────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7957F5] to-[#9B7CF7] text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
                {orgInitials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#171526]">
                    {profile?.organisation_name || "Client Hiring Workspace"}
                  </h1>
                  {profile?.is_verified ? (
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3 h-3 mr-1 inline" />
                      Verified Client Org
                    </Badge>
                  ) : (
                    <Badge variant="subtle" size="sm">
                      Client Workspace
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#777386] mt-1">
                  {profile?.industry || "Creative & Technology"} •{" "}
                  {profile?.location || "Global"} •{" "}
                  {profile?.company_size
                    ? `${profile.company_size} team members`
                    : "Enterprise Hiring"}
                  {profile?.website_url && (
                    <>
                      {" "}
                      •{" "}
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#7957F5] font-semibold hover:underline"
                      >
                        {profile.website_url.replace(/^https?:\/\//, "")} ↗
                      </a>
                    </>
                  )}
                </p>
                {profile?.description && (
                  <p className="text-xs text-[#777386] mt-1.5 max-w-2xl line-clamp-1">
                    {profile.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => fetchWorkspaceData(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-[#EEEAF5] bg-[#FCFAFF] hover:bg-[#E9DFFF]/30 text-xs font-bold text-[#171526] transition-colors"
                title="Refresh live workspace"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#7957F5] ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Sync
              </button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveTab("talent")}
                className="rounded-full"
              >
                <Search className="w-4 h-4 mr-1.5" /> Scout Vetted Talent
              </Button>
              <Button
                size="md"
                onClick={openCreateJobModal}
                className="rounded-full shadow-md bg-[#7957F5] hover:bg-[#6844E2]"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Post New Role
              </Button>
            </div>
          </div>

          {/* ─── Executive Hiring Telemetry Grid ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div
              onClick={() => setActiveTab("jobs")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">Active Roles</p>
                <Briefcase className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1.5">
                {activeJobsCount}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                {jobs.length} total briefs created
              </p>
            </div>

            <div
              onClick={() => setActiveTab("applicants")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Received Applicants
                </p>
                <Users className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {applicants.length}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                Across all active roles
              </p>
            </div>

            <div
              onClick={() => {
                setSelectedStageFilter("shortlisted");
                setActiveTab("applicants");
              }}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Shortlisted & Interview
                </p>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">
                {shortlistedApplicantsCount}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                {hiredOrOfferedCount} offered / hired
              </p>
            </div>

            <div
              onClick={() => setActiveTab("talent")}
              className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Saved Talent Shortlist
                </p>
                <Bookmark className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {shortlistedIds.length}
              </p>
              <p className="text-[11px] text-[#777386] mt-0.5">
                {talentPool.length} vetted creatives available
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#777386] font-semibold">
                  Total Brief Views
                </p>
                <Eye className="w-4 h-4 text-[#7957F5]" />
              </div>
              <p className="text-2xl font-extrabold text-[#171526] mt-1.5">
                {totalJobViews}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                100% Pay Transparency
              </p>
            </div>
          </div>

          {/* ─── 5-Tab Client Workspace Navigation ──────────────────────────── */}
          <div className="flex overflow-x-auto border-b border-[#EEEAF5] mb-8 gap-1">
            {[
              {
                id: "jobs",
                label: `Job Briefs & Roles (${jobs.length})`,
                icon: Briefcase,
              },
              {
                id: "applicants",
                label: `Applicant Pipeline (${applicants.length})`,
                icon: Users,
              },
              {
                id: "talent",
                label: `Scout Creative Talent (${talentPool.length})`,
                icon: Sparkles,
              },
              {
                id: "messages",
                label: `Messages & Invites (${conversations.length})`,
                icon: MessageSquare,
              },
              {
                id: "organisation",
                label: "Organisation Profile",
                icon: Building2,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ClientTab)}
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
                Loading Client Hiring Workspace...
              </p>
              <p className="text-xs text-[#777386] mt-1">
                Syncing live job briefs, applicant pipeline, and vetted creative directory.
              </p>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════════
                  TAB 1: JOB BRIEFS & LIFECYCLE MANAGEMENT
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "jobs" && (
                <div className="space-y-6">
                  {/* Filters & Search Bar */}
                  <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "all", label: "All Briefs" },
                        { id: "active", label: "Active / Live" },
                        { id: "draft", label: "Drafts" },
                        { id: "paused", label: "Paused" },
                        { id: "closed", label: "Closed" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setJobStatusFilter(st.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            jobStatusFilter === st.id
                              ? "bg-[#7957F5] text-white"
                              : "bg-[#FCFAFF] text-[#777386] hover:text-[#171526] border border-[#EEEAF5]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-[#777386] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                          placeholder="Search title, category, skills..."
                          className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={openCreateJobModal}
                        className="rounded-full bg-[#7957F5] hover:bg-[#6844E2] shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> New Role
                      </Button>
                    </div>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <Briefcase className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-[#171526]">
                        No job briefs match your current filter
                      </h3>
                      <p className="text-xs text-[#777386] max-w-md mx-auto mt-1 mb-5">
                        Post a new creative role with clear scope, deliverables, and transparent compensation to attract vetted creatives.
                      </p>
                      <Button
                        size="md"
                        onClick={openCreateJobModal}
                        className="rounded-full bg-[#7957F5]"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Post Your First Role
                      </Button>
                    </div>
                  ) : (
                    filteredJobs.map((j) => {
                      const isExpanded = expandedJobId === j.id;
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
                          {/* Header Row */}
                          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#EEEAF5]/70 bg-gradient-to-r from-white via-white to-[#FCFAFF]">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF] px-2.5 py-0.5 rounded-full">
                                  {j.category || "Design & Creative"}
                                </span>
                                <Badge
                                  variant={
                                    j.status === "active"
                                      ? "success"
                                      : j.status === "draft"
                                      ? "secondary"
                                      : "subtle"
                                  }
                                  size="sm"
                                >
                                  {j.status.toUpperCase()}
                                </Badge>
                                {j.is_featured && (
                                  <Badge variant="subtle" size="sm">
                                    ★ Featured Brief
                                  </Badge>
                                )}
                                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-emerald-600" />
                                  {formatSalary(j)}
                                </span>
                                <span className="text-xs text-[#777386] flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{" "}
                                  {j.location || "Remote"} (
                                  {(j.work_arrangement || "remote").toUpperCase()})
                                </span>
                              </div>
                              <h3 className="text-lg font-extrabold text-[#171526]">
                                {j.title}
                              </h3>
                              <p className="text-xs text-[#777386] mt-0.5">
                                {(j.employment_type || "full_time")
                                  .replace("_", " ")
                                  .toUpperCase()}{" "}
                                • Experience:{" "}
                                {(j.experience_level || "senior").toUpperCase()} •{" "}
                                {j.views_count} views
                              </p>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedJobFilter(j.id);
                                  setActiveTab("applicants");
                                }}
                                className="text-xs font-bold text-[#7957F5] bg-[#E9DFFF]/60 hover:bg-[#E9DFFF] px-3.5 py-2 rounded-full transition-colors"
                              >
                                {j.applications_count} Applicants →
                              </button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditJobModal(j)}
                                className="rounded-full"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>

                              {j.status !== "active" ? (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleJobStatusChange(j.id, "active")
                                  }
                                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" /> Publish
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleJobStatusChange(j.id, "paused")
                                  }
                                  className="rounded-full"
                                >
                                  <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                                </Button>
                              )}

                              {j.status !== "closed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleJobStatusChange(j.id, "closed")
                                  }
                                  className="rounded-full text-[#777386]"
                                >
                                  Close
                                </Button>
                              )}

                              <Link href={`/jobs/${j.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{" "}
                                  Public Page
                                </Button>
                              </Link>

                              <button
                                onClick={() =>
                                  handleDeleteJob(j.id, j.title)
                                }
                                className="p-2 rounded-full border border-[#EEEAF5] hover:bg-rose-50 hover:text-rose-600 text-[#777386] transition-colors"
                                title="Delete job brief"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setExpandedJobId(isExpanded ? null : j.id)
                                }
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

                          {/* Expandable Brief Details */}
                          {isExpanded && (
                            <div className="p-6 sm:p-8 space-y-6 bg-[#FCFAFF]/50">
                              <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                                <div className="flex items-center gap-2 mb-2 text-[#7957F5]">
                                  <FileText className="w-4 h-4" />
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526]">
                                    1. Scope, Vision & Deliverables
                                  </h4>
                                </div>
                                <p className="text-sm text-[#777386] leading-relaxed">
                                  {j.description ||
                                    "No scope description specified yet."}
                                </p>

                                {respList.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-[#EEEAF5]">
                                    <p className="text-xs font-bold text-[#171526] mb-2">
                                      Key Responsibilities:
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#777386]">
                                      {respList.map((resp, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-start gap-2"
                                        >
                                          <Check className="w-3.5 h-3.5 text-[#7957F5] shrink-0 mt-0.5" />
                                          <span>{resp}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526] mb-3">
                                    2. Candidate Requirements
                                  </h4>
                                  {reqList.length > 0 ? (
                                    <ul className="space-y-2">
                                      {reqList.map((req, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-start gap-2 text-xs text-[#777386]"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#7957F5] mt-1.5 shrink-0" />
                                          <span>{req}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-[#777386]">
                                      Proven portfolio demonstrating craft mastery.
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl p-5 bg-white border border-[#EEEAF5]">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171526] mb-3">
                                    3. Compensation, Tools & Screening
                                  </h4>
                                  <div className="mb-4">
                                    <span className="text-xs text-[#777386] block">
                                      Disclosed Compensation:
                                    </span>
                                    <span className="text-base font-extrabold text-emerald-700">
                                      {formatSalary(j)}
                                    </span>
                                  </div>

                                  {skillList.length > 0 && (
                                    <div className="mb-4">
                                      <span className="text-xs font-bold text-[#171526] block mb-2">
                                        Required Technical Stack:
                                      </span>
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
                                  )}

                                  {j.custom_questions &&
                                    j.custom_questions.length > 0 && (
                                      <div className="pt-3 border-t border-[#EEEAF5]">
                                        <span className="text-xs font-bold text-[#171526] block mb-1.5">
                                          Custom Screening Questions:
                                        </span>
                                        <ul className="space-y-1 text-xs text-[#777386]">
                                          {j.custom_questions.map((q, idx) => (
                                            <li key={idx}>
                                              {idx + 1}. {q}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
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
                  TAB 2: APPLICANT PIPELINE & CANDIDATE EVALUATION (ATS)
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "applicants" && (
                <div className="space-y-6">
                  {/* Pipeline Filter Controls */}
                  <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-[#171526]">
                          Filter by Role:
                        </span>
                        <select
                          value={selectedJobFilter}
                          onChange={(e) => setSelectedJobFilter(e.target.value)}
                          className="rounded-full bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-2 text-xs font-semibold text-[#171526] outline-none"
                        >
                          <option value="all">
                            All Posted Roles ({applicants.length})
                          </option>
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.title} ({j.applications_count})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-[#777386] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={applicantSearch}
                          onChange={(e) => setApplicantSearch(e.target.value)}
                          placeholder="Search applicant name or skill..."
                          className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                        />
                      </div>
                    </div>

                    {/* Stage Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EEEAF5]">
                      {PIPELINE_STAGES.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => setSelectedStageFilter(st.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            selectedStageFilter === st.value
                              ? "bg-[#7957F5] text-white"
                              : "bg-[#FCFAFF] text-[#777386] hover:text-[#171526] border border-[#EEEAF5]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredApplicants.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <Users className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-[#171526]">
                        No applicants in this pipeline view
                      </h3>
                      <p className="text-xs text-[#777386] max-w-md mx-auto mt-1 mb-5">
                        Switch stages above or scout vetted creatives directly from the directory to invite them to your open roles.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("talent")}
                        className="rounded-full bg-[#7957F5]"
                      >
                        Scout & Invite Creatives
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApplicants.map((ap) => {
                        const cr = ap.creative;
                        const initials = (cr?.full_name || "CR")
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2);

                        return (
                          <div
                            key={ap.id}
                            className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5]/40 transition-all"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#E9DFFF] text-[#7957F5] flex items-center justify-center font-extrabold text-sm shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-extrabold text-[#171526]">
                                      {cr?.full_name || "Creative Candidate"}
                                    </h3>
                                    <Badge
                                      variant={stageBadgeVariant(ap.status) as any}
                                      size="sm"
                                    >
                                      {ap.status.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                    {cr?.hourly_rate_min && (
                                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                        ${cr.hourly_rate_min}
                                        {cr.hourly_rate_max
                                          ? `–$${cr.hourly_rate_max}`
                                          : ""}
                                        /hr
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-[#171526]/80 mt-0.5">
                                    {cr?.headline || "Vetted Creative"} •{" "}
                                    {cr?.location || "Remote"}
                                  </p>
                                  <p className="text-xs text-[#7957F5] font-bold mt-1">
                                    Applied for: {ap.job_title}
                                  </p>
                                  {ap.cover_letter && (
                                    <p className="text-xs text-[#777386] mt-2 max-w-2xl line-clamp-2 italic">
                                      &ldquo;{ap.cover_letter}&rdquo;
                                    </p>
                                  )}
                                  {cr?.skills && cr.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                      {cr.skills.slice(0, 6).map((sk) => (
                                        <span
                                          key={sk}
                                          className="px-2 py-0.5 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[10px] font-semibold text-[#171526]"
                                        >
                                          {sk}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => openApplicantModal(ap)}
                                  className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Review &
                                  Stage
                                </Button>

                                {cr?.profile_id && (
                                  <Link href={`/creatives/${cr.profile_id}`}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 mr-1" />{" "}
                                      Public Page
                                    </Button>
                                  </Link>
                                )}

                                {cr?.user_id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleMessageUser(
                                        cr.user_id,
                                        cr.full_name,
                                        `Application: ${ap.job_title}`
                                      )
                                    }
                                    className="rounded-full"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />{" "}
                                    Message
                                  </Button>
                                )}
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
                  TAB 3: SCOUT CREATIVE TALENT & DIRECT INVITATIONS
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "talent" && (
                <div className="space-y-6">
                  {/* Talent Filter Bar */}
                  <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowSavedShortlistOnly(false)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          !showSavedShortlistOnly
                            ? "bg-[#7957F5] text-white"
                            : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                        }`}
                      >
                        All Vetted Creatives ({talentPool.length})
                      </button>
                      <button
                        onClick={() => setShowSavedShortlistOnly(true)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          showSavedShortlistOnly
                            ? "bg-[#7957F5] text-white"
                            : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        Saved Shortlist ({shortlistedIds.length})
                      </button>

                      <select
                        value={talentAvailabilityFilter}
                        onChange={(e) =>
                          setTalentAvailabilityFilter(e.target.value)
                        }
                        className="rounded-full bg-[#FCFAFF] border border-[#EEEAF5] px-3.5 py-1.5 text-xs font-semibold text-[#171526] outline-none"
                      >
                        <option value="all">All Availability</option>
                        <option value="available">Available Now</option>
                        <option value="open_to_offers">Open to Offers</option>
                      </select>
                    </div>

                    <div className="relative w-full md:w-72">
                      <Search className="w-3.5 h-3.5 text-[#777386] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={talentSearch}
                        onChange={(e) => setTalentSearch(e.target.value)}
                        placeholder="Search by skill, tool, discipline..."
                        className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                      />
                    </div>
                  </div>

                  {filteredTalent.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                      <Sparkles className="w-8 h-8 text-[#7957F5] mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-[#171526]">
                        No creatives match your current filter
                      </h3>
                      <p className="text-xs text-[#777386] mt-1">
                        Try clearing your search or switching back to All Vetted Creatives.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredTalent.map((cr) => {
                        const isSaved = shortlistedIds.includes(cr.id);
                        const fullName = `${cr.first_name} ${cr.last_name}`;
                        const initials = `${cr.first_name?.[0] || ""}${
                          cr.last_name?.[0] || ""
                        }`.toUpperCase();
                        const skills = (cr.skills || [])
                          .map((s) => s.name || s.custom)
                          .filter(Boolean) as string[];

                        return (
                          <div
                            key={cr.id}
                            className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5]/40 transition-all flex flex-col justify-between gap-5"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7957F5] to-[#9B7CF7] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-base font-extrabold text-[#171526]">
                                        {fullName}
                                      </h3>
                                      <Badge variant="success" size="sm">
                                        Vetted
                                      </Badge>
                                    </div>
                                    <p className="text-xs font-semibold text-[#7957F5] mt-0.5">
                                      {cr.professional_headline ||
                                        "Creative Specialist"}
                                    </p>
                                    <p className="text-[11px] text-[#777386] mt-0.5">
                                      {cr.location || "Remote"} •{" "}
                                      {cr.years_experience
                                        ? `${cr.years_experience}+ yrs exp`
                                        : "Senior"}
                                      {cr.hourly_rate_min
                                        ? ` • $${cr.hourly_rate_min}–$${
                                            cr.hourly_rate_max ||
                                            cr.hourly_rate_min
                                          }/hr`
                                        : ""}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleShortlistCreative(cr.id)}
                                  className={`p-2 rounded-full border transition-colors ${
                                    isSaved
                                      ? "bg-[#E9DFFF] border-[#7957F5] text-[#7957F5]"
                                      : "bg-[#FCFAFF] border-[#EEEAF5] text-[#777386] hover:text-[#171526]"
                                  }`}
                                  title={
                                    isSaved
                                      ? "Remove from saved shortlist"
                                      : "Save to client shortlist"
                                  }
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>
                              </div>

                              {cr.bio && (
                                <p className="text-xs text-[#777386] mt-3 line-clamp-2 leading-relaxed">
                                  {cr.bio}
                                </p>
                              )}

                              {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {skills.slice(0, 6).map((sk) => (
                                    <span
                                      key={sk}
                                      className="px-2.5 py-0.5 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] text-[10px] font-semibold text-[#171526]"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {cr.portfolio_projects &&
                                cr.portfolio_projects.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-[#EEEAF5]">
                                    <p className="text-[11px] font-bold text-[#171526] mb-2">
                                      Featured Portfolio Work (
                                      {cr.portfolio_projects.length}):
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {cr.portfolio_projects
                                        .slice(0, 2)
                                        .map((p) => (
                                          <div
                                            key={p.id}
                                            className="p-2.5 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5]"
                                          >
                                            <p className="text-xs font-bold text-[#171526] truncate">
                                              {p.title}
                                            </p>
                                            <p className="text-[10px] text-[#777386] line-clamp-1 mt-0.5">
                                              {p.description}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EEEAF5]">
                              <Link href={`/creatives/${cr.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{" "}
                                  Full Portfolio
                                </Button>
                              </Link>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleMessageUser(cr.user_id, fullName)
                                  }
                                  className="rounded-full"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 mr-1" />{" "}
                                  Message
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setInvitingCreative(cr);
                                    setInviteJobId(jobs[0]?.id || "");
                                    setInviteMessage("");
                                  }}
                                  className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                                >
                                  <Send className="w-3.5 h-3.5 mr-1" /> Invite to
                                  Role
                                </Button>
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
                  TAB 4: CLIENT ↔ CREATIVE MESSAGING INBOX
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "messages" && (
                <div className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
                  {/* Conversation List Sidebar */}
                  <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#EEEAF5] bg-[#FCFAFF]/60 flex flex-col">
                    <div className="p-4 border-b border-[#EEEAF5] flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                        Direct Conversations ({conversations.length})
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveTab("talent")}
                        className="text-xs text-[#7957F5]"
                      >
                        + New Thread
                      </Button>
                    </div>

                    {conversations.length === 0 ? (
                      <div className="p-8 text-center my-auto">
                        <MessageSquare className="w-7 h-7 text-[#7957F5] mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#171526]">
                          No active threads yet
                        </p>
                        <p className="text-[11px] text-[#777386] mt-1">
                          Click &ldquo;Message&rdquo; or &ldquo;Invite to Role&rdquo; on any applicant or creative to start a thread.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#EEEAF5] overflow-y-auto max-h-[460px]">
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
                                  {c.other_participant?.name || "Creative"}
                                </p>
                                <span className="text-[10px] font-semibold text-[#7957F5] uppercase">
                                  {c.other_participant?.role || "creative"}
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

                  {/* Active Chat Thread */}
                  <div className="lg:col-span-8 flex flex-col justify-between bg-white">
                    {activeConversationId ? (
                      <>
                        <div className="p-4 sm:p-5 border-b border-[#EEEAF5] flex items-center justify-between bg-[#FCFAFF]/40">
                          <div>
                            <h4 className="text-sm font-extrabold text-[#171526]">
                              {conversations.find(
                                (c) => c.id === activeConversationId
                              )?.other_participant?.name || "Creative Thread"}
                            </h4>
                            <p className="text-xs text-[#7957F5] font-semibold">
                              {
                                conversations.find(
                                  (c) => c.id === activeConversationId
                                )?.subject
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[360px]">
                          {loadingMessages ? (
                            <p className="text-xs text-[#777386] text-center py-8">
                              Loading messages...
                            </p>
                          ) : chatMessages.length === 0 ? (
                            <p className="text-xs text-[#777386] text-center py-8">
                              Start the conversation below.
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
                            placeholder="Write a message to this creative..."
                            className="flex-1 rounded-full bg-white border border-[#EEEAF5] px-4 py-2.5 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={sendingMessage || !messageInput.trim()}
                            className="rounded-full bg-[#7957F5] hover:bg-[#6844E2] px-5"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            {sendingMessage ? "Sending..." : "Send"}
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
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 5: ORGANISATION PROFILE & HIRING IDENTITY
                 ═══════════════════════════════════════════════════════════════ */}
              {activeTab === "organisation" && (
                <div className="rounded-3xl bg-white border border-[#EEEAF5] shadow-sm p-6 sm:p-8 max-w-4xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EEEAF5]">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#171526]">
                        Organisation Profile & Brand Identity
                      </h2>
                      <p className="text-xs text-[#777386] mt-0.5">
                        This information is displayed on all your published job briefs and direct creative invitations.
                      </p>
                    </div>
                    {profile?.is_verified && (
                      <Badge variant="success" size="sm">
                        Verified Client Badge Active
                      </Badge>
                    )}
                  </div>

                  <form onSubmit={handleSaveOrganisation} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Organisation / Studio Name"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Apex Creative & Motion Studio"
                      />
                      <Input
                        label="Industry / Sector"
                        value={orgIndustry}
                        onChange={(e) => setOrgIndustry(e.target.value)}
                        placeholder="e.g. Design & Technology"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                          Company Size
                        </label>
                        <select
                          value={orgSize}
                          onChange={(e) => setOrgSize(e.target.value)}
                          className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                        >
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="500+">500+ employees</option>
                        </select>
                      </div>
                      <Input
                        label="City / HQ Location"
                        value={orgLocation}
                        onChange={(e) => setOrgLocation(e.target.value)}
                        placeholder="e.g. New York, NY"
                      />
                      <Input
                        label="Country"
                        value={orgCountry}
                        onChange={(e) => setOrgCountry(e.target.value)}
                        placeholder="e.g. United States"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Official Website URL"
                        value={orgWebsite}
                        onChange={(e) => setOrgWebsite(e.target.value)}
                        placeholder="https://yourstudio.com"
                      />
                      <Input
                        label="LinkedIn URL"
                        value={orgLinkedin}
                        onChange={(e) => setOrgLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                      />
                      <Input
                        label="X / Twitter URL"
                        value={orgTwitter}
                        onChange={(e) => setOrgTwitter(e.target.value)}
                        placeholder="https://x.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                        Organisation Overview & Creative Culture
                      </label>
                      <textarea
                        rows={4}
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                        placeholder="Describe your studio, clients, and what creatives can expect when collaborating with your team..."
                        className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-4 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#EEEAF5]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#171526] mb-3">
                        Primary Hiring Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="First Name"
                          value={contactFirstName}
                          onChange={(e) => setContactFirstName(e.target.value)}
                        />
                        <Input
                          label="Last Name"
                          value={contactLastName}
                          onChange={(e) => setContactLastName(e.target.value)}
                        />
                        <Input
                          label="Phone"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+1 555 000 0000"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#EEEAF5]">
                      <Button
                        type="submit"
                        disabled={savingOrg}
                        className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                      >
                        {savingOrg
                          ? "Saving Changes..."
                          : "Save Organisation Profile"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL 1: CREATE / EDIT JOB BRIEF
           ═══════════════════════════════════════════════════════════════════ */}
        {isJobModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EEEAF5] my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#7957F5]">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {editingJobId ? "Edit Job Brief" : "New Creative Role Brief"}
                  </span>
                </div>
                <button
                  onClick={() => setIsJobModalOpen(false)}
                  className="text-xs font-bold text-[#777386] hover:text-[#171526]"
                >
                  ✕ Close
                </button>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-[#171526] mb-1">
                {editingJobId
                  ? "Update Role Scope & Requirements"
                  : "Post Role with Transparent Scope & Pay"}
              </h3>
              <p className="text-xs text-[#777386] mb-6">
                Published roles appear immediately on the Ze: Creatives marketplace and can be attached to direct talent invitations.
              </p>

              <form onSubmit={handleSaveJob} className="space-y-4">
                <Input
                  label="Role Title"
                  required
                  value={jobFormTitle}
                  onChange={(e) => setJobFormTitle(e.target.value)}
                  placeholder="e.g. Lead Brand Identity & Motion Systems Director"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Creative Discipline
                    </label>
                    <select
                      value={jobFormCategoryId}
                      onChange={(e) => setJobFormCategoryId(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Experience Level
                    </label>
                    <select
                      value={jobFormExperience}
                      onChange={(e) => setJobFormExperience(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="junior">Junior (1-2 yrs)</option>
                      <option value="mid">Mid-Level (3-5 yrs)</option>
                      <option value="senior">Senior (5-8 yrs)</option>
                      <option value="lead">Lead / Principal (8+ yrs)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Work Arrangement
                    </label>
                    <select
                      value={jobFormArrangement}
                      onChange={(e) => setJobFormArrangement(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-Site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={jobFormType}
                      onChange={(e) => setJobFormType(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="full_time">Full-Time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance / Project</option>
                      <option value="part_time">Part-Time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    value={jobFormLocation}
                    onChange={(e) => setJobFormLocation(e.target.value)}
                    placeholder="Remote / New York, NY"
                  />
                  <Input
                    label="Country"
                    value={jobFormCountry}
                    onChange={(e) => setJobFormCountry(e.target.value)}
                    placeholder="United States"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Compensation Min"
                    type="number"
                    value={jobFormSalaryMin}
                    onChange={(e) => setJobFormSalaryMin(e.target.value)}
                    placeholder="110000"
                  />
                  <Input
                    label="Compensation Max"
                    type="number"
                    value={jobFormSalaryMax}
                    onChange={(e) => setJobFormSalaryMax(e.target.value)}
                    placeholder="145000"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                      Currency
                    </label>
                    <select
                      value={jobFormCurrency}
                      onChange={(e) => setJobFormCurrency(e.target.value)}
                      className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    1. Exact Scope, Vision & Deliverables
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={jobFormDescription}
                    onChange={(e) => setJobFormDescription(e.target.value)}
                    placeholder="Describe the project vision, team context, and exact creative deliverables..."
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Key Responsibilities (separate by new line or semicolon)
                  </label>
                  <textarea
                    rows={2}
                    value={jobFormResponsibilities}
                    onChange={(e) => setJobFormResponsibilities(e.target.value)}
                    placeholder="Lead design systems architecture&#10;Direct 3D motion & brand guidelines"
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    2. Candidate Requirements (separate by new line or semicolon)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={jobFormRequirements}
                    onChange={(e) => setJobFormRequirements(e.target.value)}
                    placeholder="5+ years senior experience&#10;Exceptional typography & systems portfolio"
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <Input
                  label="3. Required Software & Skills (comma separated)"
                  value={jobFormSkills}
                  onChange={(e) => setJobFormSkills(e.target.value)}
                  placeholder="Figma, Cinema 4D, Houdini, Typography"
                />

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    4. Custom Screening Questions for Applicants (optional, one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={jobFormQuestions}
                    onChange={(e) => setJobFormQuestions(e.target.value)}
                    placeholder="Share a link to your most relevant case study or reel.&#10;What is your earliest availability?"
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-sm text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobFormPublishNow}
                    onChange={(e) => setJobFormPublishNow(e.target.checked)}
                    className="w-4 h-4 accent-[#7957F5] rounded"
                  />
                  <span className="text-xs font-bold text-[#171526]">
                    Publish immediately to the live Ze: Creatives Job Board (uncheck to save as Draft)
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsJobModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingJob}
                    className="rounded-full px-6 bg-[#7957F5] hover:bg-[#6844E2]"
                  >
                    {savingJob
                      ? "Saving Brief..."
                      : editingJobId
                      ? "Save Role Updates"
                      : jobFormPublishNow
                      ? "Publish Live Role"
                      : "Save as Draft"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL 2: DEEP APPLICANT EVALUATION & PIPELINE STAGE ACTIONS
           ═══════════════════════════════════════════════════════════════════ */}
        {inspectingApplicant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EEEAF5] my-8 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#EEEAF5] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-[#171526]">
                      {inspectingApplicant.creative?.full_name ||
                        "Candidate Review"}
                    </h3>
                    <Badge
                      variant={
                        stageBadgeVariant(inspectingApplicant.status) as any
                      }
                      size="sm"
                    >
                      {inspectingApplicant.status
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7957F5] font-bold mt-1">
                    Role: {inspectingApplicant.job_title}
                  </p>
                  <p className="text-xs text-[#777386] mt-0.5">
                    {inspectingApplicant.creative?.headline} •{" "}
                    {inspectingApplicant.creative?.location}
                  </p>
                </div>
                <button
                  onClick={() => setInspectingApplicant(null)}
                  className="text-xs font-bold text-[#777386] hover:text-[#171526]"
                >
                  ✕ Close
                </button>
              </div>

              {/* Cover Letter */}
              <div className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-1.5">
                  Candidate Cover Note
                </h4>
                <p className="text-xs text-[#777386] leading-relaxed">
                  {inspectingApplicant.cover_letter ||
                    "No cover note submitted."}
                </p>
              </div>

              {/* Custom Screening Answers */}
              {inspectingApplicant.custom_answers &&
                Object.keys(inspectingApplicant.custom_answers).length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                      Screening Responses
                    </h4>
                    {Object.entries(inspectingApplicant.custom_answers).map(
                      ([q, ans]) => (
                        <div key={q} className="text-xs">
                          <span className="font-bold text-[#171526]">{q}: </span>
                          <span className="text-[#777386]">{ans}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Portfolio Projects */}
              {inspectingApplicant.creative?.portfolio_projects &&
                inspectingApplicant.creative.portfolio_projects.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-2.5">
                      Submitted Portfolio Work (
                      {inspectingApplicant.creative.portfolio_projects.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inspectingApplicant.creative.portfolio_projects.map(
                        (p) => (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl border border-[#EEEAF5] bg-[#FCFAFF]"
                          >
                            <p className="text-xs font-extrabold text-[#171526]">
                              {p.title}
                            </p>
                            <p className="text-[11px] text-[#777386] mt-1 line-clamp-2">
                              {p.description}
                            </p>
                            {p.project_url && (
                              <a
                                href={p.project_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-[11px] font-bold text-[#7957F5] hover:underline mt-2"
                              >
                                Inspect Case Study ↗
                              </a>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Internal Hiring Notes */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#171526] mb-1.5">
                  Internal Hiring Team Notes
                </label>
                <textarea
                  rows={2}
                  value={applicantNotesInput}
                  onChange={(e) => setApplicantNotesInput(e.target.value)}
                  placeholder="Record evaluation feedback, portfolio score, or interview availability..."
                  className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                />
              </div>

              {/* Pipeline Stage Transition Buttons */}
              <div className="pt-4 border-t border-[#EEEAF5] space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#171526]">
                  Move Candidate in Pipeline (Auto-Notifies Creative)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "under_review", label: "Mark Under Review" },
                    { value: "shortlisted", label: "★ Shortlist Candidate" },
                    {
                      value: "interview_scheduled",
                      label: "Schedule Interview",
                    },
                    { value: "offered", label: "Extend Offer" },
                    { value: "hired", label: "✓ Confirm Hired" },
                    { value: "rejected", label: "Pass / Reject" },
                  ].map((act) => (
                    <button
                      key={act.value}
                      disabled={updatingApplicantStatus}
                      onClick={() =>
                        handleUpdateApplicantStage(
                          inspectingApplicant.id,
                          act.value
                        )
                      }
                      className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                        inspectingApplicant.status === act.value
                          ? "bg-[#7957F5] text-white border-[#7957F5]"
                          : act.value === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-[#FCFAFF] text-[#171526] border-[#EEEAF5] hover:border-[#7957F5]"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EEEAF5]">
                {inspectingApplicant.creative?.profile_id ? (
                  <Link
                    href={`/creatives/${inspectingApplicant.creative.profile_id}`}
                  >
                    <Button size="sm" variant="outline" className="rounded-full">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Public
                      Creative Page
                    </Button>
                  </Link>
                ) : (
                  <span />
                )}

                {inspectingApplicant.creative?.user_id && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleMessageUser(
                        inspectingApplicant.creative!.user_id,
                        inspectingApplicant.creative!.full_name,
                        `Application: ${inspectingApplicant.job_title}`
                      )
                    }
                    className="rounded-full bg-[#7957F5] hover:bg-[#6844E2]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Message{" "}
                    {inspectingApplicant.creative.first_name}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL 3: INVITE VETTED CREATIVE TO ROLE / COMMISSION
           ═══════════════════════════════════════════════════════════════════ */}
        {invitingCreative && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EEEAF5] space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7957F5]">
                  Direct Creative Invitation
                </span>
                <button
                  onClick={() => setInvitingCreative(null)}
                  className="text-xs font-bold text-[#777386]"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#171526]">
                  Invite {invitingCreative.first_name}{" "}
                  {invitingCreative.last_name}
                </h3>
                <p className="text-xs text-[#777386] mt-0.5">
                  {invitingCreative.professional_headline}
                </p>
              </div>

              <form onSubmit={handleSendJobInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Select Active Role Brief
                  </label>
                  <select
                    value={inviteJobId}
                    onChange={(e) => setInviteJobId(e.target.value)}
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] px-4 py-3 text-sm text-[#171526] outline-none"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({formatSalary(j)})
                      </option>
                    ))}
                    <option value="">General Creative Retainer / Commission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171526] uppercase tracking-wider mb-1.5">
                    Personal Note to {invitingCreative.first_name}
                  </label>
                  <textarea
                    rows={3}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={`Hi ${invitingCreative.first_name}, we loved your portfolio on Ze: Creatives and would love to invite you to discuss our opening at ${
                      profile?.organisation_name || "our studio"
                    }...`}
                    className="w-full rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] p-3.5 text-xs text-[#171526] outline-none focus:border-[#7957F5]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#EEEAF5]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setInvitingCreative(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingInvite}
                    className="rounded-full bg-[#7957F5] hover:bg-[#6844E2] px-6"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {sendingInvite ? "Sending Invite..." : "Send Role Invitation"}
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
