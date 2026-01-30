import React, { useState, useRef, useEffect } from 'react';

interface CustomTimePickerProps {
    value: string; // HH:mm
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, label, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hourScrollRef = useRef<HTMLDivElement>(null);
    const minScrollRef = useRef<HTMLDivElement>(null);

    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    const [currentH, currentM] = (inputValue || '12:00').split(':');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const selectedHour = hourScrollRef.current?.querySelector('.selected');
            if (selectedHour) {
                selectedHour.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
            const selectedMin = minScrollRef.current?.querySelector('.selected');
            if (selectedMin) {
                selectedMin.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
        }
    }, [isOpen]);

    const handleSelect = (h: string, m: string) => {
        const newVal = `${h}:${m}`;
        setInputValue(newVal);
        onChange(newVal);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        
        let formatted = val;
        if (val.length >= 3) {
            formatted = val.slice(0, 2) + ':' + val.slice(2);
        }
        
        setInputValue(formatted);

        if (formatted.length === 5) {
            const [h, m] = formatted.split(':').map(Number);
            if (h >= 0 && h < 24 && m >= 0 && m < 60) {
                onChange(formatted);
            }
        }
    };

    const handleInputBlur = () => {
        if (inputValue.length < 5) {
            setInputValue(value || '');
            return;
        }
        const [h, m] = inputValue.split(':').map(Number);
        if (isNaN(h) || h >= 24 || isNaN(m) || m >= 60) {
            setInputValue(value || '');
        }
    };

    const handleColumnClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className={`custom-picker-container ${className || ''}`} ref={containerRef}>
            {label && <label className="picker-label">{label}</label>}
            <div 
                className={`picker-trigger ${isOpen ? 'open' : ''}`} 
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                <input 
                    ref={inputRef}
                    type="text"
                    className="picker-input-field"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="00:00"
                    maxLength={5}
                />
                <span className="picker-icon" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>🕒</span>
            </div>

            {isOpen && (
                <div className="picker-dropdown time-dropdown" onClick={handleColumnClick}>
                    <div className="time-selector-columns">
                        <div className="time-column">
                            <div className="column-label">HORA</div>
                            <div className="column-scroll" ref={hourScrollRef}>
                                {hours.map(h => (
                                    <div 
                                        key={h} 
                                        className={`time-unit ${h === currentH ? 'selected' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleSelect(h, currentM); }}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="time-divider">:</div>
                        <div className="time-column">
                            <div className="column-label">MIN</div>
                            <div className="column-scroll" ref={minScrollRef}>
                                {minutes.map(m => (
                                    <div 
                                        key={m} 
                                        className={`time-unit ${m === currentM ? 'selected' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleSelect(currentH, m); }}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="time-footer">
                        <button type="button" className="confirm-time-btn" onClick={() => setIsOpen(false)}>Confirmar</button>
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
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 0 16px;
                    height: 48px;
                    cursor: text;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    color: white;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                .picker-trigger:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(15, 23, 42, 0.8);
                }
                .picker-trigger:focus-within {
                    border-color: var(--primary);
                    background: rgba(15, 23, 42, 0.9);
                    box-shadow: 0 0 0 1px var(--primary), 0 0 15px rgba(59, 130, 246, 0.2);
                }
                .picker-trigger.open {
                    border-color: var(--primary);
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                }
                /* Reset total para o input interno não herdar estilos globais */
                input.picker-input-field {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: white !important;
                    font-family: inherit !important;
                    font-size: 1.1rem !important;
                    font-weight: 700 !important;
                    width: 100% !important;
                    height: 100% !important;
                    outline: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    letter-spacing: 2px !important;
                    display: block !important;
                }
                .picker-input-field::placeholder {
                    color: rgba(255,255,255,0.2) !important;
                    letter-spacing: normal !important;
                }
                .picker-value {
                    font-weight: 500;
                    font-size: 0.95rem;
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
                }

                .time-dropdown {
                    min-width: 180px;
                    padding: 12px;
                }
                .time-selector-columns {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    gap: 8px;
                    height: 180px; /* Reduzido um pouco para caber melhor */
                }
                .time-column {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    height: 100%;
                }
                .column-label {
                    font-size: 0.65rem;
                    text-align: center;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 8px;
                    font-weight: 800;
                }
                .column-scroll {
                    overflow-y: auto;
                    height: 100%;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    background: rgba(0,0,0,0.3);
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary) transparent;
                }
                .column-scroll::-webkit-scrollbar { width: 6px; }
                .column-scroll::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.2); 
                    border-radius: 4px; 
                }

                .time-unit {
                    padding: 10px 5px;
                    text-align: center;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.1s;
                    font-size: 1rem;
                    color: rgba(255,255,255,0.7);
                }
                .time-unit:hover { 
                    background: rgba(255,255,255,0.05); 
                    color: white;
                }
                .time-unit.selected {
                    background: var(--primary);
                    color: #000;
                    font-weight: 800;
                    border-radius: 6px;
                }
                
                .time-divider {
                    font-weight: bold;
                    font-size: 1.2rem;
                    padding-top: 35px;
                    color: var(--primary);
                }

                .time-footer {
                    margin-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 12px;
                }
                .confirm-time-btn {
                    width: 100%;
                    padding: 10px;
                    background: var(--primary);
                    border: none;
                    color: #000;
                    border-radius: 8px;
                    font-weight: 800;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                }
            `}</style>
        </div>
    );
};

export default CustomTimePicker;
