import React, { useState } from 'react';
import './Modal.css';

interface MaintenanceModalProps {
    laneName: string;
    onCancel: () => void;
    onConfirm: (reason: string) => void;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ laneName, onCancel, onConfirm }) => {
    const [reason, setReason] = useState('');

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in confirmation-modal">
                <header className="modal-header">
                    <h3>Marcar Manutenção</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </header>

                <div className="modal-body">
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Pista:</span>
                            <span className="value">{laneName}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Motivo</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Descrição do motivo (ex: troca de lâmpada)"
                            autoFocus
                        />
                    </div>

                    <div className="confirmation-warning">
                        A pista ficará em status de manutenção até que seja finalizada manualmente.
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
                    <button className="primary-btn" disabled={reason.trim() === ''} onClick={() => onConfirm(reason.trim())}>Confirmar Manutenção</button>
                </footer>
            </div>
        </div>
    );
};

export default MaintenanceModal;
