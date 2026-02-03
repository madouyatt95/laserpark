import React, { useState } from 'react';
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
    Tag
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useParkStore } from '../stores/parkStore';
import { useUserStore } from '../stores/userStore';
import { UserRole } from '../types';
import PinLock from '../components/auth/PinLock';
import MobileModal from '../components/common/MobileModal';
import '../styles/parametres.css';

const ParametresPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, canManagePlanning, canAccessClosure } = useAuthStore();
    const { parks, toggleParkStatus } = useParkStore();
    const { getAllUsers, addUser, toggleUserStatus } = useUserStore();

    const isSuperAdmin = user?.role === 'super_admin';
    const isManager = user?.role === 'manager';
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showPinLock, setShowPinLock] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);

    // New user form state
    const [newUserForm, setNewUserForm] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'staff' as UserRole,
        park_id: parks[0]?.id || '',
    });

    const allUsers = getAllUsers();

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

    const getRoleBadge = (role: UserRole) => {
        const config = {
            super_admin: { label: 'Super Admin', class: 'badge-primary' },
            manager: { label: 'Manager', class: 'badge-info' },
            staff: { label: 'Staff', class: 'badge-secondary' },
        };
        return config[role];
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
                        <h3 className="settings-section-title">Utilisateurs ({allUsers.length})</h3>
                        <button className="btn btn-sm btn-primary" onClick={() => setShowAddUser(true)}>
                            <UserPlus size={16} />
                            Ajouter
                        </button>
                    </div>
                    <div className="users-list">
                        {allUsers.map(u => {
                            const badge = getRoleBadge(u.role);
                            const parkName = parks.find(p => p.id === u.park_id)?.name;
                            return (
                                <div key={u.id} className={`user-item ${!u.is_active ? 'inactive' : ''}`}>
                                    <div className="user-item-avatar">
                                        {u.full_name.charAt(0)}
                                    </div>
                                    <div className="user-item-info">
                                        <span className="user-item-name">{u.full_name}</span>
                                        <span className="user-item-email">{u.email}</span>
                                        <div className="user-item-meta">
                                            <span className={`badge ${badge.class}`}>{badge.label}</span>
                                            {parkName && <span className="user-item-park">{parkName}</span>}
                                        </div>
                                    </div>
                                    {u.id !== user?.id && (
                                        <button
                                            className={`btn btn-sm ${u.is_active ? 'btn-success' : 'btn-secondary'}`}
                                            onClick={() => toggleUserStatus(u.id)}
                                        >
                                            {u.is_active ? 'Actif' : 'Inactif'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
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

            {/* Logout Button */}
            <button className="btn btn-danger logout-btn" onClick={logout}>
                Se déconnecter
            </button>

            {/* Version Info */}
            <div className="version-info">
                <p>LaserPark PWA v1.2.0</p>
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

            {/* Add User Modal */}
            <MobileModal
                isOpen={showAddUser}
                onClose={() => setShowAddUser(false)}
                title="Nouvel utilisateur"
            >
                <div className="form-group">
                    <label className="input-label">Nom complet</label>
                    <div className="input-with-icon">
                        <User size={18} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Jean Dupont"
                            value={newUserForm.full_name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="input-label">Email</label>
                    <div className="input-with-icon">
                        <Mail size={18} />
                        <input
                            type="email"
                            className="input"
                            placeholder="email@laserpark.ci"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="input-label">Mot de passe</label>
                    <div className="input-with-icon">
                        <Key size={18} />
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="input-label">Rôle</label>
                    <select
                        className="input"
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
                {newUserForm.role !== 'super_admin' && (
                    <div className="form-group">
                        <label className="input-label">Parc assigné</label>
                        <select
                            className="input"
                            value={newUserForm.park_id}
                            onChange={(e) => setNewUserForm({ ...newUserForm, park_id: e.target.value })}
                        >
                            {parks.filter(p => p.is_active).map(park => (
                                <option key={park.id} value={park.id}>{park.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setShowAddUser(false)}>
                        Annuler
                    </button>
                    <button className="btn btn-primary" onClick={handleAddUser}>
                        <UserPlus size={16} />
                        Créer
                    </button>
                </div>
            </MobileModal>
        </div>
    );
};

export default ParametresPage;
