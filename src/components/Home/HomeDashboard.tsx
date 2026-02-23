"use client";

import { useState } from "react";
import UserNavigation from "./UserNavigation";
import UserHome from "./UserHome";
import UserProjects from "./UserProjects";
import DashboardHeader from "./DashboardHeader";
import { type SparkxSession } from "@/lib/sparkx-session";

interface HomeDashboardProps {
  session: SparkxSession;
}

export default function HomeDashboard({ session }: HomeDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "projects">("home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <UserNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pl-32">
        <DashboardHeader session={session} />
        {activeTab === "home" ? (
          <UserHome session={session} />
        ) : (
          <UserProjects />
        )}
      </div>
    </div>
  );
}
