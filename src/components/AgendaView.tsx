import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import ResToLaneModal from './ResToLaneModal';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';
import { ClockIcon, UserIcon, CheckIcon, PlayIcon, EditIcon } from './Icons';
import { toLocalDateISO } from '../utils/pricing';
import './AgendaView.css';

const AgendaView: React.FC = () => {
    const { lanes, reservations, addReservation, editReservation, updateReservationStatus, convertReservationToLane } = useLanes();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>(toLocalDateISO(Date.now()));

    // Conversion state
    const [convertingResId, setConvertingResId] = useState<string | null>(null);

    // Form state
    const [laneId, setLaneId] = useState<string>('');
    const [lanesRequested, setLanesRequested] = useState<number>(1);
    const [customerName, setCustomerName] = useState('');
    const [date, setDate] = useState(toLocalDateISO(Date.now()));
    const [time, setTime] = useState('');
    const [observation, setObservation] = useState('');

    const handleEdit = (res: any) => {
        setEditingId(res.id);
        setLaneId(res.laneId || '');
        setLanesRequested(res.lanesRequested || 1);
        setCustomerName(res.customerName);
        setDate(toLocalDateISO(res.startTime));
        setTime(new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setObservation(res.observation || '');
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setCustomerName('');
        setLanesRequested(1);
        setDate(toLocalDateISO(Date.now()));
        setTime('');
        setLaneId('');
        setObservation('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [hours, minutes] = time.split(':');
        const [year, month, day] = date.split('-');
        
        const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0, 0);

        const end = new Date(start.getTime() + 60 * 60000); // Default 1h

        if (editingId) {
            editReservation(editingId, {
                laneId: laneId || undefined,
                lanesRequested,
                customerName,
                startTime: start.getTime(),
                endTime: end.getTime(),
                observation: observation.trim() || undefined,
            });
        } else {
            addReservation({
                laneId: laneId || undefined,
                lanesRequested,
                customerName,
                startTime: start.getTime(),
                endTime: end.getTime(),
                observation: observation.trim() || undefined,
            });
        }

        resetForm();
    };

    const sortedReservations = [...reservations].sort((a, b) => a.startTime - b.startTime);
    const nonTerminal = ['pending', 'arrived', 'delayed'];
    const filteredReservations = sortedReservations.filter(r => {
        const matchesStatus = statusFilter === 'all' ? nonTerminal.includes(r.status) : r.status === statusFilter;
        const resDate = toLocalDateISO(r.startTime);
        const matchesDate = resDate === dateFilter;
        return matchesStatus && matchesDate;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Aguardando';
            case 'arrived': return 'Check-in';
            case 'delayed': return 'Atrasada';
            case 'no-show': return 'Não veio';
            case 'cancelled': return 'Cancelada';
            case 'fulfilled': return 'Iniciada';
            default: return status;
        }
    };

    return (
        <section className="agenda-view fade-in">
            <header className="section-header">
                <div>
                    <h2>Gestão de Reservas</h2>
                    <p className="subtitle">Visualização e agendamento</p>
                </div>
                <div className="header-actions">
                    <div className="filter-group">
                        <CustomDatePicker 
                            value={dateFilter} 
                            onChange={setDateFilter} 
                            className="agenda-date-filter"
                        />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">Todos os Status</option>
                            <option value="pending">Aguardando</option>
                            <option value="arrived">Check-in</option>
                            <option value="no-show">No-show</option>
                            <option value="fulfilled">Iniciadas</option>
                        </select>
                    </div>
                    <button className="primary-btn" onClick={() => setIsAdding(true)}>
                        + Nova Reserva
                    </button>
                </div>
            </header>

            {isAdding && (
                <div className="reservation-form-overlay">
                    <form className="reservation-form" onSubmit={handleSubmit}>
                        <div className="form-header">
                            <h3>{editingId ? 'Editar Reserva' : 'Nova Reserva'}</h3>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Pista Preferencial</label>
                                <select value={laneId} onChange={e => setLaneId(e.target.value)}>
                                    <option value="">(Qualquer Pista)</option>
                                    {lanes.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Qtd. Pistas</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={lanesRequested}
                                    onChange={e => setLanesRequested(parseInt(e.target.value))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nome do Cliente</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Nome completo"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <CustomDatePicker
                                label="Data"
                                value={date}
                                onChange={setDate}
                            />
                        </div>

                        <div className="form-group">
                            <CustomTimePicker
                                label="Horário"
                                value={time}
                                onChange={setTime}
                            />
                        </div>

                        <div className="form-group">
                            <label>Observação</label>
                            <textarea
                                value={observation}
                                onChange={e => setObservation(e.target.value)}
                                placeholder="Notas adicionais (opcional)"
                                rows={3}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="secondary-btn" onClick={resetForm}>
                                Voltar
                            </button>
                            <button type="submit" className="primary-btn">
                                {editingId ? 'Salvar Alterações' : 'Agendar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {convertingResId && (
                <ResToLaneModal
                    reservationId={convertingResId}
                    onConfirm={(laneIds, comanda) => {
                        convertReservationToLane(convertingResId, comanda, laneIds);
                        setConvertingResId(null);
                    }}
                    onClose={() => setConvertingResId(null)}
                />
            )}

            <div className="reservation-list">
                {filteredReservations.length === 0 ? (
                    <div className="empty-state">
                        <span className="icon">📅</span>
                        <p>Nenhuma reserva encontrada</p>
                    </div>
                ) : (
                    filteredReservations.map(res => {
                        const lane = lanes.find(l => l.id === res.laneId);
                        const isTerminal = ['fulfilled', 'cancelled', 'no-show'].includes(res.status);

                        return (
                            <div key={res.id} className={`reservation-item ${res.status}`}>
                                <div className="res-time-section">
                                    <div className="res-time-wrapper">
                                        <ClockIcon width={16} height={16} className="item-icon" />
                                        <span className="res-time-text">
                                            {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                    </div>
                                    <span className={`status-pill ${res.status}`}>
                                        {getStatusLabel(res.status)}
                                    </span>
                                </div>

                                <div className="res-main-section">
                                    <div className="customer-info">
                                        <UserIcon width={18} height={18} className="user-icon" />
                                        <span className="customer-name">{res.customerName}</span>
                                    </div>
                                    <div className="lane-info">
                                        <span className="lane-badge">
                                            {lane?.name || 'Qualquer'} 
                                            {res.lanesRequested > 1 && ` (+${res.lanesRequested - 1})`}
                                        </span>
                                    </div>
                                    {res.observation && (
                                        <div className="res-observation">
                                            <span className="obs-label">Obs:</span> {res.observation}
                                        </div>
                                    )}
                                </div>

                                <div className="res-actions-section">
                                    {!isTerminal && (
                                        <>
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(res)}
                                            >
                                                <EditIcon width={14} height={14} />
                                                <span>Editar</span>
                                            </button>
                                            {res.status === 'pending' && (
                                                <button
                                                    className="btn-action btn-arrive"
                                                    onClick={() => updateReservationStatus(res.id, 'arrived')}
                                                >
                                                    <CheckIcon width={16} height={16} />
                                                    <span>Confirmar Chegada</span>
                                                </button>
                                            )}
                                            {res.status === 'arrived' && (
                                                <button
                                                    className="btn-action btn-open"
                                                    onClick={() => setConvertingResId(res.id)}
                                                >
                                                    <PlayIcon width={14} height={14} />
                                                    <span>Abrir Pista</span>
                                                </button>
                                            )}
                                            <div className="actions-dropdown-wrapper">
                                                <select
                                                    className="minimal-select"
                                                    value={res.status}
                                                    onChange={(e) => updateReservationStatus(res.id, e.target.value as any)}
                                                >
                                                    <option value="" disabled>Opções</option>
                                                    <option value="pending">Aguardando</option>
                                                    <option value="delayed">Atrasada</option>
                                                    <option value="no-show">Não veio</option>
                                                    <option value="cancelled">Cancelar</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    {res.status === 'fulfilled' && (
                                        <div className="session-ongoing">
                                            <div className="pulse-dot"></div>
                                            <span>Sessão em curso</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default AgendaView;
