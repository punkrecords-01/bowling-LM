import React from 'react';
import './Modal.css';

interface DeleteWaitingConfirmationModalProps {
    customerName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteWaitingConfirmationModal: React.FC<DeleteWaitingConfirmationModalProps> = ({ customerName, onCancel, onConfirm }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in confirmation-modal">
                <header className="modal-header">
                    <h3>Remover da Fila</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </header>
                <div className="modal-body">
                    <p className="summary-intro">Tem certeza que deseja remover este cliente da fila?</p>
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Cliente:</span>
                            <span className="value">{customerName}</span>
                        </div>
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Manter na Fila</button>
                    <button className="delete-btn" onClick={onConfirm}>Sim, Remover</button>
                </footer>
            </div>
        </div>
    );
};

export default DeleteWaitingConfirmationModal;
