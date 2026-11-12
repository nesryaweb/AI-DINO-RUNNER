
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const ENV_MODEL_URL = process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL;
const SETTINGS_KEY = "ai-dino-settings";

const MOVEMENTS = [
  { name: "Jump", key: "jump", symbol: "↑", description: "Jump up" },
  { name: "Duck", key: "duck", symbol: "↓", description: "Crouch down" },
  { name: "Neutral", key: "neutral", symbol: "●", description: "Stand normally" },
];

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

function getGroupedPredictions(results) {
  const groups = { jump: 0, duck: 0, neutral: 0 };

  results.forEach((result) => {
    const group = getMovementGroup(result.className);
    if (group) groups[group] += result.probability;
  });

  return groups;
}

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

        const jumpCount = getClassCount(loadedClasses, "jump");
        const duckCount = getClassCount(loadedClasses, "duck");
        const neutralCount = getClassCount(loadedClasses, "neutral");

        if (
          jumpCount === 0 ||
          duckCount === 0 ||
          neutralCount === 0
        ) {
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
            width: 320,
            height: 240,
            frameRate: { ideal: 24, max: 30 },
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

  // AI prediction loop. Runs sequentially so predictions never overlap.
  
  // Fast AI prediction loop. Each confident prediction is acted on immediately.
  useEffect(() => {
    if (!cameraReady || !modelReady || !aiEnabled) return;

    let active = true;
    let timer = null;

    const PREDICTION_INTERVAL = 50;

    const predict = async () => {
      if (!active) return;

      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        timer = setTimeout(predict, PREDICTION_INTERVAL);
        return;
      }

      try {
        const results = await modelRef.current.predict(video);

        if (!active) return;

        const grouped = getGroupedPredictions(results);

        const [bestMovement, bestProbability] =
          Object.entries(grouped).reduce(
            (best, current) =>
              current[1] > best[1] ? current : best,
            ["neutral", 0]
          );

        const recognized =
          bestProbability >= confidenceThresholdRef.current;

        setConfidence(bestProbability);

        setPrediction(
          recognized ? bestMovement.toUpperCase() : "Waiting"
        );

        // Act immediately when a movement passes the confidence threshold.
        // Ignore uncertain predictions instead of delaying or cancelling
        // the last confidently recognized movement.
        if (recognized) {
          setControl(bestMovement);
        }
      } catch (error) {
        console.error("AI prediction error:", error);
      }

      if (active) {
        timer = setTimeout(predict, PREDICTION_INTERVAL);
      }
    };

    predict();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
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
          <span className={`dot ${modelReady ? "active" : ""}`} />
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
                <div className="camera-placeholder-icon">◎</div>
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
            <div className="instruction-icon jump-icon">↑</div>
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
            <div className="instruction-icon duck-icon">↓</div>
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
            <div className="instruction-icon neutral-icon">●</div>
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

    // Load the original Chrome Dino sprite sheet.
    const dinoSprite = new Image();
    dinoSprite.src = "/dino-sprite.png";

    const state = {
      dino: {
        x: 105,
        y: ground - 47,
        velocityY: 0,
        jumping: false,
        ducking: false,
      },

      obstacles: [],

      clouds: [
        { x: 170, y: 65, size: 1 },
        { x: 440, y: 105, size: 0.8 },
        { x: 760, y: 55, size: 1.1 },
      ],

      frame: 0,
      score: 0,
      speed: 5,
      nextObstacle: 100,
      lastAction: "neutral",
      gameOver: false,
      groundOffset: 0,
    };

    const drawCloud = (x, y, scale) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.fillStyle = "#d5d5d5";
      ctx.beginPath();
      ctx.arc(0, 10, 15, 0, Math.PI * 2);
      ctx.arc(19, 2, 20, 0, Math.PI * 2);
      ctx.arc(40, 10, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw the original Chrome Dino poses from its sprite sheet.
    const drawDino = () => {
      const d = state.dino;

      if (!dinoSprite.complete || !dinoSprite.naturalWidth) {
        return;
      }

      const isDucking = d.ducking && !d.jumping;

      const SPRITE_X = 848;
      const SPRITE_Y = 2;

      const RUN_WIDTH = 44;
      const RUN_HEIGHT = 47;

      const DUCK_WIDTH = 59;
      const DUCK_HEIGHT = 25;

      let sourceX;
      let sourceWidth;
      let sourceHeight;
      let drawX;
      let drawY;
      let drawWidth;
      let drawHeight;

      if (isDucking) {
        const duckFrame = Math.floor(state.frame / 8) % 2;

        // Original ducking frames.
        sourceX = duckFrame === 0 ? 264 : 323;

        sourceWidth = DUCK_WIDTH;
        sourceHeight = DUCK_HEIGHT;

        drawX = d.x - 5;
        drawY = ground - DUCK_HEIGHT;
        drawWidth = DUCK_WIDTH;
        drawHeight = DUCK_HEIGHT;
      } else {
        if (d.jumping) {
          // Original jumping pose.
          sourceX = 0;
        } else {
          // Original running frames.
          const runningFrame = Math.floor(state.frame / 5) % 2;
          sourceX = runningFrame === 0 ? 88 : 132;
        }

        sourceWidth = RUN_WIDTH;
        sourceHeight = RUN_HEIGHT;

        drawX = d.x;
        drawY = d.y;
        drawWidth = RUN_WIDTH;
        drawHeight = RUN_HEIGHT;
      }

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        dinoSprite,
        SPRITE_X + sourceX,
        SPRITE_Y,
        sourceWidth,
        sourceHeight,
        Math.round(drawX),
        Math.round(drawY),
        drawWidth,
        drawHeight
      );

      ctx.restore();
    };

    const drawObstacle = (obstacle) => {
      ctx.save();

      if (obstacle.type === "bird") {
        const flap = Math.floor(state.frame / 6) % 2;
        const x = Math.round(obstacle.x);
        const y = Math.round(obstacle.y);

        ctx.fillStyle = "#535353";

        ctx.fillRect(x + 5, y + 7, 28, 8);
        ctx.fillRect(x + 25, y + 2, 10, 9);
        ctx.fillRect(x + 33, y + 5, 7, 4);
        ctx.fillRect(x, y + 8, 8, 4);

        if (flap === 0) {
          ctx.fillRect(x + 12, y, 17, 8);
          ctx.fillRect(x + 17, y - 5, 9, 7);
        } else {
          ctx.fillRect(x + 12, y + 13, 17, 7);
          ctx.fillRect(x + 17, y + 18, 9, 4);
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + 29, y + 4, 3, 3);

        ctx.fillStyle = "#535353";
        ctx.fillRect(x + 30, y + 5, 1, 1);
      } else {
        const x = Math.round(obstacle.x);
        const y = Math.round(obstacle.y);

        ctx.fillStyle = "#535353";

        ctx.fillRect(x + 12, y, 12, obstacle.height);
        ctx.fillRect(x + 4, y + 13, 9, 7);
        ctx.fillRect(x + 4, y + 7, 6, 13);
        ctx.fillRect(x + 23, y + 22, 9, 7);
        ctx.fillRect(x + 26, y + 15, 6, 14);
        ctx.fillRect(x + 15, y - 5, 6, 8);
      }

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      state.clouds.forEach((cloud) => {
        drawCloud(cloud.x, cloud.y, cloud.size);
      });

      ctx.fillStyle = "#535353";
      ctx.fillRect(0, ground, canvas.width, 2);

      for (let i = 0; i < 22; i++) {
        const x =
          ((i * 53 - state.groundOffset * 1.5) %
            canvas.width +
            canvas.width) %
          canvas.width;

        ctx.fillRect(x, ground + 10, 9, 2);
      }

      state.obstacles.forEach(drawObstacle);
      drawDino();

      if (
        statusRef.current === "ready" ||
        state.gameOver
      ) {
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#535353";
        ctx.font = "bold 32px Arial";

        ctx.fillText(
          state.gameOver ? "GAME OVER!" : "READY TO RUN?",
          canvas.width / 2,
          145
        );

        ctx.font = "16px Arial";
        ctx.fillStyle = "#777777";

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

      const factor = Math.min(delta / 16.67, 3);

      state.frame += factor;
      state.score += 0.12 * factor;
      state.speed = Math.min(11, 5 + state.score / 250);

      state.groundOffset =
        (state.groundOffset + state.speed * factor) %
        canvas.width;

      const action = controlRef.current;

      // A jump is triggered once when a new jump command begins.
      if (
        action === "jump" &&
        state.lastAction !== "jump"
      ) {
        jump();
      }

      state.lastAction = action;

      // Duck remains active while the duck command is held.
      state.dino.ducking =
        action === "duck" && !state.dino.jumping;

      if (state.dino.jumping) {
        state.dino.y +=
          state.dino.velocityY * factor;

        state.dino.velocityY += 0.7 * factor;

        if (state.dino.y >= ground - 47) {
          state.dino.y = ground - 47;
          state.dino.velocityY = 0;
          state.dino.jumping = false;
        }
      }

      // Move existing obstacles.
      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.speed * factor;
      });

      state.obstacles = state.obstacles.filter(
        (obstacle) => obstacle.x > -70
      );

      // Create new obstacles.
      state.nextObstacle -= factor;

      if (state.nextObstacle <= 0) {
        const type =
          Math.random() > 0.5 ? "cactus" : "bird";

        state.obstacles.push({
          x: canvas.width + 25,

          // Birds are low enough to hit a standing dinosaur.
          y:
            type === "bird"
              ? ground - 52
              : ground - 45,

          width: type === "bird" ? 40 : 35,
          height: type === "bird" ? 16 : 45,
          type,
        });

        state.nextObstacle =
          95 + Math.random() * 65;
      }

      // Move clouds.
      state.clouds.forEach((cloud) => {
        cloud.x -= 0.45 * factor;

        if (cloud.x < -65) {
          cloud.x = canvas.width + 35;
        }
      });

      // Collision dimensions match the original sprite proportions.
      const d = state.dino;
      const isDucking = d.ducking && !d.jumping;

      const player = {
        x: d.x + (isDucking ? 2 : 4),
        y: isDucking ? ground - 25 : d.y + 4,
        width: isDucking ? 55 : 40,
        height: isDucking ? 23 : 40,
      };

      for (const obstacle of state.obstacles) {
        const hit =
          player.x < obstacle.x + obstacle.width - 5 &&
          player.x + player.width > obstacle.x + 4 &&
          player.y < obstacle.y + obstacle.height - 3 &&
          player.y + player.height > obstacle.y + 3;

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

      animationFrame = requestAnimationFrame(drawLoop);
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

    animationFrame = requestAnimationFrame(drawLoop);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
