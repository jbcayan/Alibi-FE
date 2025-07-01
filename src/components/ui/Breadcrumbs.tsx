import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Breadcrumb types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  showHome?: boolean;
  homeLabel?: string;
  homeHref?: string;
}

// Main Breadcrumbs Component
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
  className = "",
  showHome = true,
  homeLabel = "ホーム",
  homeHref = "/",
}) => {
  // Add home item if showHome is true
  const allItems: BreadcrumbItem[] = showHome
    ? [
        {
          label: homeLabel,
          href: homeHref,
          icon: <Home className="w-4 h-4" />,
        } as BreadcrumbItem,
        ...items,
      ]
    : items;

  return (
    <nav
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isActive = item.isActive || isLast;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 flex-shrink-0">{separator}</span>
              )}

              {item.href && !isActive ? (
                <Link href={item.href}>
                  <p className="flex items-center  text-gray-600 hover:text-gray-900 transition-colors duration-200 px-1 py-1 rounded-md hover:bg-gray-100">
                    {item.icon}
                    <span>{item.label}</span>
                  </p>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                    isActive
                      ? "text-blue-600 bg-blue-50 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
export default Breadcrumbs;
