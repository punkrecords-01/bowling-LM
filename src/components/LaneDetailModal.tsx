import React from 'react';
import { useLanes } from '../context/LaneContext';
import { ClockIcon, UserIcon, WrenchIcon } from './Icons';
import './Modal.css';

interface LaneDetailModalProps {
    laneId: string;
    onClose: () => void;
}

const LaneDetailModal: React.FC<LaneDetailModalProps> = ({ laneId, onClose }) => {
    const { lanes, sessions, logs, reservations } = useLanes();
    const lane = lanes.find(l => l.id === laneId);

    if (!lane) return null;

    const currentSession = sessions.find(s => s.laneId === laneId && s.isActive);
    
    // Daily history from logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const laneLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        
        // Match by lane name or ID in context (simple string check for now based on existing log context)
        return logDate.getTime() === today.getTime() && 
               (log.context.includes(lane.name) || log.context.includes(`Pista ${laneId.split('-')[1]}`));
    }).sort((a, b) => b.timestamp - a.timestamp);

    const laneReservations = reservations.filter(r => 
        r.laneId === laneId && 
        (r.status === 'pending' || r.status === 'arrived' || r.status === 'delayed')
    ).sort((a, b) => a.startTime - b.startTime);

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in lane-detail-modal">
                <header className="modal-header">
                    <div>
                        <h3>{lane.name} - Detalhes</h3>
                        <span className={`status-badge ${lane.status}`}>{lane.status.toUpperCase()}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    {/* Current Session Info */}
                    {currentSession && (
                        <div className="detail-section active-session">
                            <h4><ClockIcon width={16} height={16} /> Sessão Atual</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="label">Comanda</span>
                                    <span className="value">#{currentSession.comanda}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Início</span>
                                    <span className="value">{formatTime(currentSession.startTime)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Tempo de Jogo</span>
                                    <span className="value">{Math.floor((Date.now() - currentSession.startTime) / 60000)} min</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Técnico</span>
                                    <span className="value">{currentSession.openedBy}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending Reservations */}
                    {laneReservations.length > 0 && (
                        <div className="detail-section">
                            <h4><UserIcon width={16} height={16} /> Reservas para Hoje</h4>
                            <div className="scrollable-list">
                                {laneReservations.map(res => (
                                    <div key={res.id} className="list-item">
                                        <span className="time">{formatTime(res.startTime)}</span>
                                        <span className="name">{res.customerName}</span>
                                        <span className={`status-pill ${res.status}`}>{res.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Maintenance Info */}
                    {lane.status === 'maintenance' && (
                        <div className="detail-section maintenance-alert">
                            <h4><WrenchIcon width={16} height={16} /> Status de Manutenção</h4>
                            <p className="maintenance-reason">{lane.maintenanceReason || 'Sem motivo especificado'}</p>
                        </div>
                    )}

                    {/* Daily Activity Log */}
                    <div className="detail-section">
                        <h4>Atividade de Hoje</h4>
                        <div className="scrollable-list timeline">
                            {laneLogs.length > 0 ? laneLogs.map(log => (
                                <div key={log.id} className="timeline-item">
                                    <span className="log-time">{formatTime(log.timestamp)}</span>
                                    <div className="log-content">
                                        <span className="log-action">{log.action}</span>
                                        <span className="log-details">{log.context}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">Sem atividades registradas hoje.</div>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Fechar</button>
                    {lane.status === 'free' && (
                         <button className="primary-btn" onClick={() => { onClose(); /* Handle Open logic if passed via callback */ }}>Abrir Pista</button>
                    )}
                </footer>
            </div>

            <style>{`
                .lane-detail-modal {
                    max-width: 550px;
                    width: 90%;
                }
                .status-badge {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 4px;
                    margin-left: 8px;
                    vertical-align: middle;
                }
                .status-badge.free { background: var(--status-free); color: white; }
                .status-badge.active { background: var(--status-active); color: black; }
                .status-badge.reserved { background: var(--status-reserved); color: white; }
                .status-badge.maintenance { background: var(--status-error); color: white; }

                .detail-section {
                    margin-bottom: 24px;
                }
                .detail-section h4 {
                    font-size: 0.9rem;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    background: rgba(255,255,255,0.03);
                    padding: 16px;
                    border-radius: 12px;
                }
                .detail-item { display: flex; flex-direction: column; gap: 4px; }
                .detail-item .label { font-size: 0.75rem; color: var(--text-muted); }
                .detail-item .value { font-weight: 600; font-size: 1rem; }

                .scrollable-list {
                    max-height: 200px;
                    overflow-y: auto;
                    background: rgba(255,255,255,0.02);
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .list-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .list-item .time { font-weight: 600; font-size: 0.85rem; color: var(--primary); }
                .list-item .name { flex: 1; font-size: 0.9rem; }
                
                .timeline-item {
                    display: flex;
                    gap: 16px;
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .log-time { font-size: 0.75rem; color: var(--text-muted); min-width: 45px; }
                .log-content { display: flex; flex-direction: column; }
                .log-action { font-weight: 600; font-size: 0.85rem; }
                .log-details { font-size: 0.8rem; color: var(--text-muted); }

                .status-pill {
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .status-pill.pending { background: rgba(255,255,255,0.1); }
                .status-pill.arrived { background: #10b981; }
                .status-pill.delayed { background: #ef4444; }

                .maintenance-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 16px;
                    border-radius: 12px;
                }
                .maintenance-reason { font-size: 0.9rem; font-style: italic; }
                
                .empty-state { padding: 20px; text-align: center; font-size: 0.85rem; color: var(--text-muted); }
            `}</style>
        </div>
    );
};

export default LaneDetailModal;
