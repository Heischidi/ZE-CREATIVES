export type UserRole = "super_admin" | "admin" | "creative" | "client";

export type AccountStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "invitation_sent"
  | "active"
  | "suspended"
  | "deactivated";

export type JobStatus = "draft" | "active" | "paused" | "closed" | "filled";

export type WorkArrangement = "remote" | "hybrid" | "on_site";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance"
  | "internship";

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "director"
  | "executive";

export type AvailabilityStatus =
  | "available"
  | "open_to_offers"
  | "busy"
  | "not_available";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category_id?: string;
}

export interface Job {
  id: string;
  title: string;
  client_id?: string;
  client_name?: string;
  client_logo?: string;
  category_id?: string;
  category_name?: string;
  category?: Category;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  preferred_skills?: string;
  location?: string;
  country?: string;
  work_arrangement?: WorkArrangement;
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  is_salary_disclosed?: boolean;
  application_deadline?: string;
  status: JobStatus;
  is_featured?: boolean;
  views_count?: number;
  applications_count?: number;
  skills?: { id: string; name: string }[];
  published_at?: string;
  created_at: string;
}

export interface CreativeProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  professional_headline?: string;
  bio?: string;
  location?: string;
  country?: string;
  years_experience?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  project_rate_min?: number;
  project_rate_max?: number;
  currency?: string;
  availability?: AvailabilityStatus;
  is_public: boolean;
  profile_views?: number;
  categories: { id: string; name: string; slug: string; is_primary: boolean }[];
  skills: { id: string; name: string; proficiency_level?: number }[];
  portfolio_projects?: PortfolioProject[];
  work_experiences?: WorkExperience[];
  education?: Education[];
  social_links?: Record<string, string>;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  category_name?: string;
  cover_image_url?: string;
  project_url?: string;
  video_url?: string;
  tools_used?: string[];
  is_featured?: boolean;
  media?: { id: string; media_type: string; url: string; caption?: string }[];
  created_at?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  is_current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  is_current: boolean;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job_title: string;
  client_name: string;
  category?: string;
  status: string;
  created_at: string;
}
