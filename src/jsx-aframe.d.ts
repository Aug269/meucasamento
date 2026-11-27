import 'react';

interface AFrameSceneElement extends HTMLElement {
  hasLoaded?: boolean;
  systems?: Record<string, unknown>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': React.DetailedHTMLProps<
        React.HTMLAttributes<AFrameSceneElement>,
        AFrameSceneElement
      > & {
        'mindar-image'?: string;
        'color-space'?: string;
        renderer?: string;
        'vr-mode-ui'?: string;
        'device-orientation-permission-ui'?: string;
        embedded?: string | boolean;
      };
      'a-assets': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'a-camera': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        position?: string;
        'look-controls'?: string;
        'wasd-controls'?: string;
      };
      'a-entity': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'mindar-image-target'?: string;
        position?: string;
        rotation?: string;
        scale?: string;
        'ar-video-surface'?: string;
        'wedding-hearts'?: string;
        'wedding-sparkles'?: string;
        'wedding-banner'?: string;
      };
      'a-plane': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        position?: string;
        rotation?: string;
        width?: string | number;
        height?: string | number;
        color?: string;
        material?: string;
        opacity?: string | number;
      };
    }
  }
}
