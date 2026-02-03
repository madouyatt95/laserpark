import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
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

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-gradient-1"></div>
                <div className="login-gradient-2"></div>
            </div>

            <div className="login-container">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <img src="/pwa-192x192.png" alt="LaserPark Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
                    </div>
                    <h1 className="login-title"><span className="text-gradient">LaserPark</span></h1>
                    <p className="login-subtitle">Gestion Multi-Parcs</p>
                </div>

                <form className="login-form glass-panel" onSubmit={handleSubmit}>
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

                    <div className="signup-footer">
                        <span>Pas encore de compte ?</span>
                        <Link to="/signup" className="signup-link">
                            <UserPlus size={16} />
                            S'inscrire
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
