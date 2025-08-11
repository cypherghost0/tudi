"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  MoreHorizontal, 
  Shield, 
  User, 
  UserCheck, 
  UserX, 
  RotateCcw,
  Eye,
  ShieldCheck,
  Users
} from 'lucide-react';
import { UserManagement, updateUserRole, updateUserStatus, resetUserPassword } from '../../../lib/firebase/users';
import { UserRole } from '../../../contexts/auth-context';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserTableProps {
  users: UserManagement[];
  loading: boolean;
  onUserSelect: (user: UserManagement) => void;
  onRefresh: () => void;
}

export function UserTable({ users, loading, onUserSelect, onRefresh }: UserTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'cashier':
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'cashier':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getInitials = (email: string | null, displayName?: string) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const newStatus = !currentStatus;
      await updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus ? 'enabled' : 'disabled'} successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePasswordReset = async (email: string | null, userId: string) => {
    if (!email) {
      toast.error('Cannot reset password: No email address');
      return;
    }

    try {
      setActionLoading(userId);
      await resetUserPassword(email);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No users found</h3>
        <p className="text-muted-foreground">
          No users match your current search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.email, user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.displayName || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={getRoleBadgeVariant(user.role)}
                  className="flex items-center gap-1 w-fit"
                >
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <UserX className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(user.createdAt, 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.lastLogin ? format(user.lastLogin, 'MMM dd, yyyy') : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={actionLoading === user.uid}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onUserSelect(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {/* Role Change Options */}
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    {(['admin', 'cashier', 'user'] as UserRole[]).map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => handleRoleChange(user.uid, role)}
                        disabled={user.role === role}
                      >
                        {getRoleIcon(role)}
                        <span className="ml-2 capitalize">{role}</span>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    
                    {/* Status Toggle */}
                    <DropdownMenuItem
                      onClick={() => handleStatusToggle(user.uid, user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Disable User
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Enable User
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    {/* Password Reset */}
                    <DropdownMenuItem
                      onClick={() => handlePasswordReset(user.email, user.uid)}
                      disabled={!user.email}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}