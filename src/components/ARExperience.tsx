import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Download,
  FileCode2,
  Film,
  Heart,
  ImagePlus,
  Music,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Target,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ChangeEvent} from 'react';
import {ensureWeddingAframeComponents} from '../services/aframeComponents';
import {ARScanGuide} from './ARScanGuide';
import {
  releaseVideoStreamsInContainer,
  requestRearCameraAccess,
} from '../services/cameraService';
import {
  createTargetFromImageFile,
  createTargetFromMindFile,
  downloadMindBytes,
  resolveExperienceMindTarget,
} from '../services/mindTargetService';
import type {
  CameraErrorInfo,
  ExperienceContentConfig,
  TargetSourceInfo,
  TrackingStatus,
  VideoPlaybackState,
} from '../types';

interface ARExperienceProps {
  content: ExperienceContentConfig;
  onUpdateContent: (patch: Partial<ExperienceContentConfig>) => void;
  onFinishExperience: () => void;
  onBackToInstructions: () => void;
}

export function ARExperience({
  content,
  onUpdateContent,
  onFinishExperience,
  onBackToInstructions,
}: ARExperienceProps) {
  const [trackingStatus, setTrackingStatus] =
    useState<TrackingStatus>('requesting-camera');
  const [hasFoundOnce, setHasFoundOnce] = useState(false);
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepStage, setPrepStage] = useState(
    'Solicitando acesso à câmera traseira...'
  );
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [targetSource, setTargetSource] = useState<TargetSourceInfo | null>(null);
  const [sceneKey, setSceneKey] = useState(0);

  // Estado real do vídeo HTML5 em AR + áudio + música ambiente
  const [videoState, setVideoState] = useState<VideoPlaybackState>('idle');
  const [videoAspect, setVideoAspect] = useState<number>(0.75); // height / width
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoplayMutedFallback, setAutoplayMutedFallback] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(
    Boolean(content.backgroundMusicUrl)
  );

  const [showTargetDrawer, setShowTargetDrawer] = useState(false);
  const [compilingCustom, setCompilingCustom] = useState(false);

  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<(HTMLElement & {systems?: Record<string, unknown>}) | null>(
    null
  );
  const targetRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasFoundOnceRef = useRef(false);
  const musicEnabledRef = useRef(musicEnabled);
  const isMountedRef = useRef(true);
  const bootstrapSeqRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    hasFoundOnceRef.current = hasFoundOnce;
  }, [hasFoundOnce]);

  useEffect(() => {
    musicEnabledRef.current = musicEnabled;
  }, [musicEnabled]);

  useEffect(() => {
    document.body.classList.add('ar-active');
    return () => {
      document.body.classList.remove('ar-active');
    };
  }, []);

  // Calcula dimensões proporcionais do vídeo dentro da fotografia reconhecida
  const planeDimensions = useMemo(() => {
    const targetAspect = targetSource?.aspectRatio ?? 0.75;
    const vidAspect = videoAspect || targetAspect;
    const maxW = 0.96;
    const maxH = Math.max(0.45, targetAspect * 0.96);

    let width = maxW;
    let height = width * vidAspect;
    if (height > maxH) {
      height = maxH;
      width = height / vidAspect;
    }

    return {
      width: Number(width.toFixed(3)),
      height: Number(height.toFixed(3)),
      frameWidth: Number((width + 0.045).toFixed(3)),
      frameHeight: Number((height + 0.045).toFixed(3)),
    };
  }, [targetSource, videoAspect]);

  const stopMediaElements = useCallback(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
    }
    const audioEl = bgAudioRef.current;
    if (audioEl) {
      audioEl.pause();
    }
  }, []);

  const stopActiveAR = useCallback(() => {
    stopMediaElements();
    const sceneEl = sceneRef.current;
    try {
      const system = sceneEl?.systems?.['mindar-image-system'] as
        | {stop?: () => void; controller?: unknown}
        | undefined;
      if (system && system.controller && typeof system.stop === 'function') {
        system.stop();
      }
    } catch {
      // Ignora caso o sistema ainda não esteja inicializado
    }
    releaseVideoStreamsInContainer(sceneContainerRef.current);
    document
      .querySelectorAll('.mindar-ui-overlay')
      .forEach((node) => node.remove());
  }, [stopMediaElements]);

  const startVideoOnTargetFound = useCallback(async () => {
    const videoEl = videoRef.current;
    const audioEl = bgAudioRef.current;
    if (!videoEl) return;

    if (videoEl.ended) {
      videoEl.currentTime = 0;
    }

    try {
      videoEl.muted = false;
      await videoEl.play();
      setIsMuted(false);
      setAutoplayMutedFallback(false);
      setVideoState('playing');

      if (audioEl && musicEnabledRef.current && content.backgroundMusicUrl) {
        audioEl.volume = content.backgroundMusicVolume;
        void audioEl.play().catch(() => {
          // Navegador pode restringir segundo áudio simultâneo
        });
      }
    } catch {
      // Política de autoplay bloqueou som automático: tenta iniciar no mudo
      try {
        videoEl.muted = true;
        await videoEl.play();
        setIsMuted(true);
        setAutoplayMutedFallback(true);
        setVideoState('playing');
      } catch {
        // Navegador exigiu gesto explícito do usuário
        setVideoState('needs-tap');
      }
    }
  }, [content.backgroundMusicUrl, content.backgroundMusicVolume]);

  const bootstrapAR = useCallback(
    async (customTarget?: TargetSourceInfo) => {
      const seq = ++bootstrapSeqRef.current;
      stopActiveAR();
      setCameraError(null);
      setHasFoundOnce(false);
      hasFoundOnceRef.current = false;
      setVideoState('idle');
      setAutoplayMutedFallback(false);
      setTrackingStatus('requesting-camera');
      setPrepProgress(15);
      setPrepStage('Solicitando permissão para a câmera traseira...');

      const camResult = await requestRearCameraAccess();
      if (!isMountedRef.current || seq !== bootstrapSeqRef.current) return;

      if (!camResult.ok) {
        setCameraError(camResult.error);
        setTrackingStatus('error');
        return;
      }

      if (!window.AFRAME || !window.MINDAR?.IMAGE) {
        setCameraError({
          code: 'MINDAR_ERROR',
          title: 'Motor de AR indisponível',
          message:
            'Os scripts do MindAR ou A-Frame não puderam ser carregados.',
          tip: 'Recarregue a página e tente novamente.',
        });
        setTrackingStatus('error');
        return;
      }

      ensureWeddingAframeComponents();

      try {
        setTrackingStatus('preparing-target');
        const resolved =
          customTarget ??
          (await resolveExperienceMindTarget(
            {
              targetImageUrl: content.targetImageUrl,
              precompiledMindPaths: content.precompiledMindPaths,
              customMindFile: content.customMindFile,
              customImageFile: content.customImageFile,
            },
            (percent, stage) => {
              if (!isMountedRef.current || seq !== bootstrapSeqRef.current) return;
              setPrepProgress(percent);
              setPrepStage(stage);
            }
          ));

        if (!isMountedRef.current || seq !== bootstrapSeqRef.current) return;
        setTargetSource(resolved);
        setSceneKey((k) => k + 1);
      } catch (err) {
        if (!isMountedRef.current || seq !== bootstrapSeqRef.current) return;
        setCameraError({
          code: 'MINDAR_ERROR',
          title: 'Falha ao preparar imagem de referência',
          message:
            err instanceof Error
              ? err.message
              : 'Não foi possível preparar o alvo de rastreamento .mind.',
          tip: 'Verifique sua conexão ou tente carregar outro arquivo .mind.',
        });
        setTrackingStatus('error');
      }
    },
    [
      content.customImageFile,
      content.customMindFile,
      content.precompiledMindPaths,
      content.targetImageUrl,
      stopActiveAR,
    ]
  );

  useEffect(() => {
    void bootstrapAR();
    return () => {
      stopActiveAR();
    };
  }, [bootstrapAR, stopActiveAR]);

  // Listeners reais do MindAR (arReady, arError, targetFound, targetLost)
  useEffect(() => {
    if (!targetSource) return;
    const sceneEl = sceneRef.current;
    const targetEl = targetRef.current;
    if (!sceneEl || !targetEl) return;

    const handleArReady = () => {
      setTrackingStatus((prev) => (prev === 'found' ? 'found' : 'scanning'));
    };

    const handleArError = () => {
      setCameraError({
        code: 'MINDAR_ERROR',
        title: 'Erro ao iniciar o rastreamento AR',
        message:
          'O MindAR não conseguiu inicializar a câmera ou o contexto WebGL neste dispositivo.',
        tip: 'Feche outras abas com câmera aberta e toque em "Tentar novamente".',
      });
      setTrackingStatus('error');
    };

    const handleTargetFound = () => {
      hasFoundOnceRef.current = true;
      setHasFoundOnce(true);
      setTrackingStatus('found');
      void startVideoOnTargetFound();
    };

    const handleTargetLost = () => {
      stopMediaElements();
      setVideoState((prev) => (prev === 'ended' ? 'ended' : 'paused'));
      setTrackingStatus(hasFoundOnceRef.current ? 'lost' : 'scanning');
    };

    sceneEl.addEventListener('arReady', handleArReady);
    sceneEl.addEventListener('arError', handleArError);
    targetEl.addEventListener('targetFound', handleTargetFound);
    targetEl.addEventListener('targetLost', handleTargetLost);

    return () => {
      sceneEl.removeEventListener('arReady', handleArReady);
      sceneEl.removeEventListener('arError', handleArError);
      targetEl.removeEventListener('targetFound', handleTargetFound);
      targetEl.removeEventListener('targetLost', handleTargetLost);
      stopActiveAR();
    };
  }, [
    targetSource,
    sceneKey,
    startVideoOnTargetFound,
    stopMediaElements,
    stopActiveAR,
  ]);

  // Eventos do elemento <video> HTML5
  const handleVideoLoadedMetadata = () => {
    const v = videoRef.current;
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      setVideoAspect(v.videoHeight / v.videoWidth);
    }
  };

  const handleVideoEnded = () => {
    setVideoState('ended');
    bgAudioRef.current?.pause();
  };

  const handleVideoError = () => {
    setVideoState('error');
  };

  const handleTogglePlayPause = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      try {
        await v.play();
        setVideoState('playing');
        if (
          bgAudioRef.current &&
          musicEnabled &&
          !v.muted &&
          content.backgroundMusicUrl
        ) {
          bgAudioRef.current.volume = content.backgroundMusicVolume;
          void bgAudioRef.current.play().catch(() => {});
        }
      } catch {
        setVideoState('needs-tap');
      }
    } else {
      v.pause();
      bgAudioRef.current?.pause();
      setVideoState('paused');
    }
  };

  const handleTapToPlayExplicit = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      await v.play();
      setIsMuted(false);
      setAutoplayMutedFallback(false);
      setVideoState('playing');
      if (bgAudioRef.current && musicEnabled && content.backgroundMusicUrl) {
        bgAudioRef.current.volume = content.backgroundMusicVolume;
        void bgAudioRef.current.play().catch(() => {});
      }
    } catch {
      try {
        v.muted = true;
        await v.play();
        setIsMuted(true);
        setVideoState('playing');
      } catch {
        setVideoState('error');
      }
    }
  };

  const handleToggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !v.muted;
    v.muted = nextMuted;
    setIsMuted(nextMuted);
    setAutoplayMutedFallback(false);

    if (nextMuted) {
      bgAudioRef.current?.pause();
    } else if (
      bgAudioRef.current &&
      musicEnabled &&
      !v.paused &&
      content.backgroundMusicUrl
    ) {
      bgAudioRef.current.volume = content.backgroundMusicVolume;
      void bgAudioRef.current.play().catch(() => {});
    }
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    const audioEl = bgAudioRef.current;
    if (!audioEl) return;
    if (!next) {
      audioEl.pause();
    } else if (!isMuted && videoState === 'playing' && content.backgroundMusicUrl) {
      audioEl.volume = content.backgroundMusicVolume;
      void audioEl.play().catch(() => {});
    }
  };

  const handleReplayVideo = async () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    try {
      await v.play();
      setVideoState('playing');
      if (bgAudioRef.current && musicEnabled && !v.muted && content.backgroundMusicUrl) {
        bgAudioRef.current.currentTime = 0;
        bgAudioRef.current.volume = content.backgroundMusicVolume;
        void bgAudioRef.current.play().catch(() => {});
      }
    } catch {
      setVideoState('needs-tap');
    }
  };

  const handleExitToInstructions = () => {
    stopActiveAR();
    onBackToInstructions();
  };

  const handleFinishToClosing = () => {
    stopActiveAR();
    onFinishExperience();
  };

  const handleUploadMindFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextTarget = createTargetFromMindFile(
      file,
      content.targetImageUrl,
      targetSource?.aspectRatio ?? 0.75
    );
    onUpdateContent({customMindFile: file, customImageFile: undefined});
    setShowTargetDrawer(false);
    void bootstrapAR(nextTarget);
  };

  const handleCompileCustomImage = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCompilingCustom(true);
    try {
      const nextTarget = await createTargetFromImageFile(file, (pct) => {
        setPrepProgress(pct);
      });
      onUpdateContent({
        customImageFile: file,
        customMindFile: undefined,
        targetImageUrl: nextTarget.previewImageUrl,
      });
      setShowTargetDrawer(false);
      void bootstrapAR(nextTarget);
    } catch (err) {
      setCameraError({
        code: 'MINDAR_ERROR',
        title: 'Não foi possível compilar a foto',
        message:
          err instanceof Error
            ? err.message
            : 'Escolha uma fotografia nítida em JPG ou PNG.',
        tip: 'Prefira fotografias bem iluminadas e com bom contraste.',
      });
      setTrackingStatus('error');
    } finally {
      setCompilingCustom(false);
    }
  };

  const handleUploadCustomVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdateContent({
      videoUrl: url,
      videoLabel: `Vídeo selecionado: ${file.name}`,
      isTestVideo: false,
    });
    setShowTargetDrawer(false);
  };

  return (
    <div className="ar-viewport">
      {/* Elemento HTML5 Video real usado pela textura WebGL (mantido ativo para iOS Safari) */}
      <video
        id="ar-wedding-video"
        ref={videoRef}
        src={content.videoUrl}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onLoadedMetadata={handleVideoLoadedMetadata}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        className="ar-hidden-video"
      />

      {content.backgroundMusicUrl && (
        <audio
          ref={bgAudioRef}
          src={content.backgroundMusicUrl}
          loop
          preload="auto"
        />
      )}

      {/* Contêiner A-Frame + MindAR */}
      <div ref={sceneContainerRef} className="ar-scene-container">
        {targetSource && trackingStatus !== 'error' && (
          <a-scene
            key={sceneKey}
            ref={sceneRef}
            mindar-image={`imageTargetSrc: ${targetSource.mindUrl}; autoStart: true; uiLoading: no; uiScanning: no; uiError: no; filterMinCF: 0.0001; filterBeta: 0.001; missTolerance: 6; warmupTolerance: 3;`}
            color-space="sRGB"
            renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true;"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            embedded=""
          >
            <a-camera position="0 0 0" look-controls="enabled: false" />

            {/* Âncora real do MindAR: visível apenas durante targetFound */}
            <a-entity ref={targetRef} mindar-image-target="targetIndex: 0">
              {/* Moldura champagne dourada proporcional à imagem reconhecida */}
              <a-plane
                color="#d8b574"
                position="0 0 0"
                width={planeDimensions.frameWidth}
                height={planeDimensions.frameHeight}
                material="shader: flat; opacity: 0.96; transparent: true;"
              />

              {/* Superfície de vídeo HTML5 alinhada e proporcional à foto reconhecida */}
              <a-entity
                position="0 0 0.012"
                ar-video-surface={`videoId: ar-wedding-video; width: ${planeDimensions.width}; height: ${planeDimensions.height};`}
              />

              {/* Efeitos delicados de corações 3D e partículas douradas */}
              <a-entity position="0 0 0.04" wedding-hearts="count: 10" />
              <a-entity position="0 0 0.04" wedding-sparkles="count: 16" />
            </a-entity>
          </a-scene>
        )}
      </div>

      {/* HUD sobreposta */}
      <div className="ar-hud-layer">
        <header className="ar-top-bar">
          <button
            type="button"
            onClick={handleExitToInstructions}
            className="ar-glass-btn"
            aria-label="Voltar para as instruções"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTargetDrawer(true)}
            className="ar-glass-btn ar-target-trigger"
          >
            <Target size={18} strokeWidth={1.8} />
            <span>Imagem &amp; Vídeo de Teste</span>
          </button>
        </header>

        {/* Estado: solicitando permissão de câmera ou compilando/carregando .mind */}
        {(trackingStatus === 'requesting-camera' ||
          trackingStatus === 'preparing-target') && (
          <div className="ar-center-overlay">
            <div className="ar-status-card">
              <div className="ar-loader-ring" aria-hidden="true">
                <Camera size={24} strokeWidth={1.7} />
              </div>
              <h2 className="ar-status-title">
                {trackingStatus === 'requesting-camera'
                  ? 'Liberando a câmera traseira'
                  : 'Preparando reconhecimento visual'}
              </h2>
              <p className="ar-status-text">{prepStage}</p>
              <div className="progress-track" aria-hidden="true">
                <div
                  className="progress-fill"
                  style={{width: `${prepProgress}%`}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Estado: erro real de câmera, permissão negada, HTTPS ausente ou MindAR */}
        {trackingStatus === 'error' && cameraError && (
          <div className="ar-center-overlay">
            <div className="ar-error-card" role="alert">
              <div className="ar-error-icon">
                <AlertCircle size={26} strokeWidth={1.8} />
              </div>
              <h2 className="ar-status-title">{cameraError.title}</h2>
              <p className="ar-status-text">{cameraError.message}</p>
              <p className="ar-error-tip">{cameraError.tip}</p>

              <div className="ar-error-actions">
                <button
                  type="button"
                  onClick={() => void bootstrapAR(targetSource ?? undefined)}
                  className="btn-primary-romantic"
                >
                  <RefreshCw size={18} strokeWidth={1.8} />
                  <span>Tentar novamente</span>
                </button>

                <button
                  type="button"
                  onClick={handleExitToInstructions}
                  className="btn-secondary-romantic"
                >
                  <ArrowLeft size={18} strokeWidth={1.7} />
                  <span>Voltar às instruções</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado: escaneando ou alvo perdido (sem elementos AR falsos) */}
        {(trackingStatus === 'scanning' || trackingStatus === 'lost') && (
          <ARScanGuide
            status={trackingStatus}
            onOpenTestImage={() => setShowTargetDrawer(true)}
          />
        )}

        {/* Estado: alvo reconhecido — controles discretos de vídeo e áudio */}
        {trackingStatus === 'found' && (
          <>
            {videoState === 'needs-tap' && (
              <div className="ar-tap-play-wrap">
                <button
                  type="button"
                  onClick={() => void handleTapToPlayExplicit()}
                  className="btn-primary-romantic ar-tap-play-btn"
                >
                  <Play size={19} strokeWidth={2} />
                  <span>Toque para reproduzir o vídeo</span>
                </button>
              </div>
            )}

            <div className="ar-bottom-panel">
              <div className="ar-controls-card" role="region" aria-label="Controles do vídeo em AR">
                <div className="ar-controls-header">
                  <span className="ar-tracking-label">
                    <Heart size={14} strokeWidth={2} />
                    <span>
                      {content.isTestVideo
                        ? 'Fotografia reconhecida · Vídeo de teste'
                        : 'Fotografia reconhecida'}
                    </span>
                  </span>

                  {autoplayMutedFallback && isMuted && (
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="ar-sound-nudge"
                    >
                      <Volume2 size={14} strokeWidth={2} />
                      <span>Ativar som</span>
                    </button>
                  )}
                </div>

                {videoState === 'error' && (
                  <p className="ar-video-error">
                    Não foi possível carregar este vídeo. Verifique o formato
                    MP4 (H.264) ou selecione outro arquivo.
                  </p>
                )}

                {videoState === 'ended' && (
                  <div className="ar-ended-row">
                    <p className="ar-ended-text">
                      “{content.closingQuote}”
                    </p>
                  </div>
                )}

                <div className="ar-controls-bar">
                  <div className="ar-media-buttons">
                    <button
                      type="button"
                      onClick={() => void handleTogglePlayPause()}
                      className="ar-circle-btn"
                      aria-label={
                        videoState === 'playing'
                          ? 'Pausar vídeo'
                          : 'Reproduzir vídeo'
                      }
                      title={videoState === 'playing' ? 'Pausar' : 'Reproduzir'}
                    >
                      {videoState === 'playing' ? (
                        <Pause size={18} strokeWidth={1.9} />
                      ) : (
                        <Play size={18} strokeWidth={1.9} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="ar-circle-btn"
                      aria-label={isMuted ? 'Ativar áudio' : 'Silenciar áudio'}
                      title={isMuted ? 'Ativar áudio' : 'Silenciar'}
                    >
                      {isMuted ? (
                        <VolumeX size={18} strokeWidth={1.9} />
                      ) : (
                        <Volume2 size={18} strokeWidth={1.9} />
                      )}
                    </button>

                    {content.backgroundMusicUrl && (
                      <button
                        type="button"
                        onClick={handleToggleMusic}
                        className={`ar-circle-btn ${
                          musicEnabled ? 'is-active' : ''
                        }`}
                        aria-label={
                          musicEnabled
                            ? 'Desativar música de fundo'
                            : 'Ativar música de fundo'
                        }
                        title="Música de fundo"
                      >
                        <Music size={17} strokeWidth={1.9} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleReplayVideo()}
                      className="ar-circle-btn"
                      aria-label="Reiniciar vídeo"
                      title="Reiniciar vídeo"
                    >
                      <RotateCcw size={17} strokeWidth={1.9} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishToClosing}
                    className="btn-primary-romantic ar-finish-btn"
                  >
                    <span>
                      {videoState === 'ended' ? 'Mensagem final' : 'Concluir'}
                    </span>
                    <ArrowRight size={17} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Imagem & Vídeo de Teste + Troca rápida para arquivos reais */}
      {showTargetDrawer && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="target-drawer-title"
          onClick={() => setShowTargetDrawer(false)}
        >
          <div
            className="modal-card target-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <h2 id="target-drawer-title" className="modal-title">
                Imagem &amp; Vídeo de Teste
              </h2>
              <button
                type="button"
                onClick={() => setShowTargetDrawer(false)}
                className="modal-close-btn"
                aria-label="Fechar janela"
              >
                <X size={20} />
              </button>
            </div>

            <p className="modal-subtitle">
              Exiba esta <strong>imagem de teste</strong> em outro aparelho ou
              imprima-a e aponte a câmera. Ao reconhecer, o{' '}
              <strong>{content.videoLabel}</strong> será reproduzido sobre a
              foto.
            </p>

            <div className="target-preview-wrap">
              <img
                src={targetSource?.previewImageUrl || content.targetImageUrl}
                alt="Imagem de teste para reconhecimento MindAR"
                referrerPolicy="no-referrer"
                className="target-preview-img"
              />
              <div className="target-preview-caption">
                <span>
                  {targetSource?.label || 'Imagem de teste (Exemplo)'}
                </span>
              </div>
            </div>

            <div className="target-actions-grid">
              <a
                href={content.targetImageUrl}
                download="teste-casal.jpg"
                className="btn-secondary-romantic"
              >
                <Download size={17} strokeWidth={1.8} />
                <span>Baixar imagem</span>
              </a>

              {targetSource?.compiledBytes && (
                <button
                  type="button"
                  onClick={() =>
                    downloadMindBytes(
                      targetSource.compiledBytes!,
                      'teste-casal.mind'
                    )
                  }
                  className="btn-secondary-romantic"
                >
                  <FileCode2 size={17} strokeWidth={1.8} />
                  <span>Baixar .mind</span>
                </button>
              )}
            </div>

            <div className="target-divider" />

            <p className="target-custom-heading">
              Testar com arquivos reais do casal
            </p>

            <div className="target-actions-grid">
              <label className="btn-secondary-romantic file-btn-label">
                <FileCode2 size={17} strokeWidth={1.8} />
                <span>Carregar .mind</span>
                <input
                  type="file"
                  accept=".mind"
                  onChange={handleUploadMindFile}
                  className="sr-only"
                />
              </label>

              <label className="btn-secondary-romantic file-btn-label">
                <ImagePlus size={17} strokeWidth={1.8} />
                <span>
                  {compilingCustom ? 'Compilando...' : 'Compilar foto'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => void handleCompileCustomImage(e)}
                  disabled={compilingCustom}
                  className="sr-only"
                />
              </label>

              <label className="btn-primary-romantic file-btn-label span-full">
                <Film size={17} strokeWidth={1.8} />
                <span>Substituir vídeo (MP4/WebM)</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleUploadCustomVideo}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
