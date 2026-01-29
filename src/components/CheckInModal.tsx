import React, { useState } from 'react';
import './Modal.css';
import { Reservation } from '../types';

interface CheckInModalProps {
    reservation: Reservation;
    laneName?: string;
    onCancel: () => void;
    onConfirm: (comanda: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ reservation, laneName, onCancel, onConfirm }) => {
    const [comanda, setComanda] = useState('');

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
                        <input
                            type="text"
                            value={comanda}
                            onChange={e => setComanda(e.target.value)}
                            placeholder="Número da comanda (ex: 1234)"
                            required
                        />
                    </div>

                    <div className="confirmation-warning">
                        Se confirmar, a reserva será iniciada e a pista será aberta com a comanda informada.
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
                    <button className="primary-btn" onClick={() => onConfirm(comanda || String(Math.floor(Math.random() * 90000) + 10000))}>Confirmar e Iniciar</button>
                </footer>
            </div>
        </div>
    );
};

export default CheckInModal;
