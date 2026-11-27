export const APP_TITLE = 'Nossa História';
export const APP_SUBTITLE = 'Uma história escrita por dois corações';
export const AR_LOVE_MESSAGE = 'Nossa história é o meu lugar favorito';

/**
 * Caminhos preparados para o arquivo .mind compilado do casal.
 * Ao gerar o arquivo definitivo (por exemplo, casal.mind), basta colocá-lo em public/targets/casal.mind.
 */
export const PRECOMPILED_MIND_PATHS = [
  '/targets/casal.mind',
  '/targets/teste-casal.mind',
] as const;

export const TEST_TARGET_IMAGE_PATH = '/targets/teste-casal.jpg';
export const TARGET_CACHE_DB = 'nossa-historia-mind-cache';
export const TARGET_CACHE_STORE = 'compiled-targets';
export const TARGET_CACHE_KEY = 'teste-casal-v2';
