import React from 'react';
import './Modal.css';
import './ReceiptView.css';
import { getPricePerMinute, formatCurrency, formatDateTime, formatDuration, STORE_INFO, toLocalDateISO } from '../utils/pricing';
import { LaneType } from '../types';
import { useLaneSettings } from '../context/LaneSettingsContext';

interface ReceiptViewProps {
    laneName: string;
    comanda: string;
    startTime: number;
    endTime: number;
    discountMinutes?: number;
    isBirthdayDiscount?: boolean;
    receiptNumber?: number;
    customerName?: string;
    laneType?: LaneType;
    onClose: () => void;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({ 
    laneName, comanda, startTime, endTime, 
    discountMinutes = 0, isBirthdayDiscount = false, 
    receiptNumber, customerName = '', laneType = 'BOL', onClose 
}) => {
    const { pricing, isHoliday } = useLaneSettings();
    const rawDurationMs = endTime - startTime;
    const rawDurationMin = Math.round(rawDurationMs / 60000);
    
    // Calcular desconto total em minutos
    const totalDiscountMin = discountMinutes + (isBirthdayDiscount ? 30 : 0);
    const effectiveMinutes = Math.max(0, rawDurationMin - totalDiscountMin);

    // Preço por minuto baseado no dia/hora de abertura E tipo
    const dateStr = toLocalDateISO(startTime);
    const pricePerMinute = getPricePerMinute(startTime, laneType, pricing, isHoliday(dateStr));
    
    // Cálculos financeiros
    const totalValue = rawDurationMin * pricePerMinute;
    const discountValue = totalDiscountMin * pricePerMinute;
    const finalValue = Math.max(0, effectiveMinutes * pricePerMinute);

    // Extrair número da pista (ex: "Pista 02" -> "002")
    const laneNumber = laneName.replace(/\D/g, '').padStart(3, '0');
    
    // Número do recibo (usar timestamp se não fornecido)
    const displayReceiptNumber = receiptNumber || Math.floor(Date.now() / 1000) % 100000;

    return (
        <div className="modal-overlay">
            <div className="receipt-paper">
                <header className="receipt-header">
                    <h2 className="brand-name">{STORE_INFO.name}</h2>
                    <p className="brand-address">{STORE_INFO.address}</p>
                    <p className="brand-address">{STORE_INFO.city}</p>
                    <p className="brand-info">CNPJ: {STORE_INFO.cnpj} Fone: {STORE_INFO.phone}</p>
                    <p className="brand-email">{STORE_INFO.email}</p>
                </header>

                <div className="receipt-title-section">
                    <h3 className="receipt-title">RECIBO</h3>
                    <span className="receipt-number">{displayReceiptNumber}</span>
                </div>

                <div className="receipt-lane-row">
                    <span className="lane-box">{laneNumber}</span>
                    <span className="lane-type-box">{laneType}</span>
                </div>

                <div className="receipt-info-section">
                    <div className="receipt-row">
                        <span>Cartao:</span>
                        <span className="bold">{comanda.padStart(4, '0')}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Cliente:</span>
                        <span className="bold">{customerName}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Abertura:</span>
                        <span>{formatDateTime(startTime)}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Fechamento:</span>
                        <span>{formatDateTime(endTime)}</span>
                    </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-totals-section">
                    <div className="receipt-row centered">
                        <span>Horas de Pista - {formatDuration(rawDurationMs)}</span>
                    </div>
                    <div className="receipt-row large">
                        <span>Total R$:</span>
                        <span className="bold">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="receipt-row large discount-row">
                        <span>Desconto R$:</span>
                        <span className="bold">{formatCurrency(discountValue)}</span>
                    </div>
                    <div className="receipt-row large final-row">
                        <span>Valor Final R$:</span>
                        <span className="bold">{formatCurrency(finalValue)}</span>
                    </div>
                </div>

                <div className="receipt-divider"></div>

                <footer className="receipt-footer">
                    <p>Não é Documento Fiscal</p>
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
