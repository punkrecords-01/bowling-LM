import React, { useState } from 'react';
import './Modal.css';
import ComandaModal from './ComandaModal';
import { Reservation } from '../types';
import { useLanes } from '../context/LaneContext';

interface CheckInModalProps {
    reservation: Reservation;
    onCancel: () => void;
    onConfirm: (comanda: string, laneIds: string[]) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ reservation, onCancel, onConfirm }) => {
    const { lanes } = useLanes();
    const [comanda, setComanda] = useState('');
    const [selectedLaneIds, setSelectedLaneIds] = useState<string[]>(reservation.laneIds && reservation.laneIds.length > 0 ? reservation.laneIds : (reservation.laneId ? [reservation.laneId] : []));
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [showLaneDropdown, setShowLaneDropdown] = useState(false);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    const toggleLane = (laneId: string) => {
        setSelectedLaneIds(prev => 
            prev.includes(laneId) 
                ? prev.filter(id => id !== laneId)
                : [...prev, laneId]
        );
    };

    const validate = (val: string) => {
        if (!val) return 'Selecione uma comanda para continuar.';
        const num = parseInt(val, 10);
        if (isNaN(num)) return 'Número inválido.';
        return null;
    };

    const isConfirmDisabled = !!validationMsg || !comanda || selectedLaneIds.length === 0;

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
                        <label>Pistas para Check-in</label>
                        <div 
                            className={`custom-select ${showLaneDropdown ? 'open' : ''}`}
                            onClick={() => setShowLaneDropdown(!showLaneDropdown)}
                        >
                            <div className="selected-value">
                                {selectedLaneIds.length > 0 ? (
                                    <div className="lane-option-content">
                                        <span className="lane-count-badge">{selectedLaneIds.length}</span>
                                        <span className="lane-selected-text">
                                            {selectedLaneIds.length === 1 ? 'Pista selecionada' : 'Pistas selecionadas'}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="placeholder">Selecione as pistas...</span>
                                )}
                                <span className={`arrow ${showLaneDropdown ? 'up' : 'down'}`}>▼</span>
                            </div>

                            {showLaneDropdown && (
                                <div className="dropdown-list">
                                    {lanes.map(lane => {
                                        const isReservedForThis = reservation.laneIds?.includes(lane.id) || reservation.laneId === lane.id;
                                        const isAvailable = lane.status === 'free' || lane.status === 'reserved';
                                        const isDisabled = !isAvailable && !isReservedForThis;
                                        const isSelected = selectedLaneIds.includes(lane.id);

                                        return (
                                            <div 
                                                key={lane.id} 
                                                className={`dropdown-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDisabled) {
                                                        toggleLane(lane.id);
                                                    }
                                                }}
                                            >
                                                <div className="lane-option-main">
                                                    <div className={`custom-checkbox-indicator ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}`}>
                                                        {isSelected && <span className="check-mark">✓</span>}
                                                    </div>
                                                    <div className="lane-text-group">
                                                        <span className="lane-name">{lane.name}</span>
                                                        {isReservedForThis && <span className="badge-reserved-mini">RESERVA ORIGINAL</span>}
                                                    </div>
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
                        {validationMsg ? <div className="validation-error">{validationMsg}</div> : <div className="modal-note">Selecione ou digite uma comanda numérica.</div>}
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
                    <button className="primary-btn" disabled={isConfirmDisabled} onClick={() => onConfirm(comanda, selectedLaneIds)}>Confirmar e Iniciar</button>
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
                    gap: 12px;
                }
                .lane-count-badge {
                    background: var(--primary);
                    color: black;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    font-weight: 900;
                }
                .lane-selected-text {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: white;
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
                    background: #0f172a; /* Deeper slate */
                    border: 1px solid var(--primary);
                    border-top: none;
                    border-bottom-left-radius: 12px;
                    border-bottom-right-radius: 12px;
                    z-index: 100;
                    max-height: 280px;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    backdrop-filter: blur(10px);
                }
                .dropdown-item {
                    padding: 10px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    cursor: pointer;
                }
                .dropdown-item:last-child { border-bottom: none; }
                .dropdown-item:hover:not(.disabled) {
                    background: rgba(255,255,255,0.05);
                }
                .dropdown-item.selected {
                    background: rgba(253, 224, 71, 0.05);
                }
                .dropdown-item.disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .lane-option-main {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .custom-checkbox-indicator {
                    width: 22px;
                    height: 22px;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    background: rgba(0,0,0,0.2);
                    flex-shrink: 0;
                }
                .custom-checkbox-indicator.checked {
                    background: var(--primary);
                    border-color: var(--primary);
                    box-shadow: 0 0 10px rgba(253, 224, 71, 0.3);
                }
                .check-mark {
                    color: black;
                    font-weight: 900;
                    font-size: 0.85rem;
                }
                .lane-text-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .lane-name { 
                    font-weight: 700; 
                    font-size: 0.95rem;
                    color: white;
                }
                .badge-reserved-mini {
                    font-size: 0.6rem;
                    color: var(--primary);
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .lane-option-status { 
                    font-size: 0.7rem; 
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .status-free { color: var(--status-free); opacity: 0.8; }
                .status-occupied { color: #ef4444; opacity: 0.8; }

                .dropdown-list::-webkit-scrollbar { width: 6px; }
                .dropdown-list::-webkit-scrollbar-track { background: transparent; }
                .dropdown-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 8px; }
            `}</style>
        </div>
    );
};

export default CheckInModal;
