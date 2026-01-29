import React, { useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import './LaneMap.css';

interface LaneMapProps {
    onLaneClick: (laneId: string) => void;
}

const LaneMap: React.FC<LaneMapProps> = ({ onLaneClick }) => {
    const { lanes, sessions, reservations } = useLanes();
    const [now, setNow] = useState(Date.now());

    const toLocalDateISO = (ms:number) => {
        const d = new Date(ms);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours > 0 ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const renderLaneContent = (lane: any) => {
        if (lane.status === 'active') {
            const session = sessions.find(s => s.id === lane.currentSessionId && s.isActive);
            if (session) {
                const elapsed = now - session.startTime;
                return (
                    <div className="lane-content active">
                        <span className="lane-comanda">#{session.comanda}</span>
                        <span className="lane-timer">{formatTime(elapsed)}</span>
                        <div className="lane-progress-mini">
                            <div className="progress-bar" style={{ width: `${Math.min(100, (elapsed / 3600000) * 100)}%` }}></div>
                        </div>
                    </div>
                );
            }
        }

        // Dynamic reservation check
        const WINDOW_MS = 10 * 60000;

        // 1. Direct reservation
        const directRes = reservations
            .filter(r => r.laneId === lane.id && (r.status === 'pending' || r.status === 'arrived'))
            .sort((a, b) => a.startTime - b.startTime)[0];

        // 2. Unassigned pool
        const unassignedPool = reservations
            .filter(r => !r.laneId && (r.status === 'pending' || r.status === 'arrived'))
            .sort((a, b) => a.startTime - b.startTime);

        const freeLanes = lanes.filter(l => l.status === 'free');
        const myFreeIndex = freeLanes.findIndex(l => l.id === lane.id);
        const claimedByUnassigned = myFreeIndex !== -1 && unassignedPool[myFreeIndex];

        const nextRes = directRes || claimedByUnassigned;
        const isReservedSoon = nextRes && (nextRes.startTime - now < WINDOW_MS);

        if (isReservedSoon || lane.status === 'reserved') {
            if (nextRes) {
                return (
                    <div className="lane-content reserved">
                        <span className="lane-res-time">{new Date(nextRes.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="lane-res-name">{nextRes.customerName}</span>
                    </div>
                );
            }
        }

        if (lane.status === 'maintenance') {
            return (
                <div className="lane-content maintenance">
                    <span className="maintenance-icon">🛠️</span>
                    <span className="maintenance-text">{lane.maintenanceReason || 'Manutenção'}</span>
                </div>
            );
        }

        return <span className="lane-status-text">LIVRE</span>;
    };

    return (
        <div className="lane-map-container fade-in">
            <div className="map-legend">
                <div className="legend-item"><span className="dot free"></span> Livre</div>
                <div className="legend-item"><span className="dot active"></span> Jogando</div>
                <div className="legend-item"><span className="dot reserved"></span> Reservada</div>
                <div className="legend-item"><span className="dot maintenance"></span> Manutenção</div>
            </div>

            <div className="map-layout">
                {/* TOP ROW: Lanes 3-10 in 4 pairs */}
                <div className="lane-row top">
                    {[
                        [lanes[2], lanes[3]],
                        [lanes[4], lanes[5]],
                        [lanes[6], lanes[7]],
                        [lanes[8], lanes[9]]
                    ].map((pair, pIdx) => (
                        <React.Fragment key={pIdx}>
                            <div className="lane-pair">
                                {pair.map(lane => {
                                    const directRes = reservations
                                        .filter(r => r.laneId === lane.id && (r.status === 'pending' || r.status === 'arrived'))
                                        .sort((a, b) => a.startTime - b.startTime)[0];
                                    const unassignedPool = reservations
                                        .filter(r => !r.laneId && (r.status === 'pending' || r.status === 'arrived'))
                                        .sort((a, b) => a.startTime - b.startTime);
                                    const freeLanes = lanes.filter(l => l.status === 'free');
                                    const myFreeIndex = freeLanes.findIndex(l => l.id === lane.id);
                                    const nextRes = directRes || (myFreeIndex !== -1 && unassignedPool[myFreeIndex]);

                                    const isSameDay = nextRes && toLocalDateISO(nextRes.startTime) === toLocalDateISO(now);
                                    const isReservedSoon = nextRes && isSameDay && (nextRes.startTime - now < 10 * 60000);
                                    let effectiveStatus = lane.status;
                                    if (lane.status === 'reserved') {
                                        const hasDirectToday = !!directRes && toLocalDateISO(directRes.startTime) === toLocalDateISO(now);
                                        effectiveStatus = hasDirectToday ? 'reserved' : 'free';
                                    }
                                    if (lane.status === 'free' && isReservedSoon) effectiveStatus = 'reserved';

                                    return (
                                        <div key={lane.id} className={`map-lane ${effectiveStatus}`} onClick={() => onLaneClick(lane.id)} style={{ cursor: 'pointer' }}>
                                            <span className="lane-label">{lane.name.split(' ')[1]}</span>
                                            {renderLaneContent(lane)}
                                            <div className="lane-surface"></div>
                                        </div>
                                    );
                                })}
                            </div>
                            {pIdx < 3 && <div className="pair-spacer"></div>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="map-alley-center">
                    <span className="alley-text">ÁREA DE CIRCULAÇÃO / LOUNGE</span>
                </div>

                {/* BOTTOM ROW: Lanes 1-2 in 1 pair + placeholders */}
                <div className="lane-row bottom">
                    <div className="lane-pair">
                        {[lanes[0], lanes[1]].map(lane => {
                            const directRes = reservations
                                .filter(r => r.laneId === lane.id && (r.status === 'pending' || r.status === 'arrived'))
                                .sort((a, b) => a.startTime - b.startTime)[0];
                            const unassignedPool = reservations
                                .filter(r => !r.laneId && (r.status === 'pending' || r.status === 'arrived'))
                                .sort((a, b) => a.startTime - b.startTime);
                            const freeLanes = lanes.filter(l => l.status === 'free');
                            const myFreeIndex = freeLanes.findIndex(l => l.id === lane.id);
                            const nextRes = directRes || (myFreeIndex !== -1 && unassignedPool[myFreeIndex]);

                            const isSameDay = nextRes && toLocalDateISO(nextRes.startTime) === toLocalDateISO(now);
                            const isReservedSoon = nextRes && isSameDay && (nextRes.startTime - now < 10 * 60000);
                            let effectiveStatus = lane.status;
                            if (lane.status === 'reserved') {
                                const hasDirectToday = !!directRes && toLocalDateISO(directRes.startTime) === toLocalDateISO(now);
                                effectiveStatus = hasDirectToday ? 'reserved' : 'free';
                            }
                            if (lane.status === 'free' && isReservedSoon) effectiveStatus = 'reserved';

                            return (
                                <div key={lane.id} className={`map-lane ${effectiveStatus}`} onClick={() => onLaneClick(lane.id)} style={{ cursor: 'pointer' }}>
                                    <div className="lane-surface"></div>
                                    {renderLaneContent(lane)}
                                    <span className="lane-label">{lane.name.split(' ')[1]}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="pair-spacer"></div>
                    <div className="lane-pair-placeholder"></div>
                    <div className="pair-spacer"></div>
                    <div className="lane-pair-placeholder"></div>
                    <div className="pair-spacer"></div>
                    <div className="lane-pair-placeholder"></div>
                </div>
            </div>

            <div className="map-footer">
                <p>Monitoramento em tempo real | Clique para gerenciar</p>
            </div>
        </div>
    );
};

export default LaneMap;
