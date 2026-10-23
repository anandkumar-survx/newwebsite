
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import "./styles.css";

// =====================================================
// TRINETRA — 7 CHAPTERS
// =====================================================

const chapters = [
  {
    id: "overview",
    number: "01",
    label: "FULL HELMET OVERVIEW",
    title: <>Integrated<br />communication.</>,
    description:
      "An integrated tactical helmet concept combining communication hardware, a conformal antenna and equipment mounting interfaces.",
    angle: 0.25,
    focusMarker: null,
  },
  {
    id: "antenna",
    number: "02",
    label: "CONFORMAL ANTENNA",
    title: <>Conformal<br />antenna.</>,
    description:
      "A surface-following antenna concept integrated into the helmet. Communication performance requires RF testing and validation.",
    focusMarker: "antenna",
  },
  {
    id: "night-vision",
    number: "03",
    label: "NIGHT-VISION MOUNT",
    title: <>Night-vision<br />mount.</>,
    description:
      "A front mounting interface designed to accommodate compatible night-vision equipment.",
    focusMarker: "night-vision",
  },
  {
    id: "microphone",
    number: "04",
    label: "MICROPHONE",
    title: <>Integrated<br />microphone.</>,
    description:
      "The microphone captures the user's voice for the helmet's tactical communication system.",
    focusMarker: "microphone",
  },
  {
    id: "speaker",
    number: "05",
    label: "SPEAKER",
    title: <>Helmet audio<br />speaker.</>,
    description:
      "The speaker provides audio output so the wearer can hear communication through the helmet system.",
    focusMarker: "speaker",
  },
  {
    id: "communication",
    number: "06",
    label: "COMMUNICATION SET",
    title: <>Communication<br />set.</>,
    description:
      "The communication hardware connects the helmet's audio components into a unified communication interface.",
    focusMarker: "communication",
  },
  {
    id: "shielding",
    number: "07",
    label: "RF SHIELDING — CONCEPT",
    title: <>RF shielding<br />layer.</>,
    description:
      "A conceptual look inside the helmet at the proposed RF shielding layer. A future version will open the helmet shell to reveal its internal structure.",
    focusMarker: null,
  },
];

const defaultMarkerPositions = {
  antenna: [-0.65, 0.78, 0.04],
  "night-vision": [0.02, 0.43, 0.93],
  microphone: [0.54, -0.5, 0.59],
  speaker: [0.79, -0.18, -0.06],
  communication: [0.66, -0.05, -0.9],
};

const markerDefinitions = [
  {
    id: "antenna",
    label: "Conformal antenna",
    chapter: 1,
    title: <>Conformal<br />antenna.</>,
    description:
      "A surface-following antenna concept integrated into the helmet. Its communication performance requires RF testing and validation.",
  },
  {
    id: "night-vision",
    label: "Night-vision mount",
    chapter: 2,
    title: <>Night-vision<br />mount.</>,
    description:
      "A front mounting interface designed to accommodate compatible night-vision equipment.",
  },
  {
    id: "microphone",
    label: "Microphone",
    chapter: 3,
    title: <>Integrated<br />microphone.</>,
    description:
      "The microphone captures the user's voice for the tactical communication system.",
  },
  {
    id: "speaker",
    label: "Speaker",
    chapter: 4,
    title: <>Helmet audio<br />speaker.</>,
    description:
      "The speaker provides audio output so the wearer can hear communication through the helmet system.",
  },
  {
    id: "communication",
    label: "Communication set",
    chapter: 5,
    title: <>Communication<br />set.</>,
    description:
      "The communication hardware connects the microphone and speaker into a unified interface.",
  },
];

function loadMarkerPositions() {
  try {
    const saved = localStorage.getItem(
      "trinetra-marker-positions-v2"
    );
    const parsed = saved ? JSON.parse(saved) : {};

    return Object.fromEntries(
      Object.entries(defaultMarkerPositions).map(
        ([id, fallback]) => {
          const position = parsed[id];

          return [
            id,
            Array.isArray(position) && position.length === 3
              ? position.map(Number)
              : [...fallback],
          ];
        }
      )
    );
  } catch {
    return Object.fromEntries(
      Object.entries(defaultMarkerPositions).map(
        ([id, position]) => [id, [...position]]
      )
    );
  }
}

function getMarkerFocusAngle(position) {
  return Math.atan2(-position[0], position[2]);
}

function saveMarkerPositions(positions) {
  try {
    localStorage.setItem(
      "trinetra-marker-positions-v2",
      JSON.stringify(positions)
    );
  } catch (error) {
    console.warn("Could not save marker positions:", error);
  }
}

// =====================================================
// SCENE ERROR BOUNDARY
// =====================================================

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Helmet scene error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 24,
            color: "#26383D",
            textAlign: "center",
            background: "#F3F5F9",
          }}
        >
          <div>
            <p>The 3D preview encountered an error.</p>
            <p style={{ fontSize: 12 }}>
              Open the browser console for details.
            </p>
            <button
              onClick={() =>
                this.setState({ hasError: false })
              }
            >
              Retry preview
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// ALWAYS-VISIBLE COMPONENT MARKERS
// =====================================================

function ComponentMarkers({
  positions,
  selectedMarker,
  onSelect,
}) {
  return (
    <group>
      {markerDefinitions.map((marker) => {
        const highlighted = selectedMarker === marker.id;

        return (
          <group
            key={marker.id}
            position={positions[marker.id]}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(marker.id);
            }}
          >
            <mesh>
              <sphereGeometry
                args={[
                  highlighted ? 0.055 : 0.04,
                  16,
                  12,
                ]}
              />
              <meshBasicMaterial
                color={highlighted ? "#FFB547" : "#D04C38"}
                depthTest={false}
              />
            </mesh>

            {/* Larger invisible click target */}
            <mesh>
              <sphereGeometry args={[0.105, 12, 8]} />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// =====================================================
// CONCEPTUAL RF SHIELDING LAYER
// Attached to the same rotating group as the helmet.
// =====================================================

function ShieldingLayer({ active }) {
  const layer = useRef();

  useFrame((_, delta) => {
    if (!layer.current) return;

    const target = active ? 1 : 0;

    layer.current.userData.progress = THREE.MathUtils.damp(
      layer.current.userData.progress ?? 0,
      target,
      2.5,
      delta
    );

    const progress = layer.current.userData.progress;

    layer.current.position.y = THREE.MathUtils.lerp(
      0,
      0.38,
      progress
    );

    layer.current.rotation.x = THREE.MathUtils.lerp(
      0,
      -0.2,
      progress
    );
  });

  return (
    <group ref={layer}>
      <mesh scale={[0.7, 0.42, 0.68]}>
        <sphereGeometry
          args={[
            1,
            32,
            20,
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.56,
          ]}
        />
        <meshStandardMaterial
          color="#C0A25A"
          roughness={0.58}
          metalness={0.12}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// =====================================================
// HELMET MODEL
// =====================================================

function HelmetModel({
  index,
  positions,
  selectedMarker,
  focusAngle,
  onMarkerSelect,
}) {
  const { scene } = useGLTF("./helmet.glb");
  const root = useRef();

  const model = useMemo(() => {
    const copy = scene.clone(true);

    copy.traverse((object) => {
      if (!object.isMesh) return;

      object.castShadow = false;
      object.receiveShadow = false;

      if (object.material) {
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone();
      }
    });

    // Normalize the model to a consistent size and center.
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const largestDimension =
      Math.max(size.x, size.y, size.z) || 1;

    copy.position.sub(center);
    copy.scale.setScalar(2.15 / largestDimension);

    return copy;
  }, [scene]);

  useFrame((_, delta) => {
    if (!root.current) return;

    const targetAngle =
      focusAngle !== null
        ? focusAngle
        : chapters[index].angle ?? 0.25;

    root.current.rotation.y = THREE.MathUtils.damp(
      root.current.rotation.y,
      targetAngle,
      3.2,
      delta
    );

    const targetTilt = index === 6 ? -0.14 : 0.02;

    root.current.rotation.x = THREE.MathUtils.damp(
      root.current.rotation.x,
      targetTilt,
      2.5,
      delta
    );
  });

  return (
    <group ref={root}>
      {/* The helmet is always rendered */}
      <primitive object={model} />

      {/* Component markers remain visible in all chapters */}
      <ComponentMarkers
        positions={positions}
        selectedMarker={selectedMarker}
        onSelect={onMarkerSelect}
      />

      {/* Shielding is part of the rotating helmet group */}
      {index === 6 && <ShieldingLayer active={true} />}
    </group>
  );
}

useGLTF.preload("./helmet.glb");

// =====================================================
// 3D STAGE
// No remote HDRI Environment dependency.
// =====================================================

function ModelStage({
  index,
  positions,
  selectedMarker,
  focusAngle,
  onMarkerSelect,
}) {
  return (
    <div className="model-stage">
      <SceneErrorBoundary>
        <Canvas
          dpr={[1, 1.25]}
          camera={{ position: [0, 0, 3.5], fov: 38 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
            precision: "mediump",
          }}
        >
          <color attach="background" args={["#F3F5F9"]} />

          <ambientLight intensity={1.7} />

          <directionalLight
            position={[3, 5, 4]}
            intensity={2.4}
          />

          <directionalLight
            position={[-4, 1, -3]}
            intensity={1.1}
          />

          <directionalLight
            position={[0, 2, 5]}
            intensity={0.6}
          />

          <Suspense fallback={null}>
            <HelmetModel
              index={index}
              positions={positions}
              selectedMarker={selectedMarker}
              focusAngle={focusAngle}
              onMarkerSelect={onMarkerSelect}
            />
          </Suspense>

          <OrbitControls
            enabled={focusAngle === null}
            enablePan={false}
            enableZoom={false}
            rotateSpeed={0.55}
          />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

function App() {
  const [index, setIndex] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [focusAngle, setFocusAngle] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const [markerPositions, setMarkerPositions] = useState(
    loadMarkerPositions
  );

  const wheelLocked = useRef(false);
  const touchStartY = useRef(null);

  const navigate = useCallback(
    (next) => {
      const nextIndex = Math.max(
        0,
        Math.min(chapters.length - 1, next)
      );

      const nextChapter = chapters[nextIndex];

      setIndex(nextIndex);
      setSelectedComponent(null);

      if (nextChapter.focusMarker) {
        const id = nextChapter.focusMarker;

        setSelectedMarker(id);
        setFocusAngle(
          getMarkerFocusAngle(markerPositions[id])
        );
      } else {
        setSelectedMarker(null);
        setFocusAngle(null);
      }
    },
    [markerPositions]
  );

  const selectMarker = useCallback(
    (id) => {
      const marker = markerDefinitions.find(
        (item) => item.id === id
      );

      if (!marker) return;

      setIndex(marker.chapter);
      setSelectedMarker(id);
      setSelectedComponent(id);
      setFocusAngle(
        getMarkerFocusAngle(markerPositions[id])
      );
    },
    [markerPositions]
  );

  // Keyboard and scroll navigation.
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (
          ["INPUT", "TEXTAREA", "SELECT"].includes(
            target.tagName
          ) ||
          target.isContentEditable
        )
      ) {
        return;
      }

      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        navigate(index + (event.shiftKey ? -1 : 1));
      } else if (
        ["ArrowDown", "PageDown"].includes(event.key)
      ) {
        event.preventDefault();
        navigate(index + 1);
      } else if (
        ["ArrowUp", "PageUp"].includes(event.key)
      ) {
        event.preventDefault();
        navigate(index - 1);
      } else if (event.key === "Home") {
        navigate(0);
      } else if (event.key === "End") {
        navigate(chapters.length - 1);
      }
    };

    const onWheel = (event) => {
      if (
        debugOpen ||
        wheelLocked.current ||
        Math.abs(event.deltaY) < 12
      ) {
        return;
      }

      wheelLocked.current = true;
      navigate(index + (event.deltaY > 0 ? 1 : -1));

      window.setTimeout(() => {
        wheelLocked.current = false;
      }, 850);
    };

    const onTouchStart = (event) => {
      touchStartY.current =
        event.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (event) => {
      if (debugOpen || touchStartY.current === null) return;

      const distance =
        touchStartY.current -
        event.changedTouches[0].clientY;

      if (Math.abs(distance) > 60) {
        navigate(index + (distance > 0 ? 1 : -1));
      }

      touchStartY.current = null;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, {
      passive: true,
    });
    window.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });
    window.addEventListener("touchend", onTouchEnd, {
      passive: true,
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [index, navigate, debugOpen]);

  const chapter = chapters[index];

  const activeComponent = markerDefinitions.find(
    (marker) => marker.id === selectedComponent
  );

  const displayedTitle =
    activeComponent?.title ?? chapter.title;

  const displayedDescription =
    activeComponent?.description ?? chapter.description;

  const displayedLabel =
    activeComponent?.label.toUpperCase() ?? chapter.label;

  const selectedPosition =
    markerPositions[selectedMarker] ??
    defaultMarkerPositions.antenna;

  const updateCoordinate = (axis, value) => {
    if (!selectedMarker) return;

    const position = [...markerPositions[selectedMarker]];
    position[axis] = Number(value);

    const next = {
      ...markerPositions,
      [selectedMarker]: position,
    };

    setMarkerPositions(next);
    saveMarkerPositions(next);

    if (
      selectedComponent === selectedMarker ||
      chapters[index].focusMarker === selectedMarker
    ) {
      setFocusAngle(getMarkerFocusAngle(position));
    }
  };

  const chooseEditorMarker = (id) => {
    selectMarker(id);
  };

  const resetSelected = () => {
    if (!selectedMarker) return;

    const next = {
      ...markerPositions,
      [selectedMarker]: [
        ...defaultMarkerPositions[selectedMarker],
      ],
    };

    setMarkerPositions(next);
    saveMarkerPositions(next);

    if (
      selectedComponent === selectedMarker ||
      chapters[index].focusMarker === selectedMarker
    ) {
      setFocusAngle(
        getMarkerFocusAngle(next[selectedMarker])
      );
    }
  };

  const resetAll = () => {
    const next = Object.fromEntries(
      Object.entries(defaultMarkerPositions).map(
        ([id, position]) => [id, [...position]]
      )
    );

    setMarkerPositions(next);
    saveMarkerPositions(next);
    setSelectedComponent(null);

    const focusMarker = chapters[index].focusMarker;

    if (focusMarker) {
      setSelectedMarker(focusMarker);
      setFocusAngle(
        getMarkerFocusAngle(next[focusMarker])
      );
    } else {
      setSelectedMarker(null);
      setFocusAngle(null);
    }
  };

  const exportPositions = async () => {
    const output = JSON.stringify(markerPositions, null, 2);

    try {
      await navigator.clipboard.writeText(output);
      alert("All marker coordinates copied!");
    } catch {
      window.prompt("Copy all marker coordinates:", output);
    }
  };

  return (
    <main className="experience">
      <header className="site-header">
        <a
          className="wordmark"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            navigate(0);
          }}
        >
          <span>
            TRINETRA
            <small>TACTICAL COMMUNICATION SYSTEM</small>
          </span>
        </a>

        <span className="chapter-count">
          {chapter.number} <span>/</span> 07
        </span>
      </header>

      {/* No arrow, pointer, or arrow-style callout */}
      <ModelStage
        index={index}
        positions={markerPositions}
        selectedMarker={selectedMarker}
        focusAngle={focusAngle}
        onMarkerSelect={selectMarker}
      />

      <section
        className="chapter-copy"
        key={`${chapter.id}-${selectedComponent ?? "chapter"}`}
      >
        <div className="chapter-index">
          {chapter.number} —{" "}
          {activeComponent
            ? activeComponent.id.replace("-", " ")
            : chapter.id.replace("-", " ")}
        </div>

        <h1>{displayedTitle}</h1>
        <p>{displayedDescription}</p>

        {index === 6 && (
          <p className="small-note">
            Future development: animate the helmet shell opening
            to reveal the internal RF shielding layer. The current
            layer is conceptual and is not actual helmet geometry.
          </p>
        )}

        <div className="navigation">
          <button
            className="back"
            onClick={() => navigate(index - 1)}
            disabled={index === 0}
          >
            Previous
          </button>

          <button
            className="next"
            onClick={() => navigate(index + 1)}
            disabled={index === chapters.length - 1}
          >
            {index === chapters.length - 1 ? "End" : "Next"}
            <span>↗</span>
          </button>
        </div>
      </section>

      {/* Temporary marker-position editor */}
      <button
        onClick={() => setDebugOpen((open) => !open)}
        style={{
          position: "fixed",
          top: 85,
          right: 18,
          zIndex: 40,
          padding: "10px 14px",
          border: "1px solid rgba(90,110,116,.35)",
          borderRadius: 6,
          background: "rgba(245,247,249,.95)",
          color: "#26383D",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {debugOpen ? "Close editor" : "Adjust 3D markers"}
      </button>

      {debugOpen && (
        <aside
          style={{
            position: "fixed",
            top: 130,
            right: 18,
            zIndex: 50,
            width: "min(310px, calc(100vw - 36px))",
            maxHeight: "calc(100vh - 155px)",
            overflowY: "auto",
            padding: 18,
            border: "1px solid rgba(90,110,116,.3)",
            borderRadius: 10,
            background: "rgba(246,248,249,.97)",
            color: "#26383D",
            boxShadow: "0 12px 40px rgba(0,0,0,.14)",
            fontFamily: "sans-serif",
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>
            Marker position
          </h2>

          <label
            htmlFor="marker-choice"
            style={{ display: "block", fontSize: 12 }}
          >
            Component
          </label>

          <select
            id="marker-choice"
            value={selectedMarker ?? "antenna"}
            onChange={(event) =>
              chooseEditorMarker(event.target.value)
            }
            style={{
              width: "100%",
              padding: 9,
              margin: "6px 0 18px",
            }}
          >
            {markerDefinitions.map((marker) => (
              <option key={marker.id} value={marker.id}>
                {marker.label}
              </option>
            ))}
          </select>

          {["X", "Y", "Z"].map((axis, axisIndex) => (
            <div key={axis} style={{ marginBottom: 15 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <label htmlFor={`axis-${axis}`}>{axis}</label>
                <output>
                  {selectedPosition[axisIndex].toFixed(2)}
                </output>
              </div>

              <input
                id={`axis-${axis}`}
                type="range"
                min="-1.1"
                max="1.1"
                step="0.01"
                value={selectedPosition[axisIndex]}
                onChange={(event) =>
                  updateCoordinate(
                    axisIndex,
                    event.target.value
                  )
                }
                style={{ width: "100%" }}
              />
            </div>
          ))}

          <div
            style={{
              padding: 10,
              background: "#E9EEF0",
              borderRadius: 5,
              fontSize: 12,
              overflowWrap: "anywhere",
            }}
          >
            {JSON.stringify(
              selectedPosition.map((value) =>
                Number(value.toFixed(2))
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button onClick={resetSelected}>
              Reset this marker
            </button>

            <button onClick={resetAll}>
              Reset all markers
            </button>

            <button onClick={exportPositions}>
              Copy all positions
            </button>
          </div>

          <p style={{ fontSize: 11, lineHeight: 1.5 }}>
            Click a marker to open its component chapter.
            Coordinates are saved in this browser.
          </p>
        </aside>
      )}

      <footer className="footer">
        <span>TRINETRA / SYSTEM OVERVIEW</span>

        <span className="space-hint">
          SPACE TO CONTINUE
        </span>

        <div className="chapter-dots">
          {chapters.map((item, chapterIndex) => (
            <button
              key={item.id}
              className={
                chapterIndex === index ? "active" : ""
              }
              aria-label={`Go to ${item.label}`}
              onClick={() => navigate(chapterIndex)}
            />
          ))}
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
