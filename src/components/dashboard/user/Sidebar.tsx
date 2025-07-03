"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  Image,
  Edit3,
  Video,
  MessageSquare,
  MessageCircle,
  Gift,
  FileText,
  User,
  Settings,
  HelpCircle,
  LogOut,
  XCircle,
  LayoutDashboard,
} from "lucide-react";
import LogoutButton from "@/components/logout/Logout";
import Button from "@/components/ui/Button";
import { subscriptionApiClient } from "@/infrastructure/subscription/subscriptionAPIClient";

const sidebarMenuItems = [
  { id: 1, title: "ダッシュボード", icon: Home, path: "/" },
  { id: 2, title: "アリバイ写真DL", icon: Image, path: "/alibi-photos" },
  { id: 3, title: "写真加工", icon: Edit3, path: "/photo-edit" },
  { id: 4, title: "動画音声", icon: Video, path: "/alibi-video" },
  { id: 5, title: "アリバイLINE", icon: MessageSquare, path: "/alibi-line" },
  { id: 6, title: "相談", icon: MessageCircle, path: "/chat" },
  { id: 7, title: "お土産", icon: Gift, path: "/alibi-souvenir" },
  { id: 8, title: "請求書", icon: FileText, path: "/dummy-invoice" },
];

const bottomMenuItems = [
  { id: 9, title: "プロフィール", icon: User, path: "/user/profile" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const getClassName = (active: boolean) =>
    `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
      active
        ? "bg-white/10 text-white"
        : "text-white/80 hover:text-white hover:bg-white/10"
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`
        fixed top-0 left-0 h-screen glass-user-sidebar 
        transform transition-transform duration-300 ease-in-out z-50
        w-64  lg:w-[320px]
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:relative lg:z-auto
      `}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center pl-4 gap-2 select-none">
            <LayoutDashboard className="text-white" />
            <h2 className="text-white text-xl font-semibold">メニュー</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-white/70 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarMenuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className={getClassName(active)}
                    onClick={onClose}
                  >
                    <IconComponent
                      size={20}
                      className={`mr-3 group-hover:scale-110 transition-transform ${
                        active ? "text-white" : ""
                      }`}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 pt-6 border-t border-white/10">
            <ul className="space-y-2">
              {bottomMenuItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      className={getClassName(active)}
                      onClick={onClose}
                    >
                      <IconComponent
                        size={20}
                        className={`mr-3 group-hover:scale-110 transition-transform ${
                          active ? "text-white" : ""
                        }`}
                      />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 ">
            <div className="flex items-center w-full px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all duration-200 group">
              <LogoutButton
                className="w-full z-50 text-start flex-start justify-start  "
                variant="glass"
              >
                <div className="flex items-center gap-2">
                  <LogOut
                    size={20}
                    className="mr-3 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm font-medium">ログアウト</span>
                </div>
              </LogoutButton>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
