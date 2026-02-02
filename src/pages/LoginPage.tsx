import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/login.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { login, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        await login(email, password);
    };

    const handleDemoLogin = async (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword(demoEmail.includes('admin') ? 'admin123' : 'manager123');
        await login(demoEmail, demoEmail.includes('admin') ? 'admin123' : 'manager123');
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-gradient-1"></div>
                <div className="login-gradient-2"></div>
            </div>

            <div className="login-container">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <Zap size={32} />
                    </div>
                    <h1 className="login-title">LaserPark</h1>
                    <p className="login-subtitle">Gestion Multi-Parcs</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Mot de passe</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner spinner-sm"></span>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="login-demo">
                    <p className="login-demo-title">Comptes de démonstration</p>
                    <div className="login-demo-buttons">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDemoLogin('admin@laserpark.ci')}
                            disabled={isLoading}
                        >
                            👑 Super Admin
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDemoLogin('manager.angre@laserpark.ci')}
                            disabled={isLoading}
                        >
                            🎯 Manager Angré
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDemoLogin('manager.zone4@laserpark.ci')}
                            disabled={isLoading}
                        >
                            🎯 Manager Zone 4
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
