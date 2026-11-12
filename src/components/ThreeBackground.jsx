import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 92;
const CONNECT_DISTANCE = 1.75;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      position: new THREE.Vector3(randomBetween(-8, 8), randomBetween(-5, 5), randomBetween(-3, 3)),
      velocity: new THREE.Vector3(randomBetween(-0.003, 0.003), randomBetween(-0.003, 0.003), randomBetween(-0.0015, 0.0015)),
    }));

    const pointGeometry = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(NODE_COUNT * 3);
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));

    const pointMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.58,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    function setBounds() {
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      return {
        x: Math.max(7.5, aspect * 5.2),
        y: 5.2,
        z: 3.4,
      };
    }

    let bounds = setBounds();
    let animationFrame = 0;

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bounds = setBounds();
    }

    function onPointerMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function animate() {
      const linePositions = [];

      nodes.forEach((node, index) => {
        node.position.add(node.velocity);
        node.position.x += mouse.x * 0.0009;
        node.position.y += mouse.y * 0.0009;

        if (node.position.x > bounds.x || node.position.x < -bounds.x) node.velocity.x *= -1;
        if (node.position.y > bounds.y || node.position.y < -bounds.y) node.velocity.y *= -1;
        if (node.position.z > bounds.z || node.position.z < -bounds.z) node.velocity.z *= -1;

        pointPositions[index * 3] = node.position.x;
        pointPositions[index * 3 + 1] = node.position.y;
        pointPositions[index * 3 + 2] = node.position.z;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          if (nodes[i].position.distanceTo(nodes[j].position) < CONNECT_DISTANCE) {
            linePositions.push(
              nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
              nodes[j].position.x, nodes[j].position.y, nodes[j].position.z,
            );
          }
        }
      }

      pointGeometry.attributes.position.needsUpdate = true;
      lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      lines.rotation.z += 0.00025;
      points.rotation.z += 0.00025;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      scene.remove(points);
      scene.remove(lines);
      pointGeometry.dispose();
      pointMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="three-background" ref={mountRef} aria-hidden="true" />;
}
