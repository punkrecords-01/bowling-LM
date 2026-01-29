import React from 'react';
import './Modal.css';
import '../Print.css';

interface SummaryModalProps {
    laneName: string;
    comanda: string;
    startTime: number;
    endTime: number;
    onConfirmed: () => void;
    onFinish: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({
    laneName,
    comanda,
    startTime,
    endTime,
    onConfirmed,
    onFinish
}) => {
    const [step, setStep] = React.useState<'summary' | 'receipt'>('summary');
    const durationMs = endTime - startTime;
    const durationSec = Math.floor(durationMs / 1000);

    const h = Math.floor(durationSec / 3600);
    const m = Math.floor((durationSec % 3600) / 60);
    const s = durationSec % 60;

    const durationStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const handleConfirm = () => {
        onConfirmed();
        setStep('receipt');
    };

    const handlePrint = () => {
        window.print();
    };

    if (step === 'receipt') {
        return (
            <div className="modal-overlay receipt-view-mode">
                <div className="modal-content fade-in receipt-modal">
                    <header className="modal-header">
                        <h3>Recibo da Sessão</h3>
                        <button className="close-btn" onClick={onFinish}>&times;</button>
                    </header>
                    <div className="modal-body">
                        <div className="receipt-preview">
                            {/* This is the on-screen visualization of the receipt */}
                            <div className="receipt-print-area">
                                <div className="receipt-header">
                                    <h1>BOLICHE OS</h1>
                                    <p>Comprovante de Tempo</p>
                                </div>
                                <div className="receipt-body">
                                    <div className="receipt-row">
                                        <span>Pista:</span>
                                        <span>{laneName}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Comanda:</span>
                                        <span>#{comanda}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Início:</span>
                                        <span>{new Date(startTime).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Fim:</span>
                                        <span>{new Date(endTime).toLocaleTimeString()}</span>
                                    </div>
                                    <hr className="receipt-divider" />
                                    <div className="receipt-row total">
                                        <span>TOTAL:</span>
                                        <span>{durationStr}</span>
                                    </div>
                                </div>
                                <div className="receipt-footer">
                                    <p>{new Date().toLocaleDateString()} - Verificado por Sistema</p>
                                    <p>Obrigado pela preferência!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer className="modal-footer">
                        <button className="secondary-btn" onClick={onFinish}>Fechar sem imprimir</button>
                        <button className="primary-btn" onClick={handlePrint}>🖨️ Imprimir Recibo</button>
                    </footer>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in">
                <header className="modal-header">
                    <h3>Confirmar Fechamento</h3>
                    <button className="close-btn" onClick={onFinish}>&times;</button>
                </header>
                <div className="modal-body">
                    <p className="summary-intro">Verifique os dados da sessão antes de finalizar:</p>
                    <div className="summary-info">
                        <div className="info-row">
                            <span className="label">Pista:</span>
                            <span className="value">{laneName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Comanda:</span>
                            <span className="value">#{comanda}</span>
                        </div>
                        <hr />
                        <div className="info-row highlight">
                            <span className="label">Tempo Total:</span>
                            <span className="value">{durationStr}</span>
                        </div>
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onFinish}>Voltar</button>
                    <button className="primary-btn" onClick={handleConfirm}>Confirmar e Finalizar</button>
                </footer>
            </div>
        </div>
    );
};

export default SummaryModal;
