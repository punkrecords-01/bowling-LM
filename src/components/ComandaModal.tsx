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

    return (
        <div className="modal-overlay">
            <div className="comanda-modal">
                <header className="modal-header">
                    <h3>Selecionar Comanda (1-60)</h3>
                </header>

                <input
                    type="text"
                    className="comanda-search"
                    placeholder="Digitar número..."
                    value={search}
                    onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 60)) {
                            setSearch(val);
                        }
                    }}
                    autoFocus
                />

                <div className="comanda-grid">
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
