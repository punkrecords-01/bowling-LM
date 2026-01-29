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
import ComandaModal from './components/ComandaModal';
import ReceiptView from './components/ReceiptView';
import OpenConfirmationModal from './components/OpenConfirmationModal';
import CheckInModal from './components/CheckInModal';
import MaintenanceModal from './components/MaintenanceModal';
import HistoryView from './components/HistoryView';

function AppContent() {
  const { lanes, sessions, reservations, openLane, closeLane, setMaintenance, clearMaintenance } = useLanes();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('lanes');
  const [closingLane, setClosingLane] = React.useState<{ lane: Lane, session: Session } | null>(null);
  const [openingLaneId, setOpeningLaneId] = React.useState<string | null>(null);
  const [pendingComanda, setPendingComanda] = React.useState<string | null>(null);
  const [checkInReservation, setCheckInReservation] = React.useState<{ res: Reservation, targetLaneId: string } | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = React.useState<{ laneId: string, laneName: string } | null>(null);
  const [printedReceipt, setPrintedReceipt] = React.useState<{ laneName: string, comanda: string, startTime: number, endTime: number } | null>(null);

  const { convertReservationToLane } = useLanes();

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

    // Check if there is an active/imminent reservation for this lane
    const nowMs = Date.now();
    const WINDOW_MS = 10 * 60000;

    // Logic to find if THIS lane is currently blocked by a reservation
    const directRes = reservations
      .filter(r => r.laneId === lane.id && (r.status === 'pending' || r.status === 'arrived'))
      .sort((a, b) => a.startTime - b.startTime)[0];

    const unassignedPool = reservations
      .filter(r => !r.laneId && (r.status === 'pending' || r.status === 'arrived'))
      .sort((a, b) => a.startTime - b.startTime);

    const freeLanes = lanes.filter(l => l.status === 'free');
    const myFreeIndex = freeLanes.findIndex(l => l.id === lane.id);
    const nextRes = directRes || (myFreeIndex !== -1 && unassignedPool[myFreeIndex]);
    const isSameDay = nextRes && toLocalDateISO(nextRes.startTime) === toLocalDateISO(nowMs);
    const isReservedSoon = nextRes && isSameDay && (nextRes.startTime - nowMs < WINDOW_MS);

    if (lane.status === 'active') {
      const session = getActiveSession(laneId);
      if (session) {
        setClosingLane({ lane, session });
      }
    } else if (isReservedSoon && nextRes) {
      // It's a reservation check-in!
      setCheckInReservation({ res: nextRes, targetLaneId: laneId });
    } else if (lane.status === 'free') {
      setOpeningLaneId(laneId);
    }
  };

  const confirmOpen = (laneId: string, comanda: string) => {
    openLane(laneId, comanda);
    setOpeningLaneId(null);
    setPendingComanda(null);
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

  const getReservationConflict = (laneId: string) => {
    const nowMs = Date.now();
    const SIXTY_MINS = 60 * 60000;
    const today = toLocalDateISO(nowMs);

    // 1. Check direct reservation for this specific lane within 60 mins
    const directRes = reservations.find(r => 
      r.laneId === laneId && 
      (r.status === 'pending' || r.status === 'arrived') &&
      toLocalDateISO(r.startTime) === today &&
      r.startTime > nowMs && 
      (r.startTime - nowMs) < SIXTY_MINS
    );
    if (directRes) return `Esta pista tem uma reserva específica às ${new Date(directRes.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

    // 2. Check global pool (any lane)
    // Count how many free/soon-to-be-free lanes we will have
    const pendingAnyLaneRes = reservations.filter(r => 
      !r.laneId && 
      (r.status === 'pending' || r.status === 'arrived') &&
      toLocalDateISO(r.startTime) === today &&
      r.startTime > nowMs &&
      (r.startTime - nowMs) < SIXTY_MINS
    ).sort((a,b) => a.startTime - b.startTime);

    if (pendingAnyLaneRes.length > 0) {
      const freeLanesCount = lanes.filter(l => l.status === 'free' || l.status === 'reserved').length;
      // If we open this lane, we have (freeLanesCount - 1)
      if (freeLanesCount <= pendingAnyLaneRes.length) {
        const earliest = new Date(pendingAnyLaneRes[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Existem ${pendingAnyLaneRes.length} reservas sem pista definida começando em breve (as ${earliest}). Abrir esta pista pode causar falta de vagas.`;
      }
    }

    return null;
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
            className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`}
            onClick={() => setActiveTab('agenda')}
          >
            Agenda
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

        <div className="header-alerts">
          <AlertsSystem />
        </div>
        <div className="user-profile" onClick={logout} style={{ cursor: 'pointer' }} title="Clique para sair">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="avatar">{user.name[0]}</div>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'lanes' && (
          <section className="dashboard fade-in">
            <header className="section-header">
              <h2>Painel de Hoje</h2>
            </header>

            <CenterInsights />

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
                  <div key={lane.id} className={`lane-card ${effectiveStatus} ${isPaused ? 'paused' : ''}`}>
                    <div className="lane-header">
                      <div className="lane-id-group">
                        <span className="lane-number">{lane.name.split(' ')[1]}</span>
                        <div className="lane-occupancy-track">
                          <div className={`lane-occupancy-bar ${effectiveStatus}`} style={{ width: lane.status === 'active' ? '100%' : effectiveStatus === 'reserved' ? '40%' : '0%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="lane-body">
                      {lane.status === 'active' && session ? (
                        <div className="session-info">
                          <span className="comanda">Comanda: #{session.comanda}</span>
                          <Timer 
                            startTime={session.startTime} 
                            pauseTimeTotal={session.maintenanceTimeTotal} 
                            isPaused={lane.isMaintenancePaused} 
                          />
                          {lane.isMaintenancePaused ? (
                            <div className="maintenance-mini-alert">PAUSADA PARA MANUTENÇÃO</div>
                          ) : (
                            <span className="opened-by">Aberta por: {session.openedBy}</span>
                          )}
                        </div>
                      ) : lane.status === 'maintenance' ? (
                        <div className="maintenance-info">
                          <span className="status-text warning">EM MANUTENÇÃO</span>
                          <div className="maintenance-reason-tag">{lane.maintenanceReason}</div>
                        </div>
                      ) : (nextRes && isSameDay) ? (
                        <div className="session-info reservation">
                          <span className="res-time-label">
                            {new Date(nextRes.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="status-text">{nextRes.customerName}</span>
                        </div>
                      ) : (
                        <span className="status-text">Disponível</span>
                      )}
                    </div>
                    
                    <div className="lane-hover-overlay">
                      <div className="hover-info-item">
                        <span className="hover-label">Última ação:</span>
                        <span className="hover-value">
                          {lane.status === 'active' ? `Início ${new Date(session?.startTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                           lane.status === 'maintenance' ? 'Em manutenção' :
                           (nextRes && isSameDay) ? 'Reserva aguardando' : 'Pista limpa'}
                        </span>
                      </div>
                      {session && (
                        <div className="hover-info-item">
                          <span className="hover-label">Pausas:</span>
                          <span className="hover-value">{Math.floor(session.pauseTimeTotal / 60000)} min</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="lane-footer">
                      <button
                        className="action-btn"
                        onClick={() => handleLaneAction(lane.id)}
                      >
                        {lane.status === 'active' ? 'Fechar Pista' :
                          effectiveStatus === 'reserved' ? 'Check-in' : 'Abrir Pista'}
                      </button>

                      <button
                        className="subtle-tool-btn"
                        title={lane.status === 'maintenance' ? 'Finalizar Manutenção' : 'Marcar Manutenção'}
                        onClick={() => {
                          if (lane.status === 'maintenance') {
                            clearMaintenance(lane.id);
                          } else {
                            setMaintenanceTarget({ laneId: lane.id, laneName: lane.name });
                          }
                        }}
                      >
                        {lane.status === 'maintenance' ? '✅' : '🛠️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'logs' && (
          <HistoryView />
        )}

        {activeTab === 'agenda' && (
          <AgendaView />
        )}

        {activeTab === 'waiting' && (
          <WaitingListView />
        )}

        {activeTab === 'mapa' && (
          <LaneMap onLaneClick={handleLaneAction} />
        )}
      </main>

      {openingLaneId && !pendingComanda && (
        <ComandaModal
          onSelect={(num) => {
            setPendingComanda(num);
          }}
          onClose={() => setOpeningLaneId(null)}
        />
      )}

      {openingLaneId && pendingComanda && (
        <OpenConfirmationModal
          laneName={lanes.find(l => l.id === openingLaneId)?.name || ''}
          comanda={pendingComanda}
          warning={getReservationConflict(openingLaneId)}
          onCancel={() => setPendingComanda(null)}
          onConfirm={() => {
            confirmOpen(openingLaneId, pendingComanda);
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

      {checkInReservation && (
        <CheckInModal
          reservation={checkInReservation.res}
          laneName={lanes.find(l => l.id === checkInReservation.targetLaneId)?.name}
          onCancel={() => setCheckInReservation(null)}
          onConfirm={(comanda) => {
            convertReservationToLane(checkInReservation.res.id, comanda, checkInReservation.targetLaneId);
            setCheckInReservation(null);
          }}
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
