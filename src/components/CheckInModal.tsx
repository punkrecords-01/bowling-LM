import React, { useState } from 'react';
import './Modal.css';
import ComandaModal from './ComandaModal';
import { Reservation } from '../types';
import { useLanes } from '../context/LaneContext';

interface CheckInModalProps {
    reservation: Reservation;
    onCancel: () => void;
    onConfirm: (comanda: string, laneId: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ reservation, onCancel, onConfirm }) => {
    const { sessions, lanes } = useLanes();
    const [comanda, setComanda] = useState('');
    const [selectedLaneId, setSelectedLaneId] = useState(reservation.laneId || '');
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [showLaneDropdown, setShowLaneDropdown] = useState(false);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    const selectedLane = lanes.find(l => l.id === selectedLaneId);

    const validate = (val: string) => {
        if (!val) return 'Selecione uma comanda para continuar.';
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 60) return 'Número inválido. Use 1–60.';
        const inUse = sessions.some(s => s.isActive && s.comanda === val);
        if (inUse) return `Comanda #${val} já está em uso.`;
        return null;
    };

    const isConfirmDisabled = !!validationMsg || !comanda || !selectedLaneId;

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in confirmation-modal">
                <header className="modal-header">
                    <h3>Check-in de Reserva</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </header>

                <div className="modal-body">
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Cliente:</span>
                            <span className="value">{reservation.customerName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Horário Original:</span>
                            <span className="value">{new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        </div>
                        {reservation.observation && (
                            <div className="info-row">
                                <span className="label">Obs:</span>
                                <span className="value">{reservation.observation}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px', position: 'relative' }}>
                        <label>Pista para Check-in</label>
                        <div 
                            className={`custom-select ${showLaneDropdown ? 'open' : ''}`}
                            onClick={() => setShowLaneDropdown(!showLaneDropdown)}
                        >
                            <div className="selected-value">
                                {selectedLane ? (
                                    <div className="lane-option-content">
                                        <span className="lane-name">{selectedLane.name}</span>
                                        {reservation.laneId === selectedLane.id && (
                                            <span className="badge-reserved">RESERVADA</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="placeholder">Selecione uma pista...</span>
                                )}
                                <span className={`arrow ${showLaneDropdown ? 'up' : 'down'}`}>▼</span>
                            </div>

                            {showLaneDropdown && (
                                <div className="dropdown-list">
                                    {lanes.map(lane => {
                                        const isReservedForThis = reservation.laneId === lane.id;
                                        const isAvailable = lane.status === 'free' || lane.status === 'reserved';
                                        const isDisabled = !isAvailable && !isReservedForThis;

                                        return (
                                            <div 
                                                key={lane.id} 
                                                className={`dropdown-item ${selectedLaneId === lane.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDisabled) {
                                                        setSelectedLaneId(lane.id);
                                                        setShowLaneDropdown(false);
                                                    }
                                                }}
                                            >
                                                <div className="lane-option-main">
                                                    <span className="lane-name">{lane.name}</span>
                                                    {isReservedForThis && <span className="badge-reserved">ORIGINAL</span>}
                                                </div>
                                                <div className="lane-option-status">
                                                    {isDisabled ? (
                                                        <span className="status-occupied">Ocupada</span>
                                                    ) : (
                                                        <span className="status-free">Disponível</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                                                            })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Associar Comanda</label>
                        <div className="comanda-selector">
                            <input
                                type="text"
                                value={comanda}
                                onChange={e => {
                                    const sanitized = e.target.value.replace(/\D/g, '');
                                    // prevent leading zeros
                                    const normalized = sanitized.replace(/^0+/, '');
                                    setComanda(normalized);
                                    setValidationMsg(validate(normalized));
                                }}
                                placeholder="Digite ou selecione uma comanda..."
                                inputMode="numeric"
                                autoFocus
                            />
                            <button type="button" className="secondary-btn" onClick={() => setShowComandaModal(true)}>Selecionar</button>
                        </div>
                        {validationMsg ? <div className="validation-error">{validationMsg}</div> : <div className="modal-note">Selecione ou digite uma comanda válida (1-60).</div>}
                    </div>

                    <div className="confirmation-warning">
                        Se confirmar, a reserva será iniciada e a pista será aberta com a comanda informada.
                    </div>

                    {showComandaModal && (
                        <ComandaModal
                            onSelect={(num) => { setComanda(num); setValidationMsg(validate(num)); setShowComandaModal(false); }}
                            onClose={() => setShowComandaModal(false)}
                        />
                    )}
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={() => { setComanda(''); setValidationMsg(null); onCancel(); }}>Cancelar</button>
                    <button className="primary-btn" disabled={isConfirmDisabled} onClick={() => onConfirm(comanda, selectedLaneId)}>Confirmar e Iniciar</button>
                </footer>
            </div>

            <style>{`
                .custom-select {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px 16px;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    user-select: none;
                }
                .custom-select:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.08);
                }
                .custom-select.open {
                    border-color: var(--primary);
                    background: rgba(255, 255, 255, 0.1);
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                }
                .selected-value {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                .lane-option-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .badge-reserved {
                    background: var(--primary);
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-weight: 800;
                }
                .arrow {
                    font-size: 0.7rem;
                    opacity: 0.5;
                    transition: transform 0.2s;
                }
                .arrow.up { transform: rotate(180deg); }

                .dropdown-list {
                    position: absolute;
                    top: 100%;
                    left: -1px;
                    right: -1px;
                    background: #1e293b; /* Dark slate 800 */
                    border: 1px solid var(--primary);
                    border-top: none;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                    z-index: 50;
                    max-height: 250px;
                    overflow-y: auto;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
                }
                .dropdown-item {
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.1s;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .dropdown-item:last-child { border-bottom: none; }
                .dropdown-item:hover:not(.disabled) {
                    background: rgba(255,255,255,0.08);
                }
                .dropdown-item.selected {
                    background: rgba(59, 130, 246, 0.1);
                }
                .dropdown-item.disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .lane-option-main {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .lane-name { font-weight: 700; }
                .lane-option-status { font-size: 0.75rem; font-weight: 600; }
                .status-free { color: var(--status-free); }
                .status-occupied { color: #ef4444; }

                .dropdown-list::-webkit-scrollbar { width: 6px; }
                .dropdown-list::-webkit-scrollbar-track { background: transparent; }
                .dropdown-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 8px; }
            `}</style>
        </div>
    );
};

export default CheckInModal;
