import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import './Modal.css';

interface ResToLaneModalProps {
    reservationId: string;
    onClose: () => void;
    onConfirm: (laneIds: string[], comanda: string) => void;
}

const ResToLaneModal: React.FC<ResToLaneModalProps> = ({ reservationId, onClose, onConfirm }) => {
    const { lanes, reservations, sessions } = useLanes();
    const reservation = reservations.find(r => r.id === reservationId);
    
    const [selectedLaneIds, setSelectedLaneIds] = useState<string[]>(reservation?.laneId ? [reservation.laneId] : []);
    const [comanda, setComanda] = useState('');
    const [showLaneDropdown, setShowLaneDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = () => {
        if (selectedLaneIds.length === 0) {
            setError('Selecione pelo menos uma pista.');
            return;
        }
        if (!comanda) {
            setError('Digite o número da comanda.');
            return;
        }
        onConfirm(selectedLaneIds, comanda);
    };

    const toggleLane = (laneId: string) => {
        setSelectedLaneIds(prev => 
            prev.includes(laneId) 
                ? prev.filter(id => id !== laneId)
                : [...prev, laneId]
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in" style={{ maxWidth: '480px', borderRadius: '8px', background: '#18181b', border: '1px solid var(--border-strong)' }}>
                <header className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '24px' }}>
                    <h3 style={{ fontFamily: "'Space Mono', monospace", color: 'var(--primary)', fontSize: '1.25rem' }}>Iniciar Sess�o</h3>
                    <button className="close-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }}>&times;</button>
                </header>

                <div className="modal-body" style={{ padding: '24px' }}>
                    <div className="reservation-summary" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Cliente</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{reservation ? reservation.customerName : 'Desconhecido'}</div>
                        {reservation?.observation && (
                            <>
                                <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '4px' }}>Observação</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{reservation.observation}</div>
                            </>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Pistas Selecionadas ({selectedLaneIds.length})</label>
                        
                        <div 
                            className={`custom-select ${showLaneDropdown ? 'open' : ''}`}
                            onClick={() => setShowLaneDropdown(!showLaneDropdown)}
                        >
                            <div className="selected-value">
                                {selectedLaneIds.length > 0 ? (
                                    <div className="lane-option-content">
                                        <span className="lane-name">
                                            {selectedLaneIds.map(id => lanes.find(l => l.id === id)?.name).join(', ')}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="placeholder">Escolher Pistas...</span>
                                )}
                                <span className={`arrow ${showLaneDropdown ? 'up' : 'down'}`}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 1L5 5L9 1" />
                                    </svg>
                                </span>
                            </div>

                            {showLaneDropdown && (
                                <div className="dropdown-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {lanes.map(lane => {
                                        const isReservedForThis = reservation?.laneId === lane.id;
                                        const isAvailable = lane.status === 'free' || lane.status === 'reserved';
                                        const isSelected = selectedLaneIds.includes(lane.id);
                                        const isDisabled = !isAvailable && !isReservedForThis && !isSelected;

                                        return (
                                            <div 
                                                key={lane.id} 
                                                className={`dropdown-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDisabled) {
                                                        toggleLane(lane.id);
                                                        setError(null);
                                                    }
                                                }}
                                            >
                                                <div className="lane-option-main">
                                                    <span className="lane-name">{lane.name}</span>
                                                    {isReservedForThis && <span style={{fontSize: '0.6rem', background: 'var(--primary)', color: 'black', padding: '1px 4px', borderRadius: '4px', marginLeft: '8px'}}>PREFERENCIAL</span>}
                                                    {isSelected && <span style={{marginLeft: 'auto', fontWeight: 900, color: 'var(--primary)'}}>✓</span>}
                                                </div>
                                                <div className="lane-option-status">
                                                    {isDisabled ? (
                                                        <span className="status-occupied">OCUPADA</span>
                                                    ) : !isSelected ? (
                                                        <span className="status-free">LIVRE</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Número da Comanda</label>
                        <input 
                            type="number"
                            className="custom-input"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                            value={comanda}
                            onChange={(e) => setComanda(e.target.value)}
                            placeholder="Digite o número da comanda"
                            autoFocus
                        />
                    </div>

                    {error && <p style={{ color: 'var(--status-error)', fontSize: '0.75rem', fontWeight: 700, marginTop: '16px', textAlign: 'center' }}>{error}</p>}
                </div>

                <footer className="modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--bg-card-hover)', fontWeight: 800 }}>Voltar</button>
                    <button className="primary-btn" onClick={handleConfirm} style={{ flex: 2, padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'black', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px var(--primary-glow)' }}>Finalizar e Abrir</button>
                </footer>
            </div>
        </div>
    );
};

export default ResToLaneModal;
