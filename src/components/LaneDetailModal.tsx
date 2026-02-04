import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import { ClockIcon, UserIcon, WrenchIcon, MoveIcon } from './Icons';
import './Modal.css';
import CustomTimePicker from './CustomTimePicker';

interface LaneDetailModalProps {
    laneId: string;
    onClose: () => void;
    onOpen?: (laneId: string) => void;
}

const LaneDetailModal: React.FC<LaneDetailModalProps> = ({ laneId, onClose, onOpen }) => {
    const { lanes, sessions, logs, reservations, updateSession, transferLane } = useLanes();
    const lane = lanes.find(l => l.id === laneId);
    const [targetLaneId, setTargetLaneId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    if (!lane) return null;

    const currentSession = sessions.find(s => s.id === lane.currentSessionId && s.isActive);
    
    // Filter available lanes of the SAME type
    const availableLanes = lanes.filter(l => 
        l.id !== laneId && 
        l.status === 'free' && 
        l.type === lane.type
    );

    const handleTransfer = (toId: string) => {
        setTargetLaneId(toId);
    };

    const confirmTransfer = () => {
        if (targetLaneId) {
            transferLane(laneId, targetLaneId);
            onClose();
        }
    };

    // Daily history from logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const laneLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        
        // Filter by laneId primarily, fallback to context
        return logDate.getTime() === today.getTime() && 
               (log.laneId === laneId || (!log.laneId && (log.context.includes(lane.name) || log.context.includes(`Pista ${laneId.split('-')[1]}`))));
    }).sort((a, b) => b.timestamp - a.timestamp);

    const laneReservations = reservations.filter(r => 
        r.laneId === laneId && 
        (r.status === 'pending' || r.status === 'arrived' || r.status === 'delayed')
    ).sort((a, b) => a.startTime - b.startTime);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const getTimeValue = (ts: number) => {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

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
                            <div className="section-header-row">
                                <h4><ClockIcon width={16} height={16} /> Sessão Atual</h4>
                                {availableLanes.length > 0 && (
                                    <button 
                                        className={`transfer-toggle ${isTransferring ? 'active' : ''}`}
                                        onClick={() => setIsTransferring(!isTransferring)}
                                    >
                                        <MoveIcon width={16} height={16} />
                                        {isTransferring ? 'Cancelar transferência' : 'Transferir pista'}
                                    </button>
                                )}
                            </div>

                            {isTransferring ? (
                                <div className="transfer-grid-container fade-in">
                                    {targetLaneId ? (
                                        <div className="transfer-confirmation fade-in">
                                            <div className="transfer-header">
                                                <div className="transfer-title-group">
                                                    <MoveIcon width={16} height={16} />
                                                    <span>Confirmar Troca</span>
                                                </div>
                                            </div>
                                            
                                            <div className="confirmation-details">
                                                <p className="conf-text">Transferir consumo e tempo para:</p>
                                                <div className="conf-target">
                                                    {lanes.find(l => l.id === targetLaneId)?.name}
                                                </div>
                                                <div className="conf-actions">
                                                    <button 
                                                        className="secondary-btn small"
                                                        onClick={() => setTargetLaneId('')}
                                                    >
                                                        Voltar
                                                    </button>
                                                    <button 
                                                        className="primary-btn small"
                                                        onClick={confirmTransfer}
                                                    >
                                                        Confirmar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="transfer-header">
                                                <div className="transfer-title-group">
                                                    <MoveIcon width={16} height={16} />
                                                    <span>Selecionar Nova Pista</span>
                                                </div>
                                                <span className="comanda-badge">Comanda #{currentSession.comanda}</span>
                                            </div>
                                            <div className="lane-transfer-grid">
                                                {availableLanes.map(l => (
                                                    <button 
                                                        key={l.id} 
                                                        className={`lane-card-mini type-${l.type.toLowerCase()}`}
                                                        onClick={() => handleTransfer(l.id)}
                                                    >
                                                        <span className="transfer-lane-num">{l.name.replace(/\D/g, '')}</span>
                                                        <span className="transfer-lane-label">{l.type === 'BOL' ? 'Boliche' : 'Sinuca'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="helper-text-bottom">Clique em uma pista livre para transferir todo o consumo e tempo decorrido.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="label">Comanda</span>
                                        <span className="value">#{currentSession.comanda}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Abertura</span>
                                        <CustomTimePicker 
                                            value={getTimeValue(currentSession.startTime)}
                                            onChange={(newTime) => {
                                                if (!currentSession) return;
                                                const [hours, minutes] = newTime.split(':').map(Number);
                                                const newStartTime = new Date(currentSession.startTime);
                                                newStartTime.setHours(hours, minutes, 0, 0);
                                                updateSession(currentSession.id, { startTime: newStartTime.getTime() });
                                            }}
                                        />
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Tempo Atual</span>
                                        <span className="value">
                                            {Math.floor((Date.now() - currentSession.startTime) / 60000)} min
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Técnico</span>
                                        <span className="value">{currentSession.openedBy}</span>
                                    </div>
                                </div>
                            )}
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
                         <button className="primary-btn" onClick={() => { onClose(); onOpen?.(laneId); }}>Abrir Pista</button>
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
                    border-radius: 8px;
                    margin-left: 8px;
                    vertical-align: middle;
                }
                .status-badge.free { background: var(--status-free); color: black; }
                .status-badge.active { background: var(--status-active); color: white; }
                .status-badge.reserved { background: var(--status-reserved); color: white; }
                .status-badge.maintenance { background: var(--status-error); color: white; }

                .section-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .section-header-row h4 { margin-bottom: 0 !important; }

                .transfer-toggle {
                    background: rgba(var(--primary-rgb), 0.15);
                    border: 2px solid var(--primary);
                    color: var(--primary);
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .transfer-toggle:hover {
                    background: var(--primary);
                    color: black;
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
                }
                .transfer-toggle.active {
                    background: #ff4444;
                    color: white;
                    border-color: #ff4444;
                }

                .transfer-grid-container {
                    background: rgba(255,255,255,0.03);
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .transfer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .transfer-title-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: white;
                }
                .comanda-badge {
                    background: var(--bg-dark);
                    padding: 3px 8px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--primary);
                    border: 1px solid rgba(var(--primary-rgb), 0.2);
                }
                .helper-text-bottom {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 12px;
                    text-align: center;
                }
                .lane-transfer-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
                    gap: 12px;
                }
                .lane-card-mini {
                    background: #1c1c1f; /* Zinc 800ish for better contrast than pure black */
                    border: 1px solid var(--border-strong);
                    padding: 12px 5px;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    color: white; /* Force white text */
                }
                .lane-card-mini:hover {
                    border-color: var(--primary);
                    background: #27272a; /* Zinc 700ish on hover */
                    transform: translateY(-3px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                }
                .transfer-lane-num {
                    font-size: 1.5rem;
                    font-weight: 940;
                    color: #ffffff !important;
                    line-height: 1;
                    margin-bottom: 4px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    opacity: 1 !important;
                }
                .transfer-lane-label {
                    font-size: 0.65rem;
                    color: rgba(255,255,255,0.7) !important;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 1 !important;
                }
                .lane-card-mini.type-bol .transfer-lane-label { color: var(--primary) !important; }
                .lane-card-mini.type-snk .transfer-lane-label { color: #A78BFA !important; }

                .confirmation-details {
                    text-align: center;
                    padding: 10px;
                }
                .conf-text {
                    color: var(--text-muted);
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                .conf-target {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--primary);
                    margin-bottom: 20px;
                }
                .conf-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .secondary-btn.small, .primary-btn.small {
                    padding: 8px 16px;
                    font-size: 0.85rem;
                }

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
                    border-radius: 8px;
                }
                .detail-item { display: flex; flex-direction: column; gap: 4px; }
                .detail-item .label { font-size: 0.75rem; color: var(--text-muted); }
                .detail-item .value { font-weight: 600; font-size: 1rem; }

                .scrollable-list {
                    max-height: 200px;
                    overflow-y: auto;
                    background: rgba(255,255,255,0.02);
                    border-radius: 8px;
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
                    border-radius: 8px;
                    text-transform: uppercase;
                }
                .status-pill.pending { background: rgba(255,255,255,0.1); }
                .status-pill.arrived { background: #10b981; }
                .status-pill.delayed { background: #ef4444; }

                .maintenance-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 16px;
                    border-radius: 8px;
                }
                .maintenance-reason { font-size: 0.9rem; font-style: italic; }
                
                .empty-state { padding: 20px; text-align: center; font-size: 0.85rem; color: var(--text-muted); }

                .edit-time-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    width: fit-content;
                }

                .discount-controls {
                    margin-top: 16px;
                    padding: 16px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    align-items: center;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .discount-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 8px;
                    width: 100px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .birthday-group {
                    padding-top: 18px;
                }
            `}</style>
        </div>
    );
};

export default LaneDetailModal;
