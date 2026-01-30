import React, { useState } from 'react';
import './Modal.css';
import { useLanes } from '../context/LaneContext';
import { ClockIcon, UserIcon } from './Icons';

interface OpenLaneModalProps {
    laneId: string;
    onClose: () => void;
    onConfirm: (comanda: string, reservationId?: string) => void;
}

const OpenLaneModal: React.FC<OpenLaneModalProps> = ({ laneId, onClose, onConfirm }) => {
    const { reservations, lanes, sessions } = useLanes();
    const [comanda, setComanda] = useState('');
    const [isReservation, setIsReservation] = useState(false);
    const [selectedResId, setSelectedResId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const lane = lanes.find(l => l.id === laneId);
    const today = new Date().toISOString().split('T')[0];

    // Filter today's reservations that are not yet fulfilled/cancelled
    const todayReservations = reservations.filter(res => {
        const resDate = new Date(res.startTime).toISOString().split('T')[0];
        return resDate === today && (res.status === 'pending' || res.status === 'arrived');
    }).sort((a,b) => a.startTime - b.startTime);

    const validate = () => {
        if (!comanda) {
            setError('Digite o número da comanda.');
            return false;
        }
        const num = parseInt(comanda, 10);
        if (isNaN(num) || num < 1 || num > 60) {
            setError('A comanda deve ser entre 1 e 60.');
            return false;
        }
        const inUse = sessions.some(s => s.isActive && s.comanda === comanda);
        if (inUse) {
            setError(`A comanda #${comanda} já está em uso em outra pista.`);
            return false;
        }
        if (isReservation && !selectedResId) {
            setError('Selecione uma reserva para vincular.');
            return false;
        }
        return true;
    };

    const handleConfirm = () => {
        if (validate()) {
            onConfirm(comanda, isReservation ? selectedResId : undefined);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in">
                <header className="modal-header">
                    <h3>Abrir Pista: {lane?.name}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Número da Comanda (1-60)</label>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Ex: 5"
                            value={comanda}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 60)) {
                                    setComanda(val);
                                    setError(null);
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="toggle-group" style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={isReservation}
                                onChange={(e) => setIsReservation(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Vincular a uma Reserva existente?</span>
                    </div>

                    {isReservation && (
                        <div className="reservation-selector-list">
                            {todayReservations.length === 0 ? (
                                <p className="empty-msg">Nenhuma reserva pendente para hoje.</p>
                            ) : (
                                todayReservations.map(res => (
                                    <div 
                                        key={res.id} 
                                        className={`res-option ${selectedResId === res.id ? 'selected' : ''}`}
                                        onClick={() => { setSelectedResId(res.id); setError(null); }}
                                    >
                                        <div className="res-option-info">
                                            <div className="res-customer">
                                                <UserIcon width={14} height={14} />
                                                <span>{res.customerName}</span>
                                            </div>
                                            <div className="res-time">
                                                <ClockIcon width={12} height={12} />
                                                <span>{new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        {res.laneId && (
                                            <div className="res-lane-id">Pista {res.laneId.split('-')[1]}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {error && <div className="validation-error" style={{ marginTop: '12px' }}>{error}</div>}
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button className="primary-btn" onClick={handleConfirm}>
                        {isReservation ? 'Iniciar Check-in' : 'Abrir Pista'}
                    </button>
                </footer>
            </div>

            <style>{`
                .modal-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: var(--bg-dark);
                    border: 1px solid var(--border-strong);
                    border-radius: 8px;
                    color: white;
                    font-size: 1.1rem;
                    outline: none;
                }
                .modal-input:focus {
                    border-color: var(--primary);
                }
                .reservation-selector-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    margin-top: 10px;
                    padding: 4px;
                }
                .res-option {
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }
                .res-option:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--border-strong);
                }
                .res-option.selected {
                    background: var(--primary-glow);
                    border-color: var(--primary);
                }
                .res-option-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .res-customer {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .res-time {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .res-lane-id {
                    font-size: 0.7rem;
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: var(--text-muted);
                }
                /* Simple Switch CSS */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: var(--bg-card-hover);
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px; width: 18px;
                    left: 3px; bottom: 3px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider { background-color: var(--primary); }
                input:checked + .slider:before { transform: translateX(20px); }
                .slider.round { border-radius: 24px; }
                .slider.round:before { border-radius: 50%; }
            `}</style>
        </div>
    );
};

export default OpenLaneModal;
