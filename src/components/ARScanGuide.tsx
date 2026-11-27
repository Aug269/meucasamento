import {Heart, Image as ImageIcon, ScanLine} from 'lucide-react';

interface ARScanGuideProps {
  status: 'scanning' | 'lost';
  onOpenTestImage: () => void;
}

/**
 * Guia visual animado exibido sobre a câmera enquanto o MindAR procura
 * ou tenta recuperar o enquadramento da fotografia física.
 */
export function ARScanGuide({status, onOpenTestImage}: ARScanGuideProps) {
  const isLost = status === 'lost';

  return (
    <>
      <div className="ar-reticle-wrap" aria-hidden="true">
        <div className={`ar-scan-stage ${isLost ? 'is-lost' : ''}`}>
          {/* Etiqueta animada diretamente sobre a mira da câmera */}
          <div className={`ar-guide-callout ${isLost ? 'is-lost' : ''}`}>
            <ScanLine size={16} strokeWidth={2} className="ar-guide-icon" />
            <span>
              {isLost
                ? 'Alvo perdido · Enquadre a foto'
                : 'Procure o alvo · Enquadre a foto'}
            </span>
          </div>

          {/* Moldura animada com cantos dourados/rosa e feixe de leitura suave */}
          <div className={`ar-reticle-box ${isLost ? 'is-lost' : ''}`}>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="ar-scan-beam" />

            <div className="ar-frame-ghost">
              <div className="ar-ghost-emblem">
                <ImageIcon size={24} strokeWidth={1.5} />
                <Heart size={13} strokeWidth={2} className="ar-ghost-heart" />
              </div>
              <span className="ar-ghost-caption">
                {isLost ? 'Realinhe a fotografia aqui' : 'Alinhe a fotografia aqui'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ar-bottom-panel">
        {isLost ? (
          <div className="ar-feedback-card is-lost" role="status">
            <div className="ar-feedback-row">
              <ScanLine size={20} strokeWidth={1.8} />
              <strong>Fotografia fora do enquadramento</strong>
            </div>
            <p>
              Aponte a câmera novamente para a fotografia para retomar o vídeo
              em realidade aumentada.
            </p>
          </div>
        ) : (
          <div className="ar-feedback-card" role="status">
            <div className="ar-feedback-row">
              <ScanLine size={20} strokeWidth={1.8} />
              <strong>Procure o alvo com a câmera</strong>
            </div>
            <p>
              Enquadre a fotografia física em local iluminado ou abra a{' '}
              <button
                type="button"
                onClick={onOpenTestImage}
                className="ar-inline-link"
              >
                imagem de teste
              </button>{' '}
              em outro aparelho.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
