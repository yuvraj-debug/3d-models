# 3D Robot Web Element

A lightweight, self-contained 3D robot character built with Three.js. Features warm amber rim lighting, glowing emissive accents, idle breathing animation, interactive mouse-tracking, and orbit controls.

> **Calibrated Settings (Default):**
> - Warm Rim Light: `10.0` (#ff7711)
> - Bloom / Glow: `0.0`
> - Emissive Yellow Intensity: `1.5` (#ffb703 / #ff9100)
> - Body Roughness: `0.26`
> - Body Clearcoat: `0.00`
> - Background: Transparent (adapts to any website theme)

---

## 📁 Folder Contents

- **`robot-3d.js`** — Core reusable module (ES module & Custom Web Component `<robot-3d>`).
- **`robot-3d.css`** — Lightweight default CSS styling.
- **`index.html`** — Clean live demo page showcasing website hero integration.
- **`reference.png`** — Original reference visual.

---

## 🚀 How to Add to Any Website

### Option 1: Web Component (Easiest — 2 lines of code)

```html
<!-- 1. Add the custom element anywhere in your HTML / JSX -->
<robot-3d style="width: 350px; height: 420px;"></robot-3d>

<!-- 2. Import the script -->
<script type="module" src="./3d/robot-3d.js"></script>
```

### Option 2: JavaScript API (`initRobot3D`)

```html
<link rel="stylesheet" href="./3d/robot-3d.css">

<!-- Container where the 3D robot should render -->
<div id="robot-container" style="width: 380px; height: 460px;"></div>

<script type="module">
  import { initRobot3D } from './3d/robot-3d.js';

  const container = document.getElementById('robot-container');
  const bot = initRobot3D(container, {
    transparentBackground: true, // transparent or false
    enableMouseLook: true,       // robot looks towards user's cursor
    enableOrbitControls: true,   // drag to orbit
    idleAnimation: true          // breathing & bobbing motion
  });

  // Optional methods:
  // bot.resetView();
  // bot.setIdleAnimation(false);
  // bot.destroy();
</script>
```

---

## ⚛️ React / Next.js Integration

```jsx
import { useEffect, useRef } from 'react';

export default function RobotHero() {
  const containerRef = useRef(null);

  useEffect(() => {
    let botInstance = null;

    import('./3d/robot-3d.js').then(({ initRobot3D }) => {
      if (containerRef.current) {
        botInstance = initRobot3D(containerRef.current, {
          transparentBackground: true,
          enableMouseLook: true
        });
      }
    });

    return () => {
      if (botInstance) botInstance.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', maxWidth: '420px', height: '480px' }} 
    />
  );
}
```

---

## ⚙️ Configuration Options

You can pass any of these options into `initRobot3D(container, options)`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `transparentBackground` | `boolean` | `true` | Allows website background to show through |
| `enableMouseLook` | `boolean` | `true` | Robot turns its head towards the mouse cursor |
| `enableOrbitControls` | `boolean` | `true` | Allows user to click & drag to rotate |
| `idleAnimation` | `boolean` | `true` | Subtle breathing and floating motion |
| `rimIntensity` | `number` | `10.0` | Brightness of the warm rim light |
| `rimColor` | `string` | `'#ff7711'` | Warm rim light color |
| `emissiveIntensity` | `number` | `1.5` | Intensity of glowing yellow features |
| `bodyRoughness` | `number` | `0.26` | Dark surface roughness |
| `bodyClearcoat` | `number` | `0.00` | Dark surface clearcoat |
| `cameraDistance` | `number` | `6.2` | Distance of camera from robot |

---

## 🤖 Prompt for AI Agents

If you move this folder into your website project and want an AI agent to place it for you, simply say:

> *"Please place the 3D robot element from the `./3d` subfolder into the hero section of my website. Use `robot-3d.js` with a transparent background."*
