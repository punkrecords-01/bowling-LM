import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import './WaitingListView.css';
import ComandaModal from './ComandaModal';
import DeleteWaitingConfirmationModal from './DeleteWaitingConfirmationModal';
import AddWaitingConfirmationModal from './AddWaitingConfirmationModal';

const WaitingListView: React.FC = () => {
    const { waitingList, addToWaitingList, removeFromWaitingList } = useLanes();
    const [name, setName] = useState('');
    const [lanesReq, setLanesReq] = useState(1);
    const [table, setTable] = useState('');
    const [comanda, setComanda] = useState('');
    const [showComandaModal, setShowComandaModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<any>(null);
    const [pendingEntry, setPendingEntry] = useState<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            setPendingEntry({ name, lanesRequested: lanesReq, table: table || '', comanda: comanda || '' });
        }
    };

    const confirmAdd = () => {
        if (pendingEntry) {
            addToWaitingList(
                pendingEntry.name,
                pendingEntry.lanesRequested,
                pendingEntry.table || undefined,
                pendingEntry.comanda || undefined
            );
            setName('');
            setLanesReq(1);
            setTable('');
            setComanda('');
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
                    <div className="form-field full-width">
                        <label>Nome do Cliente</label>
                        <input
                            type="text"
                            placeholder="Ex: João Silva"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Qtd. Pistas</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={lanesReq}
                            onChange={e => setLanesReq(parseInt(e.target.value))}
                        />
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
                        <label>Comanda</label>
                        <div className="comanda-selector-trigger" onClick={() => setShowComandaModal(true)}>
                            {comanda ? `#${comanda}` : "Selecionar"}
                        </div>
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
                                <span className="pax-count">{item.lanesRequested} Pistas</span>
                            </div>
                            <div className="extra-info">
                                {item.table && <span className="info-tag table">Mesa {item.table}</span>}
                                {item.comanda && <span className="info-tag comanda">Comanda #{item.comanda}</span>}
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
        </div>
    );
};

export default WaitingListView;
