"use client";
import React from "react";
import { cn } from "@/utils/function/cn";
import { useUser } from "@/context/AuthContext";
import { Menu, User } from "lucide-react";
import LogoutButton from "@/components/logout/Logout";
import Profile from "@/components/user/Profile";

interface MenuProps {
  text: string;
  position?: "left" | "center" | "right";
  fontSize?: "title1" | "title2" | "title3";
  className?: string;
  onMenuToggle?: () => void;
}

const MenuProfile: React.FC<MenuProps> = ({
  text,
  position = "center",
  fontSize = "title3",
  className,
  onMenuToggle,
}) => {
  const { user } = useUser();

  return (
    <div className="glass-user-sidebar">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden text-white hover:text-white/80 transition-colors p-2"
            >
              <Menu size={24} />
            </button>
          )}

          {/* Title */}
          <div
            className={cn(
              "flex-1",
              position === "left" && "text-left",
              position === "center" && "text-center lg:text-left lg:ml-6",
              position === "right" && "text-right",
              "cursor-pointer uppercase text-white"
            )}
          >
            <h2 className={cn(`text-${fontSize} my-2 ${className}`)}>{text}</h2>
          </div>

          {/* User Profile */}
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default MenuProfile;
