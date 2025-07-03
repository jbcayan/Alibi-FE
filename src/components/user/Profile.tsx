"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/utils/function/cn";
import { useUser } from "@/context/AuthContext";
import LogoutButton from "../logout/Logout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subscriptionApiClient } from "@/infrastructure/subscription/subscriptionAPIClient";

interface MenuProfileProps {
  className?: string;
}

const Profile: React.FC<MenuProfileProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeDropdown();
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, closeDropdown]);

  const handleMenuItemClick = (action: string) => {
    closeDropdown();
    switch (action) {
      case "profile":
        break;
      case "logout":
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("py-2", className)}>
      <div className="relative z-50">
        {" "}
        {/* Ensures stacking */}
        <div className="flex items-center justify-center">
          {user && (
            <div className="relative z-[9999]">
              <div
                ref={buttonRef}
                className="inline-block lg:mr-22 mr-4 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-full"
                onClick={toggleDropdown}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDropdown();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="User menu"
              >
                <div className="w-10 z-[9999] h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 transition-colors duration-300">
                  <Image
                    src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                    alt="User Profile"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                <span
                  className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm"
                  aria-hidden="true"
                />
              </div>

              {/* {isOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute  lg:right-22 right-4 mt-2 w-64 origin-top-right rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-10 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-200/40"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="py-2 px-3 flex flex-col gap-2">
                    <Link href={"/user/profile"}>
                      <button
                        onClick={() => handleMenuItemClick("profile")}
                        className="block w-full text-left px-4 py-2 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 rounded-lg font-medium"
                        role="menuitem"
                      >
                        My Profile
                      </button>
                    </Link>

                    <button
                      onClick={async () => {
                        closeDropdown();
                        const confirmed = window.confirm(
                          "Are you sure you want to cancel your subscription?"
                        );
                        if (!confirmed) return;
                        try {
                          await subscriptionApiClient.cancelSubscription();
                          alert("Subscription cancelled successfully.");
                        } catch (err: any) {
                          let errorMsg =
                            "An error occurred while cancelling subscription.";
                          if (err instanceof Error && err.message)
                            errorMsg = err.message;
                          alert(errorMsg);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-base text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 rounded-lg font-medium"
                      role="menuitem"
                    >
                      Cancel Subscription
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <LogoutButton
                      size="md"
                      className="w-full z-50 bg-black text-white"
                    >
                      LogOut
                    </LogoutButton>
                  </div>
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
