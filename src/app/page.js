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

  const videoRef = useRef(null);
  const streamRef = useRef(null);
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

    // Stop every track in the active camera stream.
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
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
      !videoRef.current ||
      videoRef.current.readyState < 2 ||
      predictionBusyRef.current
    ) {
      if (runningRef.current) {
        predictionFrameRef.current = requestAnimationFrame(predictionLoop);
      }
      return;
    }

    predictionBusyRef.current = true;

    try {
      // Predict directly from the live video element.
      const predictions = await modelRef.current.predict(videoRef.current);

      if (!runningRef.current) return;

      const best = predictions.reduce((highest, current) =>
        current.probability > highest.probability ? current : highest
      );

      const percent = Math.round(best.probability * 100);
      setPrediction(best.className);
      setConfidence(percent);

      const detectedMovement = getMovement(best.className);
      const threshold = confidenceRef.current / 100;

      if (detectedMovement && best.probability >= threshold) {
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Your browser does not support camera access. Open this website in a supported browser using localhost or HTTPS."
      );
      return;
    }

    const cleanUrl = settings.modelUrl.trim().replace(/\/+$/, "");

    setLoading(true);
    setModelReady(false);

    try {
      // Load the saved Teachable Machine model.
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
          (label) =>
            getMovement(label) ===
            (required === "DUCK" ? "SIT" : required)
        )
      );

      if (missing.length > 0) {
        throw new Error(
          `Your model is missing these movement groups: ${missing.join(
            ", "
          )}. Check your Settings page.`
        );
      }

      modelRef.current = loadedModel;
      setModelReady(true);

      // Request temporary access first so the browser reveals camera names.
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      permissionStream.getTracks().forEach((track) => track.stop());

      // Find DroidCam by its device label.
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      console.log(
        "Available cameras:",
        videoDevices.map((device) => ({
          label: device.label,
          deviceId: device.deviceId,
        }))
      );

      if (!videoDevices.length) {
        throw new Error(
          "No camera was found. Make sure DroidCam is running and connected."
        );
      }

      const droidCam = videoDevices.find((device) =>
        device.label.toLowerCase().includes("droidcam")
      );

      // Use DroidCam when found; otherwise use the first available camera.
      const selectedCamera = droidCam || videoDevices[0];

      console.log("Selected camera:", selectedCamera.label);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera.deviceId },
          width: { ideal: 480 },
          height: { ideal: 360 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("The camera preview element could not be found.");
      }

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      await videoRef.current.play();

      // Wait until the video has actual dimensions before starting predictions.
      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          const timeout = setTimeout(() => {
            reject(new Error("The camera opened but no video frames arrived."));
          }, 10000);

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
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
          "Could not load the AI model or start the camera. Check your settings and camera connection."
      );

      stopCamera();
    } finally {
      setLoading(false);
    }
  };

  const resetAvatar = () => {
    if (jumpTimerRef.current) {
      clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = null;
    }

    jumpingRef.current = false;
    movementRef.current = "NEUTRAL";

    setJumping(false);
    setMovement("NEUTRAL");
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

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
          background: #f8f6fc;
          color: #30283e;
          font-family: Arial, Helvetica, sans-serif;
        }

        button {
          font: inherit;
        }

        .page {
          min-height: 100vh;
          padding: 30px 20px;
          background:
            radial-gradient(circle at 10% 10%, #eee7ff 0, transparent 30%),
            radial-gradient(circle at 90% 90%, #f9e9f1 0, transparent 30%),
            #f8f6fc;
        }

        .app-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 48px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          color: white;
          background: linear-gradient(135deg, #a98ae9, #785bd0);
          box-shadow: 0 7px 18px #9b80dc44;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #81788f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .connection-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c5bdcf;
        }

        .connection-dot.connected {
          background: #45bd88;
          box-shadow: 0 0 0 4px #45bd8822;
        }

        .settings-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border: 1px solid #e9e2f2;
          border-radius: 12px;
          background: white;
          color: #66548c;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: 0.2s;
        }

        .settings-link:hover {
          border-color: #b9a4e8;
          transform: translateY(-1px);
        }

        .intro {
          margin-bottom: 32px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
          color: #9274d0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .intro h1 {
          margin: 0 0 12px;
          color: #30283e;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 850;
          letter-spacing: -2px;
        }

        .intro p {
          max-width: 620px;
          margin: 0;
          color: #82798e;
          font-size: 15px;
          line-height: 1.7;
        }

        .main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.8fr);
          gap: 22px;
          align-items: start;
        }

        .playground,
        .side-panel {
          border: 1px solid #ece6f4;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 12px 35px #47365d0b;
        }

        .playground {
          padding: 24px;
        }

        .playground-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .playground-heading h2 {
          margin: 0;
          color: #382d4a;
          font-size: 19px;
          font-weight: 800;
        }

        .playground-heading span {
          color: #a49aad;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .arena {
          position: relative;
          display: flex;
          min-height: 490px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #e8e0f5;
          border-radius: 18px;
          background:
            radial-gradient(ellipse at 50% 70%, #e8defb 0, transparent 43%),
            linear-gradient(145deg, #fbf9ff, #f0eafb);
        }

        .arena::before {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#b9a6df 1px, transparent 1px);
          background-size: 22px 22px;
          content: "";
          opacity: 0.22;
        }

        .arena-caption {
          position: absolute;
          top: 20px;
          left: 22px;
          color: #a393bd;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .sparkle {
          position: absolute;
          z-index: 1;
          color: #b99ce9;
          animation: sparkle 2.5s ease-in-out infinite;
        }

        .sparkle.one {
          top: 23%;
          left: 18%;
          font-size: 22px;
        }

        .sparkle.two {
          top: 39%;
          right: 17%;
          font-size: 28px;
          animation-delay: 0.7s;
        }

        .sparkle.three {
          right: 24%;
          bottom: 20%;
          font-size: 18px;
          animation-delay: 1.2s;
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(25deg);
          }
        }

        .avatar-scene {
          position: relative;
          z-index: 2;
          display: flex;
          width: 100%;
          height: 430px;
          align-items: center;
          justify-content: center;
        }

        .character-wrap {
          position: relative;
          z-index: 2;
          width: 275px;
          height: 390px;
          transform-origin: center bottom;
          transition: transform 0.25s ease;
        }

        .character {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .character-wrap.jumping {
          animation: avatarJump 0.75s ease;
        }

        @keyframes avatarJump {
          0% {
            transform: translateY(0) rotate(0);
          }
          35% {
            transform: translateY(-115px) rotate(-4deg);
          }
          65% {
            transform: translateY(-115px) rotate(4deg);
          }
          100% {
            transform: translateY(0) rotate(0);
          }
        }

        .character-wrap.sitting {
          transform: scaleY(0.78) translateY(55px);
        }

        .avatar-ground {
          position: absolute;
          bottom: 23px;
          width: 210px;
          height: 22px;
          border-radius: 50%;
          background: #a58bcf33;
          filter: blur(7px);
        }

        .avatar-glow {
          position: absolute;
          bottom: 32px;
          width: 240px;
          height: 80px;
          border-radius: 50%;
          background: #bba3ed22;
          filter: blur(25px);
        }

        .movement-pill {
          position: absolute;
          bottom: 16px;
          left: 50%;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          border: 1px solid #e6def2;
          border-radius: 30px;
          background: #ffffffdf;
          color: #68538e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          transform: translateX(-50%);
          box-shadow: 0 5px 15px #46365d0d;
        }

        .movement-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8d71d1;
        }

        .playground-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
        }

        .primary-button,
        .reset-button {
          display: inline-flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.5px;
          transition: 0.2s;
        }

        .primary-button {
          flex: 1;
          color: white;
          background: linear-gradient(135deg, #a98ae9, #785bd0);
          box-shadow: 0 7px 18px #8b6bd044;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px #8b6bd055;
        }

        .primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .reset-button {
          color: #77658e;
          background: #f3eff9;
        }

        .reset-button:hover {
          background: #ebe4f5;
        }

        .side-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .side-panel {
          padding: 20px;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 17px;
          color: #55446f;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .panel-heading :global(svg) {
          color: #9679d3;
        }

        .camera-preview {
          position: relative;
          display: flex;
          width: 100%;
          aspect-ratio: 4 / 3;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #e8e1f0;
          border-radius: 14px;
          background: #f3f0f7;
        }

        .camera-preview video {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .camera-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          color: #a69bb5;
          text-align: center;
        }

        .camera-empty span {
          max-width: 180px;
          font-size: 11px;
          line-height: 1.5;
        }

        .prediction-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f0ecf4;
        }

        .prediction-info:last-child {
          border-bottom: 0;
        }

        .prediction-info span {
          color: #9a91a5;
          font-size: 11px;
        }

        .prediction-info strong {
          max-width: 60%;
          overflow: hidden;
          color: #594774;
          font-size: 12px;
          text-align: right;
          text-overflow: ellipsis;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 15px;
          padding: 13px;
          border: 1px solid #f4d5d9;
          border-radius: 12px;
          background: #fff6f7;
          color: #a64f60;
          font-size: 11px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .error-box :global(svg) {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .command-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .command {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #f0ecf5;
          border-radius: 12px;
          background: #fcfbfe;
        }

        .command-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 11px;
          background: #f0eafa;
          font-size: 18px;
        }

        .command strong {
          display: block;
          margin-bottom: 4px;
          color: #594774;
          font-size: 11px;
        }

        .command small {
          display: block;
          color: #9a91a5;
          font-size: 10px;
          line-height: 1.4;
        }

        .footer {
          margin-top: 30px;
          color: #b0a7bb;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .main-layout {
            grid-template-columns: 1fr;
          }

          .side-column {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .page {
            padding: 20px 12px;
          }

          .topbar {
            align-items: flex-start;
            margin-bottom: 35px;
          }

          .topbar-right {
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
          }

          .connection-status {
            font-size: 9px;
          }

          .brand {
            font-size: 16px;
          }

          .playground {
            padding: 14px;
          }

          .playground-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .arena {
            min-height: 420px;
          }

          .avatar-scene {
            height: 370px;
          }

          .character-wrap {
            width: 235px;
            height: 340px;
          }

          .side-column {
            display: flex;
          }

          .playground-controls {
            flex-direction: column;
          }

          .primary-button,
          .reset-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="app-container">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              <Brain size={22} />
            </div>
            <span>AI Motion Studio</span>
          </div>

          <div className="topbar-right">
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

            {error && (
              <div className="error-box">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}
          </section>

          <aside className="side-column">
            <section className="side-panel">
              <div className="panel-heading">
                <Camera size={18} />
                AI CAMERA
              </div>

              <div className="camera-preview">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: cameraReady ? "block" : "none",
                  }}
                />

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

              <div className="prediction-info">
                <span>AI Model</span>
                <strong>{modelReady ? "LOADED" : "NOT LOADED"}</strong>
              </div>
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