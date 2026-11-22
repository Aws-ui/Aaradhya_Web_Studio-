import { landRows } from "./land.js";

const degrees = Math.PI / 180;
const circle = Math.PI * 2;
const camera = 4.1;
const projectionScale = Math.sqrt(camera ** 2 - 1) / camera;
const horizon = 1 / camera;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function place(latitude, longitude) {
  const lat = latitude * degrees;
  const lon = longitude * degrees;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

const land = landRows.flatMap(([lat, longitudes]) => longitudes.map(lon => place(lat, lon)));
const grid = [];
for (let latitude = -75; latitude <= 75; latitude += 15) {
  grid.push(Array.from({ length: 121 }, (_, i) => place(latitude, -180 + i * 3)));
}
for (let longitude = -180; longitude < 180; longitude += 15) {
  grid.push(Array.from({ length: 61 }, (_, i) => place(-90 + i * 3, longitude)));
}

const cities = {
  Mumbai: place(19.08, 72.88),
  London: place(51.51, -.13),
  Dubai: place(25.20, 55.27),
  Singapore: place(1.35, 103.82),
  Tokyo: place(35.68, 139.69),
  Nairobi: place(-1.29, 36.82),
  Sydney: place(-33.87, 151.21),
  Paris: place(48.86, 2.35),
  NewYork: place(40.71, -74.01),
  Toronto: place(43.65, -79.38),
  LosAngeles: place(34.05, -118.24),
  SaoPaulo: place(-23.55, -46.63),
  Johannesburg: place(-26.20, 28.05),
  Istanbul: place(41.01, 28.98),
  Seoul: place(37.57, 126.98),
  Jakarta: place(-6.21, 106.85),
};

function flight(from, to, height) {
  const angle = Math.acos(clamp(from.reduce((sum, value, i) => sum + value * to[i], 0), -1, 1));
  return Array.from({ length: 51 }, (_, i) => {
    const t = i / 50;
    const scale = (1 + height * Math.sin(Math.PI * t)) / Math.sin(angle);
    return from.map((value, axis) => (
      Math.sin((1 - t) * angle) * value + Math.sin(t * angle) * to[axis]
    ) * scale);
  });
}

const routes = [
  ["Mumbai", "London", .24], ["Mumbai", "Dubai", .15], ["Mumbai", "Singapore", .18],
  ["Mumbai", "Tokyo", .22], ["Mumbai", "Nairobi", .16], ["Mumbai", "Sydney", .24],
  ["London", "Paris", .09], ["London", "Toronto", .23], ["NewYork", "London", .22],
  ["NewYork", "SaoPaulo", .23], ["LosAngeles", "Tokyo", .26], ["Sydney", "Singapore", .19],
  ["Dubai", "Istanbul", .14], ["Dubai", "Johannesburg", .23], ["Singapore", "Seoul", .20],
  ["Singapore", "Jakarta", .09],
].map(([from, to, height]) => flight(cities[from], cities[to], height));

const labels = [
  ["Mumbai", "Mumbai", 1, 1],
  ["London", "London", -1, -1],
  ["Singapore", "Singapore", 1, 1],
  ["Tokyo", "Tokyo", 1, -1],
  ["Nairobi", "Nairobi", -1, 1],
  ["NewYork", "New York", -1, -1],
  ["Sydney", "Sydney", 1, 1],
  ["SaoPaulo", "São Paulo", -1, 1],
];

function fitCanvas(canvas, context) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height };
}

function projectPoint(point, view) {
  const [x, y, z] = point;
  const depth = z * view.cosY - x * view.sinY;
  const xRotated = x * view.cosY + z * view.sinY;
  const yRotated = y * view.cosX - depth * view.sinX;
  const zRotated = y * view.sinX + depth * view.cosX;
  const factor = camera * projectionScale / (camera - zRotated);
  return [xRotated * factor, yRotated * factor, zRotated];
}

function traceLines(context, paths, view, surface) {
  context.beginPath();
  for (const path of paths) {
    let drawing = false;
    for (const point of path) {
      const [x, y, z] = projectPoint(point, view);
      const visible = surface ? z >= horizon : z >= horizon || x * x + y * y > 1.005;
      if (!visible) { drawing = false; continue; }
      if (drawing) context.lineTo(x * view.radius, -y * view.radius);
      else context.moveTo(x * view.radius, -y * view.radius);
      drawing = true;
    }
  }
  context.stroke();
}

function drawRings(context, radius) {
  const glow = context.createRadialGradient(0, 0, radius * .64, 0, 0, radius * 1.46);
  glow.addColorStop(0, "#240d44b0");
  glow.addColorStop(.53, "#622bc63f");
  glow.addColorStop(1, "#532ac600");
  context.fillStyle = glow;
  context.fillRect(-radius * 1.48, -radius * 1.48, radius * 2.96, radius * 2.96);

  context.lineWidth = 1;
  context.strokeStyle = "#7b5cb450";
  context.beginPath();
  context.arc(0, 0, radius * 1.14, 0, circle);
  context.stroke();
  context.strokeStyle = "#af8de562";
  context.setLineDash([1.5, 7]);
  context.beginPath();
  context.arc(0, 0, radius * 1.22, -.36, 5.95);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = "#a079e83b";
  context.beginPath();
  context.ellipse(0, 0, radius * 1.39, radius * .41, -.35, 0, circle);
  context.stroke();

  context.strokeStyle = "#ba97f294";
  context.beginPath();
  context.arc(0, 0, radius * 1.14, 3.82, 4.48);
  context.moveTo(Math.cos(.06) * radius * 1.14, Math.sin(.06) * radius * 1.14);
  context.arc(0, 0, radius * 1.14, .06, .63);
  context.stroke();
}

function drawSphere(context, view) {
  const r = view.radius;
  const shade = context.createRadialGradient(-r * .26, -r * .34, r * .05, 0, 0, r * 1.04);
  shade.addColorStop(0, "#2f1a51");
  shade.addColorStop(.72, "#1a1232");
  shade.addColorStop(.93, "#151025");
  shade.addColorStop(1, "#352054");
  context.fillStyle = shade;
  context.lineWidth = 1.15;
  context.strokeStyle = "#986fe99c";
  context.beginPath();
  context.arc(0, 0, r, 0, circle);
  context.fill();
  context.stroke();

  context.lineWidth = .62;
  context.strokeStyle = "#b38ee52d";
  traceLines(context, grid, view, true);

  const bands = [[], [], [], []];
  for (const point of land) {
    const [x, y, z] = projectPoint(point, view);
    if (z < horizon) continue;
    const band = Math.min(3, Math.floor((z - horizon) / (1 - horizon) * 4));
    bands[band].push([x * r, -y * r]);
  }
  const colors = ["#986bd772", "#a881eab4", "#bd9bf4d4", "#d2b5ffee"];
  for (const [i, band] of bands.entries()) {
    const size = Math.max(.66, r / 187) * (0.91 + i * .16);
    context.fillStyle = colors[i];
    context.beginPath();
    for (const [x, y] of band) {
      context.moveTo(x + size, y);
      context.arc(x, y, size, 0, circle);
    }
    context.fill();
  }

  context.lineWidth = r > 175 ? 1.35 : 1.05;
  context.strokeStyle = "#b690ffb8";
  context.shadowColor = "#b685ff";
  context.shadowBlur = 7;
  traceLines(context, routes, view, false);
  context.shadowBlur = 0;
}

function drawCities(context, view, clock) {
  const r = view.radius;
  const markers = {};
  for (const [name, point] of Object.entries(cities)) {
    const [x, y, z] = projectPoint(point, view);
    if (z <= horizon + .025) continue;
    const center = [x * r, -y * r];
    markers[name] = center;
    const hub = name === "Mumbai";
    const halo = context.createRadialGradient(...center, 0, ...center, hub ? 16 : 8);
    halo.addColorStop(0, hub ? "#d3a4ffce" : "#c098ff9b");
    halo.addColorStop(1, "#c08bff00");
    context.beginPath();
    context.arc(...center, hub ? 16 : 8, 0, circle);
    context.fillStyle = halo;
    context.fill();
    context.beginPath();
    context.arc(...center, hub ? 3.5 : 2, 0, circle);
    context.fillStyle = "#f8edff";
    context.fill();
    if (hub) {
      context.beginPath();
      context.arc(...center, 9 + 1.8 * Math.sin(clock * .004), 0, circle);
      context.lineWidth = .8;
      context.strokeStyle = "#eacaffcf";
      context.stroke();
    }
  }

  for (const [i, route] of routes.entries()) {
    const position = (clock / (55 + i % 4 * 10) + i * 13) % (route.length - 1);
    const index = Math.floor(position);
    const point = route[index].map((value, axis) => value + (route[index + 1][axis] - value) * (position - index));
    const [x, y, z] = projectPoint(point, view);
    if (z <= horizon && x * x + y * y <= 1.005) continue;
    context.beginPath();
    context.arc(x * r, -y * r, i < 6 ? 2.35 : 1.55, 0, circle);
    context.fillStyle = "#f7deff";
    context.fill();
  }

  const occupied = [];
  context.font = '600 11px Inter, sans-serif';
  context.textBaseline = "middle";
  for (const [name, label, side, direction] of labels) {
    if (!markers[name] || occupied.length >= (r < 160 ? 2 : 4)) continue;
    const [x, y] = markers[name];
    const width = context.measureText(label).width + 16;
    const left = x + side * 13 - (side === -1 ? width : 0);
    const top = y + direction * 19 - 10;
    if (left < -view.cx + 10 || left + width > view.width - view.cx - 10) continue;
    if (occupied.some(([px, py, w]) => left < px + w + 7 && left + width + 7 > px && Math.abs(top - py) < 25)) continue;
    occupied.push([left, top, width]);
    context.beginPath();
    context.moveTo(x + side * 4, y + direction * 3);
    context.lineTo(x + side * 14, top + 10);
    context.strokeStyle = "#ae86ebbc";
    context.lineWidth = .75;
    context.stroke();
    context.beginPath();
    context.roundRect(left, top, width, 20, 4);
    context.fillStyle = "#181128ef";
    context.fill();
    context.strokeStyle = "#8662c59c";
    context.stroke();
    context.fillStyle = "#efe1ff";
    context.fillText(label, left + 8, top + 10);
  }
}

function seededRandom(seed) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const random = seededRandom(217);
const particles = Array.from({ length: 145 }, () => ({
  x: random(), y: random(), phase: random() * circle,
  size: .45 + random() ** 2 * 1.35, drift: 3 + random() * 15,
}));

function drawParticles(context, size, pointer, clock, interactive) {
  const { width, height } = size;
  context.clearRect(0, 0, width, height);
  const count = width < 700 ? 62 : particles.length;
  const nearby = [];
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    let x = p.x * width + p.drift * Math.sin(clock * .00048 + p.phase);
    let y = p.y * height + p.drift * Math.cos(clock * .0004 + p.phase);
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (interactive && distance < 130) {
      const force = (1 - distance / 130) * .28;
      x += dx * force;
      y += dy * force;
      nearby.push([x, y]);
    }
    const brightness = ((.27 + .21 * Math.sin(clock * .0015 + p.phase)) * (.37 + .63 * p.x));
    context.fillStyle = `rgba(184,151,255,${brightness.toFixed(3)})`;
    context.beginPath();
    context.arc(x, y, p.size, 0, circle);
    context.fill();
  }
  context.lineWidth = .6;
  context.strokeStyle = "#ba94ff29";
  context.beginPath();
  for (let i = 0; i < nearby.length; i++) {
    for (let j = i + 1; j < nearby.length; j++) {
      if (Math.hypot(nearby[i][0] - nearby[j][0], nearby[i][1] - nearby[j][1]) > 75) continue;
      context.moveTo(...nearby[i]);
      context.lineTo(...nearby[j]);
    }
  }
  context.stroke();
}

export function mountNetwork() {
  const globe = document.querySelector("#globe");
  const backdrop = document.querySelector("#particles");
  const hero = document.querySelector(".hero");
  const toggle = document.querySelector("#motion-toggle");
  const toggleLabel = document.querySelector("#motion-label");
  const context = globe.getContext("2d");
  const particleContext = backdrop.getContext("2d");
  if (!context || !particleContext) {
    toggle.hidden = true;
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = reducedMotion.matches;
  let shown = true;
  let yaw = -1.07;
  let pitch = .38;
  let drag = null;
  let clock = 0;
  let previousTime = 0;
  let frame = 0;
  let sizes;
  const pointer = { x: -1000, y: -1000 };

  function draw() {
    const { width, height } = sizes.globe;
    if (width === 0 || height === 0) return;

    const radius = Math.min(width * .36, height * .399);
    const scroll = paused ? 0 : clamp(-hero.getBoundingClientRect().top / hero.clientHeight, 0, 1);
    const offsetX = paused || pointer.x < 0 ? 0 : (pointer.x / sizes.particles.width - .5) * 11;
    const offsetY = paused || pointer.y < 0 ? 0 : (pointer.y / sizes.particles.height - .5) * 11;
    const cx = width * .5 + offsetX;
    const cy = height * .486 + offsetY + scroll * 13;
    const horizontal = yaw + offsetX * .005;
    const vertical = pitch - scroll * .10 + offsetY * .003;
    const view = { radius, cx, width, cosY: Math.cos(horizontal), sinY: Math.sin(horizontal), cosX: Math.cos(vertical), sinX: Math.sin(vertical) };

    drawParticles(particleContext, sizes.particles, pointer, clock, !paused);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(cx, cy);
    drawRings(context, radius);
    drawSphere(context, view);
    drawCities(context, view, clock);
    context.restore();
  }

  function requestFrame() {
    if (!frame && shown && !document.hidden) frame = window.requestAnimationFrame(animate);
  }

  function animate(time) {
    frame = 0;
    if (!paused) {
      const delta = previousTime ? Math.min(time - previousTime, 40) : 0;
      clock += delta;
      if (!drag) yaw -= delta * .000105;
      previousTime = time;
    } else previousTime = 0;
    draw();
    if (!paused) requestFrame();
  }

  function syncMotion() {
    toggle.classList.toggle("paused", paused);
    toggle.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    toggleLabel.textContent = paused ? "Play" : "Pause";
    requestFrame();
  }

  function resize() {
    sizes = { globe: fitCanvas(globe, context), particles: fitCanvas(backdrop, particleContext) };
    requestFrame();
  }

  let animationVisible = true;
  function syncVisibility() {
    shown = animationVisible && !document.hidden;
    previousTime = 0;
    if (!shown && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (shown) requestFrame();
  }
  new IntersectionObserver(([entry]) => {
    animationVisible = entry.isIntersecting;
    syncVisibility();
  }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  document.addEventListener("visibilitychange", syncVisibility);

  hero.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse") return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  });
  hero.addEventListener("pointerleave", () => { pointer.x = -1000; pointer.y = -1000; });

  globe.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    globe.setPointerCapture(event.pointerId);
    globe.classList.add("dragging");
  });
  globe.addEventListener("pointermove", event => {
    if (drag?.pointerId !== event.pointerId) return;
    yaw += (event.clientX - drag.x) * .009;
    pitch = clamp(pitch + (event.clientY - drag.y) * .008, -1.42, 1.42);
    drag.x = event.clientX;
    drag.y = event.clientY;
    requestFrame();
  });
  globe.addEventListener("lostpointercapture", () => {
    drag = null;
    globe.classList.remove("dragging");
  });
  globe.addEventListener("keydown", event => {
    const offsets = { ArrowLeft: [-.18, 0], ArrowRight: [.18, 0], ArrowUp: [0, -.15], ArrowDown: [0, .15] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    yaw += offset[0];
    pitch = clamp(pitch + offset[1], -1.42, 1.42);
    requestFrame();
  });
  toggle.addEventListener("click", () => { paused = !paused; syncMotion(); });
  reducedMotion.addEventListener("change", event => { paused = event.matches; syncMotion(); });
  resize();
  syncMotion();
}
