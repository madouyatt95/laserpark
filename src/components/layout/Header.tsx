import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useParkStore } from '../../stores/parkStore';
import { ChevronDown, LogOut, User } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import '../layout/Header.css';

interface HeaderProps {
    title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { user, logout } = useAuthStore();
    const { parks, selectedParkId, selectPark, getSelectedPark } = useParkStore();

    const selectedPark = getSelectedPark();
    const isSuperAdmin = user?.role === 'super_admin';
    const activeParks = parks.filter(p => p.is_active);

    const handleParkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        selectPark(e.target.value);
    };

    return (
        <header className="header">
            <div className="header-left">
                {isSuperAdmin ? (
                    <div className="park-selector">
                        <select
                            value={selectedParkId || ''}
                            onChange={handleParkChange}
                            className="park-select"
                        >
                            {activeParks.map(park => (
                                <option key={park.id} value={park.id}>
                                    {park.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="park-select-icon" />
                    </div>
                ) : (
                    <div className="header-park-name">
                        {selectedPark?.name || title || 'LaserPark'}
                    </div>
                )}
            </div>

            <div className="header-right">
                <NotificationCenter />
                <div className="header-user">
                    <div className="avatar avatar-sm">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="header-user-info">
                        <span className="header-user-name">{user?.full_name}</span>
                        <span className="header-user-role">
                            {user?.role === 'super_admin' ? 'Super Admin' :
                                user?.role === 'manager' ? 'Manager' : 'Staff'}
                        </span>
                    </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={logout} title="Déconnexion">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
