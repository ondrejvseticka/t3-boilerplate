import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  ParticleSystem,
  GlowLayer,
  type Mesh,
} from "@babylonjs/core";

import {
  createFlameTexture,
  createSparkTexture,
  createSmokeTexture,
  createAshBedTexture,
} from "./fire-textures";

export type FireboxStatus = "ok" | "warn" | "expired" | "off";

export class FireboxSceneManager {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private fireLight: PointLight;
  private ambientLight: HemisphericLight;
  private glowLayer: GlowLayer;

  // Particle systems
  private flameSystem: ParticleSystem;
  private sparkSystem: ParticleSystem;
  private smokeSystem: ParticleSystem;

  // Meshes & Materials
  private logs: Mesh[] = [];
  private emberChunks: Mesh[] = [];
  private hearthBed: Mesh;
  private logMaterial: StandardMaterial;
  private emberMaterial: StandardMaterial;
  private hearthMaterial: StandardMaterial;
  private chamberMaterial: StandardMaterial;
  private grateMaterial: StandardMaterial;

  // Dynamic animation targets & state
  private currentStatus: FireboxStatus = "ok";
  private targetFireLightIntensity = 1.6;
  private currentFireLightIntensity = 1.6;
  private targetEmissive = new Color3(1.0, 0.45, 0.05);
  private currentEmissive = new Color3(1.0, 0.45, 0.05);
  private animTime = 0;
  private isDisposed = false;

  constructor(canvas: HTMLCanvasElement, initialStatus: FireboxStatus = "ok") {
    // 1. Initialize Engine & Scene with performance & crisp DPI settings
    const maxDpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.engine.setHardwareScalingLevel(1 / maxDpr);

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.04, 0.04, 0.05, 1.0);

    // 2. Camera setup - framed neatly inside the boiler chamber
    this.camera = new ArcRotateCamera(
      "fireboxCam",
      -Math.PI / 2, // Straight looking into chamber
      Math.PI / 2.35, // Slightly angled from top
      5.2, // Distance
      new Vector3(0, 0.45, 0),
      this.scene,
    );
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 4.2;
    this.camera.upperRadiusLimit = 7.0;
    this.camera.lowerBetaLimit = Math.PI / 4.0;
    this.camera.upperBetaLimit = Math.PI / 2.05;
    this.camera.lowerAlphaLimit = -Math.PI * 0.75;
    this.camera.upperAlphaLimit = -Math.PI * 0.25;
    this.camera.wheelPrecision = 40;
    this.camera.pinchPrecision = 40;
    this.camera.inertia = 0.85;

    // 3. Lighting setup
    this.ambientLight = new HemisphericLight(
      "ambientLight",
      new Vector3(0, 1, 0),
      this.scene,
    );
    this.ambientLight.intensity = 0.25;
    this.ambientLight.groundColor = new Color3(0.05, 0.05, 0.06);

    this.fireLight = new PointLight("fireLight", new Vector3(0, 0.8, 0), this.scene);
    this.fireLight.diffuse = new Color3(1.0, 0.55, 0.15);
    this.fireLight.specular = new Color3(1.0, 0.4, 0.1);
    this.fireLight.range = 8.0;

    // 4. Optical bloom / Glow layer
    this.glowLayer = new GlowLayer("fireGlow", this.scene, {
      mainTextureRatio: 0.5,
      blurKernelSize: 24,
    });
    this.glowLayer.intensity = 0.8;

    // 5. Materials setup
    this.chamberMaterial = new StandardMaterial("chamberMat", this.scene);
    this.chamberMaterial.diffuseColor = new Color3(0.09, 0.09, 0.1);
    this.chamberMaterial.specularColor = new Color3(0.04, 0.04, 0.04);
    this.chamberMaterial.roughness = 0.9;

    this.grateMaterial = new StandardMaterial("grateMat", this.scene);
    this.grateMaterial.diffuseColor = new Color3(0.12, 0.12, 0.14);
    this.grateMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

    this.logMaterial = new StandardMaterial("logMat", this.scene);
    this.logMaterial.diffuseColor = new Color3(0.12, 0.1, 0.08);
    this.logMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    this.logMaterial.emissiveColor = new Color3(1.0, 0.45, 0.05);

    this.emberMaterial = new StandardMaterial("emberMat", this.scene);
    this.emberMaterial.diffuseColor = new Color3(0.15, 0.08, 0.05);
    this.emberMaterial.emissiveColor = new Color3(1.0, 0.35, 0.02);

    this.hearthMaterial = new StandardMaterial("hearthMat", this.scene);
    this.hearthMaterial.diffuseTexture = createAshBedTexture(this.scene, false);
    this.hearthMaterial.emissiveColor = new Color3(0.35, 0.12, 0.02);
    this.hearthMaterial.specularColor = new Color3(0.05, 0.05, 0.05);

    // 6. Build Geometry: Chamber, Grate, Hearth Bed, Logs, Coals
    this.buildChamber();
    this.hearthBed = this.buildHearthBed();
    this.buildLogsAndEmbers();

    // 7. Particle Systems: Flames, Sparks, Smoke
    this.flameSystem = this.createFlameParticles();
    this.sparkSystem = this.createSparkParticles();
    this.smokeSystem = this.createSmokeParticles();

    // 8. Apply Initial Status
    this.setStatus(initialStatus, true);

    // 9. Register Render & Animation Loop
    this.scene.registerBeforeRender(() => this.updateAnimation());
    this.engine.runRenderLoop(() => {
      if (!this.isDisposed && this.scene.activeCamera) {
        this.scene.render();
      }
    });
  }

  /**
   * Builds the dark cast iron / refractory brick chamber box.
   */
  private buildChamber(): void {
    // Back wall
    const backWall = MeshBuilder.CreateBox(
      "backWall",
      { width: 4.5, height: 3.5, depth: 0.2 },
      this.scene,
    );
    backWall.position = new Vector3(0, 1.3, 1.8);
    backWall.material = this.chamberMaterial;

    // Left wall
    const leftWall = MeshBuilder.CreateBox(
      "leftWall",
      { width: 0.2, height: 3.5, depth: 3.6 },
      this.scene,
    );
    leftWall.position = new Vector3(-2.1, 1.3, 0);
    leftWall.material = this.chamberMaterial;

    // Right wall
    const rightWall = MeshBuilder.CreateBox(
      "rightWall",
      { width: 0.2, height: 3.5, depth: 3.6 },
      this.scene,
    );
    rightWall.position = new Vector3(2.1, 1.3, 0);
    rightWall.material = this.chamberMaterial;

    // Ceiling arch / plate
    const ceiling = MeshBuilder.CreateBox(
      "ceiling",
      { width: 4.4, height: 0.2, depth: 3.6 },
      this.scene,
    );
    ceiling.position = new Vector3(0, 2.9, 0);
    ceiling.material = this.chamberMaterial;

    // Cast iron bottom grate bars
    const barCount = 7;
    for (let i = 0; i < barCount; i++) {
      const zPos = -0.9 + i * 0.3;
      const bar = MeshBuilder.CreateBox(
        `grateBar_${i}`,
        { width: 3.2, height: 0.08, depth: 0.08 },
        this.scene,
      );
      bar.position = new Vector3(0, 0.12, zPos);
      bar.material = this.grateMaterial;
    }
  }

  /**
   * Builds the glowing/ash hearth ground bed.
   */
  private buildHearthBed(): Mesh {
    const bed = MeshBuilder.CreateGround(
      "hearthBed",
      { width: 3.4, height: 2.6, subdivisions: 8 },
      this.scene,
    );
    bed.position = new Vector3(0, 0.02, 0.1);
    bed.material = this.hearthMaterial;
    return bed;
  }

  /**
   * Builds 3D stacked logs and surrounding coal/ember chunks.
   */
  private buildLogsAndEmbers(): void {
    // Log 1: Base Left
    const log1 = MeshBuilder.CreateCylinder(
      "log1",
      { height: 2.2, diameter: 0.38, tessellation: 12 },
      this.scene,
    );
    log1.rotation = new Vector3(0.08, 0.35, Math.PI / 2);
    log1.position = new Vector3(-0.45, 0.32, -0.2);
    log1.material = this.logMaterial;
    this.logs.push(log1);

    // Log 2: Base Right / Rear
    const log2 = MeshBuilder.CreateCylinder(
      "log2",
      { height: 2.3, diameter: 0.4, tessellation: 12 },
      this.scene,
    );
    log2.rotation = new Vector3(-0.1, -0.28, Math.PI / 2);
    log2.position = new Vector3(0.35, 0.35, 0.35);
    log2.material = this.logMaterial;
    this.logs.push(log2);

    // Log 3: Diagonal Crossing
    const log3 = MeshBuilder.CreateCylinder(
      "log3",
      { height: 2.1, diameter: 0.34, tessellation: 12 },
      this.scene,
    );
    log3.rotation = new Vector3(0.2, 1.25, Math.PI / 2.15);
    log3.position = new Vector3(0.1, 0.62, 0.05);
    log3.material = this.logMaterial;
    this.logs.push(log3);

    // Log 4: Smaller Wedge
    const log4 = MeshBuilder.CreateCylinder(
      "log4",
      { height: 1.5, diameter: 0.28, tessellation: 10 },
      this.scene,
    );
    log4.rotation = new Vector3(-0.25, -0.9, Math.PI / 2.05);
    log4.position = new Vector3(-0.25, 0.52, 0.25);
    log4.material = this.logMaterial;
    this.logs.push(log4);

    // Scattered Coal & Ember Chunks in the hearth
    const chunkPositions = [
      new Vector3(-0.8, 0.16, -0.5),
      new Vector3(0.7, 0.16, -0.45),
      new Vector3(0.0, 0.18, -0.65),
      new Vector3(-0.5, 0.2, 0.65),
      new Vector3(0.65, 0.2, 0.6),
      new Vector3(-0.05, 0.22, 0.0),
      new Vector3(0.4, 0.2, -0.1),
    ];

    chunkPositions.forEach((pos, idx) => {
      const chunk = MeshBuilder.CreatePolyhedron(
        `emberChunk_${idx}`,
        { type: 1, size: 0.12 + (idx % 3) * 0.04 },
        this.scene,
      );
      chunk.position = pos;
      chunk.rotation = new Vector3(idx * 0.4, idx * 0.7, idx * 0.2);
      chunk.material = this.emberMaterial;
      this.emberChunks.push(chunk);
    });
  }

  /**
   * Creates the particle system for burning flames.
   */
  private createFlameParticles(): ParticleSystem {
    const ps = new ParticleSystem("flames", 200, this.scene);
    ps.particleTexture = createFlameTexture(this.scene);
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;

    // Emitter volume around the core of the logs
    ps.emitter = new Vector3(0, 0.35, 0.05);
    ps.minEmitBox = new Vector3(-0.65, 0.0, -0.45);
    ps.maxEmitBox = new Vector3(0.65, 0.25, 0.45);

    // Fiery color transition
    ps.color1 = new Color4(1.0, 0.95, 0.45, 1.0); // Hot white-yellow core
    ps.color2 = new Color4(1.0, 0.42, 0.02, 0.9); // Rich fire orange
    ps.colorDead = new Color4(0.3, 0.05, 0.0, 0.0); // Red smoke fade

    ps.minSize = 0.4;
    ps.maxSize = 0.95;
    ps.minLifeTime = 0.35;
    ps.maxLifeTime = 0.75;
    ps.emitRate = 90;

    ps.gravity = new Vector3(0, 4.0, 0);
    ps.direction1 = new Vector3(-0.4, 2.8, -0.3);
    ps.direction2 = new Vector3(0.4, 3.8, 0.3);

    ps.minAngularSpeed = -0.5;
    ps.maxAngularSpeed = 0.5;

    ps.start();
    return ps;
  }

  /**
   * Creates the particle system for rising sparks / hot embers.
   */
  private createSparkParticles(): ParticleSystem {
    const ps = new ParticleSystem("sparks", 120, this.scene);
    ps.particleTexture = createSparkTexture(this.scene);
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;

    ps.emitter = new Vector3(0, 0.4, 0.05);
    ps.minEmitBox = new Vector3(-0.7, 0.0, -0.4);
    ps.maxEmitBox = new Vector3(0.7, 0.3, 0.4);

    ps.color1 = new Color4(1.0, 0.9, 0.5, 1.0);
    ps.color2 = new Color4(1.0, 0.5, 0.05, 0.85);
    ps.colorDead = new Color4(0.8, 0.2, 0.0, 0.0);

    ps.minSize = 0.04;
    ps.maxSize = 0.09;
    ps.minLifeTime = 0.6;
    ps.maxLifeTime = 1.4;
    ps.emitRate = 25;

    ps.gravity = new Vector3(0, 5.0, 0);
    ps.direction1 = new Vector3(-1.2, 3.5, -0.8);
    ps.direction2 = new Vector3(1.2, 5.0, 0.8);

    ps.start();
    return ps;
  }

  /**
   * Creates the particle system for soft smoke puffs.
   */
  private createSmokeParticles(): ParticleSystem {
    const ps = new ParticleSystem("smoke", 80, this.scene);
    ps.particleTexture = createSmokeTexture(this.scene);
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;

    ps.emitter = new Vector3(0, 0.7, 0.05);
    ps.minEmitBox = new Vector3(-0.5, 0.0, -0.3);
    ps.maxEmitBox = new Vector3(0.5, 0.3, 0.3);

    ps.color1 = new Color4(0.4, 0.4, 0.42, 0.25);
    ps.color2 = new Color4(0.25, 0.25, 0.26, 0.15);
    ps.colorDead = new Color4(0.15, 0.15, 0.16, 0.0);

    ps.minSize = 0.6;
    ps.maxSize = 1.3;
    ps.minLifeTime = 0.9;
    ps.maxLifeTime = 1.8;
    ps.emitRate = 8;

    ps.gravity = new Vector3(0, 1.8, 0);
    ps.direction1 = new Vector3(-0.3, 1.5, -0.2);
    ps.direction2 = new Vector3(0.3, 2.2, 0.2);

    ps.start();
    return ps;
  }

  /**
   * Updates state with realistic parameters for burning, cooling embers, or cold ash.
   */
  public setStatus(status: FireboxStatus, immediate = false): void {
    this.currentStatus = status;

    switch (status) {
      case "ok":
        // 1. ACTIVE BURNING: vibrant tall flames, bright sparks, high glow
        this.targetFireLightIntensity = 1.6;
        this.fireLight.diffuse = new Color3(1.0, 0.58, 0.15);
        this.targetEmissive = new Color3(1.1, 0.45, 0.06);

        this.flameSystem.emitRate = 95;
        this.flameSystem.minSize = 0.45;
        this.flameSystem.maxSize = 1.0;

        this.sparkSystem.emitRate = 28;
        this.smokeSystem.emitRate = 4;
        this.glowLayer.intensity = 0.85;

        this.hearthMaterial.diffuseColor = new Color3(0.2, 0.12, 0.08);
        this.hearthMaterial.emissiveColor = new Color3(0.35, 0.12, 0.02);
        break;

      case "warn":
        // 2. WARNING / DYING DOWN: lower flames, hot glowing embers, gentle smoke
        this.targetFireLightIntensity = 0.85;
        this.fireLight.diffuse = new Color3(1.0, 0.35, 0.08);
        this.targetEmissive = new Color3(0.8, 0.22, 0.03);

        this.flameSystem.emitRate = 22;
        this.flameSystem.minSize = 0.25;
        this.flameSystem.maxSize = 0.6;

        this.sparkSystem.emitRate = 12;
        this.smokeSystem.emitRate = 14;
        this.glowLayer.intensity = 0.55;

        this.hearthMaterial.diffuseColor = new Color3(0.18, 0.14, 0.12);
        this.hearthMaterial.emissiveColor = new Color3(0.22, 0.06, 0.01);
        break;

      case "expired":
        // 3. EXPIRED / LOW EMBERS: no tall flames, smoldering deep red coals, smoke
        this.targetFireLightIntensity = 0.35;
        this.fireLight.diffuse = new Color3(0.75, 0.15, 0.02);
        this.targetEmissive = new Color3(0.55, 0.1, 0.01);

        this.flameSystem.emitRate = 5;
        this.flameSystem.minSize = 0.18;
        this.flameSystem.maxSize = 0.35;

        this.sparkSystem.emitRate = 4;
        this.smokeSystem.emitRate = 18;
        this.glowLayer.intensity = 0.35;

        this.hearthMaterial.diffuseColor = new Color3(0.22, 0.2, 0.2);
        this.hearthMaterial.emissiveColor = new Color3(0.08, 0.02, 0.0);
        break;

      case "off":
        // 4. EXTINGUISHED / VYHASLO: 0 flames, 0 sparks, cold gray ash bed, dark char
        this.targetFireLightIntensity = 0.0;
        this.targetEmissive = new Color3(0.0, 0.0, 0.0);

        this.flameSystem.emitRate = 0;
        this.sparkSystem.emitRate = 0;
        this.smokeSystem.emitRate = 0;
        this.glowLayer.intensity = 0.0;

        // Cold ash bed
        this.hearthMaterial.diffuseColor = new Color3(0.32, 0.32, 0.34);
        this.hearthMaterial.emissiveColor = new Color3(0.0, 0.0, 0.0);
        this.logMaterial.diffuseColor = new Color3(0.06, 0.06, 0.06);
        this.emberMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);
        break;
    }

    if (immediate) {
      this.currentFireLightIntensity = this.targetFireLightIntensity;
      this.currentEmissive.copyFrom(this.targetEmissive);
      this.fireLight.intensity = this.currentFireLightIntensity;
      this.logMaterial.emissiveColor.copyFrom(this.currentEmissive);
      this.emberMaterial.emissiveColor.copyFrom(this.currentEmissive);
    }
  }

  /**
   * Per-frame animation: organic flickering light and breathing embers.
   */
  private updateAnimation(): void {
    this.animTime += 0.016;

    // Smooth lerp to target intensity & emissive
    this.currentFireLightIntensity +=
      (this.targetFireLightIntensity - this.currentFireLightIntensity) * 0.05;
    this.currentEmissive = Color3.Lerp(this.currentEmissive, this.targetEmissive, 0.05);

    if (this.currentStatus !== "off") {
      // Natural organic fire flicker using multi-harmonic sine waves
      const flicker1 = Math.sin(this.animTime * 14.5) * 0.12;
      const flicker2 = Math.sin(this.animTime * 7.8) * 0.08;
      const flicker3 = Math.sin(this.animTime * 23.2) * 0.05;
      const totalFlicker = 1.0 + flicker1 + flicker2 + flicker3;

      this.fireLight.intensity = Math.max(0, this.currentFireLightIntensity * totalFlicker);

      // Subtle light center drift
      this.fireLight.position.x = Math.sin(this.animTime * 4.2) * 0.08;
      this.fireLight.position.z = 0.05 + Math.cos(this.animTime * 3.7) * 0.06;

      // Emissive ember breathing pulse
      const emberPulse = 0.92 + Math.sin(this.animTime * 3.2) * 0.08;
      const pulsedEmissive = this.currentEmissive.scale(emberPulse * totalFlicker);

      this.logMaterial.emissiveColor.copyFrom(pulsedEmissive);
      this.emberMaterial.emissiveColor.copyFrom(pulsedEmissive);
    } else {
      this.fireLight.intensity = 0;
      this.logMaterial.emissiveColor.copyFrom(Color3.Black());
      this.emberMaterial.emissiveColor.copyFrom(Color3.Black());
    }
  }

  /**
   * Resets camera to standard comfortable viewing angle.
   */
  public resetCamera(): void {
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 2.35;
    this.camera.radius = 5.2;
    this.camera.target.set(0, 0.45, 0);
  }

  /**
   * Handles canvas resize.
   */
  public resize(): void {
    if (!this.isDisposed && this.engine) {
      this.engine.resize();
    }
  }

  /**
   * Cleans up Babylon.js engine, scene, and all GPU textures without memory leaks.
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    try {
      this.flameSystem?.dispose();
      this.sparkSystem?.dispose();
      this.smokeSystem?.dispose();
      this.glowLayer?.dispose();
      this.scene?.dispose();
      this.engine?.dispose();
    } catch (e) {
      console.warn("Error disposing Babylon firebox scene:", e);
    }
  }
}
