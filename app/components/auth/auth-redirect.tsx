"use client";

import { useAuth } from "@/app/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return null; // or a loading spinner
    }

    return <>{children}</>;
}