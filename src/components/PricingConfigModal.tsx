import React, { useState, useEffect } from 'react';
import { useLaneSettings } from '../context/LaneSettingsContext';
import { PricingRules } from '../types';
import './Modal.css';
import './PricingConfigModal.css';

interface PricingConfigModalProps {
    onClose: () => void;
}

const PricingConfigModal: React.FC<PricingConfigModalProps> = ({ onClose }) => {
    const { pricing, holidays, updatePricing, addHoliday, removeHoliday } = useLaneSettings();
    const [activeTab, setActiveTab] = useState<'BOL' | 'SNK' | 'HOL'>('BOL');
    const [viewMode, setViewMode] = useState<'min' | 'hour'>('min');
    
    // Help format price for initial display
    const formatForInput = (minPrice: number) => {
        const val = viewMode === 'hour' ? minPrice * 60 : minPrice;
        return val.toFixed(2).replace('.', ',');
    };

    // State for the string values in inputs to allow natural typing
    const [inputValues, setInputValues] = useState({
        bol_weekday_before: formatForInput(pricing.BOL.weekday.before18h),
        bol_weekday_after: formatForInput(pricing.BOL.weekday.after18h),
        bol_friday_before: formatForInput(pricing.BOL.friday.before18h),
        bol_friday_after: formatForInput(pricing.BOL.friday.after18h),
        bol_saturday: formatForInput(pricing.BOL.saturday.allDay),
        bol_sunday: formatForInput(pricing.BOL.sunday.allDay),
        snk_all: formatForInput(pricing.SNK.allDay),
    });

    // Update input strings when view mode or pricing changes
    useEffect(() => {
        setInputValues({
            bol_weekday_before: formatForInput(pricing.BOL.weekday.before18h),
            bol_weekday_after: formatForInput(pricing.BOL.weekday.after18h),
            bol_friday_before: formatForInput(pricing.BOL.friday.before18h),
            bol_friday_after: formatForInput(pricing.BOL.friday.after18h),
            bol_saturday: formatForInput(pricing.BOL.saturday.allDay),
            bol_sunday: formatForInput(pricing.BOL.sunday.allDay),
            snk_all: formatForInput(pricing.SNK.allDay),
        });
    }, [viewMode, pricing]);

    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    const handleInputChange = (key: keyof typeof inputValues, val: string) => {
        // Allow typing numbers and comma/dot
        const sanitized = val.replace(/[^0-9.,]/g, '');
        setInputValues(prev => ({ ...prev, [key]: sanitized }));
    };

    const handleSave = () => {
        const parse = (val: string) => {
            const num = parseFloat(val.replace(',', '.'));
            if (isNaN(num)) return 0;
            return viewMode === 'hour' ? num / 60 : num;
        };

        const newPricing: PricingRules = {
            BOL: {
                weekday: { 
                    before18h: parse(inputValues.bol_weekday_before), 
                    after18h: parse(inputValues.bol_weekday_after) 
                },
                friday: { 
                    before18h: parse(inputValues.bol_friday_before), 
                    after18h: parse(inputValues.bol_friday_after) 
                },
                saturday: { allDay: parse(inputValues.bol_saturday) },
                sunday: { allDay: parse(inputValues.bol_sunday) },
            },
            SNK: {
                allDay: parse(inputValues.snk_all),
            },
        };

        updatePricing(newPricing);
        onClose();
    };

    const handleAddHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHolidayDate && newHolidayName) {
            addHoliday(newHolidayDate, newHolidayName);
            setNewHolidayDate('');
            setNewHolidayName('');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content pricing-config-modal fade-in">
                <header className="modal-header">
                    <div className="header-title-toggle">
                        <h3>Configuração de Tarifas</h3>
                        <div className="view-mode-toggle">
                            <button 
                                className={viewMode === 'min' ? 'active' : ''} 
                                onClick={() => setViewMode('min')}
                            >
                                / min
                            </button>
                            <button 
                                className={viewMode === 'hour' ? 'active' : ''} 
                                onClick={() => setViewMode('hour')}
                            >
                                / hora
                            </button>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>
                
                <div className="modal-body">
                    <div className="pricing-tabs">
                        <button 
                            className={activeTab === 'BOL' ? 'active' : ''} 
                            onClick={() => setActiveTab('BOL')}
                        >
                            BOLICHE
                        </button>
                        <button 
                            className={activeTab === 'SNK' ? 'active' : ''} 
                            onClick={() => setActiveTab('SNK')}
                        >
                            SINUCA
                        </button>
                        <button 
                            className={activeTab === 'HOL' ? 'active' : ''} 
                            onClick={() => setActiveTab('HOL')}
                        >
                            CALENDÁRIO
                        </button>
                    </div>

                    {activeTab === 'BOL' && (
                        <div className="pricing-grid">
                            <div className="pricing-section">
                                <h4>Segunda a Quinta</h4>
                                <div className="price-item">
                                    <label>Até 18:00</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_weekday_before} 
                                            onChange={(e) => handleInputChange('bol_weekday_before', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="price-item">
                                    <label>Após 18:00</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_weekday_after} 
                                            onChange={(e) => handleInputChange('bol_weekday_after', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pricing-section">
                                <h4>Sexta e Vésperas</h4>
                                <div className="price-item">
                                    <label>Até 18:00</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_friday_before} 
                                            onChange={(e) => handleInputChange('bol_friday_before', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="price-item">
                                    <label>Após 18:00</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_friday_after} 
                                            onChange={(e) => handleInputChange('bol_friday_after', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pricing-section">
                                <h4>Sábado e Feriados</h4>
                                <div className="price-item">
                                    <label>Dia Todo</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_saturday} 
                                            onChange={(e) => handleInputChange('bol_saturday', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pricing-section">
                                <h4>Domingo</h4>
                                <div className="price-item">
                                    <label>Dia Todo</label>
                                    <div className="price-input-group">
                                        <span>R$</span>
                                        <input 
                                            type="text" 
                                            value={inputValues.bol_sunday} 
                                            onChange={(e) => handleInputChange('bol_sunday', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SNK' && (
                        <div className="pricing-section" style={{ maxWidth: '300px', margin: '0 auto' }}>
                            <h4>Mesa de Sinuca</h4>
                            <div className="price-item">
                                <label>Preço por {viewMode === 'min' ? 'Minuto' : 'Hora'}</label>
                                <div className="price-input-group">
                                    <span>R$</span>
                                    <input 
                                        type="text" 
                                        value={inputValues.snk_all} 
                                        onChange={(e) => handleInputChange('snk_all', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'HOL' && (
                        <div className="holiday-config">
                            <form className="add-holiday-form" onSubmit={handleAddHoliday}>
                                <input 
                                    type="date" 
                                    value={newHolidayDate} 
                                    onChange={e => setNewHolidayDate(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Nome do Feriado" 
                                    value={newHolidayName} 
                                    onChange={e => setNewHolidayName(e.target.value)}
                                    required
                                />
                                <button type="submit" className="primary-btn">Add</button>
                            </form>
                            <div className="holiday-list">
                                {holidays.map(h => (
                                    <div key={h.date} className="holiday-item">
                                        <span>{h.date.split('-').reverse().join('/')} - {h.name}</span>
                                        <button onClick={() => removeHoliday(h.date)}>&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pricing-help">
                        <p><strong>Dica:</strong> Os valores são aplicados automaticamente com base no horário de <strong>abertura</strong> da pista. Feriados cadastrados no calendário usam automaticamente a tarifa de Sábado.</p>
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button className="primary-btn" onClick={handleSave}>Salvar Alterações</button>
                </footer>
            </div>
        </div>
    );
};

export default PricingConfigModal;
