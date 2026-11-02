declare module "lucide-react" {
  import * as React from "react";

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
    children?: React.ReactNode;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;

  export const Sparkles: LucideIcon;
  export const Search: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Users: LucideIcon;
  export const Compass: LucideIcon;
  export const Star: LucideIcon;
  export const MapPin: LucideIcon;
  export const Clock: LucideIcon;
  export const Layers: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Palette: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Camera: LucideIcon;
  export const Film: LucideIcon;
  export const PenTool: LucideIcon;
  export const Wand2: LucideIcon;
  export const Sliders: LucideIcon;
  export const Filter: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Calendar: LucideIcon;
  export const Share2: LucideIcon;
  export const Building: LucideIcon;
  export const Building2: LucideIcon;
  export const Upload: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const Check: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Info: LucideIcon;
  export const Menu: LucideIcon;
  export const Globe: LucideIcon;
  export const Mail: LucideIcon;
  export const Phone: LucideIcon;
  export const Lock: LucideIcon;
  export const Key: LucideIcon;
  export const LogOut: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserX: LucideIcon;
  export const Settings: LucideIcon;
  export const Bell: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Heart: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Loader2: LucideIcon;
  export const Send: LucideIcon;
  export const Paperclip: LucideIcon;
  export const Award: LucideIcon;
  export const Zap: LucideIcon;
  export const FileText: LucideIcon;
  export const FileCheck: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const BarChart3: LucideIcon;
  export const FolderKanban: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const Boxes: LucideIcon;
  export const Code: LucideIcon;
  export const Music: LucideIcon;
  export const Scissors: LucideIcon;
  export const Target: LucideIcon;
  export const CreditCard: LucideIcon;
  export const UserPlus: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Download: LucideIcon;
  export const Image: LucideIcon;
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;

  const icons: Record<string, LucideIcon>;
  export default icons;
}
