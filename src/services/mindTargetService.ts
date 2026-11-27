import {DEFAULT_EXPERIENCE_CONTENT} from '../config/experienceContent';
import {
  TARGET_CACHE_DB,
  TARGET_CACHE_KEY,
  TARGET_CACHE_STORE,
} from '../constants';
import type {TargetSourceInfo} from '../types';

function openCacheDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(TARGET_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TARGET_CACHE_STORE)) {
        db.createObjectStore(TARGET_CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readCachedMindBytes(key: string): Promise<Uint8Array | null> {
  const db = await openCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(TARGET_CACHE_STORE, 'readonly');
      const req = tx.objectStore(TARGET_CACHE_STORE).get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (result instanceof Uint8Array) {
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          resolve(new Uint8Array(result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeCachedMindBytes(key: string, bytes: Uint8Array): Promise<void> {
  const db = await openCacheDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(TARGET_CACHE_STORE, 'readwrite');
      tx.objectStore(TARGET_CACHE_STORE).put(bytes, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function checkPrecompiledMindUrl(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, {method: 'GET', cache: 'no-store'});
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) return false;
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > 256;
  } catch {
    return false;
  }
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Não foi possível carregar a imagem de referência: ${src}`));
    img.src = src;
  });
}

function downscaleForMindCompilation(
  img: HTMLImageElement,
  maxDim = 900
): HTMLImageElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const longest = Math.max(w, h);
  if (longest <= maxDim) return img;
  const scale = maxDim / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const resized = new Image();
  resized.width = canvas.width;
  resized.height = canvas.height;
  resized.src = canvas.toDataURL('image/jpeg', 0.92);
  return resized;
}

export async function compileImageUrlToMindBytes(
  imageUrl: string,
  onProgress?: (percent: number) => void
): Promise<{bytes: Uint8Array; aspectRatio: number}> {
  const CompilerCtor = window.MINDAR?.IMAGE?.Compiler;
  if (!CompilerCtor) {
    throw new Error(
      'O compilador MindAR ainda não foi inicializado neste navegador.'
    );
  }

  const rawImg = await loadHtmlImage(imageUrl);
  const aspectRatio =
    (rawImg.naturalHeight || rawImg.height) /
    Math.max(1, rawImg.naturalWidth || rawImg.width);
  const preparedImg = downscaleForMindCompilation(rawImg);
  if (!preparedImg.complete) {
    await new Promise<void>((resolve) => {
      preparedImg.onload = () => resolve();
      preparedImg.onerror = () => resolve();
    });
  }

  const compiler = new CompilerCtor();
  await compiler.compileImageTargets([preparedImg], (progress) => {
    onProgress?.(Math.min(100, Math.max(0, Math.round(progress))));
  });
  const exported = await compiler.exportData();
  const bytes =
    exported instanceof Uint8Array ? exported : new Uint8Array(exported);
  return {bytes, aspectRatio};
}

export async function measureImageAspect(imageUrl: string): Promise<number> {
  try {
    const img = await loadHtmlImage(imageUrl);
    return (
      (img.naturalHeight || img.height) /
      Math.max(1, img.naturalWidth || img.width)
    );
  } catch {
    return 0.75;
  }
}

/**
 * Resolve o alvo .mind real para o MindAR a partir da configuração:
 * 1) Se o usuário escolheu um arquivo .mind local, usa diretamente.
 * 2) Se escolheu uma foto local, compila em tempo real via MindAR.
 * 3) Caso contrário, verifica arquivos pré-compilados (/targets/casal.mind, /targets/teste-casal.mind).
 * 4) Por fim, compila a imagem de teste padrão (/targets/teste-casal.jpg) e salva no cache IndexedDB.
 */
export async function resolveExperienceMindTarget(
  options: {
    targetImageUrl?: string;
    precompiledMindPaths?: string[];
    customMindFile?: File;
    customImageFile?: File;
  },
  onProgress?: (percent: number, stage: string) => void
): Promise<TargetSourceInfo> {
  const previewUrl =
    options.targetImageUrl || DEFAULT_EXPERIENCE_CONTENT.targetImageUrl;
  const mindPaths =
    options.precompiledMindPaths ||
    DEFAULT_EXPERIENCE_CONTENT.precompiledMindPaths;

  if (options.customMindFile) {
    onProgress?.(100, 'Arquivo .mind personalizado pronto');
    const aspectRatio = await measureImageAspect(previewUrl);
    return {
      mindUrl: URL.createObjectURL(options.customMindFile),
      label: `Arquivo .mind: ${options.customMindFile.name}`,
      origin: 'custom-mind',
      previewImageUrl: previewUrl,
      aspectRatio,
    };
  }

  if (options.customImageFile) {
    onProgress?.(20, 'Compilando fotografia selecionada para MindAR...');
    return createTargetFromImageFile(options.customImageFile, (pct) => {
      onProgress?.(
        20 + Math.round(pct * 0.78),
        'Extraindo pontos da fotografia...'
      );
    });
  }

  onProgress?.(10, 'Verificando arquivo .mind de referência...');
  const aspectRatio = await measureImageAspect(previewUrl);

  for (const path of mindPaths) {
    const exists = await checkPrecompiledMindUrl(path);
    if (exists) {
      onProgress?.(100, 'Alvo .mind carregado');
      return {
        mindUrl: path,
        label:
          path.endsWith('/targets/casal.mind')
            ? 'Alvo oficial do casal (.mind)'
            : 'Alvo de teste pré-compilado (.mind)',
        origin: 'precompiled-mind',
        previewImageUrl: previewUrl,
        aspectRatio,
      };
    }
  }

  const cached = await readCachedMindBytes(TARGET_CACHE_KEY);
  if (cached && cached.byteLength > 256) {
    const blobUrl = URL.createObjectURL(
      new Blob([cached.slice()], {type: 'application/octet-stream'})
    );
    onProgress?.(100, 'Alvo .mind de teste pronto');
    return {
      mindUrl: blobUrl,
      label: 'Imagem de teste compilada (.mind)',
      origin: 'compiled-test-image',
      previewImageUrl: previewUrl,
      aspectRatio,
      compiledBytes: cached,
    };
  }

  onProgress?.(20, 'Compilando imagem de teste para rastreamento MindAR...');
  const compiled = await compileImageUrlToMindBytes(previewUrl, (pct) => {
    onProgress?.(
      20 + Math.round(pct * 0.78),
      'Extraindo pontos da imagem de teste...'
    );
  });
  await writeCachedMindBytes(TARGET_CACHE_KEY, compiled.bytes);

  const blobUrl = URL.createObjectURL(
    new Blob([compiled.bytes.slice()], {type: 'application/octet-stream'})
  );
  onProgress?.(100, 'Alvo .mind de teste pronto');
  return {
    mindUrl: blobUrl,
    label: 'Imagem de teste compilada (.mind)',
    origin: 'compiled-test-image',
    previewImageUrl: previewUrl,
    aspectRatio: compiled.aspectRatio,
    compiledBytes: compiled.bytes,
  };
}

export function createTargetFromMindFile(
  file: File,
  previewImageUrl = DEFAULT_EXPERIENCE_CONTENT.targetImageUrl,
  aspectRatio = 0.75
): TargetSourceInfo {
  const blobUrl = URL.createObjectURL(file);
  return {
    mindUrl: blobUrl,
    label: `Arquivo .mind: ${file.name}`,
    origin: 'custom-mind',
    previewImageUrl,
    aspectRatio,
  };
}

export async function createTargetFromImageFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<TargetSourceInfo> {
  const previewUrl = URL.createObjectURL(file);
  const compiled = await compileImageUrlToMindBytes(previewUrl, onProgress);
  const mindUrl = URL.createObjectURL(
    new Blob([compiled.bytes.slice()], {type: 'application/octet-stream'})
  );
  return {
    mindUrl,
    label: `Foto compilada: ${file.name}`,
    origin: 'custom-image',
    previewImageUrl: previewUrl,
    aspectRatio: compiled.aspectRatio,
    compiledBytes: compiled.bytes,
  };
}

export function downloadMindBytes(
  bytes: Uint8Array,
  filename = 'teste-casal.mind'
): void {
  const blob = new Blob([bytes.slice()], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
