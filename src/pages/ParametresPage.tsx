import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Building2,
    ChevronRight,
    MapPin,
    Lock,
    Calendar,
    BarChart3,
    History,
    FileCheck,
    UserPlus,
    Users,
    Mail,
    Key,
    Tag,
    Trash2,
    Edit3,
    Database,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useParkStore } from '../stores/parkStore';
import { useUserStore } from '../stores/userStore';
import { useActivityStore } from '../stores/activityStore';
import { useExpenseStore } from '../stores/expenseStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole, User as UserType } from '../types';
import PinLock from '../components/auth/PinLock';
import MobileModal from '../components/common/MobileModal';
import '../styles/parametres.css';

const ParametresPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, canManagePlanning, canAccessClosure } = useAuthStore();
    const { parks, toggleParkStatus } = useParkStore();
    const { getAllUsers, addUser, toggleUserStatus, deleteUser } = useUserStore();

    const isSuperAdmin = user?.role === 'super_admin';
    const isManager = user?.role === 'manager';
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showPinLock, setShowPinLock] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [showEditUser, setShowEditUser] = useState(false);
    const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [supabaseUsers, setSupabaseUsers] = useState<UserType[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // New user form state
    const [newUserForm, setNewUserForm] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'staff' as UserRole,
        park_id: parks[0]?.id || '',
    });

    // Edit user form state
    const [editUserForm, setEditUserForm] = useState({
        role: 'staff' as UserRole,
        park_id: '',
        is_active: true,
    });

    // Fetch users from Supabase
    const fetchSupabaseUsers = async () => {
        if (!isSupabaseConfigured()) return;

        setIsLoadingUsers(true);
        try {
            const { data, error } = await supabase!
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
            } else {
                setSupabaseUsers(data as UserType[]);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin && activeSection === 'users') {
            fetchSupabaseUsers();
        }
    }, [isSuperAdmin, activeSection]);

    // Use Supabase users if configured, otherwise local store
    const allUsers = isSupabaseConfigured() ? supabaseUsers : getAllUsers();

    // Filter quick links based on permissions
    const allQuickLinks = [
        { id: 'cloture', icon: FileCheck, label: 'Clôture', path: '/cloture', requiresClosure: true },
        { id: 'planning', icon: Calendar, label: 'Planning', path: '/planning', requiresPlanning: false },
        { id: 'categories', icon: Tag, label: 'Catégories', path: '/categories', requiresClosure: false },
        { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics', requiresClosure: false },
        { id: 'audit', icon: History, label: 'Audit', path: '/audit', requiresClosure: true },
    ];

    // Staff can see planning (read-only view will be handled in PlanningPage)
    // Staff cannot see closure, analytics, audit
    const quickLinks = allQuickLinks.filter(link => {
        if (link.requiresClosure && !canAccessClosure()) return false;
        return true;
    });

    const handleAddUser = () => {
        if (!newUserForm.full_name || !newUserForm.email || !newUserForm.password) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        addUser({
            full_name: newUserForm.full_name,
            email: newUserForm.email,
            password: newUserForm.password,
            role: newUserForm.role,
            park_id: newUserForm.role === 'super_admin' ? null : newUserForm.park_id,
        });

        setNewUserForm({
            full_name: '',
            email: '',
            password: '',
            role: 'staff',
            park_id: parks[0]?.id || '',
        });
        setShowAddUser(false);
    };

    const handleEditUser = (u: UserType) => {
        setEditingUser(u);
        setEditUserForm({
            role: u.role || 'staff',
            park_id: u.park_id || parks[0]?.id || '',
            is_active: u.is_active,
        });
        setShowEditUser(true);
    };

    const handleSaveUserEdit = async () => {
        if (!editingUser) return;

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase!
                    .from('profiles')
                    .update({
                        role: editUserForm.role,
                        park_id: editUserForm.role === 'super_admin' ? null : editUserForm.park_id,
                        is_active: editUserForm.is_active,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;

                // Refresh users list
                await fetchSupabaseUsers();
                setShowEditUser(false);
                setEditingUser(null);
            } catch (err) {
                console.error('Error updating user:', err);
                alert('Erreur lors de la mise à jour');
            }
        } else {
            // Local store update
            toggleUserStatus(editingUser.id);
            setShowEditUser(false);
            setEditingUser(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase!
                    .from('profiles')
                    .delete()
                    .eq('id', userId);

                if (error) throw error;

                await fetchSupabaseUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Erreur lors de la suppression. L\'utilisateur doit être supprimé via Supabase Dashboard.');
            }
        } else {
            deleteUser(userId);
        }
    };

    const handleClearCaisseData = () => {
        if (!confirm('⚠️ Effacer toutes les transactions locales ?\n\nCette action supprimera uniquement les données de caisse stockées localement (activités et dépenses).\n\nLes données dans Supabase ne seront PAS affectées.')) {
            return;
        }

        // Only clear activities and expenses from localStorage
        // DO NOT clear parks, categories, auth, or other critical stores
        localStorage.removeItem('laserpark-activities');
        localStorage.removeItem('laserpark-expenses');
        localStorage.removeItem('laserpark-closures');

        // Reload the page to reset stores
        window.location.reload();
    };

    const getRoleBadge = (role: UserRole | null) => {
        if (!role) {
            return { label: 'En attente', class: 'badge-warning' };
        }
        const config = {
            super_admin: { label: 'Super Admin', class: 'badge-primary' },
            manager: { label: 'Manager', class: 'badge-info' },
            staff: { label: 'Staff', class: 'badge-secondary' },
        };
        return config[role] || { label: 'Inconnu', class: 'badge-secondary' };
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">Paramètres</span>
                </h1>
                <p className="page-subtitle">Configuration</p>
            </div>

            {/* User Info Card */}
            <div className="user-card">
                <div className="avatar avatar-lg">
                    {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="user-card-info">
                    <span className="user-card-name">{user?.full_name}</span>
                    <span className="user-card-email">{user?.email}</span>
                    <span className={`badge badge-${user?.role === 'super_admin' ? 'primary' : 'info'}`}>
                        {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                </div>
            </div>

            {/* Quick Links */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Accès rapide</h2>
                </div>
                <div className="quick-links-grid">
                    {quickLinks.map(item => (
                        <button
                            key={item.id}
                            className="quick-link-card"
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={24} />
                            <span className="quick-link-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Settings Menu */}
            <div className="settings-menu">
                <button
                    className="settings-item"
                    onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
                >
                    <div className="settings-item-icon">
                        <User size={20} />
                    </div>
                    <div className="settings-item-content">
                        <span className="settings-item-label">Mon profil</span>
                        <span className="settings-item-description">Informations personnelles</span>
                    </div>
                    <ChevronRight size={20} className="settings-item-arrow" />
                </button>

                {isSuperAdmin && (
                    <>
                        <button
                            className="settings-item"
                            onClick={() => setActiveSection(activeSection === 'users' ? null : 'users')}
                        >
                            <div className="settings-item-icon">
                                <Users size={20} />
                            </div>
                            <div className="settings-item-content">
                                <span className="settings-item-label">Utilisateurs</span>
                                <span className="settings-item-description">Gérer les profils</span>
                            </div>
                            <ChevronRight size={20} className={`settings-item-arrow ${activeSection === 'users' ? 'active' : ''}`} />
                        </button>

                        <button
                            className="settings-item"
                            onClick={() => setActiveSection(activeSection === 'parks' ? null : 'parks')}
                        >
                            <div className="settings-item-icon">
                                <Building2 size={20} />
                            </div>
                            <div className="settings-item-content">
                                <span className="settings-item-label">Parcs</span>
                                <span className="settings-item-description">Gestion des parcs</span>
                            </div>
                            <ChevronRight size={20} className={`settings-item-arrow ${activeSection === 'parks' ? 'active' : ''}`} />
                        </button>

                        <button
                            className="settings-item"
                            onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')}
                        >
                            <div className="settings-item-icon">
                                <Database size={20} />
                            </div>
                            <div className="settings-item-content">
                                <span className="settings-item-label">Données</span>
                                <span className="settings-item-description">Gérer les données locales</span>
                            </div>
                            <ChevronRight size={20} className={`settings-item-arrow ${activeSection === 'data' ? 'active' : ''}`} />
                        </button>
                    </>
                )}

                <button
                    className="settings-item"
                    onClick={() => setShowPinLock(true)}
                >
                    <div className="settings-item-icon">
                        <Lock size={20} />
                    </div>
                    <div className="settings-item-content">
                        <span className="settings-item-label">Code PIN</span>
                        <span className="settings-item-description">Tester le verrouillage</span>
                    </div>
                    <ChevronRight size={20} className="settings-item-arrow" />
                </button>
            </div>

            {/* Users Section (Super Admin) */}
            {activeSection === 'users' && isSuperAdmin && (
                <section className="settings-section">
                    <div className="settings-section-header">
                        <h3 className="settings-section-title">
                            Utilisateurs ({allUsers.length})
                            {isLoadingUsers && <RefreshCw size={16} className="spinner-inline" />}
                        </h3>
                        <button className="btn btn-sm btn-secondary" onClick={fetchSupabaseUsers} style={{ marginRight: '0.5rem' }}>
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <p className="settings-section-note" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        ℹ️ Les nouveaux utilisateurs s'inscrivent sur /signup et doivent être activés ici avec un rôle.
                    </p>
                    <div className="users-list">
                        {allUsers.map(u => {
                            const badge = getRoleBadge(u.role);
                            const parkName = parks.find(p => p.id === u.park_id)?.name;
                            const isPending = !u.is_active || !u.role;
                            return (
                                <div key={u.id} className={`user-item ${!u.is_active ? 'inactive' : ''} ${isPending ? 'pending' : ''}`}>
                                    <div className="user-item-avatar">
                                        {u.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="user-item-info">
                                        <span className="user-item-name">{u.full_name || 'Sans nom'}</span>
                                        <span className="user-item-email">{u.email}</span>
                                        <div className="user-item-meta">
                                            <span className={`badge ${badge.class}`}>{badge.label}</span>
                                            {parkName && <span className="user-item-park">{parkName}</span>}
                                            {isPending && <span className="badge badge-warning">⏳ En attente</span>}
                                        </div>
                                    </div>
                                    {u.id !== user?.id && (
                                        <div className="user-item-actions">
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => handleEditUser(u)}
                                                title="Modifier"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteUser(u.id)}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {allUsers.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                                Aucun utilisateur trouvé
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* Parks Section */}
            {activeSection === 'parks' && isSuperAdmin && (
                <section className="settings-section">
                    <h3 className="settings-section-title">Parcs configurés</h3>
                    <div className="parks-list">
                        {parks.map(park => (
                            <div key={park.id} className={`park-item ${!park.is_active ? 'inactive' : ''}`}>
                                <div className="park-item-info">
                                    <MapPin size={18} />
                                    <div>
                                        <span className="park-item-name">{park.name}</span>
                                        <span className="park-item-location">{park.city}, {park.country}</span>
                                    </div>
                                </div>
                                <button
                                    className={`btn btn-sm ${park.is_active ? 'btn-success' : 'btn-secondary'}`}
                                    onClick={() => toggleParkStatus(park.id)}
                                >
                                    {park.is_active ? 'Actif' : 'Inactif'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Data Management Section */}
            {activeSection === 'data' && isSuperAdmin && (
                <section className="settings-section">
                    <h3 className="settings-section-title">Gestion des données</h3>
                    <div className="data-actions">
                        <div className="data-action-item">
                            <div className="data-action-info">
                                <AlertTriangle size={20} color="var(--color-warning)" />
                                <div>
                                    <span className="data-action-label">Effacer les données de caisse</span>
                                    <span className="data-action-description">Supprime toutes les transactions et dépenses locales</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setShowClearDataConfirm(true)}
                            >
                                <Trash2 size={14} />
                                Effacer
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Logout Button */}
            <button className="btn btn-danger logout-btn" onClick={logout}>
                Se déconnecter
            </button>

            {/* Version Info */}
            <div className="version-info">
                <p>LaserPark PWA v1.3.0</p>
                <p>© 2026 LaserPark</p>
            </div>

            {/* PIN Lock Modal */}
            {showPinLock && (
                <PinLock
                    onSuccess={() => {
                        setShowPinLock(false);
                        alert('Code PIN correct !');
                    }}
                    onCancel={() => setShowPinLock(false)}
                />
            )}

            {/* Add User Modal - Removed since users self-register */}
            {/* Users should now use /signup page */}

            {/* Edit User Modal */}
            <MobileModal
                isOpen={showEditUser}
                onClose={() => { setShowEditUser(false); setEditingUser(null); }}
                title={`Modifier ${editingUser?.full_name || 'utilisateur'}`}
            >
                <div className="form-group">
                    <label className="input-label">Email</label>
                    <input
                        type="email"
                        className="input"
                        value={editingUser?.email || ''}
                        disabled
                    />
                </div>
                <div className="form-group">
                    <label className="input-label">Rôle</label>
                    <select
                        className="input"
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                    >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
                {editUserForm.role !== 'super_admin' && (
                    <div className="form-group">
                        <label className="input-label">Parc assigné</label>
                        <select
                            className="input"
                            value={editUserForm.park_id}
                            onChange={(e) => setEditUserForm({ ...editUserForm, park_id: e.target.value })}
                        >
                            {parks.filter(p => p.is_active).map(park => (
                                <option key={park.id} value={park.id}>{park.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group">
                    <label className="input-label">Statut</label>
                    <div className="toggle-group">
                        <button
                            type="button"
                            className={`btn btn-sm ${editUserForm.is_active ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => setEditUserForm({ ...editUserForm, is_active: true })}
                        >
                            Actif
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${!editUserForm.is_active ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setEditUserForm({ ...editUserForm, is_active: false })}
                        >
                            Inactif
                        </button>
                    </div>
                </div>
                <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => { setShowEditUser(false); setEditingUser(null); }}>
                        Annuler
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveUserEdit}>
                        Sauvegarder
                    </button>
                </div>
            </MobileModal>

            {/* Clear Data Confirmation Modal */}
            <MobileModal
                isOpen={showClearDataConfirm}
                onClose={() => setShowClearDataConfirm(false)}
                title="Confirmer la suppression"
            >
                <div className="confirm-delete-content">
                    <AlertTriangle size={48} color="var(--color-danger)" />
                    <p>Êtes-vous sûr de vouloir supprimer <strong>toutes les données de caisse</strong> ?</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Cette action supprimera toutes les transactions et dépenses stockées localement.
                        Les données Supabase ne seront pas affectées.
                    </p>
                </div>
                <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setShowClearDataConfirm(false)}>
                        Annuler
                    </button>
                    <button className="btn btn-danger" onClick={handleClearCaisseData}>
                        <Trash2 size={16} />
                        Supprimer tout
                    </button>
                </div>
            </MobileModal>
        </div>
    );
};

export default ParametresPage;
