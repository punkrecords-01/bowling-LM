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
    const [comandaSearch, setComandaSearch] = useState('');
    const [isReservation, setIsReservation] = useState(false);
    const [selectedResId, setSelectedResId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const lane = lanes.find(l => l.id === laneId);
    const today = new Date().toISOString().split('T')[0];

    const availableComandas = Array.from({ length: 60 }, (_, i) => (i + 1).toString())
        .filter(num => !sessions.some(s => s.isActive && s.comanda === num))
        .filter(num => num.includes(comandaSearch));

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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <label style={{ margin: 0, fontSize: '1rem' }}>Digite ou Selecione a Comanda</label>
                            <input 
                                type="text" 
                                placeholder="FILTRAR NÚMERO..." 
                                className="comanda-search-large"
                                value={comandaSearch}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const numVal = parseInt(val, 10);
                                    if (val === '' || (numVal >= 1 && numVal <= 60)) {
                                        setComandaSearch(val);
                                        // Auto-select if exact match found
                                        if (availableComandas.includes(val)) {
                                            setComanda(val);
                                        }
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="comanda-grid-inline">
                            {availableComandas.length > 0 ? availableComandas.map(num => (
                                <button 
                                    key={num}
                                    className={`comanda-btn-mini ${comanda === num ? 'selected' : ''}`}
                                    onClick={() => {
                                        setComanda(num);
                                        setError(null);
                                    }}
                                >
                                    {num}
                                </button>
                            )) : (
                                <div className="empty-msg" style={{ gridColumn: '1/-1', padding: '20px' }}>
                                    Nenhuma comanda livre encontrada.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="toggle-group" style={{ margin: '15px 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                                <span>{new Date(res.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
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
                .comanda-grid-inline {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
                    gap: 8px;
                    max-height: 180px;
                    overflow-y: auto;
                    background: rgba(0,0,0,0.2);
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-strong);
                }
                .comanda-btn-mini {
                    aspect-ratio: 1;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }
                .comanda-btn-mini:hover {
                    border-color: var(--primary);
                    background: rgba(253, 224, 71, 0.1);
                }
                .comanda-btn-mini.selected {
                    background: var(--primary);
                    color: black;
                    border-color: var(--primary);
                    box-shadow: 0 0 15px var(--primary-glow);
                    transform: scale(1.05);
                }
                .comanda-search-large {
                    background: var(--bg-dark) !important;
                    border: 2px solid var(--border-strong) !important;
                    border-radius: 8px !important;
                    padding: 14px 20px !important;
                    color: white !important;
                    width: 100% !important;
                    font-size: 1.2rem !important;
                    font-weight: 800 !important;
                    outline: none !important;
                    letter-spacing: 2px !important;
                    text-align: center !important;
                    transition: all 0.2s !important;
                }
                .comanda-search-large:focus {
                    border-color: var(--primary) !important;
                    background: rgba(253, 224, 71, 0.05) !important;
                    box-shadow: 0 0 20px rgba(253, 224, 71, 0.1) !important;
                }
                .comanda-search-large::placeholder {
                    letter-spacing: 0;
                    font-size: 0.9rem;
                    opacity: 0.3;
                }
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
                    border-radius: 8px;
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
                .slider.round { border-radius: 8px; }
                .slider.round:before { border-radius: 8px; }
            `}</style>
        </div>
    );
};

export default OpenLaneModal;
