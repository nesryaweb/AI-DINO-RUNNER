
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as tmImage from "@teachablemachine/image";
import {
  Brain,
  Camera,
  Play,
  Pause,
  RefreshCw,
  Activity,
  Settings,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const SETTINGS_KEY = "ai-dino-settings";

function normalizeLabel(label) {
  return String(label || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

function getMovement(label) {
  const normalized = normalizeLabel(label);

  if (/^JUMP/.test(normalized)) return "JUMP";
  if (/^DUCK/.test(normalized)) return "SIT";
  if (/^NEUTRAL/.test(normalized)) return "NEUTRAL";

  return null;
}

function Avatar({ movement, jumping }) {
  const isSitting = movement === "SIT";

  return (
    <div className="avatar-scene">
      <div className={`character-wrap ${jumping ? "jumping" : ""} ${isSitting ? "sitting" : ""}`}>
        <svg
          className="character"
          viewBox="0 0 280 390"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Animated cartoon avatar"
        >
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD9B5" />
              <stop offset="100%" stopColor="#EBA879" />
            </linearGradient>

            <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8C70E8" />
              <stop offset="100%" stopColor="#6047C8" />
            </linearGradient>

            <linearGradient id="pants" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#354C78" />
              <stop offset="100%" stopColor="#223454" />
            </linearGradient>

            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#29395A" floodOpacity=".16" />
            </filter>
          </defs>

          {/* Back hair */}
          <path
            d="M83 80 C69 26 105 10 145 15 C196 13 218 48 207 105 L201 151 L81 145 Z"
            fill="#392A32"
          />

          {/* Neck */}
          <path
            d="M119 123 L160 123 L163 160 Q140 179 117 157 Z"
            fill="url(#skin)"
          />

          {/* Legs */}
          <g className="avatar-legs" filter="url(#softShadow)">
            <path
              d="M102 252 L143 252 L137 331 Q135 344 121 344 L98 341 Q91 337 94 324 Z"
              fill="url(#pants)"
              stroke="#26344F"
              strokeWidth="4"
            />
            <path
              d="M144 252 L183 252 L191 326 Q193 340 179 344 L155 345 Q145 342 146 330 Z"
              fill="url(#pants)"
              stroke="#26344F"
              strokeWidth="4"
            />

            {/* Shoes */}
            <path
              d="M96 326 Q78 327 76 345 Q76 355 91 356 L128 356 Q141 354 136 342 L128 330 Z"
              fill="#F8F5FF"
              stroke="#293852"
              strokeWidth="4"
            />
            <path
              d="M151 329 Q141 339 148 350 Q153 358 168 357 L204 353 Q215 350 207 337 Q202 328 190 330 Z"
              fill="#F8F5FF"
              stroke="#293852"
              strokeWidth="4"
            />
            <path d="M87 345 L126 345" stroke="#9A8CEB" strokeWidth="4" strokeLinecap="round" />
            <path d="M158 346 L201 343" stroke="#9A8CEB" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Body */}
          <g className="avatar-body" filter="url(#softShadow)">
            <path
              d="M100 153 Q116 143 140 146 Q166 143 183 157 L199 240 Q200 255 185 260 L94 260 Q79 256 83 240 Z"
              fill="url(#shirt)"
              stroke="#44357D"
              strokeWidth="4"
            />

            {/* Shirt collar */}
            <path
              d="M119 151 L140 170 L162 151 L153 143 L127 143 Z"
              fill="#F4EFFF"
              stroke="#5945A7"
              strokeWidth="3"
            />

            {/* Shirt detail */}
            <path
              d="M140 174 L140 245"
              stroke="#B7A6FF"
              strokeWidth="3"
              opacity=".65"
            />
            <circle cx="140" cy="192" r="3" fill="#F7F2FF" />
            <circle cx="140" cy="207" r="3" fill="#F7F2FF" />
          </g>

          {/* Arms */}
          <g className="avatar-arms">
            <g className="left-arm">
              <path
                d="M91 166 Q77 166 71 183 L52 230 Q47 243 59 250 Q72 256 80 241 L104 198 Q111 180 91 166"
                fill="url(#skin)"
                stroke="#B87555"
                strokeWidth="3"
              />
              <path
                d="M51 230 Q42 242 52 253 Q63 264 76 250 L82 239"
                fill="url(#skin)"
                stroke="#B87555"
                strokeWidth="3"
              />
            </g>

            <g className="right-arm">
              <path
                d="M188 166 Q203 166 209 183 L228 230 Q233 243 221 250 Q208 256 200 241 L176 198 Q169 180 188 166"
                fill="url(#skin)"
                stroke="#B87555"
                strokeWidth="3"
              />
              <path
                d="M229 230 Q238 242 228 253 Q217 264 204 250 L198 239"
                fill="url(#skin)"
                stroke="#B87555"
                strokeWidth="3"
              />
            </g>
          </g>

          {/* Face */}
          <g filter="url(#softShadow)">
            <path
              d="M83 75 Q80 35 140 35 Q201 35 198 83 L191 125 Q183 154 140 157 Q99 153 89 125 Z"
              fill="url(#skin)"
              stroke="#B87555"
              strokeWidth="3"
            />

            {/* Ears */}
            <ellipse cx="85" cy="102" rx="12" ry="19" fill="#F2BB96" />
            <ellipse cx="196" cy="102" rx="12" ry="19" fill="#F2BB96" />

            {/* Hair top */}
            <path
              d="M79 89 Q69 32 118 22 Q174 4 203 51 Q215 75 199 102 L189 81 Q177 91 165 76 Q146 92 128 72 Q110 96 91 91 L88 115 Q75 105 79 89"
              fill="#392A32"
            />

            {/* Hair strands */}
            <path
              d="M101 48 Q117 28 134 39 M140 33 Q165 26 181 48 M184 48 Q197 57 198 74"
              fill="none"
              stroke="#644451"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Eyebrows */}
            <path d="M106 91 Q119 84 130 91" fill="none" stroke="#51383A" strokeWidth="4" strokeLinecap="round" />
            <path d="M151 91 Q165 84 177 91" fill="none" stroke="#51383A" strokeWidth="4" strokeLinecap="round" />

            {/* Eyes */}
            <ellipse cx="119" cy="103" rx="5" ry="7" fill="#342B34" />
            <ellipse cx="164" cy="103" rx="5" ry="7" fill="#342B34" />
            <circle cx="121" cy="101" r="1.8" fill="white" />
            <circle cx="166" cy="101" r="1.8" fill="white" />

            {/* Cheeks */}
            <ellipse cx="103" cy="118" rx="10" ry="5" fill="#E98F91" opacity=".45" />
            <ellipse cx="180" cy="118" rx="10" ry="5" fill="#E98F91" opacity=".45" />

            {/* Smile */}
            <path
              d="M128 124 Q141 136 155 124"
              fill="none"
              stroke="#9B4F54"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Small hair accessory */}
          <g>
            <path d="M187 47 Q204 30 213 47 Q207 64 187 59 Z" fill="#F4B8D2" />
            <circle cx="201" cy="47" r="5" fill="#FFF1F8" />
          </g>
        </svg>
      </div>

      <div className="avatar-ground" />
      <div className="avatar-glow" />
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [movement, setMovement] = useState("NEUTRAL");
  const [jumping, setJumping] = useState(false);
  const [prediction, setPrediction] = useState("Waiting...");
  const [confidence, setConfidence] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const cameraContainerRef = useRef(null);
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const runningRef = useRef(false);
  const movementRef = useRef("NEUTRAL");
  const jumpingRef = useRef(false);
  const jumpTimerRef = useRef(null);
  const predictionFrameRef = useRef(null);
  const predictionBusyRef = useRef(false);
  const lastJumpRef = useRef(0);
  const confidenceRef = useRef(85);

  // Read the exact settings saved by your Settings page.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        confidenceRef.current = parsed.confidence ?? 85;
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error("Could not read AI settings:", err);
      setError("Could not read your saved AI settings.");
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const applyMovement = useCallback((nextMovement) => {
    if (!nextMovement) return;

    // Only react when the detected command changes.
    if (nextMovement === movementRef.current) return;

    movementRef.current = nextMovement;
    setMovement(nextMovement);

    if (nextMovement === "JUMP") {
      const now = Date.now();

      // Avoid accidental repeated jumps.
      if (now - lastJumpRef.current < 700) return;

      lastJumpRef.current = now;
      jumpingRef.current = true;
      setJumping(true);

      if (jumpTimerRef.current) {
        clearTimeout(jumpTimerRef.current);
      }

      jumpTimerRef.current = setTimeout(() => {
        jumpingRef.current = false;
        setJumping(false);
      }, 750);
    } else {
      jumpingRef.current = false;
      setJumping(false);

      if (jumpTimerRef.current) {
        clearTimeout(jumpTimerRef.current);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    runningRef.current = false;

    if (predictionFrameRef.current) {
      cancelAnimationFrame(predictionFrameRef.current);
      predictionFrameRef.current = null;
    }

    if (jumpTimerRef.current) {
      clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = null;
    }

    if (webcamRef.current) {
      try {
        webcamRef.current.stop();
      } catch (err) {
        console.warn("Camera stop:", err);
      }

      webcamRef.current = null;
    }

    if (cameraContainerRef.current) {
      cameraContainerRef.current.innerHTML = "";
    }

    jumpingRef.current = false;
    predictionBusyRef.current = false;
    movementRef.current = "NEUTRAL";

    setCameraStarted(false);
    setCameraReady(false);
    setJumping(false);
    setMovement("NEUTRAL");
    setPrediction("Camera stopped");
    setConfidence(0);
  }, []);

  const predictionLoop = useCallback(async () => {
    if (
      !runningRef.current ||
      !modelRef.current ||
      !webcamRef.current ||
      predictionBusyRef.current
    ) {
      if (runningRef.current) {
        predictionFrameRef.current = requestAnimationFrame(predictionLoop);
      }
      return;
    }

    predictionBusyRef.current = true;

    try {
      webcamRef.current.update();

      const predictions = await modelRef.current.predict(
        webcamRef.current.canvas
      );

      if (!runningRef.current) return;

      const best = predictions.reduce((highest, current) =>
        current.probability > highest.probability
          ? current
          : highest
      );

      const percent = Math.round(best.probability * 100);
      setPrediction(best.className);
      setConfidence(percent);

      const detectedMovement = getMovement(best.className);
      const threshold = confidenceRef.current / 100;

      if (
        detectedMovement &&
        best.probability >= threshold
      ) {
        applyMovement(detectedMovement);
      }
    } catch (err) {
      console.error("AI prediction error:", err);
    } finally {
      predictionBusyRef.current = false;
    }

    if (runningRef.current) {
      predictionFrameRef.current = requestAnimationFrame(predictionLoop);
    }
  }, [applyMovement]);

  const startCamera = async () => {
    setError("");

    if (!settingsLoaded) {
      setError("Your settings are still loading. Please wait.");
      return;
    }

    if (!settings?.modelUrl) {
      setError(
        "No AI model URL has been saved. Open Settings, enter your Teachable Machine URL, test it, and save it first."
      );
      return;
    }

    if (!settings.classes?.length) {
      setError(
        "Your saved model has no class information. Please test and save your model again in Settings."
      );
      return;
    }

    const cleanUrl = settings.modelUrl.trim().replace(/\/+$/, "");

    setLoading(true);

    try {
      // Load the saved model.
      const loadedModel = await tmImage.load(
        `${cleanUrl}/model.json`,
        `${cleanUrl}/metadata.json`
      );

      // Confirm that the model still has the saved classes.
      const actualClasses = loadedModel.getClassLabels();

      if (!actualClasses || actualClasses.length === 0) {
        throw new Error("Your AI model has no classes.");
      }

      const requiredMovements = ["JUMP", "DUCK", "NEUTRAL"];

      const missing = requiredMovements.filter((required) =>
        !actualClasses.some(
          (label) => getMovement(label) === (required === "DUCK" ? "SIT" : required)
        )
      );

      if (missing.length > 0) {
        throw new Error(
          `Your model is missing these movement groups: ${missing.join(", ")}. Check your Settings page.`
        );
      }

      modelRef.current = loadedModel;
      setModelReady(true);

      // Start webcam.
      const webcam = new tmImage.Webcam(480, 360, true);
      await webcam.setup();
      await webcam.play();

      webcamRef.current = webcam;

      if (cameraContainerRef.current) {
        cameraContainerRef.current.innerHTML = "";
        cameraContainerRef.current.appendChild(webcam.canvas);
      }

      runningRef.current = true;
      movementRef.current = "NEUTRAL";

      setMovement("NEUTRAL");
      setCameraStarted(true);
      setCameraReady(true);
      setPrediction("Recognizing...");
      setConfidence(0);

      predictionFrameRef.current = requestAnimationFrame(predictionLoop);
    } catch (err) {
      console.error("Could not start AI:", err);

      setError(
        err.message ||
          "Could not load the AI model or start the camera. Check your settings and camera permission."
      );

      stopCamera();
    } finally {
      setLoading(false);
    }
  };

  const resetAvatar = () => {
    movementRef.current = "NEUTRAL";
    jumpingRef.current = false;

    if (jumpTimerRef.current) {
      clearTimeout(jumpTimerRef.current);
    }

    setMovement("NEUTRAL");
    setJumping(false);
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;

      if (predictionFrameRef.current) {
        cancelAnimationFrame(predictionFrameRef.current);
      }

      if (jumpTimerRef.current) {
        clearTimeout(jumpTimerRef.current);
      }

      if (webcamRef.current) {
        try {
          webcamRef.current.stop();
        } catch (err) {
          console.warn(err);
        }
      }
    };
  }, []);

  return (
    <main className="motion-page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f7f6fc;
          color: #29263b;
          font-family: Arial, Helvetica, sans-serif;
        }

        button {
          font: inherit;
        }

        .motion-page {
          min-height: 100vh;
          padding: 25px;
          background:
            radial-gradient(circle at 10% 10%, #f0eaff 0, transparent 30%),
            radial-gradient(circle at 90% 80%, #eaf1ff 0, transparent 32%),
            #f8f7fc;
        }

        .motion-container {
          max-width: 1320px;
          margin: auto;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #29263b;
        }

        .brand-mark {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(145deg, #9a7de8, #6653c7);
          border-radius: 15px;
          box-shadow: 0 7px 18px #7862d333;
        }

        .brand-title {
          font-size: 19px;
          font-weight: 850;
          letter-spacing: 1.2px;
        }

        .brand-subtitle {
          font-size: 11px;
          color: #9993ac;
          margin-top: 4px;
          letter-spacing: 1.3px;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #ebe8f3;
          border-radius: 30px;
          padding: 10px 14px;
          color: #706b80;
          font-size: 12px;
          font-weight: 700;
        }

        .connection-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #b7b4c2;
        }

        .connection-dot.connected {
          background: #36b77a;
          box-shadow: 0 0 0 4px #36b77a20;
        }

        .settings-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6c5ac4;
          background: white;
          border: 1px solid #e9e4f5;
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .intro {
          margin-bottom: 22px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #806bd0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .intro h1 {
          font-size: clamp(25px, 4vw, 34px);
          margin: 0;
          letter-spacing: -1px;
        }

        .intro p {
          margin: 8px 0 0;
          color: #89849c;
          font-size: 14px;
          line-height: 1.6;
        }

        .main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 20px;
          align-items: start;
        }

        .playground,
        .side-panel {
          background: white;
          border: 1px solid #ebe8f3;
          border-radius: 21px;
          box-shadow: 0 8px 30px #51437a08;
          overflow: hidden;
        }

        .playground-heading {
          padding: 20px 23px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #f0edf6;
        }

        .playground-heading h2 {
          margin: 0;
          font-size: 16px;
        }

        .playground-heading span {
          color: #aaa5b7;
          font-size: 11px;
        }

        .arena {
          min-height: 520px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 72%, #e7e1fa 0, transparent 37%),
            linear-gradient(180deg, #fbfaff, #f0edfc);
        }

        .arena::before,
        .arena::after {
          content: "";
          position: absolute;
          border: 1px solid #e7e1f6;
          border-radius: 50%;
          pointer-events: none;
        }

        .arena::before {
          width: 440px;
          height: 440px;
          top: -300px;
        }

        .arena::after {
          width: 600px;
          height: 600px;
          top: -380px;
        }

        .arena-caption {
          position: absolute;
          top: 22px;
          left: 24px;
          z-index: 2;
          font-size: 10px;
          color: #a19bb2;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .sparkle {
          position: absolute;
          color: #b2a2e8;
          font-size: 24px;
          opacity: .7;
        }

        .sparkle.one {
          top: 23%;
          left: 23%;
        }

        .sparkle.two {
          top: 34%;
          right: 22%;
          font-size: 17px;
        }

        .sparkle.three {
          bottom: 25%;
          left: 28%;
          font-size: 16px;
        }

        .avatar-scene {
          position: relative;
          z-index: 2;
          width: 330px;
          height: 420px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .character-wrap {
          position: absolute;
          width: 280px;
          height: 390px;
          bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center bottom;
          transition: transform .25s ease;
          z-index: 2;
        }

        .character {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .avatar-ground {
          position: absolute;
          width: 230px;
          height: 26px;
          bottom: 18px;
          background: #d4c9ed;
          border-radius: 50%;
          filter: blur(2px);
          opacity: .75;
        }

        .avatar-glow {
          position: absolute;
          width: 280px;
          height: 130px;
          bottom: -10px;
          background: radial-gradient(ellipse, #bca9eb30, transparent 70%);
        }

        .character-wrap.jumping {
          animation: avatarJump .75s cubic-bezier(.25,.8,.35,1);
        }

        @keyframes avatarJump {
          0% { transform: translateY(0) rotate(0); }
          28% { transform: translateY(-155px) rotate(-5deg); }
          48% { transform: translateY(-165px) rotate(3deg); }
          70% { transform: translateY(-120px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0); }
        }

        .character-wrap.sitting {
          transform: translateY(47px) scale(.92,.84);
        }

        .character-wrap.sitting .avatar-legs {
          transform: translateY(-6px) rotate(-1deg);
          transform-origin: 50% 0%;
        }

        .character-wrap.sitting .left-arm {
          transform: rotate(-25deg);
          transform-origin: 90% 10%;
        }

        .character-wrap.sitting .right-arm {
          transform: rotate(25deg);
          transform-origin: 10% 10%;
        }

        .character-wrap.sitting .avatar-body {
          transform: translateY(12px);
          transform-origin: center top;
        }

        .avatar-legs,
        .avatar-body,
        .left-arm,
        .right-arm {
          transition: transform .3s ease;
        }

        .movement-pill {
          position: absolute;
          z-index: 5;
          bottom: 17px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 17px;
          background: #fff;
          border: 1px solid #e8e3f3;
          border-radius: 30px;
          box-shadow: 0 6px 20px #4c3d7712;
          color: #715dc2;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .movement-pill-dot {
          width: 8px;
          height: 8px;
          background: #8a75db;
          border-radius: 50%;
        }

        .playground-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px;
        }

        .primary-button,
        .reset-button {
          border: 0;
          border-radius: 12px;
          padding: 13px 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .15s, opacity .15s;
        }

        .primary-button {
          color: white;
          background: linear-gradient(135deg, #8e76dc, #6955c7);
          box-shadow: 0 6px 15px #7962ce30;
        }

        .reset-button {
          background: #f3f0fb;
          color: #7464b7;
        }

        .primary-button:hover,
        .reset-button:hover {
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .side-column {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .side-panel {
          padding: 19px;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 800;
        }

        .panel-heading svg {
          color: #826bd0;
        }

        .camera-preview {
          min-height: 190px;
          border-radius: 13px;
          background: #211e32;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .camera-preview canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .camera-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #b4adc9;
          font-size: 12px;
          padding: 20px;
          text-align: center;
        }

        .camera-empty svg {
          color: #9d8bda;
        }

        .prediction-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 17px;
          font-size: 12px;
        }

        .prediction-info span {
          color: #9993a8;
        }

        .prediction-info strong {
          color: #6956c3;
          max-width: 60%;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .confidence-bar {
          height: 8px;
          border-radius: 20px;
          background: #efedf5;
          overflow: hidden;
          margin-top: 9px;
        }

        .confidence-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #b19ce9, #745dcf);
          transition: width .15s ease;
        }

        .confidence-caption {
          margin-top: 7px;
          display: flex;
          justify-content: space-between;
          color: #aaa4b5;
          font-size: 10px;
        }

        .command-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .command {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #f0edf6;
          border-radius: 12px;
          padding: 11px;
        }

        .command-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 20px;
          background: #f1edff;
        }

        .command strong {
          display: block;
          font-size: 12px;
          color: #514b68;
        }

        .command small {
          display: block;
          margin-top: 4px;
          color: #a29caf;
          font-size: 10px;
        }

        .error-message {
          display: flex;
          gap: 9px;
          align-items: flex-start;
          margin-top: 14px;
          padding: 12px;
          background: #fff0f1;
          color: #ad3f51;
          border: 1px solid #f8d9de;
          border-radius: 11px;
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .settings-reminder {
          margin-top: 13px;
          color: #9a94a9;
          font-size: 11px;
          line-height: 1.6;
        }

        .footer {
          margin: 22px 0 4px;
          text-align: center;
          color: #aaa4b6;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        @media (max-width: 900px) {
          .main-layout {
            grid-template-columns: 1fr;
          }

          .side-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .motion-page {
            padding: 14px;
          }

          .topbar {
            align-items: flex-start;
          }

          .brand-title {
            font-size: 15px;
          }

          .brand-subtitle {
            font-size: 9px;
          }

          .top-actions {
            flex-direction: column;
            align-items: flex-end;
          }

          .connection-status,
          .settings-link {
            padding: 8px 10px;
            font-size: 10px;
          }

          .side-column {
            display: flex;
          }

          .arena {
            min-height: 460px;
          }

          .avatar-scene {
            transform: scale(.9);
          }

          .playground-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .playground-controls button {
            width: 100%;
          }
        }
      `}</style>

      <div className="motion-container">
        <header className="topbar">
          <Link href="/" className="brand">
            <div className="brand-mark">
              <Brain size={25} />
            </div>
            <div>
              <div className="brand-title">AI MOTION STUDIO</div>
              <div className="brand-subtitle">GESTURE CONTROL LAB</div>
            </div>
          </Link>

          <div className="top-actions">
            <div className="connection-status">
              <span className={`connection-dot ${cameraStarted ? "connected" : ""}`} />
              {cameraStarted ? "AI CONNECTED" : "AI NOT CONNECTED"}
            </div>

            <Link href="/settings" className="settings-link">
              <Settings size={15} />
              Settings
            </Link>
          </div>
        </header>

        <section className="intro">
          <div className="eyebrow">
            <Sparkles size={14} />
            INTERACTIVE AI EXPERIENCE
          </div>

          <h1>Move your avatar with AI.</h1>

          <p>
            Show your trained gestures to the camera and watch your avatar
            jump, sit, and stand.
          </p>
        </section>

        <div className="main-layout">
          <section className="playground">
            <div className="playground-heading">
              <h2>Avatar Playground</h2>
              <span>LIVE CHARACTER ANIMATION</span>
            </div>

            <div className="arena">
              <div className="arena-caption">YOUR AI AVATAR</div>

              <span className="sparkle one">✦</span>
              <span className="sparkle two">✧</span>
              <span className="sparkle three">✦</span>

              <Avatar movement={movement} jumping={jumping} />

              <div className="movement-pill">
                <span className="movement-pill-dot" />
                {jumping
                  ? "JUMPING!"
                  : movement === "SIT"
                    ? "SITTING"
                    : "STANDING"}
              </div>
            </div>

            <div className="playground-controls">
              <button
                className="primary-button"
                onClick={cameraStarted ? stopCamera : startCamera}
                disabled={loading || !settingsLoaded}
              >
                {cameraStarted ? <Pause size={17} /> : <Play size={17} />}
                {loading
                  ? "CONNECTING..."
                  : cameraStarted
                    ? "STOP AI CAMERA"
                    : "START AI CAMERA"}
              </button>

              <button className="reset-button" onClick={resetAvatar}>
                <RefreshCw size={16} />
                RESET AVATAR
              </button>
            </div>
          </section>

          <aside className="side-column">
            <section className="side-panel">
              <div className="panel-heading">
                <Camera size={18} />
                AI CAMERA
              </div>

              <div className="camera-preview" ref={cameraContainerRef}>
                {!cameraReady && (
                  <div className="camera-empty">
                    <Camera size={32} />
                    <span>Your camera preview will appear here.</span>
                  </div>
                )}
              </div>

              <div className="prediction-info">
                <span>Detected class</span>
                <strong>{prediction}</strong>
              </div>

              <div className="prediction-info">
                <span>Confidence</span>
                <strong>{confidence}%</strong>
              </div>

              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${confidence}%` }}
                />
              </div>

              <div className="confidence-caption">
                <span>0%</span>
                <span>
                  Required: {settings?.confidence ?? 85}%
                </span>
                <span>100%</span>
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={17} />
                  <span>{error}</span>
                </div>
              )}

              {settingsLoaded && !settings?.modelUrl && (
                <p className="settings-reminder">
                  No saved model found. Visit Settings to connect your
                  Teachable Machine model.
                </p>
              )}

              {settings?.modelUrl && (
                <p className="settings-reminder">
                  Saved AI model detected. Your saved confidence setting
                  will be used automatically.
                </p>
              )}
            </section>

            <section className="side-panel">
              <div className="panel-heading">
                <Activity size={18} />
                GESTURE COMMANDS
              </div>

              <div className="command-list">
                <div className="command">
                  <div className="command-icon">⬆️</div>
                  <div>
                    <strong>JUMP</strong>
                    <small>Jump up and land automatically</small>
                  </div>
                </div>

                <div className="command">
                  <div className="command-icon">🪑</div>
                  <div>
                    <strong>SIT</strong>
                    <small>DUCK classes make the avatar sit</small>
                  </div>
                </div>

                <div className="command">
                  <div className="command-icon">🧍</div>
                  <div>
                    <strong>NEUTRAL</strong>
                    <small>Stand in the normal position</small>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer className="footer">
          AI MOTION STUDIO · POWERED BY TEACHABLE MACHINE
        </footer>
      </div>
    </main>
  );
}
