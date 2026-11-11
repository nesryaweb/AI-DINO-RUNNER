"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const ENV_MODEL_URL = process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL;
const SETTINGS_KEY = "ai-dino-settings";

const MOVEMENTS = [
  { name: "Jump", key: "jump", symbol: "↑", description: "Jump up" },
  { name: "Duck", key: "duck", symbol: "↓", description: "Crouch down" },
  {
    name: "Neutral",
    key: "neutral",
    symbol: "●",
    description: "Stand normally",
  },
];

/*
  Recognizes any class beginning with:
  JUMP     -> jump
  DUCK     -> duck
  NEUTRAL  -> neutral

  Examples:
  JUMP1, JUMP2, JUMP20, JUMP100
  DUCK1, DUCK7, DUCK20
  NEUTRAL1, NEUTRAL12, NEUTRAL50

  Class names are case-insensitive.
*/
function getMovementGroup(label) {
  const normalized = String(label || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

  if (normalized.startsWith("jump")) return "jump";
  if (normalized.startsWith("duck")) return "duck";
  if (normalized.startsWith("neutral")) return "neutral";

  return null;
}

// Add together the probabilities of ALL classes belonging to each movement.
function getGroupedPredictions(results) {
  const groups = {
    jump: 0,
    duck: 0,
    neutral: 0,
  };

  results.forEach((result) => {
    const group = getMovementGroup(result.className);

    if (group) {
      groups[group] += result.probability;
    }
  });

  return groups;
}

// Count all classes belonging to a movement, regardless of their number.
function getClassCount(classes, movement) {
  return classes.filter(
    (label) => getMovementGroup(label) === movement
  ).length;
}

export default function Home() {
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const controlRef = useRef("neutral");
  const previousPredictionRef = useRef("neutral");
  const confidenceThresholdRef = useRef(0.85);

  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [aiError, setAiError] = useState("");
  const [prediction, setPrediction] = useState("Waiting");
  const [confidence, setConfidence] = useState(0);
  const [classes, setClasses] = useState([]);
  const [gameKey, setGameKey] = useState(0);
  const [gameStatus, setGameStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(true);

  const setControl = useCallback((action) => {
    controlRef.current = action;
  }, []);

  // Hidden Settings shortcut: Ctrl + Shift + S.
  useEffect(() => {
    const handleSettingsShortcut = (event) => {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.code === "KeyS"
      ) {
        event.preventDefault();
        window.location.href = "/settings";
      }
    };

    window.addEventListener("keydown", handleSettingsShortcut);

    return () => {
      window.removeEventListener("keydown", handleSettingsShortcut);
    };
  }, []);

  const startAI = async () => {
    try {
      setCameraError("");
      setAiError("");

      // Read the model URL and confidence saved on the Settings page.
      let savedSettings = null;

      try {
        savedSettings = JSON.parse(
          window.localStorage.getItem(SETTINGS_KEY) || "null"
        );
      } catch {
        savedSettings = null;
      }

      const configuredModelUrl =
        savedSettings?.modelUrl || ENV_MODEL_URL;

      const configuredConfidence = Number(
        savedSettings?.confidence ?? 85
      );

      if (
        !configuredModelUrl ||
        configuredModelUrl.includes("YOUR_MODEL_ID")
      ) {
        throw new Error(
          "Open Settings using Ctrl + Shift + S and add your Teachable Machine model URL."
        );
      }

      if (
        Number.isNaN(configuredConfidence) ||
        configuredConfidence < 1 ||
        configuredConfidence > 100
      ) {
        throw new Error(
          "Your confidence setting must be between 1 and 100."
        );
      }

      confidenceThresholdRef.current =
        configuredConfidence / 100;

      if (!modelRef.current) {
        const modelURL = configuredModelUrl.endsWith("/")
          ? configuredModelUrl
          : configuredModelUrl + "/";

        modelRef.current = await tmImage.load(
          modelURL + "model.json",
          modelURL + "metadata.json"
        );

        const loadedClasses = modelRef.current.getClassLabels();

        setClasses(loadedClasses);

        console.log("Teachable Machine classes:", loadedClasses);

        // Check that the model has at least one class for each movement.
        const jumpCount = getClassCount(loadedClasses, "jump");
        const duckCount = getClassCount(loadedClasses, "duck");
        const neutralCount = getClassCount(loadedClasses, "neutral");

        if (jumpCount === 0 || duckCount === 0 || neutralCount === 0) {
          throw new Error(
            "Your model needs at least one JUMP, one DUCK, and one NEUTRAL class. Check the class names in Teachable Machine."
          );
        }

        setModelReady(true);
      }

      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 640,
            height: 480,
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraReady(true);
      }

      setAiEnabled(true);
    } catch (error) {
      setAiError(
        error.message || "Could not start the AI camera."
      );
    }
  };

  // AI prediction loop.
  useEffect(() => {
    if (!cameraReady || !modelReady || !aiEnabled) return;

    let active = true;
    let busy = false;

    const predict = async () => {
      if (!active || busy) return;

      const video = videoRef.current;

      if (!video || video.readyState < 2) return;

      busy = true;

      try {
        const results = await modelRef.current.predict(video);

        if (!active) return;

        // Combine every matching class into three movement groups.
        const grouped = getGroupedPredictions(results);

        console.log("Grouped predictions:", grouped);

        // Find the movement with the highest combined probability.
        const highest = Object.entries(grouped).reduce(
          (best, current) =>
            current[1] > best[1] ? current : best,
          ["neutral", 0]
        );

        const [bestMovement, bestProbability] = highest;

        const threshold = confidenceThresholdRef.current;

        // Only activate a movement if it reaches the confidence threshold.
        let action = "neutral";

        if (bestProbability >= threshold) {
          action = bestMovement;
        }

        // Display the grouped movement, not individual class names.
        const isRecognized = bestProbability >= threshold;

        setPrediction(
          isRecognized
            ? bestMovement.toUpperCase()
            : "Waiting"
        );

        setConfidence(bestProbability);

        const previous = previousPredictionRef.current;

        // Trigger a jump only when a new jump command is detected.
        if (action === "jump" && previous !== "jump") {
          setControl("jump");
        } else {
          setControl(action);
        }

        previousPredictionRef.current = action;
      } catch (error) {
        console.error("AI prediction error:", error);
      } finally {
        busy = false;
      }
    };

    const timer = setInterval(predict, 100);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [cameraReady, modelReady, aiEnabled, setControl]);

  // Stop the camera when the page is closed.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const restartGame = () => {
    setScore(0);
    setControl("neutral");
    previousPredictionRef.current = "neutral";
    setGameStatus("playing");
    setGameKey((value) => value + 1);
  };

  const handleGameOver = (finalScore) => {
    setScore(finalScore);
    setBestScore((previous) =>
      Math.max(previous, finalScore)
    );
    setGameStatus("over");
  };

  const toggleAI = () => {
    setAiEnabled((value) => !value);
    setControl("neutral");
    previousPredictionRef.current = "neutral";
    setPrediction("Waiting");
    setConfidence(0);
  };

  return (
    <main className="page">
      <header className="header">
        <a className="brand" href="#">
          <span className="brand-icon">✦</span>
          AI MOTION LAB
        </a>

        <div className="header-status">
          <span
            className={`dot ${modelReady ? "active" : ""}`}
          />
          {modelReady
            ? "AI MODEL CONNECTED"
            : "AI MODEL NOT CONNECTED"}
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          OUR ARTIFICIAL INTELLIGENCE PROJECT
          <span className="eyebrow-line" />
        </div>

        <h1>
          AI DINO <span>RUNNER</span>
        </h1>

        <p className="subtitle">
          Can you control a dinosaur using only your body movements?
        </p>

        <div className="hero-pills">
          <span>✦ Artificial Intelligence</span>
          <span>● Teachable Machine</span>
          <span>⌁ Motion Recognition</span>
        </div>
      </section>

      <section className="game-layout">
        <div className="game-panel">
          <div className="game-panel-heading">
            <div>
              <span className="section-kicker">LET'S PLAY</span>
              <h2>Dinosaur Adventure</h2>
            </div>

            <span className={`playing-badge ${gameStatus}`}>
              <span />
              {gameStatus === "playing"
                ? "PLAYING"
                : gameStatus === "over"
                  ? "GAME OVER"
                  : "READY"}
            </span>
          </div>

          <div className="game-scorebar">
            <div className="score-item">
              <span className="score-icon">🏆</span>
              <div>
                <span className="small-label">YOUR SCORE</span>
                <strong>{score}</strong>
              </div>
            </div>

            <div className="score-divider" />

            <div className="score-item">
              <span className="score-icon">⭐</span>
              <div>
                <span className="small-label">BEST SCORE</span>
                <strong>{bestScore}</strong>
              </div>
            </div>

            <div className="game-hint">
              {gameStatus === "playing"
                ? "Keep going!"
                : "Ready for an adventure?"}
            </div>
          </div>

          <Game
            key={gameKey}
            controlRef={controlRef}
            gameStatus={gameStatus}
            setGameStatus={setGameStatus}
            setScore={setScore}
            onGameOver={handleGameOver}
          />

          <div className="game-actions">
            <button
              className="primary-button"
              onClick={restartGame}
            >
              <span>▶</span>
              {gameStatus === "playing"
                ? "RESTART GAME"
                : "START GAME"}
            </button>

            <p className="keyboard-hint">
              <kbd>SPACE</kbd> or <kbd>↑</kbd> JUMP
              <span>·</span>
              <kbd>↓</kbd> DUCK
            </p>
          </div>
        </div>

        <aside className="ai-panel">
          <div className="ai-panel-heading">
            <div className="ai-heading-icon">✧</div>
            <div>
              <span className="section-kicker">
                BODY MOVEMENT CONTROL
              </span>
              <h2>AI Control Center</h2>
            </div>
          </div>

          <div className="camera-frame">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`camera-video ${
                cameraReady ? "" : "hidden"
              }`}
            />

            {!cameraReady && (
              <div className="camera-placeholder">
                <div className="camera-placeholder-icon">
                  ◎
                </div>
                <strong>Your camera goes here</strong>
                <p>
                  Connect the camera to let AI see your movements.
                </p>
              </div>
            )}

            <span
              className={`camera-label ${
                cameraReady ? "live" : ""
              }`}
            >
              <span />
              {cameraReady ? "LIVE CAMERA" : "CAMERA OFF"}
            </span>
          </div>

          <button
            className="primary-button camera-button"
            onClick={startAI}
            disabled={cameraReady && modelReady}
          >
            {cameraReady && modelReady
              ? "✓ AI CAMERA CONNECTED"
              : "CONNECT AI + CAMERA"}
          </button>

          {cameraError && (
            <p className="error">{cameraError}</p>
          )}

          {aiError && (
            <p className="error">{aiError}</p>
          )}

          <div className="prediction-box">
            <div className="prediction-top">
              <span className="small-label">
                AI DETECTED MOVEMENT
              </span>

              <span className="live-indicator">
                <span />
                LIVE
              </span>
            </div>

            <h3 className="prediction-value">
              {prediction.toUpperCase()}
            </h3>

            <div className="confidence-row">
              <span>AI confidence</span>
              <strong>
                {(confidence * 100).toFixed(1)}%
              </strong>
            </div>

            <div className="confidence-track">
              <div
                className="confidence-fill"
                style={{
                  width: `${confidence * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="movement-list">
            <div className="movement-list-heading">
              <h3>TRAINED MOVEMENTS</h3>
              <span>3 MOVEMENTS</span>
            </div>

            {MOVEMENTS.map((movement) => {
              const count = getClassCount(
                classes,
                movement.key
              );

              const loaded = count > 0;

              return (
                <div
                  className="movement-item"
                  key={movement.key}
                >
                  <span className="movement-symbol">
                    {movement.symbol}
                  </span>

                  <div className="movement-name">
                    <strong>{movement.name}</strong>
                    <span>{movement.description}</span>
                  </div>

                  <span
                    className={`movement-state ${
                      loaded ? "loaded" : ""
                    }`}
                  >
                    {loaded
                      ? `${count} CLASSES`
                      : "NOT FOUND"}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            className="secondary-button"
            onClick={toggleAI}
          >
            {aiEnabled
              ? "Ⅱ  PAUSE AI CONTROL"
              : "▶  RESUME AI CONTROL"}
          </button>

          <p className="camera-note">
            You can also play with your keyboard if the camera is
            not connected.
          </p>
        </aside>
      </section>

      <section className="instructions">
        <div className="instructions-heading">
          <span className="section-kicker">HOW IT WORKS</span>
          <h2>Three movements. One dinosaur.</h2>
          <p>
            Train the AI, show it your movements, and watch the
            dinosaur react!
          </p>
        </div>

        <div className="instruction-grid">
          <div className="instruction-card">
            <div className="instruction-icon jump-icon">
              ↑
            </div>
            <div>
              <h3>JUMP</h3>
              <p>
                Raise your body or perform your trained jump
                movement to jump over obstacles.
              </p>
            </div>
            <span className="instruction-number">01</span>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon duck-icon">
              ↓
            </div>
            <div>
              <h3>DUCK</h3>
              <p>
                Crouch down to make the dinosaur duck under
                flying obstacles.
              </p>
            </div>
            <span className="instruction-number">02</span>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon neutral-icon">
              ●
            </div>
            <div>
              <h3>NEUTRAL</h3>
              <p>
                Stand normally and let your dinosaur keep running.
              </p>
            </div>
            <span className="instruction-number">03</span>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">✦ AI MOTION LAB</div>
        <p>A STUDENT SCIENCE FAIR PROJECT</p>
        <span>POWERED BY TEACHABLE MACHINE</span>
      </footer>
    </main>
  );
}

function Game({
  controlRef,
  gameStatus,
  setGameStatus,
  setScore,
  onGameOver,
}) {
  const canvasRef = useRef(null);
  const statusRef = useRef(gameStatus);
  const scoreCallbackRef = useRef(setScore);
  const gameOverCallbackRef = useRef(onGameOver);
  const gameStatusCallbackRef = useRef(setGameStatus);

  useEffect(() => {
    statusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    scoreCallbackRef.current = setScore;
    gameOverCallbackRef.current = onGameOver;
    gameStatusCallbackRef.current = setGameStatus;
  }, [setScore, onGameOver, setGameStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const ground = 285;

    const state = {
      dino: {
        x: 105,
        y: ground - 58,
        velocityY: 0,
        jumping: false,
        ducking: false,
        animation: 0,
      },
      obstacles: [],
      clouds: [
        { x: 170, y: 65, size: 1 },
        { x: 440, y: 105, size: 0.8 },
        { x: 760, y: 55, size: 1.1 },
      ],
      hills: [
        { x: 80, width: 180, height: 48 },
        { x: 380, width: 240, height: 65 },
        { x: 740, width: 200, height: 45 },
      ],
      frame: 0,
      score: 0,
      speed: 5,
      nextObstacle: 100,
      lastAction: "neutral",
      gameOver: false,
      lastTime: 0,
      groundOffset: 0,
    };

    const drawCloud = (x, y, scale) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(0, 10, 15, 0, Math.PI * 2);
      ctx.arc(19, 2, 20, 0, Math.PI * 2);
      ctx.arc(40, 10, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawDino = () => {
      const d = state.dino;
      const x = d.x;
      const y =
        d.ducking && !d.jumping
          ? ground - 34
          : d.y;

      const runningFrame =
        Math.floor(state.frame / 6) % 2;

      ctx.save();
      ctx.translate(x, y);

      const bodyColor = "#245a42";
      const darkColor = "#17432f";
      const lightColor = "#4b8b62";

      if (d.ducking && !d.jumping) {
        ctx.fillStyle = bodyColor;
        ctx.fillRect(2, 12, 47, 22);
        ctx.fillRect(35, 0, 27, 22);
        ctx.fillRect(-12, 20, 18, 7);
        ctx.fillRect(56, 10, 12, 5);

        ctx.fillStyle = darkColor;
        ctx.fillRect(10, 31, 12, 5);
        ctx.fillRect(39, 31, 12, 5);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(52, 5, 5, 5);
        ctx.fillStyle = "#172c20";
        ctx.fillRect(54, 6, 2, 3);

        ctx.fillStyle = lightColor;
        ctx.fillRect(24, 15, 8, 5);
      } else {
        ctx.fillStyle = darkColor;
        ctx.fillRect(-12, 35, 18, 7);
        ctx.fillRect(-20, 29, 12, 8);

        ctx.fillStyle = bodyColor;
        ctx.fillRect(3, 17, 36, 34);
        ctx.fillRect(27, 6, 27, 29);

        ctx.fillStyle = lightColor;
        ctx.fillRect(11, 10, 7, 9);
        ctx.fillRect(23, 8, 7, 9);
        ctx.fillRect(35, 10, 7, 8);

        ctx.fillStyle = bodyColor;
        ctx.fillRect(40, 3, 21, 20);
        ctx.fillRect(54, 13, 13, 9);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(53, 7, 6, 6);
        ctx.fillStyle = "#172c20";
        ctx.fillRect(56, 8, 3, 4);

        ctx.fillStyle = darkColor;
        ctx.fillRect(64, 15, 3, 3);

        ctx.fillStyle = lightColor;
        ctx.fillRect(35, 29, 10, 5);
        ctx.fillRect(41, 33, 5, 5);

        ctx.fillStyle = darkColor;

        if (d.jumping) {
          ctx.fillRect(9, 48, 8, 12);
          ctx.fillRect(30, 47, 8, 13);
          ctx.fillRect(4, 58, 15, 4);
          ctx.fillRect(28, 59, 15, 4);
        } else if (runningFrame === 0) {
          ctx.fillRect(9, 48, 8, 14);
          ctx.fillRect(30, 48, 8, 9);
          ctx.fillRect(3, 58, 15, 4);
          ctx.fillRect(29, 54, 13, 4);
        } else {
          ctx.fillRect(10, 48, 8, 9);
          ctx.fillRect(29, 48, 8, 14);
          ctx.fillRect(6, 54, 13, 4);
          ctx.fillRect(28, 58, 15, 4);
        }
      }

      ctx.restore();
    };

    const drawObstacle = (obstacle) => {
      if (obstacle.type === "bird") {
        const flap = Math.floor(state.frame / 5) % 2;

        ctx.fillStyle = "#b65c42";
        ctx.fillRect(obstacle.x, obstacle.y, 34, 15);
        ctx.fillRect(obstacle.x + 22, obstacle.y - 7, 13, 12);
        ctx.fillRect(obstacle.x + 30, obstacle.y - 3, 9, 4);

        ctx.fillStyle = "#8d4938";

        if (flap === 0) {
          ctx.fillRect(
            obstacle.x + 8,
            obstacle.y - 10,
            14,
            10
          );
        } else {
          ctx.fillRect(
            obstacle.x + 8,
            obstacle.y + 13,
            14,
            9
          );
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          obstacle.x + 28,
          obstacle.y - 4,
          4,
          4
        );
      } else {
        ctx.fillStyle = "#3c7a4e";
        ctx.fillRect(
          obstacle.x + 8,
          obstacle.y,
          22,
          obstacle.height
        );
        ctx.fillRect(
          obstacle.x,
          obstacle.y + 14,
          11,
          20
        );
        ctx.fillRect(
          obstacle.x + 23,
          obstacle.y + 22,
          12,
          18
        );

        ctx.fillStyle = "#559465";
        ctx.fillRect(
          obstacle.x + 12,
          obstacle.y + 4,
          5,
          12
        );
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#eaf5ee";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#d9ebdf";

      state.hills.forEach((hill) => {
        ctx.beginPath();
        ctx.ellipse(
          hill.x,
          ground - 5,
          hill.width / 2,
          hill.height,
          0,
          Math.PI,
          0
        );
        ctx.fill();
      });

      state.clouds.forEach((cloud) =>
        drawCloud(cloud.x, cloud.y, cloud.size)
      );

      ctx.fillStyle = "#8eae98";
      ctx.fillRect(0, ground, canvas.width, 2);

      ctx.fillStyle = "#b5cdbb";

      for (let i = 0; i < 24; i++) {
        const x =
          (i * 48 - state.groundOffset) % canvas.width;

        ctx.fillRect(x, ground + 12, 18, 2);
      }

      state.obstacles.forEach(drawObstacle);
      drawDino();

      if (
        statusRef.current === "ready" ||
        state.gameOver
      ) {
        ctx.fillStyle = "rgba(234,245,238,0.78)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#245a42";
        ctx.font = "bold 32px Arial";

        ctx.fillText(
          state.gameOver ? "GAME OVER!" : "READY TO RUN?",
          canvas.width / 2,
          145
        );

        ctx.font = "16px Arial";
        ctx.fillStyle = "#547561";

        ctx.fillText(
          state.gameOver
            ? "Press RESTART GAME to try again"
            : "Press START GAME when you're ready",
          canvas.width / 2,
          180
        );

        ctx.textAlign = "left";
      }
    };

    const jump = () => {
      if (!state.dino.jumping) {
        state.dino.velocityY = -14;
        state.dino.jumping = true;
        state.dino.ducking = false;
      }
    };

    const update = (delta) => {
      if (
        statusRef.current !== "playing" ||
        state.gameOver
      ) {
        return;
      }

      const factor = Math.min(delta / 16.67, 2);

      state.frame += factor;
      state.score += 0.12 * factor;
      state.speed = Math.min(
        11,
        5 + state.score / 250
      );

      state.groundOffset =
        (state.groundOffset + state.speed * factor) %
        canvas.width;

      const action = controlRef.current;

      if (
        action === "jump" &&
        state.lastAction !== "jump"
      ) {
        jump();
      }

      state.lastAction = action;

      state.dino.ducking =
        action === "duck" && !state.dino.jumping;

      if (state.dino.jumping) {
        state.dino.y +=
          state.dino.velocityY * factor;

        state.dino.velocityY += 0.7 * factor;

        if (state.dino.y >= ground - 58) {
          state.dino.y = ground - 58;
          state.dino.velocityY = 0;
          state.dino.jumping = false;
        }
      }

      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.speed * factor;
      });

      state.obstacles = state.obstacles.filter(
        (obstacle) => obstacle.x > -70
      );

      state.nextObstacle -= factor;

      if (state.nextObstacle <= 0) {
        const type =
          Math.random() > 0.5 ? "cactus" : "bird";

        state.obstacles.push({
          x: canvas.width + 25,
          y:
            type === "bird"
              ? ground - 76
              : ground - 45,
          width: type === "bird" ? 39 : 35,
          height: type === "bird" ? 18 : 45,
          type,
        });

        state.nextObstacle =
          95 + Math.random() * 65;
      }

      state.clouds.forEach((cloud) => {
        cloud.x -= 0.45 * factor;

        if (cloud.x < -65) {
          cloud.x = canvas.width + 35;
        }
      });

      state.hills.forEach((hill) => {
        hill.x -= 0.25 * factor;

        if (hill.x < -hill.width) {
          hill.x =
            canvas.width + hill.width / 2;
        }
      });

      const d = state.dino;

      const player = {
        x: d.x + 3,
        y: d.ducking
          ? ground - 34
          : d.y + 8,
        width: d.ducking ? 62 : 58,
        height: d.ducking ? 32 : 48,
      };

      for (const obstacle of state.obstacles) {
        const hit =
          player.x <
            obstacle.x + obstacle.width - 5 &&
          player.x + player.width >
            obstacle.x + 4 &&
          player.y <
            obstacle.y + obstacle.height - 3 &&
          player.y + player.height >
            obstacle.y + 3;

        if (hit) {
          state.gameOver = true;
          statusRef.current = "over";

          gameStatusCallbackRef.current("over");

          gameOverCallbackRef.current(
            Math.floor(state.score)
          );

          break;
        }
      }

      scoreCallbackRef.current(
        Math.floor(state.score)
      );
    };

    let animationFrame;
    let lastFrameTime = 0;

    const drawLoop = (time) => {
      if (!lastFrameTime) {
        lastFrameTime = time;
      }

      const delta = time - lastFrameTime;
      lastFrameTime = time;

      update(delta);
      draw();

      animationFrame =
        requestAnimationFrame(drawLoop);
    };

    const handleKeyDown = (event) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowUp"
      ) {
        event.preventDefault();

        if (statusRef.current === "playing") {
          controlRef.current = "jump";
        }
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();

        if (statusRef.current === "playing") {
          controlRef.current = "duck";
        }
      }
    };

    const handleKeyUp = (event) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown"
      ) {
        controlRef.current = "neutral";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationFrame =
      requestAnimationFrame(drawLoop);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, [controlRef]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={330}
      className="game-canvas"
      aria-label="Dinosaur running game"
    />
  );
}