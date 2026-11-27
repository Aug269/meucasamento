import {Camera, Heart, RotateCcw} from 'lucide-react';
import type {ExperienceContentConfig} from '../types';

interface ClosingScreenProps {
  content: ExperienceContentConfig;
  onWatchAgainInAR: () => void;
  onBackToStart: () => void;
}

export function ClosingScreen({
  content,
  onWatchAgainInAR,
  onBackToStart,
}: ClosingScreenProps) {
  return (
    <main className="closing-screen">
      <div className="ambient-layer" aria-hidden="true">
        <span className="floating-petal petal-1" />
        <span className="floating-petal petal-2" />
        <span className="floating-heart heart-1">♡</span>
        <span className="floating-heart heart-2">♡</span>
      </div>

      <section className="closing-card">
        <div className="closing-heart-emblem" aria-hidden="true">
          <Heart size={26} strokeWidth={1.7} />
        </div>

        <p className="section-kicker">{content.appTitle}</p>

        <h1 className="closing-quote">“{content.closingQuote}”</h1>

        <p className="closing-subtitle">{content.closingSubtitle}</p>

        {content.isTestVideo && (
          <p className="closing-test-note">
            Experiência concluída com a imagem e o vídeo de teste demonstrativos.
          </p>
        )}

        <div className="closing-actions">
          <button
            type="button"
            onClick={onWatchAgainInAR}
            className="btn-primary-romantic"
          >
            <Camera size={18} strokeWidth={1.8} />
            <span>Apontar câmera novamente</span>
          </button>

          <button
            type="button"
            onClick={onBackToStart}
            className="btn-secondary-romantic"
          >
            <RotateCcw size={17} strokeWidth={1.7} />
            <span>Voltar ao início</span>
          </button>
        </div>
      </section>
    </main>
  );
}
