import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import './Modal.css';

interface ResToLaneModalProps {
    reservationId: string;
    onClose: () => void;
    onConfirm: (laneId: string, comanda: string) => void;
}

const ResToLaneModal: React.FC<ResToLaneModalProps> = ({ reservationId, onClose, onConfirm }) => {
    const { lanes, reservations, sessions } = useLanes();
    const reservation = reservations.find(r => r.id === reservationId);
    
    const [selectedLaneId, setSelectedLaneId] = useState(reservation?.laneId || '');
    const [comanda, setComanda] = useState('');
    const [showLaneDropdown, setShowLaneDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedLane = lanes.find(l => l.id === selectedLaneId);
    const availableComandas = Array.from({ length: 60 }, (_, i) => (i + 1).toString())
        .filter(c => !sessions.some(s => s.isActive && s.comanda === c));

    const handleConfirm = () => {
        if (!selectedLaneId) {
            setError('Selecione uma pista para esta reserva.');
            return;
        }
        if (!comanda) {
            setError('Selecione uma comanda.');
            return;
        }
        onConfirm(selectedLaneId, comanda);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in" style={{ maxWidth: '480px', borderRadius: '8px', background: '#18181b', border: '1px solid var(--border-strong)' }}>
                <header className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '24px' }}>
                    <h3 style={{ fontFamily: "'Space Mono', monospace", color: 'var(--primary)', fontSize: '1.25rem' }}>Iniciar Sessão</h3>
                    <button className="close-btn" onClick={onClose} style={{ color: 'var(--text-muted)' }}>&times;</button>
                </header>

                <div className="modal-body" style={{ padding: '24px' }}>
                    <div className="reservation-summary" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Cliente</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{reservation ? reservation.customerName : 'Desconhecido'}</div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Selecione a Pista</label>
                        
                        <div 
                            className={`custom-select ${showLaneDropdown ? 'open' : ''}`}
                            onClick={() => setShowLaneDropdown(!showLaneDropdown)}
                        >
                            <div className="selected-value">
                                {selectedLane ? (
                                    <div className="lane-option-content">
                                        <span className="lane-name">{selectedLane.name}</span>
                                        {reservation?.laneId === selectedLane.id && (
                                            <span className="badge-reserved">RESERVADA</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="placeholder">Escolher Pista...</span>
                                )}
                                <span className={`arrow ${showLaneDropdown ? 'up' : 'down'}`}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 1L5 5L9 1" />
                                    </svg>
                                </span>
                            </div>

                            {showLaneDropdown && (
                                <div className="dropdown-list">
                                    {lanes.map(lane => {
                                        const isReservedForThis = reservation?.laneId === lane.id;
                                        const isAvailable = lane.status === 'free' || lane.status === 'reserved';
                                        const isDisabled = !isAvailable && !isReservedForThis;

                                        return (
                                            <div 
                                                key={lane.id} 
                                                className={`dropdown-item ${selectedLaneId === lane.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDisabled) {
                                                        setSelectedLaneId(lane.id);
                                                        setShowLaneDropdown(false);
                                                        setError(null);
                                                    }
                                                }}
                                            >
                                                <div className="lane-option-main">
                                                    <span className="lane-name">{lane.name}</span>
                                                    {isReservedForThis && <span className="badge-reserved">ORIGINAL</span>}
                                                </div>
                                                <div className="lane-option-status">
                                                    {isDisabled ? (
                                                        <span className="status-occupied">{lane.status.toUpperCase()}</span>
                                                    ) : (
                                                        <span className="status-free">LIVRE</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Comanda (1-60)</label>
                        <div className="comanda-grid-mini" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(6, 1fr)', 
                            gap: '8px', 
                            maxHeight: '160px', 
                            overflowY: 'auto',
                            padding: '12px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            {availableComandas.map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setComanda(num)}
                                    style={{
                                        padding: '10px 0',
                                        background: comanda === num ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                        color: comanda === num ? 'black' : 'white',
                                        border: '1px solid',
                                        borderColor: comanda === num ? 'var(--primary)' : 'transparent',
                                        borderRadius: '8px',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
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
