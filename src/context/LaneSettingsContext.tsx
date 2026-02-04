import React, { createContext, useContext, useState, useEffect } from 'react';
import { PricingRules, Holiday } from '../types';
import { PRICING_TABLE } from '../utils/pricing';

interface LaneSettingsContextType {
    pricing: PricingRules;
    holidays: Holiday[];
    updatePricing: (newPricing: PricingRules) => void;
    addHoliday: (date: string, name: string) => void;
    removeHoliday: (date: string) => void;
    isHoliday: (dateStr: string) => boolean;
}

const LaneSettingsContext = createContext<LaneSettingsContextType | undefined>(undefined);

export const LaneSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pricing, setPricing] = useState<PricingRules>(() => {
        const saved = localStorage.getItem('strike_pricing');
        return saved ? JSON.parse(saved) : PRICING_TABLE;
    });

    const [holidays, setHolidays] = useState<Holiday[]>(() => {
        const saved = localStorage.getItem('strike_holidays');
        return saved ? JSON.parse(saved) : [
            { date: '2026-01-01', name: 'Confraternização Universal' },
            { date: '2026-02-17', name: 'Carnaval' },
            { date: '2026-04-03', name: 'Sexta-feira Santa' },
            { date: '2026-04-21', name: 'Tiradentes' },
            { date: '2026-05-01', name: 'Dia do Trabalho' },
            { date: '2026-09-07', name: 'Independência do Brasil' },
            { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
            { date: '2026-11-02', name: 'Finados' },
            { date: '2026-11-15', name: 'Proclamação da República' },
            { date: '2026-12-25', name: 'Natal' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('strike_pricing', JSON.stringify(pricing));
    }, [pricing]);

    useEffect(() => {
        localStorage.setItem('strike_holidays', JSON.stringify(holidays));
    }, [holidays]);

    const updatePricing = (newPricing: PricingRules) => {
        setPricing(newPricing);
    };

    const addHoliday = (date: string, name: string) => {
        if (!holidays.find(h => h.date === date)) {
            setHolidays([...holidays, { date, name }].sort((a,b) => a.date.localeCompare(b.date)));
        }
    };

    const removeHoliday = (date: string) => {
        setHolidays(holidays.filter(h => h.date !== date));
    };

    const isHoliday = (dateStr: string) => {
        return holidays.some(h => h.date === dateStr);
    };

    return (
        <LaneSettingsContext.Provider value={{ pricing, holidays, updatePricing, addHoliday, removeHoliday, isHoliday }}>
            {children}
        </LaneSettingsContext.Provider>
    );
};

export const useLaneSettings = () => {
    const context = useContext(LaneSettingsContext);
    if (!context) {
        throw new Error('useLaneSettings must be used within a LaneSettingsProvider');
    }
    return context;
};
