import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon } from './Icons';

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (day: number) => {
        const year = viewDate.getFullYear();
        const month = String(viewDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        onChange(`${year}-${month}-${dayStr}`);
        setIsOpen(false);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return 'Selecionar data';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const days = [];
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const offset = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

    for (let i = 0; i < offset; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const selectedDate = value ? new Date(value + 'T12:00:00') : null;

    for (let d = 1; d <= totalDays; d++) {
        const isSelected = selectedDate && 
                           selectedDate.getDate() === d && 
                           selectedDate.getMonth() === viewDate.getMonth() && 
                           selectedDate.getFullYear() === viewDate.getFullYear();
        
        days.push(
            <div 
                key={d} 
                className={`calendar-day ${isSelected ? 'selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleDateSelect(d); }}
            >
                {d}
            </div>
        );
    }

    return (
        <div className={`custom-picker-container ${className || ''}`} ref={containerRef}>
            {label && <label className="picker-label">{label}</label>}
            <div className={`picker-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="picker-value">{formatDateDisplay(value)}</span>
                <span className="picker-icon">📅</span>
            </div>

            {isOpen && (
                <div className="picker-dropdown calendar-dropdown">
                    <header className="calendar-header">
                        <button type="button" onClick={handlePrevMonth}>&lt;</button>
                        <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button type="button" onClick={handleNextMonth}>&gt;</button>
                    </header>
                    <div className="calendar-weekdays">
                        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                    </div>
                    <div className="calendar-grid">
                        {days}
                    </div>
                </div>
            )}

            <style>{`
                .custom-picker-container {
                    position: relative;
                    width: 100%;
                }
                .picker-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.6);
                }
                .picker-trigger {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                    color: white;
                }
                .picker-trigger:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.08);
                }
                .picker-trigger.open {
                    border-color: var(--primary);
                    background: rgba(255, 255, 255, 0.1);
                }
                .picker-value {
                    font-weight: 500;
                    font-size: 0.95rem;
                }
                .picker-icon {
                    opacity: 0.6;
                    font-size: 1rem;
                }

                .picker-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    background: #1e293b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    z-index: 100;
                    padding: 16px;
                    min-width: 280px;
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    font-weight: bold;
                }
                .calendar-header button {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .calendar-header button:hover {
                    background: rgba(255,255,255,0.2);
                }

                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 8px;
                    font-weight: 800;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }
                
                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .calendar-day:hover:not(.empty):not(.selected) {
                    background: rgba(255,255,255,0.1);
                }
                .calendar-day.selected {
                    background: var(--primary);
                    color: white;
                    font-weight: bold;
                }
                .calendar-day.empty {
                    cursor: default;
                }
            `}</style>
        </div>
    );
};

export default CustomDatePicker;
