declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

interface Window {
  AFRAME?: {
    THREE: typeof import('three');
    components: Record<string, unknown>;
    systems?: Record<
      string,
      {
        prototype?: Record<string, (...args: unknown[]) => unknown>;
      }
    >;
    registerComponent: (name: string, definition: Record<string, unknown>) => void;
  };
  MINDAR?: {
    IMAGE?: {
      Compiler: new () => {
        compileImageTargets: (
          images: HTMLImageElement[],
          onProgress: (progress: number) => void
        ) => Promise<unknown>;
        exportData: () => Promise<Uint8Array>;
      };
    };
  };
}
