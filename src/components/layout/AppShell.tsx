import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const AppShell: React.FC = () => {
    return (
        <div className="app-shell">
            <Header />
            <main className="app-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default AppShell;
