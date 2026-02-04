import { LaneType, PricingRules } from '../types';

// Tabela de preços por minuto (em R$)
// BOLICHE:
// Segunda a Quinta: até 18h R$1,40 | após 18h R$1,75
// Sexta e Véspera de Feriado: até 18h R$1,70 | após 18h R$2,00
// Sábado e Feriados: dia todo R$2,35
// Domingo: dia todo R$2,20

// SINUCA:
// Preço fixo: R$ 0,63 por minuto (baseado nos dados da imagem: 56min = R$35,47 ≈ R$0,63/min)

export const PRICING_TABLE: PricingRules = {
    BOL: {
        weekday: { before18h: 1.40, after18h: 1.75 },      // Seg-Qui
        friday: { before18h: 1.70, after18h: 2.00 },       // Sexta
        saturday: { allDay: 2.35 },                         // Sábado
        sunday: { allDay: 2.20 },                           // Domingo
    },
    SNK: {
        allDay: 0.63,  // Sinuca: preço fixo por minuto
    },
};

export const getPricePerMinute = (
    timestamp: number, 
    laneType: LaneType = 'BOL', 
    pricing: PricingRules = PRICING_TABLE,
    isHoliday: boolean = false
): number => {
    // Sinuca tem preço fixo
    if (laneType === 'SNK') {
        return pricing.SNK.allDay;
    }
    
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
    const hour = date.getHours();

    // Sábado e Feriados use as mesmas regras
    if (dayOfWeek === 6 || isHoliday) {
        return pricing.BOL.saturday.allDay;
    }
    
    // Domingo
    if (dayOfWeek === 0) {
        return pricing.BOL.sunday.allDay;
    }
    
    // Sexta-feira
    if (dayOfWeek === 5) {
        return hour < 18 ? pricing.BOL.friday.before18h : pricing.BOL.friday.after18h;
    }
    
    // Segunda a Quinta
    return hour < 18 ? pricing.BOL.weekday.before18h : pricing.BOL.weekday.after18h;
};

export const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace('.', ',');
};

export const toLocalDateISO = (msOrDate: number | Date) => {
    const d = new Date(msOrDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateTime = (ts: number): string => {
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const getDayLabel = (
    timestamp: number, 
    isHoliday: boolean = false
): string => {
    if (isHoliday) return 'Feriado';

    const date = new Date(timestamp);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = days[dayOfWeek];
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return dayName;
    }
    
    return `${dayName} ${hour < 18 ? '(até 18h)' : '(após 18h)'}`;
};

// Calcula valores de uma sessão
export const calculateSessionValues = (
    startTime: number,
    endTime: number,
    discountMinutes: number = 0,
    isBirthdayDiscount: boolean = false,
    laneType: LaneType = 'BOL',
    pricing: PricingRules = PRICING_TABLE,
    isHoliday: boolean = false
) => {
    const durationMs = endTime - startTime;
    const effectiveDurationMs = Math.max(0, durationMs - (discountMinutes * 60000));
    const durationMinutes = effectiveDurationMs / 60000;
    
    const pricePerMin = getPricePerMinute(startTime, laneType, pricing, isHoliday);
    let totalValue = durationMinutes * pricePerMin;
    
    let discountValue = 0;
    if (isBirthdayDiscount) {
        // Exemplo: 10% de desconto para aniversariante? Ou valor fixo?
        // Aqui assumimos que os discountMinutes já tratam a maior parte dos descontos
    }
    
    return {
        durationMinutes,
        totalValue,
        discountValue,
        finalValue: totalValue - discountValue
    };
};

// Dados do estabelecimento
export const STORE_INFO = {
    name: 'STRIKE BOLICHE BAR',
    address: 'AV PAULO GRACINDO 15-GAVEA',
    city: 'UBERLANDIA/MG - 38.411-145',
    cnpj: '53807873000177',
    phone: '(49)99900-4099',
    email: 'strikeshoppingfinanceiro@gmail.com',
};
