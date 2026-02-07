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
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.1em;
                }
                .picker-trigger {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 0 1.25rem;
                    height: 56px;
                    cursor: text;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    color: white;
                }
                .picker-trigger:hover {
                    border-color: var(--border-strong);
                    background: var(--bg-card-hover);
                }
                .picker-trigger:focus-within {
                    border-color: var(--primary);
                    background: var(--bg-card-hover);
                    box-shadow: 0 0 0 1px var(--primary), 0 0 15px rgba(253, 224, 71, 0.2);
                }
                .picker-trigger.open {
                    border-color: var(--primary);
                }
                /* Reset total para o input interno não herdar estilos globais */
                input.picker-input-field {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: white !important;
                    font-family: inherit !important;
                    font-size: 1rem !important;
                    font-weight: 600 !important;
                    width: 100% !important;
                    height: 100% !important;
                    outline: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    letter-spacing: 1px !important;
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
                    background: #18181b; /* Zinc 900 sólido para evitar transparência excessiva */
                    border: 1px solid var(--border-strong);
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                    z-index: 1000;
                    padding: 16px;
                    backdrop-filter: blur(20px);
                }

                .time-dropdown {
                    min-width: 200px;
                    padding: 16px;
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
                    color: var(--text-muted);
                    margin-bottom: 8px;
                    font-weight: 800;
                }
                .column-scroll {
                    overflow-y: auto;
                    height: 100%;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: rgba(0,0,0,0.2);
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary) transparent;
                }
                .column-scroll::-webkit-scrollbar { width: 6px; }
                .column-scroll::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.2); 
                    border-radius: 8px; 
                }

                .time-unit {
                    padding: 10px 5px;
                    text-align: center;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.1s;
                    font-size: 0.95rem;
                    color: var(--text-muted);
                }
                .time-unit:hover { 
                    background: rgba(255,255,255,0.05); 
                    color: white;
                }
                .time-unit.selected {
                    background: var(--primary);
                    color: black;
                    font-weight: 800;
                    border-radius: 8px;
                }
                
                .time-divider {
                    font-weight: bold;
                    font-size: 1.2rem;
                    padding-top: 35px;
                    color: var(--primary);
                }

                .time-footer {
                    margin-top: 12px;
                    border-top: 1px solid var(--border-color);
                    padding-top: 12px;
                }
                .confirm-time-btn {
                    width: 100%;
                    padding: 12px;
                    background: var(--primary);
                    border: none;
                    color: black;
                    border-radius: 8px;
                    font-weight: 900;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                }
                .confirm-time-btn:hover {
                    box-shadow: 0 0 15px var(--primary-glow);
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
};

export default CustomTimePicker;
