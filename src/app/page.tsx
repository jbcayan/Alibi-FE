"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { menuItems } from "@/constants/home/home";
import { MenuItem } from "@/types/home/types";
import Cart from "@/components/ui/Cart";
import SectionContainer from "@/shared/SectionContainer";
import { useSubscriptionGuard } from "@/hooks/payment/useSubscriptionGuard";
import { user_role } from "@/constants/role";
import Sidebar from "@/components/dashboard/user/Sidebar";
import MenuProfile from "@/components/dashboard/user/MenuProfile";

const UserDashboard = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { subscriptionStatus, loading, hasActiveSubscription, isPremium } =
    useSubscriptionGuard(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = localStorage.getItem("role");

    if (role === user_role.SUPER_ADMIN) {
      router.push("/admin");
      return;
    }

    if (!loading && !hasActiveSubscription) {
      router.replace("/login");
    }
  }, [loading, hasActiveSubscription, router]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen main_gradient_bg z-0 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">認証中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main_gradient_bg min-h-screen text-white">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Profile Section */}
          <MenuProfile
            text="ユーザーダッシュボード"
            onMenuToggle={handleMenuToggle}
          />

          {/* Content Section */}
          <SectionContainer>
            <div className="py-12 z-10 10 md:py-16 lg:py-20">
              <div className="grid z-20 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full mx-auto">
                {menuItems.map((item: MenuItem) => (
                  <Link key={item.id} href={item.path}>
                    <Cart item={item} />
                  </Link>
                ))}
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
