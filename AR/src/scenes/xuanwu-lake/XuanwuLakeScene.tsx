import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

export interface XuanwuSceneEffects {
  wind: boolean;
  meditation: boolean;
  egrets: boolean;
}

function createLakeParticles(color: string, count: number) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 2.4;
    positions[i * 3 + 1] = Math.random() * 1.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    velocities[i * 3] = (Math.random() - 0.5) * 0.008;
    velocities[i * 3 + 1] = -0.01 - Math.random() * 0.015;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.035,
    color,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  return { points, velocities, count };
}

export function useXuanwuLakeScene(
  anchor: Group | null,
  effects: XuanwuSceneEffects,
  visible: boolean,
) {
  const effectsRef = useRef(effects);
  effectsRef.current = effects;

  useEffect(() => {
    if (!anchor || !visible) return;

    const group = new THREE.Group();
    anchor.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const dir = new THREE.DirectionalLight(0xfaf8f4, 0.9);
    dir.position.set(2, 4, 2);
    group.add(ambient, dir);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 48),
      new THREE.MeshStandardMaterial({
        color: "#7fa79b",
        transparent: true,
        opacity: 0.55,
        roughness: 0.2,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.35;
    group.add(water);

    const mascot = new THREE.Group();
    mascot.position.y = 0.15;
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshStandardMaterial({ color: "#faf8f4", roughness: 0.35 }),
    );
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.18, 4),
      new THREE.MeshStandardMaterial({ color: "#7fa79b" }),
    );
    hat.position.y = 0.28;
    mascot.add(body, hat);
    group.add(mascot);

    const particles = createLakeParticles("#c6a36b", 200);
    group.add(particles.points);

    const egretGeo = new THREE.BufferGeometry();
    const egretCount = 24;
    const egretPos = new Float32Array(egretCount * 3);
    for (let i = 0; i < egretCount; i += 1) {
      egretPos[i * 3] = (Math.random() - 0.5) * 0.4;
      egretPos[i * 3 + 1] = Math.random() * 0.2;
      egretPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    egretGeo.setAttribute("position", new THREE.BufferAttribute(egretPos, 3));
    const egrets = new THREE.Points(
      egretGeo,
      new THREE.PointsMaterial({ size: 0.05, color: "#faf8f4", transparent: true, opacity: 0.9 }),
    );
    egrets.visible = false;
    group.add(egrets);

    let frameId = 0;
    const start = performance.now();

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      water.rotation.z = Math.sin(t * 0.4) * 0.02;
      mascot.position.y = 0.15 + Math.sin(t * 1.4) * 0.04;
      mascot.rotation.y = Math.sin(t * 0.5) * 0.15;

      const { wind, meditation, egrets: showEgrets } = effectsRef.current;
      const particleActive = wind || meditation;
      particles.points.visible = particleActive;

      if (particleActive) {
        const posAttr = particles.points.geometry.attributes.position as THREE.BufferAttribute;
        const pos = posAttr.array as Float32Array;
        for (let i = 0; i < particles.count; i += 1) {
          pos[i * 3] += particles.velocities[i * 3];
          pos[i * 3 + 1] += particles.velocities[i * 3 + 1];
          if (pos[i * 3 + 1] < -0.8) {
            pos[i * 3 + 1] = 1.2;
            pos[i * 3] = (Math.random() - 0.5) * 2.4;
          }
        }
        particles.points.geometry.attributes.position.needsUpdate = true;
      }

      egrets.visible = showEgrets;
      if (showEgrets) {
        const egretAttr = egrets.geometry.attributes.position as THREE.BufferAttribute;
        const pos = egretAttr.array as Float32Array;
        for (let i = 0; i < egretCount; i += 1) {
          pos[i * 3] += 0.02;
          pos[i * 3 + 1] = 0.2 + Math.sin(t * 3 + i) * 0.08 + i * 0.01;
        }
        egrets.geometry.attributes.position.needsUpdate = true;
      }

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      anchor.remove(group);
      water.geometry.dispose();
      (water.material as THREE.Material).dispose();
      body.geometry.dispose();
      (body.material as THREE.Material).dispose();
      hat.geometry.dispose();
      (hat.material as THREE.Material).dispose();
      particles.points.geometry.dispose();
      (particles.points.material as THREE.Material).dispose();
      egrets.geometry.dispose();
      (egrets.material as THREE.Material).dispose();
    };
  }, [anchor, visible]);

  useEffect(() => {
    if (!anchor) return;
    anchor.visible = visible;
  }, [anchor, visible]);
}
