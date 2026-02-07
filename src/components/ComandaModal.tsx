import React, { useState } from 'react';
import './ComandaModal.css';

interface ComandaModalProps {
    onSelect: (num: string) => void;
    onClose: () => void;
}

const ComandaModal: React.FC<ComandaModalProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const comandas = Array.from({ length: 60 }, (_, i) => (i + 1).toString());

    const filtered = comandas.filter(c => c.startsWith(search));

    const handleConfirm = () => {
        if (search) {
            onSelect(search);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="comanda-modal">
                <header className="modal-header">
                    <h3>Selecionar Comanda</h3>
                </header>

                <div style={{ display: 'flex', gap: '8px', padding: '0 20px 20px' }}>
                    <input
                        type="text"
                        className="comanda-search"
                        placeholder="Digitar número..."
                        style={{ flex: 1 }}
                        value={search}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setSearch(val);
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                        autoFocus
                    />
                    <button className="primary-btn" onClick={handleConfirm} disabled={!search}>OK</button>
                </div>

                <div className="comanda-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filtered.map(num => (
                        <button
                            key={num}
                            className="comanda-btn"
                            onClick={() => onSelect(num)}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancelar</button>
                </footer>
            </div>
        </div>
    );
};

export default ComandaModal;
