import { DynamicTexture, type Scene } from "@babylonjs/core";

/**
 * Creates an in-memory procedural flame particle texture.
 * Radial gradient with hot incandescent core and soft organic falloff.
 */
export function createFlameTexture(scene: Scene): DynamicTexture {
  const size = 128;
  const texture = new DynamicTexture("flameTexture", { width: size, height: size }, scene, false);
  const ctx = texture.getContext() as CanvasRenderingContext2D;

  ctx.clearRect(0, 0, size, size);

  // Vertical teardrop flame shape
  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.6,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.48,
  );

  grad.addColorStop(0.0, "rgba(255, 255, 240, 1.0)");
  grad.addColorStop(0.2, "rgba(255, 200, 60, 0.95)");
  grad.addColorStop(0.5, "rgba(255, 90, 10, 0.6)");
  grad.addColorStop(0.8, "rgba(200, 25, 0, 0.2)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
  ctx.fill();

  texture.hasAlpha = true;
  texture.update();
  return texture;
}

/**
 * Creates an in-memory procedural spark / ember particle texture.
 */
export function createSparkTexture(scene: Scene): DynamicTexture {
  const size = 64;
  const texture = new DynamicTexture("sparkTexture", { width: size, height: size }, scene, false);
  const ctx = texture.getContext() as CanvasRenderingContext2D;

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.45,
  );

  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.25, "rgba(255, 180, 50, 0.9)");
  grad.addColorStop(0.6, "rgba(255, 70, 0, 0.4)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  texture.hasAlpha = true;
  texture.update();
  return texture;
}

/**
 * Creates an in-memory procedural smoke puff texture.
 */
export function createSmokeTexture(scene: Scene): DynamicTexture {
  const size = 128;
  const texture = new DynamicTexture("smokeTexture", { width: size, height: size }, scene, false);
  const ctx = texture.getContext() as CanvasRenderingContext2D;

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.1,
    size * 0.5,
    size * 0.5,
    size * 0.48,
  );

  grad.addColorStop(0.0, "rgba(180, 180, 185, 0.35)");
  grad.addColorStop(0.4, "rgba(120, 120, 125, 0.2)");
  grad.addColorStop(0.8, "rgba(70, 70, 75, 0.08)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
  ctx.fill();

  texture.hasAlpha = true;
  texture.update();
  return texture;
}

/**
 * Creates a noise / ash diffuse texture with speckled charcoal pattern.
 */
export function createAshBedTexture(scene: Scene, isAshMode = false): DynamicTexture {
  const size = 256;
  const texture = new DynamicTexture(
    isAshMode ? "ashBedTexture" : "emberBedTexture",
    { width: size, height: size },
    scene,
    false,
  );
  const ctx = texture.getContext() as CanvasRenderingContext2D;

  // Base background
  ctx.fillStyle = isAshMode ? "#2a2a2c" : "#1a120e";
  ctx.fillRect(0, 0, size, size);

  // Draw procedural speckled spots
  const spotCount = 800;
  for (let i = 0; i < spotCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 3 + 1;

    if (isAshMode) {
      // Gray ash dust with black charcoal specks
      const shade = Math.floor(Math.random() * 120 + 70);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 5})`;
    } else {
      // Dark charred wood with incandescent red/orange embers
      if (Math.random() > 0.4) {
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 50 + 20)}, ${Math.floor(Math.random() * 25 + 10)}, 10)`;
      } else {
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 150 + 100)}, ${Math.floor(Math.random() * 60 + 20)}, 5)`;
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  texture.update();
  return texture;
}
