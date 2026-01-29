import React from 'react';
import './Modal.css';

interface OpenConfirmationModalProps {
    laneName: string;
    comanda: string;
    warning?: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}

const OpenConfirmationModal: React.FC<OpenConfirmationModalProps> = ({ laneName, comanda, warning, onCancel, onConfirm }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in confirmation-modal">
                <header className="modal-header">
                    <h3>Confirmar Abertura</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </header>
                <div className="modal-body">
                    {warning && (
                        <div className="reservation-alert-box">
                            <span className="warning-icon">⚠️</span>
                            <div className="warning-msg">
                                <strong>Alerta de Reserva:</strong>
                                <p>{warning}</p>
                            </div>
                        </div>
                    )}
                    <p className="summary-intro">Confirmar abertura da pista com os seguintes dados:</p>
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Pista:</span>
                            <span className="value">{laneName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Comanda:</span>
                            <span className="value">#{comanda}</span>
                        </div>
                    </div>
                    <div className="confirmation-warning">
                        O tempo começará a contar imediatamente após a confirmação.
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Voltar</button>
                    <button className="primary-btn pulse-button" onClick={onConfirm}>Confirmar e Iniciar</button>
                </footer>
            </div>
        </div>
    );
};

export default OpenConfirmationModal;
