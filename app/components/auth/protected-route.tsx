"use client";

import { useAuth } from '@/app/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/app/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && userProfile) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(userProfile.role) && userProfile.role !== 'admin') {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [user, userProfile, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiredRole && userProfile) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userProfile.role) && userProfile.role !== 'admin') {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Convenience components for different role requirements
export function AdminOnly({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return <ProtectedRoute requiredRole="admin" fallback={fallback}>{children}</ProtectedRoute>;
}

export function AdminOrCashierOnly({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return <ProtectedRoute requiredRole={['admin', 'cashier']} fallback={fallback}>{children}</ProtectedRoute>;
}

export function CashierOnly({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return <ProtectedRoute requiredRole="cashier" fallback={fallback}>{children}</ProtectedRoute>;
}
