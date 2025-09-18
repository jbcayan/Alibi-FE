"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSubscriptionGuard } from "@/hooks/payment/useSubscriptionGuard";
import Sidebar from "@/components/dashboard/user/Sidebar";
import MenuProfile from "@/components/dashboard/user/MenuProfile";

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
  ];

  // Define routes where subscription guard should not apply
  const excludeSubscriptionGuardRoutes = [
    "/login",
    "/register",
    "/user/verify-otp",
    "/reset-password",
    "/subscription-success",
  ];

  const shouldHideUI = pathname ? hideUIRoutes.includes(pathname) : false;
  const shouldExcludeSubscriptionGuard = pathname ? excludeSubscriptionGuardRoutes.includes(pathname) : false;

  const { loading, hasActiveSubscription } = useSubscriptionGuard(!shouldExcludeSubscriptionGuard);

  const handleMenuToggle = () => setSidebarOpen(!sidebarOpen);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <div className="main_gradient_bg min-h-screen text-white flex">
      {!shouldHideUI && (
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      )}

      <div
        className={`flex-1 ${!shouldHideUI ? "" : ""} h-screen flex flex-col`}
      >
        {!shouldHideUI && (
          <div className="fixed top-0 left-0 z-50 lg:left-[320px] right-0  ">
            <MenuProfile
              text="ユーザーダッシュボード"
              onMenuToggle={handleMenuToggle}
            />
          </div>
        )}

        <main
          className={`mt-[${
            !shouldHideUI ? "80px" : "0"
          }] overflow-y-auto w-full h-full  px-4 `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
