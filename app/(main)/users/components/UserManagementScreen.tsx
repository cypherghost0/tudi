"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Shield,
    Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { UserManagement, getAllUsers } from '../../../lib/firebase/users';
import { toast } from 'sonner';
import { UserSearch } from './UserSearch';
import { UsersHeader } from './UsersHeader';
import { UserTable } from './UserTable';
import { UserDetailsDrawer } from './UserDetailsDrawer';

export function UserManagementScreen() {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserManagement[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserManagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Check if current user is admin
    const isAdmin = userProfile?.role === 'admin';

    // Load users
    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUsers();
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search term, role, and status
    const filterUsers = useCallback(() => {
        let filtered = users;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(user => user.isActive === isActive);
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Handle user selection
    const handleUserSelect = (user: UserManagement) => {
        setSelectedUser(user);
        setIsDrawerOpen(true);
    };

    // Handle user update (refresh the list)
    const handleUserUpdate = () => {
        loadUsers();
        setIsDrawerOpen(false);
        setSelectedUser(null);
    };

    // Initial load
    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);

    // Filter users when search term or filters change
    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    // If not admin, show unauthorized message
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                            <p className="text-muted-foreground">
                                You need admin privileges to access user management.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <UsersHeader
                totalUsers={users.length}
                activeUsers={users.filter(u => u.isActive).length}
                onRefresh={loadUsers}
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                {filteredUsers.length} of {users.length} users
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <UserSearch
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        roleFilter={roleFilter}
                        onRoleFilterChange={setRoleFilter}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />

                    <div className="mt-6">
                        <UserTable
                            users={filteredUsers}
                            loading={loading}
                            onUserSelect={handleUserSelect}
                            onRefresh={loadUsers}
                        />
                    </div>
                </CardContent>
            </Card>

            <UserDetailsDrawer
                user={selectedUser}
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedUser(null);
                }}
                onUserUpdate={handleUserUpdate}
            />
        </div>
    );
}