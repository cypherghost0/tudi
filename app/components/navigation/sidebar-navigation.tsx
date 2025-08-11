"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";

interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

interface SidebarNavigationProps {
  items: NavigationItem[];
  pathname: string;
}

export function SidebarNavigation({ items, pathname }: SidebarNavigationProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs sm:text-sm">Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            // Check if current pathname matches the item href
            const isActive = pathname === item.href;
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} size="lg">
                  <Link href={item.href} className="min-h-[44px] sm:min-h-[40px]">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm sm:text-base">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}