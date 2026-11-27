import {AR_LOVE_MESSAGE} from '../constants';

let componentsRegistered = false;

interface HeartParticle {
  mesh: unknown;
  baseX: number;
  baseZ: number;
  speed: number;
  phase: number;
  driftAmp: number;
  rotSpeed: number;
  scale: number;
  progress: number;
}

interface SparkleParticle {
  mesh: unknown;
  angle: number;
  radius: number;
  baseY: number;
  speed: number;
  phase: number;
}

/**
 * Registra componentes A-Frame customizados para a camada AR:
 * - `ar-video-surface`: vincula diretamente um <video> HTML5 a um plano proporcional via THREE.VideoTexture.
 * - `wedding-hearts`: corações 3D delicados que flutuam suavemente enquanto o alvo é rastreado.
 * - `wedding-sparkles`: partículas douradas sutis ao redor da moldura.
 * - `wedding-banner`: faixa espacial com tipografia romântica e acentuação perfeita.
 */
export function ensureWeddingAframeComponents(): void {
  const AFRAME = window.AFRAME;
  if (!AFRAME || !AFRAME.THREE) return;

  // Protege o MindAR contra erros ao desmontar a cena antes de controller/video inicializarem
  const mindarSystem = AFRAME.systems?.['mindar-image-system'];
  const proto = mindarSystem?.prototype as
    | {
        __safePatched?: boolean;
        pause?: (keepVideo?: boolean) => void;
        stop?: () => void;
        video?: HTMLVideoElement | null;
        controller?: {
          stopProcessVideo?: () => void;
          dispose?: () => void;
        } | null;
      }
    | undefined;

  if (proto && !proto.__safePatched) {
    proto.__safePatched = true;
    proto.pause = function safePause(keepVideo = false) {
      try {
        if (!keepVideo && this.video && typeof this.video.pause === 'function') {
          this.video.pause();
        }
        if (this.controller && typeof this.controller.stopProcessVideo === 'function') {
          this.controller.stopProcessVideo();
        }
      } catch {
        // Ignora pausa durante desmontagem precoce
      }
    };
    proto.stop = function safeStop() {
      try {
        this.pause?.(false);
        const stream = this.video?.srcObject as MediaStream | null | undefined;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (this.video && typeof this.video.remove === 'function') {
          this.video.remove();
        }
        if (this.controller && typeof this.controller.dispose === 'function') {
          this.controller.dispose();
        }
      } catch {
        // Ignora parada durante desmontagem precoce
      }
    };
  }

  if (componentsRegistered) return;

  const THREE = AFRAME.THREE;

  if (!AFRAME.components['ar-video-surface']) {
    AFRAME.registerComponent('ar-video-surface', {
      schema: {
        videoId: {type: 'string', default: 'ar-wedding-video'},
        width: {type: 'number', default: 0.96},
        height: {type: 'number', default: 0.72},
      },
      init(this: {
        el: HTMLElement & {
          object3D: {
            add: (obj: unknown) => void;
            remove: (obj: unknown) => void;
          };
        };
        data: {videoId: string; width: number; height: number};
        videoEl: HTMLVideoElement | null;
        texture: InstanceType<typeof THREE.VideoTexture> | null;
        geometry: InstanceType<typeof THREE.PlaneGeometry> | null;
        material: InstanceType<typeof THREE.MeshBasicMaterial> | null;
        mesh: InstanceType<typeof THREE.Mesh> | null;
      }) {
        const videoEl = document.getElementById(
          this.data.videoId
        ) as HTMLVideoElement | null;
        this.videoEl = videoEl;

        const geometry = new THREE.PlaneGeometry(
          this.data.width,
          this.data.height
        );
        this.geometry = geometry;

        if (videoEl) {
          const texture = new THREE.VideoTexture(videoEl);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          this.texture = texture;

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          this.material = material;
          const mesh = new THREE.Mesh(geometry, material);
          this.mesh = mesh;
          this.el.object3D.add(mesh);
        }
      },
      update(
        this: {
          data: {videoId: string; width: number; height: number};
          geometry: InstanceType<typeof THREE.PlaneGeometry> | null;
          mesh: InstanceType<typeof THREE.Mesh> | null;
        },
        oldData: {width?: number; height?: number}
      ) {
        if (
          this.mesh &&
          (oldData.width !== this.data.width ||
            oldData.height !== this.data.height)
        ) {
          const nextGeo = new THREE.PlaneGeometry(
            this.data.width,
            this.data.height
          );
          this.mesh.geometry = nextGeo;
          this.geometry?.dispose();
          this.geometry = nextGeo;
        }
      },
      tick(this: {
        videoEl: HTMLVideoElement | null;
        texture: InstanceType<typeof THREE.VideoTexture> | null;
      }) {
        if (
          this.texture &&
          this.videoEl &&
          this.videoEl.readyState >= 2 &&
          !this.videoEl.paused
        ) {
          this.texture.needsUpdate = true;
        }
      },
      remove(this: {
        el: {object3D: {remove: (obj: unknown) => void}};
        mesh: InstanceType<typeof THREE.Mesh> | null;
        texture: InstanceType<typeof THREE.VideoTexture> | null;
        material: InstanceType<typeof THREE.MeshBasicMaterial> | null;
        geometry: InstanceType<typeof THREE.PlaneGeometry> | null;
      }) {
        if (this.mesh) this.el.object3D.remove(this.mesh);
        this.texture?.dispose();
        this.material?.dispose();
        this.geometry?.dispose();
      },
    });
  }

  if (!AFRAME.components['wedding-hearts']) {
    AFRAME.registerComponent('wedding-hearts', {
      schema: {
        count: {type: 'number', default: 12},
      },
      init(this: {
        el: HTMLElement & {
          object3D: {
            add: (obj: unknown) => void;
            remove: (obj: unknown) => void;
            visible: boolean;
            parent?: {visible: boolean};
          };
        };
        data: {count: number};
        particles: HeartParticle[];
        geometry: {dispose: () => void} | null;
        materials: Array<InstanceType<typeof THREE.MeshStandardMaterial>>;
      }) {
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0.015);
        heartShape.bezierCurveTo(0, 0.015, -0.025, 0.045, -0.045, 0.025);
        heartShape.bezierCurveTo(-0.065, 0.005, -0.04, -0.03, 0, -0.055);
        heartShape.bezierCurveTo(0.04, -0.03, 0.065, 0.005, 0.045, 0.025);
        heartShape.bezierCurveTo(0.025, 0.045, 0, 0.015, 0, 0.015);

        const geometry = new THREE.ExtrudeGeometry(heartShape, {
          depth: 0.01,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.003,
          bevelThickness: 0.003,
        });
        geometry.center();
        this.geometry = geometry;

        const palette = [0xe89aa9, 0xf4c7d0, 0xd4ad68, 0xf8e2dc];
        this.materials = palette.map(
          (hex) =>
            new THREE.MeshStandardMaterial({
              color: hex,
              roughness: 0.35,
              metalness: 0.22,
              transparent: true,
              opacity: 0.9,
            })
        );

        this.particles = [];
        for (let i = 0; i < this.data.count; i++) {
          const mat = this.materials[i % this.materials.length].clone();
          const mesh = new THREE.Mesh(geometry, mat);
          const angle =
            (i / this.data.count) * Math.PI * 2 + Math.random() * 0.4;
          const radius = 0.38 + Math.random() * 0.24;
          const particle: HeartParticle = {
            mesh,
            baseX: Math.cos(angle) * radius,
            baseZ: 0.05 + Math.random() * 0.16,
            speed: 0.14 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2,
            driftAmp: 0.035 + Math.random() * 0.035,
            rotSpeed: (Math.random() - 0.5) * 1.2,
            scale: 0.45 + Math.random() * 0.5,
            progress: Math.random(),
          };
          mesh.scale.setScalar(particle.scale);
          this.el.object3D.add(mesh);
          this.particles.push(particle);
        }
      },
      tick(
        this: {
          el: {object3D: {visible: boolean; parent?: {visible: boolean}}};
          particles: HeartParticle[];
        },
        time: number,
        timeDelta: number
      ) {
        const parentVisible = this.el.object3D.parent?.visible ?? true;
        if (!this.el.object3D.visible || !parentVisible) return;

        const dt = Math.min(timeDelta / 1000, 0.05);
        const t = time / 1000;

        for (const p of this.particles) {
          p.progress += p.speed * dt;
          if (p.progress > 1) p.progress -= 1;

          const y = -0.32 + p.progress * 0.92;
          const x = p.baseX + Math.sin(t * 1.5 + p.phase) * p.driftAmp;
          const z = p.baseZ + Math.cos(t * 1.2 + p.phase) * 0.025;

          const mesh = p.mesh as {
            position: {set: (x: number, y: number, z: number) => void};
            rotation: {y: number; z: number};
            scale: {setScalar: (s: number) => void};
            material: {opacity: number};
          };

          mesh.position.set(x, y, z);
          mesh.rotation.y += p.rotSpeed * dt;
          mesh.rotation.z = Math.sin(t * 2 + p.phase) * 0.12;

          const fadeIn = Math.min(p.progress * 4, 1);
          const fadeOut = Math.min((1 - p.progress) * 3.5, 1);
          mesh.material.opacity = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.88;
          mesh.scale.setScalar(p.scale * (0.78 + 0.22 * fadeIn));
        }
      },
      remove(this: {
        el: {object3D: {remove: (obj: unknown) => void}};
        particles: HeartParticle[];
        geometry: {dispose: () => void} | null;
        materials: Array<{dispose: () => void}>;
      }) {
        for (const p of this.particles) {
          this.el.object3D.remove(p.mesh);
          (p.mesh as {material: {dispose: () => void}}).material.dispose();
        }
        this.particles = [];
        this.geometry?.dispose();
        this.materials.forEach((m) => m.dispose());
      },
    });
  }

  if (!AFRAME.components['wedding-sparkles']) {
    AFRAME.registerComponent('wedding-sparkles', {
      schema: {
        count: {type: 'number', default: 18},
      },
      init(this: {
        el: HTMLElement & {
          object3D: {
            add: (obj: unknown) => void;
            remove: (obj: unknown) => void;
          };
        };
        data: {count: number};
        sparkles: SparkleParticle[];
        geometry: InstanceType<typeof THREE.SphereGeometry> | null;
        material: InstanceType<typeof THREE.MeshBasicMaterial> | null;
      }) {
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: 0xe6c78c,
          transparent: true,
          opacity: 0.78,
        });
        this.geometry = geometry;
        this.material = material;
        this.sparkles = [];

        for (let i = 0; i < this.data.count; i++) {
          const mat = material.clone();
          const mesh = new THREE.Mesh(geometry, mat);
          const sp: SparkleParticle = {
            mesh,
            angle: (i / this.data.count) * Math.PI * 2,
            radius: 0.48 + Math.random() * 0.22,
            baseY: (Math.random() - 0.5) * 0.75,
            speed: 0.22 + Math.random() * 0.25,
            phase: Math.random() * Math.PI * 2,
          };
          this.el.object3D.add(mesh);
          this.sparkles.push(sp);
        }
      },
      tick(
        this: {
          el: {object3D: {visible: boolean; parent?: {visible: boolean}}};
          sparkles: SparkleParticle[];
        },
        time: number
      ) {
        const parentVisible = this.el.object3D.parent?.visible ?? true;
        if (!this.el.object3D.visible || !parentVisible) return;

        const t = time / 1000;
        for (const s of this.sparkles) {
          const mesh = s.mesh as {
            position: {set: (x: number, y: number, z: number) => void};
            material: {opacity: number};
          };
          const a = s.angle + t * s.speed * 0.25;
          const x = Math.cos(a) * s.radius;
          const y = s.baseY + Math.sin(t * 1.1 + s.phase) * 0.06;
          const z = 0.04 + Math.sin(t * 0.9 + s.phase) * 0.05;
          mesh.position.set(x, y, z);
          mesh.material.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.4 + s.phase));
        }
      },
      remove(this: {
        el: {object3D: {remove: (obj: unknown) => void}};
        sparkles: SparkleParticle[];
        geometry: InstanceType<typeof THREE.SphereGeometry> | null;
        material: InstanceType<typeof THREE.MeshBasicMaterial> | null;
      }) {
        for (const s of this.sparkles) {
          this.el.object3D.remove(s.mesh);
          (s.mesh as {material: {dispose: () => void}}).material.dispose();
        }
        this.sparkles = [];
        this.geometry?.dispose();
        this.material?.dispose();
      },
    });
  }

  if (!AFRAME.components['wedding-banner']) {
    AFRAME.registerComponent('wedding-banner', {
      schema: {
        message: {type: 'string', default: AR_LOVE_MESSAGE},
      },
      init(this: {
        el: {object3D: {add: (obj: unknown) => void; remove: (obj: unknown) => void}};
        data: {message: string};
        mesh: unknown;
        texture: {dispose: () => void} | null;
        material: {dispose: () => void} | null;
        geometry: {dispose: () => void} | null;
      }) {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const radius = 32;
          ctx.beginPath();
          ctx.roundRect(18, 18, canvas.width - 36, canvas.height - 36, radius);
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, 'rgba(255, 250, 245, 0.95)');
          grad.addColorStop(1, 'rgba(249, 236, 238, 0.94)');
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#c9a35e';
          ctx.stroke();

          ctx.fillStyle = '#3a2829';
          ctx.font = 'italic 600 54px "Cormorant Garamond", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            this.data.message || AR_LOVE_MESSAGE,
            canvas.width / 2,
            canvas.height / 2 + 2
          );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        const geometry = new THREE.PlaneGeometry(1.06, 0.2);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);

        this.texture = texture;
        this.geometry = geometry;
        this.material = material;
        this.mesh = mesh;
        this.el.object3D.add(mesh);
      },
      remove(this: {
        el: {object3D: {remove: (obj: unknown) => void}};
        mesh: unknown;
        texture: {dispose: () => void} | null;
        material: {dispose: () => void} | null;
        geometry: {dispose: () => void} | null;
      }) {
        if (this.mesh) this.el.object3D.remove(this.mesh);
        this.texture?.dispose();
        this.material?.dispose();
        this.geometry?.dispose();
      },
    });
  }

  componentsRegistered = true;
}
