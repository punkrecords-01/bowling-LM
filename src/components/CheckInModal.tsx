import React, { useState } from 'react';
import './Modal.css';
import ComandaModal from './ComandaModal';
import { Reservation } from '../types';

interface CheckInModalProps {
    reservation: Reservation;
    laneName?: string;
    onCancel: () => void;
    onConfirm: (comanda: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ reservation, laneName, onCancel, onConfirm }) => {
    const [comanda, setComanda] = useState('');
    const [showComandaModal, setShowComandaModal] = useState(false);

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
                                readOnly
                                placeholder="Selecione uma comanda..."
                            />
                            <button type="button" className="secondary-btn" onClick={() => setShowComandaModal(true)}>Selecionar</button>
                        </div>
                        {comanda === '' && <div className="modal-note">Selecione uma comanda para continuar.</div>}
                    </div>

                    <div className="confirmation-warning">
                        Se confirmar, a reserva será iniciada e a pista será aberta com a comanda informada.
                    </div>

                    {showComandaModal && (
                        <ComandaModal
                            onSelect={(num) => { setComanda(num); setShowComandaModal(false); }}
                            onClose={() => setShowComandaModal(false)}
                        />
                    )}
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
                    <button className="primary-btn" disabled={comanda === ''} onClick={() => onConfirm(comanda)}>Confirmar e Iniciar</button>
                </footer>
            </div>
        </div>
    );
};

export default CheckInModal;
