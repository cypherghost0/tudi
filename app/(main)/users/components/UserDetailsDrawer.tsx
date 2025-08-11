"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  User,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  RotateCcw,
  ShieldCheck,
  Clock,
  Save
} from 'lucide-react';
import { UserManagement, updateUserRole, updateUserStatus, resetUserPassword } from '../../../lib/firebase/users';
import { UserRole } from '../../../contexts/auth-context';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserDetailsDrawerProps {
  user: UserManagement | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export function UserDetailsDrawer({ user, isOpen, onClose, onUserUpdate }: UserDetailsDrawerProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  if (!user) return null;

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

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) {
      toast.info('No changes to save');
      return;
    }

    try {
      setLoading(true);
      await updateUserRole(user.uid, selectedRole);
      toast.success(`User role updated to ${selectedRole}`);
      onUserUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setLoading(true);
      const newStatus = !user.isActive;
      await updateUserStatus(user.uid, newStatus);
      toast.success(`User ${newStatus ? 'enabled' : 'disabled'} successfully`);
      onUserUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) {
      toast.error('Cannot reset password: No email address');
      return;
    }

    try {
      setLoading(true);
      await resetUserPassword(user.email);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View and manage user account information
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* User Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(user.email, user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {user.displayName || 'No display name'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">User ID</label>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    {user.uid}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {format(user.createdAt, 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">Last Login</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    {user.lastLogin ? format(user.lastLogin, 'MMM dd, yyyy') : 'Never'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Role</label>
                <div className="mt-1">
                  <Badge 
                    variant={getRoleBadgeVariant(user.role)}
                    className="flex items-center gap-1 w-fit"
                  >
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Change Role</label>
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="cashier">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Cashier
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole !== user.role && (
                <Button 
                  onClick={handleRoleUpdate} 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Role
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Actions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status Toggle */}
              <Button
                variant={user.isActive ? "destructive" : "default"}
                className="w-full"
                disabled={loading}
                onClick={handleStatusToggle}
              >
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Disable User
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Enable User
                  </>
                )}
              </Button>

              {/* Password Reset */}
              <Button
                variant="outline"
                className="w-full"
                disabled={loading || !user.email}
                onClick={handlePasswordReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}