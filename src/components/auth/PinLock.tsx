import React, { useState, useEffect, useRef } from 'react';
import { Lock, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import './PinLock.css';

interface PinLockProps {
    onSuccess: () => void;
    onCancel: () => void;
    title?: string;
}

const PinLock: React.FC<PinLockProps> = ({ onSuccess, onCancel, title = 'Entrez votre code PIN' }) => {
    const { user } = useAuthStore();
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Default PIN is last 4 digits of user ID or "1234"
    const correctPin = user?.id?.slice(-4) || '1234';

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleInput = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError(false);

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }

        // Check PIN when all digits entered
        if (newPin.every(d => d !== '')) {
            const enteredPin = newPin.join('');
            if (enteredPin === correctPin) {
                onSuccess();
            } else {
                setError(true);
                setPin(['', '', '', '']);
                setActiveIndex(0);
                inputRefs.current[0]?.focus();

                // Vibrate on error if available
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleNumpadClick = (num: string) => {
        if (activeIndex < 4) {
            handleInput(activeIndex, num);
        }
    };

    const handleBackspace = () => {
        if (activeIndex > 0) {
            const newPin = [...pin];
            newPin[activeIndex - 1] = '';
            setPin(newPin);
            setActiveIndex(activeIndex - 1);
        } else if (pin[0]) {
            setPin(['', '', '', '']);
        }
    };

    return (
        <div className="pin-overlay">
            <div className="pin-modal">
                <button className="pin-close" onClick={onCancel}>
                    <X size={24} />
                </button>

                <div className="pin-icon">
                    <Lock size={32} />
                </div>

                <h2 className="pin-title">{title}</h2>

                {error && (
                    <p className="pin-error">Code incorrect</p>
                )}

                <div className={`pin-inputs ${error ? 'shake' : ''}`}>
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInput(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onFocus={() => setActiveIndex(index)}
                            className={`pin-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                        />
                    ))}
                </div>

                {/* Numpad for mobile */}
                <div className="pin-numpad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((num, i) => (
                        <button
                            key={i}
                            className={`numpad-btn ${num === '' ? 'empty' : ''}`}
                            onClick={() => num === '←' ? handleBackspace() : num && handleNumpadClick(num)}
                            disabled={num === ''}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <p className="pin-hint">
                    Code par défaut: les 4 derniers caractères de votre ID
                </p>
            </div>
        </div>
    );
};

export default PinLock;
