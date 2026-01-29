import React, { useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import './AlertsSystem.css';

const AlertsSystem: React.FC = () => {
    const { lanes, reservations, sessions } = useLanes();
    const [alerts, setAlerts] = useState<string[]>([]);

    useEffect(() => {
        const checkAlerts = () => {
            const newAlerts: string[] = [];
            const now = Date.now();

            // 1. Check upcoming reservations (next 20 mins)
            reservations.forEach(res => {
                const diff = (res.startTime - now) / 60000;
                if (diff > 0 && diff <= 20 && res.status === 'pending') {
                    newAlerts.push(`Reserva próxima: ${res.customerName} em 20 min`);
                }
            });

            // 2. Check long active sessions (> 2h)
            sessions.filter(s => s.isActive).forEach(s => {
                const diff = (now - s.startTime) / 3600000;
                if (diff >= 2) {
                    const lane = lanes.find(l => l.id === s.laneId);
                    newAlerts.push(`Sessão Longa: ${lane?.name} ativa há 2h+`);
                }
            });

            setAlerts(newAlerts);
        };

        const interval = setInterval(checkAlerts, 30000); // check every 30s
        checkAlerts();

        return () => clearInterval(interval);
    }, [lanes, reservations, sessions]);

    if (alerts.length === 0) return null;

    return (
        <div className="alerts-container">
            {alerts.map((alert, i) => (
                <div key={i} className="alert-item">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">{alert}</span>
                </div>
            ))}
        </div>
    );
};

export default AlertsSystem;
