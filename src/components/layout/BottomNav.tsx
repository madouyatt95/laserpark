import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    Package,
    FileBarChart,
    Settings
} from 'lucide-react';
import '../../styles/layout.css';

const BottomNav: React.FC = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/caisse', icon: Wallet, label: 'Caisse' },
        { to: '/stocks', icon: Package, label: 'Stocks' },
        { to: '/rapports', icon: FileBarChart, label: 'Rapports' },
        { to: '/parametres', icon: Settings, label: 'Paramètres' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
