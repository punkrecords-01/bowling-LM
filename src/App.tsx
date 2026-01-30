import React from 'react';
import './App.css';
import { useLanes } from './context/LaneContext';
import Timer from './components/Timer';
import SummaryModal from './components/SummaryModal';
import { Lane, Session, Reservation } from './types';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CenterInsights from './components/CenterInsights';
import AgendaView from './components/AgendaView';
import WaitingListView from './components/WaitingListView';
import LaneMap from './components/LaneMap';
import AlertsSystem from './components/AlertsSystem';
import OpenLaneModal from './components/OpenLaneModal';
import ReceiptView from './components/ReceiptView';
import OpenConfirmationModal from './components/OpenConfirmationModal';
import CheckInModal from './components/CheckInModal';
import MaintenanceModal from './components/MaintenanceModal';
import HistoryView from './components/HistoryView';
import UpcomingReservations from './components/UpcomingReservations';
import LaneDetailModal from './components/LaneDetailModal';
import { SettingsIcon, CheckIcon, WrenchIcon, AlertTriangleIcon } from './components/Icons';

function AppContent() {
  const { lanes, sessions, reservations, openLane, closeLane, setMaintenance, clearMaintenance, convertReservationToLane } = useLanes();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('lanes');
  const [closingLane, setClosingLane] = React.useState<{ lane: Lane, session: Session } | null>(null);
  const [openingLaneId, setOpeningLaneId] = React.useState<string | null>(null);
  const [detailLaneId, setDetailLaneId] = React.useState<string | null>(null);
  const [checkingInReservationId, setCheckingInReservationId] = React.useState<string | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = React.useState<{ laneId: string, laneName: string } | null>(null);
  const [printedReceipt, setPrintedReceipt] = React.useState<{ laneName: string, comanda: string, startTime: number, endTime: number } | null>(null);

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

  const confirmClose = () => {
    if (closingLane) {
      const { lane, session } = closingLane;
      closeLane(lane.id);
      setClosingLane(null);
      setPrintedReceipt({
        laneName: lane.name,
        comanda: session.comanda,
        startTime: session.startTime,
        endTime: Date.now()
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

        <div className="user-profile" onClick={logout} style={{ cursor: 'pointer' }} title="Clique para sair">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="avatar">{user.name[0]}</div>
        </div>
      </header>

      <AlertsSystem />

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

                // If lane was previously marked 'reserved' but there's no actual reservation today, treat as free
                let effectiveStatus = lane.status;
                if (lane.status === 'reserved') {
                  const hasDirectToday = !!directRes && toLocalDateISO(directRes.startTime) === toLocalDateISO(nowMs);
                  effectiveStatus = hasDirectToday ? 'reserved' : 'free';
                }
                if (lane.status === 'free' && isReservedSoon) effectiveStatus = 'reserved';

                const isPaused = lane.status === 'active' && lane.isMaintenancePaused;

                return (
                  <div key={lane.id} className={`lane-card ${effectiveStatus} ${isPaused ? 'paused' : ''}`} onClick={() => setDetailLaneId(lane.id)} style={{ cursor: 'pointer' }}>
                    <div className="lane-header-top">
                      <div className="lane-badge-group">
                        <span className="small-lane-label">{lane.name.split(' ')[1]}</span>
                        {isPaused && (
                          <div className="paused-state-badge">
                            <WrenchIcon width={10} height={10} />
                            <span>PAUSADA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lane-body">
                      {lane.status === 'active' && session ? (
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
                      ) : lane.status === 'maintenance' ? (
                        <div className="maintenance-state-container">
                          <div className="maintenance-icon-wrapper">
                            <AlertTriangleIcon width={32} height={32} />
                          </div>
                          <div className="maintenance-content">
                            <span className="maintenance-title">EM MANUTENÇÃO</span>
                            <span className="maintenance-desc">{lane.maintenanceReason}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="free-state-container">
                          <span className="status-text">
                            {effectiveStatus === 'reserved' ? 'Pista Reservada' : 'Disponível'}
                          </span>
                          {nextRes && effectiveStatus === 'reserved' && (
                            <span className="next-res-hint">
                              {new Date(nextRes.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
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
                            className={`lane-action-main ${lane.status === 'active' ? 'active' : 'free'}`}
                            onClick={(e) => { e.stopPropagation(); handleLaneAction(lane.id); }}
                          >
                            {lane.status === 'active' ? 'Finalizar' : 'Abrir Pista'}
                          </button>

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
          <LaneMap onLaneClick={handleLaneAction} />
        )}
      </main>

      {detailLaneId && (
        <LaneDetailModal
          laneId={detailLaneId}
          onClose={() => setDetailLaneId(null)}
        />
      )}

      {checkingInReservationId && (
        <CheckInModal
          reservation={reservations.find(r => r.id === checkingInReservationId)!}
          onCancel={() => setCheckingInReservationId(null)}
          onConfirm={(comanda, selectedLaneId) => {
            convertReservationToLane(checkingInReservationId, comanda, selectedLaneId);
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
              convertReservationToLane(reservationId, comanda, openingLaneId);
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
          onClose={() => setPrintedReceipt(null)}
        />
      )}

      {closingLane && (
        <SummaryModal
          laneName={closingLane.lane.name}
          comanda={closingLane.session.comanda}
          startTime={closingLane.session.startTime}
          endTime={Date.now()}
          onConfirmed={confirmClose}
          onFinish={() => setClosingLane(null)}
        />
      )}
    </div>
  );
}

function App() {
  return <AppContent />;
}


export default App;
