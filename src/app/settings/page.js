"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as tmImage from "@teachablemachine/image";

const SETTINGS_KEY = "ai-dino-settings";

const MOVEMENTS = [
  {
    name: "JUMP",
    description: "Make the dinosaur jump over obstacles.",
    labels: ["JUMP1", "JUMP2", "JUMP3", "JUMP4", "JUMP5"],
    symbol: "↑",
  },
  {
    name: "DUCK",
    description: "Make the dinosaur crouch under obstacles.",
    labels: ["DUCK1", "DUCK2", "DUCK3", "DUCK4", "DUCK5"],
    symbol: "↓",
  },
  {
    name: "NEUTRAL",
    description: "Keep the dinosaur running normally.",
    labels: ["NEUTRAL1", "NEUTRAL2", "NEUTRAL3", "NEUTRAL4", "NEUTRAL5"],
    symbol: "●",
  },
];

function normalizeLabel(label) {
  return label.toUpperCase().replace(/\s+/g, "").trim();
}

function getMovement(label) {
  const normalized = normalizeLabel(label);
  const match = normalized.match(/^(JUMP|DUCK|NEUTRAL)[1-5]$/);
  return match ? match[1] : null;
}

export default function SettingsPage() {
  const [modelUrl, setModelUrl] = useState("");
  const [confidence, setConfidence] = useState(85);
  const [classes, setClasses] = useState([]);
  const [savedClasses, setSavedClasses] = useState([]);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (stored) {
        const settings = JSON.parse(stored);

        setModelUrl(settings.modelUrl || "");
        setConfidence(settings.confidence ?? 85);
        setClasses(settings.classes || []);
        setSavedClasses(settings.classes || []);
        setTested(Boolean(settings.modelUrl && settings.classes?.length));
      }
    } catch (err) {
      console.error("Could not load saved AI settings:", err);
    }
  }, []);
useEffect(() => {
  const handleEscape = (event) => {
    if (event.key === "Escape") {
      window.location.href = "/";
    }
  };

  window.addEventListener("keydown", handleEscape);

  return () => {
    window.removeEventListener("keydown", handleEscape);
  };
}, []);
  const testModel = async () => {
    setError("");
    setMessage("");
    setSaved(false);
    setTested(false);
    setClasses([]);

    const cleanUrl = modelUrl.trim().replace(/\/+$/, "");

    if (!cleanUrl) {
      setError("Please paste your Teachable Machine model URL.");
      return;
    }

    if (
      !cleanUrl.startsWith("https://teachablemachine.withgoogle.com/models/")
    ) {
      setError("Please enter a valid Teachable Machine shareable model URL.");
      return;
    }

    setTesting(true);

    try {
      const model = await tmImage.load(
        `${cleanUrl}/model.json`,
        `${cleanUrl}/metadata.json`,
      );

      const labels = model.getClassLabels();

      if (!labels || labels.length === 0) {
        throw new Error("The model loaded, but no class names were found.");
      }

      setClasses(labels);
      setTested(true);
      setMessage(`Model loaded successfully. Found ${labels.length} classes.`);
    } catch (err) {
      console.error("Model test failed:", err);
      setError(
        err.message ||
          "Could not load this model. Check the URL and try again.",
      );
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = () => {
    setError("");
    setMessage("");

    if (!modelUrl.trim()) {
      setError("Enter your model URL before saving.");
      return;
    }

    if (!tested || classes.length === 0) {
      setError("Please test your model successfully before saving.");
      return;
    }

    const settings = {
      modelUrl: modelUrl.trim().replace(/\/+$/, "") + "/",
      confidence,
      classes,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSavedClasses(classes);
      setSaved(true);
      setMessage("Your AI model settings have been saved!");
    } catch (err) {
      console.error("Could not save settings:", err);
      setError("Your settings could not be saved in this browser.");
    }
  };

  const movementCounts = MOVEMENTS.map((movement) => ({
    ...movement,
    found: classes.filter((label) => getMovement(label) === movement.name),
  }));

  const totalExpectedClasses = 15;
  const validClassCount = movementCounts.reduce(
    (total, movement) => total + movement.found.length,
    0,
  );

  const hasAllClasses = movementCounts.every(
    (movement) => movement.found.length === 5,
  );

  const otherClasses = classes.filter((label) => !getMovement(label));

  return (
    <main className="page settings-page">
      <header className="header">
        <Link className="brand" href="/">
          <span className="brand-icon">✦</span>
          AI MOTION LAB
        </Link>

        <Link className="settings-back-link" href="/">
          ← Back to Dinosaur Adventure
        </Link>
      </header>

      <section className="settings-hero">
        <span className="section-kicker">PROJECT ADMINISTRATION</span>
        <h1>AI Model Settings</h1>
        <p>Connect and configure your trained AI movement recognition model.</p>
      </section>

      <section className="settings-card">
        <div className="settings-section">
          <label className="settings-label" htmlFor="model-url">
            Teachable Machine Model URL
          </label>

          <p className="settings-description">
            Paste the shareable model URL from Teachable Machine.
          </p>

          <input
            id="model-url"
            className="settings-input"
            type="url"
            placeholder="https://teachablemachine.withgoogle.com/models/..."
            value={modelUrl}
            onChange={(event) => {
              setModelUrl(event.target.value);
              setTested(false);
              setSaved(false);
              setClasses([]);
              setError("");
              setMessage("");
            }}
          />
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div className="settings-label-row">
            <label className="settings-label" htmlFor="confidence">
              Recognition confidence
            </label>

            <strong className="confidence-number">{confidence}%</strong>
          </div>

          <p className="settings-description">
            Start at 85%. We can adjust this after testing your movements.
          </p>

          <input
            id="confidence"
            className="settings-slider"
            type="range"
            min="50"
            max="95"
            step="1"
            value={confidence}
            onChange={(event) => {
              setConfidence(Number(event.target.value));
              setSaved(false);
            }}
          />

          <div className="settings-range-labels">
            <span>50% · More sensitive</span>
            <span>95% · More strict</span>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h2 className="settings-subheading">Test AI Model</h2>

          <p className="settings-description">
            Load your model and check that its movement classes are named
            correctly.
          </p>

          <button
            className="primary-button settings-test-button"
            onClick={testModel}
            disabled={testing}
          >
            {testing ? "TESTING MODEL..." : "◎  TEST AI MODEL"}
          </button>

          {error && (
            <div className="settings-message settings-error">{error}</div>
          )}

          {message && (
            <div className="settings-message settings-success">{message}</div>
          )}
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div className="settings-label-row">
            <h2 className="settings-subheading">
              Previously saved model classes
            </h2>

            <span className="settings-class-count">
              {tested ? `${classes.length} CLASSES` : "NOT TESTED"}
            </span>
          </div>

          <p className="settings-description">
            Your model should contain 15 classes, grouped into three movements.
            Class names are detected automatically after testing.
          </p>

          {!tested && savedClasses.length === 0 && (
            <div className="settings-empty">
              Your model classes will appear here after testing.
            </div>
          )}

          {(tested
            ? movementCounts
            : MOVEMENTS.map((movement) => ({
                ...movement,
                found: savedClasses.filter(
                  (label) => getMovement(label) === movement.name,
                ),
              }))
          ).map((movement) => (
            <div className="settings-movement" key={movement.name}>
              <div className="settings-movement-top">
                <div className="settings-movement-title">
                  <span className="settings-movement-symbol">
                    {movement.symbol}
                  </span>

                  <div>
                    <strong>{movement.name}</strong>
                    <p>{movement.description}</p>
                  </div>
                </div>

                <span
                  className={`settings-movement-status ${
                    movement.found.length === 5 ? "complete" : ""
                  }`}
                >
                  {movement.found.length}/5
                </span>
              </div>

              <div className="settings-class-tags">
                {movement.found.length > 0 ? (
                  movement.found.map((label) => (
                    <span className="settings-class-tag" key={label}>
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="settings-no-classes">
                    Waiting for model test
                  </span>
                )}
              </div>
            </div>
          ))}

          {tested && otherClasses.length > 0 && (
            <div className="settings-warning">
              <strong>Other class names found:</strong>
              <p>{otherClasses.join(", ")}</p>
              <span>
                These classes are not part of the three expected movements.
              </span>
            </div>
          )}

          {tested && (
            <div
              className={`settings-validation ${
                hasAllClasses ? "valid" : "invalid"
              }`}
            >
              {hasAllClasses
                ? "✓ All 15 movement classes were found."
                : `Found ${validClassCount} of ${totalExpectedClasses} expected movement classes. Check your Teachable Machine labels.`}
            </div>
          )}
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <button
            className="primary-button settings-save-button"
            onClick={saveSettings}
            disabled={!tested || !hasAllClasses}
          >
            ✦ SAVE MODEL SETTINGS
          </button>

          {saved && (
            <p className="settings-saved-note">
              ✓ Settings saved in this browser.
            </p>
          )}
        </div>
      </section>

      <section className="settings-how">
        <span className="section-kicker">HOW THE MODEL WORKS</span>
        <h2>Three movements. Fifteen trained examples.</h2>

        <p>
          Your Teachable Machine model learns five examples of each body
          movement. The website groups the five examples together, so the
          dinosaur only receives three commands: JUMP, DUCK, and NEUTRAL.
        </p>

        <div className="settings-how-grid">
          <div>
            <strong>JUMP1 – JUMP5</strong>
            <span>Recognized as JUMP</span>
          </div>

          <div>
            <strong>DUCK1 – DUCK5</strong>
            <span>Recognized as DUCK</span>
          </div>

          <div>
            <strong>NEUTRAL1 – NEUTRAL5</strong>
            <span>Recognized as NEUTRAL</span>
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
