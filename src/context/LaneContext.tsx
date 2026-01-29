import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lane, Session, LogEntry, LaneStatus, Reservation, WaitingCustomer } from '../types';
import { useAuth } from './AuthContext';

interface LaneContextType {
    lanes: Lane[];
    sessions: Session[];
    reservations: Reservation[];
    waitingList: WaitingCustomer[];
    logs: LogEntry[];
    openLane: (laneId: string, comanda: string) => void;
    closeLane: (laneId: string) => void;
    setMaintenance: (laneId: string, reason: string) => void;
    clearMaintenance: (laneId: string) => void;
    addReservation: (reservation: Omit<Reservation, 'id' | 'status'>) => void;
    cancelReservation: (id: string) => void;
    updateReservationStatus: (id: string, status: Reservation['status']) => void;
    convertReservationToLane: (resId: string, comanda: string, laneId?: string) => void;
    addToWaitingList: (name: string, lanesRequested: number, table?: string, comanda?: string) => void;
    removeFromWaitingList: (id: string) => void;
}

const LaneContext = createContext<LaneContextType | undefined>(undefined);

// Initial Mock Data - Exactly 10 lanes
const INITIAL_LANES: Lane[] = Array.from({ length: 10 }, (_, i) => {
    const id = `lane-${i + 1}`;
    let status: LaneStatus = 'free';

    return {
        id,
        name: `Pista ${String(i + 1).padStart(2, '0')}`,
        status,
        totalUsageTime: Math.random() * 36000000,
    };
});

export const LaneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lanes, setLanes] = useState<Lane[]>(() => {
        const saved = localStorage.getItem('boliche_lanes');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.length === 10) return parsed;
        }
        return INITIAL_LANES;
    });

    const [sessions, setSessions] = useState<Session[]>(() => {
        const saved = localStorage.getItem('boliche_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    const [reservations, setReservations] = useState<Reservation[]>(() => {
        const saved = localStorage.getItem('boliche_reservations');
        return saved ? JSON.parse(saved) : [];
    });

    const [waitingList, setWaitingList] = useState<WaitingCustomer[]>(() => {
        const saved = localStorage.getItem('boliche_waiting');
        return saved ? JSON.parse(saved) : [];
    });

    const [logs, setLogs] = useState<LogEntry[]>(() => {
        const saved = localStorage.getItem('boliche_logs');
        return saved ? JSON.parse(saved) : [];
    });

    const { user } = useAuth();

    const toLocalDateISO = (msOrDate: number | Date) => {
        const d = new Date(msOrDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Clean up stale 'reserved' lane statuses when reservations change (e.g., persisted state)
    useEffect(() => {
        setLanes(prev => prev.map(l => {
            if (l.status !== 'reserved') return l;
            const hasTodayReservation = reservations.some(r =>
                (r.status === 'pending' || r.status === 'arrived') &&
                r.laneId === l.id &&
                toLocalDateISO(r.startTime) === toLocalDateISO(Date.now())
            );
            return hasTodayReservation ? l : { ...l, status: 'free' };
        }));
    }, [reservations]);

    useEffect(() => {
        localStorage.setItem('boliche_lanes', JSON.stringify(lanes));
        localStorage.setItem('boliche_sessions', JSON.stringify(sessions));
        localStorage.setItem('boliche_reservations', JSON.stringify(reservations));
        localStorage.setItem('boliche_waiting', JSON.stringify(waitingList));
        localStorage.setItem('boliche_logs', JSON.stringify(logs));
    }, [lanes, sessions, reservations, waitingList, logs]);

    const addLog = (action: string, context: string, details?: any) => {
        const newLog: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            userId: user?.id || 'anonymous',
            userName: user?.name || 'Sistema',
            action,
            context,
            details,
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const openLane = (laneId: string, comanda: string) => {
        const newSession: Session = {
            id: crypto.randomUUID(),
            laneId,
            comanda,
            openedBy: user?.name || 'Sistema',
            openedById: user?.id || 'sistema',
            startTime: Date.now(),
            pauseTimeTotal: 0,
            maintenanceTimeTotal: 0,
            isActive: true,
        };

        setSessions(prev => [...prev, newSession]);
        setLanes(prev => prev.map(lane =>
            lane.id === laneId ? { ...lane, status: 'active', currentSessionId: newSession.id } : lane
        ));

        // Automatic removal from waiting list if comanda matches
        setWaitingList(prev => {
            const match = prev.find(item => item.comanda === comanda);
            if (match) {
                const contextDesc = `Cliente ${match.name} movido da Mesa ${match.table || 'N/A'} para Pista ${laneId} (#${comanda})`;
                addLog('Transição Fila -> Pista', contextDesc);
                return prev.filter(item => item.id !== match.id);
            }
            return prev;
        });

        addLog('Abrir Pista', `Pista ${laneId.split('-')[1].padStart(2, '0')}, Comanda #${comanda}`);
    };

    const closeLane = (laneId: string) => {
        const lane = lanes.find(l => l.id === laneId);
        const session = sessions.find(s => s.id === lane?.currentSessionId && s.isActive);
        if (!lane || !session) return;

        const now = Date.now();
        const duration = now - session.startTime;

        setSessions(prev => prev.map(s =>
            s.id === lane.currentSessionId ? { ...s, isActive: false, endTime: now } : s
        ));

        setLanes(prev => prev.map(l =>
            l.id === laneId ? {
                ...l,
                status: 'free',
                currentSessionId: undefined,
                totalUsageTime: (l.totalUsageTime || 0) + duration
            } : l
        ));

        addLog('Fechar Pista', `Pista ${laneId.split('-')[1].padStart(2, '0')}, Comanda #${session.comanda}`, {
            laneName: lane.name,
            comanda: session.comanda,
            startTime: session.startTime,
            endTime: now,
            duration: duration
        });
    };

    const setMaintenance = (laneId: string, reason: string) => {
        const now = Date.now();
        setLanes(prev => prev.map(lane => {
            if (lane.id !== laneId) return lane;
            
            const isCurrentlyActive = lane.status === 'active';
            
            if (isCurrentlyActive && lane.currentSessionId) {
                // Update session to record when maintenance pause started
                setSessions(sPrev => sPrev.map(s => 
                    s.id === lane.currentSessionId ? { ...s, lastMaintenanceStart: now } : s
                ));
            }

            return { 
                ...lane, 
                status: isCurrentlyActive ? 'active' : 'maintenance', 
                maintenanceReason: reason,
                isMaintenancePaused: isCurrentlyActive
            };
        }));
        
        addLog('Manutenção', `Pista: ${laneId}, Motivo: ${reason}`);
    };

    const clearMaintenance = (laneId: string) => {
        const now = Date.now();
        setLanes(prev => prev.map(lane => {
            if (lane.id !== laneId) return lane;

            const wasPaused = lane.isMaintenancePaused;
            const sid = lane.currentSessionId;

            if (wasPaused && sid) {
                setSessions(sPrev => sPrev.map(s => {
                    if (s.id === sid && s.lastMaintenanceStart) {
                        const pauseDuration = now - s.lastMaintenanceStart;
                        return { 
                            ...s, 
                            maintenanceTimeTotal: (s.maintenanceTimeTotal || 0) + pauseDuration,
                            lastMaintenanceStart: undefined
                        };
                    }
                    return s;
                }));
            }

            return { 
                ...lane, 
                status: wasPaused ? 'active' : 'free', 
                maintenanceReason: undefined,
                isMaintenancePaused: false 
            };
        }));
        addLog('Liberar Pista', `Pista: ${laneId}`);
    };

    const addReservation = (res: Omit<Reservation, 'id' | 'status'>) => {
        const newRes: Reservation = {
            ...res,
            id: crypto.randomUUID(),
            status: 'pending'
        };
        setReservations(prev => [...prev, newRes]);
        addLog('Nova Reserva', `Pista: ${res.laneId || 'Qualquer'}, Cliente: ${res.customerName}`);
    };

    const cancelReservation = (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
        addLog('Cancelar Reserva', `Reserva: ${id}`);
    };

    const updateReservationStatus = (id: string, status: Reservation['status']) => {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        addLog('Atualizar Reserva', `ID: ${id}, Status: ${status}`);
    };

    const convertReservationToLane = (resId: string, comanda: string, laneId?: string) => {
        const res = reservations.find(r => r.id === resId);
        if (!res) return;

        let effectiveLaneId = laneId || res.laneId;
        if (!effectiveLaneId) {
            // Pick first free lane
            const firstFree = lanes.find(l => l.status === 'free');
            if (firstFree) {
                effectiveLaneId = firstFree.id;
            }
        }

        if (!effectiveLaneId) {
            console.error("Nenhuma pista disponível para conversão");
            return;
        }

        openLane(effectiveLaneId, comanda);
        setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: 'fulfilled', laneId: effectiveLaneId } : r));
        addLog('Converter Reserva', `Reserva: ${resId} para Pista ${effectiveLaneId}, Comanda #${comanda}`);
    };

    const getAvgSessionTime = () => {
        const now = new Date();
        const finishedToday = sessions.filter(s => {
            if (s.isActive || !s.endTime) return false;
            const d = new Date(s.endTime);
            return d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
        });

        if (finishedToday.length === 0) return 60 * 60000; // 60 mins default
        const total = finishedToday.reduce((acc, s) => acc + (s.endTime! - s.startTime), 0);
        return total / finishedToday.length;
    };

    const updateWaitTimes = (currentList: WaitingCustomer[]) => {
        const now = Date.now();
        const avg = getAvgSessionTime();

        let availabilities = lanes.map(lane => {
            if (lane.status === 'active') {
                const session = sessions.find(s => s.laneId === lane.id && s.isActive);
                if (session) {
                    const elapsed = now - session.startTime;
                    return Math.max(0, avg - elapsed);
                }
            }
            if (lane.status === 'maintenance') return 24 * 60 * 60000; // Very high
            return 0; // Free
        });

        // Deep copy and sort by join time
        const sorted = [...currentList].sort((a, b) => a.joinedAt - b.joinedAt);

        sorted.forEach(item => {
            availabilities.sort((a, b) => a - b);
            const k = Math.min(item.lanesRequested || 1, availabilities.length);
            const waitTimeMs = availabilities[k - 1];
            item.estimatedWaitTime = Math.max(1, Math.round(waitTimeMs / 60000));

            // "Consume" the slots
            for (let i = 0; i < k; i++) {
                availabilities[i] += avg;
            }
        });

        return sorted;
    };

    const addToWaitingList = (name: string, lanesRequested: number, table?: string, comanda?: string) => {
        const newEntry: WaitingCustomer = {
            id: crypto.randomUUID(),
            name,
            lanesRequested,
            table,
            comanda,
            joinedAt: Date.now(),
            estimatedWaitTime: 0
        };

        setWaitingList(prev => updateWaitTimes([...prev, newEntry]));
        addLog('Fila de Espera', `Adicionado: ${name} (${lanesRequested} pistas)${table ? `, Mesa: ${table}` : ''}${comanda ? `, Comanda: ${comanda}` : ''}`);
    };

    // Recalculate when lanes change
    useEffect(() => {
        setWaitingList(prev => updateWaitTimes(prev));
    }, [lanes, sessions]);

    const removeFromWaitingList = (id: string) => {
        setWaitingList(prev => updateWaitTimes(prev.filter(c => c.id !== id)));
    };

    return (
        <LaneContext.Provider value={{
            lanes, sessions, reservations, waitingList, logs,
            openLane, closeLane, setMaintenance, clearMaintenance,
            addReservation, cancelReservation, updateReservationStatus, convertReservationToLane,
            addToWaitingList, removeFromWaitingList
        }}>
            {children}
        </LaneContext.Provider>
    );
};

export const useLanes = () => {
    const context = useContext(LaneContext);
    if (!context) throw new Error('useLanes must be used within LaneProvider');
    return context;
};
