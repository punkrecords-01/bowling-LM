import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import './WaitingListView.css';
import ComandaModal from './ComandaModal';
import DeleteWaitingConfirmationModal from './DeleteWaitingConfirmationModal';
import AddWaitingConfirmationModal from './AddWaitingConfirmationModal';

const WaitingListView: React.FC = () => {
    const { waitingList, addToWaitingList, removeFromWaitingList, logs } = useLanes();
    const [lanesReq, setLanesReq] = useState(1);
    const [table, setTable] = useState('');
    const [comanda, setComanda] = useState('');
    const [placa, setPlaca] = useState('');
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<any>(null);
    const [pendingEntry, setPendingEntry] = useState<any>(null);

    const transitionLogs = logs.filter(log => log.action === 'Transição Fila -> Pista').slice(0, 10);

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use comanda or table as identifier since name is removed
        const identifier = placa ? `Placa ${placa}` : (comanda ? `Comanda #${comanda}` : (table ? `Mesa ${table}` : 'Grupo Sem Nome'));
        setPendingEntry({ 
            name: identifier, 
            lanesRequested: lanesReq, 
            table: table || '', 
            comanda: comanda || '',
            placa: placa || '' 
        });
    };

    const confirmAdd = () => {
        if (pendingEntry) {
            addToWaitingList(
                pendingEntry.name,
                pendingEntry.lanesRequested,
                pendingEntry.table || undefined,
                pendingEntry.comanda || undefined,
                pendingEntry.placa || undefined
            );
            setLanesReq(1);
            setTable('');
            setComanda('');
            setPlaca('');
            setPendingEntry(null);
        }
    };

    return (
        <div className="waiting-list-container">
            <header className="section-header">
                <h2>Fila de Espera</h2>
                <span className="pax-total">{waitingList.length} Grupos Aguardando</span>
            </header>

            <form className="waiting-form-premium" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Placa/Tag</label>
                        <input
                            type="text"
                            placeholder="Nº Plaquinha"
                            value={placa}
                            onChange={e => setPlaca(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label>Comanda</label>
                        <div className="comanda-selector-trigger" onClick={() => setShowComandaModal(true)}>
                            {comanda ? `#${comanda}` : "Selecionar"}
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Mesa Atual</label>
                        <input
                            type="text"
                            placeholder="Mesa #"
                            value={table}
                            onChange={e => setTable(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Qtd. Pistas</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={lanesReq}
                            onChange={e => setLanesReq(parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>

                <button type="submit" className="primary-btn-submit">ADICIONAR À FILA</button>
            </form>

            {showComandaModal && (
                <ComandaModal
                    onSelect={(num) => {
                        setComanda(num);
                        setShowComandaModal(false);
                    }}
                    onClose={() => setShowComandaModal(false)}
                />
            )}

            {pendingEntry && (
                <AddWaitingConfirmationModal
                    data={pendingEntry}
                    onCancel={() => setPendingEntry(null)}
                    onConfirm={confirmAdd}
                />
            )}

            {entryToDelete && (
                <DeleteWaitingConfirmationModal
                    customerName={entryToDelete.name}
                    onCancel={() => setEntryToDelete(null)}
                    onConfirm={() => {
                        removeFromWaitingList(entryToDelete.id);
                        setEntryToDelete(null);
                    }}
                />
            )}

            <div className="waiting-cards">
                {waitingList.map(item => (
                    <div key={item.id} className="waiting-card">
                        <div className="waiting-info">
                            <div className="customer-row">
                                <span className="customer-name">{item.name}</span>
                                <span className="pax-count-simple">• {item.lanesRequested} {item.lanesRequested === 1 ? 'Pista' : 'Pistas'}</span>
                            </div>
                            <div className="extra-info">
                                {item.table && item.name !== `Mesa ${item.table}` && <span className="info-label">Mesa {item.table}</span>}
                                {item.comanda && item.name !== `Comanda #${item.comanda}` && <span className="info-label">Comanda #{item.comanda}</span>}
                            </div>
                        </div>
                        <div className="waiting-status">
                            <span className="wait-time text-highlight">~{item.estimatedWaitTime} min</span>
                            <button
                                className="remove-btn"
                                onClick={() => setEntryToDelete(item)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {transitionLogs.length > 0 && (
                <div className="transition-history">
                    <h3>Histórico Recente de Transições</h3>
                    <div className="transition-list">
                        {transitionLogs.map(log => (
                            <div key={log.id} className="transition-item">
                                <span className="log-time">{formatTime(log.timestamp)}</span>
                                <span className="log-context">{log.context}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaitingListView;
