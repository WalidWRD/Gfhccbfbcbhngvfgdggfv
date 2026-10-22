import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('scene');
const ui = {
  score: document.getElementById('score'),
  ammo: document.getElementById('ammo'),
  health: document.getElementById('health'),
  objective: document.getElementById('objective-bar'),
  hitmarker: document.getElementById('hitmarker'),
  hint: document.getElementById('hint'),
  toast: document.getElementById('toast'),
  radar: document.getElementById('radar'),
  boot: document.getElementById('boot'),
  fire: document.getElementById('fire')
};

let seed = 0x5eed1;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const clamp = THREE.MathUtils.clamp;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1014);
scene.fog = new THREE.FogExp2(0x0a1014, 0.015);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 240);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.72, 12);
scene.add(camera);

const player = { x: 0, z: 12, yaw: 0, pitch: 0, vx: 0, vz: 0, bob: 0 };
const world = new THREE.Group();
scene.add(world);

function concreteTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#343b3e';
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() * 30 - 15) | 0;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(10, 14, 15, ${0.05 + rand() * 0.12})`;
    const r = 8 + rand() * 70;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(190, 225, 235, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 64; i <= size; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function targetTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = '#d9d3c3';
  ctx.beginPath(); ctx.arc(128, 128, 122, 0, Math.PI * 2); ctx.fill();
  const rings = [
    { r: 116, color: '#c8323d' },
    { r: 92, color: '#2c3235' },
    { r: 68, color: '#c8323d' },
    { r: 44, color: '#2c3235' },
    { r: 22, color: '#c8323d' }
  ];
  for (const ring of rings) {
    ctx.fillStyle = ring.color;
    ctx.beginPath(); ctx.arc(128, 128, ring.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(128, 128, 122, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 42; i++) {
    ctx.fillStyle = `rgba(20, 24, 25, ${0.12 + rand() * 0.25})`;
    ctx.beginPath();
    ctx.arc(24 + rand() * 208, 24 + rand() * 208, 1 + rand() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(4, 12, 15, 0.86)';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = 'rgba(105, 240, 255, 0.65)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 1004, 236);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#dffcff';
  ctx.font = '700 138px "Arial Narrow", "Segoe UI", sans-serif';
  ctx.fillText('GEN1', 512, 156);
  ctx.fillStyle = 'rgba(255, 196, 107, 0.92)';
  ctx.font = '600 27px "Segoe UI", sans-serif';
  ctx.fillText('LIVE FIRE RANGE  //  SECTOR 07', 512, 212);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function buildSky() {
  const geometry = new THREE.SphereGeometry(180, 32, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x071725) },
      horizonColor: { value: new THREE.Color(0x223b40) },
      glowColor: { value: new THREE.Color(0xff9a52) }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 glowColor;
      void main() {
        float h = normalize(vWorld).y;
        vec3 color = mix(horizonColor, topColor, smoothstep(-0.05, 0.6, h));
        float glow = pow(max(0.0, 1.0 - abs(h + 0.02)), 7.0);
        color += glowColor * glow * 0.34;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.frustumCulled = false;
  scene.add(sky);
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x191a14, 0.55));

  const sun = new THREE.DirectionalLight(0xffd2a1, 2.6);
  sun.position.set(16, 24, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x63eaff, 0.9);
  rim.position.set(-18, 12, -20);
  scene.add(rim);

  const neonA = new THREE.PointLight(0x46e7ff, 18, 26, 2);
  neonA.position.set(-14, 4.6, -6);
  scene.add(neonA);

  const neonB = new THREE.PointLight(0xff8a4c, 15, 24, 2);
  neonB.position.set(15, 3.8, 3);
  scene.add(neonB);

  const neonC = new THREE.PointLight(0x59ffc2, 12, 20, 2);
  neonC.position.set(5, 3.2, -16);
  scene.add(neonC);
}

function box(w, h, d, color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.45,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function buildArena() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.94, metalness: 0.06 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const metal = 0x1a2429;
  const dark = 0x0e161a;

  const walls = [
    [0, 3.5, -23, 46, 7, 0.6],
    [0, 3.5, 23, 46, 7, 0.6],
    [-23, 3.5, 0, 0.6, 7, 46],
    [23, 3.5, 0, 0.6, 7, 46]
  ];
  for (const [x, y, z, w, h, d] of walls) {
    const wall = box(w, h, d, metal, { roughness: 0.7, metalness: 0.5 });
    wall.position.set(x, y, z);
    world.add(wall);
  }

  for (let i = -20; i <= 20; i += 4) {
    for (const z of [-22.62, 22.62]) {
      const rib = box(0.22, 7, 0.16, dark, { roughness: 0.8, metalness: 0.35 });
      rib.position.set(i, 3.5, z);
      world.add(rib);
    }
    for (const x of [-22.62, 22.62]) {
      const rib = box(0.16, 7, 0.22, dark, { roughness: 0.8, metalness: 0.35 });
      rib.position.set(x, 3.5, i);
      world.add(rib);
    }
  }

  const addStrip = (w, d, x, y, z, color) => {
    const strip = box(w, 0.075, d, 0x10181b, {
      roughness: 0.4,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 2.4,
      castShadow: false
    });
    strip.position.set(x, y, z);
    world.add(strip);
  };
  for (const z of [-22.6, 22.6]) {
    addStrip(45.5, 0.09, 0, 2.35, z, 0x54eaff);
    addStrip(45.5, 0.09, 0, 5.05, z, 0xffa45e);
  }
  for (const x of [-22.6, 22.6]) {
    addStrip(0.09, 45.5, x, 2.35, 0, 0x54eaff);
    addStrip(0.09, 45.5, x, 5.05, 0, 0xffa45e);
  }

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 3.25),
    new THREE.MeshBasicMaterial({ map: signTexture(), toneMapped: false })
  );
  sign.position.set(0, 4.35, -22.66);
  world.add(sign);

  const pad = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 3.58, 72),
    new THREE.MeshBasicMaterial({ color: 0x62f4ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.02, -2);
  world.add(pad);

  const padInner = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 1.76, 64),
    new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
  );
  padInner.rotation.x = -Math.PI / 2;
  padInner.position.set(0, 0.025, -2);
  world.add(padInner);

  for (let i = -18; i <= 18; i += 6) {
    const line = box(0.1, 0.014, 38, 0x0c1215, {
      roughness: 1,
      metalness: 0,
      emissive: 0x1f8a99,
      emissiveIntensity: 0.42,
      castShadow: false
    });
    line.position.set(i, 0.012, -4);
    world.add(line);
  }

  const lane = box(0.16, 0.012, 8, 0x141b1e, {
    roughness: 1,
    metalness: 0,
    emissive: 0xffb45e,
    emissiveIntensity: 0.55,
    castShadow: false
  });
  lane.position.set(0, 0.014, 7);
  world.add(lane);

  const crateColors = [0x3a443c, 0x2b3539, 0x4a4030, 0x26343a];
  const crates = [
    [-14, 1.1, -4, 2.2, 2.2, 2.2, 0.1],
    [-14.2, 3.3, -4.1, 1.8, 1.8, 1.8, -0.15],
    [14.5, 1.0, -2, 2.0, 2.0, 2.0, -0.2],
    [14.2, 3.0, -2.2, 1.9, 1.9, 1.9, 0.12],
    [-11, 0.7, 7, 1.4, 1.4, 1.4, 0.3],
    [11.5, 0.8, 6, 1.6, 1.6, 1.6, -0.35],
    [-18, 0.9, -15, 1.8, 1.8, 1.8, 0.2],
    [18, 1.2, -14, 2.4, 2.4, 2.4, -0.1]
  ];
  for (let i = 0; i < crates.length; i++) {
    const [x, y, z, w, h, d, ry] = crates[i];
    const crate = box(w, h, d, crateColors[i % crateColors.length], { roughness: 0.82, metalness: 0.24 });
    crate.position.set(x, y, z);
    crate.rotation.y = ry;
    world.add(crate);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(crate.geometry),
      new THREE.LineBasicMaterial({ color: 0x8ba3aa, transparent: true, opacity: 0.18 })
    );
    crate.add(edges);
  }

  const container = box(7, 2.9, 2.8, 0x233a3b, { roughness: 0.66, metalness: 0.42 });
  container.position.set(-18.2, 1.46, -10);
  container.rotation.y = 0.16;
  world.add(container);
  const containerStripe = box(0.12, 2.5, 2.7, 0x0d1417, {
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0xffb35c,
    emissiveIntensity: 1.8,
    castShadow: false
  });
  containerStripe.position.set(-14.75, 1.5, -10);
  containerStripe.rotation.y = 0.16;
  world.add(containerStripe);

  const barrelPositions = [[-19, -1], [-19.5, 0.1], [19, -7], [19.6, -6]];
  for (const [x, z] of barrelPositions) {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 1.15, 20),
      new THREE.MeshStandardMaterial({ color: 0x8a4a2a, roughness: 0.74, metalness: 0.45 })
    );
    barrel.position.set(x, 0.58, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    world.add(barrel);
    for (const y of [0.34, 0.82]) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.435, 0.435, 0.08, 20),
        new THREE.MeshStandardMaterial({ color: 0x1c2224, roughness: 0.5, metalness: 0.5 })
      );
      band.position.set(x, y, z);
      world.add(band);
    }
  }

  for (const [x, z] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
    const tower = box(1.1, 7.2, 1.1, 0x151f24, { roughness: 0.62, metalness: 0.5 });
    tower.position.set(x, 3.6, z);
    world.add(tower);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a0b0d, emissive: 0xff3344, emissiveIntensity: 4 })
    );
    beacon.position.set(x, 7.35, z);
    world.add(beacon);
  }

  const fence = new THREE.Group();
  for (let i = -22; i <= 22; i += 2.2) {
    const post = box(0.07, 1.1, 0.07, 0x1a2327, { roughness: 0.6, metalness: 0.6, castShadow: false });
    post.position.set(i, 0.55, -20.4);
    fence.add(post);
    const wire = box(2.1, 0.025, 0.025, 0x0a0f12, {
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0x2ecbdc,
      emissiveIntensity: 0.35,
      castShadow: false
    });
    wire.position.set(i + 1.05, 0.9, -20.4);
    fence.add(wire);
  }
  world.add(fence);
}

const targetPlates = [];
const targets = [];

function buildTargets() {
  const face = targetTexture();
  const positions = [
    [-9, -4], [-3, -7], [3, -7], [9, -4],
    [-6.5, -13], [6.5, -13], [0, -17]
  ];
  for (let i = 0; i < positions.length; i++) {
    const [x, z] = positions[i];
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.58, 0.1, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a2226, roughness: 0.7, metalness: 0.5 })
    );
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 1.25, 10),
      new THREE.MeshStandardMaterial({ color: 0x4c5a60, roughness: 0.45, metalness: 0.75 })
    );
    pole.position.y = 0.72;
    pole.castShadow = true;
    group.add(pole);

    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(0.64, 40),
      new THREE.MeshStandardMaterial({
        map: face,
        roughness: 0.62,
        metalness: 0.12,
        emissive: 0xffffff,
        emissiveMap: face,
        emissiveIntensity: 0.1,
        side: THREE.DoubleSide
      })
    );
    plate.position.y = 1.68;
    plate.castShadow = true;
    plate.userData.target = group;
    group.add(plate);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.025, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0x3a1418, emissive: 0xff4653, emissiveIntensity: 1.3, roughness: 0.4 })
    );
    rim.position.y = 1.68;
    group.add(rim);

    const arm = box(0.08, 0.08, 0.16, 0x39464c, { roughness: 0.5, metalness: 0.65 });
    arm.position.set(0, 1.68, -0.06);
    group.add(arm);

    group.userData = {
      alive: true,
      respawnAt: 0,
      phase: rand() * Math.PI * 2,
      baseX: x,
      baseZ: z
    };
    world.add(group);
    targets.push(group);
    targetPlates.push(plate);
  }
}

function buildDust() {
  const count = 700;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 58;
    positions[i * 3 + 1] = rand() * 9 + 0.3;
    positions[i * 3 + 2] = (rand() - 0.5) * 58;
    speeds[i] = 0.04 + rand() * 0.12;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xa9dfe8,
    size: 0.028,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  points.userData.speeds = speeds;
  scene.add(points);
  return points;
}

const dust = buildDust();

function buildWeapon() {
  const weapon = new THREE.Group();
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1b2226, roughness: 0.42, metalness: 0.82 });
  const midMetal = new THREE.MeshStandardMaterial({ color: 0x2c383d, roughness: 0.5, metalness: 0.7 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x5f5138, roughness: 0.9, metalness: 0.1 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x0b171a, emissive: 0x62f4ff, emissiveIntensity: 2.2, roughness: 0.4 });

  const part = (w, h, d, mat, x, y, z, rx = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    mesh.castShadow = true;
    weapon.add(mesh);
    return mesh;
  };

  part(0.15, 0.15, 0.42, darkMetal, 0, 0, 0);
  part(0.12, 0.11, 0.34, midMetal, 0, 0.015, -0.32);
  part(0.1, 0.09, 0.2, darkMetal, 0, 0.005, -0.54);
  part(0.045, 0.045, 0.22, midMetal, 0, 0.005, -0.68);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.34, 14), midMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.005, -0.58);
  barrel.castShadow = true;
  weapon.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.08, 12), darkMetal);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.005, -0.77);
  weapon.add(muzzle);

  part(0.075, 0.23, 0.11, gripMat, 0, -0.14, 0.09, -0.28);
  part(0.07, 0.2, 0.1, gripMat, 0, -0.15, -0.13, 0.16);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.24, 0.13), darkMetal);
  mag.position.set(0, -0.17, -0.28);
  mag.rotation.x = 0.22;
  mag.castShadow = true;
  weapon.add(mag);

  part(0.16, 0.075, 0.26, midMetal, 0, 0.105, -0.13);
  part(0.03, 0.03, 0.12, darkMetal, 0, 0.16, -0.22);
  const sight = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 6, 14), glowMat);
  sight.position.set(0, 0.19, -0.3);
  weapon.add(sight);

  part(0.11, 0.14, 0.26, darkMetal, 0, -0.02, 0.26);
  part(0.08, 0.09, 0.16, midMetal, 0, -0.005, 0.43);

  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.025, 0.2), glowMat);
  accent.position.set(0.078, 0.035, -0.05);
  weapon.add(accent);

  const flash = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.28, 8),
    new THREE.MeshBasicMaterial({ color: 0xffc26b, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flash.rotation.x = -Math.PI / 2;
  flash.position.set(0, 0.005, -0.95);
  flash.visible = false;
  weapon.add(flash);

  const flashLight = new THREE.PointLight(0xffb35c, 0, 5, 2);
  flashLight.position.set(0, 0.02, -0.8);
  weapon.add(flashLight);

  weapon.position.set(0.36, -0.33, -0.58);
  weapon.rotation.set(-0.035, -0.14, 0.02);
  camera.add(weapon);

  return { group: weapon, flash, flashLight, base: weapon.position.clone(), baseRot: weapon.rotation.clone() };
}

buildSky();
addLights();
buildArena();
buildTargets();
const weapon = buildWeapon();

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const bursts = [];
const tracers = [];
const state = {
  score: 0,
  ammo: 30,
  reloading: false,
  nextShot: 0,
  recoil: 0,
  flashUntil: 0,
  hits: 0,
  locked: false
};

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove('show'), 1250);
}

function updateHud() {
  ui.score.textContent = String(state.score).padStart(4, '0');
  ui.ammo.innerHTML = state.reloading ? 'RELOAD' : `${state.ammo}<i>/∞</i>`;
  ui.objective.style.width = `${Math.min(100, state.hits * 12.5)}%`;
}

function spawnBurst(point) {
  const count = 22;
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
    velocities.push(new THREE.Vector3(
      (rand() - 0.5) * 7,
      rand() * 5,
      (rand() - 0.5) * 7
    ));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffca7a,
    size: 0.07,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  bursts.push({ points, velocities, life: 0.55, maxLife: 0.55 });
}

function spawnTracer(from, to) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color: 0xffd08a,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  tracers.push({ line, life: 0.08, maxLife: 0.08 });
}

function reload() {
  if (state.reloading) return;
  if (state.ammo === 30) return;
  state.reloading = true;
  updateHud();
  setTimeout(() => {
    state.ammo = 30;
    state.reloading = false;
    updateHud();
    toast('MAGAZINE READY');
  }, 850);
}

function shoot() {
  const now = performance.now();
  if (now < state.nextShot || state.reloading) return;
  if (state.ammo <= 0) {
    reload();
    return;
  }
  state.nextShot = now + 105;
  state.ammo--;
  state.recoil = 1;
  state.flashUntil = now + 55;
  updateHud();

  weapon.flash.visible = true;
  weapon.flash.rotation.z = rand() * Math.PI * 2;
  weapon.flashLight.intensity = 9;

  weapon.group.updateWorldMatrix(true, false);
  const muzzlePoint = weapon.group.localToWorld(new THREE.Vector3(0, 0.005, -0.82));
  raycaster.setFromCamera(center, camera);

  const hits = raycaster.intersectObjects(targetPlates.filter((plate) => plate.parent.visible), false);
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  let hitPoint = camera.position.clone().add(direction.multiplyScalar(70));

  if (hits.length > 0) {
    const hit = hits[0];
    hitPoint = hit.point.clone();
    const group = hit.object.userData.target;
    if (group && group.userData.alive) {
      group.userData.alive = false;
      group.userData.respawnAt = now + 1150;
      group.visible = false;
      state.score += 100;
      state.hits++;
      spawnBurst(hitPoint);
      ui.hitmarker.classList.remove('show');
      void ui.hitmarker.offsetWidth;
      ui.hitmarker.classList.add('show');
      toast('TARGET NEUTRALIZED  +100');
      updateHud();
    }
  } else {
    spawnBurst(hitPoint.clone().add(new THREE.Vector3(0, -0.2, 0)));
  }
  spawnTracer(muzzlePoint, hitPoint);
}

function respawnTarget(target, now) {
  target.userData.alive = true;
  target.userData.baseX = -10 + rand() * 20;
  target.userData.baseZ = -18 + rand() * 8;
  target.position.x = target.userData.baseX;
  target.position.z = target.userData.baseZ;
  target.visible = true;
  target.userData.respawnAt = 0;
  target.scale.setScalar(0.4);
  target.userData.spawnAt = now;
}

document.addEventListener('pointerlockchange', () => {
  state.locked = document.pointerLockElement === canvas;
  document.body.classList.toggle('locked', state.locked);
});

canvas.addEventListener('click', () => {
  if (!state.locked && !('ontouchstart' in window)) {
    const result = canvas.requestPointerLock?.();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  }
});

document.addEventListener('mousedown', (event) => {
  if (state.locked && event.button === 0) shoot();
});

document.addEventListener('mousemove', (event) => {
  if (!state.locked) return;
  player.yaw -= event.movementX * 0.0022;
  player.pitch = clamp(player.pitch - event.movementY * 0.0022, -1.15, 1.15);
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

const keys = new Set();
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'KeyR') reload();
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

let touchLast = null;
let touchMoved = false;
canvas.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) return;
  touchLast = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  touchMoved = false;
}, { passive: true });
canvas.addEventListener('touchmove', (event) => {
  if (!touchLast || event.touches.length !== 1) return;
  const t = event.touches[0];
  const dx = t.clientX - touchLast.x;
  const dy = t.clientY - touchLast.y;
  if (Math.abs(dx) + Math.abs(dy) > 6) touchMoved = true;
  player.yaw -= dx * 0.0045;
  player.pitch = clamp(player.pitch - dy * 0.0045, -1.1, 1.1);
  touchLast = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchend', () => {
  if (touchLast && !touchMoved) shoot();
  touchLast = null;
}, { passive: true });

ui.fire.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  shoot();
});

function updatePlayer(dt) {
  const forwardInput = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const strafeInput = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  let mx = -sin * forwardInput + cos * strafeInput;
  let mz = -cos * forwardInput - sin * strafeInput;
  const length = Math.hypot(mx, mz);
  if (length > 0) { mx /= length; mz /= length; }

  const speed = 6.4;
  const accel = 12;
  player.vx += (mx * speed - player.vx) * Math.min(1, accel * dt);
  player.vz += (mz * speed - player.vz) * Math.min(1, accel * dt);
  player.x = clamp(player.x + player.vx * dt, -20.5, 20.5);
  player.z = clamp(player.z + player.vz * dt, -19.8, 20.5);

  const moving = Math.hypot(player.vx, player.vz);
  player.bob += dt * (2.2 + moving * 2.4);
  const bobAmount = Math.min(1, moving / speed) * 0.032;

  const idle = performance.now() * 0.001;
  camera.position.set(
    player.x,
    1.72 + Math.sin(player.bob * 5.2) * bobAmount + Math.sin(idle * 0.8) * 0.006,
    player.z
  );
  camera.rotation.y = player.yaw + Math.sin(idle * 0.37) * 0.005;
  camera.rotation.x = player.pitch + Math.sin(idle * 0.55) * 0.0025;
  camera.rotation.z = Math.sin(player.bob * 2.6) * bobAmount * 0.18;

  weapon.group.position.copy(weapon.base);
  weapon.group.position.y += Math.sin(player.bob * 5.2) * bobAmount * 0.4;
  weapon.group.position.x += Math.cos(player.bob * 2.6) * bobAmount * 0.22 * (moving / speed);
  const recoil = state.recoil;
  weapon.group.position.z += recoil * 0.085;
  weapon.group.position.y += recoil * 0.018;
  weapon.group.rotation.copy(weapon.baseRot);
  weapon.group.rotation.x += recoil * 0.1 + Math.sin(player.bob * 2.6) * 0.004;
  weapon.group.rotation.z += Math.sin(player.bob * 1.3) * 0.003;
}

function updateTargets(now, dt) {
  for (const target of targets) {
    if (target.userData.alive) {
      target.position.y = Math.sin(now * 0.0016 + target.userData.phase) * 0.045;
      const plate = target.children[2];
      plate.rotation.y = Math.sin(now * 0.0009 + target.userData.phase) * 0.16;
      if (target.userData.spawnAt) {
        const age = Math.min(1, (now - target.userData.spawnAt) / 320);
        target.scale.setScalar(0.4 + age * 0.6);
        if (age >= 1) target.userData.spawnAt = 0;
      }
    } else if (now >= target.userData.respawnAt) {
      respawnTarget(target, now);
    }
  }
}

function updateEffects(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const burst = bursts[i];
    burst.life -= dt;
    const position = burst.points.geometry.attributes.position;
    for (let j = 0; j < burst.velocities.length; j++) {
      const velocity = burst.velocities[j];
      velocity.y -= 9.8 * dt;
      position.array[j * 3] += velocity.x * dt;
      position.array[j * 3 + 1] += velocity.y * dt;
      position.array[j * 3 + 2] += velocity.z * dt;
    }
    position.needsUpdate = true;
    burst.points.material.opacity = Math.max(0, burst.life / burst.maxLife);
    if (burst.life <= 0) {
      scene.remove(burst.points);
      burst.points.geometry.dispose();
      burst.points.material.dispose();
      bursts.splice(i, 1);
    }
  }
  for (let i = tracers.length - 1; i >= 0; i--) {
    const tracer = tracers[i];
    tracer.life -= dt;
    tracer.line.material.opacity = Math.max(0, tracer.life / tracer.maxLife) * 0.85;
    if (tracer.life <= 0) {
      scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      tracer.line.material.dispose();
      tracers.splice(i, 1);
    }
  }
}

function updateDust(dt, now) {
  const position = dust.geometry.attributes.position;
  const speeds = dust.userData.speeds;
  for (let i = 0; i < speeds.length; i++) {
    let y = position.array[i * 3 + 1] + speeds[i] * dt;
    if (y > 10) y = 0.3;
    position.array[i * 3 + 1] = y;
    position.array[i * 3] += Math.sin(now * 0.0003 + i) * dt * 0.04;
  }
  position.needsUpdate = true;
}

const radarContext = ui.radar.getContext('2d');
function drawRadar(now) {
  const ctx = radarContext;
  const size = ui.radar.width;
  const centerPoint = size / 2;
  const radius = size / 2 - 6;
  ctx.clearRect(0, 0, size, size);

  const gradient = ctx.createRadialGradient(centerPoint, centerPoint, 2, centerPoint, centerPoint, radius);
  gradient.addColorStop(0, 'rgba(10, 34, 40, 0.72)');
  gradient.addColorStop(1, 'rgba(3, 12, 15, 0.86)');
  ctx.beginPath(); ctx.arc(centerPoint, centerPoint, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient; ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(centerPoint, centerPoint, radius, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = 'rgba(105, 236, 250, 0.17)';
  ctx.lineWidth = 1;
  for (const scale of [0.33, 0.66, 1]) {
    ctx.beginPath(); ctx.arc(centerPoint, centerPoint, radius * scale, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(centerPoint - radius, centerPoint); ctx.lineTo(centerPoint + radius, centerPoint);
  ctx.moveTo(centerPoint, centerPoint - radius); ctx.lineTo(centerPoint, centerPoint + radius);
  ctx.stroke();

  const sweep = (now * 0.0012) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(117, 247, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerPoint, centerPoint);
  ctx.lineTo(centerPoint + Math.cos(sweep) * radius, centerPoint + Math.sin(sweep) * radius);
  ctx.stroke();

  for (const target of targets) {
    if (!target.userData.alive) continue;
    const dx = target.position.x - player.x;
    const dz = target.position.z - player.z;
    const localRight = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
    const localForward = dx * -Math.sin(player.yaw) + dz * -Math.cos(player.yaw);
    const scale = radius / 26;
    const x = centerPoint + localRight * scale;
    const y = centerPoint - localForward * scale;
    if (Math.hypot(x - centerPoint, y - centerPoint) > radius - 4) continue;
    ctx.fillStyle = '#ff5a66';
    ctx.shadowColor = '#ff5a66';
    ctx.shadowBlur = 9;
    ctx.beginPath(); ctx.arc(x, y, 3.1, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(105, 236, 250, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(centerPoint, centerPoint, radius, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = 'rgba(126, 154, 164, 0.85)';
  ctx.font = '9px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', centerPoint, 12);
}

let last = performance.now();
let frames = 0;
let ready = false;

function animate(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;

  updatePlayer(dt);
  updateTargets(now, dt);
  updateEffects(dt);
  updateDust(dt, now);

  state.recoil = Math.max(0, state.recoil - dt * 9);
  if (now > state.flashUntil) {
    weapon.flash.visible = false;
    weapon.flashLight.intensity = 0;
  }

  drawRadar(now);
  renderer.render(scene, camera);

  if (!ready && ++frames >= 3) {
    ready = true;
    window.__gen1Ready = true;
    ui.boot.classList.add('hidden');
  }
  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

updateHud();
window.__gen1 = { scene, camera, renderer, get state() { return state; } };
requestAnimationFrame(animate);
