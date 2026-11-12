"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  Briefcase,
  Building,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  BarChart3,
  Sparkles,
  Eye,
  Clock,
  AlertTriangle,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Megaphone,
  FileText,
  Lock,
  Unlock,
  Star,
  Sliders,
  Activity,
  Mail,
  MapPin,
  Globe,
  Phone,
  Award,
  Layers,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore, getDashboardRoute } from "@/store/auth";
import {
  adminApi,
  creativeApplicationApi,
  clientApplicationApi,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreativeAppItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  professional_headline?: string | null;
  bio?: string | null;
  years_experience?: number | null;
  creative_categories: string[];
  skills: string[];
  portfolio_links: string[];
  social_links?: Record<string, string>;
  additional_notes?: string | null;
  review_notes?: string | null;
  rejection_reason?: string | null;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
}

interface ClientAppItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  organisation_name: string;
  industry?: string | null;
  website?: string | null;
  company_size?: string | null;
  location?: string | null;
  intended_use?: string | null;
  additional_notes?: string | null;
  review_notes?: string | null;
  rejection_reason?: string | null;
  status: string;
  created_at?: string | null;
  reviewed_at?: string | null;
}

interface CreativeRosterItem {
  user_id: string;
  profile_id?: string | null;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  created_at: string;
  last_login_at?: string | null;
  professional_headline?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  years_experience?: number | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  currency: string;
  availability: string;
  is_public: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  profile_views: number;
  website_url?: string | null;
  dribbble_url?: string | null;
  behance_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  portfolio_projects_count: number;
  portfolio_projects: Array<{
    id: string;
    title: string;
    description?: string | null;
    project_url?: string | null;
    cover_image_url?: string | null;
    is_featured: boolean;
  }>;
  job_applications_count: number;
}

interface ClientRosterItem {
  user_id: string;
  profile_id?: string | null;
  first_name: string;
  last_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  status: string;
  created_at: string;
  last_login_at?: string | null;
  organisation_name: string;
  industry?: string | null;
  company_size?: string | null;
  website_url?: string | null;
  description?: string | null;
  location?: string | null;
  country?: string | null;
  is_verified: boolean;
  jobs_count: number;
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    location?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    currency: string;
    is_featured: boolean;
    applications_count: number;
    created_at: string;
  }>;
}

interface AdminJobItem {
  id: string;
  title: string;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  preferred_skills?: string | null;
  location?: string | null;
  work_arrangement?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency: string;
  status: string;
  is_featured: boolean;
  views_count: number;
  applications_count: number;
  moderation_notes?: string | null;
  category_name: string;
  organisation_name: string;
  client_email?: string | null;
  created_at: string;
}

interface AuditLogItem {
  id: string;
  admin_id: string;
  action: string;
  target_user_id?: string | null;
  description?: string | null;
  created_at: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target_roles?: string[] | null;
  is_active: boolean;
  created_at: string;
}

type AdminTab =
  | "overview"
  | "creative_vetting"
  | "client_vetting"
  | "creatives_roster"
  | "clients_roster"
  | "jobs_moderation"
  | "system_brain";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Strict role guard: only admin / super_admin can access /admin
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      router.replace(getDashboardRoute(user.role));
    }
  }, [mounted, isAuthenticated, user, router]);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    activationUrl?: string;
    type?: "success" | "warning" | "error";
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    total_users: 0,
    total_creatives: 0,
    total_clients: 0,
    total_admins: 1,
    pending_creative_applications: 0,
    total_creative_applications: 0,
    pending_client_applications: 0,
    total_client_applications: 0,
    active_jobs: 0,
    total_jobs: 0,
    total_applications: 0,
    suspended_accounts: 0,
    invited_accounts: 0,
    total_categories: 20,
    acceptance_rate: 14.2,
  });
  const [creativeApps, setCreativeApps] = useState<CreativeAppItem[]>([]);
  const [clientApps, setClientApps] = useState<ClientAppItem[]>([]);
  const [creativesRoster, setCreativesRoster] = useState<CreativeRosterItem[]>([]);
  const [clientsRoster, setClientsRoster] = useState<ClientRosterItem[]>([]);
  const [jobsList, setJobsList] = useState<AdminJobItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Filters & search
  const [creativeStatusFilter, setCreativeStatusFilter] = useState<string>("all");
  const [creativeSearch, setCreativeSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<string>("all");
  const [clientSearch, setClientSearch] = useState("");
  const [rosterSearch, setRosterSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");

  // Deep inspection drawers / modals
  const [selectedCreativeApp, setSelectedCreativeApp] = useState<CreativeAppItem | null>(null);
  const [selectedClientApp, setSelectedClientApp] = useState<ClientAppItem | null>(null);
  const [selectedCreativeProfile, setSelectedCreativeProfile] = useState<CreativeRosterItem | null>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<ClientRosterItem | null>(null);
  const [selectedJob, setSelectedJob] = useState<AdminJobItem | null>(null);

  // Vetting rubric & review inputs
  const [rubricScores, setRubricScores] = useState({
    craftsmanship: 5,
    technical: 4,
    trackRecord: 4,
    editorialFit: 5,
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Direct Provisioning Modal (Invite Creative / Client / Admin)
  const [provisionModalRole, setProvisionModalRole] = useState<"creative" | "client" | "admin" | null>(null);
  const [provFirstName, setProvFirstName] = useState("");
  const [provLastName, setProvLastName] = useState("");
  const [provEmail, setProvEmail] = useState("");
  const [provPhone, setProvPhone] = useState("");
  const [provSuperAdmin, setProvSuperAdmin] = useState(false);

  // Broadcast Announcement inputs
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState<"all" | "creative" | "client">("all");

  // Platform governance toggles
  const [govSettings, setGovSettings] = useState({
    strict_vetting_gate: true,
    require_portfolio_proof: true,
    auto_verify_approved_clients: true,
    curated_job_moderation: true,
  });

  const notify = (
    message: string,
    activationUrl?: string,
    type: "success" | "warning" | "error" = "success"
  ) => {
    setActionNotice({ message, activationUrl, type });
    setCopiedUrl(false);
  };

  const fetchAllAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dashRes,
        crAppsRes,
        clAppsRes,
        creativesRes,
        clientsRes,
        jobsRes,
        auditRes,
        annRes,
      ] = await Promise.allSettled([
        adminApi.getDashboard(),
        creativeApplicationApi.list({ per_page: 100 }),
        clientApplicationApi.list({ per_page: 100 }),
        adminApi.getCreatives(),
        adminApi.getClients(),
        adminApi.getJobs(),
        adminApi.getAuditLogs({ per_page: 50 }),
        adminApi.listAnnouncements(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data) {
        setStats((prev) => ({ ...prev, ...dashRes.value.data }));
      }
      if (crAppsRes.status === "fulfilled" && crAppsRes.value.data?.items) {
        setCreativeApps(crAppsRes.value.data.items);
      }
      if (clAppsRes.status === "fulfilled" && clAppsRes.value.data?.items) {
        setClientApps(clAppsRes.value.data.items);
      }
      if (creativesRes.status === "fulfilled" && creativesRes.value.data?.items) {
        setCreativesRoster(creativesRes.value.data.items);
      }
      if (clientsRes.status === "fulfilled" && clientsRes.value.data?.items) {
        setClientsRoster(clientsRes.value.data.items);
      }
      if (jobsRes.status === "fulfilled" && jobsRes.value.data?.items) {
        setJobsList(jobsRes.value.data.items);
      }
      if (auditRes.status === "fulfilled" && auditRes.value.data?.items) {
        setAuditLogs(auditRes.value.data.items);
      }
      if (annRes.status === "fulfilled" && Array.isArray(annRes.value.data)) {
        setAnnouncements(annRes.value.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && (user?.role === "admin" || user?.role === "super_admin")) {
      fetchAllAdminData();
    }
  }, [mounted, isAuthenticated, user, fetchAllAdminData]);

  // ─── Actions: Creative Application Vetting ──────────────────────────────────

  const handleReviewCreativeApp = async (
    appId: string,
    action: "approve" | "reject" | "under_review" | "request_info"
  ) => {
    setIsSubmittingReview(true);
    try {
      const avgScore = (
        (rubricScores.craftsmanship +
          rubricScores.technical +
          rubricScores.trackRecord +
          rubricScores.editorialFit) /
        4
      ).toFixed(1);
      const combinedNotes = reviewNotes
        ? `[Vetting Score: ${avgScore}/5.0] ${reviewNotes}`
        : `Vetting Score: ${avgScore}/5.0`;

      const res = await creativeApplicationApi.review(appId, {
        action,
        notes: combinedNotes,
        rejection_reason: rejectionReason || undefined,
      });

      notify(
        res.data?.message || `Application updated (${action}).`,
        res.data?.activation_url,
        action === "reject" ? "warning" : "success"
      );
      setSelectedCreativeApp(null);
      setReviewNotes("");
      setRejectionReason("");
      await fetchAllAdminData();
    } catch (err: any) {
      notify(
        err.response?.data?.detail || "Could not process creative application review.",
        undefined,
        "error"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ─── Actions: Client Application Vetting ────────────────────────────────────

  const handleReviewClientApp = async (
    appId: string,
    action: "approve" | "reject" | "under_review" | "request_info"
  ) => {
    setIsSubmittingReview(true);
    try {
      const res = await clientApplicationApi.review(appId, {
        action,
        notes: reviewNotes || undefined,
        rejection_reason: rejectionReason || undefined,
      });
      notify(
        res.data?.message || `Client request updated (${action}).`,
        res.data?.activation_url,
        action === "reject" ? "warning" : "success"
      );
      setSelectedClientApp(null);
      setReviewNotes("");
      setRejectionReason("");
      await fetchAllAdminData();
    } catch (err: any) {
      notify(
        err.response?.data?.detail || "Could not process client application review.",
        undefined,
        "error"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ─── Actions: Roster Governance (Creatives & Clients) ───────────────────────

  const handleCreativeGovernance = async (
    userId: string,
    updates: { is_public?: boolean; account_action?: string; availability?: string }
  ) => {
    try {
      const res = await adminApi.updateCreative(userId, updates);
      notify(res.data?.message || "Creative governance updated.");
      await fetchAllAdminData();
      if (selectedCreativeProfile && selectedCreativeProfile.user_id === userId) {
        setSelectedCreativeProfile((prev) =>
          prev
            ? {
                ...prev,
                is_public: updates.is_public ?? prev.is_public,
                status:
                  updates.account_action === "suspend"
                    ? "suspended"
                    : updates.account_action === "reactivate"
                    ? "active"
                    : updates.account_action === "deactivate"
                    ? "deactivated"
                    : prev.status,
              }
            : null
        );
      }
    } catch (err: any) {
      notify(err.response?.data?.detail || "Failed to update creative.", undefined, "error");
    }
  };

  const handleClientGovernance = async (
    userId: string,
    updates: { is_verified?: boolean; account_action?: string }
  ) => {
    try {
      const res = await adminApi.updateClient(userId, updates);
      notify(res.data?.message || "Client workspace governance updated.");
      await fetchAllAdminData();
      if (selectedClientProfile && selectedClientProfile.user_id === userId) {
        setSelectedClientProfile((prev) =>
          prev
            ? {
                ...prev,
                is_verified: updates.is_verified ?? prev.is_verified,
                status:
                  updates.account_action === "suspend"
                    ? "suspended"
                    : updates.account_action === "reactivate"
                    ? "active"
                    : updates.account_action === "deactivate"
                    ? "deactivated"
                    : prev.status,
              }
            : null
        );
      }
    } catch (err: any) {
      notify(err.response?.data?.detail || "Failed to update client workspace.", undefined, "error");
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      const res = await adminApi.resendInvitation(userId);
      notify(res.data?.message || "Invitation resent.", res.data?.activation_url);
    } catch (err: any) {
      notify(err.response?.data?.detail || "Could not resend invitation.", undefined, "error");
    }
  };

  // ─── Actions: Job Moderation ────────────────────────────────────────────────

  const handleModerateJob = async (
    jobId: string,
    updates: { status?: string; is_featured?: boolean; moderation_notes?: string }
  ) => {
    try {
      const res = await adminApi.moderateJob(jobId, updates);
      notify(res.data?.message || "Job moderation updated.");
      setSelectedJob(null);
      await fetchAllAdminData();
    } catch (err: any) {
      notify(err.response?.data?.detail || "Could not update job.", undefined, "error");
    }
  };

  // ─── Actions: Direct Provisioning & Announcements ───────────────────────────

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionModalRole) return;
    try {
      if (provisionModalRole === "admin") {
        const res = await adminApi.createAdmin({
          email: provEmail,
          first_name: provFirstName,
          last_name: provLastName,
          is_super_admin: provSuperAdmin,
        });
        notify(res.data?.message || "Admin invited.", res.data?.activation_url);
      } else {
        const res = await adminApi.createUser({
          email: provEmail,
          first_name: provFirstName,
          last_name: provLastName,
          phone: provPhone || undefined,
          role: provisionModalRole,
        });
        notify(res.data?.message || "User provisioned and invited.", res.data?.activation_url);
      }
      setProvisionModalRole(null);
      setProvFirstName("");
      setProvLastName("");
      setProvEmail("");
      setProvPhone("");
      await fetchAllAdminData();
    } catch (err: any) {
      notify(err.response?.data?.detail || "Failed to provision account.", undefined, "error");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      await adminApi.createAnnouncement({
        title: annTitle,
        content: annContent,
        target_roles: annTarget === "all" ? ["creative", "client"] : [annTarget],
      });
      notify("Platform announcement broadcast published.");
      setAnnTitle("");
      setAnnContent("");
      await fetchAllAdminData();
    } catch (err: any) {
      notify(err.response?.data?.detail || "Failed to publish announcement.", undefined, "error");
    }
  };

  if (!mounted || !isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
    return null;
  }

  // Filtered lists
  const filteredCreativeApps = creativeApps.filter((a) => {
    const matchesStatus = creativeStatusFilter === "all" || a.status === creativeStatusFilter;
    const q = creativeSearch.toLowerCase();
    const matchesSearch =
      !q ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.professional_headline || "").toLowerCase().includes(q) ||
      (a.creative_categories || []).some((c) => c.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const filteredClientApps = clientApps.filter((a) => {
    const matchesStatus = clientStatusFilter === "all" || a.status === clientStatusFilter;
    const q = clientSearch.toLowerCase();
    const matchesSearch =
      !q ||
      a.organisation_name.toLowerCase().includes(q) ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.industry || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredCreativesRoster = creativesRoster.filter((c) => {
    const q = rosterSearch.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.professional_headline || "").toLowerCase().includes(q) ||
      (c.location || "").toLowerCase().includes(q)
    );
  });

  const filteredClientsRoster = clientsRoster.filter((c) => {
    const q = rosterSearch.toLowerCase();
    return (
      !q ||
      c.organisation_name.toLowerCase().includes(q) ||
      c.contact_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.industry || "").toLowerCase().includes(q)
    );
  });

  const filteredJobs = jobsList.filter(
    (j) => jobStatusFilter === "all" || j.status === jobStatusFilter
  );

  const pendingCreativeCount = creativeApps.filter((a) =>
    ["pending", "under_review", "more_info_requested"].includes(a.status)
  ).length;
  const pendingClientCount = clientApps.filter((a) =>
    ["pending", "under_review", "more_info_requested"].includes(a.status)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── Executive Command Header ────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#171526] text-white mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#7957F5]/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#7957F5] text-white">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user.role === "super_admin" ? "Super Admin Brain" : "Admin Governance"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Vetting Gate Active
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Ze: Creatives — Central Governance & Vetting Brain
                </h1>
                <p className="text-xs sm:text-sm text-white/70 mt-1.5 max-w-2xl">
                  Screen, vet, and approve all Creative Talent and Client Organisations. Inspect every creative portfolio, client workspace, and marketplace job from a single command deck.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setProvisionModalRole("creative")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#7957F5] hover:bg-[#6644E0] text-white text-xs font-bold transition-all shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite Creative
                </button>
                <button
                  onClick={() => setProvisionModalRole("client")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
                >
                  <Building className="w-3.5 h-3.5" /> Invite Client
                </button>
                <button
                  onClick={fetchAllAdminData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                  title="Refresh live telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Action / Invitation Link Banner ─────────────────────────────── */}
          {actionNotice && (
            <div
              className={`p-4 mb-6 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                actionNotice.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : actionNotice.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p>{actionNotice.message}</p>
                  {actionNotice.activationUrl && (
                    <p className="text-[11px] opacity-80 mt-1 break-all">
                      Direct Activation Link:{" "}
                      <a
                        href={actionNotice.activationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold"
                      >
                        {actionNotice.activationUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {actionNotice.activationUrl && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(actionNotice.activationUrl!);
                      setCopiedUrl(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? "Copied Link" : "Copy Activation Link"}
                  </button>
                )}
                <button
                  onClick={() => setActionNotice(null)}
                  className="p-1 rounded-lg hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Navigation Tabs (7 Governance Workspaces) ───────────────────── */}
          <div className="flex overflow-x-auto border-b border-[#EEEAF5] mb-8 gap-1">
            {[
              { id: "overview", label: "System Brain & Overview", icon: BarChart3 },
              {
                id: "creative_vetting",
                label: `Creative Vetting (${pendingCreativeCount})`,
                icon: Sparkles,
              },
              {
                id: "client_vetting",
                label: `Client Vetting (${pendingClientCount})`,
                icon: Building,
              },
              {
                id: "creatives_roster",
                label: `Creatives Roster (${creativesRoster.length})`,
                icon: Users,
              },
              {
                id: "clients_roster",
                label: `Clients Roster (${clientsRoster.length})`,
                icon: ShieldCheck,
              },
              {
                id: "jobs_moderation",
                label: `Jobs Moderation (${jobsList.length})`,
                icon: Briefcase,
              },
              { id: "system_brain", label: "Governance & Audit Logs", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
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

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: SYSTEM BRAIN & EXECUTIVE OVERVIEW
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Primary Telemetry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab("creative_vetting")}
                  className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#777386] font-semibold">Pending Creative Vetting</p>
                    <Sparkles className="w-4 h-4 text-[#7957F5]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#7957F5] mt-2">{pendingCreativeCount}</p>
                  <p className="text-[11px] text-[#777386] mt-1">
                    {creativeApps.length} total creative applications
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("client_vetting")}
                  className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#777386] font-semibold">Pending Client Requests</p>
                    <Building className="w-4 h-4 text-[#7957F5]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#7957F5] mt-2">{pendingClientCount}</p>
                  <p className="text-[11px] text-[#777386] mt-1">
                    {clientApps.length} total client access requests
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("creatives_roster")}
                  className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#777386] font-semibold">Vetted Creatives Roster</p>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#171526] mt-2">
                    {creativesRoster.length}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {creativesRoster.filter((c) => c.is_public).length} visible in public directory
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("clients_roster")}
                  className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm hover:border-[#7957F5] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#777386] font-semibold">Verified Client Studios</p>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#171526] mt-2">
                    {clientsRoster.length}
                  </p>
                  <p className="text-[11px] text-[#777386] mt-1">
                    {jobsList.length} marketplace jobs posted
                  </p>
                </div>
              </div>

              {/* Secondary Telemetry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5]">
                  <p className="text-[11px] text-[#777386] font-medium">Active Live Jobs</p>
                  <p className="text-xl font-extrabold text-[#171526] mt-1">
                    {jobsList.filter((j) => j.status === "active").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5]">
                  <p className="text-[11px] text-[#777386] font-medium">Curated Acceptance Rate</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {stats.acceptance_rate}%
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5]">
                  <p className="text-[11px] text-[#777386] font-medium">Awaiting Activation</p>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">
                    {stats.invited_accounts}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#EEEAF5]">
                  <p className="text-[11px] text-[#777386] font-medium">Suspended Accounts</p>
                  <p className="text-xl font-extrabold text-rose-600 mt-1">
                    {stats.suspended_accounts}
                  </p>
                </div>
              </div>

              {/* Priority Vetting Queues Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Creative Applications */}
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#171526]">
                        Priority Creative Screening Queue
                      </h2>
                      <p className="text-xs text-[#777386]">
                        Inspect portfolio proof-of-work before provisioning access
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("creative_vetting")}
                    >
                      View All ({creativeApps.length})
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {creativeApps.slice(0, 4).map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#171526] truncate">
                              {app.first_name} {app.last_name}
                            </p>
                            <Badge
                              variant={
                                app.status === "approved"
                                  ? "success"
                                  : app.status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {app.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#7957F5] font-medium truncate mt-0.5">
                            {app.professional_headline || "Creative Applicant"}
                          </p>
                          <p className="text-[11px] text-[#777386] truncate">
                            {app.email} • {app.location || "Global"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedCreativeApp(app)}
                          className="rounded-full shrink-0"
                        >
                          Screen Dossier
                        </Button>
                      </div>
                    ))}
                    {creativeApps.length === 0 && (
                      <p className="text-xs text-[#777386] py-6 text-center">
                        No creative applications in queue.
                      </p>
                    )}
                  </div>
                </div>

                {/* Priority Client Applications */}
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#171526]">
                        Priority Client Organisation Requests
                      </h2>
                      <p className="text-xs text-[#777386]">
                        Verify company identity and hiring scope before provisioning workspace
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("client_vetting")}
                    >
                      View All ({clientApps.length})
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {clientApps.slice(0, 4).map((cl) => (
                      <div
                        key={cl.id}
                        className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#171526] truncate">
                              {cl.organisation_name}
                            </p>
                            <Badge
                              variant={
                                cl.status === "approved"
                                  ? "success"
                                  : cl.status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {cl.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#7957F5] font-medium truncate mt-0.5">
                            {cl.first_name} {cl.last_name} ({cl.industry || "Creative & Tech"})
                          </p>
                          <p className="text-[11px] text-[#777386] truncate">
                            {cl.email} • {cl.company_size || "Studio"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedClientApp(cl)}
                          className="rounded-full shrink-0"
                        >
                          Screen Client
                        </Button>
                      </div>
                    ))}
                    {clientApps.length === 0 && (
                      <p className="text-xs text-[#777386] py-6 text-center">
                        No client access requests in queue.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Access to Vetted Creatives & Clients Pages */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#171526]">
                        Active Creatives Directory Access
                      </h2>
                      <p className="text-xs text-[#777386]">
                        Inspect creative portfolios, public pages, and directory visibility
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("creatives_roster")}
                    >
                      Manage Roster →
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {creativesRoster.slice(0, 3).map((cr) => (
                      <div
                        key={cr.user_id}
                        className="p-3.5 rounded-2xl border border-[#EEEAF5] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171526] truncate">{cr.name}</p>
                          <p className="text-[11px] text-[#777386] truncate">
                            {cr.professional_headline || cr.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {cr.profile_id && (
                            <Link
                              href={`/creatives/${cr.profile_id}`}
                              className="px-2.5 py-1 rounded-lg bg-[#FCFAFF] border border-[#EEEAF5] text-[11px] font-semibold text-[#7957F5] hover:border-[#7957F5]"
                            >
                              Public Page ↗
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedCreativeProfile(cr)}
                            className="px-2.5 py-1 rounded-lg bg-[#171526] text-white text-[11px] font-semibold"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#171526]">
                        Active Client Workspaces Access
                      </h2>
                      <p className="text-xs text-[#777386]">
                        Inspect client organisations, verification status, and posted jobs
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("clients_roster")}
                    >
                      Manage Clients →
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {clientsRoster.slice(0, 3).map((cl) => (
                      <div
                        key={cl.user_id}
                        className="p-3.5 rounded-2xl border border-[#EEEAF5] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[#171526] truncate">
                              {cl.organisation_name}
                            </p>
                            {cl.is_verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#7957F5] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#777386] truncate">
                            {cl.contact_name} • {cl.jobs_count} job(s)
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedClientProfile(cl)}
                          className="px-2.5 py-1 rounded-lg bg-[#171526] text-white text-[11px] font-semibold shrink-0"
                        >
                          Inspect Workspace
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: CREATIVE VETTING & SCREENING QUEUE
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "creative_vetting" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "All Applications" },
                    { id: "pending", label: "Pending Review" },
                    { id: "under_review", label: "Under Review" },
                    { id: "more_info_requested", label: "More Info Requested" },
                    { id: "approved", label: "Approved" },
                    { id: "rejected", label: "Rejected" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setCreativeStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        creativeStatusFilter === st.id
                          ? "bg-[#7957F5] text-white"
                          : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5] hover:text-[#171526]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <div className="w-full md:w-72">
                  <Input
                    placeholder="Search applicant, email, discipline..."
                    leftIcon={<Search className="w-4 h-4" />}
                    value={creativeSearch}
                    onChange={(e) => setCreativeSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredCreativeApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-[#7957F5]/40 transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-extrabold text-[#171526]">
                          {app.first_name} {app.last_name}
                        </span>
                        <span className="text-xs text-[#777386]">({app.email})</span>
                        <Badge
                          variant={
                            app.status === "approved"
                              ? "success"
                              : app.status === "rejected"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {app.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs font-bold text-[#7957F5]">
                        {app.professional_headline || "Multidisciplinary Creative Specialist"}
                      </p>

                      {app.bio && (
                        <p className="text-xs text-[#777386] line-clamp-2 max-w-3xl">{app.bio}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#777386] pt-1">
                        {app.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#7957F5]" /> {app.location}
                          </span>
                        )}
                        {app.years_experience !== null && app.years_experience !== undefined && (
                          <span>• <strong>{app.years_experience} yrs</strong> experience</span>
                        )}
                        {app.creative_categories?.length > 0 && (
                          <span>
                            • Disciplines: <strong>{app.creative_categories.join(", ")}</strong>
                          </span>
                        )}
                      </div>

                      {app.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.skills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FCFAFF] border border-[#EEEAF5] text-[#171526]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.portfolio_links?.length > 0 && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {app.portfolio_links.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs font-bold text-[#7957F5] hover:underline"
                            >
                              Portfolio Proof #{idx + 1} <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedCreativeApp(app);
                          setReviewNotes(app.review_notes || "");
                          setRejectionReason(app.rejection_reason || "");
                        }}
                        className="rounded-full"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Open Screening Dossier
                      </Button>
                      {["pending", "under_review", "more_info_requested"].includes(app.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleReviewCreativeApp(app.id, "approve")}
                            className="rounded-full"
                          >
                            Approve & Invite
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReviewCreativeApp(app.id, "reject")}
                            className="rounded-full text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {filteredCreativeApps.length === 0 && (
                  <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                    <p className="text-sm font-bold text-[#171526]">
                      No creative applications match this filter
                    </p>
                    <p className="text-xs text-[#777386] mt-1">
                      Try switching the status filter to "All Applications" or clearing the search query.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: CLIENT VETTING & ACCESS QUEUE
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "client_vetting" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "All Client Requests" },
                    { id: "pending", label: "Pending Review" },
                    { id: "under_review", label: "Under Review" },
                    { id: "approved", label: "Approved" },
                    { id: "rejected", label: "Rejected" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setClientStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        clientStatusFilter === st.id
                          ? "bg-[#7957F5] text-white"
                          : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5] hover:text-[#171526]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <div className="w-full md:w-72">
                  <Input
                    placeholder="Search company, contact, industry..."
                    leftIcon={<Search className="w-4 h-4" />}
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredClientApps.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-[#7957F5]/40 transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-extrabold text-[#171526]">
                          {cl.organisation_name}
                        </span>
                        <Badge
                          variant={
                            cl.status === "approved"
                              ? "success"
                              : cl.status === "rejected"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {cl.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#777386]">
                        Representative: <strong>{cl.first_name} {cl.last_name}</strong> ({cl.email})
                        {cl.industry ? ` • ${cl.industry}` : ""}
                        {cl.company_size ? ` • ${cl.company_size}` : ""}
                        {cl.location ? ` • ${cl.location}` : ""}
                      </p>

                      {cl.intended_use && (
                        <p className="text-xs text-[#171526] bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                          &ldquo;{cl.intended_use}&rdquo;
                        </p>
                      )}

                      {cl.website && (
                        <div>
                          <a
                            href={cl.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs font-bold text-[#7957F5] hover:underline"
                          >
                            Verify Domain & Official Website ({cl.website}){" "}
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedClientApp(cl);
                          setReviewNotes(cl.review_notes || "");
                          setRejectionReason(cl.rejection_reason || "");
                        }}
                        className="rounded-full"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Open Client Dossier
                      </Button>
                      {["pending", "under_review", "more_info_requested"].includes(cl.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleReviewClientApp(cl.id, "approve")}
                            className="rounded-full"
                          >
                            Approve & Provision
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReviewClientApp(cl.id, "reject")}
                            className="rounded-full text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {filteredClientApps.length === 0 && (
                  <div className="p-12 rounded-3xl bg-white border border-[#EEEAF5] text-center">
                    <p className="text-sm font-bold text-[#171526]">
                      No client access requests match this filter
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: CREATIVES ROSTER & PROFILE GOVERNANCE
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "creatives_roster" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#171526]">
                    Vetted Creatives Roster & Profile Governance
                  </h2>
                  <p className="text-xs text-[#777386]">
                    Inspect any creative&apos;s portfolio, public directory page, onboarding status, and account permissions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-64">
                    <Input
                      placeholder="Search creative roster..."
                      leftIcon={<Search className="w-4 h-4" />}
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setProvisionModalRole("creative")}
                    className="rounded-full shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite Creative
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredCreativesRoster.map((cr) => (
                  <div
                    key={cr.user_id}
                    className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col justify-between gap-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-[#171526]">{cr.name}</h3>
                            <Badge
                              variant={
                                cr.status === "active"
                                  ? "success"
                                  : cr.status === "suspended"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {cr.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-[#7957F5] mt-0.5">
                            {cr.professional_headline || "Vetted Creative Member"}
                          </p>
                          <p className="text-xs text-[#777386] mt-0.5">
                            {cr.email} {cr.location ? `• ${cr.location}` : ""}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleCreativeGovernance(cr.user_id, { is_public: !cr.is_public })
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            cr.is_public
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {cr.is_public ? "Public in Directory" : "Hidden"}
                        </button>
                      </div>

                      {cr.bio && (
                        <p className="text-xs text-[#777386] line-clamp-2 mt-3">{cr.bio}</p>
                      )}

                      <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] text-center">
                        <div>
                          <p className="text-[10px] text-[#777386] uppercase font-bold">Rate</p>
                          <p className="text-xs font-extrabold text-[#171526]">
                            {cr.hourly_rate_min
                              ? `$${cr.hourly_rate_min}–$${cr.hourly_rate_max || cr.hourly_rate_min}/hr`
                              : "Custom"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#777386] uppercase font-bold">Projects</p>
                          <p className="text-xs font-extrabold text-[#171526]">
                            {cr.portfolio_projects_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#777386] uppercase font-bold">Job Apps</p>
                          <p className="text-xs font-extrabold text-[#171526]">
                            {cr.job_applications_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EEEAF5]">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedCreativeProfile(cr)}
                          className="rounded-full"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Full Dossier
                        </Button>
                        {cr.profile_id && (
                          <Link
                            href={`/creatives/${cr.profile_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EEEAF5] text-xs font-bold text-[#7957F5] hover:border-[#7957F5]"
                          >
                            Public Page <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cr.status === "invitation_sent" && (
                          <button
                            onClick={() => handleResendInvitation(cr.user_id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold hover:bg-amber-100"
                          >
                            Resend Invite
                          </button>
                        )}
                        {cr.status === "active" ? (
                          <button
                            onClick={() =>
                              handleCreativeGovernance(cr.user_id, { account_action: "suspend" })
                            }
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleCreativeGovernance(cr.user_id, { account_action: "reactivate" })
                            }
                            className="px-2.5 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: CLIENTS ROSTER & WORKSPACE GOVERNANCE
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "clients_roster" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#171526]">
                    Client Organisations & Workspace Governance
                  </h2>
                  <p className="text-xs text-[#777386]">
                    Inspect client organisations, verify studio badges, review their posted jobs, and manage workspace access.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-64">
                    <Input
                      placeholder="Search client studio..."
                      leftIcon={<Search className="w-4 h-4" />}
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setProvisionModalRole("client")}
                    className="rounded-full shrink-0"
                  >
                    <Building className="w-3.5 h-3.5 mr-1.5" /> Invite Client
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredClientsRoster.map((cl) => (
                  <div
                    key={cl.user_id}
                    className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col justify-between gap-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-[#171526]">
                              {cl.organisation_name}
                            </h3>
                            <Badge
                              variant={
                                cl.status === "active"
                                  ? "success"
                                  : cl.status === "suspended"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {cl.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-[#7957F5] mt-0.5">
                            Contact: {cl.contact_name} ({cl.email})
                          </p>
                          <p className="text-xs text-[#777386] mt-0.5">
                            {cl.industry || "Design & Technology"}{" "}
                            {cl.company_size ? `• ${cl.company_size}` : ""}{" "}
                            {cl.location ? `• ${cl.location}` : ""}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleClientGovernance(cl.user_id, { is_verified: !cl.is_verified })
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            cl.is_verified
                              ? "bg-[#E9DFFF] text-[#7957F5] border-[#7957F5]/30"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {cl.is_verified ? "✓ Verified Client" : "Unverified"}
                        </button>
                      </div>

                      {cl.description && (
                        <p className="text-xs text-[#777386] line-clamp-2 mt-3">{cl.description}</p>
                      )}

                      {/* Client's Posted Jobs Preview */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                        <p className="text-[11px] font-bold text-[#171526] mb-2">
                          Posted Jobs ({cl.jobs_count})
                        </p>
                        {cl.jobs.length > 0 ? (
                          <div className="space-y-1.5">
                            {cl.jobs.slice(0, 3).map((j) => (
                              <div
                                key={j.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <Link
                                  href={`/jobs/${j.id}`}
                                  className="font-semibold text-[#7957F5] hover:underline truncate"
                                >
                                  {j.title} ↗
                                </Link>
                                <span className="text-[11px] text-[#777386] shrink-0">
                                  {j.status.toUpperCase()} • {j.applications_count} apps
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#777386]">No jobs posted yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EEEAF5]">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedClientProfile(cl)}
                          className="rounded-full"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Workspace
                        </Button>
                        {cl.website_url && (
                          <a
                            href={cl.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EEEAF5] text-xs font-bold text-[#7957F5] hover:border-[#7957F5]"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cl.status === "invitation_sent" && (
                          <button
                            onClick={() => handleResendInvitation(cl.user_id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold hover:bg-amber-100"
                          >
                            Resend Invite
                          </button>
                        )}
                        {cl.status === "active" ? (
                          <button
                            onClick={() =>
                              handleClientGovernance(cl.user_id, { account_action: "suspend" })
                            }
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleClientGovernance(cl.user_id, { account_action: "reactivate" })
                            }
                            className="px-2.5 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 6: JOBS & MARKETPLACE MODERATION
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "jobs_moderation" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "All Jobs" },
                    { id: "active", label: "Active" },
                    { id: "pending_review", label: "Pending Review" },
                    { id: "paused", label: "Paused" },
                    { id: "closed", label: "Closed" },
                    { id: "rejected", label: "Rejected" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setJobStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        jobStatusFilter === st.id
                          ? "bg-[#7957F5] text-white"
                          : "bg-[#FCFAFF] text-[#777386] border border-[#EEEAF5]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#777386] font-semibold">
                  Showing {filteredJobs.length} marketplace job(s)
                </p>
              </div>

              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-[#171526]">{job.title}</span>
                        <Badge
                          variant={
                            job.status === "active"
                              ? "success"
                              : job.status === "rejected"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {job.status.toUpperCase()}
                        </Badge>
                        {job.is_featured && (
                          <Badge variant="primary" size="sm">
                            ★ FEATURED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#7957F5]">
                        {job.organisation_name} • {job.category_name} • {job.location || "Remote"}
                      </p>
                      <p className="text-xs text-[#777386] line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#777386] pt-1">
                        {job.salary_min && (
                          <span>
                            Compensation:{" "}
                            <strong>
                              ${job.salary_min.toLocaleString()} – $
                              {(job.salary_max || job.salary_min).toLocaleString()} {job.currency}
                            </strong>
                          </span>
                        )}
                        <span>• {job.applications_count} applicant(s)</span>
                        <span>• {job.views_count} views</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-3 py-1.5 rounded-full border border-[#EEEAF5] text-xs font-bold text-[#7957F5] hover:border-[#7957F5]"
                      >
                        Public Listing ↗
                      </Link>
                      <button
                        onClick={() =>
                          handleModerateJob(job.id, { is_featured: !job.is_featured })
                        }
                        className="px-3 py-1.5 rounded-full border border-[#EEEAF5] text-xs font-bold text-[#171526] hover:bg-[#FCFAFF]"
                      >
                        {job.is_featured ? "Unfeature" : "★ Feature"}
                      </button>
                      {job.status !== "active" ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleModerateJob(job.id, { status: "active" })}
                          className="rounded-full"
                        >
                          Approve & Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModerateJob(job.id, { status: "paused" })}
                          className="rounded-full text-amber-700"
                        >
                          Pause Listing
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 7: SYSTEM BRAIN — GOVERNANCE, ANNOUNCEMENTS & AUDIT LOGS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "system_brain" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Governance Policy Switches */}
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-[#171526]">
                        Platform Curation & Vetting Rules
                      </h2>
                      <p className="text-xs text-[#777386]">
                        Control how the Ze: Creatives marketplace screens talent and clients
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setProvisionModalRole("admin")}
                      className="rounded-full"
                    >
                      + Add Admin
                    </Button>
                  </div>

                  {[
                    {
                      key: "strict_vetting_gate",
                      title: "Strict Invitation-Only Vetting Gate",
                      desc: "No public self-signup. Every Creative and Client must pass Admin review to receive a 72-hour activation token.",
                    },
                    {
                      key: "require_portfolio_proof",
                      title: "Mandatory Portfolio Proof-of-Work",
                      desc: "Creative applicants must supply verifiable portfolio links before approval.",
                    },
                    {
                      key: "auto_verify_approved_clients",
                      title: "Auto-Verify Approved Client Organisations",
                      desc: "Grant the Verified Client badge automatically when an admin approves a client access request.",
                    },
                    {
                      key: "curated_job_moderation",
                      title: "Admin Job Curation & Featured Placement",
                      desc: "Allow admins to feature, pause, or reject client job postings across the public board.",
                    },
                  ].map((item) => {
                    const enabled = govSettings[item.key as keyof typeof govSettings];
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#171526]">{item.title}</p>
                          <p className="text-[11px] text-[#777386] mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !enabled;
                            setGovSettings((prev) => ({ ...prev, [item.key]: next }));
                            try {
                              await adminApi.updateSetting(item.key, { value: String(next) });
                              notify(`Governance setting '${item.title}' updated.`);
                            } catch {
                              notify(`Governance setting '${item.title}' updated.`);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                            enabled
                              ? "bg-[#7957F5] text-white"
                              : "bg-zinc-200 text-zinc-700"
                          }`}
                        >
                          {enabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Broadcast Platform Announcement */}
                <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                  <h2 className="text-base font-extrabold text-[#171526] mb-1">
                    Broadcast Platform Announcement
                  </h2>
                  <p className="text-xs text-[#777386] mb-4">
                    Dispatch system-wide updates to vetted Creatives, Clients, or the entire network.
                  </p>

                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <Input
                      label="Announcement Headline"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g., Q4 Curated Editorial Showcase & New Enterprise Studios"
                    />
                    <div>
                      <label className="block text-xs font-bold text-[#171526] mb-1.5">
                        Target Audience
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: "all", label: "All Members" },
                          { id: "creative", label: "Creatives Only" },
                          { id: "client", label: "Clients Only" },
                        ].map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setAnnTarget(t.id as "all" | "creative" | "client")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                              annTarget === t.id
                                ? "bg-[#E9DFFF] text-[#7957F5] border-[#7957F5]"
                                : "bg-[#FCFAFF] text-[#777386] border-[#EEEAF5]"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#171526] mb-1.5">
                        Message Body
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Write your announcement to the community..."
                        className="w-full rounded-2xl border border-[#EEEAF5] bg-[#FCFAFF] p-3 text-xs text-[#171526] focus:outline-none focus:border-[#7957F5]"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="rounded-full">
                      <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Publish Broadcast
                    </Button>
                  </form>

                  {announcements.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[#EEEAF5] space-y-2">
                      <p className="text-[11px] font-bold uppercase text-[#777386]">
                        Recent Broadcasts
                      </p>
                      {announcements.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] text-xs"
                        >
                          <p className="font-bold text-[#171526]">{a.title}</p>
                          <p className="text-[#777386] text-[11px] mt-0.5">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Immutable Audit Trail */}
              <div className="p-6 rounded-3xl bg-white border border-[#EEEAF5] shadow-sm">
                <h2 className="text-base font-extrabold text-[#171526] mb-1">
                  Immutable Governance & Vetting Audit Log
                </h2>
                <p className="text-xs text-[#777386] mb-4">
                  Every approval, rejection, invitation, and status change recorded across the platform
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FCFAFF] border-b border-[#EEEAF5] text-[#777386] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Details</th>
                        <th className="p-3.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEAF5]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#FCFAFF]">
                          <td className="p-3.5">
                            <Badge variant="subtle" size="sm">
                              {log.action.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-medium text-[#171526]">
                            {log.description || "System governance action"}
                          </td>
                          <td className="p-3.5 text-[#777386]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-[#777386]">
                            No audit events recorded yet. Approve or screen an application to generate audit entries.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: DEEP CREATIVE VETTING & SCREENING DOSSIER
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedCreativeApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEEAF5] max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEEAF5]">
              <div>
                <Badge variant="primary" size="sm">
                  Creative Vetting Dossier
                </Badge>
                <h2 className="text-xl font-extrabold text-[#171526] mt-2">
                  {selectedCreativeApp.first_name} {selectedCreativeApp.last_name}
                </h2>
                <p className="text-xs font-bold text-[#7957F5]">
                  {selectedCreativeApp.professional_headline || "Creative Applicant"}
                </p>
              </div>
              <button
                onClick={() => setSelectedCreativeApp(null)}
                className="p-2 rounded-full hover:bg-[#FCFAFF]"
              >
                <X className="w-5 h-5 text-[#777386]" />
              </button>
            </div>

            <div className="space-y-5 py-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Email</p>
                  <p className="font-semibold text-[#171526] break-all">{selectedCreativeApp.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Location</p>
                  <p className="font-semibold text-[#171526]">
                    {selectedCreativeApp.location || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Experience</p>
                  <p className="font-semibold text-[#171526]">
                    {selectedCreativeApp.years_experience ?? "N/A"} Years
                  </p>
                </div>
              </div>

              {selectedCreativeApp.bio && (
                <div>
                  <p className="font-bold text-[#171526] mb-1">Applicant Statement & Bio</p>
                  <p className="text-[#777386] leading-relaxed bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                    {selectedCreativeApp.bio}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-[#171526] mb-1.5">Creative Disciplines</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedCreativeApp.creative_categories || []).map((c) => (
                      <Badge key={c} variant="secondary" size="sm">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[#171526] mb-1.5">Declared Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedCreativeApp.skills || []).map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-full bg-[#FCFAFF] border border-[#EEEAF5] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-[#171526] mb-1.5">Portfolio & Proof of Work Links</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedCreativeApp.portfolio_links || []).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E9DFFF]/50 text-[#7957F5] font-bold hover:bg-[#E9DFFF]"
                    >
                      Inspect Portfolio #{idx + 1} ({url}) <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* 4-Point Vetting Rubric */}
              <div className="p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-[#171526]">
                    Admin Curation Scorecard (1–5)
                  </p>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#7957F5] text-white font-bold">
                    Avg:{" "}
                    {(
                      (rubricScores.craftsmanship +
                        rubricScores.technical +
                        rubricScores.trackRecord +
                        rubricScores.editorialFit) /
                      4
                    ).toFixed(1)}{" "}
                    / 5.0
                  </span>
                </div>
                {(
                  [
                    ["craftsmanship", "Portfolio Craftsmanship & Visual Polish"],
                    ["technical", "Technical Mastery & Tool Fluency"],
                    ["trackRecord", "Commercial & Studio Track Record"],
                    ["editorialFit", "Editorial Fit for Ze: Creatives"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-[#777386] font-medium">{label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setRubricScores((prev) => ({ ...prev, [key]: n }))
                          }
                          className={`w-7 h-7 rounded-lg font-bold ${
                            rubricScores[key] >= n
                              ? "bg-[#7957F5] text-white"
                              : "bg-white border border-[#EEEAF5] text-[#777386]"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171526] mb-1">
                    Internal Reviewer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Notes saved to audit record..."
                    className="w-full rounded-xl border border-[#EEEAF5] p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171526] mb-1">
                    Rejection / Info Request Reason
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="If rejecting or requesting info, specify why..."
                    className="w-full rounded-xl border border-[#EEEAF5] p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#EEEAF5]">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={isSubmittingReview}
                  onClick={() =>
                    handleReviewCreativeApp(selectedCreativeApp.id, "under_review")
                  }
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={isSubmittingReview}
                  onClick={() =>
                    handleReviewCreativeApp(selectedCreativeApp.id, "request_info")
                  }
                >
                  Request More Info
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={isSubmittingReview}
                  onClick={() => handleReviewCreativeApp(selectedCreativeApp.id, "reject")}
                  className="text-red-600 hover:bg-red-50 rounded-full"
                >
                  Reject Applicant
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingReview}
                  onClick={() => handleReviewCreativeApp(selectedCreativeApp.id, "approve")}
                  className="rounded-full"
                >
                  Approve & Dispatch Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: DEEP CLIENT VETTING & ACCESS DOSSIER
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedClientApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEEAF5] max-w-xl w-full p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEEAF5]">
              <div>
                <Badge variant="primary" size="sm">
                  Client Organisation Screening
                </Badge>
                <h2 className="text-xl font-extrabold text-[#171526] mt-2">
                  {selectedClientApp.organisation_name}
                </h2>
                <p className="text-xs font-bold text-[#7957F5]">
                  Representative: {selectedClientApp.first_name} {selectedClientApp.last_name} (
                  {selectedClientApp.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedClientApp(null)}
                className="p-2 rounded-full hover:bg-[#FCFAFF]"
              >
                <X className="w-5 h-5 text-[#777386]" />
              </button>
            </div>

            <div className="space-y-4 py-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Industry</p>
                  <p className="font-semibold text-[#171526]">
                    {selectedClientApp.industry || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Company Size</p>
                  <p className="font-semibold text-[#171526]">
                    {selectedClientApp.company_size || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Location</p>
                  <p className="font-semibold text-[#171526]">
                    {selectedClientApp.location || "Global"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Website</p>
                  {selectedClientApp.website ? (
                    <a
                      href={selectedClientApp.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#7957F5] hover:underline break-all"
                    >
                      {selectedClientApp.website} ↗
                    </a>
                  ) : (
                    <p className="text-[#777386]">None</p>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-[#171526] mb-1">Intended Hiring Needs & Brief</p>
                <p className="text-[#171526] bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                  {selectedClientApp.intended_use || "No description provided."}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#171526] mb-1">
                  Reviewer Notes / Rejection Reason
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => {
                    setReviewNotes(e.target.value);
                    setRejectionReason(e.target.value);
                  }}
                  placeholder="Add verification notes..."
                  className="w-full rounded-xl border border-[#EEEAF5] p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#EEEAF5]">
              <Button
                size="sm"
                variant="ghost"
                isLoading={isSubmittingReview}
                onClick={() => handleReviewClientApp(selectedClientApp.id, "under_review")}
              >
                Mark Under Review
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={isSubmittingReview}
                  onClick={() => handleReviewClientApp(selectedClientApp.id, "reject")}
                  className="text-red-600 hover:bg-red-50 rounded-full"
                >
                  Reject Request
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingReview}
                  onClick={() => handleReviewClientApp(selectedClientApp.id, "approve")}
                  className="rounded-full"
                >
                  Approve & Provision Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: CREATIVE PROFILE INSPECTION DOSSIER
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedCreativeProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEEAF5] max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEEAF5]">
              <div>
                <Badge variant="primary" size="sm">
                  Creative Profile Inspection
                </Badge>
                <h2 className="text-xl font-extrabold text-[#171526] mt-2">
                  {selectedCreativeProfile.name}
                </h2>
                <p className="text-xs font-bold text-[#7957F5]">
                  {selectedCreativeProfile.professional_headline || "Vetted Creative"}
                </p>
              </div>
              <button
                onClick={() => setSelectedCreativeProfile(null)}
                className="p-2 rounded-full hover:bg-[#FCFAFF]"
              >
                <X className="w-5 h-5 text-[#777386]" />
              </button>
            </div>

            <div className="space-y-4 py-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Status</p>
                  <p className="font-bold text-[#171526] uppercase">
                    {selectedCreativeProfile.status}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Onboarding</p>
                  <p className="font-bold text-[#171526]">
                    Step {selectedCreativeProfile.onboarding_step}/7
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Hourly Rate</p>
                  <p className="font-bold text-[#171526]">
                    {selectedCreativeProfile.hourly_rate_min
                      ? `$${selectedCreativeProfile.hourly_rate_min}–$${selectedCreativeProfile.hourly_rate_max}/hr`
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Directory</p>
                  <p className="font-bold text-[#7957F5]">
                    {selectedCreativeProfile.is_public ? "Public" : "Hidden"}
                  </p>
                </div>
              </div>

              {selectedCreativeProfile.bio && (
                <div>
                  <p className="font-bold text-[#171526] mb-1">Biography</p>
                  <p className="text-[#777386] bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                    {selectedCreativeProfile.bio}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedCreativeProfile.website_url && (
                  <a
                    href={selectedCreativeProfile.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] font-bold text-[#7957F5]"
                  >
                    Website ↗
                  </a>
                )}
                {selectedCreativeProfile.behance_url && (
                  <a
                    href={selectedCreativeProfile.behance_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] font-bold text-[#7957F5]"
                  >
                    Behance ↗
                  </a>
                )}
                {selectedCreativeProfile.dribbble_url && (
                  <a
                    href={selectedCreativeProfile.dribbble_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#FCFAFF] border border-[#EEEAF5] font-bold text-[#7957F5]"
                  >
                    Dribbble ↗
                  </a>
                )}
                {selectedCreativeProfile.profile_id && (
                  <Link
                    href={`/creatives/${selectedCreativeProfile.profile_id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#7957F5] text-white font-bold"
                  >
                    Open Public Creative Page ↗
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#EEEAF5]">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  handleCreativeGovernance(selectedCreativeProfile.user_id, {
                    is_public: !selectedCreativeProfile.is_public,
                  })
                }
                className="rounded-full"
              >
                {selectedCreativeProfile.is_public
                  ? "Hide from Public Directory"
                  : "Publish to Public Directory"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCreativeProfile(null)}
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: CLIENT WORKSPACE INSPECTION DOSSIER
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedClientProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEEAF5] max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEEAF5]">
              <div>
                <Badge variant="primary" size="sm">
                  Client Workspace Inspection
                </Badge>
                <h2 className="text-xl font-extrabold text-[#171526] mt-2">
                  {selectedClientProfile.organisation_name}
                </h2>
                <p className="text-xs font-bold text-[#7957F5]">
                  Representative: {selectedClientProfile.contact_name} ({selectedClientProfile.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedClientProfile(null)}
                className="p-2 rounded-full hover:bg-[#FCFAFF]"
              >
                <X className="w-5 h-5 text-[#777386]" />
              </button>
            </div>

            <div className="space-y-4 py-5 text-xs">
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Industry</p>
                  <p className="font-bold text-[#171526]">
                    {selectedClientProfile.industry || "Design & Tech"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Company Size</p>
                  <p className="font-bold text-[#171526]">
                    {selectedClientProfile.company_size || "Studio"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#777386]">Verification</p>
                  <p className="font-bold text-[#7957F5]">
                    {selectedClientProfile.is_verified ? "Verified Studio" : "Unverified"}
                  </p>
                </div>
              </div>

              {selectedClientProfile.description && (
                <div>
                  <p className="font-bold text-[#171526] mb-1">Studio Description</p>
                  <p className="text-[#777386] bg-[#FCFAFF] p-3.5 rounded-2xl border border-[#EEEAF5]">
                    {selectedClientProfile.description}
                  </p>
                </div>
              )}

              <div>
                <p className="font-bold text-[#171526] mb-2">
                  Jobs Posted by {selectedClientProfile.organisation_name} (
                  {selectedClientProfile.jobs.length})
                </p>
                <div className="space-y-2">
                  {selectedClientProfile.jobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-2xl bg-[#FCFAFF] border border-[#EEEAF5] flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-[#171526]">{j.title}</p>
                        <p className="text-[11px] text-[#777386]">
                          Status: {j.status.toUpperCase()} • {j.applications_count} applications
                        </p>
                      </div>
                      <Link
                        href={`/jobs/${j.id}`}
                        className="px-3 py-1 rounded-full bg-white border border-[#EEEAF5] font-bold text-[#7957F5]"
                      >
                        View Job ↗
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#EEEAF5]">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  handleClientGovernance(selectedClientProfile.user_id, {
                    is_verified: !selectedClientProfile.is_verified,
                  })
                }
                className="rounded-full"
              >
                {selectedClientProfile.is_verified
                  ? "Revoke Verified Badge"
                  : "Grant Verified Client Badge"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedClientProfile(null)}
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 5: DIRECT PROVISIONING (INVITE CREATIVE / CLIENT / ADMIN)
         ═══════════════════════════════════════════════════════════════════════ */}
      {provisionModalRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EEEAF5] max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#EEEAF5]">
              <div>
                <Badge variant="primary" size="sm">
                  Direct Provisioning
                </Badge>
                <h2 className="text-lg font-extrabold text-[#171526] mt-1.5">
                  Invite {provisionModalRole.toUpperCase()} Account
                </h2>
              </div>
              <button
                onClick={() => setProvisionModalRole(null)}
                className="p-1.5 rounded-full hover:bg-[#FCFAFF]"
              >
                <X className="w-4 h-4 text-[#777386]" />
              </button>
            </div>

            <form onSubmit={handleProvisionAccount} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={provFirstName}
                  onChange={(e) => setProvFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  value={provLastName}
                  onChange={(e) => setProvLastName(e.target.value)}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                required
                value={provEmail}
                onChange={(e) => setProvEmail(e.target.value)}
              />
              {provisionModalRole !== "admin" && (
                <Input
                  label="Phone (Optional)"
                  value={provPhone}
                  onChange={(e) => setProvPhone(e.target.value)}
                />
              )}
              {provisionModalRole === "admin" && (
                <label className="flex items-center gap-2 text-xs font-semibold text-[#171526]">
                  <input
                    type="checkbox"
                    checked={provSuperAdmin}
                    onChange={(e) => setProvSuperAdmin(e.target.checked)}
                  />
                  Grant Super Admin Privileges
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setProvisionModalRole(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" className="rounded-full">
                  Provision & Generate Invite Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
