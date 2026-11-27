import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Download,
  FileCode2,
  Film,
  ImagePlus,
  Music,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import {useState} from 'react';
import type {ChangeEvent} from 'react';
import type {ExperienceContentConfig} from '../types';

interface InstructionsScreenProps {
  content: ExperienceContentConfig;
  onStartCamera: () => void;
  onBack: () => void;
  onUpdateContent: (patch: Partial<ExperienceContentConfig>) => void;
}

export function InstructionsScreen({
  content,
  onStartCamera,
  onBack,
  onUpdateContent,
}: InstructionsScreenProps) {
  const [showCustomMedia, setShowCustomMedia] = useState(false);

  const handleCustomMindChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpdateContent({customMindFile: file, customImageFile: undefined});
  };

  const handleCustomPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onUpdateContent({
      customImageFile: file,
      customMindFile: undefined,
      targetImageUrl: previewUrl,
    });
  };

  const handleCustomVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const videoUrl = URL.createObjectURL(file);
    onUpdateContent({
      videoUrl,
      videoLabel: `Vídeo selecionado: ${file.name}`,
      isTestVideo: false,
    });
  };

  const handleCustomAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioUrl = URL.createObjectURL(file);
    onUpdateContent({
      backgroundMusicUrl: audioUrl,
      backgroundMusicLabel: `Música selecionada: ${file.name}`,
    });
  };

  return (
    <div className="instructions-page">
      <header className="compact-header">
        <div className="compact-header-inner">
          <button
            type="button"
            onClick={onBack}
            className="icon-nav-btn"
            aria-label="Voltar para a tela inicial"
          >
            <ArrowLeft size={20} strokeWidth={1.8} />
            <span>Voltar</span>
          </button>
          <span className="compact-brand">{content.appTitle}</span>
          <span className="header-spacer" aria-hidden="true" />
        </div>
      </header>

      <main className="instructions-main">
        <div className="instructions-grid">
          <section className="instructions-card">
            <p className="section-kicker">Instruções da Experiência</p>
            <h1 className="instructions-heading">{content.instructionsTitle}</h1>
            <p className="instructions-lead">{content.instructionsLead}</p>

            <ol className="steps-list">
              <li className="step-item">
                <div className="step-icon">
                  <ShieldCheck size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <strong>Permissão da câmera</strong>
                  <p>
                    O navegador pedirá autorização para abrir a câmera traseira
                    (funciona em conexão segura HTTPS).
                  </p>
                </div>
              </li>

              <li className="step-item">
                <div className="step-icon">
                  <ScanLine size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <strong>Aponte para a fotografia física</strong>
                  <p>
                    Enquadre a fotografia do casamento (ou a imagem de teste ao
                    lado) evitando reflexos fortes sobre o papel.
                  </p>
                </div>
              </li>

              <li className="step-item">
                <div className="step-icon">
                  <Film size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <strong>Assista à lembrança ganhar vida</strong>
                  <p>
                    Assim que a imagem for reconhecida, o vídeo será projetado
                    proporcionalmente sobre a foto com controles de áudio.
                  </p>
                </div>
              </li>
            </ol>

            <div className="instructions-cta-wrap">
              <button
                type="button"
                onClick={onStartCamera}
                className="btn-primary-romantic instructions-start-btn"
              >
                <Camera size={20} strokeWidth={1.8} />
                <span>Permitir câmera e iniciar</span>
              </button>
            </div>
          </section>

          <aside className="test-kit-card">
            <p className="section-kicker">Primeira Entrega · Arquivos de Teste</p>
            <h2 className="test-kit-title">Imagem &amp; Vídeo de Teste</h2>
            <p className="test-kit-desc">
              Para validar o reconhecimento real agora, exiba ou imprima esta{' '}
              <strong>imagem de teste</strong> em outro dispositivo e aponte a
              câmera para ela.
            </p>

            <div className="target-preview-wrap">
              <img
                src={content.targetImageUrl}
                alt="Imagem de teste configurada para o reconhecimento MindAR"
                referrerPolicy="no-referrer"
                className="target-preview-img"
              />
              <div className="target-preview-caption">
                <span>
                  {content.customMindFile
                    ? `Alvo .mind: ${content.customMindFile.name}`
                    : content.customImageFile
                      ? `Foto personalizada: ${content.customImageFile.name}`
                      : 'Imagem de teste (Exemplo demonstrativo)'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{content.videoLabel}</span>
              </div>
            </div>

            <div className="test-kit-actions">
              <a
                href={content.targetImageUrl}
                download="teste-casal.jpg"
                className="btn-secondary-romantic"
              >
                <Download size={17} strokeWidth={1.8} />
                <span>Baixar imagem de teste</span>
              </a>

              <button
                type="button"
                onClick={() => setShowCustomMedia((v) => !v)}
                className="btn-secondary-romantic"
                aria-expanded={showCustomMedia}
              >
                {showCustomMedia ? (
                  <ChevronUp size={17} strokeWidth={1.8} />
                ) : (
                  <ChevronDown size={17} strokeWidth={1.8} />
                )}
                <span>Testar com arquivos reais</span>
              </button>
            </div>

            {showCustomMedia && (
              <div className="custom-media-panel">
                <p className="custom-media-hint">
                  Substitua temporariamente no navegador para validar com a foto,
                  arquivo <code>.mind</code>, vídeo ou música do casal:
                </p>

                <div className="custom-upload-grid">
                  <label className="upload-tile">
                    <FileCode2 size={18} strokeWidth={1.7} />
                    <span>Carregar .mind</span>
                    <input
                      type="file"
                      accept=".mind"
                      onChange={handleCustomMindChange}
                      className="sr-only"
                    />
                  </label>

                  <label className="upload-tile">
                    <ImagePlus size={18} strokeWidth={1.7} />
                    <span>Foto de referência</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCustomPhotoChange}
                      className="sr-only"
                    />
                  </label>

                  <label className="upload-tile">
                    <Film size={18} strokeWidth={1.7} />
                    <span>Vídeo MP4/WebM</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleCustomVideoChange}
                      className="sr-only"
                    />
                  </label>

                  <label className="upload-tile">
                    <Music size={18} strokeWidth={1.7} />
                    <span>Música de fundo</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomAudioChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
