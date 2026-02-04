import React, { useState, useMemo } from 'react';
import { useLanes } from '../context/LaneContext';
import { LogEntry } from '../types';
import ReceiptView from './ReceiptView';
import CustomDatePicker from './CustomDatePicker';
import { EyeIcon, PrinterIcon, ChartIcon } from './Icons';
import './HistoryView.css';

const HistoryView: React.FC = () => {
    const { logs } = useLanes();
    const toLocalDateISO = (msOrDate: number | Date) => {
        const d = new Date(msOrDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('Todos');
    const [selectedDate, setSelectedDate] = useState(toLocalDateISO(Date.now()));
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [reprintData, setReprintData] = useState<any>(null);
    const [selectedLogsForPrint, setSelectedLogsForPrint] = useState<string[]>([]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const dateMatch = toLocalDateISO(log.timestamp) === selectedDate;
            const termMatch = log.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.userName.toLowerCase().includes(searchTerm.toLowerCase());

            let categoryMatch = true;
            if (filter === 'Pistas') categoryMatch = log.action.includes('Pista');
            else if (filter === 'Reservas') categoryMatch = log.action.includes('Reserva');
            else if (filter === 'Fila') categoryMatch = log.action.includes('Fila') || log.action.includes('Transição');

            return dateMatch && termMatch && categoryMatch;
        });
    }, [logs, searchTerm, filter, selectedDate]);

    const handlePrintShiftReport = () => {
        // Simple shift report simulation
        const todayLogs = logs.filter(l => toLocalDateISO(l.timestamp) === selectedDate);
        const closures = todayLogs.filter(l => l.action === 'Fechar Pista');
        const totalDuration = closures.reduce((acc, l) => acc + (l.details?.duration || 0), 0);

        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            reportWindow.document.write(`
                <html>
                <head><title>Relatório de Turno - ${selectedDate}</title></head>
                <body style="font-family: monospace; padding: 20px;">
                    <h2>RELATÓRIO DE TURNO</h2>
                    <p>Data: ${selectedDate}</p>
                    <hr/>
                    <p>Total de Pistas Encerradas: ${closures.length}</p>
                    <p>Tempo Total de Jogo: ${Math.round(totalDuration / 60000)} min</p>
                    <hr/>
                    <h3>RESUMO DE ENCERRAMENTOS</h3>
                    ${closures.map(l => `<p>${l.context} - ${Math.round(l.details?.duration / 60000)}min</p>`).join('')}
                    <hr/>
                    <p style="text-align: center;">STRIKE BOLICHE BAR</p>
                </body>
                </html>
            `);
            reportWindow.print();
        }
    };

    const handlePrintSelected = () => {
        if (selectedLogsForPrint.length === 0) return;

        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            const content = selectedLogsForPrint.map(id => {
                const log = logs.find(l => l.id === id);
                if (!log || !log.details) return '';
                const d = log.details;
                const start = new Date(d.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const end = new Date(d.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const dur = Math.round((d.endTime - d.startTime) / 60000);
                
                return `
                    <div style="border: 2px solid #000; padding: 40px; margin-bottom: 30px; page-break-after: always; max-width: 400px; margin-left: auto; margin-right: auto;">
                        <h1 style="text-align: center; font-size: 24px; margin-bottom: 5px;">STRIKE BOLICHE</h1>
                        <p style="text-align: center; margin-top: 0; font-size: 14px;">RECIBO DE JOGO</p>
                        <div style="border-top: 1px solid #000; margin: 20px 0;"></div>
                        <table style="width: 100%; font-size: 18px; border-collapse: collapse;">
                            <tr><td style="padding: 5px 0;"><b>PISTA:</b></td><td style="text-align: right;">${d.laneName.toUpperCase()}</td></tr>
                            <tr><td style="padding: 5px 0;"><b>COMANDA:</b></td><td style="text-align: right;">#${d.comanda}</td></tr>
                            <tr><td style="padding: 5px 0;"><b>INÍCIO:</b></td><td style="text-align: right;">${start}</td></tr>
                            <tr><td style="padding: 5px 0;"><b>FIM:</b></td><td style="text-align: right;">${end}</td></tr>
                            <tr><td style="padding: 5px 0; border-top: 1px solid #000;"><b>DURAÇÃO:</b></td><td style="text-align: right; border-top: 1px solid #000;">${dur} min</td></tr>
                        </table>
                        <div style="border-top: 1px solid #000; margin: 20px 0;"></div>
                        <p style="font-size: 12px; text-align: center; color: #555;">Reimpressão em lote<br/>${new Date().toLocaleString()}</p>
                    </div>
                `;
            }).join('');

            reportWindow.document.write(`
                <html>
                <head>
                    <title>Impressão de Recibos</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            .no-print { display: none; }
                        }
                        body { font-family: 'Courier New', Courier, monospace; background: white; color: black; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `);
            setTimeout(() => {
                reportWindow.print();
                setSelectedLogsForPrint([]);
            }, 500);
        }
    };

    const toggleSelectLog = (id: string) => {
        setSelectedLogsForPrint(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <section className="history-view fade-in">
            <header className="section-header">
                <div>
                    <h2>Histórico Operacional</h2>
                    <p className="subtitle">Auditoria e conferência de movimentos</p>
                </div>
                <div className="header-actions">
                    {selectedLogsForPrint.length > 0 && (
                        <button className="primary-btn secondary-style" onClick={handlePrintSelected} style={{ marginRight: '10px' }}>
                            <PrinterIcon width={16} height={16} style={{marginRight: '8px'}} />
                            Imprimir Selecionados: {selectedLogsForPrint.length}
                        </button>
                    )}
                    <button className="primary-btn" onClick={handlePrintShiftReport}>
                        <ChartIcon width={16} height={16} style={{marginRight: '8px'}} />
                        Relatório do Dia
                    </button>
                </div>
            </header>

            <div className="history-controls">
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, comanda ou usuário..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <CustomDatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        className="history-date-filter"
                    />
                </div>
                <div className="filter-tabs">
                    {['Todos', 'Pistas', 'Reservas', 'Fila'].map(t => (
                        <button
                            key={t}
                            className={`filter-tab ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="history-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Hora</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Descrição</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className={`history-row ${selectedLogsForPrint.includes(log.id) ? 'selected' : ''}`}>
                                <td className="check-col">
                                    {(log.action === 'Fechar Pista' && log.details) && (
                                        <input 
                                            type="checkbox" 
                                            checked={selectedLogsForPrint.includes(log.id)}
                                            onChange={() => toggleSelectLog(log.id)}
                                            className="log-checkbox"
                                        />
                                    )}
                                </td>
                                <td className="time-col">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                <td className="user-col">
                                    <div className="user-pill">{log.userName}</div>
                                </td>
                                <td><span className={`action-badge ${log.action.toLowerCase().replace(/ /g, '-')}`}>{log.action}</span></td>
                                <td className="context-col">{log.context}</td>
                                <td>
                                    <div className="row-actions">
                                        <button className="icon-btn" title="Ver Detalhes" onClick={() => setSelectedLog(log)}>
                                            <EyeIcon width={16} height={16} />
                                        </button>
                                        {log.action === 'Fechar Pista' && log.details && (
                                            <button className="icon-btn" title="Reimprimir Recibo" onClick={() => setReprintData(log.details)}>
                                                <PrinterIcon width={16} height={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-state">Nenhum registro encontrado para este filtro/data.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal-content log-detail-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h3>Detalhes do Evento</h3>
                            <button className="close-btn" onClick={() => setSelectedLog(null)}>&times;</button>
                        </header>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Timestamp</label>
                                    <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Operador</label>
                                    <span>{selectedLog.userName} (ID: {selectedLog.userId})</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ação Executada</label>
                                    <span className="text-highlight">{selectedLog.action}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Contexto Geral</label>
                                    <p>{selectedLog.context}</p>
                                </div>
                                {selectedLog.details && (
                                    <div className="detail-item full-width data-dump">
                                        <label>Dados Técnicos</label>
                                        <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reprintData && (
                <ReceiptView
                    {...reprintData}
                    onClose={() => setReprintData(null)}
                />
            )}
        </section>
    );
};

export default HistoryView;
