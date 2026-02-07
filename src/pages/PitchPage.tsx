import { useState, useEffect, useRef } from 'react';
import './PitchPage.css';

/* ── tiny intersection-observer hook ── */
function useInView(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── data ── */
const FEATURES = [
  {
    icon: '🎳',
    title: 'Dashboard em Tempo Real',
    desc: 'Todas as pistas visíveis em uma tela só — status, cronômetro, comanda — tudo ao vivo, sem refresh.',
  },
  {
    icon: '📅',
    title: 'Reservas & Check-in Manual',
    desc: 'Agenda completa com criação, edição, check-in em um clique. O operador tem controle total, sem automações forçadas.',
  },
  {
    icon: '⏱️',
    title: 'Cobrança por Minuto',
    desc: 'Tarifa configurável por tipo de pista (boliche ou snooker). Desconto de aniversário, desconto de minutos e recibo automático.',
  },
  {
    icon: '🗺️',
    title: 'Mapa Visual do Centro',
    desc: 'Layout do centro com o estado de cada pista em cor — livre, ativa, reservada, manutenção. Visão instantânea.',
  },
  {
    icon: '📋',
    title: 'Fila de Espera Organizada',
    desc: 'Lista de espera com nome, quantidade de pistas, comanda e placa. Priorização visual e movimentação direta pra pista.',
  },
  {
    icon: '📊',
    title: 'Resumo & Relatórios',
    desc: 'Receita do dia, ocupação atual, tempo médio de sessão e relatório de consumo — dados reais pra tomar decisão.',
  },
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Cliente chega',
    desc: 'O operador vê as pistas livres no dashboard, escolhe uma e abre com o número da comanda.',
  },
  {
    step: '02',
    title: 'Sessão ativa',
    desc: 'O cronômetro roda automaticamente. O valor é calculado em tempo real pela tarifa configurada.',
  },
  {
    step: '03',
    title: 'Fechamento',
    desc: 'Um clique fecha a pista, calcula o valor, gera o recibo com tempo, comanda e descontos aplicados.',
  },
  {
    step: '04',
    title: 'Reservas & Fila',
    desc: 'Reservas aparecem na agenda e como alertas no dashboard. A fila de espera organiza quem está aguardando.',
  },
];

const PROBLEMS_SOLVED = [
  { before: 'Anotar horário de entrada no papel', after: 'Cronômetro automático por pista' },
  { before: 'Calcular valor na mão ou calculadora', after: 'Cobrança por minuto automática' },
  { before: 'Não saber quais pistas estão livres', after: 'Dashboard + mapa visual em tempo real' },
  { before: 'Perder reservas ou esquecer horários', after: 'Agenda com alertas e check-in rápido' },
  { before: 'Fila desorganizada no balcão', after: 'Lista de espera digital com prioridade' },
  { before: 'Sem dados de receita ou ocupação', after: 'Relatórios e insights automáticos' },
];

export default function PitchPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const container = document.querySelector('.pitch');
    const target = document.getElementById(id);
    if (container && target) {
      const top = target.getBoundingClientRect().top + container.scrollTop - 72;
      container.scrollTo({ top, behavior: 'smooth' });
    }
  };

  /* section reveal hooks */
  const feat = useInView();
  const flow = useInView();
  const prob = useInView();
  const demo = useInView();

  return (
    <div className="pitch">
      {/* ─── NAV ─── */}
      <nav className="pitch-nav">
        <div className="pitch-nav-inner">
          <div className="pitch-brand">
            <span className="pitch-brand-icon">🎳</span>
            <span className="pitch-brand-text">STRIKE<span>SYSTEM</span></span>
          </div>
          <button className="pitch-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <ul className={`pitch-links ${menuOpen ? 'open' : ''}`}>
            <li><a onClick={() => scrollTo('features')}>Recursos</a></li>
            <li><a onClick={() => scrollTo('workflow')}>Como Funciona</a></li>
            <li><a onClick={() => scrollTo('problems')}>Problemas que Resolve</a></li>
            <li><a onClick={() => scrollTo('demo')} className="pitch-cta-link">Ver Demo</a></li>
          </ul>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pitch-hero">
        <div className="pitch-hero-bg" />
        <div className="pitch-hero-content">
          <h1>
            O sistema que faltava<br />
            pro seu <span className="highlight">boliche.</span>
          </h1>
          <p className="pitch-hero-sub">
            Controle de pistas, reservas, cobrança e fila de espera — tudo em uma interface única,
            feita pra funcionar no dia a dia real da operação.
          </p>
          <div className="pitch-hero-actions">
            <a onClick={() => scrollTo('demo')} className="btn-primary-pitch">Ver Demo ao Vivo ▸</a>
            <a onClick={() => scrollTo('features')} className="btn-ghost-pitch">Conhecer Recursos</a>
          </div>
        </div>
        <div className="pitch-hero-glow" />
      </section>

      {/* ─── PROBLEMS SOLVED ─── */}
      <section className={`pitch-section ${prob.visible ? 'in' : ''}`} id="problems" ref={prob.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Antes vs. Depois</span>
          <h2>O que muda na <span className="highlight">prática</span></h2>
          <p>Problemas comuns do dia a dia que o sistema resolve de forma direta.</p>
        </div>
        <div className="pitch-comparison-grid">
          {PROBLEMS_SOLVED.map((p, i) => (
            <div key={i} className="pitch-comparison-row">
              <div className="pitch-before">
                <span className="pitch-x">✕</span>
                {p.before}
              </div>
              <div className="pitch-arrow">→</div>
              <div className="pitch-after">
                <span className="pitch-check">✔</span>
                {p.after}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className={`pitch-section dark ${feat.visible ? 'in' : ''}`} id="features" ref={feat.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Recursos</span>
          <h2>O que o sistema <span className="highlight">faz</span></h2>
          <p>Cada funcionalidade foi pensada pra resolver um problema real da operação.</p>
        </div>
        <div className="pitch-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="pitch-feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="pitch-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WORKFLOW ─── */}
      <section className={`pitch-section ${flow.visible ? 'in' : ''}`} id="workflow" ref={flow.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Como Funciona</span>
          <h2>Fluxo de <span className="highlight">operação</span></h2>
          <p>Do momento que o cliente chega até o fechamento da conta.</p>
        </div>
        <div className="pitch-workflow">
          {WORKFLOW.map((w, i) => (
            <div key={i} className="pitch-workflow-step">
              <div className="pitch-step-number">{w.step}</div>
              <div className="pitch-step-content">
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEMO ─── */}
      <section className={`pitch-section dark ${demo.visible ? 'in' : ''}`} id="demo" ref={demo.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Demo</span>
          <h2>Veja o sistema <span className="highlight">funcionando</span></h2>
          <p>A versão completa rodando no navegador — clique e explore.</p>
        </div>
        <div className="pitch-demo-frame">
          <div className="pitch-demo-browser">
            <div className="pitch-demo-dots"><span /><span /><span /></div>
            <span className="pitch-demo-url">strike-system / dashboard</span>
          </div>
          <div className="pitch-demo-screen">
            <div className="pitch-demo-mock">
              <div className="mock-header">
                <div className="mock-logo">🎳 STRIKE BOLICHE BAR</div>
                <div className="mock-tabs">
                  <span className="active">Pistas</span>
                  <span>Reservas</span>
                  <span>Fila</span>
                  <span>Mapa</span>
                </div>
              </div>
              <div className="mock-grid">
                {['free','active','active','free','reserved','active','free','active','maintenance','active'].map((s,i) => (
                  <div key={i} className={`mock-lane ${s}`}>
                    <span className="mock-lane-num">{String(i+1).padStart(2,'0')}</span>
                    <span className="mock-lane-status">{s === 'free' ? 'Livre' : s === 'active' ? 'Ativa' : s === 'reserved' ? 'Reservada' : 'Manut.'}</span>
                    {s === 'active' && <span className="mock-timer">{[12,34,27,45,18,52][i % 6]}:{String([48,12,33,5,22,41][i % 6]).padStart(2,'0')}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <a
            href="https://punkrecords-01.github.io/bowling-LM/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-pitch demo-btn"
          >
            Abrir Demo Completa →
          </a>
        </div>
      </section>

      {/* ─── TECH ─── */}
      <section className="pitch-section">
        <div className="pitch-section-header">
          <span className="pitch-tag">Tecnologia</span>
          <h2>Feito com stack <span className="highlight">moderna</span></h2>
        </div>
        <div className="pitch-tech-grid">
          <div className="pitch-tech-item">
            <strong>React + TypeScript</strong>
            <span>Interface rápida e tipada</span>
          </div>
          <div className="pitch-tech-item">
            <strong>Vite</strong>
            <span>Build instantâneo</span>
          </div>
          <div className="pitch-tech-item">
            <strong>Tauri (opcional)</strong>
            <span>Aplicativo desktop nativo</span>
          </div>
          <div className="pitch-tech-item">
            <strong>100% Responsivo</strong>
            <span>Funciona no PC, tablet e celular</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="pitch-footer">
        <div className="pitch-footer-inner">
          <div className="pitch-brand">
            <span className="pitch-brand-icon">🎳</span>
            <span className="pitch-brand-text">STRIKE<span>SYSTEM</span></span>
          </div>
          <p>Desenvolvido sob medida para centros de boliche.</p>
        </div>
      </footer>
    </div>
  );
}
