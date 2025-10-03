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
      <style>{`
        :root {
          --mobile-dock-h: 64px;   /* height of <MobileTabBar> */
          --fab-z: 2147483647;
          --bot-z: 2147483646;
          --bot-size: 72px;
          --fab-size: 48px;
          --bot-gap: 14px;
        }
        .fab-above-bot {
          right: calc(1rem + max(0px, (var(--bot-size) - var(--fab-size)) / 2));
          bottom: calc(var(--bot-size) + var(--bot-gap) + env(safe-area-inset-bottom));
          z-index: var(--fab-z);
        }
        @media (max-width: 640px) {
          :root {
            --bot-size: 64px;
            --fab-size: 44px;
            --bot-gap: 10px;
          }
          .create-post-fab { width: 44px; height: 44px; }
        }
      `}</style>

      <SiteNavbar />

      {/* Page content keeps clearance for the fixed mobile dock */}
      <div className="flex-1 pb-[calc(var(--mobile-dock-h,0px)+env(safe-area-inset-bottom))] md:pb-0">
        <RouteContainer>
          <Outlet />
        </RouteContainer>
      </div>

      {/* Footer: give a *small* breathing room from the very bottom */}
      <div className="pb-[max(10px,env(safe-area-inset-bottom))] md:pb-2">
        <SiteFooter />
      </div>

      {/* Fixed Mobile bottom nav */}
      <MobileTabBar height={64} />

      {/* Chat bot layer (below FAB) */}
      <div className="relative z-[var(--bot-z)]">
        <AIChatBot />
      </div>
    </div>
  );
}
