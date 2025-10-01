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
      {/* Global variables + helpers so floating items don't overlap the bot */}
      <style>{`
        :root {
          --mobile-dock-h: 64px;              /* height of <MobileTabBar> */
          --fab-z: 2147483647;                /* FAB sits above everything */
          --bot-z: 2147483646;                /* chatbot sits just below the FAB */
          --bot-size: 72px;                   /* approx. diameter of chatbot bubble */
          --fab-size: 48px;                   /* diameter of your h-12 w-12 FAB */
          --bot-gap: 14px;                    /* spacing between FAB & chatbot */
        }

        /* Helper class: place FAB vertically above the chatbot bubble
           and align the CIRCLES' CENTERS horizontally */
        .fab-above-bot {
          /* 1rem = Tailwind right-4. We add half the size difference so centers align */
          right: calc(1rem + max(0px, (var(--bot-size) - var(--fab-size)) / 2));
          bottom: calc(var(--bot-size) + var(--bot-gap) + env(safe-area-inset-bottom));
          z-index: var(--fab-z);
        }

        /* Make the create-post FAB a bit smaller on tiny screens */
        @media (max-width: 640px) {
          :root {
            --bot-size: 64px;
            --fab-size: 44px;   /* small FAB for small screens */
            --bot-gap: 10px;
          }
          .create-post-fab { width: 44px; height: 44px; }
        }
      `}</style>

      <SiteNavbar />

      {/* Give content/footer room above the bottom tab bar */}
      <div className="pb-[calc(var(--mobile-dock-h,0px)+env(safe-area-inset-bottom))]">
        <RouteContainer>
          <Outlet />
        </RouteContainer>
        <SiteFooter />
      </div>

      {/* Fixed Mobile bottom nav */}
      <MobileTabBar height={64} />

      {/* Keep the bot in a stacking context just under the FAB */}
      <div className="relative z-[var(--bot-z)]">
        <AIChatBot />
      </div>
    </div>
  );
}
