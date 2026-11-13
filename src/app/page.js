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
      <div
        className={`character-wrap ${jumping ? "jumping" : ""} ${
          isSitting ? "sitting" : ""
        }`}
      >
        <svg
          className="character"
          viewBox="0 0 300 420"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Cute animated cartoon girl avatar"
        >
          <defs>
            <linearGradient id="avatarSkin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE0C5" />
              <stop offset="100%" stopColor="#EBA982" />
            </linearGradient>

            <linearGradient id="avatarHair" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#49313A" />
              <stop offset="55%" stopColor="#2D202B" />
              <stop offset="100%" stopColor="#201923" />
            </linearGradient>

            <linearGradient id="avatarTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B69AF4" />
              <stop offset="100%" stopColor="#785BD0" />
            </linearGradient>

            <linearGradient id="avatarSleeves" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A88BEA" />
              <stop offset="100%" stopColor="#6D54C0" />
            </linearGradient>

            <linearGradient id="avatarJeans" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#526D9B" />
              <stop offset="100%" stopColor="#30476F" />
            </linearGradient>

            <linearGradient id="avatarShoes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E8E4F5" />
            </linearGradient>

            <filter
              id="avatarShadow"
              x="-40%"
              y="-30%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="5"
                floodColor="#33264D"
                floodOpacity=".16"
              />
            </filter>
          </defs>

          {/* Hair behind the body */}
          <path
            d="M77 91 C61 37 93 13 145 14 C205 13 232 54 218 119
               L214 218 Q207 253 185 263 L89 249 Q67 225 72 174 Z"
            fill="url(#avatarHair)"
          />

          <path
            d="M88 126 Q66 170 83 233 M207 117 Q231 167 207 236"
            fill="none"
            stroke="#60414C"
            strokeWidth="8"
            strokeLinecap="round"
            opacity=".7"
          />

          {/* Neck */}
          <path
            d="M124 132 L176 132 L174 170 Q150 188 126 169 Z"
            fill="url(#avatarSkin)"
          />

          {/* Legs and sneakers */}
          <g className="avatar-legs" filter="url(#avatarShadow)">
            <path
              d="M105 254 L148 254 L143 333 Q141 349 127 351 L105 349 Q94 346 97 331 Z"
              fill="url(#avatarJeans)"
              stroke="#293D61"
              strokeWidth="3"
            />

            <path
              d="M151 254 L192 254 L202 329 Q205 345 190 350 L166 352 Q153 350 153 335 Z"
              fill="url(#avatarJeans)"
              stroke="#293D61"
              strokeWidth="3"
            />

            <path
              d="M101 320 L141 320 M155 320 L198 320"
              stroke="#7890B6"
              strokeWidth="3"
              opacity=".7"
            />

            <path
              d="M100 337 Q82 335 76 350 Q72 364 91 367 L130 367 Q145 365 139 351 L130 339 Z"
              fill="url(#avatarShoes)"
              stroke="#394766"
              strokeWidth="3"
            />

            <path
              d="M160 339 Q148 347 154 360 Q159 370 176 369 L211 365 Q224 361 214 348 Q207 337 194 339 Z"
              fill="url(#avatarShoes)"
              stroke="#394766"
              strokeWidth="3"
            />

            <path
              d="M84 355 L132 355 M164 357 L211 354"
              stroke="#A78CE8"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M103 345 L121 350 M178 347 L194 344"
              stroke="#8B78C9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Arms */}
          <g className="avatar-arms">
            <g className="left-arm">
              <path
                d="M105 171 Q88 164 79 181 L55 229 Q49 244 61 252 Q74 260 84 243 L113 199"
                fill="url(#avatarSleeves)"
                stroke="#7055BC"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M57 237 Q47 247 55 258 Q65 269 78 255 L85 243"
                fill="url(#avatarSkin)"
                stroke="#C48665"
                strokeWidth="2.5"
              />
            </g>

            <g className="right-arm">
              <path
                d="M195 171 Q212 164 221 181 L245 229 Q251 244 239 252 Q226 260 216 243 L187 199"
                fill="url(#avatarSleeves)"
                stroke="#7055BC"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              <path
                d="M243 237 Q253 247 245 258 Q235 269 222 255 L215 243"
                fill="url(#avatarSkin)"
                stroke="#C48665"
                strokeWidth="2.5"
              />
            </g>
          </g>

          {/* Hoodie body */}
          <g className="avatar-body" filter="url(#avatarShadow)">
            <path
              d="M105 155 Q124 143 150 147 Q178 143 196 158
                 L211 244 Q212 260 195 265 L105 265 Q88 260 89 244 Z"
              fill="url(#avatarTop)"
              stroke="#644BAE"
              strokeWidth="3.5"
            />

            <path
              d="M119 151 Q150 181 181 151 L174 142 Q150 158 126 142 Z"
              fill="#E9DFFF"
            />

            <path
              d="M150 176 L150 251"
              stroke="#D5C5FF"
              strokeWidth="2.5"
              opacity=".65"
            />

            <path
              d="M128 190 Q150 202 172 190"
              fill="none"
              stroke="#D9CBFF"
              strokeWidth="2"
              opacity=".7"
            />

            <circle cx="150" cy="210" r="3" fill="#F8F2FF" />
            <circle cx="150" cy="226" r="3" fill="#F8F2FF" />

            <path
              d="M108 247 Q150 255 192 247"
              fill="none"
              stroke="#C9B6FF"
              strokeWidth="2"
              opacity=".6"
            />
          </g>

          {/* Face */}
          <g filter="url(#avatarShadow)">
            <ellipse cx="83" cy="108" rx="12" ry="18" fill="#EFB38F" />
            <ellipse cx="217" cy="108" rx="12" ry="18" fill="#EFB38F" />

            <path
              d="M91 77 Q91 37 150 36 Q209 37 209 80
                 L203 128 Q195 162 150 165 Q105 162 97 128 Z"
              fill="url(#avatarSkin)"
              stroke="#C48665"
              strokeWidth="2.5"
            />

            {/* Hair fringe */}
            <path
              d="M84 99 Q73 48 111 26 Q151 3 190 24
                 Q224 42 216 94 L204 106 Q198 83 181 72
                 Q163 91 143 76 Q122 96 104 83 L94 112 Z"
              fill="url(#avatarHair)"
            />

            <path
              d="M102 49 Q119 27 141 31 M153 27 Q184 25 199 51"
              fill="none"
              stroke="#75515C"
              strokeWidth="5"
              strokeLinecap="round"
              opacity=".7"
            />

            {/* Brows */}
            <path
              d="M111 99 Q125 91 138 99 M163 99 Q176 91 190 99"
              fill="none"
              stroke="#553943"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Eyes */}
            <ellipse cx="126" cy="111" rx="7" ry="9" fill="#332A35" />
            <ellipse cx="176" cy="111" rx="7" ry="9" fill="#332A35" />

            <circle cx="128" cy="108" r="2.5" fill="#FFFFFF" />
            <circle cx="178" cy="108" r="2.5" fill="#FFFFFF" />

            <path
              d="M116 122 Q126 126 136 122 M166 122 Q176 126 186 122"
              fill="none"
              stroke="#D28B83"
              strokeWidth="2"
              opacity=".55"
            />

            {/* Blush and smile */}
            <ellipse
              cx="108"
              cy="132"
              rx="11"
              ry="6"
              fill="#E98D9A"
              opacity=".38"
            />

            <ellipse
              cx="192"
              cy="132"
              rx="11"
              ry="6"
              fill="#E98D9A"
              opacity=".38"
            />

            <path
              d="M139 139 Q150 151 162 139"
              fill="none"
              stroke="#A95761"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Hair side locks */}
            <path
              d="M91 91 Q78 145 92 194 Q99 215 108 221"
              fill="none"
              stroke="#30212C"
              strokeWidth="13"
              strokeLinecap="round"
            />

            <path
              d="M209 91 Q222 145 208 194 Q201 215 192 221"
              fill="none"
              stroke="#30212C"
              strokeWidth="13"
              strokeLinecap="round"
            />

            {/* Hair clip */}
            <path
              d="M194 48 Q209 32 220 46 Q214 62 196 62 Z"
              fill="#F5B8D1"
              stroke="#D98EAF"
              strokeWidth="2"
            />

            <circle cx="207" cy="49" r="4" fill="#FFF4FA" />

            {/* Earrings */}
            <circle cx="83" cy="128" r="3.5" fill="#F7D88B" />
            <circle cx="217" cy="128" r="3.5" fill="#F7D88B" />
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
          0% {
            transform: translateY(0) rotate(0);
          }

          28% {
            transform: translateY(-155px) rotate(-5deg);
          }

          48% {
            transform: translateY(-165px) rotate(3deg);
          }

          70% {
            transform: translateY(-120px) rotate(-2deg);
          }

          100% {
            transform: translateY(0) rotate(0);
          }
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
              <span
                className={`connection-dot ${
                  cameraStarted ? "connected" : ""
                }`}
              />

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
                <span>Required: {settings?.confidence ?? 85}%</span>
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