import React, { useState, useMemo } from 'react';
import { useLanes } from '../context/LaneContext';
import { useLaneSettings } from '../context/LaneSettingsContext';
import { getPricePerMinute, formatCurrency, formatDateTime, STORE_INFO, toLocalDateISO } from '../utils/pricing';
import { LaneType } from '../types';
import './ConsumptionReport.css';

interface ConsumptionReportProps {
    onClose?: () => void;
    onStandalone?: boolean;
    initialDate?: string;
}

const ConsumptionReport: React.FC<ConsumptionReportProps> = ({ onClose, onStandalone, initialDate }) => {
    const { sessions, lanes } = useLanes();
    const { pricing, isHoliday } = useLaneSettings();
    
    // Date range filter
    const [startDate, setStartDate] = useState(() => {
        if (initialDate) {
            return `${initialDate}T00:00`;
        }
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today.toISOString().slice(0, 16);
    });
    
    const [endDate, setEndDate] = useState(() => {
        if (initialDate) {
            return `${initialDate}T23:59`;
        }
        const today = new Date();
        today.setHours(23, 59, 0, 0);
        return today.toISOString().slice(0, 16);
    });

    React.useEffect(() => {
        if (initialDate) {
            setStartDate(`${initialDate}T00:00`);
            setEndDate(`${initialDate}T23:59`);
        }
    }, [initialDate]);

    const getLaneInfo = (laneId: string) => {
        const lane = lanes.find(l => l.id === laneId);
        return {
            name: lane?.name || laneId,
            type: (lane?.type || 'BOL') as LaneType,
        };
    };

    const filteredSessions = useMemo(() => {
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        
        return sessions
            .filter(s => {
                if (!s.endTime) return false; // Only closed sessions
                return s.startTime >= startMs && s.endTime <= endMs;
            })
            .sort((a, b) => a.startTime - b.startTime);
    }, [sessions, startDate, endDate]);

    const reportData = useMemo(() => {
        return filteredSessions.map(s => {
            const laneInfo = getLaneInfo(s.laneId);
            const durationMin = Math.round((s.endTime! - s.startTime) / 60000);
            const laneType = s.laneType || laneInfo.type;
            const dateStr = toLocalDateISO(s.startTime);
            const pricePerMin = getPricePerMinute(s.startTime, laneType, pricing, isHoliday(dateStr));
            const totalValue = durationMin * pricePerMin;
            
            return {
                id: s.id,
                dateTime: s.startTime,
                laneType,
                laneName: laneInfo.name,
                durationMin,
                totalValue,
                comanda: s.comanda,
                customerName: s.customerName,
            };
        });
    }, [filteredSessions, pricing, isHoliday, lanes]);

    const totals = useMemo(() => {
        const bolData = reportData.filter(r => r.laneType === 'BOL');
        const snkData = reportData.filter(r => r.laneType === 'SNK');
        
        return {
            totalMinutes: reportData.reduce((acc, r) => acc + r.durationMin, 0),
            totalValue: reportData.reduce((acc, r) => acc + r.totalValue, 0),
            bolMinutes: bolData.reduce((acc, r) => acc + r.durationMin, 0),
            bolValue: bolData.reduce((acc, r) => acc + r.totalValue, 0),
            snkMinutes: snkData.reduce((acc, r) => acc + r.durationMin, 0),
            snkValue: snkData.reduce((acc, r) => acc + r.totalValue, 0),
        };
    }, [reportData]);

    const handlePrint = () => {
        window.print();
    };

    const formatDateTimeShort = (ts: number) => {
        const d = new Date(ts);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div className={onStandalone ? "consumption-report-embedded" : "modal-overlay"}>
            <div className={onStandalone ? "consumption-report-standalone" : "consumption-report-modal"}>
                {!onStandalone && (
                    <header className="report-header no-print">
                        <h2>Relatório de Consumo de Horas</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </header>
                )}

                <div className="report-filters no-print">
                    <div className="filter-group">
                        <label>De:</label>
                        <input 
                            type="datetime-local" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="filter-group">
                        <label>Até:</label>
                        <input 
                            type="datetime-local" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="report-content">
                    <div className="report-print-header">
                        <h1>{STORE_INFO.name}</h1>
                        <p>Gerado em {formatDateTime(Date.now())}</p>
                        <h2>Consumo de Horas</h2>
                        <p>{formatDateTimeShort(new Date(startDate).getTime())} a {formatDateTimeShort(new Date(endDate).getTime())}</p>
                    </div>

                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Tipo</th>
                                <th>Comanda</th>
                                <th>Pista</th>
                                <th>Duração</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-row">Nenhuma sessão encontrada no período</td>
                                </tr>
                            ) : (
                                reportData.map(row => (
                                    <tr key={row.id}>
                                        <td>{new Date(row.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>{row.laneType === 'BOL' ? 'Boliche' : 'Sinuca'}</td>
                                        <td>#{row.comanda}</td>
                                        <td>{row.laneName}</td>
                                        <td className="number-col">{row.durationMin} min</td>
                                        <td className="number-col">R$ {formatCurrency(row.totalValue)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="report-totals">
                        <div className="totals-row">
                            <span>Horas/Valor:</span>
                            <span>{formatCurrency(totals.totalMinutes)}</span>
                            <span>{formatCurrency(totals.totalValue)}</span>
                        </div>
                        <div className="totals-divider"></div>
                        <div className="totals-row">
                            <span>Boliche:</span>
                            <span>{formatCurrency(totals.bolMinutes)}</span>
                            <span>{formatCurrency(totals.bolValue)}</span>
                        </div>
                        <div className="totals-row">
                            <span>Sinuca:</span>
                            <span>{formatCurrency(totals.snkMinutes)}</span>
                            <span>{formatCurrency(totals.snkValue)}</span>
                        </div>
                    </div>
                </div>

                <footer className="report-actions no-print">
                    <button className="secondary-btn" onClick={onClose}>Fechar</button>
                    <button className="primary-btn" onClick={handlePrint}>🖨️ Imprimir Relatório</button>
                </footer>
            </div>
        </div>
    );
};

export default ConsumptionReport;
