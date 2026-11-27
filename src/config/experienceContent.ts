import testTargetImg from '../assets/images/test_wedding_target_1795781380607.jpg';
import type {ExperienceContentConfig} from '../types';

const publicBase = import.meta.env.BASE_URL;
const publicAsset = (path: string) => `${publicBase}${path.replace(/^\/+/, '')}`;

/**
 * Configuração central da experiência "Nossa História — Um Amor que Ganha Vida".
 * Para personalizar com os arquivos definitivos do casal, substitua os caminhos
 * abaixo em /public/targets/ e /public/media/ ou altere os textos diretamente aqui.
 */
export const DEFAULT_EXPERIENCE_CONTENT: ExperienceContentConfig = {
  appTitle: 'Nossa História',
  openingQuote: 'Algumas histórias merecem ganhar vida.',
  openingButtonLabel: 'Revelar nossa história',
  instructionsTitle: 'Antes de apontar a câmera',
  instructionsLead:
    'Ao avançar, seu navegador solicitará permissão para usar a câmera traseira. Posicione a fotografia física do casamento em um local bem iluminado e enquadre-a por completo.',
  targetImageUrl: testTargetImg,
  precompiledMindPaths: [publicAsset('targets/casal.mind'), publicAsset('targets/teste-casal.mind')],
  videoUrl: publicAsset('media/video-teste.mp4'),
  videoLabel: 'Vídeo de teste (Exemplo demonstrativo)',
  isTestVideo: true,
  backgroundMusicUrl: publicAsset('media/musica-teste.mp3'),
  backgroundMusicLabel: 'Melodia ambiente de teste',
  backgroundMusicVolume: 0.25,
  closingQuote: 'Eu escolheria você novamente, em todas as vidas.',
  closingSubtitle: 'Uma homenagem em realidade aumentada para celebrar o amor.',
};
