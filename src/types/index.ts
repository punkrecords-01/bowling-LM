export type LaneStatus = 'free' | 'active' | 'reserved' | 'maintenance';

export interface Lane {
    id: string;
    name: string;
    status: LaneStatus;
    currentSessionId?: string;
    maintenanceReason?: string;
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
    openedBy: string; // Nome do funcionário que abriu
    openedById: string; // ID do funcionário
    startTime: number; // timestamp
    endTime?: number;
    pauseTimeTotal: number; // in milliseconds
    maintenanceTimeTotal: number; // in milliseconds
    isActive: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: number;
    userId: string;
    userName: string;
    action: string;
    context: string;
    details?: any; // For full session data/receipts
}

export interface User {
    id: string;
    name: string;
    role: 'atendente' | 'caixa' | 'gerente';
    pin: string;
}
