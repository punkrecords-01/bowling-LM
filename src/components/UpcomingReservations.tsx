import React, { useMemo, useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import { ClockIcon, UserIcon } from './Icons';
import './UpcomingReservations.css';

const UpcomingReservations: React.FC<{ onCheckIn: (resId: string) => void }> = ({ onCheckIn }) => {
    const { reservations, lanes, updateReservationStatus } = useLanes();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            const currentTime = Date.now();
            setNow(currentTime);

            // Auto-check for delayed reservations (15 mins past)
            reservations.forEach(res => {
                if (res.status === 'pending' && (currentTime - res.startTime > 15 * 60000)) {
                    // We don't auto-update here to avoid state loops during render
                    // but we can trigger the UI to show the options
                }
            });
        }, 10000); // Check more frequently
        return () => clearInterval(timer);
    }, [reservations]);

    const upcoming = useMemo(() => {
        const WINDOW_MS = 4 * 60 * 60000; // 4 hours window
        return reservations
            .filter(r => 
                (r.status === 'pending' || r.status === 'arrived' || r.status === 'delayed') &&
                r.startTime >= now - 60 * 60000 && // allow 1h past to handle decisions
                r.startTime <= now + WINDOW_MS
            )
            .sort((a, b) => a.startTime - b.startTime);
    }, [reservations, now]);

    return (
        <div className="upcoming-reservations-section">
            <h3 className="section-title-mini">Reservas Próximas</h3>
            <div className="reservations-scroll">
                {upcoming.length === 0 ? (
                    <div className="empty-reservations">
                        Sem reservas para as próximas horas
                    </div>
                ) : upcoming.map(res => {
                    const lane = lanes.find(l => l.id === res.laneId);
                    const nowMs = now;
                    const startTime = res.startTime;
                    const minutesSinceStart = Math.floor((nowMs - startTime) / 60000);
                    
                    const isVerySoon = startTime - nowMs < 15 * 60000 && startTime - nowMs > 0;
                    
                    // Initial delay alert (pending > 15m)
                    const isInitialDelay = minutesSinceStart >= 15 && res.status === 'pending';
                    
                    // Repeat alert every 10 min for delayed reservations (at 25, 35, 45... mins)
                    const isRepeatAlert = res.status === 'delayed' && (minutesSinceStart > 15 && minutesSinceStart % 10 === 5);
                    
                    const shouldShowCritical = isInitialDelay || isRepeatAlert;
                    const effectiveStatus = shouldShowCritical ? 'is-delayed-alert' : res.status;
                    
                    return (
                        <div key={res.id} className={`res-mini-card ${effectiveStatus} ${isVerySoon ? 'urgent' : ''} ${res.status === 'delayed' && !isRepeatAlert ? 'delayed-confirmed' : ''}`}>
                            <div className="res-mini-time">
                                <ClockIcon width={12} height={12} />
                                <span>
                                    {isInitialDelay ? 'ATRASADA!' : (res.status === 'delayed' ? `ATRASO (${minutesSinceStart}m)` : new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))}
                                </span>
                            </div>
                            <div className="res-mini-info">
                                <div className="res-mini-name-row">
                                    <UserIcon width={12} height={12} style={{ opacity: 0.6 }} />
                                    <span className="res-mini-name">{res.customerName}</span>
                                </div>
                                <span className="res-mini-lane">{lane ? lane.name : 'Qualquer pista'}</span>
                            </div>
                            {res.observation && (
                                <div className="res-mini-observation" title={res.observation}>
                                    {res.observation}
                                </div>
                            )}
                            <div className="res-mini-actions">
                                {shouldShowCritical ? (
                                    <div className="delayed-decision-group">
                                        <button 
                                            className="res-status-btn delay-keep" 
                                            onClick={() => updateReservationStatus(res.id, 'delayed')}
                                            title="Manter como Atrasada"
                                        >
                                            {res.status === 'delayed' ? 'Manter' : 'Atrasar'}
                                        </button>
                                        <button 
                                            className="res-status-btn no-show" 
                                            onClick={() => updateReservationStatus(res.id, 'no-show')}
                                            title="Marcar No-Show"
                                        >
                                            No-Show
                                        </button>
                                    </div>
                                ) : res.status === 'pending' || res.status === 'delayed' ? (
                                    <button 
                                        className="res-status-btn arrive" 
                                        onClick={() => onCheckIn(res.id)}
                                        title="Fazer Check-in"
                                    >
                                        Check-in
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingReservations;
