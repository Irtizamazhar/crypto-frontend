// src/layouts/SiteLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SiteNavbar from "../components/SiteNavbar";
import SiteFooter from "../components/SiteFooter";
import AIChatBot from "../components/AIChatBot";
import MobileTabBar from "../components/MobileTabBar";

function RouteContainer({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">

      {/* Set the mobile dock height globally so FABs/panels can position above it */}
      <style>{`:root { --mobile-dock-h: 64px; }`}</style>

      <SiteNavbar />

      {/* Wrap content + footer with extra bottom padding so they don't sit under the dock */}
      <div className="pb-[calc(var(--mobile-dock-h,0px)+env(safe-area-inset-bottom))]">
        <RouteContainer>
          <Outlet />
        </RouteContainer>

        <SiteFooter />
      </div>

      {/* Global Mobile Bottom Nav (fixed on mobile) */}
      <MobileTabBar height={64} />

      {/* Chat bot FAB & panel (it uses --mobile-dock-h to stay above the bottom nav) */}
      <AIChatBot />
    </div>
  );
}
