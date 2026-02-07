import React from 'react';
import './Modal.css';

interface AddWaitingConfirmationModalProps {
    data: {
        name: string;
        lanesRequested: number;
        table?: string;
        comanda?: string;
        placa?: string;
    };
    onCancel: () => void;
    onConfirm: () => void;
}

const AddWaitingConfirmationModal: React.FC<AddWaitingConfirmationModalProps> = ({ data, onCancel, onConfirm }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in confirmation-modal">
                <header className="modal-header">
                    <h3>Confirmar Entrada na Fila</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </header>
                <div className="modal-body">
                    <p className="summary-intro">Verifique os dados antes de adicionar à fila:</p>
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Identificação:</span>
                            <span className="value">{data.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Pistas:</span>
                            <span className="value text-highlight">{data.lanesRequested}</span>
                        </div>                        {data.placa && (
                            <div className="info-row">
                                <span className="label">Placa Física:</span>
                                <span className="value">{data.placa}</span>
                            </div>
                        )}                        {data.table && (
                            <div className="info-row">
                                <span className="label">Mesa Atual:</span>
                                <span className="value">{data.table}</span>
                            </div>
                        )}
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onCancel}>Voltar</button>
                    <button className="primary-btn pulse-button" onClick={onConfirm}>Confirmar Registro</button>
                </footer>
            </div>
        </div>
    );
};

export default AddWaitingConfirmationModal;
