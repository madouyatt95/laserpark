import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useParkStore } from '../stores/parkStore';
import '../styles/login.css';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { parks } = useParkStore();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff' as 'staff' | 'manager',
        park_id: parks[0]?.id || '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (!formData.full_name.trim()) {
            setError('Veuillez entrer votre nom complet');
            return;
        }

        if (!isSupabaseConfigured()) {
            setError('Supabase non configuré. Utilisez les comptes de démonstration.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: signUpError } = await supabase!.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        role: formData.role,
                        park_id: formData.park_id,
                    }
                }
            });

            if (signUpError) {
                throw signUpError;
            }

            if (data.user) {
                // Update profile with park_id
                await supabase!
                    .from('profiles')
                    .update({ park_id: formData.park_id })
                    .eq('id', data.user.id);
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Signup error:', err);
            if (err.message?.includes('already registered')) {
                setError('Cet email est déjà utilisé');
            } else {
                setError(err.message || 'Erreur lors de l\'inscription');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-page">
                <div className="login-background">
                    <div className="login-gradient-1"></div>
                    <div className="login-gradient-2"></div>
                </div>

                <div className="login-container">
                    <div className="signup-success glass-panel">
                        <div className="success-icon">✅</div>
                        <h2>Inscription réussie !</h2>
                        <p>
                            Vérifiez votre email <strong>{formData.email}</strong> pour confirmer votre compte.
                        </p>
                        <p className="text-muted">
                            Vous pourrez ensuite vous connecter avec vos identifiants.
                        </p>
                        <Link to="/login" className="btn btn-primary btn-lg">
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="login-title"><span className="text-gradient">Inscription</span></h1>
                    <p className="login-subtitle">Créer un nouveau compte</p>
                </div>

                <form className="login-form glass-panel" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label" htmlFor="full_name">Nom complet</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            className="input"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Jean Dupont"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
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
                                name="password"
                                className="input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                minLength={6}
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

                    <div className="input-group">
                        <label className="input-label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="park_id">Parc assigné</label>
                        <select
                            id="park_id"
                            name="park_id"
                            className="input"
                            value={formData.park_id}
                            onChange={handleChange}
                            required
                        >
                            {parks.filter(p => p.is_active).map(park => (
                                <option key={park.id} value={park.id}>
                                    {park.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner spinner-sm"></span>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                Créer mon compte
                            </>
                        )}
                    </button>

                    <div className="signup-footer">
                        <Link to="/login" className="signup-link">
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
