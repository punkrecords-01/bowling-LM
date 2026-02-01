import React, { useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import { AlertTriangleIcon } from './Icons';
import './AlertsSystem.css';

const AlertsSystem: React.FC = () => {
    const { lanes, reservations, sessions } = useLanes();
    const [alerts, setAlerts] = useState<{id: string, text: string}[]>([]);
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [showAll, setShowAll] = useState(false);
    const timeoutRef = React.useRef<any>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        // ... (checkAlerts logic omitted for brevity in oldString match, keeping it same)
        const checkAlerts = () => {
            const newAlerts: {id: string, text: string}[] = [];
            const now = Date.now();

            // 1. Check upcoming reservations (next 15 mins)
            reservations.forEach(res => {
                const diff = (res.startTime - now) / 60000;
                if (diff > 0 && diff <= 15 && res.status === 'pending') {
                    const id = `res-${res.id}-${Math.floor(res.startTime/60000)}`;
                    if (!excludedIds.has(id)) {
                        newAlerts.push({
                            id,
                            text: `Urgente: Reserva de ${res.customerName} em ${Math.round(diff)} min`
                        });
                    }
                }
            });

            // 2. Check delayed reservations
            reservations.filter(r => r.status === 'delayed').forEach(r => {
                const minsLate = Math.floor((now - r.startTime) / 60000);
                const id = `delayed-${r.id}`;
                if (!excludedIds.has(id)) {
                    newAlerts.push({
                        id,
                        text: `Atraso: ${r.customerName} (${minsLate} min total)`
                    });
                }
            });

            setAlerts(newAlerts);
        };

        const interval = setInterval(checkAlerts, 30000);
        checkAlerts();

        return () => clearInterval(interval);
    }, [lanes, reservations, sessions, excludedIds]);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowAll(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowAll(false);
        }, 300); // 300ms buffer to reach the dropdown
    };

    const excludeAlert = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExcludedIds(prev => new Set([...prev, id]));
    };

    if (alerts.length === 0) return null;

    return (
        <div 
            className="alerts-container-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="alerts-header-item">
                <div className="alert-icon">
                    <AlertTriangleIcon width={16} height={16} />
                </div>
                <span className="alert-text">{alerts[0].text}</span>
                <button 
                    className="exclude-btn-mini" 
                    onClick={(e) => excludeAlert(e, alerts[0].id)}
                    title="Dispensar alerta"
                >
                    ×
                </button>
                {alerts.length > 1 && <span className="alert-badge">+{alerts.length - 1}</span>}
            </div>

            {showAll && alerts.length > 1 && (
                <div className="alerts-dropdown">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="dropdown-alert-item">
                            <span className="bullet">•</span>
                            <span className="dropdown-text">{alert.text}</span>
                            <button 
                                className="exclude-btn-dropdown" 
                                onClick={(e) => excludeAlert(e, alert.id)}
                            >
                                Dispensar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertsSystem;
