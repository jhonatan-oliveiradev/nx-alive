import * as THREE from "three";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import {
  parseCharacterDocument,
  resolveAnimation,
  sampleAnimation,
  type CharacterDocument,
  type Pose,
} from "@nx-alive/core";
import { createCharacterModel } from "./model3d";
export type ThreeOptions = {
  expression?: string | undefined;
  animation?: string | undefined;
  playing?: boolean | undefined;
  guides?: boolean | undefined;
  interactive?: boolean | undefined;
  zoom?: number | undefined;
  ambient?: boolean | undefined;
  background?: string | undefined;
  onPoseChange?: ((pose: Pose) => void) | undefined;
  onComplete?: (() => void) | undefined;
  onError?: ((message: string) => void) | undefined;
};
const radians = THREE.MathUtils.degToRad;
export function rotationAfterDrag(
  pose: Pose,
  dx: number,
  dy: number,
): Pick<Pose, "rotationX" | "rotationY" | "rotationZ"> {
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      radians(pose.rotationX),
      radians(pose.rotationY),
      radians(pose.rotationZ),
      "YXZ",
    ),
  );
  const delta = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(dy * 0.008, dx * 0.008, 0, "YXZ"),
  );
  q.premultiply(delta);
  const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
  return {
    rotationX: THREE.MathUtils.radToDeg(e.x),
    rotationY: THREE.MathUtils.radToDeg(e.y),
    rotationZ: THREE.MathUtils.radToDeg(e.z),
  };
}
/** Standalone Three.js player; owns resources, listeners and loop. */
export function mountCharacter(
  element: HTMLElement,
  input: unknown,
  initial: ThreeOptions = {},
) {
  let d = parseCharacterDocument(input),
    options = { ...initial };
  let model = createCharacterModel(
    d,
    options.expression ?? resolveAnimation(d, options.animation)?.expression,
  );
  const surface = document.createElement("canvas");
  const context = surface.getContext("webgl2", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const renderer: THREE.WebGLRenderer | SVGRenderer = context
    ? new THREE.WebGLRenderer({
        canvas: surface,
        context,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      })
    : new SVGRenderer();
  const webgl = renderer instanceof THREE.WebGLRenderer;
  if (renderer instanceof THREE.WebGLRenderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
  } else renderer.setPrecision(2);
  const canvas = renderer.domElement as unknown as HTMLElement;
  canvas.setAttribute("class", "nx-three-canvas");
  canvas.setAttribute("data-renderer", webgl ? "webgl" : "vector-3d");
  canvas.style.cssText =
    "display:block;width:100%;height:100%;touch-action:none;outline-offset:-4px";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    `${d.name}, interactive 3D character. Drag to rotate; arrow keys rotate; Home resets.`,
  );
  element.append(canvas);
  const compatibility = document.createElement("span");
  compatibility.className = "compatibility-label";
  compatibility.textContent = "Basic shading";
  compatibility.title =
    "WebGL is unavailable. The same 3D geometry is rendered with simplified shading.";
  if (!webgl) element.append(compatibility);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  camera.position.set(0, 0.12, 8);
  camera.lookAt(0, 0, 0);
  const ambient = new THREE.HemisphereLight("#eef3ff", "#77718e", 2.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight("#fff5e9", 3.4);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#bdbeff", 2.4);
  rim.position.set(4, 2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight("#ffffff", 0.7);
  fill.position.set(2, -1, 4);
  scene.add(fill);
  if (!webgl) {
    key.intensity = 0.55;
    rim.intensity = 0.25;
    fill.intensity = 0.1;
    scene.add(new THREE.AmbientLight("#ffffff", 0.45));
  }
  const pivot = new THREE.Group(),
    motion = new THREE.Group();
  pivot.name = "orientation";
  motion.name = "motion";
  pivot.add(motion);
  scene.add(pivot);
  motion.add(model.root);
  const gizmo = document.createElement("canvas");
  gizmo.className = "orientation-gizmo";
  gizmo.width = 192;
  gizmo.height = 192;
  gizmo.setAttribute("aria-hidden", "true");
  gizmo.style.cssText =
    "position:absolute;right:20px;bottom:16px;width:78px;height:78px;pointer-events:none";
  element.append(gizmo);
  const gc = gizmo.getContext("2d");
  let elapsed = 0,
    last = 0,
    completed = false,
    drag: { x: number; y: number; pose: Pose; id: number } | null = null;
  let visible = true,
    dirty = true,
    destroyed = false;
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const size = () => {
    const w = element.clientWidth || 480,
      h = element.clientHeight || 480;
    if (renderer instanceof THREE.WebGLRenderer) renderer.setSize(w, h, false);
    else renderer.setSize(w, h);
    const extent = 2.65 / (options.zoom ?? 1);
    camera.left = (-extent * w) / h;
    camera.right = (extent * w) / h;
    camera.top = extent;
    camera.bottom = -extent;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const observer = new ResizeObserver(size);
  observer.observe(element);
  size();
  const io = new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? true;
    dirty = true;
  });
  io.observe(element);
  const orient = () => {
    pivot.rotation.set(
      radians(d.pose.rotationX),
      radians(d.pose.rotationY),
      radians(d.pose.rotationZ),
      "YXZ",
    );
    pivot.position.set(d.pose.x / 100, -d.pose.y / 100, 0);
    pivot.scale.set(
      d.pose.scale * d.pose.width,
      d.pose.scale * d.pose.height,
      d.pose.scale,
    );
  };
  const paintGizmo = () => {
    if (!gc) return;
    gc.clearRect(0, 0, 192, 192);
    gc.strokeStyle = "#8d899d55";
    gc.lineWidth = 2;
    gc.beginPath();
    gc.arc(96, 96, 66, 0, Math.PI * 2);
    gc.stroke();
    const axes = [
      { v: new THREE.Vector3(1, 0, 0), c: "#ad5070", t: "X" },
      { v: new THREE.Vector3(0, 1, 0), c: "#348975", t: "Y" },
      { v: new THREE.Vector3(0, 0, 1), c: "#6866c8", t: "Z" },
    ]
      .map((a) => ({ ...a, v: a.v.applyQuaternion(pivot.quaternion) }))
      .sort((a, b) => a.v.z - b.v.z);
    for (const a of axes) {
      const x = 96 + a.v.x * 58,
        y = 96 - a.v.y * 58;
      gc.strokeStyle = a.c;
      gc.lineWidth = 3;
      gc.beginPath();
      gc.moveTo(96, 96);
      gc.lineTo(x, y);
      gc.stroke();
      gc.fillStyle = a.c;
      gc.beginPath();
      gc.arc(x, y, 13, 0, Math.PI * 2);
      gc.fill();
      gc.fillStyle = "white";
      gc.font = "bold 15px sans-serif";
      gc.textAlign = "center";
      gc.textBaseline = "middle";
      gc.fillText(a.t, x, y);
    }
  };
  function render(time: number) {
    const dt = last ? Math.min(time - last, 64) : 0;
    last = time;
    if (!visible || document.hidden) return;
    const active = options.playing !== false && !media.matches;
    if (!dirty && !active) return;
    if (active) elapsed += dt;
    const animation = resolveAnimation(d, options.animation);
    if (animation) {
      const f = sampleAnimation(d, options.animation ?? "", elapsed);
      motion.position.set(f.x / 100, -f.y / 100, 0);
      motion.rotation.z = -radians(f.rotation);
      motion.scale.set(f.scaleX, f.scaleY, 1);
      if (!animation.loop && elapsed >= animation.durationMs && !completed) {
        completed = true;
        options.onComplete?.();
      }
    } else {
      motion.position.set(0, 0, 0);
      motion.rotation.z = 0;
      motion.scale.setScalar(1);
      if (options.ambient !== false && active)
        motion.scale.y = 1 + Math.sin(elapsed / 900) * 0.008;
    }
    model.guides.visible = options.guides === true;
    if (renderer instanceof THREE.WebGLRenderer)
      renderer.setClearColor(
        options.background ?? "#000000",
        options.background ? 1 : 0,
      );
    orient();
    const visor = model.root.getObjectByName("visor");
    if (visor)
      visor.visible =
        webgl ||
        new THREE.Vector3(0, 0, 1).applyQuaternion(pivot.quaternion).z > 0;
    renderer.render(scene, camera);
    if (!webgl)
      canvas.style.backgroundColor = options.background ?? "transparent";
    paintGizmo();
    dirty = false;
  }
  let frame = 0,
    previousFrame = 0;
  const loop = (time: number) => {
    frame = requestAnimationFrame(loop);
    if (time - previousFrame >= (webgl ? 0 : 50)) {
      previousFrame = time;
      render(time);
    }
  };
  if (renderer instanceof THREE.WebGLRenderer)
    renderer.setAnimationLoop(render);
  else frame = requestAnimationFrame(loop);
  const move = (event: PointerEvent) => {
    if (!drag) return;
    d = {
      ...d,
      pose: {
        ...drag.pose,
        ...rotationAfterDrag(
          drag.pose,
          event.clientX - drag.x,
          event.clientY - drag.y,
        ),
      },
    };
    dirty = true;
  };
  const down = (event: PointerEvent) => {
    if (options.interactive === false || event.button !== 0 || drag) return;
    drag = {
      x: event.clientX,
      y: event.clientY,
      pose: { ...d.pose },
      id: event.pointerId,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const up = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    options.onPoseChange?.({ ...d.pose });
  };
  const keydown = (event: KeyboardEvent) => {
    if (options.interactive === false) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    d = {
      ...d,
      pose: {
        ...d.pose,
        ...(event.key === "Home"
          ? { rotationX: 0, rotationY: 0, rotationZ: 0 }
          : rotationAfterDrag(
              d.pose,
              event.key === "ArrowLeft"
                ? -25
                : event.key === "ArrowRight"
                  ? 25
                  : 0,
              event.key === "ArrowUp"
                ? -25
                : event.key === "ArrowDown"
                  ? 25
                  : 0,
            )),
      },
    };
    dirty = true;
    options.onPoseChange?.({ ...d.pose });
  };
  const lost = (event: Event) => {
    event.preventDefault();
    options.onError?.(
      "The 3D context was interrupted. Reload the preview to restore it.",
    );
  };
  canvas.style.cursor = options.interactive === false ? "default" : "grab";
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("webglcontextlost", lost);
  return {
    update(next: ThreeOptions, document?: unknown) {
      const previous = d;
      const previousOptions = options;
      if (document) {
        const nextDocument = parseCharacterDocument(document);
        d = drag ? { ...nextDocument, pose: d.pose } : nextDocument;
      }
      canvas.setAttribute(
        "aria-label",
        `${d.name}, interactive 3D character. Drag to rotate; arrow keys rotate; Home resets.`,
      );
      options = { ...options, ...next };
      const signature = (v: CharacterDocument, o: ThreeOptions) =>
        JSON.stringify([
          v.body,
          v.colors,
          v.face,
          v.expressions,
          o.expression ?? resolveAnimation(v, o.animation)?.expression,
        ]);
      if (signature(previous, previousOptions) !== signature(d, options)) {
        const nextModel = createCharacterModel(
          d,
          options.expression ??
            resolveAnimation(d, options.animation)?.expression,
        );
        motion.remove(model.root);
        model.dispose();
        model = nextModel;
        motion.add(model.root);
      }
      if (options.animation !== previousOptions.animation) {
        elapsed = 0;
        completed = false;
      }
      dirty = true;
      size();
    },
    restart() {
      elapsed = 0;
      completed = false;
      dirty = true;
    },
    async capture(background?: string) {
      const old = options;
      options = { ...options, background, guides: false, playing: false };
      dirty = true;
      try {
        render(last);
        let output: HTMLCanvasElement;
        if (renderer instanceof THREE.WebGLRenderer)
          output = renderer.domElement;
        else {
          output = document.createElement("canvas");
          output.width = Math.round(element.clientWidth * 2);
          output.height = Math.round(element.clientHeight * 2);
          const context = output.getContext("2d");
          if (!context) throw Error("PNG export is not available.");
          const source = new XMLSerializer().serializeToString(
            renderer.domElement,
          );
          const image = new Image();
          image.src =
            "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
          await image.decode();
          context.drawImage(image, 0, 0, output.width, output.height);
        }
        return await new Promise<Blob>((resolve, reject) =>
          output.toBlob((b) =>
            b ? resolve(b) : reject(Error("PNG capture failed.")),
          ),
        );
      } finally {
        options = old;
        dirty = true;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (renderer instanceof THREE.WebGLRenderer)
        renderer.setAnimationLoop(null);
      else cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("webglcontextlost", lost);
      model.dispose();
      if (renderer instanceof THREE.WebGLRenderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      compatibility.remove();
      canvas.remove();
      gizmo.remove();
    },
  };
}
export { parseCharacterDocument };
