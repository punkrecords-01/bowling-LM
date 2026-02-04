import React, { useState, useEffect } from 'react';
import { useLanes } from '../context/LaneContext';
import './LaneMap.css';

interface LaneMapProps {
    onLaneClick: (laneId: string) => void;
}

const LaneMap: React.FC<LaneMapProps> = ({ onLaneClick }) => {
    const { lanes, sessions, reservations } = useLanes();
    const [now, setNow] = useState(Date.now());

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
                const hhmm = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                return (
                    <div className="lane-content active">
                        <div className="lane-header-row">
                            <span className="lane-comanda">#{session.comanda}</span>
                            <span className="lane-started-at">{hhmm}</span>
                        </div>
                        <span className="lane-timer">{formatTime(elapsed)}</span>
                        <div className="lane-progress-mini">
                            <div className="progress-bar" style={{ width: `${Math.min(100, (elapsed / 3600000) * 100)}%` }}></div>
                        </div>
                        {lane.maintenanceReason && (
                            <div className="maintenance-active-badge">
                                🛠️ {lane.maintenanceReason}
                            </div>
                        )}
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
            return (
                <div className="lane-content reserved">
                    <span className="lane-status-text">RESERVADA</span>
                </div>
            );
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
        <div className="lane-map-container fade-in mode-pistas">
            <div className="map-header">
                <div className="map-legend">
                    <div className="legend-item"><span className="dot free"></span> Livre</div>
                    <div className="legend-item"><span className="dot active"></span> Jogando</div>
                    <div className="legend-item"><span className="dot reserved"></span> Reservada</div>
                    <div className="legend-item"><span className="dot maintenance"></span> Manutenção</div>
                </div>
            </div>

            <div className="pistas-layout">
                <div className="pistas-rows-group">
                    {/* Linhas 3-10 */}
                    <div className="pistas-container top-row">
                        {lanes.filter(l => l.type === 'BOL').slice(2, 10).map(lane => {
                            const num = lane.name.split(' ')[1];
                            return (
                                <div key={lane.id} className={`perspective-lane ${lane.status}`} onClick={() => onLaneClick(lane.id)}>
                                    <div className="lane-track">
                                        <div className="pin-deck">
                                            <div className="pins">{'·'.repeat(3)}</div>
                                        </div>
                                        <div className="track-wood"></div>
                                        <div className="lane-info-overlay">
                                            <span className="lane-num">{num}</span>
                                            {renderLaneContent(lane)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pistas-alley-spacer">
                        <span className="alley-text">ÁREA DE CIRCULAÇÃO / LOUNGE</span>
                    </div>

                    {/* Linhas 1-2 + Sinuca ao lado */}
                    <div className="pistas-container bottom-row">
                        {lanes.filter(l => l.type === 'BOL').slice(0, 2).map(lane => {
                            const num = lane.name.split(' ')[1];
                            return (
                                <div key={lane.id} className={`perspective-lane ${lane.status}`} onClick={() => onLaneClick(lane.id)}>
                                    <div className="lane-track">
                                        <div className="pin-deck">
                                            <div className="pins">{'·'.repeat(3)}</div>
                                        </div>
                                        <div className="track-wood"></div>
                                        <div className="lane-info-overlay">
                                            <span className="lane-num">{num}</span>
                                            {renderLaneContent(lane)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Mesa de Sinuca ao lado das pistas 1-2 */}
                        <div className="sinuca-wrapper">
                            {lanes.filter(l => l.type === 'SNK').map(lane => (
                                <div key={lane.id} className={`sinuca-table-inline ${lane.status}`} onClick={() => onLaneClick(lane.id)}>
                                    <div className="sinuca-felt">
                                        <div className="sinuca-pockets">
                                            <span className="poc-tl"></span>
                                            <span className="poc-tc"></span>
                                            <span className="poc-tr"></span>
                                            <span className="poc-bl"></span>
                                            <span className="poc-bc"></span>
                                            <span className="poc-br"></span>
                                        </div>
                                        <span className="sinuca-num">SNK</span>
                                        {renderLaneContent(lane)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Removidos placeholders para o wrapper flexível fazer o trabalho */}
                    </div>
                </div>
            </div>

            <div className="map-footer">
                <p>Monitoramento em tempo real | Clique para gerenciar</p>
            </div>
        </div>
    );
};

export default LaneMap;
