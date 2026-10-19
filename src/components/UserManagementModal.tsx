import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserPlus,
  Search,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Pencil,
  Key,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

import type { AppUser, UserRole, UserSession } from '../types/blog';
import {
  fetchUsersFromSupabase,
  createUserInSupabase,
  assignUserRoleBySuperadmin,
  deleteUserFromSupabase,
  adminUpdateUserDetails,
} from '../services/supabaseService';


interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
}

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-seed-001',
    email: 'superadmin@stcastudios.com',
    username: 'SuperAdmin',
    full_name: 'Lead Super Administrator',
    role: 'superadmin',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-seed-002',
    email: 'admin@stcastudios.com',
    username: 'Admin',
    full_name: 'Production Studio Admin',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-seed-003',
    email: 'user@stcastudios.com',
    username: 'StandardUser',
    full_name: 'Standard Team Member',
    role: 'standard user',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('standard user');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [editRole, setEditRole] = useState<UserRole>('standard user');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const isSuperadmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin';
  const isStandardUser = !isSuperadmin && !isAdmin;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsersFromSupabase();
      if (data && data.length > 0) {
        setUsers(data);
        setIsSupabaseConnected(true);
      } else {
        // Fallback or empty DB
        setIsSupabaseConnected(false);
        const local = localStorage.getItem('stca_local_users');
        if (local) {
          try {
            setUsers(JSON.parse(local));
          } catch {
            setUsers(DEFAULT_USERS);
          }
        } else {
          setUsers(DEFAULT_USERS);
        }
      }
    } catch {
      setIsSupabaseConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const saveLocalUsers = (updated: AppUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem('stca_local_users', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newEmail.trim()) {
      setFormError('Email is required');
      return;
    }

    // Role check to strictly adhere to superadmin, admin, standard user
    if (!['superadmin', 'admin', 'standard user'].includes(newRole)) {
      setFormError('Invalid role specified');
      return;
    }

    const newUserPayload: Partial<AppUser> = {
      email: newEmail.trim().toLowerCase(),
      username: newUsername.trim() || newEmail.split('@')[0],
      full_name: newFullName.trim() || newEmail.split('@')[0],
      role: newRole,
      status: 'active',
    };

    if (isSupabaseConnected) {
      const res = await createUserInSupabase(newUserPayload);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      if (res.user) {
        setUsers((prev) => [res.user!, ...prev]);
      }
    } else {
      const localUser: AppUser = {
        id: 'user-' + Date.now(),
        email: newUserPayload.email!,
        username: newUserPayload.username!,
        full_name: newUserPayload.full_name!,
        role: newRole,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      saveLocalUsers([localUser, ...users]);
    }

    setNewEmail('');
    setNewUsername('');
    setNewFullName('');
    setNewRole('standard user');
    setIsAddingUser(false);
    setActionSuccess('User successfully added with role: ' + newRole);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRoleChange = async (userId: string, newSelectedRole: UserRole) => {
    if (!isSuperadmin) {
      alert('Access Denied: Only the Superadmin can assign or modify user roles.');
      return;
    }

    // Exclude superadmin: can only assign admin or standard user
    if (!['admin', 'standard user'].includes(newSelectedRole)) return;

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser || targetUser.role === 'superadmin') return;

    if (isSupabaseConnected) {
      const res = await assignUserRoleBySuperadmin(userId, newSelectedRole);
      if (!res.success) {
        alert('Could not update user role: ' + res.error);
        return;
      }
    }

    const updated = users.map((u) => (u.id === userId ? { ...u, role: newSelectedRole } : u));
    saveLocalUsers(updated);
    setActionSuccess(`Role updated to "${newSelectedRole}"`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditUsername(u.username || '');
    setEditStatus(u.status || 'active');
    setEditRole(u.role);
    setEditPassword('');
    setShowEditPassword(false);
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditError(null);
    setEditPassword('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (editPassword && editPassword.trim().length > 0 && editPassword.trim().length < 6) {
      setEditError('New password must be at least 6 characters long.');
      return;
    }

    setEditSaving(true);
    try {
      if (isSupabaseConnected) {
        const res = await adminUpdateUserDetails(editingUser.id, {
          fullName: editFullName,
          username: editUsername,
          status: editStatus,
          role: editRole,
          password: editPassword.trim() || undefined,
        });

        if (!res.success && res.error) {
          setEditError(res.error);
          setEditSaving(false);
          return;
        }

        if (res.warning) {
          setActionSuccess(res.warning);
        } else {
          setActionSuccess(
            `User "${editingUser.email}" updated successfully` +
              (editPassword.trim() ? ' with new password!' : '.')
          );
        }
      } else {
        setActionSuccess(
          `User "${editingUser.email}" updated locally` +
            (editPassword.trim() ? ' with new password!' : '.')
        );
      }

      const updated = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              full_name: editFullName.trim() || u.full_name,
              username: editUsername.trim() || u.username,
              status: editStatus,
              role: editRole,
            }
          : u
      );
      saveLocalUsers(updated);
      closeEditModal();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };



  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUser.email) {
      alert('You cannot delete your own active logged-in user.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) return;

    if (isSupabaseConnected) {
      await deleteUserFromSupabase(userId);
    }

    const updated = users.filter((u) => u.id !== userId);
    saveLocalUsers(updated);
    setActionSuccess(`User ${userEmail} deleted`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const copySqlSnippet = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'standard user' CHECK (role IN ('superadmin', 'admin', 'standard user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_superadmin ON public.users (role) WHERE role = 'superadmin';
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write to users" ON public.users;
CREATE POLICY "Allow public read/write to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Admin update user & reset password function
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id TEXT,
  new_full_name TEXT DEFAULT NULL,
  new_username TEXT DEFAULT NULL,
  new_status TEXT DEFAULT NULL,
  new_role TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uuid UUID;
  v_email TEXT;
  v_current_role TEXT;
BEGIN
  BEGIN
    v_uuid := target_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_uuid := NULL;
  END;
  SELECT email, role INTO v_email, v_current_role FROM public.users
  WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR id::TEXT = target_user_id OR email = target_user_id;
  IF v_email IS NULL AND v_uuid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uuid;
  END IF;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  UPDATE public.users
  SET
    full_name = COALESCE(NULLIF(trim(new_full_name), ''), full_name),
    username = COALESCE(NULLIF(trim(new_username), ''), username),
    status = CASE WHEN new_status IN ('active', 'suspended', 'pending') THEN new_status ELSE status END,
    role = CASE WHEN v_current_role = 'superadmin' THEN 'superadmin' WHEN new_role IN ('admin', 'standard user') THEN new_role ELSE role END,
    updated_at = NOW()
  WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR id::TEXT = target_user_id OR email = v_email;
  IF new_password IS NOT NULL AND length(trim(new_password)) >= 6 THEN
    UPDATE auth.users
    SET encrypted_password = crypt(trim(new_password), gen_salt('bf')), updated_at = NOW()
    WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR email = v_email;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;`;


    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Make sure current user is included if loaded list doesn't have them
  const allUsersWithCurrent = users.some((u) => u.email === currentUser.email)
    ? users
    : [
        {
          id: currentUser.id || 'usr-current',
          email: currentUser.email,
          username: currentUser.username,
          full_name: currentUser.username,
          role: currentUser.role || 'standard user',
          status: 'active' as const,
          created_at: new Date().toISOString(),
        },
        ...users,
      ];

  // RBAC Access Control:
  // - superadmin: can see ALL users
  // - admin: can see standard user (+ their own admin account)
  // - standard user: can see ONLY their own account infor
  const accessibleUsers = allUsersWithCurrent.filter((u) => {
    if (isSuperadmin) return true;
    if (isAdmin) {
      // Admin sees standard users and their own self row
      return u.role === 'standard user' || u.email === currentUser.email;
    }
    // Standard user can ONLY see their own account info
    return u.email === currentUser.email || u.id === currentUser.id;
  });

  const filteredUsers = accessibleUsers.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            superadmin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            admin
          </span>
        );
      case 'standard user':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            standard user
          </span>
        );
    }
  };

  const countByRole = {
    total: allUsersWithCurrent.length,
    superadmin: allUsersWithCurrent.filter((u) => u.role === 'superadmin').length,
    admin: allUsersWithCurrent.filter((u) => u.role === 'admin').length,
    standard: allUsersWithCurrent.filter((u) => u.role === 'standard user').length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isSuperadmin
                ? 'bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-amber-500/30'
                : isAdmin
                ? 'bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border-blue-500/30'
                : 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
            }`}>
              {isSuperadmin ? (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              ) : isAdmin ? (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              ) : (
                <User className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">
                  {isSuperadmin
                    ? 'User Management'
                    : isAdmin
                    ? 'Team Management'
                    : 'Account Information'}
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
                  isSuperadmin
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : isAdmin
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}>
                  {isSuperadmin
                    ? 'Superadmin RBAC'
                    : isAdmin
                    ? 'Admin Access'
                    : 'Personal Profile'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isSuperadmin
                  ? 'Manage all team members & strictly assign roles: superadmin, admin, and standard user.'
                  : isAdmin
                  ? 'Manage standard studio members and active team accounts.'
                  : 'Your active studio credentials, personal details, and assigned role.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isStandardUser && (
              <button
                onClick={loadUsers}
                disabled={loading}
                title="Refresh users"
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Status Alert Banner (Superadmin only) */}
        {isSuperadmin && isSupabaseConnected === false && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-950/30 border border-amber-700/50 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Supabase Table Sync Note:</p>
                <p className="text-slate-300 mt-0.5">
                  The <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-200">public.users</code> table is defined in <code className="text-amber-300">supabase_schema.sql</code>. Execute the script in your Supabase SQL editor to connect live database synchronization.
                </p>
              </div>
            </div>
            <button
              onClick={copySqlSnippet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-medium transition shrink-0"
            >
              {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{sqlCopied ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
        )}

        {/* Action success alert */}
        {actionSuccess && (
          <div className="mx-6 mt-3 px-4 py-2 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Stats Row - Adaptive by Role */}
        {isSuperadmin ? (
          <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400">Total Members</span>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{countByRole.total}</div>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <span className="text-[11px] font-medium text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" /> superadmin
              </span>
              <div className="text-xl font-bold text-amber-200 mt-0.5">{countByRole.superadmin}</div>
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <span className="text-[11px] font-medium text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> admin
              </span>
              <div className="text-xl font-bold text-blue-200 mt-0.5">{countByRole.admin}</div>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-400" /> standard user
              </span>
              <div className="text-xl font-bold text-emerald-200 mt-0.5">{countByRole.standard}</div>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="p-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-400" /> Standard Users (Managed Team)
              </span>
              <div className="text-xl font-bold text-emerald-200 mt-0.5">{countByRole.standard}</div>
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <span className="text-[11px] font-medium text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> Your Studio Role
              </span>
              <div className="text-sm font-bold text-blue-200 mt-1">Admin (Studio Manager)</div>
            </div>
          </div>
        ) : (
          /* Standard user: Personal Account Overview Banner */
          <div className="p-6 pb-2">
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-slate-950/80 to-slate-950/80 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg font-bold text-emerald-300">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{currentUser.username}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Standard User
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{currentUser.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Access Tier</span>
                  <span className="text-xs font-semibold text-slate-300">Blog Production</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Actions Bar (Superadmin and Admin only) */}
        {!isStandardUser && (
          <div className="px-6 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              {isSuperadmin && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">superadmin</option>
                  <option value="admin">admin</option>
                  <option value="standard user">standard user</option>
                </select>
              )}
            </div>

            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-semibold rounded-lg shadow transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingUser ? 'Cancel' : isSuperadmin ? 'Add New User' : 'Add Standard Member'}</span>
            </button>
          </div>
        )}

        {/* Add User Drawer / Form */}
        {isAddingUser && !isStandardUser && (
          <form
            onSubmit={handleCreateUser}
            className="mx-6 mb-4 p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Add Team Member
              </h3>
              <span className="text-[11px] text-slate-400">
                {isSuperadmin ? 'Superadmin role assignment' : 'Standard user creation'}
              </span>
            </div>

            {formError && (
              <div className="p-2 bg-red-950/50 border border-red-500/40 rounded text-xs text-red-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@stcastudios.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="alex_creator"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Assign Role {isSuperadmin ? '(Superadmin Privilege)' : '(Standard Only)'}
                </label>
                {isSuperadmin ? (
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="standard user">standard user (Studio Member)</option>
                    <option value="admin">admin (Studio Manager)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="standard user"
                    className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-emerald-300 font-medium cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg shadow"
              >
                Save Member
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  {isSuperadmin && <th className="py-3 px-4">Change Role</th>}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperadmin ? 5 : 4} className="py-8 text-center text-slate-500">
                      No users match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.email === currentUser.email;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                              {u.username?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span>{u.full_name || u.username || 'User'}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 text-[9px] bg-slate-700/60 text-slate-300 rounded font-normal">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {u.status || 'active'}
                          </span>
                        </td>
                        {isSuperadmin && (
                          <td className="py-3 px-4">
                            {u.role === 'superadmin' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                Superadmin (Fixed)
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="admin">admin</option>
                                <option value="standard user">standard user</option>
                              </select>
                            )}
                          </td>
                        )}

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Edit button: Superadmin, Admin (for standard users & self), or Standard user (for self) */}
                            {(isSuperadmin || (isAdmin && u.role === 'standard user') || isSelf) && (
                              <button
                                onClick={() => openEditModal(u)}
                                title={isSelf ? 'Edit My Account Details & Password' : 'Edit User Details & Password'}
                                className={`p-1.5 rounded-lg transition ${
                                  isSelf
                                    ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete button: Superadmin or Admin (for standard users); Standard user cannot delete */}
                            {(isSuperadmin || (isAdmin && u.role === 'standard user')) && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={isSelf}
                                title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                                className={`p-1.5 rounded-lg transition ${
                                  isSelf
                                    ? 'text-slate-600 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          {!isStandardUser ? (
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Database constraint: <code className="text-amber-300">CHECK (role IN ('superadmin', 'admin', 'standard user'))</code>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Active Studio Account &bull; Authenticated Access</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>

        {/* Superadmin Edit User Details & Password Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {isStandardUser ? 'My Account & Credentials' : 'Edit User Details'}
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        {isSuperadmin ? 'Superadmin' : isAdmin ? 'Admin' : 'My Account'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isStandardUser
                        ? 'Update your display profile and change your account password'
                        : 'Update profile details, role, and reset authentication password'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {editError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Email Address (Immutable Auth Identity)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.email}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 cursor-not-allowed select-all"
                  />
                </div>

                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. alex_creator"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Status & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Account Status</label>
                    {isSuperadmin || isAdmin ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended' | 'pending')}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="active">Active (Access Allowed)</option>
                        <option value="suspended">Suspended (Access Revoked)</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={editingUser.status || 'active'}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-emerald-400 capitalize cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role</label>
                    {editingUser.role === 'superadmin' ? (
                      <input
                        type="text"
                        disabled
                        value="superadmin (Fixed Primary)"
                        className="w-full px-3 py-2 bg-slate-950/60 border border-amber-500/30 rounded-lg text-xs text-amber-300 font-semibold cursor-not-allowed"
                      />
                    ) : isSuperadmin ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                      >
                        <option value="admin">admin</option>
                        <option value="standard user">standard user</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={editingUser.role}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {/* Password Reset Section */}
                <div className="pt-2">
                  <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Set / Reset User Password
                      </label>
                      <span className="text-[10px] text-slate-400">Min 6 characters</span>
                    </div>

                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Leave blank to keep existing password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Entering a new password will re-encrypt and update the user credentials immediately in Supabase Authentication.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {editSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
