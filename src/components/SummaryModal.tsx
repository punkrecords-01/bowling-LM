import React from 'react';
import './Modal.css';
import '../Print.css';
import { getPricePerMinute, formatCurrency, formatDateTime, formatDuration, STORE_INFO, toLocalDateISO } from '../utils/pricing';
import { LaneType } from '../types';
import { useLaneSettings } from '../context/LaneSettingsContext';
import { TagIcon } from './Icons';

interface SummaryModalProps {
    laneName: string;
    comanda: string;
    startTime: number;
    endTime: number;
    laneType?: LaneType;
    customerName?: string;
    onConfirmed: (opts?: { discountMinutes?: number; isBirthdayDiscount?: boolean }) => void;
    onFinish: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({
    laneName,
    comanda,
    startTime,
    endTime,
    laneType = 'BOL',
    customerName = '',
    onConfirmed,
    onFinish
}) => {
    const { pricing, isHoliday } = useLaneSettings();
    const [step, setStep] = React.useState<'summary' | 'receipt'>('summary');
    const [discountMinutes, setDiscountMinutes] = React.useState<number>(0);
    const [isBirthdayDiscount, setIsBirthdayDiscount] = React.useState<boolean>(false);

    const durationMs = endTime - startTime;
    const rawDurationMin = Math.round(durationMs / 60000);
    
    // Cálculo de desconto e valores com base no tipo
    const totalDiscountMin = discountMinutes + (isBirthdayDiscount ? 30 : 0);
    const effectiveMinutes = Math.max(0, rawDurationMin - totalDiscountMin);
    
    const dateStr = toLocalDateISO(startTime);
    const pricePerMinute = getPricePerMinute(startTime, laneType, pricing, isHoliday(dateStr));
    
    const totalValue = rawDurationMin * pricePerMinute;
    const discountValue = totalDiscountMin * pricePerMinute;
    const finalValue = Math.max(0, effectiveMinutes * pricePerMinute);

    const handleConfirm = () => {
        onConfirmed({ discountMinutes, isBirthdayDiscount });
        setStep('receipt');
    };

    const handlePrint = () => {
        window.print();
    };

    const laneNumber = laneName.replace(/\D/g, '').padStart(3, '0');

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
                            <div className="receipt-print-area">
                                <div className="receipt-header">
                                    <h1>{STORE_INFO.name}</h1>
                                    <p style={{ fontSize: '0.7rem' }}>{STORE_INFO.address}</p>
                                    <p style={{ fontSize: '0.7rem' }}>{STORE_INFO.city}</p>
                                </div>
                                <div className="receipt-body">
                                    <div className="receipt-row" style={{ justifyContent: 'space-between', margin: '8px 0' }}>
                                        <span style={{ border: '2px solid #000', padding: '4px 12px', fontWeight: 'bold' }}>{laneNumber}</span>
                                        <span style={{ border: '2px solid #000', padding: '4px 12px', fontWeight: 'bold' }}>{laneType}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Cartao:</span>
                                        <span>{comanda.padStart(4, '0')}</span>
                                    </div>
                                    {customerName && (
                                        <div className="receipt-row">
                                            <span>Cliente:</span>
                                            <span>{customerName}</span>
                                        </div>
                                    )}
                                    <div className="receipt-row">
                                        <span>Abertura:</span>
                                        <span>{formatDateTime(startTime)}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Fechamento:</span>
                                        <span>{formatDateTime(endTime)}</span>
                                    </div>
                                    <hr className="receipt-divider" />
                                    <div className="receipt-row" style={{ justifyContent: 'center', fontWeight: 'bold' }}>
                                        Horas de Pista - {formatDuration(durationMs)}
                                    </div>
                                    <div className="receipt-row total">
                                        <span>Total R$:</span>
                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(totalValue)}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Desconto R$:</span>
                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(discountValue)}</span>
                                    </div>
                                    <div className="receipt-row" style={{ borderTop: '2px solid #000', paddingTop: '8px', marginTop: '4px' }}>
                                        <span>Valor Final R$:</span>
                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(finalValue)}</span>
                                    </div>
                                </div>
                                <div className="receipt-footer">
                                    <p>Não é Documento Fiscal</p>
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
                            <span className="label">{laneType === 'SNK' ? 'Mesa:' : 'Pista:'}</span>
                            <span className="value">{laneName} <span style={{ opacity: 0.6, fontSize: '0.8em' }}>({laneType})</span></span>
                        </div>
                        <div className="info-row">
                            <span className="label">Comanda:</span>
                            <span className="value">#{comanda}</span>
                        </div>
                        <hr />
                        <div className="info-row highlight">
                            <span className="label">Tempo:</span>
                            <span className="value">{formatDuration(durationMs)} ({rawDurationMin} min)</span>
                        </div>
                        <div className="info-row">
                            <label className="label">Tarifa:</label>
                            <span className="value">R$ {formatCurrency(pricePerMinute)} /min</span>
                        </div>
                        
                        <div className="discount-control-group">
                            <div className="discount-row">
                                <label className="discount-label">
                                    <TagIcon width={16} height={16} /> Desconto Manual
                                </label>
                                <div className="manual-discount-controls">
                                    <div className="discount-display-large">
                                        <input 
                                            type="text" 
                                            value={discountMinutes} 
                                            onChange={e => {
                                                const val = parseInt(e.target.value.replace(/\D/g, '') || '0');
                                                setDiscountMinutes(val);
                                            }} 
                                        />
                                        <span>MIN</span>
                                    </div>
                                    <div className="discount-stack-buttons">
                                        <button 
                                            type="button" 
                                            className="adjust-btn-stack" 
                                            onClick={() => setDiscountMinutes(discountMinutes + 1)}
                                        >
                                            +
                                        </button>
                                        <button 
                                            type="button" 
                                            className="adjust-btn-stack" 
                                            onClick={() => setDiscountMinutes(Math.max(0, discountMinutes - 1))}
                                        >
                                            -
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="birthday-toggle-container">
                                <div className="birthday-label">
                                    <span className="birthday-icon">🎂</span>
                                    <div className="label-text">
                                        <span className="label-main">Aniversariante do Dia</span>
                                        <span className="label-sub">-30 min de cortesia</span>
                                    </div>
                                </div>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={isBirthdayDiscount} 
                                        onChange={e => setIsBirthdayDiscount(e.target.checked)} 
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <hr />
                        <div className="info-row">
                            <span className="label">Total R$:</span>
                            <span className="value">{formatCurrency(totalValue)}</span>
                        </div>
                        <div className="info-row" style={{ color: '#22c55e' }}>
                            <span className="label">Desconto R$:</span>
                            <span className="value">-{formatCurrency(discountValue)}</span>
                        </div>
                        <div className="info-row highlight" style={{ fontSize: '1.2rem' }}>
                            <span className="label">Valor Final:</span>
                            <span className="value" style={{ fontWeight: 'bold' }}>R$ {formatCurrency(finalValue)}</span>
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
