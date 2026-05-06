import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import "./styles.css";

const canvas = document.querySelector("#race-canvas");
const selection = document.querySelector("#selection");
const horseGrid = document.querySelector("#horse-grid");
const hud = document.querySelector("#hud");
const result = document.querySelector("#result");
const rankEl = document.querySelector("#rank");
const energyBar = document.querySelector("#energy-bar");
const energyText = document.querySelector("#energy-text");
const wearBar = document.querySelector("#wear-bar");
const wearText = document.querySelector("#wear-text");
const weatherEl = document.querySelector("#weather");
const venueEl = document.querySelector("#venue");
const lapEl = document.querySelector("#lap");
const paceValue = document.querySelector("#pace-value");
const cadenceBar = document.querySelector("#cadence-bar");
const leftBtn = document.querySelector("#left-btn");
const rightBtn = document.querySelector("#right-btn");
const advanceBtn = document.querySelector("#advance-btn");
const restartBtn = document.querySelector("#restart");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const podiumEl = document.querySelector("#podium");

const TWO_PI = Math.PI * 2;
const TRACK_A = 238;
const TRACK_B = 146;
const TRACK_WIDTH = 78;
const LAPS = 3;
const TRACK_LENGTH = 1220;
const LANE_LIMIT = TRACK_WIDTH / 2 - 11;
const LANES = [-24.5, -17.5, -10.5, -3.5, 3.5, 10.5, 17.5, 24.5];
const START_T = 0.002;
const RELEASE_DELAY = 0.45;
const TREE_ASSET_PATH = "/models/tree_small_02/tree_small_02_1k.gltf";
const TREE_TEXTURE_PATH = "/models/tree_small_02/textures";

const horseOptions = [
  { name: "Zé Pequeno", rider: "Conjunto 01", color: 0x5b2f1d, silk: 0xe8bb55, speed: 1.04, stamina: 1.02, grit: 0.98 },
  { name: "Dadinho", rider: "Conjunto 02", color: 0x1f2735, silk: 0x5aa7ff, speed: 1.07, stamina: 0.96, grit: 1.02 },
  { name: "Acerola", rider: "Conjunto 03", color: 0x8b4a25, silk: 0xf26c4f, speed: 1.0, stamina: 1.08, grit: 1.05 },
  { name: "Capitão Nascimento", rider: "Conjunto 04", color: 0x111113, silk: 0xb28cff, speed: 1.08, stamina: 0.94, grit: 1.08 },
  { name: "Zero 1", rider: "Conjunto 05", color: 0xe8e2d4, silk: 0x72d294, speed: 0.98, stamina: 1.12, grit: 1.12 },
  { name: "Zé Galinha", rider: "Conjunto 06", color: 0x6d3b24, silk: 0xffffff, speed: 1.03, stamina: 1.04, grit: 1.0 },
  { name: "Agostinho Carrara", rider: "Conjunto 07", color: 0xb86632, silk: 0xffd166, speed: 1.06, stamina: 0.99, grit: 0.99 },
  { name: "Zé do Caixão", rider: "Conjunto 08", color: 0x303026, silk: 0x4ecdc4, speed: 1.01, stamina: 1.05, grit: 1.1 },
];

const weatherStages = [
  {
    name: "Sol",
    venue: "Ascot, Inglaterra",
    sky: 0x87c7ff,
    fog: 0xcfeeff,
    ground: 0xb4743d,
    optimal: 64,
    drain: 1.0,
    traction: 1.0,
    visibility: 1.0,
  },
  {
    name: "Chuva",
    venue: "Meydan, Dubai",
    sky: 0x617783,
    fog: 0x80919a,
    ground: 0x5f4936,
    optimal: 57,
    drain: 1.12,
    traction: 0.91,
    visibility: 0.9,
  },
  {
    name: "Neve",
    venue: "Longchamp, Paris",
    sky: 0xb7c6cf,
    fog: 0xd7e1e7,
    ground: 0xd2c6ad,
    optimal: 51,
    drain: 1.24,
    traction: 0.84,
    visibility: 0.78,
  },
];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(weatherStages[0].sky);
scene.fog = new THREE.Fog(weatherStages[0].fog, 280, 760);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1600);
camera.position.set(0, 42, 92);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
composer.addPass(gtaoPass);
const bokehPass = new BokehPass(scene, camera, {
  focus: 52,
  aperture: 0.000045,
  maxblur: 0.006,
});
composer.addPass(bokehPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.26, 0.42, 0.78);
composer.addPass(bloomPass);
const filmPass = new FilmPass(0.22, false);
composer.addPass(filmPass);
composer.addPass(new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()));
composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0xfff5db, 0x253234, 1.15);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe0a3, 3.2);
sun.position.set(-180, 220, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 560;
sun.shadow.camera.left = -320;
sun.shadow.camera.right = 320;
sun.shadow.camera.top = 320;
sun.shadow.camera.bottom = -320;
scene.add(sun);

const rimLight = new THREE.DirectionalLight(0x8fc7ff, 1.55);
rimLight.position.set(240, 120, -260);
scene.add(rimLight);

const cameraFill = new THREE.PointLight(0xffd6a0, 0.85, 120, 1.8);
scene.add(cameraFill);

const time = {
  elapsed: 0,
  last: performance.now() / 1000,
};
const state = {
  started: false,
  finished: false,
  selected: 0,
  pace: 62,
  tapRate: 0,
  lastAdvanceAt: -1,
  advanceHeld: false,
  holdPulseTimer: 0,
  steer: 0,
  weatherIndex: 0,
  cameraShake: 0,
  raceTime: 0,
  racers: [],
};

const textureLoader = new THREE.TextureLoader();
const world = new THREE.Group();
scene.add(world);

const pbrTextures = {
  track: loadPbrSet("/textures/ground027/Ground027_1K-JPG", 16, 3.2),
  grass: loadPbrSet("/textures/grass001/Grass001_1K-JPG", 34, 34),
};

const trackMaterial = createPbrMaterial(pbrTextures.track, {
  color: weatherStages[0].ground,
  roughness: 0.92,
  metalness: 0.0,
  normalScale: 0.72,
  displacementScale: 0.08,
});

let rainSystem;
let snowSystem;
let startGate;
let horseAsset;
let treeAsset;
let environmentMotion;
let heroTreeLoadRequested = false;

buildWorld();
buildSelectionPreview();
bindControls();
loadHorseAsset();
animate();

function loadHorseAsset() {
  const loader = new GLTFLoader();
  loader.load(
    "/models/Horse.glb",
    (gltf) => {
      horseAsset = gltf;
      if (!state.started) resetRacers();
    },
    undefined,
    () => {
      horseAsset = null;
    }
  );
}

function loadTreeAsset() {
  const loader = new GLTFLoader();
  loader.load(
    TREE_ASSET_PATH,
    (gltf) => {
      treeAsset = gltf.scene;
      prepareHeroTree(treeAsset);
      placeHeroTrees();
    },
    undefined,
    () => {
      treeAsset = null;
    }
  );
}

function scheduleHeroTreeLoad(delay = 0) {
  if (heroTreeLoadRequested || treeAsset) return;
  heroTreeLoadRequested = true;
  window.setTimeout(() => {
    const startLoad = () => loadTreeAsset();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(startLoad, { timeout: 3200 });
    } else {
      startLoad();
    }
  }, delay);
}

function buildSelectionPreview() {
  horseOptions.forEach((horse, index) => {
    const card = document.createElement("button");
    card.className = "horse-card";
    card.type = "button";
    card.innerHTML = `
      <div class="swatch" style="background: linear-gradient(90deg, #${horse.color.toString(16).padStart(6, "0")}, #${horse.silk.toString(16).padStart(6, "0")})"></div>
      <strong>${horse.name}</strong>
      <span>${horse.rider} · Vel ${Math.round(horse.speed * 100)} · Folego ${Math.round(horse.stamina * 100)} · Garra ${Math.round(horse.grit * 100)}</span>
    `;
    card.addEventListener("click", () => startRace(index));
    horseGrid.appendChild(card);
  });
}

function bindControls() {
  restartBtn.addEventListener("click", () => {
    result.classList.add("hidden");
    selection.classList.remove("hidden");
    hud.classList.add("hidden");
    state.started = false;
    state.finished = false;
    state.raceTime = 0;
    if (startGate) startGate.visible = true;
    resetRacers();
  });

  const setSteer = (value) => {
    state.steer = value;
  };
  leftBtn.addEventListener("pointerdown", () => setSteer(-1));
  rightBtn.addEventListener("pointerdown", () => setSteer(1));
  advanceBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.advanceHeld = true;
    state.holdPulseTimer = 0;
    advanceBtn.classList.add("is-pressed");
    registerAdvancePress();
  });
  window.addEventListener("pointerup", () => {
    setSteer(0);
    state.advanceHeld = false;
    advanceBtn.classList.remove("is-pressed");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.steer = -1;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.steer = 1;
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.code === "Space") {
      event.preventDefault();
      state.advanceHeld = true;
      if (!event.repeat) registerAdvancePress();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) state.steer = 0;
    if (["ArrowUp", "w", "W", " "].includes(event.key) || event.code === "Space") {
      state.advanceHeld = false;
      advanceBtn.classList.remove("is-pressed");
    }
  });
  window.addEventListener("resize", resize);
}

function setPace(value) {
  state.pace = THREE.MathUtils.clamp(value, 22, 100);
  paceValue.textContent = Math.round(state.pace);
  if (cadenceBar) cadenceBar.style.width = `${Math.round(state.pace)}%`;
}

function registerAdvancePress() {
  if (!state.started || state.finished) return;
  const now = time.elapsed;
  const interval = state.lastAdvanceAt >= 0 ? THREE.MathUtils.clamp(now - state.lastAdvanceAt, 0.11, 1.1) : 0.36;
  const rate = 1 / interval;
  const goodRhythm = 1 - THREE.MathUtils.clamp(Math.abs(interval - 0.32) / 0.34, 0, 1);
  const panicTap = THREE.MathUtils.smoothstep(rate, 4.8, 8.4);
  const impulse = 5.2 + goodRhythm * 5.8 + panicTap * 3.2;
  state.tapRate = THREE.MathUtils.lerp(state.tapRate, rate, 0.45);
  setPace(state.pace + impulse);
  state.lastAdvanceAt = now;
  advanceBtn.classList.add("is-pressed");
}

function startRace(selected) {
  state.selected = selected;
  state.started = true;
  state.finished = false;
  state.raceTime = 0;
  state.pace = 62;
  state.tapRate = 0;
  state.lastAdvanceAt = -1;
  state.advanceHeld = false;
  state.holdPulseTimer = 0;
  setPace(62);
  energyBar.style.width = "100%";
  energyText.textContent = "100%";
  wearBar.style.width = "0%";
  wearText.textContent = "0%";
  selection.classList.add("hidden");
  hud.classList.remove("hidden");
  if (startGate) startGate.visible = true;
  resetRacers();
  scheduleHeroTreeLoad(14000);
}

function resetRacers() {
  state.racers.forEach((racer) => {
    world.remove(racer.group);
    if (racer.contact) world.remove(racer.contact);
  });
  state.racers = horseOptions.map((horse, index) => {
    const group = createHorse(horse);
    world.add(group);
    const lane = LANES[index];
    const racer = {
      horse,
      group,
      contact: createContactPatch(horse),
      lane,
      laneTarget: lane,
      progress: -0.0015 - index * 0.00035,
      speed: 0,
      energy: 100,
      wear: 0,
      strain: 0,
      mixer: group.userData.mixer,
      aiPace: 58 + Math.random() * 10,
      aiPhase: Math.random() * 99,
      finished: false,
      finishTime: 0,
    };
    world.add(racer.contact);
    placeRacer(racer, 0, true);
    return racer;
  });
}

function buildWorld() {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(820, 96),
    createPbrMaterial(pbrTextures.grass, {
      color: 0x20392d,
      roughness: 0.94,
      normalScale: 0.42,
      displacementScale: 0.025,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  world.add(ground);

  const infield = new THREE.Mesh(
    new THREE.CircleGeometry(118, 96),
    createPbrMaterial(pbrTextures.grass, {
      color: 0x347946,
      roughness: 0.9,
      normalScale: 0.5,
      displacementScale: 0.018,
    })
  );
  infield.scale.set(1.55, 1, 0.95);
  infield.rotation.x = -Math.PI / 2;
  infield.position.y = 0.02;
  infield.receiveShadow = true;
  world.add(infield);

  const track = new THREE.Mesh(createTrackGeometry(TRACK_WIDTH), trackMaterial);
  track.receiveShadow = true;
  world.add(track);

  world.add(createRail(TRACK_WIDTH / 2 + 7, 0xf4ead3));
  world.add(createRail(-TRACK_WIDTH / 2 - 7, 0xf4ead3));
  world.add(createLaneLines());
  world.add(createTrackLayering());
  startGate = createStartGate();
  world.add(startGate);
  createGrandstands();
  createTrees();
  createGrassField();
  createAtmosphere();
  createSponsorBoards();
  createParticles();
}

function createTrackGeometry(width) {
  return createTrackStripGeometry(0, width);
}

function createTrackStripGeometry(centerOffset, width) {
  const segments = 360;
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const center = getTrackPoint(t, centerOffset);
    const normal = getNormal(t);
    [-width / 2, width / 2].forEach((offset, side) => {
      vertices.push(center.x + normal.x * offset, 0, center.z + normal.z * offset);
      uvs.push(t * 12, side);
    });
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createTrackLayering() {
  const group = new THREE.Group();
  const innerLip = new THREE.Mesh(
    createTrackStripGeometry(-TRACK_WIDTH / 2 - 1.8, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x276d37, roughness: 0.92, map: makeGrassTexture(512, 0x255c32, 0x5eaa4d) })
  );
  innerLip.position.y = 0.055;
  innerLip.receiveShadow = true;
  group.add(innerLip);

  const outerLip = new THREE.Mesh(
    createTrackStripGeometry(TRACK_WIDTH / 2 + 1.8, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x276d37, roughness: 0.92, map: makeGrassTexture(512, 0x255c32, 0x5eaa4d) })
  );
  outerLip.position.y = 0.055;
  outerLip.receiveShadow = true;
  group.add(outerLip);

  const rutMaterial = new THREE.LineBasicMaterial({ color: 0x4c2e1b, transparent: true, opacity: 0.28 });
  for (let lane = -31; lane <= 31; lane += 4) {
    for (let wiggle = 0; wiggle < 2; wiggle += 1) {
      const points = [];
      for (let i = 0; i <= 260; i += 1) {
        const t = i / 260;
        const offset = lane + Math.sin(i * 0.21 + lane) * (0.18 + wiggle * 0.16);
        const p = getTrackPoint(t, offset);
        points.push(new THREE.Vector3(p.x, 0.145 + wiggle * 0.006, p.z));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), rutMaterial));
    }
  }

  const scuffMaterial = new THREE.MeshBasicMaterial({
    color: 0x2a1a11,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  for (let i = 0; i < 180; i += 1) {
    const t = Math.random();
    const lane = THREE.MathUtils.lerp(-34, 34, Math.random());
    const p = getTrackPoint(t, lane);
    const tangent = getTangent(t);
    const mark = new THREE.Mesh(new THREE.CircleGeometry(1, 10), scuffMaterial.clone());
    mark.rotation.x = -Math.PI / 2;
    mark.rotation.z = Math.atan2(tangent.z, tangent.x);
    mark.position.set(p.x, 0.16, p.z);
    mark.scale.set(0.18 + Math.random() * 0.28, 0.65 + Math.random() * 1.2, 1);
    group.add(mark);
  }
  return group;
}

function createRail(offset, color) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c3a4, roughness: 0.7 });
  const points = [];
  for (let i = 0; i <= 180; i += 1) {
    const p = getTrackPoint(i / 180, offset);
    points.push(new THREE.Vector3(p.x, 2.5, p.z));
    if (i % 8 === 0) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5, 8), postMaterial);
      post.position.set(p.x, 2, p.z);
      post.castShadow = true;
      group.add(post);
    }
  }
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 260, 0.28, 8, true), material);
  rail.castShadow = true;
  group.add(rail);
  return group;
}

function createLaneLines() {
  const group = new THREE.Group();
  const material = new THREE.LineDashedMaterial({ color: 0xdccaa7, dashSize: 5, gapSize: 5, transparent: true, opacity: 0.55 });
  for (let offset = -18; offset <= 18; offset += 6) {
    const points = [];
    for (let i = 0; i <= 200; i += 1) {
      const p = getTrackPoint(i / 200, offset);
      points.push(new THREE.Vector3(p.x, 0.12, p.z));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    line.computeLineDistances();
    group.add(line);
  }
  return group;
}

function createStartGate() {
  const group = new THREE.Group();
  const p = getTrackPoint(START_T, 0);
  const normal = getNormal(START_T);
  const tangent = getTangent(START_T);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x182528, metalness: 0.35, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8bb55, metalness: 0.35, roughness: 0.32 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xd8c08f, metalness: 0.15, roughness: 0.48 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x263b3e, metalness: 0.28, roughness: 0.42 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(64, 2, 1.4), goldMat);
  beam.position.set(p.x + normal.x * 1, 22, p.z + normal.z * 1);
  beam.rotation.y = Math.atan2(normal.x, normal.z);
  beam.castShadow = true;
  group.add(beam);
  [-31, 31].forEach((o) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.7, 22, 1.7), gateMat);
    post.position.set(p.x + normal.x * o, 11, p.z + normal.z * o);
    post.castShadow = true;
    group.add(post);
  });

  group.userData.doors = [];
  LANES.forEach((lane) => {
    const center = getTrackPoint(START_T, lane);
    const yaw = Math.atan2(normal.x, normal.z);
    const stall = new THREE.Group();
    const backOffset = -7.5;
    const frontOffset = 3.5;
    [-2.75, 2.75].forEach((side) => {
      for (let level = 0; level < 3; level += 1) {
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 12), railMat);
        divider.position.set(
          center.x + normal.x * side + tangent.x * backOffset,
          2.2 + level * 2.05,
          center.z + normal.z * side + tangent.z * backOffset
        );
        divider.rotation.y = yaw;
        divider.castShadow = true;
        stall.add(divider);
      }
      [-13, -2].forEach((along) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 7.4, 0.42), gateMat);
        post.position.set(
          center.x + normal.x * side + tangent.x * along,
          3.7,
          center.z + normal.z * side + tangent.z * along
        );
        post.rotation.y = yaw;
        post.castShadow = true;
        stall.add(post);
      });
    });
    const roofRail = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.38, 12), gateMat);
    roofRail.position.set(center.x + tangent.x * backOffset, 7.55, center.z + tangent.z * backOffset);
    roofRail.rotation.y = yaw;
    roofRail.castShadow = true;
    stall.add(roofRail);
    const door = new THREE.Group();
    door.position.set(center.x + tangent.x * frontOffset, 3.2, center.z + tangent.z * frontOffset);
    door.rotation.y = yaw;
    for (let bar = 0; bar < 4; bar += 1) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.25, 0.34, 0.55), doorMat);
      rail.position.y = -2.3 + bar * 1.38;
      rail.castShadow = true;
      door.add(rail);
    }
    for (let bar = -1; bar <= 1; bar += 1) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.6, 0.52), doorMat);
      rail.position.set(bar * 1.75, -0.22, 0);
      rail.castShadow = true;
      door.add(rail);
    }
    stall.add(door);
    group.userData.doors.push(door);
    group.add(stall);
  });

  const line = new THREE.Mesh(new THREE.BoxGeometry(62, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
  line.position.set(p.x, 0.16, p.z);
  line.rotation.y = Math.atan2(normal.x, normal.z);
  group.add(line);
  group.userData.tangent = tangent;
  return group;
}

function createGrandstands() {
  const glass = new THREE.MeshStandardMaterial({ color: 0x9cc9cf, roughness: 0.28, metalness: 0.16, transparent: true, opacity: 0.72 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd9d0bd, roughness: 0.78 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151d1f, roughness: 0.6 });

  addVenue(new THREE.Vector3(-70, 0, -360), -0.02, "ASCOT", 0xe8bb55, () => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const tier = new THREE.Mesh(new THREE.BoxGeometry(118 - i * 8, 6, 18), i % 2 ? glass : concrete);
      tier.position.set(0, 5 + i * 5, i * 6);
      tier.castShadow = true;
      g.add(tier);
    }
    return g;
  });

  addVenue(new THREE.Vector3(375, 0, -160), -1.18, "MEYDAN", 0x5aa7ff, () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(134, 26, 24), glass);
    body.position.y = 18;
    body.castShadow = true;
    g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(152, 5, 36), dark);
    roof.rotation.x = -0.12;
    roof.position.set(0, 35, -10);
    roof.castShadow = true;
    g.add(roof);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(162, 2, 5), new THREE.MeshStandardMaterial({ color: 0xe8bb55, roughness: 0.38, metalness: 0.25 }));
    lip.position.set(0, 38, -29);
    lip.castShadow = true;
    g.add(lip);
    return g;
  });

  addVenue(new THREE.Vector3(175, 0, 352), Math.PI + 0.04, "LONGCHAMP", 0xfff3d6, () => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(132, 28, 20), concrete);
    base.position.y = 16;
    base.castShadow = true;
    g.add(base);
    for (let i = -2; i <= 2; i += 1) {
      const sail = new THREE.Mesh(new THREE.ConeGeometry(11, 38, 4), glass);
      sail.position.set(i * 24, 42, -5);
      sail.rotation.y = Math.PI / 4;
      sail.castShadow = true;
      g.add(sail);
    }
    return g;
  });

  addVenue(new THREE.Vector3(-398, 0, 84), Math.PI / 2, "CHURCHILL", 0xffffff, () => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(92, 24, 22), concrete);
    base.position.y = 15;
    base.castShadow = true;
    g.add(base);
    [-32, 32].forEach((x) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(7, 9, 36, 8), concrete);
      tower.position.set(x, 35, 0);
      tower.castShadow = true;
      g.add(tower);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(11, 16, 8), dark);
      cap.position.set(x, 61, 0);
      cap.castShadow = true;
      g.add(cap);
    });
    return g;
  });
}

function addVenue(position, rotationY, label, color, factory) {
  const group = factory();
  group.position.copy(position);
  group.rotation.y = rotationY;
  world.add(group);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 14),
    new THREE.MeshStandardMaterial({ map: makeSignTexture(label, color), transparent: true, roughness: 0.55 })
  );
  sign.position.copy(position).add(new THREE.Vector3(0, 44, 0));
  sign.rotation.y = rotationY;
  world.add(sign);
}

function createTrees() {
  const materials = createTreeMaterials();
  const specs = [];
  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * TWO_PI + Math.sin(i * 1.91) * 0.14;
    const radius = 330 + Math.sin(i * 4.8) * 42 + Math.random() * 95;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.86;
    if (Math.abs(z) < 245 && Math.abs(x) < 300) continue;
    if (isNearTrack(x, z, TRACK_WIDTH / 2 + 58)) continue;
    specs.push({
      x,
      z,
      scale: 0.72 + Math.random() * 1.18,
      rotation: Math.random() * TWO_PI,
      tone: 0.82 + Math.random() * 0.28,
      lean: (Math.random() - 0.5) * 0.08,
    });
  }

  specs.forEach((spec, index) => {
    world.add(createLayeredTree(spec, materials, index));
  });
}

function createTreeMaterials() {
  const trunkSet = loadPolyHavenSurface("tree_small_02", 1.2, 2.4);
  const branchSet = loadPolyHavenSurface("tree_small_02_branch", 1.4, 1.4);
  const leafSet = loadPolyHavenSurface("tree_small_02_leaves", 2.2, 2.2);
  const leafAlpha = makeLeafCanopyAlphaTexture();
  return {
    trunk: createPolyHavenMaterial(trunkSet, {
      color: 0x9a6b43,
      roughness: 0.93,
      normalScale: 0.58,
    }),
    branch: createPolyHavenMaterial(branchSet, {
      color: 0x7f5938,
      roughness: 0.9,
      normalScale: 0.52,
    }),
    leaf: createPolyHavenMaterial(leafSet, {
      color: 0x477a42,
      roughness: 0.96,
      normalScale: 0.38,
      side: THREE.DoubleSide,
    }),
    deepLeaf: createPolyHavenMaterial(leafSet, {
      color: 0x244f35,
      roughness: 0.98,
      normalScale: 0.45,
      side: THREE.DoubleSide,
    }),
    sprayLeaf: createPolyHavenMaterial(leafSet, {
      color: 0x4e8549,
      roughness: 0.98,
      normalScale: 0.32,
      side: THREE.DoubleSide,
      alphaMap: leafAlpha,
      alphaTest: 0.36,
    }),
    deepSprayLeaf: createPolyHavenMaterial(leafSet, {
      color: 0x28583a,
      roughness: 0.98,
      normalScale: 0.36,
      side: THREE.DoubleSide,
      alphaMap: leafAlpha,
      alphaTest: 0.4,
    }),
    shadow: new THREE.MeshBasicMaterial({
      color: 0x061006,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  };
}

function createLayeredTree(spec, materials, index) {
  const tree = new THREE.Group();
  tree.position.set(spec.x, 0, spec.z);
  tree.rotation.set(spec.lean, spec.rotation, spec.lean * 0.65);
  tree.scale.setScalar(spec.scale);

  const baseShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), materials.shadow.clone());
  baseShadow.rotation.x = -Math.PI / 2;
  baseShadow.position.y = 0.018;
  baseShadow.scale.set(12 + spec.scale * 5, 7 + spec.scale * 3, 1);
  tree.add(baseShadow);

  const trunkHeight = 15 + (index % 5) * 1.1 + Math.random() * 5;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 2.2, trunkHeight, 14, 6), materials.trunk);
  addUv2FromUv(trunk.geometry);
  trunk.position.y = trunkHeight / 2;
  trunk.rotation.z = spec.lean * 1.6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 4; i += 1) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.62, 8 + Math.random() * 8, 10, 4), materials.branch);
    addUv2FromUv(branch.geometry);
    branch.position.set(Math.sin(i * 2.17) * 2.1, trunkHeight * (0.55 + Math.random() * 0.38), Math.cos(i * 1.83) * 2.1);
    branch.rotation.z = Math.PI / 2.7 + Math.random() * 0.36;
    branch.rotation.y = i * 1.19 + Math.random() * 0.5;
    branch.castShadow = true;
    branch.receiveShadow = true;
    tree.add(branch);
  }

  const crownCount = 4 + (index % 3);
  for (let i = 0; i < crownCount; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(5.2 + Math.random() * 2.2, 16, 10), i % 3 === 0 ? materials.deepLeaf : materials.leaf);
    addUv2FromUv(leaf.geometry);
    leaf.position.set(
      Math.sin(i * 1.72 + index) * (4.6 + Math.random() * 2.8),
      trunkHeight + 4.5 + Math.random() * 12,
      Math.cos(i * 2.03 + index * 0.3) * (4.4 + Math.random() * 2.9)
    );
    leaf.scale.set(1.05 + Math.random() * 0.55, 0.55 + Math.random() * 0.38, 0.8 + Math.random() * 0.5);
    leaf.rotation.set(Math.random() * 0.38, Math.random() * TWO_PI, Math.random() * 0.38);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    tree.add(leaf);
  }

  for (let i = 0; i < 2; i += 1) {
    const spray = new THREE.Mesh(new THREE.PlaneGeometry(13 + Math.random() * 5, 8 + Math.random() * 4, 2, 1), i % 2 ? materials.sprayLeaf : materials.deepSprayLeaf);
    addUv2FromUv(spray.geometry);
    spray.position.set(
      Math.sin(index + i * 1.37) * (5.2 + Math.random() * 3.8),
      trunkHeight + 7 + Math.random() * 12,
      Math.cos(index * 0.4 + i * 1.61) * (4.5 + Math.random() * 3.5)
    );
    spray.rotation.set(-0.2 + Math.random() * 0.58, spec.rotation + i * 1.08, Math.random() * 0.42 - 0.21);
    spray.castShadow = true;
    spray.receiveShadow = true;
    tree.add(spray);
  }

  return tree;
}

function prepareHeroTree(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    addUv2FromUv(child.geometry);
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.side = THREE.DoubleSide;
      material.roughness = Math.min(0.96, (material.roughness ?? 0.82) + 0.08);
      material.envMapIntensity = 0.22;
      if (material.alphaMap || material.transparent) {
        material.alphaTest = 0.25;
        material.depthWrite = false;
      }
    });
  });
}

function placeHeroTrees() {
  if (!treeAsset) return;
  const placements = [
    { x: -390, z: -290, height: 48, rotation: 0.32 },
    { x: 332, z: 268, height: 43, rotation: -0.78 },
    { x: -438, z: 145, height: 52, rotation: 1.18 },
    { x: 408, z: -252, height: 46, rotation: -1.36 },
  ];
  placements.forEach((spot) => {
    if (isNearTrack(spot.x, spot.z, TRACK_WIDTH / 2 + 70)) return;
    const tree = treeAsset.clone(true);
    tree.rotation.y = spot.rotation;
    fitObjectToHeight(tree, spot.height);
    tree.position.x += spot.x;
    tree.position.z += spot.z;
    world.add(tree);
  });
}

function createGrassField() {
  const geometry = new THREE.PlaneGeometry(0.18, 1.7, 1, 3);
  geometry.translate(0, 0.85, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4c8f42,
    roughness: 0.86,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });
  const count = 4600;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 12) {
    attempts += 1;
    const angle = Math.random() * TWO_PI;
    const radius = 95 + Math.random() * 520;
    const x = Math.cos(angle) * radius * (0.9 + Math.random() * 0.18);
    const z = Math.sin(angle) * radius * (0.72 + Math.random() * 0.18);
    if (isNearTrack(x, z, TRACK_WIDTH / 2 + 12)) continue;
    quat.setFromEuler(new THREE.Euler(0, Math.random() * TWO_PI, Math.random() * 0.18 - 0.09));
    const s = 0.55 + Math.random() * 1.45;
    scale.set(0.7 + Math.random() * 0.7, s, 0.7 + Math.random() * 0.4);
    matrix.compose(new THREE.Vector3(x, 0.02, z), quat, scale);
    mesh.setMatrixAt(placed, matrix);
    placed += 1;
  }
  mesh.count = placed;
  world.add(mesh);
}

function createAtmosphere() {
  environmentMotion = new THREE.Group();
  world.add(environmentMotion);

  const sunDisk = new THREE.Mesh(
    new THREE.CircleGeometry(38, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0.74, depthWrite: false })
  );
  sunDisk.position.set(-360, 300, -420);
  sunDisk.lookAt(camera.position);
  scene.add(sunDisk);

  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0xf5d59b,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 5; i += 1) {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(580, 86), hazeMat.clone());
    sheet.position.set(-120 + i * 92, 30 + i * 7, -310 - i * 20);
    sheet.rotation.x = -0.18;
    sheet.rotation.y = 0.14;
    environmentMotion.add(sheet);
  }

  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0xffdca0,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  for (let i = 0; i < 8; i += 1) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(34 + i * 5, 230 + Math.random() * 80), shaftMat.clone());
    shaft.position.set(-310 + i * 70, 88 + Math.random() * 38, -230 - Math.random() * 140);
    shaft.rotation.set(-0.52, 0.18 + Math.random() * 0.12, -0.22);
    environmentMotion.add(shaft);
  }

  const cloudTexture = makeCloudTexture();
  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(75 + Math.random() * 95, 20 + Math.random() * 28),
      new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, opacity: 0.38 + Math.random() * 0.18, depthWrite: false })
    );
    cloud.position.set(-460 + Math.random() * 920, 130 + Math.random() * 90, -480 + Math.random() * 220);
    cloud.rotation.y = Math.random() * 0.25 - 0.12;
    environmentMotion.add(cloud);
  }

  for (let i = 0; i < 10; i += 1) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({
        color: 0x172117,
        transparent: true,
        opacity: 0.055 + Math.random() * 0.035,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = Math.random() * TWO_PI;
    shadow.position.set(-520 + Math.random() * 1040, 0.17, -350 + Math.random() * 700);
    shadow.scale.set(70 + Math.random() * 135, 26 + Math.random() * 58, 1);
    environmentMotion.add(shadow);
  }
}

function createSponsorBoards() {
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x111719, roughness: 0.52, metalness: 0.12 });
  const labels = ["WORLD TURF", "ASCOT", "LONGCHAMP", "MEYDAN", "FINAL FURLONG", "JOCKEY CLUB"];
  for (let i = 0; i < 28; i += 1) {
    const t = i / 28;
    const offset = i % 2 ? TRACK_WIDTH / 2 + 20 : -TRACK_WIDTH / 2 - 20;
    const p = getTrackPoint(t, offset);
    const tangent = getTangent(t);
    const normal = getNormal(t);
    const label = labels[i % labels.length];
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(24, 5.4, 0.6),
      new THREE.MeshStandardMaterial({ map: makeSignTexture(label, i % 2 ? 0xe8bb55 : 0x5aa7ff), roughness: 0.4 })
    );
    board.position.set(p.x + normal.x * 4, 3.4, p.z + normal.z * 4);
    board.rotation.y = Math.atan2(normal.x, normal.z);
    board.castShadow = true;
    world.add(board);

    if (i % 4 === 0) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7, 8), boardMaterial);
      pole.position.set(p.x + normal.x * 4 - tangent.x * 8, 3.2, p.z + normal.z * 4 - tangent.z * 8);
      pole.castShadow = true;
      world.add(pole);
    }
  }
}

function createParticles() {
  rainSystem = createParticleSystem(1500, 0x9fc3d6, 0.9);
  snowSystem = createParticleSystem(900, 0xffffff, 1.8);
  rainSystem.visible = false;
  snowSystem.visible = false;
  scene.add(rainSystem, snowSystem);
}

function createParticleSystem(count, color, size) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 420;
    positions[i * 3 + 1] = Math.random() * 220 + 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 420;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.72, depthWrite: false })
  );
}

function createHorse(horse) {
  const group = new THREE.Group();
  group.userData.legs = [];

  if (horseAsset?.scene) {
    const model = cloneSkinned(horseAsset.scene);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        child.geometry.computeVertexNormals();
        if (child.material) {
          child.material = child.material.clone();
          child.material.color.lerp(new THREE.Color(horse.color), 0.32);
          child.material.roughness = Math.min(0.92, (child.material.roughness ?? 0.55) + 0.18);
          child.material.flatShading = false;
          child.material.envMapIntensity = 0.34;
        }
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const scale = 15.2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.rotation.y = Math.PI / 2;
    model.position.y = 3.7;
    group.add(model);

    const mixer = new THREE.AnimationMixer(model);
    horseAsset.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
    group.userData.mixer = mixer;
    group.userData.horseModel = model;
    group.userData.rider = addRider(group, horse, { x: 0, y: 0, scale: 0.56 });
    return group;
  }

  const coat = new THREE.MeshStandardMaterial({ color: horse.color, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x18120f, roughness: 0.82 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x2a1710, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(3.3, 8.4, 6, 12), coat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 5.8;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 10), coat);
  chest.scale.set(0.9, 1.0, 0.75);
  chest.position.set(4.7, 6.2, 0);
  chest.castShadow = true;
  group.add(chest);

  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 4.6, 5, 10), coat);
  neck.rotation.z = -0.46;
  neck.position.set(6.3, 8.3, 0);
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 2.7, 5, 10), coat);
  head.rotation.z = Math.PI / 2.8;
  head.position.set(8.3, 9.8, 0);
  head.castShadow = true;
  group.add(head);

  const mane = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 0.38), dark);
  mane.rotation.z = -0.52;
  mane.position.set(6.35, 10.15, 0);
  group.add(mane);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.48, 3.4), leather);
  saddle.position.set(-0.8, 8.52, 0);
  saddle.castShadow = true;
  group.add(saddle);

  addRider(group, horse, { x: -0.35, y: 12.2, scale: 1 });

  for (let i = 0; i < 4; i += 1) {
    const front = i < 2;
    const side = i % 2 === 0 ? -1 : 1;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 6.2, 8), coat);
    leg.position.set(front ? 3.5 : -3.5, 3, side * 1.65);
    leg.castShadow = true;
    group.userData.legs.push(leg);
    group.add(leg);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.74), dark);
    hoof.position.set(front ? 3.5 : -3.5, 0.15, side * 1.65);
    hoof.castShadow = true;
    group.add(hoof);
  }

  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 4.5, 5, 8), dark);
  tail.position.set(-7.4, 6.1, 0);
  tail.rotation.z = 0.82;
  tail.castShadow = true;
  group.add(tail);

  group.scale.setScalar(1.14);
  return group;
}

function addRider(group, horse, options = {}) {
  const riderScale = options.scale ?? 1;
  const riderX = options.x ?? -0.35;
  const riderY = options.y ?? 12.2;
  const silk = new THREE.MeshStandardMaterial({ color: horse.silk, roughness: 0.48, metalness: 0.03 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc99264, roughness: 0.7 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x17100c, roughness: 0.7 });
  const rider = new THREE.Group();
  rider.position.set(riderX, riderY, 0);
  rider.scale.setScalar(riderScale);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 2.4, 6, 12), silk);
  torso.position.set(0, 0, 0);
  torso.rotation.z = -0.24;
  torso.castShadow = true;
  rider.add(torso);
  const headR = new THREE.Mesh(new THREE.SphereGeometry(0.64, 16, 10), skin);
  headR.position.set(0.37, 1.7, 0);
  headR.castShadow = true;
  rider.add(headR);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 8, 0, TWO_PI, 0, Math.PI / 2), silk);
  helmet.position.set(0.37, 2.13, 0);
  helmet.castShadow = true;
  rider.add(helmet);
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.0, 4, 8), boot);
    leg.position.set(-0.25, -1.5, side * 0.88);
    leg.rotation.z = 0.36;
    leg.castShadow = true;
    rider.add(leg);
  });
  group.add(rider);
  return rider;
}

function animate() {
  const now = performance.now() / 1000;
  const dt = Math.min(now - time.last, 0.033);
  time.last = now;
  time.elapsed += dt;
  if (state.started && !state.finished) updateRace(dt);
  updateGate(dt);
  state.racers.forEach((racer) => {
    racer.mixer?.update(dt * THREE.MathUtils.clamp(racer.speed / 72, 0.45, 1.55));
    anchorHorseToLane(racer.group);
    syncRiderToHorse(racer.group);
    updateContactPatch(
      racer,
      getTrackPoint(racer.progress % 1, racer.lane),
      getTangent(racer.progress % 1),
      THREE.MathUtils.clamp(racer.speed / 120, 0, 1)
    );
  });
  updateParticles(dt);
  updateEnvironmentMotion(dt);
  renderCamera(dt);
  composer.render(dt);
  requestAnimationFrame(animate);
}

function createContactPatch(horse) {
  const group = new THREE.Group();
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x060503,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
  });
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0xc6a36b,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const body = new THREE.Mesh(new THREE.CircleGeometry(1, 32), shadowMat.clone());
  body.rotation.x = -Math.PI / 2;
  body.scale.set(6.8, 1.8, 1);
  body.position.set(-0.8, 0.035, 0);
  group.add(body);

  group.userData.hooves = [];
  [
    [3.4, -1.05],
    [3.4, 1.05],
    [-3.5, -1.05],
    [-3.5, 1.05],
  ].forEach(([x, z]) => {
    const hoof = new THREE.Mesh(new THREE.CircleGeometry(1, 18), shadowMat.clone());
    hoof.rotation.x = -Math.PI / 2;
    hoof.scale.set(0.72, 0.24, 1);
    hoof.position.set(x, 0.045, z);
    group.userData.hooves.push(hoof);
    group.add(hoof);
  });

  group.userData.dust = [];
  for (let i = 0; i < 9; i += 1) {
    const puff = new THREE.Mesh(new THREE.CircleGeometry(1, 12), dustMat.clone());
    puff.rotation.x = -Math.PI / 2;
    puff.scale.set(0.35 + i * 0.06, 0.14 + i * 0.025, 1);
    puff.position.set(-4.8 - i * 0.9, 0.055, (Math.random() - 0.5) * 3.3);
    group.userData.dust.push(puff);
    group.add(puff);
  }

  group.userData.baseColor = horse.color;
  group.visible = false;
  return group;
}

function updateContactPatch(racer, p, tangent, speedRatio) {
  if (!racer.contact) return;
  racer.contact.visible = state.started;
  racer.contact.position.set(p.x, 0, p.z);
  racer.contact.rotation.y = Math.atan2(-tangent.z, tangent.x);
  const gallop = time.elapsed * (12 + racer.speed * 0.07) + racer.aiPhase;
  racer.contact.userData.hooves.forEach((hoof, index) => {
    const pulse = Math.max(0, Math.sin(gallop + index * Math.PI * 0.72));
    hoof.material.opacity = 0.12 + pulse * 0.32 * speedRatio;
    hoof.scale.x = 0.62 + pulse * 0.38;
  });
  racer.contact.userData.dust.forEach((puff, index) => {
    const wave = (Math.sin(gallop * 0.64 + index * 1.7) + 1) * 0.5;
    puff.material.opacity = speedRatio * (0.06 + wave * 0.12);
    puff.position.y = 0.052 + wave * 0.025;
  });
}

function anchorHorseToLane(group) {
  const model = group.userData.horseModel;
  if (!model) return;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const bottom = new THREE.Vector3(center.x, box.min.y, center.z);
  group.worldToLocal(center);
  group.worldToLocal(bottom);
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y += 0.025 - bottom.y;
}

function syncRiderToHorse(group) {
  if (!group.userData.horseModel || !group.userData.rider) return;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group.userData.horseModel);
  const center = box.getCenter(new THREE.Vector3());
  const top = new THREE.Vector3(center.x, box.max.y, center.z);
  group.worldToLocal(center);
  group.worldToLocal(top);
  group.userData.rider.position.set(center.x - 0.75, top.y - 0.58, center.z);
}

function updateRace(dt) {
  const player = state.racers[state.selected];
  state.raceTime += dt;
  const released = state.raceTime >= RELEASE_DELAY;
  const lapProgress = THREE.MathUtils.clamp(player.progress / LAPS, 0, 0.9999);
  const weatherIndex = Math.min(weatherStages.length - 1, Math.floor(lapProgress * weatherStages.length));
  if (weatherIndex !== state.weatherIndex) {
    state.weatherIndex = weatherIndex;
    applyWeather(weatherStages[weatherIndex]);
  }
  const weather = weatherStages[state.weatherIndex];
  if (released && !player.finished) updatePlayerRhythm(dt, weather);

  state.racers.forEach((racer, index) => {
    if (racer.finished) {
      racer.progress = LAPS;
      racer.speed = THREE.MathUtils.lerp(racer.speed, 0, 1 - Math.pow(0.0001, dt));
      placeRacer(racer, dt);
      return;
    }

    const isPlayer = index === state.selected;
    const effort = isPlayer ? state.pace : getAiPace(racer, dt, weather);
    const effortNorm = effort / 100;
    const cadencePenalty = Math.abs(effort - weather.optimal) / 58;
    const exhaustion = THREE.MathUtils.smoothstep(racer.energy, 0, 38);
    updatePhysicalWear(racer, effort, weather, isPlayer, dt);
    const wearPenalty = 1 - THREE.MathUtils.smoothstep(racer.wear, 8, 100) * 0.42;
    const stats = racer.horse;
    const laneDrag = 1 - Math.abs(racer.lane) * 0.0012;
    const baseSpeed = 70 + effortNorm * 54;
    const speed =
      baseSpeed *
      stats.speed *
      weather.traction *
      wearPenalty *
      laneDrag *
      (1 - cadencePenalty * 0.12) *
      (1 - exhaustion * 0.45);

    const underPace = THREE.MathUtils.clamp((weather.optimal - effort) / 42, 0, 1);
    const overwork = THREE.MathUtils.smoothstep(effort, weather.optimal + 6, 100);
    const effortDrain = Math.max(0, effortNorm - 0.36) * 14;
    const cadenceDrain = Math.max(0, effort - weather.optimal) / 58 * 6;
    const weatherTax = weather.drain * THREE.MathUtils.lerp(0.45, 3.2, effortNorm);
    const drain = (effortDrain + cadenceDrain + weatherTax + overwork * 7) / stats.stamina;
    const recovery =
      underPace > 0
        ? (2.2 + underPace * 9.5 + Math.max(0, 42 - effort) * 0.18) * stats.grit * (1 - racer.wear / 150)
        : 0;
    if (released) {
      racer.energy = THREE.MathUtils.clamp(racer.energy + (recovery - drain * 1.28) * dt, 0, 100);
      racer.speed = THREE.MathUtils.lerp(racer.speed, speed, 1 - Math.pow(0.0008, dt));
      racer.progress += (racer.speed / TRACK_LENGTH) * dt;
      if (racer.progress >= LAPS) {
        racer.progress = LAPS;
        racer.finished = true;
        racer.finishTime = Math.max(0, state.raceTime - RELEASE_DELAY);
      }
    } else {
      racer.speed = THREE.MathUtils.lerp(racer.speed, 0, 1 - Math.pow(0.0001, dt));
    }

    if (isPlayer) {
      racer.laneTarget = THREE.MathUtils.clamp(racer.laneTarget + state.steer * dt * 18 * weather.traction, -LANE_LIMIT, LANE_LIMIT);
    } else {
      racer.laneTarget = THREE.MathUtils.clamp(
        LANES[index] + Math.sin(time.elapsed * 0.45 + racer.aiPhase) * 1.35,
        -LANE_LIMIT,
        LANE_LIMIT
      );
    }
    racer.lane = THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(racer.lane, racer.laneTarget, 1 - Math.pow(0.002, dt)),
      -LANE_LIMIT,
      LANE_LIMIT
    );
    placeRacer(racer, dt);
  });

  const sorted = [...state.racers].sort(compareRacers);
  rankEl.textContent = `${sorted.indexOf(player) + 1}/8`;
  energyBar.style.width = `${Math.round(player.energy)}%`;
  energyText.textContent = `${player.energy.toFixed(1)}%`;
  wearBar.style.width = `${Math.round(player.wear)}%`;
  wearText.textContent = `${player.wear.toFixed(1)}%`;
  weatherEl.textContent = weather.name;
  venueEl.textContent = weather.venue;
  lapEl.textContent = `${Math.min(LAPS, Math.max(1, Math.floor(Math.max(player.progress, 0)) + 1))}/${LAPS}`;

  if (state.racers.every((racer) => racer.finished)) finishRace();
}

function compareRacers(a, b) {
  if (a.finished && b.finished) return a.finishTime - b.finishTime;
  if (a.finished) return -1;
  if (b.finished) return 1;
  return b.progress - a.progress;
}

function updatePlayerRhythm(dt, weather) {
  if (state.advanceHeld) {
    state.holdPulseTimer += dt;
    const holdInterval = THREE.MathUtils.lerp(0.34, 0.2, THREE.MathUtils.smoothstep(state.pace, 45, 92));
    while (state.holdPulseTimer >= holdInterval) {
      state.holdPulseTimer -= holdInterval;
      registerAdvancePress();
    }
  } else {
    state.holdPulseTimer = 0;
  }

  const sinceTap = state.lastAdvanceAt >= 0 ? time.elapsed - state.lastAdvanceAt : 9;
  const idleDrop = sinceTap > 0.42 ? 24 : 10;
  const weatherDrag = weather.name === "Sol" ? 1 : weather.name === "Chuva" ? 1.18 : 1.32;
  state.tapRate = THREE.MathUtils.lerp(state.tapRate, 0, 1 - Math.pow(0.12, dt));
  setPace(state.pace - idleDrop * weatherDrag * dt);
}

function updatePhysicalWear(racer, effort, weather, isPlayer, dt) {
  const optimalOvershoot = THREE.MathUtils.smoothstep(effort, weather.optimal + 7, 100);
  const tapAbuse = isPlayer ? THREE.MathUtils.smoothstep(state.tapRate, 4.8, 8.4) : 0;
  const lowEnergyStress = THREE.MathUtils.smoothstep(38 - racer.energy, 0, 32);
  const relief = effort < weather.optimal - 12 ? 0.42 : 0.08;
  racer.strain = THREE.MathUtils.clamp(
    racer.strain + (optimalOvershoot * 0.72 + tapAbuse * 0.58 + lowEnergyStress * 0.38 - relief) * dt,
    0,
    1
  );
  const wearGain = (optimalOvershoot * 2.8 + tapAbuse * 2.4 + lowEnergyStress * 1.55) * (0.65 + racer.strain) * weather.drain;
  racer.wear = THREE.MathUtils.clamp(racer.wear + wearGain * dt, 0, 100);
}

function updateGate() {
  if (!startGate?.userData.doors) return;
  startGate.visible = !state.started || state.raceTime < RELEASE_DELAY;
  const openAmount = state.started ? THREE.MathUtils.smoothstep(state.raceTime, 0.45, RELEASE_DELAY) : 0;
  startGate.userData.doors.forEach((door) => {
    door.position.y = THREE.MathUtils.lerp(3.2, -3.5, openAmount);
  });
}

function getAiPace(racer, dt, weather) {
  const lap = racer.progress / LAPS;
  const finalPush = lap > 0.76 ? 9 + racer.horse.grit * 6 : 0;
  const lowEnergy = racer.energy < 32 ? -14 : 0;
  const variation = Math.sin(time.elapsed * 0.72 + racer.aiPhase) * 5;
  racer.aiPace = THREE.MathUtils.lerp(racer.aiPace, weather.optimal + variation + finalPush + lowEnergy, dt * 0.55);
  return THREE.MathUtils.clamp(racer.aiPace, 38, 96);
}

function placeRacer(racer, dt, forceStall = false) {
  const p = getTrackPoint(racer.progress % 1, racer.lane);
  const tangent = getTangent(racer.progress % 1);
  racer.group.position.set(p.x, 0, p.z);
  racer.group.rotation.y = Math.atan2(-tangent.z, tangent.x);

  const bob = forceStall ? 0 : Math.sin(time.elapsed * (9 + racer.speed * 0.03) + racer.aiPhase) * 0.18;
  racer.group.position.y = bob;
  racer.group.userData.legs.forEach((leg, index) => {
    const swing = Math.sin(time.elapsed * (11 + racer.speed * 0.055) + index * Math.PI) * 0.62;
    leg.rotation.z = swing;
    leg.rotation.x = swing * 0.18;
  });
  if (dt) state.cameraShake = THREE.MathUtils.lerp(state.cameraShake, Math.min(1, racer.speed / 140), dt * 2);
}

function finishRace() {
  state.finished = true;
  hud.classList.add("hidden");
  result.classList.remove("hidden");

  const final = [...state.racers].sort(compareRacers);
  const playerRank = final.indexOf(state.racers[state.selected]) + 1;
  resultTitle.textContent = playerRank === 1 ? "Vitoria!" : `${playerRank}º lugar`;
  resultCopy.textContent =
    playerRank <= 3
      ? "Seu ritmo sustentou velocidade ate o fechamento do circuito."
      : "O conjunto perdeu rendimento no final. Cadencie os toques de avanço para chegar mais forte.";
  podiumEl.innerHTML = final
    .map(
      (racer, index) =>
        `<div><strong>${index + 1}. ${racer.horse.name}</strong><span>${formatRaceTime(racer.finishTime)}</span></div>`
    )
    .join("");
}

function formatRaceTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds - minutes * 60;
  return `${minutes}:${remaining.toFixed(2).padStart(5, "0")}`;
}

function renderCamera(dt) {
  const active = state.racers[state.selected] || { progress: 0.06, lane: -1 };
  const t = active.progress % 1;
  const p = getTrackPoint(t, active.lane);
  const tangent = getTangent(t);
  const side = getNormal(t);
  const mobile = window.innerWidth < 760;
  const back = mobile ? 36 : 44;
  const height = mobile ? 10.5 : 13.5;
  const camTarget = new THREE.Vector3(
    p.x - tangent.x * back + side.x * 1.5,
    height + Math.sin(time.elapsed * 8) * state.cameraShake * 0.18,
    p.z - tangent.z * back + side.z * 1.5
  );
  camera.position.lerp(camTarget, 1 - Math.pow(0.001, dt));
  const look = new THREE.Vector3(p.x + tangent.x * 44, 4.8, p.z + tangent.z * 44);
  camera.lookAt(look);
  cameraFill.position.copy(camera.position).add(new THREE.Vector3(0, 4, 0));
  bokehPass.uniforms.focus.value = THREE.MathUtils.lerp(
    bokehPass.uniforms.focus.value,
    camera.position.distanceTo(look),
    1 - Math.pow(0.02, dt)
  );
}

function applyWeather(weather) {
  scene.background.set(weather.sky);
  scene.fog.color.set(weather.fog);
  scene.fog.near = 240 * weather.visibility;
  scene.fog.far = 760 * weather.visibility;
  trackMaterial.color.set(weather.ground);
  rainSystem.visible = weather.name === "Chuva";
  snowSystem.visible = weather.name === "Neve";
  sun.intensity = weather.name === "Sol" ? 3.2 : weather.name === "Chuva" ? 1.25 : 1.65;
}

function updateParticles(dt) {
  if (rainSystem.visible) {
    const positions = rainSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= dt * 120;
      positions[i] -= dt * 16;
      if (positions[i + 1] < 0) positions[i + 1] = 220;
    }
    rainSystem.geometry.attributes.position.needsUpdate = true;
    rainSystem.position.copy(camera.position).multiply(new THREE.Vector3(1, 0, 1));
  }
  if (snowSystem.visible) {
    const positions = snowSystem.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= dt * 32;
      positions[i] += Math.sin(time.elapsed + i) * dt * 7;
      if (positions[i + 1] < 0) positions[i + 1] = 210;
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;
    snowSystem.position.copy(camera.position).multiply(new THREE.Vector3(1, 0, 1));
  }
}

function updateEnvironmentMotion(dt) {
  if (!environmentMotion) return;
  environmentMotion.children.forEach((child, index) => {
    if (child.geometry?.parameters?.height && child.position.y > 40) {
      child.material.opacity = child.material.opacity;
      child.position.x += dt * (0.8 + (index % 5) * 0.16);
      if (child.position.x > 560) child.position.x = -560;
      return;
    }
    if (child.rotation.x < -1.2) {
      child.position.x += dt * (2.2 + (index % 3) * 0.45);
      child.position.z += Math.sin(time.elapsed * 0.08 + index) * dt * 0.7;
      if (child.position.x > 610) child.position.x = -610;
    }
  });
}

function getTrackPoint(t, offset = 0) {
  const angle = -t * TWO_PI - Math.PI / 2;
  const normal = getNormal(t);
  const wobble = Math.sin(angle * 3) * 6;
  return {
    x: Math.cos(angle) * (TRACK_A + wobble) + normal.x * offset,
    z: Math.sin(angle) * (TRACK_B - wobble * 0.35) + normal.z * offset,
  };
}

function getTangent(t) {
  const angle = -t * TWO_PI - Math.PI / 2;
  const dx = Math.sin(angle) * TRACK_A;
  const dz = -Math.cos(angle) * TRACK_B;
  const length = Math.hypot(dx, dz);
  return { x: dx / length, z: dz / length };
}

function getNormal(t) {
  const tangent = getTangent(t);
  return { x: tangent.z, z: -tangent.x };
}

function loadPbrSet(basePath, repeatX, repeatY) {
  const set = {
    map: textureLoader.load(`${basePath}_Color.jpg`),
    normalMap: textureLoader.load(`${basePath}_NormalGL.jpg`),
    roughnessMap: textureLoader.load(`${basePath}_Roughness.jpg`),
    aoMap: textureLoader.load(`${basePath}_AmbientOcclusion.jpg`),
    displacementMap: textureLoader.load(`${basePath}_Displacement.jpg`),
  };
  Object.entries(set).forEach(([key, texture]) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = 16;
    if (key === "map") texture.colorSpace = THREE.SRGBColorSpace;
  });
  return set;
}

function loadPolyHavenSurface(name, repeatX, repeatY) {
  const set = {
    map: textureLoader.load(`${TREE_TEXTURE_PATH}/${name}_diff_1k.jpg`),
    normalMap: textureLoader.load(`${TREE_TEXTURE_PATH}/${name}_nor_gl_1k.jpg`),
    roughnessMap: textureLoader.load(`${TREE_TEXTURE_PATH}/${name}_arm_1k.jpg`),
    aoMap: textureLoader.load(`${TREE_TEXTURE_PATH}/${name}_arm_1k.jpg`),
  };
  Object.entries(set).forEach(([key, texture]) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = 16;
    if (key === "map") texture.colorSpace = THREE.SRGBColorSpace;
  });
  return set;
}

function createPbrMaterial(textures, options = {}) {
  return new THREE.MeshStandardMaterial({
    color: options.color ?? 0xffffff,
    map: textures.map,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(options.normalScale ?? 1, options.normalScale ?? 1),
    roughnessMap: textures.roughnessMap,
    aoMap: textures.aoMap,
    displacementMap: textures.displacementMap,
    displacementScale: options.displacementScale ?? 0,
    roughness: options.roughness ?? 0.88,
    metalness: options.metalness ?? 0,
  });
}

function createPolyHavenMaterial(textures, options = {}) {
  return new THREE.MeshStandardMaterial({
    color: options.color ?? 0xffffff,
    map: textures.map,
    alphaMap: options.alphaMap,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(options.normalScale ?? 1, options.normalScale ?? 1),
    roughnessMap: textures.roughnessMap,
    aoMap: textures.aoMap,
    roughness: options.roughness ?? 0.9,
    metalness: 0,
    transparent: Boolean(options.alphaMap),
    alphaTest: options.alphaTest ?? 0,
    side: options.side ?? THREE.FrontSide,
  });
}

function addUv2FromUv(geometry) {
  if (!geometry?.attributes?.uv || geometry.attributes.uv2) return;
  geometry.setAttribute("uv2", new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
}

function fitObjectToHeight(object, targetHeight) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(1, size.y);
  object.scale.setScalar(scale);
  object.position.x -= center.x * scale;
  object.position.z -= center.z * scale;
  object.position.y -= box.min.y * scale;
}

function isNearTrack(x, z, margin) {
  let nearest = Infinity;
  for (let i = 0; i < 96; i += 1) {
    const center = getTrackPoint(i / 96, 0);
    const distance = Math.hypot(x - center.x, z - center.z);
    if (distance < nearest) nearest = distance;
    if (nearest < margin) return true;
  }
  return false;
}

function makeGrassTexture(size, lowColor, highColor) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const low = new THREE.Color(lowColor);
  const high = new THREE.Color(highColor);
  ctx.fillStyle = `#${low.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 8; i += 1) {
    const mix = Math.random();
    const color = low.clone().lerp(high, mix);
    ctx.strokeStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth = 1 + Math.random() * 2.5;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.random() * 18 - 9, y + 16 + Math.random() * 36);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.anisotropy = 12;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCloudTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 180;
  const ctx = textureCanvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 180);
  for (let i = 0; i < 26; i += 1) {
    const x = 40 + Math.random() * 430;
    const y = 55 + Math.random() * 55;
    const radius = 30 + Math.random() * 55;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, "rgba(255,255,255,0.8)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TWO_PI);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLeafCanopyAlphaTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i += 1) {
    const x = 40 + Math.random() * 432;
    const y = 36 + Math.random() * 440;
    const rx = 10 + Math.random() * 28;
    const ry = 5 + Math.random() * 18;
    const angle = Math.random() * TWO_PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.2, 1.1);
  texture.anisotropy = 8;
  return texture;
}

function makeTrackTexture(bump = false) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = bump ? "#808080" : "#b4743d";
  ctx.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 2200; i += 1) {
    const alpha = bump ? Math.random() * 0.32 : Math.random() * 0.22;
    ctx.fillStyle = bump
      ? `rgba(${100 + Math.random() * 90}, ${100 + Math.random() * 90}, ${100 + Math.random() * 90}, ${alpha})`
      : Math.random() > 0.5
        ? `rgba(255,217,158,${alpha})`
        : `rgba(63,38,20,${alpha})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 128, 1 + Math.random() * 10, 1);
  }
  for (let y = 16; y < 128; y += 24) {
    ctx.strokeStyle = bump ? "rgba(255,255,255,0.16)" : "rgba(255,238,202,0.14)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + Math.sin(y) * 4);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeSignTexture(label, color) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 160;
  const ctx = textureCanvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = "rgba(8, 14, 16, 0.82)";
  ctx.roundRect(18, 24, 476, 112, 20);
  ctx.fill();
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#f8f1df";
  ctx.font = "800 54px Inter, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 82);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
  gtaoPass.setSize(width, height);
  bokehPass.setSize(width, height);
}
