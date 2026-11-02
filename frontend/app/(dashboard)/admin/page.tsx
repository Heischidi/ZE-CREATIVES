"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileCheck,
  Building,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const initialCreativeApps = [
  {
    id: "app-1",
    name: "Soren Lindqvist",
    email: "soren@lindqvist-design.dk",
    discipline: "Brand & Visual Identity",
    location: "Copenhagen, Denmark",
    portfolio: "https://lindqvist-design.dk",
    yearsExp: 7,
    status: "pending",
    headline: "Minimalist Brand Architect & Typographer",
  },
  {
    id: "app-2",
    name: "Maya Patel",
    email: "maya.patel.art@gmail.com",
    discipline: "3D Art & Motion Design",
    location: "London, UK",
    portfolio: "https://behance.net/mayapatel3d",
    yearsExp: 5,
    status: "pending",
    headline: "Houdini & Unreal Engine Visualist",
  },
  {
    id: "app-3",
    name: "Gabriel Santos",
    email: "gabriel@santosstudio.br",
    discipline: "UI / UX & Product Design",
    location: "São Paulo, Brazil",
    portfolio: "https://readcv.com/gabrielsantos",
    yearsExp: 6,
    status: "pending",
    headline: "Senior Product Designer & Systems Lead",
  },
];

const initialClientApps = [
  {
    id: "cl-1",
    orgName: "Hyperion Robotics",
    contactName: "Claire Dupont",
    email: "claire@hyperionrobotics.com",
    industry: "Tech & SaaS",
    size: "51-200 employees",
    website: "https://hyperionrobotics.com",
    intendedUse: "Seeking lead 3D motion designers and brand identity specialists for Q1 rebrand.",
    status: "pending",
  },
  {
    id: "cl-2",
    orgName: "Maison Verre Luxury",
    contactName: "Antoine Laurent",
    email: "a.laurent@maisonverre.fr",
    industry: "Fashion & Luxury",
    size: "11-50 employees",
    website: "https://maisonverre.fr",
    intendedUse: "Editorial art directors and high-end packaging designers.",
    status: "pending",
  },
];

const initialUsers = [
  {
    id: "usr-1",
    name: "Platform Super Admin",
    email: "admin@zecreatives.com",
    role: "super_admin",
    status: "active",
    joined: "Oct 2026",
  },
  {
    id: "usr-2",
    name: "Elena Rostova",
    email: "elena@zecreatives.com",
    role: "creative",
    status: "active",
    joined: "Oct 2026",
  },
  {
    id: "usr-3",
    name: "Studio Ardent (Thomas Wright)",
    email: "client@zecreatives.com",
    role: "client",
    status: "active",
    joined: "Oct 2026",
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"creatives" | "clients" | "users">("creatives");
  const [creativeApps, setCreativeApps] = useState(initialCreativeApps);
  const [clientApps, setClientApps] = useState(initialClientApps);
  const [users, setUsers] = useState(initialUsers);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCreativeAction = (id: string, action: "approve" | "reject") => {
    setCreativeApps((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: action === "approve" ? "approved" : "rejected" } : app))
    );
    setActionNotice(
      action === "approve"
        ? "Application approved! Secure invitation token generated & invitation email dispatched."
        : "Application rejected."
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleClientAction = (id: string, action: "approve" | "reject") => {
    setClientApps((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: action === "approve" ? "approved" : "rejected" } : app))
    );
    setActionNotice(
      action === "approve"
        ? "Client membership approved! Organisation workspace created & invitation sent."
        : "Client application rejected."
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAFF]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Super Admin Center
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171526]">
                Ecosystem Governance & Moderation
              </h1>
              <p className="text-xs text-[#777386] mt-1">
                Manage talent vetting queues, client provisioning, and system audit logs.
              </p>
            </div>
          </div>

          {actionNotice && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {actionNotice}
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Pending Creatives</p>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1">
                {creativeApps.filter((a) => a.status === "pending").length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Pending Clients</p>
              <p className="text-2xl font-extrabold text-[#7957F5] mt-1">
                {clientApps.filter((a) => a.status === "pending").length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Total Active Users</p>
              <p className="text-2xl font-extrabold text-[#171526] mt-1">{users.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm">
              <p className="text-xs text-[#777386] font-medium">Quality Acceptance</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">4.2%</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-[#EEEAF5] mb-6">
            <button
              onClick={() => setActiveTab("creatives")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "creatives"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              Creative Vetting Queue ({creativeApps.filter((a) => a.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "clients"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              Client Access Requests ({clientApps.filter((a) => a.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "users"
                  ? "border-[#7957F5] text-[#7957F5]"
                  : "border-transparent text-[#777386] hover:text-[#171526]"
              }`}
            >
              Users & Roles ({users.length})
            </button>
          </div>

          {/* Tab 1: Creative Applications */}
          {activeTab === "creatives" && (
            <div className="space-y-4">
              {creativeApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base font-bold text-[#171526]">{app.name}</span>
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
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-[#7957F5] mb-2">{app.headline}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#777386]">
                      <span>Discipline: <strong>{app.discipline}</strong></span>
                      <span>•</span>
                      <span>Location: {app.location}</span>
                      <span>•</span>
                      <span>Exp: {app.yearsExp} Years</span>
                    </div>

                    <div className="mt-3">
                      <a
                        href={app.portfolio}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-[#7957F5] hover:underline"
                      >
                        Inspect Portfolio & Proof of Work <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  </div>

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCreativeAction(app.id, "approve")}
                        className="rounded-full"
                      >
                        Approve & Invite
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCreativeAction(app.id, "reject")}
                        className="rounded-full text-red-500 hover:text-red-700"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Client Access Requests */}
          {activeTab === "clients" && (
            <div className="space-y-4">
              {clientApps.map((cl) => (
                <div
                  key={cl.id}
                  className="p-6 rounded-2xl bg-white border border-[#EEEAF5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base font-bold text-[#171526]">{cl.orgName}</span>
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
                        {cl.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#777386] mb-2">
                      Representative: <strong>{cl.contactName}</strong> ({cl.email}) • {cl.industry} • {cl.size}
                    </p>

                    <p className="text-xs text-[#171526] bg-[#FCFAFF] p-3 rounded-xl border border-[#EEEAF5]">
                      "{cl.intendedUse}"
                    </p>

                    <div className="mt-3">
                      <a
                        href={cl.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-[#7957F5] hover:underline"
                      >
                        Visit Official Website <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  </div>

                  {cl.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleClientAction(cl.id, "approve")}
                        className="rounded-full"
                      >
                        Approve Access
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleClientAction(cl.id, "reject")}
                        className="rounded-full text-red-500 hover:text-red-700"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Users */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl border border-[#EEEAF5] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFAFF] border-b border-[#EEEAF5] text-[#777386] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAF5]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/50">
                      <td className="p-4 font-bold text-[#171526]">{u.name}</td>
                      <td className="p-4 text-[#777386]">{u.email}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            u.role === "super_admin"
                              ? "primary"
                              : u.role === "creative"
                              ? "secondary"
                              : "subtle"
                          }
                          size="sm"
                        >
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#777386]">{u.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
