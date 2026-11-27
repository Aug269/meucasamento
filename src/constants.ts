export const APP_TITLE = 'Nossa História';
export const APP_SUBTITLE = 'Uma história escrita por dois corações';
export const AR_LOVE_MESSAGE = 'Nossa história é o meu lugar favorito';

const publicBase = import.meta.env.BASE_URL;
const publicAsset = (path: string) => `${publicBase}${path.replace(/^\/+/, '')}`;

/**
 * Caminhos preparados para o arquivo .mind compilado do casal.
 * Ao gerar o arquivo definitivo (por exemplo, casal.mind), basta colocá-lo em public/targets/casal.mind.
 */
export const PRECOMPILED_MIND_PATHS = [
  publicAsset('targets/casal.mind'),
  publicAsset('targets/teste-casal.mind'),
] as const;

export const TEST_TARGET_IMAGE_PATH = publicAsset('targets/teste-casal.jpg');
export const TARGET_CACHE_DB = 'nossa-historia-mind-cache';
export const TARGET_CACHE_STORE = 'compiled-targets';
export const TARGET_CACHE_KEY = 'teste-casal-v2';
