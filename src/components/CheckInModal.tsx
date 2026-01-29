import React, { useState } from 'react';
import './Modal.css';
import ComandaModal from './ComandaModal';
import { Reservation } from '../types';
import { useLanes } from '../context/LaneContext';

interface CheckInModalProps {
    reservation: Reservation;
    laneName?: string;
    onCancel: () => void;
    onConfirm: (comanda: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ reservation, laneName, onCancel, onConfirm }) => {
    const { sessions } = useLanes();
    const [comanda, setComanda] = useState('');
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    const validate = (val: string) => {
        if (!val) return 'Selecione uma comanda para continuar.';
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 60) return 'Número inválido. Use 1–60.';
        const inUse = sessions.some(s => s.isActive && s.comanda === val);
        if (inUse) return `Comanda #${val} já está em uso.`;
        return null;
    };

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
                            <span className="label">Horário:</span>
                            <span className="value">{new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Pista:</span>
                            <span className="value">{laneName || (reservation.laneId || 'Qualquer Pista')}</span>
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
                    <button className="primary-btn" disabled={!!validationMsg} onClick={() => onConfirm(comanda)}>Confirmar e Iniciar</button>
                </footer>
            </div>
        </div>
    );
};

export default CheckInModal;
