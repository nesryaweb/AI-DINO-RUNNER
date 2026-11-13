"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as tmImage from "@teachablemachine/image";

const SETTINGS_KEY = "ai-dino-settings";

const MOVEMENTS = [
  {
    name: "JUMP",
    description: "Make the dinosaur jump over obstacles.",
    symbol: "↑",
  },
  {
    name: "DUCK",
    description: "Make the dinosaur crouch under obstacles.",
    symbol: "↓",
  },
  {
    name: "NEUTRAL",
    description: "Keep the dinosaur running normally.",
    symbol: "●",
  },
];

// Recognizes any class beginning with JUMP, DUCK, or NEUTRAL.
// Examples: JUMP1, JUMP20, JUMP100, DUCK5, NEUTRAL50.
function normalizeLabel(label) {
  return String(label || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

function getMovement(label) {
  const normalized = normalizeLabel(label);

  if (normalized.startsWith("JUMP")) return "JUMP";
  if (normalized.startsWith("DUCK")) return "DUCK";
  if (normalized.startsWith("NEUTRAL")) return "NEUTRAL";

  return null;
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

  // Load previously saved settings.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (stored) {
        const settings = JSON.parse(stored);

        setModelUrl(settings.modelUrl || "");
        setConfidence(settings.confidence ?? 85);
        setClasses(settings.classes || []);
        setSavedClasses(settings.classes || []);

        setTested(
          Boolean(
            settings.modelUrl &&
            settings.classes?.length
          )
        );
      }
    } catch (err) {
      console.error("Could not load saved AI settings:", err);
    }
  }, []);

  // Escape returns to the game.
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

  // Test and load the Teachable Machine model.
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
      !cleanUrl.startsWith(
        "https://teachablemachine.withgoogle.com/models/"
      )
    ) {
      setError(
        "Please enter a valid Teachable Machine shareable model URL."
      );
      return;
    }

    setTesting(true);

    try {
      const model = await tmImage.load(
        `${cleanUrl}/model.json`,
        `${cleanUrl}/metadata.json`
      );

      const labels = model.getClassLabels();

      if (!labels || labels.length === 0) {
        throw new Error(
          "The model loaded, but no class names were found."
        );
      }

      setClasses(labels);
      setTested(true);

      setMessage(
        `Model loaded successfully. Found ${labels.length} classes.`
      );
    } catch (err) {
      console.error("Model test failed:", err);

      setError(
        err.message ||
          "Could not load this model. Check the URL and try again."
      );
    } finally {
      setTesting(false);
    }
  };

  // Save the tested model settings.
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

    const groups = {
      JUMP: classes.filter(
        (label) => getMovement(label) === "JUMP"
      ),
      DUCK: classes.filter(
        (label) => getMovement(label) === "DUCK"
      ),
      NEUTRAL: classes.filter(
        (label) => getMovement(label) === "NEUTRAL"
      ),
    };

    const missingMovements = Object.entries(groups)
      .filter(([, labels]) => labels.length === 0)
      .map(([movement]) => movement);

    if (missingMovements.length > 0) {
      setError(
        `Your model is missing these movements: ${missingMovements.join(
          ", "
        )}. Add at least one class for each movement.`
      );
      return;
    }

    const settings = {
      modelUrl:
        modelUrl.trim().replace(/\/+$/, "") + "/",
      confidence,
      classes,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      setSavedClasses(classes);
      setSaved(true);

      setMessage("Your AI model settings have been saved!");
    } catch (err) {
      console.error("Could not save settings:", err);

      setError(
        "Your settings could not be saved in this browser."
      );
    }
  };

  // Group every detected class into its movement.
  const movementCounts = MOVEMENTS.map((movement) => ({
    ...movement,
    found: classes.filter(
      (label) => getMovement(label) === movement.name
    ),
  }));

  const validClassCount = movementCounts.reduce(
    (total, movement) => total + movement.found.length,
    0
  );

  // Each movement needs at least one class.
  const hasAllMovements = movementCounts.every(
    (movement) => movement.found.length >= 1
  );

  const otherClasses = classes.filter(
    (label) => !getMovement(label)
  );

  const displayedMovements = tested
    ? movementCounts
    : MOVEMENTS.map((movement) => ({
        ...movement,
        found: savedClasses.filter(
          (label) => getMovement(label) === movement.name
        ),
      }));

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
        <span className="section-kicker">
          PROJECT ADMINISTRATION
        </span>

        <h1>AI Model Settings</h1>

        <p>
          Connect and configure your trained AI movement
          recognition model.
        </p>
      </section>

      <section className="settings-card">
        {/* MODEL URL */}
        <div className="settings-section">
          <label
            className="settings-label"
            htmlFor="model-url"
          >
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

        {/* CONFIDENCE */}
        <div className="settings-section">
          <div className="settings-label-row">
            <label
              className="settings-label"
              htmlFor="confidence"
            >
              Recognition confidence
            </label>

            <strong className="confidence-number">
              {confidence}%
            </strong>
          </div>

          <p className="settings-description">
            Start at 85%. We can adjust this after testing
            your movements.
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

        {/* TEST MODEL */}
        <div className="settings-section">
          <h2 className="settings-subheading">
            Test AI Model
          </h2>

          <p className="settings-description">
            Load your model and check that its movement classes
            are named correctly.
          </p>

          <button
            className="primary-button settings-test-button"
            onClick={testModel}
            disabled={testing}
          >
            {testing
              ? "TESTING MODEL..."
              : "◎  TEST AI MODEL"}
          </button>

          {error && (
            <div className="settings-message settings-error">
              {error}
            </div>
          )}

          {message && (
            <div className="settings-message settings-success">
              {message}
            </div>
          )}
        </div>

        <div className="settings-divider" />

        {/* MODEL CLASSES */}
        <div className="settings-section">
          <div className="settings-label-row">
            <h2 className="settings-subheading">
              Previously saved model classes
            </h2>

            <span className="settings-class-count">
              {tested
                ? `${classes.length} CLASSES`
                : "NOT TESTED"}
            </span>
          </div>

          <p className="settings-description">
            Your model classes are detected automatically.
            Any number of classes is allowed, as long as
            their names begin with JUMP, DUCK, or NEUTRAL.
          </p>

          {!tested && savedClasses.length === 0 && (
            <div className="settings-empty">
              Your model classes will appear here after testing.
            </div>
          )}

          {displayedMovements.map((movement) => (
            <div
              className="settings-movement"
              key={movement.name}
            >
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
                    movement.found.length >= 1
                      ? "complete"
                      : ""
                  }`}
                >
                  {movement.found.length}{" "}
                  {movement.found.length === 1
                    ? "CLASS"
                    : "CLASSES"}
                </span>
              </div>

              <div className="settings-class-tags">
                {movement.found.length > 0 ? (
                  movement.found.map((label, index) => (
                    <span
                      className="settings-class-tag"
                      key={`${label}-${index}`}
                    >
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
                These classes do not begin with JUMP, DUCK,
                or NEUTRAL, so the game will not use them
                as movement commands.
              </span>
            </div>
          )}

          {tested && (
            <div
              className={`settings-validation ${
                hasAllMovements ? "valid" : "invalid"
              }`}
            >
              {hasAllMovements
                ? `✓ All three movements found. ${validClassCount} movement classes detected.`
                : `Missing movement classes. You need at least one JUMP, one DUCK, and one NEUTRAL class.`}
            </div>
          )}
        </div>

        <div className="settings-divider" />

        {/* SAVE SETTINGS */}
        <div className="settings-section">
          <button
            className="primary-button settings-save-button"
            onClick={saveSettings}
            disabled={!tested || !hasAllMovements}
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

      {/* HOW THE MODEL WORKS */}
      <section className="settings-how">
        <span className="section-kicker">
          HOW THE MODEL WORKS
        </span>

        <h2>Three movements. Unlimited examples.</h2>

        <p>
          Your Teachable Machine model can learn as many
          examples as you want for each movement. The website
          groups all classes beginning with the same movement
          name, so the dinosaur only receives three commands:
          JUMP, DUCK, and NEUTRAL.
        </p>

        <div className="settings-how-grid">
          <div>
            <strong>JUMP1, JUMP2, JUMP20...</strong>
            <span>Recognized as JUMP</span>
          </div>

          <div>
            <strong>DUCK1, DUCK5, DUCK20...</strong>
            <span>Recognized as DUCK</span>
          </div>

          <div>
            <strong>NEUTRAL1, NEUTRAL10...</strong>
            <span>Recognized as NEUTRAL</span>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          ✦ AI MOTION LAB
        </div>

        <p>A STUDENT SCIENCE FAIR PROJECT</p>

        <span>POWERED BY TEACHABLE MACHINE</span>
      </footer>
    </main>
  );
}
