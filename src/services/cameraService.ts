import type {CameraErrorInfo} from '../types';

export function mapCameraError(error: unknown): CameraErrorInfo {
  if (!window.isSecureContext) {
    return {
      code: 'INSECURE_CONTEXT',
      title: 'Conexão HTTPS necessária',
      message:
        'Os navegadores de celular só liberam a câmera traseira em endereços seguros (HTTPS).',
      tip: 'Abra esta página por um link HTTPS para ativar a realidade aumentada.',
    };
  }

  const name = error instanceof DOMException ? error.name : '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      code: 'PERMISSION_DENIED',
      title: 'Permissão de câmera recusada',
      message:
        'Precisamos do acesso à câmera traseira para reconhecer a fotografia do casal.',
      tip: 'Toque no ícone de cadeado ou configurações na barra do navegador, permita a câmera e toque em "Tentar novamente".',
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      code: 'NOT_FOUND',
      title: 'Nenhuma câmera encontrada',
      message:
        'Não foi possível detectar uma câmera disponível neste dispositivo.',
      tip: 'Verifique se o aparelho possui câmera conectada ou acesse pelo celular.',
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      code: 'IN_USE',
      title: 'Câmera ocupada por outro aplicativo',
      message:
        'Outro aplicativo ou aba está utilizando a câmera neste momento.',
      tip: 'Feche outros apps que usam a câmera e toque em "Tentar novamente".',
    };
  }

  return {
    code: 'UNSUPPORTED',
    title: 'Não foi possível iniciar a câmera',
    message:
      'Seu navegador não respondeu ao pedido de vídeo para a câmera traseira.',
    tip: 'Recomendamos abrir no Chrome (Android) ou Safari (iOS) atualizado em HTTPS.',
  };
}

/**
 * Solicita permissão real para a câmera traseira antes de iniciar o MindAR,
 * liberando o stream de verificação imediatamente para evitar conflito de hardware.
 */
export async function requestRearCameraAccess(): Promise<
  {ok: true} | {ok: false; error: CameraErrorInfo}
> {
  if (!window.isSecureContext) {
    return {ok: false, error: mapCameraError(null)};
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED',
        title: 'Navegador sem suporte à câmera',
        message:
          'Este navegador não oferece suporte à API de câmera (MediaDevices).',
        tip: 'Abra o link no Safari (iOS) ou Google Chrome (Android).',
      },
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {facingMode: {ideal: 'environment'}},
      audio: false,
    });
    stream.getTracks().forEach((track) => track.stop());
    return {ok: true};
  } catch (err) {
    return {ok: false, error: mapCameraError(err)};
  }
}

/**
 * Garante a liberação de quaisquer streams de vídeo residuais dentro de um contêiner AR.
 */
export function releaseVideoStreamsInContainer(container: HTMLElement | null): void {
  if (!container) return;
  const videos = container.querySelectorAll('video');
  videos.forEach((video) => {
    const srcObject = video.srcObject as MediaStream | null;
    if (srcObject) {
      srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    video.remove();
  });
}
