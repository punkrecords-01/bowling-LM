import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (pin: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Mateus (Gerente)', role: 'gerente', pin: '1234' },
    { id: 'u2', name: 'Atendente 01', role: 'atendente', pin: '0000' },
    { id: 'u3', name: 'Caixa 01', role: 'caixa', pin: '1111' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('strike_user');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('strike_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('strike_user');
        }
    }, [user]);

    const login = (pin: string) => {
        const foundUser = MOCK_USERS.find(u => u.pin === pin);
        if (foundUser) {
            setUser(foundUser);
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
