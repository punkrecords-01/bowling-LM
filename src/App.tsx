import React from 'react';
import './App.css';
import { useLanes } from './context/LaneContext';
import Timer from './components/Timer';
import SummaryModal from './components/SummaryModal';
import { Lane, Session, LaneType } from './types';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CenterInsights from './components/CenterInsights';
import AgendaView from './components/AgendaView';
import WaitingListView from './components/WaitingListView';
import LaneMap from './components/LaneMap';
import AlertsSystem from './components/AlertsSystem';
import OpenLaneModal from './components/OpenLaneModal';
import ReceiptView from './components/ReceiptView';
import CheckInModal from './components/CheckInModal';
import MaintenanceModal from './components/MaintenanceModal';
import HistoryView from './components/HistoryView';
import UpcomingReservations from './components/UpcomingReservations';
import LaneDetailModal from './components/LaneDetailModal';
import ConsumptionReport from './components/ConsumptionReport';
import PricingConfigModal from './components/PricingConfigModal';
import { 
  CheckIcon, 
  WrenchIcon, 
  AlertTriangleIcon, 
  SettingsIcon,
  CalendarIcon 
} from './components/Icons';

function AppContent() {
  const { 
    lanes, 
    sessions, 
    reservations, 
    openLane, 
    closeLane, 
    setMaintenance, 
    clearMaintenance, 
    setReserved,
    clearReserved,
    convertReservationToLane 
  } = useLanes();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('lanes');
  const [closingLane, setClosingLane] = React.useState<{ lane: Lane, session: Session } | null>(null);
  const [openingLaneId, setOpeningLaneId] = React.useState<string | null>(null);
  const [detailLaneId, setDetailLaneId] = React.useState<string | null>(null);
  const [checkingInReservationId, setCheckingInReservationId] = React.useState<string | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = React.useState<{ laneId: string, laneName: string } | null>(null);
  const [showConsumptionReport, setShowConsumptionReport] = React.useState(false);
  const [showPricingConfig, setShowPricingConfig] = React.useState(false);
  const [printedReceipt, setPrintedReceipt] = React.useState<{ 
    laneName: string, 
    comanda: string, 
    startTime: number, 
    endTime: number, 
    discountMinutes?: number, 
    isBirthdayDiscount?: boolean,
    laneType?: LaneType,
    customerName?: string,
    receiptNumber?: number
  } | null>(null);

  const toLocalDateISO = (ms:number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  if (!user) return <LoginPage />;

  const getActiveSession = (laneId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    return sessions.find(s => s.id === lane?.currentSessionId && s.isActive);
  };

  const handleLaneAction = (laneId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    if (lane.status === 'active') {
      const session = getActiveSession(laneId);
      if (session) {
        setClosingLane({ lane, session });
      }
    } else {
      setOpeningLaneId(laneId);
    }
  };

  const confirmClose = (opts?: { discountMinutes?: number; isBirthdayDiscount?: boolean }) => {
    if (closingLane) {
      const { lane, session } = closingLane;
      const receiptNumber = closeLane(lane.id, opts);
      setClosingLane(null);
      setPrintedReceipt({
        laneName: lane.name,
        comanda: session.comanda,
        startTime: session.startTime,
        endTime: Date.now(),
        discountMinutes: opts?.discountMinutes ?? session.discountMinutes ?? 0,
        isBirthdayDiscount: opts?.isBirthdayDiscount ?? session.isBirthdayDiscount ?? false,
        laneType: lane.type,
        customerName: session.customerName,
        receiptNumber
      });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <div className="strike-logo">
            <span className="pins">🎳</span>
            <div className="strike-text">
              <span className="brand-main">STRIKE</span>
              <span className="brand-sub">BOLICHE BAR</span>
            </div>
          </div>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-item ${activeTab === 'lanes' ? 'active' : ''}`}
            onClick={() => setActiveTab('lanes')}
          >
            Pistas
          </button>
          <button
            className={`nav-item ${activeTab === 'reservas' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservas')}
          >
            Reservas
          </button>
          <button
            className={`nav-item ${activeTab === 'waiting' ? 'active' : ''}`}
            onClick={() => setActiveTab('waiting')}
          >
            Fila
          </button>
          <button
            className={`nav-item ${activeTab === 'mapa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapa')}
          >
            Mapa
          </button>
          <button
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Histórico
          </button>
        </nav>

        <AlertsSystem />

<div className="header-actions">
          <button 
            className="config-btn" 
            onClick={() => setShowPricingConfig(true)}
            title="Configurar Tarifas"
          >
            <SettingsIcon />
          </button>
          
          <div className="user-profile" onClick={logout} style={{ cursor: 'pointer' }} title="Clique para sair">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <div className="avatar">{user.name[0]}</div>
          </div>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'lanes' && (
          <section className="dashboard fade-in">
            <div className="dashboard-top-row">
              <CenterInsights />
              <UpcomingReservations onCheckIn={(id) => setCheckingInReservationId(id)} />
            </div>

            <div className="lane-grid">
              {lanes.map((lane) => {
                const session = getActiveSession(lane.id);

                // Find reservations within 10 minutes (only same local day)
                const nowMs = Date.now();
                const WINDOW_MS = 10 * 60000;

                // 1. Direct reservations for this lane
                const directRes = reservations
                  .filter(r => r.laneId === lane.id && (r.status === 'pending' || r.status === 'arrived'))
                  .sort((a, b) => a.startTime - b.startTime)[0];

                // 2. "Any lane" reservations that might claim this lane
                const unassignedRes = reservations
                  .filter(r => !r.laneId && (r.status === 'pending' || r.status === 'arrived'))
                  .sort((a, b) => a.startTime - b.startTime);

                // Find which free lanes are "taken" by unassigned reservations
                const freeLanes = lanes.filter(l => l.status === 'free');
                const myFreeIndex = freeLanes.findIndex(l => l.id === lane.id);
                const claimedByUnassigned = myFreeIndex !== -1 && unassignedRes[myFreeIndex];

                const nextRes = directRes || claimedByUnassigned;
                const isSameDay = nextRes && toLocalDateISO(nextRes.startTime) === toLocalDateISO(nowMs);
                const isReservedSoon = nextRes && isSameDay && (nextRes.startTime - nowMs < WINDOW_MS);

                const cardStatus = (lane.status === 'active' && lane.isMaintenancePaused) ? 'maintenance' : lane.status;

                return (
                  <div key={lane.id} className={`lane-card ${cardStatus} ${lane.isMaintenancePaused ? 'active-maintenance' : ''}`} onClick={() => setDetailLaneId(lane.id)} style={{ cursor: 'pointer' }}>
                    <div className="lane-header-top">
                      <div className="lane-badge-group">
                        <span className={`small-lane-label ${lane.type === 'SNK' ? 'snk-label' : ''}`}>
                          {lane.type === 'SNK' ? 'SNK' : lane.name.split(' ')[1]}
                        </span>
                      </div>
                      {lane.status === 'active' && session && (
                        <div className="lane-simple-time">
                          INÍCIO {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      )}
                    </div>

                    <div className="lane-body">
                      {lane.status === 'active' && session && !lane.isMaintenancePaused ? (
                        <div className="session-info">
                          <div className="comanda-display">
                            <span className="comanda-label">Comanda</span>
                            <span className="comanda-number">#{session.comanda}</span>
                          </div>
                          <div className="timer-wrapper">
                            <Timer 
                              startTime={session.startTime} 
                              pauseTimeTotal={session.maintenanceTimeTotal} 
                              isPaused={lane.isMaintenancePaused} 
                            />
                            {!lane.isMaintenancePaused && (
                              <span className="opened-by-mini">Op: {session.openedBy.split(' ')[0]}</span>
                            )}
                          </div>
                        </div>
                      ) : (lane.status === 'maintenance' || lane.isMaintenancePaused) ? (
                        <div className="maintenance-state-container">
                          <div className="maintenance-main-row">
                            <div className="maintenance-icon-wrapper">
                              <AlertTriangleIcon width={24} height={24} />
                            </div>
                            <div className="maintenance-content">
                              <span className="maintenance-title">EM MANUTENÇÃO</span>
                              <span className="maintenance-desc">
                                {lane.isMaintenancePaused ? "Tempo Pausado" : (lane.maintenanceReason || "Motivo não informado")}
                              </span>
                            </div>
                          </div>
                          {lane.isMaintenancePaused && lane.maintenanceReason && (
                            <div className="maintenance-reason-tag">
                              {lane.maintenanceReason}
                            </div>
                          )}
                          {lane.isMaintenancePaused && session && (
                            <div className="maintenance-session-overlay">
                              <div className="maintenance-session-info">
                                <span className="mini-comanda">#{session.comanda}</span>
                                <div className="mini-timer">
                                  <Timer 
                                    startTime={session.startTime} 
                                    pauseTimeTotal={session.maintenanceTimeTotal} 
                                    isPaused={true} 
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="free-state-container">
                          <span className="status-text">
                            {lane.status === 'reserved' ? 'Pista Reservada' : 'Disponível'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="lane-footer">
                      {lane.status === 'maintenance' || lane.isMaintenancePaused ? (
                        <button
                          className="lane-action-main maintenance-active"
                          onClick={(e) => { e.stopPropagation(); clearMaintenance(lane.id); }}
                        >
                          <CheckIcon width={16} height={16} style={{ marginRight: '6px' }} />
                          Liberar
                        </button>
                      ) : (
                        <>
                          <button
                            className={`lane-action-main ${lane.status === 'active' ? 'active' : (lane.status === 'reserved' ? 'reserved' : 'free')}`}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (lane.status === 'reserved') {
                                // Se for reserva manual, abre o modal de abertura (check-in manual)
                                setOpeningLaneId(lane.id);
                              } else {
                                handleLaneAction(lane.id);
                              }
                            }}
                          >
                            {lane.status === 'active' ? 'Finalizar' : (lane.status === 'reserved' ? 'Abrir Pista' : 'Abrir Pista')}
                          </button>

                          {lane.status === 'reserved' && (
                            <button
                              className="lane-action-tool"
                              title="Liberar Bloqueio"
                              style={{ color: 'var(--status-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={(e) => { e.stopPropagation(); clearReserved(lane.id); }}
                            >
                              &times;
                            </button>
                          )}

                          {lane.status === 'free' && (
                            <button
                              className="lane-action-tool"
                              title="Reservar Manual"
                              onClick={(e) => { e.stopPropagation(); setReserved(lane.id); }}
                            >
                              <CalendarIcon width={16} height={16} />
                            </button>
                          )}

                          <button
                            className="lane-action-tool"
                            title="Manutenção"
                            onClick={(e) => { e.stopPropagation(); setMaintenanceTarget({ laneId: lane.id, laneName: lane.name }); }}
                          >
                            <WrenchIcon width={16} height={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {lane.status === 'active' && session && (
                      <div className="lane-progress-indicator">
                        <div 
                          className="lane-progress-fill" 
                          style={{ 
                            width: `${Math.min(100, ((Date.now() - session.startTime - (session.maintenanceTimeTotal || 0)) / 3600000) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'agenda' && <AgendaView />}

        {activeTab === 'logs' && (
          <HistoryView />
        )}

        {activeTab === 'reservas' && (
          <AgendaView />
        )}

        {activeTab === 'waiting' && (
          <WaitingListView />
        )}

        {activeTab === 'mapa' && (
          <LaneMap onLaneClick={setDetailLaneId} />
        )}
      </main>

{showPricingConfig && (
          <PricingConfigModal onClose={() => setShowPricingConfig(false)} />
        )}

        {detailLaneId && (
        <LaneDetailModal
          laneId={detailLaneId}
          onClose={() => setDetailLaneId(null)}
          onOpen={(id) => setOpeningLaneId(id)}
        />
      )}

      {checkingInReservationId && reservations.find(r => r.id === checkingInReservationId) && (
        <CheckInModal
          reservation={reservations.find(r => r.id === checkingInReservationId)!}
          onCancel={() => setCheckingInReservationId(null)}
          onConfirm={(comanda, selectedLaneIds) => {
            convertReservationToLane(checkingInReservationId, comanda, selectedLaneIds);
            setCheckingInReservationId(null);
          }}
        />
      )}

      {openingLaneId && (
        <OpenLaneModal
          laneId={openingLaneId}
          onClose={() => setOpeningLaneId(null)}
          onConfirm={(comanda, reservationId) => {
            if (reservationId) {
              convertReservationToLane(reservationId, comanda, [openingLaneId]);
            } else {
              openLane(openingLaneId, comanda);
            }
            setOpeningLaneId(null);
          }}
        />
      )}

      {maintenanceTarget && (
        <MaintenanceModal
          laneName={maintenanceTarget.laneName}
          onCancel={() => setMaintenanceTarget(null)}
          onConfirm={(reason) => { setMaintenanceTarget(null); setMaintenance(maintenanceTarget.laneId, reason); }}
        />
      )}

      {printedReceipt && (
        <ReceiptView
          laneName={printedReceipt.laneName}
          comanda={printedReceipt.comanda}
          startTime={printedReceipt.startTime}
          endTime={printedReceipt.endTime}
          discountMinutes={printedReceipt.discountMinutes}
          isBirthdayDiscount={printedReceipt.isBirthdayDiscount}
          laneType={printedReceipt.laneType}
          customerName={printedReceipt.customerName}
          receiptNumber={printedReceipt.receiptNumber}
          onClose={() => setPrintedReceipt(null)}
        />
      )}

      {closingLane && (
        <SummaryModal
          laneName={closingLane.lane.name}
          comanda={closingLane.session.comanda}
          startTime={closingLane.session.startTime}
          endTime={Date.now()}
          laneType={closingLane.lane.type}
          customerName={closingLane.session.customerName}
          onConfirmed={confirmClose}
          onFinish={() => setClosingLane(null)}
        />
      )}

      {showConsumptionReport && (
        <ConsumptionReport onClose={() => setShowConsumptionReport(false)} />
      )}
    </div>
  );
}

function App() {
  return <AppContent />;
}


export default App;
