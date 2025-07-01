"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { navItems } from "@/constants/admin";
import HamburgerMenu from "@/components/admin/HamburgerMenu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="relative z-30">
        <Sidebar
          navItems={navItems}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header for Mobile */}
        <header className="bg-white fixed top-0 left-0 right-0 lg:relative lg:top-auto lg:left-auto lg:right-auto z-10 shadow-sm p-4 border-b border-gray-200 flex items-center lg:hidden">
          <HamburgerMenu isOpen={isSidebarOpen} onToggle={toggleSidebar} />
          <h1 className="text-xl font-bold text-neutral-900 ml-4">管理画面</h1>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto mt-4 lg:pt-0">
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
