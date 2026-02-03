import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import ConnectivityIndicator from './ConnectivityIndicator';
import { useParkStore } from '../../stores/parkStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { isSupabaseConfigured } from '../../lib/supabase';

const AppShell: React.FC = () => {
    const { fetchParks, selectPark, selectedParkId } = useParkStore();
    const { fetchCategories } = useCategoryStore();
    const { user, isAuthenticated } = useAuthStore();

    // Load data from Supabase on app startup
    useEffect(() => {
        const loadData = async () => {
            if (!isAuthenticated || !isSupabaseConfigured()) return;

            try {
                // Fetch parks first
                await fetchParks();

                // If user has a park_id assigned, select it
                if (user?.park_id && !selectedParkId) {
                    selectPark(user.park_id);
                }

                // Fetch categories
                await fetchCategories();
            } catch (error) {
                console.error('Error loading app data:', error);
            }
        };

        loadData();
    }, [isAuthenticated, user?.park_id]);

    return (
        <div className="app-shell">
            <Header />
            <ConnectivityIndicator />
            <main className="app-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default AppShell;
