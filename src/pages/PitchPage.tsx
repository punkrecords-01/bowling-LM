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

/* ── animated counter ── */
function Counter({ end, suffix = '', prefix = '', duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useInView(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); } else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ── data ── */
const FEATURES = [
  {
    icon: '🎳',
    title: 'Dashboard em Tempo Real',
    desc: 'Visão panorâmica de todas as pistas, status, cronômetros e sessões ativas — tudo atualizado ao vivo, sem refresh.',
  },
  {
    icon: '📅',
    title: 'Reservas Inteligentes',
    desc: 'Agenda visual completa com criação, edição, check-in em um clique e controle manual de status por pista.',
  },
  {
    icon: '⏱️',
    title: 'Cobrança Automática',
    desc: 'Tarifas por minuto configuráveis por tipo de pista, com desconto de aniversário, desconto de minutos e recibo detalhado.',
  },
  {
    icon: '🗺️',
    title: 'Mapa Interativo',
    desc: 'Layout visual do centro mostrando o estado de cada pista com cores instantâneas — verde, azul, laranja, vermelho.',
  },
  {
    icon: '📋',
    title: 'Fila de Espera',
    desc: 'Gerenciamento de fila com prioridades, múltiplas pistas, tags de veículo e reservas diretas a partir da lista.',
  },
  {
    icon: '📊',
    title: 'Relatórios & Insights',
    desc: 'Receita do dia, ocupação em tempo real, tempo médio de sessão e relatório de consumo exportável.',
  },
];

const BENEFITS = [
  { number: 40, suffix: '%', label: 'Menos tempo de pista ociosa' },
  { number: 3, suffix: 'x', label: 'Mais rápido no check-in' },
  { number: 0, suffix: '', label: 'Reservas perdidas', prefix: '' },
  { number: 100, suffix: '%', label: 'Operação digital' },
];

const TESTIMONIALS = [
  { name: 'Ricardo M.', role: 'Gerente — Strike Boliche', text: 'Antes eu perdia o controle das pistas toda sexta à noite. Agora, em um olhar, sei exatamente o que está acontecendo.' },
  { name: 'Fernanda L.', role: 'Proprietária — Bowl & Fun', text: 'O sistema se pagou no primeiro mês. Reduzi o staff do balcão de 3 para 1 e o atendimento ficou mais rápido.' },
  { name: 'Carlos H.', role: 'Operador — Mega Strike', text: 'Abrir pista, fechar, cobrar, tudo na mesma tela. É absurdamente simples.' },
];

export default function PitchPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  /* parallax scroll for hero */
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => {
      if (heroRef.current) {
        const y = window.scrollY;
        heroRef.current.style.setProperty('--scroll', `${y * 0.35}px`);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* section reveal hooks */
  const feat = useInView();
  const bene = useInView();
  const test = useInView();
  const cta  = useInView();
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
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Recursos</a></li>
            <li><a href="#benefits" onClick={() => setMenuOpen(false)}>Resultados</a></li>
            <li><a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)} className="pitch-cta-link">Quero Contratar</a></li>
          </ul>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pitch-hero" ref={heroRef}>
        <div className="pitch-hero-bg" />
        <div className="pitch-hero-content">
          <div className="pitch-hero-badge">Sistema de Gestão para Centros de Boliche</div>
          <h1>
            Controle <span className="highlight">total</span> das suas pistas.
            <br />Em uma <span className="highlight">única tela.</span>
          </h1>
          <p className="pitch-hero-sub">
            Dashboard em tempo real, reservas, cobrança automática e relatórios —
            tudo o que seu boliche precisa para operar com máxima eficiência.
          </p>
          <div className="pitch-hero-actions">
            <a href="#contact" className="btn-primary-pitch">Agendar Demonstração</a>
            <a href="#demo" className="btn-ghost-pitch">Ver em Ação ▸</a>
          </div>
          <div className="pitch-hero-stats">
            <div><strong>10+</strong><span>Pistas gerenciadas</span></div>
            <div><strong>∞</strong><span>Reservas simultâneas</span></div>
            <div><strong>24/7</strong><span>Disponibilidade</span></div>
          </div>
        </div>
        <div className="pitch-hero-glow" />
      </section>

      {/* ─── FEATURES ─── */}
      <section className={`pitch-section ${feat.visible ? 'in' : ''}`} id="features" ref={feat.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Recursos</span>
          <h2>Tudo que você precisa.<br /><span className="highlight">Nada que você não precisa.</span></h2>
          <p>Um sistema enxuto, rápido e feito sob medida para a operação de boliche.</p>
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

      {/* ─── SCREENSHOT / DEMO ─── */}
      <section className={`pitch-section dark ${demo.visible ? 'in' : ''}`} id="demo" ref={demo.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Demo ao Vivo</span>
          <h2>Veja o sistema <span className="highlight">funcionando</span></h2>
          <p>Clique abaixo para acessar a versão de demonstração completa do dashboard.</p>
        </div>
        <div className="pitch-demo-frame">
          <div className="pitch-demo-browser">
            <div className="pitch-demo-dots"><span /><span /><span /></div>
            <span className="pitch-demo-url">strikesystem.app/demo</span>
          </div>
          <div className="pitch-demo-screen">
            <div className="pitch-demo-mock">
              {/* Miniature lane cards */}
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
                    {s === 'active' && <span className="mock-timer">{Math.floor(Math.random()*50+10)}:{String(Math.floor(Math.random()*60)).padStart(2,'0')}</span>}
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

      {/* ─── BENEFITS ─── */}
      <section className={`pitch-section ${bene.visible ? 'in' : ''}`} id="benefits" ref={bene.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Resultados</span>
          <h2>Números que <span className="highlight">falam sozinhos</span></h2>
        </div>
        <div className="pitch-metrics">
          {BENEFITS.map((b, i) => (
            <div key={i} className="pitch-metric">
              <div className="pitch-metric-num">
                <Counter end={b.number} suffix={b.suffix} prefix={b.prefix} />
              </div>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className={`pitch-section dark ${test.visible ? 'in' : ''}`} ref={test.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Depoimentos</span>
          <h2>Quem usa, <span className="highlight">recomenda</span></h2>
        </div>
        <div className="pitch-testimonials">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="pitch-testimonial">
              <p>"{t.text}"</p>
              <div className="pitch-testimonial-author">
                <div className="pitch-avatar">{t.name[0]}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className={`pitch-section ${cta.visible ? 'in' : ''}`} ref={cta.ref}>
        <div className="pitch-section-header">
          <span className="pitch-tag">Planos</span>
          <h2>Investimento que <span className="highlight">se paga</span></h2>
        </div>
        <div className="pitch-pricing">
          <div className="pitch-price-card">
            <div className="pitch-price-name">Starter</div>
            <div className="pitch-price-value">R$ 297<span>/mês</span></div>
            <ul>
              <li>✔ Até 8 pistas</li>
              <li>✔ Dashboard em tempo real</li>
              <li>✔ Reservas & fila de espera</li>
              <li>✔ Cobrança automática</li>
              <li>✔ Suporte por e-mail</li>
            </ul>
            <a href="#contact" className="btn-ghost-pitch">Começar</a>
          </div>
          <div className="pitch-price-card featured">
            <div className="pitch-price-badge">Mais Popular</div>
            <div className="pitch-price-name">Pro</div>
            <div className="pitch-price-value">R$ 497<span>/mês</span></div>
            <ul>
              <li>✔ Pistas ilimitadas</li>
              <li>✔ Tudo do Starter</li>
              <li>✔ Relatórios avançados</li>
              <li>✔ Mapa interativo</li>
              <li>✔ Suporte prioritário</li>
              <li>✔ Personalização de marca</li>
            </ul>
            <a href="#contact" className="btn-primary-pitch">Contratar Agora</a>
          </div>
          <div className="pitch-price-card">
            <div className="pitch-price-name">Enterprise</div>
            <div className="pitch-price-value">Sob consulta</div>
            <ul>
              <li>✔ Multi-unidade</li>
              <li>✔ Tudo do Pro</li>
              <li>✔ API & integrações</li>
              <li>✔ Treinamento presencial</li>
              <li>✔ SLA garantido</li>
            </ul>
            <a href="#contact" className="btn-ghost-pitch">Fale Conosco</a>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="pitch-final-cta" id="contact">
        <div className="pitch-final-cta-inner">
          <h2>Pronto para transformar<br />seu boliche?</h2>
          <p>Agende uma demonstração gratuita e descubra como o Strike System pode revolucionar sua operação.</p>
          <div className="pitch-final-actions">
            <a href="https://wa.me/5511999999999?text=Olá! Tenho interesse no Strike System para meu boliche." target="_blank" rel="noopener noreferrer" className="btn-primary-pitch large">
              💬 Falar no WhatsApp
            </a>
            <a href="mailto:contato@strikesystem.app" className="btn-ghost-pitch large">
              ✉️ Enviar E-mail
            </a>
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
          <p>© 2026 Strike System. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
