import { motionPreferenceQuery } from "./motion-preference.ts";
import { atlases } from "./atlases.ts";
import { armPoints, lowerBodyPoints, sourceArmPoint } from "./anatomy.ts";

export interface HourglassOptions {
  progress: number;
  profile: "masculine" | "feminine";
  ink: string;
  motion: boolean;
  speed: number;
  grainSize: number;
  grainCount: number;
  widthScale: number;
}
interface Point {
  x: number;
  y: number;
  r: number;
  a: number;
}
interface FallingGrain {
  seed: number;
  phase: number;
  speed: number;
  drift: number;
  r: number;
}
const W = 1122, H = 1402;
// Crop the source label gutters while retaining the whole vessel and scattered sand.
const ART_Y = -8, ART_HEIGHT = 1337;
// Preserve the source artwork's transition curve and bounded backing surfaces.
const MAX_CANVAS_PIXELS = 4_000_000, BAND = 84;
const decoded = new Map<string, Point[]>();
let activeRenderers = 0;
const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
function decode(text: string): Point[] {
  const cached = decoded.get(text);
  if (cached) return cached;
  const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer), points: Point[] = [];
  for (let i = 0; i < bytes.length; i += 8) {
    points.push({
      x: view.getUint16(i, true) / 4,
      y: view.getUint16(i + 2, true) / 4,
      r: view.getUint16(i + 4, true) / 100,
      a: view.getUint16(i + 6, true) / 65535,
    });
  }
  decoded.set(text, points);
  return points;
}
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Hourglass requires a Canvas 2D context");
  return ctx;
}
const outer =
  "M414 45 C299 61 219 146 219 247 L219 310 C219 453 332 499 332 662 C332 807 219 846 219 999 L219 1111 C219 1185 267 1239 349 1243";
const topArc = "M414 45 C327 63 250 119 224 198";
const bottomArc = "M219 1111 C219 1170 254 1221 312 1237";
const mirror = "translate(1122 0) scale(-1 1)";

/** Height-driven atlas renderer. The host supplies its own accessible text and controls. */
export function mountHourglass(host: HTMLElement): {
  update(options: HourglassOptions): void;
  dispose(): void;
  diagnostics(): Record<string, unknown>;
} {
  const doc = host.ownerDocument, win = doc.defaultView;
  if (!win) throw new Error("Hourglass requires an attached document");
  const root = doc.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:relative;width:100%;height:100%;overflow:hidden;pointer-events:none;isolation:isolate;";
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  // No SVG IDs, text, filters, global styles, or custom-element registration.
  svg.innerHTML = `<g fill="none" stroke="currentColor">
    <g opacity=".07" stroke-width=".8" stroke-dasharray="1 5"><path d="M48 0V1402 M219 0V1402 M561 0V1402 M903 0V1402 M1074 0V1402 M0 45H1122 M0 310H1122 M0 737H1122 M0 1007H1122 M0 1254H1122"/></g>
    <g data-vessel>
      <g opacity=".3" stroke-width="1"><path d="M219 247V31 H414 M903 247V31 H708 M561 0V77 M561 1270V1321 M198 466V1111 M924 466V1111 M219 1010H903"/><path d="M414 45Q561 18 708 45 M349 1243Q561 1259 773 1243" stroke-dasharray="2 4"/></g>
      <g opacity=".8" stroke-width="1.5" stroke-dasharray="2 5"><path d="${outer}"/><path d="${outer}" transform="${mirror}"/></g>
      <g stroke-width="3.2" stroke-linecap="round"><path d="${topArc}"/><path d="${topArc}" transform="${mirror}"/><path d="${bottomArc}"/><path d="${bottomArc}" transform="${mirror}"/></g>
      <g opacity=".55" stroke-width="1"><path d="M554 74H568 M561 67V81 M212 161H226 M219 154V168 M896 161H910 M903 154V168 M325 665H339 M332 658V672 M783 665H797 M790 658V672 M212 1010H226 M219 1003V1017 M896 1010H910 M903 1003V1017"/><rect x="214" y="305" width="10" height="10"/><rect x="898" y="305" width="10" height="10"/><rect x="214" y="1005" width="10" height="10"/><rect x="898" y="1005" width="10" height="10"/></g>
      <g fill="currentColor" stroke="none" opacity=".85"><rect x="558" y="28" width="6" height="6"/><rect x="217" y="29" width="4" height="4"/><rect x="901" y="29" width="4" height="4"/><rect x="558" y="1270" width="6" height="6"/><circle cx="219" cy="247" r="2.5"/><circle cx="903" cy="247" r="2.5"/></g>
    </g></g>`;
  const vessel = svg.querySelector("[data-vessel]")!;
  const canvas = doc.createElement("canvas"),
    flow = doc.createElement("canvas");
  const layers = {
    body: doc.createElement("canvas"),
    bones: doc.createElement("canvas"),
    scratch: doc.createElement("canvas"),
  };
  for (const element of [svg, canvas, flow]) {
    element.style.cssText =
      "position:absolute;display:block;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;";
    root.append(element);
  }
  host.append(root);
  activeRenderers++;
  const reduced = motionPreferenceQuery(win);
  let options: HourglassOptions = {
    progress: 0,
    profile: "masculine",
    ink: "currentColor",
    motion: true,
    speed: 1,
    grainSize: 1,
    grainCount: 170,
    widthScale: 1,
  };
  let disposed = false,
    inView = false,
    sized = false,
    scale = 1,
    ink = "",
    dirty = true,
    rasterDirty = true;
  let cropX = 143, cropWidth = 836, viewportWidth = 0, viewportHeight = 0;
  let frame: number | null = null, lastTime: number | null = null, time = 0;
  let counter = 0, renderVersion = 0, lastRenderMs = 0, cut = 0;
  let bodyPoints: Point[] = [], bonePoints: Point[] = [], sources: Point[] = [];
  const rng = random(1862);
  const grains: FallingGrain[] = Array.from(
    { length: 340 },
    () => ({
      seed: rng(),
      phase: rng(),
      speed: 2.8 + rng() * 3.8,
      drift: (rng() - .5) * 25,
      r: .6 + rng() * 1.3,
    }),
  );
  const sand: Point[] = Array.from({ length: 13600 }, () => {
    const x = (rng() + rng() + rng() - 1.5) * 227;
    const height = 78 * Math.exp(-((x / 125) ** 2));
    return {
      x: 561 + x,
      y: 1242 - height * rng(),
      r: .42 + rng() * .9,
      a: .2 + rng() * .8,
    };
  });
  const scatter: Point[] = Array.from(
    { length: 760 },
    () => ({
      x: 561 + (rng() - .5) * 810,
      y: 1231 + rng() * 31,
      r: .35 + rng() * .7,
      a: .1 + rng() * .5,
    }),
  );
  const visible = () =>
    !disposed && host.isConnected && sized && inView && !doc.hidden;
  const active = () => visible() && options.motion && !reduced.matches;
  function schedule() {
    if (!visible() || (!dirty && !active())) {
      if (frame !== null) win!.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
      return;
    }
    if (frame === null) frame = win!.requestAnimationFrame(onFrame);
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    const nextCropWidth = 2 * (410 * options.widthScale + 8);
    const cropChanged = cropWidth !== nextCropWidth;
    cropWidth = nextCropWidth;
    cropX = 561 - cropWidth / 2;
    svg.setAttribute("viewBox", `${cropX} ${ART_Y} ${cropWidth} ${ART_HEIGHT}`);
    // Fill the finite height with one scale for both axes. Narrow scenes may
    // clip peripheral vessel ornament, never squash the anatomical atlases.
    const ratio = rect.height / ART_HEIGHT;
    sized = rect.width > 0 && ratio > 0;
    if (sized) {
      viewportWidth = cropWidth * ratio;
      viewportHeight = ART_HEIGHT * ratio;
      const nextScale = Math.min(
        ratio * (win!.devicePixelRatio || 1),
        Math.sqrt(MAX_CANVAS_PIXELS / (cropWidth * ART_HEIGHT)),
      );
      const width = Math.max(1, Math.floor(cropWidth * nextScale)),
        height = Math.max(1, Math.floor(ART_HEIGHT * nextScale));
      for (const element of [svg, canvas, flow]) {
        element.style.width = `${viewportWidth}px`;
        element.style.height = `${viewportHeight}px`;
      }
      if (cropChanged || width !== canvas.width || height !== canvas.height) {
        scale = width / cropWidth;
        for (const layer of [canvas, flow, ...Object.values(layers)]) {
          layer.width = width;
          layer.height = height;
        }
        rasterDirty = true;
        dirty = true;
      }
    }
    schedule();
  }
  function rasterize(
    layer: HTMLCanvasElement,
    points: Point[],
    materialOpacity = 1,
  ) {
    const ctx = context(layer);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, layer.width, layer.height);
    ctx.setTransform(scale, 0, 0, scale, -cropX * scale, -ART_Y * scale);
    ctx.fillStyle = ink;
    const buckets: Point[][] = Array.from({ length: 12 }, () => []);
    for (const p of points) buckets[Math.min(11, Math.floor(p.a * 12))].push(p);
    for (let i = 0; i < 12; i++) {
      ctx.globalAlpha = (i + 1) / 12 * materialOpacity;
      for (const p of buckets[i]) {
        ctx.fillRect(p.x - p.r * .8, p.y - p.r * .8, p.r * 1.6, p.r * 1.6);
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawStatic() {
    const atlas = atlases[options.profile];
    if (rasterDirty) {
      bodyPoints = decode(atlas.body);
      bonePoints = [
        ...decode(atlas.skeleton).filter((point) =>
          point.y < 579 && !sourceArmPoint(point, options.profile)
        ),
        ...armPoints(options.profile),
        ...lowerBodyPoints(options.profile),
      ];
      // Flesh stays airy and granular; denser cortical bone carries stronger ink.
      rasterize(layers.body, bodyPoints, .62);
      rasterize(layers.bones, bonePoints);
      rasterDirty = false;
    }
    const p = options.progress, decay = p ** 3;
    cut = atlas.bounds.feet - (atlas.bounds.feet - atlas.bounds.head) * decay;
    sources = bodyPoints.filter((point) =>
      point.y > cut - BAND * .25 && point.y < cut + BAND * .65
    );
    if (!sources.length) {
      sources = bodyPoints.filter((point) => point.y > Math.min(cut, 1080));
    }
    const ctx = context(canvas),
      scratch = layers.scratch,
      sc = context(scratch);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    function composite(layer: HTMLCanvasElement, isBone: boolean) {
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.globalCompositeOperation = "source-over";
      sc.clearRect(0, 0, scratch.width, scratch.height);
      sc.drawImage(layer, 0, 0);
      sc.globalCompositeOperation = "destination-in";
      if (p === 0 || p === 1) {
        sc.fillStyle = `rgba(0,0,0,${
          isBone ? (p === 0 ? 0 : 1) : (p === 0 ? 1 : 0)
        })`;
      } else {
        const gradient = sc.createLinearGradient(
          0,
          (cut - BAND / 2 - ART_Y) * scale,
          0,
          (cut + BAND / 2 - ART_Y) * scale,
        );
        gradient.addColorStop(0, `rgba(0,0,0,${isBone ? 0 : 1})`);
        gradient.addColorStop(1, `rgba(0,0,0,${isBone ? .98 : 0})`);
        sc.fillStyle = gradient;
      }
      sc.fillRect(0, 0, scratch.width, scratch.height);
      sc.globalCompositeOperation = "source-over";
      ctx.drawImage(scratch, 0, 0);
    }
    composite(layers.bones, true);
    composite(layers.body, false);
    ctx.setTransform(scale, 0, 0, scale, -cropX * scale, -ART_Y * scale);
    ctx.fillStyle = ink;
    const paths = Array.from({ length: 8 }, () => new Path2D());
    for (const pool of [sand, scatter]) {
      const count = Math.round(pool.length * p * options.grainCount / 340);
      // A fixed pool bounds static work even at maximum density.
      for (let i = 0; i < Math.min(pool.length, count); i++) {
        const grain = pool[i],
          x = 561 + (grain.x - 561) * options.widthScale,
          r = grain.r * options.grainSize;
        const path = paths[Math.min(7, Math.floor(grain.a * 8))];
        path.moveTo(x + r, grain.y);
        path.arc(x, grain.y, r, 0, Math.PI * 2);
      }
    }
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = (i + 1) / 8;
      ctx.fill(paths[i]);
    }
    ctx.globalAlpha = 1;
  }
  function drawFlow() {
    const ctx = context(flow);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, flow.width, flow.height);

    ctx.setTransform(scale, 0, 0, scale, -cropX * scale, -ART_Y * scale);
    ctx.fillStyle = ink;
    for (let i = 0; i < options.grainCount; i++) {
      const grain = grains[i],
        ambient = i % 3 === 0 || !sources.length || options.progress === 0 ||
          options.progress === 1,
        source = ambient
          ? {
            x: 561 + (grain.seed - .5) * 260 * options.widthScale,
            y: 85 + grain.seed * 130,
          }
          : sources[
            Math.min(
              sources.length - 1,
              Math.floor(grain.seed * sources.length),
            )
          ];
      const phase = (time / grain.speed + grain.phase) % 1, t = phase * phase;
      const endY = 1237 -
        56 * Math.exp(-(((source.x - 561) / (127 * options.widthScale)) ** 2));
      const y = source.y + (endY - source.y) * t;
      const x = source.x + grain.drift * options.widthScale * t +
        Math.sin(phase * 7 + grain.seed * 12) * 3 * phase;
      ctx.globalAlpha = Math.min(1, phase * 6) * Math.min(1, (1 - phase) * 7) *
        (ambient ? .12 + grain.seed * .32 : .35 + grain.seed * .65);
      ctx.beginPath();
      ctx.arc(x, y, grain.r * options.grainSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function onFrame(timestamp: number) {
    frame = null;
    if (!visible()) {
      lastTime = null;
      return;
    }
    const start = win!.performance.now();
    if (dirty) {
      drawStatic();
      dirty = false;
      renderVersion++;
    }
    if (active()) {
      if (lastTime !== null) {
        time += Math.min(.1, (timestamp - lastTime) / 1000) * options.speed;
      }
      lastTime = timestamp;
      counter++;
    } else lastTime = null;
    drawFlow();
    lastRenderMs = win!.performance.now() - start;
    if (active()) frame = win!.requestAnimationFrame(onFrame);
  }
  function update(next: HourglassOptions) {
    if (disposed) return;
    const normalized: HourglassOptions = {
      progress: clamp(next.progress, 0, 1, 0),
      profile: next.profile === "feminine" ? "feminine" : "masculine",
      ink: next.ink || "currentColor",
      motion: next.motion !== false,
      speed: clamp(next.speed, .25, 3, 1),
      grainSize: clamp(next.grainSize, .5, 2, 1),
      grainCount: Math.round(clamp(next.grainCount, 40, 340, 170)),
      widthScale: clamp(next.widthScale, .75, 1.25, 1),
    };
    // Resolve currentColor/variables once per update for equal canvas and SVG ink.
    root.style.color = normalized.ink;
    const resolvedInk = win!.getComputedStyle(root).color;
    if (options.profile !== normalized.profile || ink !== resolvedInk) {
      rasterDirty = true;
    }
    ink = resolvedInk;
    options = normalized;
    vessel.setAttribute(
      "transform",
      `translate(561 0) scale(${options.widthScale} 1) translate(-561 0)`,
    );
    dirty = true;
    resize();
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? false;
    schedule();
  });
  const onPolicyChange = () => {
    dirty = true;
    schedule();
  };
  resizeObserver.observe(host);
  intersectionObserver.observe(host);
  doc.addEventListener("visibilitychange", onPolicyChange);
  reduced.addEventListener("change", onPolicyChange);
  win.addEventListener("resize", resize);
  update(options);
  resize();
  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      activeRenderers--;
      if (activeRenderers === 0) decoded.clear();
      if (frame !== null) win!.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      doc.removeEventListener("visibilitychange", onPolicyChange);
      reduced.removeEventListener("change", onPolicyChange);
      win!.removeEventListener("resize", resize);
      root.remove();
      for (const layer of [canvas, flow, ...Object.values(layers)]) {
        layer.width = 0;
        layer.height = 0;
      }
      bodyPoints = [];
      bonePoints = [];
      sources = [];
    },
    diagnostics: () => ({
      ...options,
      decodedAtlases: decoded.size,
      surfacePoints: bodyPoints.length,
      bonePoints: bonePoints.length,
      cropX,
      cropY: ART_Y,
      cropWidth,
      cropHeight: ART_HEIGHT,
      viewportWidth,
      viewportHeight,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      frameCount: counter,
      renderVersion,
      lastRenderMs,
      animationActive: active(),
      framePending: frame !== null,
      reducedMotion: reduced.matches,
      inView,
      hidden: doc.hidden,
      disposed,
      cut,
      maxCanvasPixels: MAX_CANVAS_PIXELS,
      anatomy: "source-skull-and-torso-authored-articulated-limbs-and-pelvis",
      fleshOpacity: .62,
    }),
  };
}
