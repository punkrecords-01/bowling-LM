import React, { useState } from 'react';
import { useLanes } from '../context/LaneContext';
import ComandaModal from './ComandaModal';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';
import './AgendaView.css';

const AgendaView: React.FC = () => {
    const { lanes, reservations, addReservation, updateReservationStatus, convertReservationToLane } = useLanes();
    const [isAdding, setIsAdding] = useState(false);
    const toLocalDateISO = (msOrDate: number | Date) => {
        const d = new Date(msOrDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>(toLocalDateISO(Date.now()));

    // Conversion state
    const [convertingResId, setConvertingResId] = useState<string | null>(null);

    // Form state
    const [laneId, setLaneId] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [date, setDate] = useState(toLocalDateISO(Date.now()));
    const [time, setTime] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [hours, minutes] = time.split(':');
        const [year, month, day] = date.split('-');
        
        const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0, 0);

        const end = new Date(start.getTime() + 60 * 60000); // Default 1h

        addReservation({
            laneId: laneId || undefined,
            customerName,
            startTime: start.getTime(),
            endTime: end.getTime(),
        });

        setIsAdding(false);
        setCustomerName('');
        setDate(toLocalDateISO(Date.now()));
        setTime('');
        setLaneId('');
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
            case 'no-show': return 'No-show';
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
                            <h3>Nova Reserva</h3>
                        </div>

                        <div className="form-group">
                            <label>Pista</label>
                            <select value={laneId} onChange={e => setLaneId(e.target.value)}>
                                <option value="">(Qualquer Pista)</option>
                                {lanes.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
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

                        <div className="form-actions">
                            <button type="button" className="secondary-btn" onClick={() => setIsAdding(false)}>
                                Voltar
                            </button>
                            <button type="submit" className="primary-btn">
                                Agendar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {convertingResId && (
                <ComandaModal
                    onSelect={(num) => {
                        convertReservationToLane(convertingResId, num);
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
                                <div className="res-time">
                                    {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="res-main">
                                    <div className="res-info">
                                        <span className="customer">{res.customerName}</span>
                                        <span className="lane-tag">{lane?.name || 'Qualquer Pista'}</span>
                                    </div>
                                    <div className="res-status">
                                        <span className={`status-pill ${res.status}`}>
                                            {getStatusLabel(res.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="res-actions">
                                    {!isTerminal && (
                                        <>
                                            {res.status === 'pending' && (
                                                <button
                                                    className="action-link arrived"
                                                    onClick={() => updateReservationStatus(res.id, 'arrived')}
                                                >
                                                    Chegou
                                                </button>
                                            )}
                                            {res.status === 'arrived' && (
                                                <button
                                                    className="action-btn convert"
                                                    onClick={() => setConvertingResId(res.id)}
                                                >
                                                    Abrir Pista
                                                </button>
                                            )}
                                            <div className="more-actions">
                                                <select
                                                    className="status-select"
                                                    value={res.status}
                                                    onChange={(e) => updateReservationStatus(res.id, e.target.value as any)}
                                                >
                                                    <option value="" disabled>Ações...</option>
                                                    <option value="pending">Aguardando</option>
                                                    <option value="delayed">Atrasada</option>
                                                    <option value="no-show">No-show</option>
                                                    <option value="cancelled">Cancelar</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    {res.status === 'fulfilled' && (
                                        <span className="fulfilled-msg">Sessão em curso</span>
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
