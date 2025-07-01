import { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

export const adminBreadcrumbs: BreadcrumbItem[] = [
  { label: "管理者", href: "/admin" },
];

const dashboardBreadcrumbs: BreadcrumbItem[] = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "レポート", href: "/dashboard/reports" },
  { label: "売上分析" },
];

const settingsBreadcrumbs: BreadcrumbItem[] = [
  { label: "設定", href: "/settings" },
  { label: "プロフィール" },
];
