import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lane, Session, LogEntry, LaneStatus, Reservation, WaitingCustomer, LaneType } from '../types';
import { useAuth } from './AuthContext';
import { toLocalDateISO } from '../utils/pricing';

interface LaneContextType {
    lanes: Lane[];
    sessions: Session[];
    reservations: Reservation[];
    waitingList: WaitingCustomer[];
    logs: LogEntry[];
    receiptCounter: number;
    openLane: (laneId: string, comanda: string, customerName?: string) => void;
    closeLane: (laneId: string, opts?: { discountMinutes?: number; isBirthdayDiscount?: boolean }) => number; // returns receipt number
    updateSession: (sessionId: string, updates: Partial<Session>) => void;
    setMaintenance: (laneId: string, reason: string) => void;
    clearMaintenance: (laneId: string) => void;
    setReserved: (laneId: string) => void;
    clearReserved: (laneId: string) => void;
    addReservation: (reservation: Omit<Reservation, 'id' | 'status'>) => void;
    editReservation: (id: string, updates: Partial<Reservation>) => void;
    cancelReservation: (id: string) => void;
    updateReservationStatus: (id: string, status: Reservation['status']) => void;
    convertReservationToLane: (resId: string, comanda: string, laneIds: string[]) => void;
    addToWaitingList: (name: string, lanesRequested: number, table?: string, comanda?: string, placa?: string) => void;
    removeFromWaitingList: (id: string) => void;
    transferLane: (fromLaneId: string, toLaneId: string) => void;
    getNextReceiptNumber: () => number;
}

const LaneContext = createContext<LaneContextType | undefined>(undefined);

// Initial Mock Data - 10 Pistas de Boliche + 1 Mesa de Sinuca
const INITIAL_LANES: Lane[] = [
    // 10 Pistas de Boliche
    ...Array.from({ length: 10 }, (_, i) => ({
        id: `lane-${i + 1}`,
        name: `Pista ${String(i + 1).padStart(2, '0')}`,
        status: 'free' as LaneStatus,
        type: 'BOL' as LaneType,
        totalUsageTime: Math.random() * 36000000,
    })),
    // 1 Mesa de Sinuca
    {
        id: 'snk-1',
        name: 'Sinuca 01',
        status: 'free' as LaneStatus,
        type: 'SNK' as LaneType,
        totalUsageTime: Math.random() * 18000000,
    },
];

export const LaneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lanes, setLanes] = useState<Lane[]>(() => {
        const saved = localStorage.getItem('boliche_lanes');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Check if we have the new structure with 1 SNK lane
            if (parsed.length === 11 && parsed.some((l: Lane) => l.type === 'SNK')) return parsed;
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

    const [receiptCounter, setReceiptCounter] = useState<number>(() => {
        const saved = localStorage.getItem('boliche_receipt_counter');
        return saved ? parseInt(saved, 10) : 18735; // Starting from the number in the image
    });

    const { user } = useAuth();

    // Reset any 'reserved' status to 'free' globally - as requested to remove automatic reservation system
    useEffect(() => {
        setLanes(prev => {
            const hasReserved = prev.some(l => l.status === 'reserved');
            if (hasReserved) {
                return prev.map(l => l.status === 'reserved' ? { ...l, status: 'free' } : l);
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('boliche_lanes', JSON.stringify(lanes));
        localStorage.setItem('boliche_sessions', JSON.stringify(sessions));
        localStorage.setItem('boliche_reservations', JSON.stringify(reservations));
        localStorage.setItem('boliche_waiting', JSON.stringify(waitingList));
        localStorage.setItem('boliche_logs', JSON.stringify(logs));
        localStorage.setItem('boliche_receipt_counter', receiptCounter.toString());
    }, [lanes, sessions, reservations, waitingList, logs, receiptCounter]);

    const getNextReceiptNumber = () => {
        const next = receiptCounter + 1;
        setReceiptCounter(next);
        return next;
    };

    const addLog = (action: string, context: string, details?: any, laneId?: string) => {
        const newLog: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            userId: user?.id || 'anonymous',
            userName: user?.name || 'Sistema',
            action,
            context,
            laneId,
            details,
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const openLane = (laneId: string, comanda: string, customerName?: string) => {
        const lane = lanes.find(l => l.id === laneId);
        const newSession: Session = {
            id: crypto.randomUUID(),
            laneId,
            comanda,
            customerName: customerName || '',
            openedBy: user?.name || 'Sistema',
            openedById: user?.id || 'sistema',
            startTime: Date.now(),
            pauseTimeTotal: 0,
            maintenanceTimeTotal: 0,
            isActive: true,
            laneType: lane?.type || 'BOL',
        };

        setSessions(prev => [...prev, newSession]);
        setLanes(prev => prev.map(l =>
            l.id === laneId ? { ...l, status: 'active', currentSessionId: newSession.id } : l
        ));

        // Automatic removal from waiting list if comanda matches
        setWaitingList(prev => {
            const matchIndex = prev.findIndex(item => item.comanda === comanda);
            if (matchIndex !== -1) {
                const match = prev[matchIndex];
                const friendlyLane = laneId.startsWith('snk') ? `Sinuca ${laneId.split('-')[1].padStart(2, '0')}` : `Pista ${laneId.split('-')[1].padStart(2, '0')}`;
                const contextDesc = `Cliente ${match.name} movido da Mesa ${match.table || 'N/A'} para ${friendlyLane} (#${comanda})`;
                
                addLog('Transição Fila -> Pista', contextDesc, undefined, laneId);

                if (match.lanesRequested > 1) {
                    // Reduce lanes requested but keep in list
                    const newList = [...prev];
                    newList[matchIndex] = { ...match, lanesRequested: match.lanesRequested - 1 };
                    return newList;
                } else {
                    // Remove if it was the last lane requested
                    return prev.filter(item => item.id !== match.id);
                }
            }
            return prev;
        });

        addLog('Abrir Pista', `Pista ${laneId.split('-')[1].padStart(2, '0')}, Comanda #${comanda}`, undefined, laneId);
    };

    const closeLane = (laneId: string, opts?: { discountMinutes?: number; isBirthdayDiscount?: boolean }): number => {
        const lane = lanes.find(l => l.id === laneId);
        const session = sessions.find(s => s.id === lane?.currentSessionId && s.isActive);
        if (!lane || !session) return receiptCounter;

        const now = Date.now();
        const duration = now - session.startTime;

        const finalDiscountMinutes = opts?.discountMinutes ?? session.discountMinutes ?? 0;
        const finalIsBirthday = opts?.isBirthdayDiscount ?? session.isBirthdayDiscount ?? false;
        
        // Get next receipt number
        const newReceiptNumber = receiptCounter + 1;
        setReceiptCounter(newReceiptNumber);

        setSessions(prev => prev.map(s =>
            s.id === lane.currentSessionId ? { ...s, isActive: false, endTime: now, discountMinutes: finalDiscountMinutes, isBirthdayDiscount: finalIsBirthday } : s
        ));

        setLanes(prev => prev.map(l =>
            l.id === laneId ? {
                ...l,
                status: 'free',
                currentSessionId: undefined,
                totalUsageTime: (l.totalUsageTime || 0) + duration
            } : l
        ));

        const laneLabel = lane.type === 'SNK' ? `Sinuca ${laneId.split('-')[1].padStart(2, '0')}` : `Pista ${laneId.split('-')[1].padStart(2, '0')}`;
        
        addLog('Fechar Pista', `${laneLabel}, Comanda #${session.comanda}`, {
            laneName: lane.name,
            laneType: lane.type,
            comanda: session.comanda,
            customerName: session.customerName,
            startTime: session.startTime,
            endTime: now,
            duration: duration,
            discountMinutes: finalDiscountMinutes,
            isBirthdayDiscount: finalIsBirthday,
            receiptNumber: newReceiptNumber,
        }, laneId);
        
        return newReceiptNumber;
    };

    const updateSession = (sessionId: string, updates: Partial<Session>) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
        const session = sessions.find(s => s.id === sessionId);
        
        // Log only if startTime was updated (manual adjustment)
        if (session && updates.startTime) {
            const oldTimeStr = new Date(session.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const newTimeStr = new Date(updates.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            addLog(
                'Ajustar Horário', 
                `Pista ${session.laneId.split('-')[1]}, de ${oldTimeStr} para ${newTimeStr}`, 
                updates, 
                session.laneId
            );
        }
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
        
        addLog('Manutenção', `Pista: ${laneId}, Motivo: ${reason}`, undefined, laneId);
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
        addLog('Liberar Pista', `Pista: ${laneId}`, undefined, laneId);
    };

    const setReserved = (laneId: string) => {
        setLanes(prev => prev.map(l => l.id === laneId ? { ...l, status: 'reserved' } : l));
        const lane = lanes.find(l => l.id === laneId);
        addLog('Bloqueio Manual', `Pista: ${lane?.name || laneId} marcada como Reservada (Manual)`, undefined, laneId);
    };

    const clearReserved = (laneId: string) => {
        setLanes(prev => prev.map(l => l.id === laneId ? { ...l, status: 'free' } : l));
        const lane = lanes.find(l => l.id === laneId);
        addLog('Liberar Pista', `Pista: ${lane?.name || laneId} desbloqueada (Manual)`, undefined, laneId);
    };

    const transferLane = (fromLaneId: string, toLaneId: string) => {
        const fromLane = lanes.find(l => l.id === fromLaneId);
        const toLane = lanes.find(l => l.id === toLaneId);
        
        if (!fromLane || !toLane || !fromLane.currentSessionId) {
            console.error("Transfer error: Source or desk not found", { fromLaneId, toLaneId });
            return;
        }

        const sessionId = fromLane.currentSessionId;

        // 1. Update Session
        setSessions(prev => prev.map(s => 
            s.id === sessionId ? { ...s, laneId: toLaneId, laneType: toLane.type } : s
        ));

        // 2. Update Lanes
        setLanes(prev => prev.map(l => {
            if (l.id === fromLaneId) {
                return { ...l, status: 'free', currentSessionId: undefined };
            }
            if (l.id === toLaneId) {
                return { ...l, status: 'active', currentSessionId: sessionId };
            }
            return l;
        }));

        // 3. Log
        const fromLabel = fromLane.name;
        const toLabel = toLane.name;
        addLog('Transferir Pista', `De ${fromLabel} para ${toLabel}`, undefined, toLaneId);
    };

    const addReservation = (res: Omit<Reservation, 'id' | 'status'>) => {
        const newRes: Reservation = {
            ...res,
            id: crypto.randomUUID(),
            status: 'pending'
        };
        setReservations(prev => [...prev, newRes]);
        const details = res.observation ? ` | Obs: ${res.observation}` : '';
        const laneDesc = res.laneId 
            ? (res.laneId.startsWith('snk') ? `Sinuca ${res.laneId.split('-')[1].padStart(2, '0')}` : `Pista ${res.laneId.split('-')[1].padStart(2, '0')}`) 
            : `${res.lanesRequested || 1} pistas`;
        addLog('Nova Reserva', `${laneDesc}, Cliente: ${res.customerName}${details}`, undefined, res.laneId);
    };

    const editReservation = (id: string, updates: Partial<Reservation>) => {
        const res = reservations.find(r => r.id === id);
        setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        addLog('Editar Reserva', `Cliente: ${res?.customerName || id}`, updates);
    };

    const cancelReservation = (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (!res) return;
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
        addLog('Cancelar Reserva', `Cliente: ${res.customerName}`);
    };

    const updateReservationStatus = (id: string, status: Reservation['status']) => {
        const res = reservations.find(r => r.id === id);
        const statusMap: Record<string, string> = {
            'pending': 'Pendente',
            'arrived': 'Chegou',
            'delayed': 'Atrasada',
            'no-show': 'Não Compareceu',
            'cancelled': 'Cancelada',
            'fulfilled': 'Concluída'
        };
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        addLog('Atualizar Reserva', `Cliente: ${res?.customerName || id}, Status: ${statusMap[status] || status}`);
    };

    const convertReservationToLane = (resId: string, comanda: string, laneIds: string[]) => {
        const res = reservations.find(r => r.id === resId);
        if (!res || laneIds.length === 0) return;

        laneIds.forEach(laneId => {
            openLane(laneId, comanda, res.customerName);
        });

        setReservations(prev => prev.map(r => r.id === resId ? { 
            ...r, 
            status: 'fulfilled', 
            laneIds: laneIds,
            laneId: laneIds[0] // For backward compatibility
        } : r));
        
        const friendlyLanes = laneIds.map(id => id.startsWith('snk') ? `Sinuca ${id.split('-')[1].padStart(2, '0')}` : `Pista ${id.split('-')[1].padStart(2, '0')}`).join(', ');
        addLog('Converter Reserva', `Cliente: ${res.customerName} -> ${friendlyLanes}, Comanda #${comanda}`);
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

    const addToWaitingList = (name: string, lanesRequested: number, table?: string, comanda?: string, placa?: string) => {
        const newEntry: WaitingCustomer = {
            id: crypto.randomUUID(),
            name,
            lanesRequested,
            table,
            comanda,
            placa,
            joinedAt: Date.now(),
            estimatedWaitTime: 0
        };

        setWaitingList(prev => updateWaitTimes([...prev, newEntry]));
        addLog('Fila de Espera', `Adicionado: ${name} (${lanesRequested} pistas)${table ? `, Mesa: ${table}` : ''}${comanda ? `, Comanda: ${comanda}` : ''}${placa ? `, Placa: ${placa}` : ''}`);
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
            lanes, sessions, reservations, waitingList, logs, receiptCounter,
            openLane, closeLane, updateSession, setMaintenance, clearMaintenance,
            setReserved, clearReserved,
            addReservation, editReservation, cancelReservation, updateReservationStatus, convertReservationToLane,
            addToWaitingList, removeFromWaitingList, transferLane, getNextReceiptNumber
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
