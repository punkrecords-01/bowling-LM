import React, { useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import { AlertTriangleIcon } from './Icons';
import './AlertsSystem.css';

const AlertsSystem: React.FC = () => {
    const { lanes, reservations, sessions } = useLanes();
    const [alerts, setAlerts] = useState<string[]>([]);

    useEffect(() => {
        const checkAlerts = () => {
            const newAlerts: string[] = [];
            const now = Date.now();

            // 1. Check upcoming reservations (next 15 mins) - Reduced window for criticality
            reservations.forEach(res => {
                const diff = (res.startTime - now) / 60000;
                if (diff > 0 && diff <= 15 && res.status === 'pending') {
                    newAlerts.push(`Urgente: Reserva de ${res.customerName} em ${Math.round(diff)} min`);
                }
            });

            // 2. Check delayed reservations (persistent with time)
            reservations.filter(r => r.status === 'delayed').forEach(r => {
                const minsLate = Math.floor((now - r.startTime) / 60000);
                newAlerts.push(`Atraso: ${r.customerName} (${minsLate} min total)`);
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
            {alerts.slice(0, 3).map((alert, i) => ( // Show max 3 recent alerts
                <div key={i} className="alert-item">
                    <div className="alert-icon">
                        <AlertTriangleIcon width={18} height={18} />
                    </div>
                    <span className="alert-text">{alert}</span>
                </div>
            ))}
        </div>
    );
};

export default AlertsSystem;
