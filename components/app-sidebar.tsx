"use client"

import * as React from "react"
import { useEffect, useState } from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  ClipboardCheck,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  School,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { createClient } from "@/lib/supabase/client";

// This is sample data.
const data_tutorial = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Dashboard",
      logo: GalleryVerticalEnd,
      plan: "SparkFBLA",
    },
    {
      name: "Home",
      logo: AudioWaveform,
      plan: "SparkFBLA",
    },
    {
      name: "SparkAI",
      logo: Command,
      plan: "SparkFBLA",
    },
  ],
  navMain: [
    {
      title: "State",
      url: "#",
      icon: Building2,
      items: [
        {
          title: "Calendar",
          url: "state/calendar",
        },
      ],
    },
    {
      title: "Chapter",
      url: "#",
      icon: School,
      items: [
        {
          title: "Membership",
          url: "chapter/membership",
        },
        {
          title: "Calendar",
          url: "chapter/calendar",
        },
      ],
    },
    {
      title: "Competition",
      url: "#",
      icon: ClipboardCheck,
      items: [
        {
          title: "Events",
          url: "competition/events",
        },
        {
          title: "Guidelines",
          url: "competition/guidelines",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "settings#general",
        },
        {
          title: "Limits",
          url: "settings#limits",
        },
      ],
    },
  ],
  projects: [
    {
      name: "SparkAI",
      url: "spark-ai",
      icon: Bot,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data_tutorial.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data_tutorial.navMain} />
        <NavProjects projects={data_tutorial.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  ) 
}
