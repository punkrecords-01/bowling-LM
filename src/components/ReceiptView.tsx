import React from 'react';
import './Modal.css';
import './ReceiptView.css';

interface ReceiptViewProps {
    laneName: string;
    comanda: string;
    startTime: number;
    endTime: number;
    onClose: () => void;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({ laneName, comanda, startTime, endTime, onClose }) => {
    const durationMs = endTime - startTime;
    const durationMin = Math.max(1, Math.round(durationMs / 60000));
    const hourlyRate = 120.00;
    const total = (durationMin / 60) * hourlyRate;

    return (
        <div className="modal-overlay">
            <div className="receipt-paper">
                <header className="receipt-header">
                    <h2 className="brand-name">STRIKE</h2>
                    <p className="brand-sub">BOLICHE BAR</p>
                    <p className="receipt-date">{new Date().toLocaleString()}</p>
                </header>

                <div className="receipt-divider"></div>

                <div className="receipt-info">
                    <div className="receipt-row">
                        <span>Pista:</span>
                        <span className="bold">{laneName}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Comanda:</span>
                        <span className="bold">#{comanda}</span>
                    </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-details">
                    <div className="receipt-row">
                        <span>Duração:</span>
                        <span>{durationMin} min</span>
                    </div>
                    <div className="receipt-row">
                        <span>Início:</span>
                        <span>{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Fim:</span>
                        <span>{new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-total-section">
                    <div className="receipt-row large">
                        <span>TOTAL:</span>
                        <span className="bold">R$ {total.toFixed(2)}</span>
                    </div>
                </div>

                <footer className="receipt-footer">
                    <p>Obrigado pela preferência!</p>
                </footer>

                <div className="receipt-actions no-print">
                    <button className="primary-btn" onClick={() => window.print()}>🖨️ IMPRIMIR</button>
                    <button className="secondary-btn" onClick={onClose}>FECHAR</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptView;
