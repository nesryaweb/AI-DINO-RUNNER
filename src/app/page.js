
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import {
  Brain,
  Camera,
  RefreshCw,
  Play,
  Pause,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const MODEL_URL =
  process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL || "";

const CONFIDENCE_THRESHOLD = 0.75;
const PREDICTION_INTERVAL = 100;

function getMovementGroup(label) {
  const normalized = String(label || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

  if (/^jump\d*$/.test(normalized)) return "jump";
  if (/^(duck|sit)\d*$/.test(normalized)) return "sit";
  if (/^neutral\d*$/.test(normalized)) return "neutral";

  return null;
}

function Avatar({ movement, jumping }) {
  const sitting = movement === "sit";

  return (
    <div className="avatar-stage">
      <div className={`avatar ${jumping ? "jumping" : ""} ${sitting ? "sitting" : ""}`}>
        <div className="avatar-shadow" />

        <div className="avatar-character">
          <div className="avatar-head">
            <div className="avatar-hair" />
            <div className="avatar-face">
              <div className="avatar-eyes">
                <span />
                <span />
              </div>
              <div className="avatar-smile" />
            </div>
          </div>

          <div className="avatar-neck" />

          <div className="avatar-body">
            <div className="avatar-shirt" />
            <div className="avatar-arm left-arm" />
            <div className="avatar-arm right-arm" />
          </div>

          <div className="avatar-legs">
            <div className="avatar-leg left-leg" />
            <div className="avatar-leg right-leg" />
          </div>
        </div>
      </div>

      <div className="ground" />
    </div>
  );
}

export default function Home() {
  const [model, setModel] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [movement, setMovement] = useState("neutral");
  const [jumping, setJumping] = useState(false);
  const [prediction, setPrediction] = useState("NEUTRAL");
  const [confidence, setConfidence] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const runningRef = useRef(false);
  const movementRef = useRef("neutral");
  const jumpTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastPredictionRef = useRef(0);
  const lastJumpRef = useRef(0);

  const applyMovement = useCallback((nextMovement) => {
    if (nextMovement === movementRef.current) return;

    movementRef.current = nextMovement;
    setMovement(nextMovement);

    if (nextMovement === "jump") {
      const now = Date.now();

      // Prevent repeated jumps while the same gesture is held.
      if (now - lastJumpRef.current < 700) return;

      lastJumpRef.current = now;
      setJumping(true);

      if (jumpTimerRef.current) {
        clearTimeout(jumpTimerRef.current);
      }

      jumpTimerRef.current = setTimeout(() => {
        setJumping(false);
      }, 700);
    } else {
      setJumping(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    runningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (jumpTimerRef.current) {
      clearTimeout(jumpTimerRef.current);
    }

    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }

    setCameraStarted(false);
    setCameraReady(false);
    setMovement("neutral");
    setJumping(false);
    movementRef.current = "neutral";
  }, []);

  const predict = useCallback(async () => {
    if (!runningRef.current || !modelRef.current || !webcamRef.current) {
      return;
    }

    const now = Date.now();

    if (now - lastPredictionRef.current < PREDICTION_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(predict);
      return;
    }

    lastPredictionRef.current = now;

    try {
      webcamRef.current.update();

      const predictions = await modelRef.current.predict(
        webcamRef.current.canvas
      );

      if (!runningRef.current) return;

      const best = predictions.reduce((a, b) =>
        a.probability > b.probability ? a : b
      );

      const percent = Math.round(best.probability * 100);
      const group = getMovementGroup(best.className);

      setPrediction(best.className);
      setConfidence(percent);

      if (group && best.probability >= CONFIDENCE_THRESHOLD) {
        applyMovement(group);
      } else {
        // Unknown or low-confidence predictions do not trigger movement.
        // The avatar stays in its last valid position.
      }
    } catch (err) {
      console.error("Prediction error:", err);
    }

    if (runningRef.current) {
      animationFrameRef.current = requestAnimationFrame(predict);
    }
  }, [applyMovement]);

  const startCamera = async () => {
    if (!MODEL_URL) {
      setError(
        "Model URL is missing. Add NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL to your .env.local file."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      let loadedModel = modelRef.current;

      if (!loadedModel) {
        loadedModel = await tmImage.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );

        modelRef.current = loadedModel;
        setModel(loadedModel);
      }

      const webcam = new tmImage.Webcam(640, 480, true);
      await webcam.setup();
      await webcam.play();

      webcamRef.current = webcam;

      if (canvasRef.current) {
        canvasRef.current.innerHTML = "";
        canvasRef.current.appendChild(webcam.canvas);
      }

      runningRef.current = true;
      setCameraStarted(true);
      setCameraReady(true);

      lastPredictionRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(predict);
    } catch (err) {
      console.error(err);
      setError(
        "Could not start the camera. Check camera permission and make sure no other app is using it."
      );
      stopCamera();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (jumpTimerRef.current) {
        clearTimeout(jumpTimerRef.current);
      }

      if (webcamRef.current) {
        webcamRef.current.stop();
      }
    };
  }, []);

  return (
    <main className="page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f6fb;
          color: #182033;
          font-family: Arial, Helvetica, sans-serif;
        }

        button {
          font: inherit;
        }

        .page {
          min-height: 100vh;
          padding: 28px;
        }

        .container {
          max-width: 1250px;
          margin: auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: #2563eb;
          color: white;
          display: grid;
          place-items: center;
        }

        .brand h1 {
          font-size: 25px;
          margin: 0;
        }

        .brand p {
          color: #778197;
          margin: 5px 0 0;
          font-size: 13px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          background: white;
          border: 1px solid #e5e9f2;
          border-radius: 30px;
          font-size: 13px;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #9ca3af;
        }

        .status-dot.active {
          background: #16a34a;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 22px;
        }

        .game-card,
        .panel {
          background: white;
          border: 1px solid #e5e9f2;
          border-radius: 20px;
          overflow: hidden;
        }

        .game-heading {
          padding: 20px 24px;
          border-bottom: 1px solid #edf0f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .game-heading h2 {
          font-size: 17px;
          margin: 0;
        }

        .game-heading span {
          color: #7b8498;
          font-size: 12px;
        }

        .arena {
          min-height: 490px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 35%, #ffffff 0, #f4f7ff 65%, #eaf0fc 100%);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .arena::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border: 1px solid #e3eaf8;
          border-radius: 50%;
          top: -270px;
          left: 50%;
          transform: translateX(-50%);
        }

        .arena-label {
          position: absolute;
          top: 22px;
          left: 24px;
          color: #8590a5;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .avatar-stage {
          width: 300px;
          height: 380px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
        }

        .ground {
          position: absolute;
          width: 210px;
          height: 22px;
          border-radius: 50%;
          background: #dce4f1;
          bottom: 35px;
        }

        .avatar {
          position: absolute;
          width: 190px;
          height: 300px;
          bottom: 50px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          transform-origin: bottom center;
          transition: transform 0.2s ease;
        }

        .avatar-character {
          position: relative;
          width: 150px;
          height: 265px;
          display: flex;
          align-items: center;
          flex-direction: column;
          transition: transform 0.25s ease;
        }

        .avatar-head {
          width: 85px;
          height: 90px;
          background: #eebd91;
          border-radius: 43% 43% 48% 48%;
          position: relative;
          z-index: 3;
          border: 3px solid #27344a;
          overflow: hidden;
        }

        .avatar-hair {
          height: 35px;
          width: 100%;
          background: #34251f;
          border-radius: 45% 45% 10% 10%;
          position: absolute;
          top: -5px;
        }

        .avatar-face {
          position: absolute;
          inset: 0;
        }

        .avatar-eyes {
          position: absolute;
          top: 47px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
        }

        .avatar-eyes span {
          width: 7px;
          height: 8px;
          border-radius: 50%;
          background: #27344a;
        }

        .avatar-smile {
          position: absolute;
          width: 22px;
          height: 10px;
          border-bottom: 2px solid #9b4d4d;
          border-radius: 50%;
          top: 65px;
          left: 29px;
        }

        .avatar-neck {
          width: 28px;
          height: 20px;
          background: #eebd91;
          border-left: 2px solid #27344a;
          border-right: 2px solid #27344a;
          margin-top: -3px;
          z-index: 2;
        }

        .avatar-body {
          width: 112px;
          height: 105px;
          background: #4779d8;
          border: 3px solid #27344a;
          border-radius: 25px 25px 12px 12px;
          position: relative;
          z-index: 2;
          margin-top: -2px;
        }

        .avatar-shirt {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 35px;
          height: 100%;
          background: #6190e6;
          opacity: 0.6;
        }

        .avatar-arm {
          position: absolute;
          width: 28px;
          height: 83px;
          background: #eebd91;
          border: 3px solid #27344a;
          border-radius: 20px;
          top: 12px;
          transform-origin: top center;
        }

        .left-arm {
          left: -21px;
          transform: rotate(10deg);
        }

        .right-arm {
          right: -21px;
          transform: rotate(-10deg);
        }

        .avatar-legs {
          display: flex;
          gap: 9px;
          margin-top: -2px;
          height: 95px;
        }

        .avatar-leg {
          width: 43px;
          height: 90px;
          background: #273c64;
          border: 3px solid #27344a;
          border-radius: 7px 7px 13px 13px;
          position: relative;
        }

        .avatar-leg::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: -5px;
          width: 52px;
          height: 17px;
          background: #28344a;
          border-radius: 12px 12px 5px 5px;
        }

        .avatar.jumping {
          animation: jump 0.7s ease-out;
        }

        @keyframes jump {
          0% { transform: translateY(0); }
          35% { transform: translateY(-145px); }
          65% { transform: translateY(-145px); }
          100% { transform: translateY(0); }
        }

        .avatar.sitting .avatar-character {
          transform: translateY(45px) scaleY(0.78);
        }

        .avatar.sitting .avatar-legs {
          transform: rotate(90deg) translate(15px, -18px);
        }

        .avatar.sitting .left-arm {
          transform: rotate(65deg);
        }

        .avatar.sitting .right-arm {
          transform: rotate(-65deg);
        }

        .avatar-shadow {
          display: none;
        }

        .movement-display {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 19px;
          border-radius: 30px;
          background: white;
          border: 1px solid #e1e7f1;
          box-shadow: 0 5px 18px #263a5a12;
          font-size: 13px;
          font-weight: 700;
          color: #315da8;
          white-space: nowrap;
        }

        .game-controls {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .main-button {
          border: 0;
          background: #2563eb;
          color: white;
          border-radius: 11px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .main-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .secondary-button {
          border: 1px solid #e2e7f0;
          background: white;
          color: #526078;
          border-radius: 11px;
          padding: 12px 15px;
          display: flex;
          gap: 8px;
          align-items: center;
          cursor: pointer;
        }

        .side {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .panel {
          padding: 20px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 18px;
        }

        .camera-preview {
          min-height: 165px;
          background: #101827;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aab4c7;
          font-size: 13px;
          position: relative;
        }

        .camera-preview canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .prediction-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          font-size: 13px;
        }

        .prediction-row strong {
          color: #2563eb;
        }

        .confidence-track {
          height: 8px;
          border-radius: 20px;
          background: #edf0f6;
          margin-top: 9px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 20px;
          transition: width 0.15s;
        }

        .movement-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .movement-item {
          border: 1px solid #edf0f5;
          border-radius: 11px;
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .movement-icon {
          width: 37px;
          height: 37px;
          border-radius: 10px;
          background: #eff4ff;
          display: grid;
          place-items: center;
          font-size: 19px;
        }

        .movement-item strong {
          display: block;
          font-size: 13px;
        }

        .movement-item small {
          color: #8791a4;
          font-size: 11px;
        }

        .error {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          background: #fff1f1;
          color: #b42318;
          font-size: 12px;
          line-height: 1.5;
          display: flex;
          gap: 8px;
        }

        .footer-note {
          color: #8993a6;
          text-align: center;
          font-size: 12px;
          margin-top: 22px;
        }

        @media (max-width: 850px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .side {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .page {
            padding: 14px;
          }

          .header {
            align-items: flex-start;
          }

          .brand h1 {
            font-size: 20px;
          }

          .side {
            display: flex;
          }

          .arena {
            min-height: 420px;
          }

          .game-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .game-controls button {
            width: 100%;
          }
        }
      `}</style>

      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-icon">
              <Brain size={25} />
            </div>
            <div>
              <h1>AI Motion Studio</h1>
              <p>Control an animated avatar with your gestures</p>
            </div>
          </div>

          <div className="status">
            <span className={`status-dot ${cameraStarted ? "active" : ""}`} />
            {cameraStarted ? "AI is watching" : "Camera disconnected"}
          </div>
        </header>

        <div className="layout">
          <section className="game-card">
            <div className="game-heading">
              <h2>Avatar Playground</h2>
              <span>AI-controlled movement</span>
            </div>

            <div className="arena">
              <div className="arena-label">YOUR AVATAR</div>

              <Avatar movement={movement} jumping={jumping} />

              <div className="movement-display">
                {movement === "jump" && "⬆ JUMPING"}
                {movement === "sit" && "🪑 SITTING"}
                {movement === "neutral" && "● STANDING"}
              </div>
            </div>

            <div className="game-controls">
              <button
                className="main-button"
                onClick={cameraStarted ? stopCamera : startCamera}
                disabled={loading}
              >
                {cameraStarted ? <Pause size={18} /> : <Play size={18} />}
                {loading
                  ? "Starting..."
                  : cameraStarted
                    ? "Stop AI Camera"
                    : "Start AI Camera"}
              </button>

              <button
                className="secondary-button"
                onClick={() => {
                  applyMovement("neutral");
                  setPrediction("NEUTRAL");
                  setConfidence(0);
                }}
              >
                <RefreshCw size={16} />
                Reset Avatar
              </button>
            </div>
          </section>

          <aside className="side">
            <section className="panel">
              <div className="panel-title">
                <Camera size={18} />
                AI Camera
              </div>

              <div className="camera-preview" ref={canvasRef}>
                {!cameraReady && (
                  <div className="camera-placeholder">
                    <Camera size={30} />
                    <span>Camera preview will appear here</span>
                  </div>
                )}
              </div>

              <div className="prediction-row">
                <span>Detected class</span>
                <strong>{prediction}</strong>
              </div>

              <div className="prediction-row">
                <span>Confidence</span>
                <strong>{confidence}%</strong>
              </div>

              <div className="confidence-track">
                <div
                  className="confidence-fill"
                  style={{ width: `${confidence}%` }}
                />
              </div>

              {error && (
                <div className="error">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-title">
                <Activity size={18} />
                Gesture Commands
              </div>

              <div className="movement-list">
                <div className="movement-item">
                  <div className="movement-icon">⬆️</div>
                  <div>
                    <strong>JUMP</strong>
                    <small>Avatar jumps and lands</small>
                  </div>
                </div>

                <div className="movement-item">
                  <div className="movement-icon">🪑</div>
                  <div>
                    <strong>SIT</strong>
                    <small>Avatar stays seated</small>
                  </div>
                </div>

                <div className="movement-item">
                  <div className="movement-icon">🧍</div>
                  <div>
                    <strong>NEUTRAL</strong>
                    <small>Avatar stands normally</small>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <p className="footer-note">
          <CheckCircle2
            size={13}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          Powered by Teachable Machine and real-time image recognition
        </p>
      </div>
    </main>
  );
}
