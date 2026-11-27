import {ArrowRight, Sparkles} from 'lucide-react';
import demoStationeryImg from '../assets/images/demo_memory_stationery_1795781381186.jpg';
import type {ExperienceContentConfig} from '../types';

interface SplashScreenProps {
  content: ExperienceContentConfig;
  onRevealStory: () => void;
}

export function SplashScreen({content, onRevealStory}: SplashScreenProps) {
  return (
    <main className="splash-screen">
      <div className="ambient-layer" aria-hidden="true">
        <span className="floating-petal petal-1" />
        <span className="floating-petal petal-2" />
        <span className="floating-petal petal-3" />
        <span className="floating-heart heart-1">♡</span>
        <span className="floating-heart heart-2">♡</span>
        <span className="floating-heart heart-3">♡</span>
      </div>

      <div className="splash-shell">
        <section className="splash-content">
          <div className="crest-ornament" aria-hidden="true">
            <svg
              viewBox="0 0 120 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="crest-svg"
            >
              <path
                d="M12 24H44M76 24H108"
                stroke="#C49A52"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
              <circle cx="55.5" cy="24" r="9.5" stroke="#C49A52" strokeWidth="1.4" />
              <circle cx="64.5" cy="24" r="9.5" stroke="#B77B86" strokeWidth="1.4" />
              <path
                d="M60 11C61.2 8.8 64 8.8 64.8 10.8C65.5 12.6 62.6 15.2 60 17.2C57.4 15.2 54.5 12.6 55.2 10.8C56 8.8 58.8 8.8 60 11Z"
                fill="#D99BA7"
                opacity="0.85"
              />
            </svg>
          </div>

          <p className="splash-kicker">Um Amor que Ganha Vida</p>

          <h1 className="splash-title">{content.appTitle}</h1>

          <p className="splash-subtitle">{content.openingQuote}</p>

          <p className="splash-description">
            Uma homenagem em realidade aumentada para reviver, através da
            câmera do celular, a emoção deste momento sobre a fotografia
            impressa.
          </p>

          <div className="splash-actions">
            <button
              type="button"
              onClick={onRevealStory}
              className="btn-primary-romantic"
            >
              <span>{content.openingButtonLabel}</span>
              <ArrowRight size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="splash-notes">
            <span>Android e iPhone via navegador</span>
            <span aria-hidden="true">·</span>
            <span>Realidade Aumentada MindAR</span>
            <span aria-hidden="true">·</span>
            <span>Sem instalação de aplicativo</span>
          </div>
        </section>

        <aside
          className="splash-preview-card"
          aria-label="Ilustração decorativa de casamento"
        >
          <div className="preview-frame">
            <img
              src={demoStationeryImg}
              alt="Papelaria de casamento em tons champagne e dourado"
              referrerPolicy="no-referrer"
              className="preview-image"
            />
          </div>
          <div className="preview-caption">
            <Sparkles size={15} strokeWidth={1.8} className="gold-icon" />
            <span>
              Imagem ilustrativa · Na próxima etapa você verá as instruções e a
              imagem de teste para apontar a câmera
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
