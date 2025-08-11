"use client";

import { ReactNode } from "react";
import { SidebarNavigation } from "@/app/components/navigation/sidebar-navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { useAuth } from "@/app/contexts/auth-context";
import {
    BarChart3,
    Home,
    LogOut,
    Package,
    Settings,
    ShoppingCart,
    Users,
    UserCog
} from "lucide-react";
import { usePathname } from "next/navigation";
import { OfflineStatus } from "@/app/components/offline-status";

export function MainLayoutContent({ children }: { children: ReactNode }) {
    const { userProfile, signOut } = useAuth();
    const pathname = usePathname();
    const navigationItems = [
        {
            title: "Tableau de bord",
            href: "/dashboard",
            icon: Home,
            roles: ["admin", "cashier"],
        },
        {
            title: "Ventes",
            href: "/sales",
            icon: ShoppingCart,
            roles: ["admin", "cashier"],
        },
        {
            title: "Produits",
            href: "/products",
            icon: Package,
            roles: ["admin", "cashier"],
        },
        {
            title: "Clients",
            href: "/customers",
            icon: Users,
            roles: ["admin"],
        },
        {
            title: "Gestion des utilisateurs",
            href: "/users",
            icon: UserCog,
            roles: ["admin"],
        },
        {
            title: "Rapports",
            href: "/reports",
            icon: BarChart3,
            roles: ["admin"],
        },
        {
            title: "paramètres",
            href: "/settings",
            icon: Settings,
            roles: ["admin"],
        },
    ];

    const filteredNavigationItems = navigationItems.filter(item =>
        userProfile?.role ? item.roles.includes(userProfile.role) : false
    );

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar>
                    <SidebarHeader className="border-b border-border/40">
                        <div className="flex items-center gap-2 px-2 py-3 sm:py-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                                <Package className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-sm font-semibold truncate">Tudi Electronique</h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {userProfile?.role === 'admin' ? 'Administrator' : 'Cashier'}
                                </p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarNavigation
                            items={filteredNavigationItems}
                            pathname={pathname}
                        />
                    </SidebarContent>

                    <SidebarFooter className="border-t border-border/40">
                        <div className="flex flex-row gap-4 p-2">
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {userProfile?.displayName || userProfile?.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize truncate">
                                        {userProfile?.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={signOut}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
                            >
                                <LogOut className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Sign Out</span>
                            </button>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
                        <SidebarTrigger className="-ml-1 h-8 w-8 sm:h-9 sm:w-9" />
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground hidden sm:inline">/</span>
                            <span className="font-medium truncate">
                                {navigationItems.find(item => pathname.endsWith(item.href.split('/').slice(2).join('/')))?.title || "Dashboard"}
                            </span>
                        </div>
                    </header>
                    <main className="flex-1 overflow-hidden">
                        <div className="w-full h-full p-4 md:p-6 overflow-auto">
                            {children}
                        </div>
                        <OfflineStatus />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
