"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSubscriptionGuard } from "@/hooks/payment/useSubscriptionGuard";
import Sidebar from "@/components/dashboard/user/Sidebar";
import MenuProfile from "@/components/dashboard/user/MenuProfile";
import Footer from "@/components/layout/Footer";

interface Props {
  children: React.ReactNode;
}

const UserDashboardLayout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Define routes where sidebar and menu should be hidden
  const hideUIRoutes = [
    "/login",
    "/register",
    "/user/verify-otp",
    "/reset-password",
    "/privacy-policy",
    "/terms-of-service",
  ];

  // Define routes where subscription guard should not apply
  const excludeSubscriptionGuardRoutes = [
    "/login",
    "/register",
    "/user/verify-otp",
    "/reset-password",
    "/subscription-success",
    "/privacy-policy",
    "/terms-of-service",
  ];

  const shouldHideUI = pathname ? hideUIRoutes.some(route => pathname.startsWith(route)) : false;
  const shouldExcludeSubscriptionGuard = pathname ? excludeSubscriptionGuardRoutes.some(route => pathname.startsWith(route)) : false;

  // Define routes where footer should be shown (only login page)
  const shouldShowFooter = pathname === "/login";

  const { loading, hasActiveSubscription } = useSubscriptionGuard(!shouldExcludeSubscriptionGuard, shouldExcludeSubscriptionGuard);

  const handleMenuToggle = () => setSidebarOpen(!sidebarOpen);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <div className="main_gradient_bg min-h-screen text-white flex flex-col">
      <div className={`flex ${!shouldHideUI ? "lg:flex-row" : ""} flex-1`}>
        {!shouldHideUI && (
          <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        )}

        <div className="flex-1 flex flex-col">
          {!shouldHideUI && (
            <div className="fixed top-0 left-0 z-50 lg:left-[320px] right-0">
              <MenuProfile
                text="ユーザーダッシュボード"
                onMenuToggle={handleMenuToggle}
              />
            </div>
          )}

          <main
            className={`${
              !shouldHideUI ? "mt-[80px]" : "mt-0"
            } overflow-y-auto w-full flex-1 px-4`}
          >
            {children}
          </main>

          {shouldShowFooter && <Footer />}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
