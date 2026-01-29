import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            if (newPin.length === 4) {
                const success = login(newPin);
                if (!success) {
                    setError(true);
                    setTimeout(() => setPin(''), 500);
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const dots = Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`pin-dot ${pin.length > i ? 'active' : ''} ${error ? 'error' : ''}`} />
    ));

    return (
        <div className="login-container fade-in">
            <div className="login-box">
                <header className="login-header">
                    <div className="strike-logo">
                        <span className="pins">🎳</span>
                        <div className="strike-text">
                            <span className="brand-main">STRIKE</span>
                            <span className="brand-sub">BOLICHE BAR</span>
                        </div>
                    </div>
                </header>

                <div className="login-body">
                    <h2>Bem-vindo</h2>
                    <p>Digite seu PIN para acessar o sistema</p>

                    <div className="pin-display">
                        {dots}
                    </div>

                    <div className="numpad">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                            <button key={num} className="numpad-btn" onClick={() => handleNumberClick(num)}>
                                {num}
                            </button>
                        ))}
                        <button className="numpad-btn delete" onClick={handleDelete}>⌫</button>
                        <button className="numpad-btn" onClick={() => handleNumberClick('0')}>0</button>
                        <button className="numpad-btn clear" onClick={() => setPin('')}>C</button>
                    </div>
                </div>

                {error && <p className="login-error">PIN incorreto. Tente novamente.</p>}
            </div>
        </div>
    );
};

export default LoginPage;
