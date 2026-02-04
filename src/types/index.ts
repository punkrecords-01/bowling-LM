export type LaneStatus = 'free' | 'active' | 'reserved' | 'maintenance';
export type LaneType = 'BOL' | 'SNK'; // BOL = Boliche, SNK = Sinuca

export interface Lane {
    id: string;
    name: string;
    status: LaneStatus;
    type: LaneType; // Tipo da pista/mesa
    currentSessionId?: string;
    maintenanceReason?: string;
    isMaintenancePaused?: boolean;
    totalUsageTime: number; // cumulative milliseconds
    lastMaintenanceDate?: number;
}

export interface WaitingCustomer {
    id: string;
    name: string;
    lanesRequested: number;
    table?: string;
    comanda?: string;
    joinedAt: number;
    estimatedWaitTime: number; // minutes
}

export interface Reservation {
    id: string;
    laneId?: string;
    customerName: string;
    startTime: number; // timestamp
    endTime: number; // timestamp
    status: 'pending' | 'arrived' | 'delayed' | 'no-show' | 'cancelled' | 'fulfilled';
}

export interface Session {
    id: string;
    laneId: string;
    comanda: string;
    customerName?: string; // Nome do cliente
    openedBy: string; // Nome do funcionário que abriu
    openedById: string; // ID do funcionário
    startTime: number; // timestamp
    endTime?: number;
    pauseTimeTotal: number; // in milliseconds
    maintenanceTimeTotal: number; // in milliseconds
    lastMaintenanceStart?: number; // timestamp
    isActive: boolean;
    discountMinutes?: number;
    isBirthdayDiscount?: boolean;
    laneType?: LaneType; // Tipo quando a sessão foi aberta
}

export interface LogEntry {
    id: string;
    timestamp: number;
    userId: string;
    userName: string;
    action: string;
    context: string;
    laneId?: string;
    details?: any; // For full session data/receipts
}

export interface User {
    id: string;
    name: string;
    role: 'atendente' | 'caixa' | 'gerente';
    pin: string;
}

export interface PricingRules {
    BOL: {
        weekday: { before18h: number; after18h: number };
        friday: { before18h: number; after18h: number };
        saturday: { allDay: number };
        sunday: { allDay: number };
    };
    SNK: {
        allDay: number;
    };
}

export interface Holiday {
    date: string; // ISO YYYY-MM-DD
    name: string;
}

// Dados de sessão fechada para relatório
export interface ClosedSessionReport {
    id: string;
    laneId: string;
    laneName: string;
    laneType: LaneType;
    comanda: string;
    customerName?: string;
    startTime: number;
    endTime: number;
    durationMinutes: number;
    totalValue: number;
    discountValue: number;
    finalValue: number;
}
