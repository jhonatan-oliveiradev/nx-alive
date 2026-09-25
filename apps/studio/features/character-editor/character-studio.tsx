"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  Grid3X3,
  Box,
  ZoomIn,
  ZoomOut,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Copy,
  Download,
  Maximize2,
  MousePointer2,
  Move3D,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Shapes,
  Smile,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { Character } from "@nx-alive/react";
import { Character3D, type Character3DHandle } from "@nx-alive/react/three";
import {
  createId,
  bodyTypes,
  defaultFace,
  defaultPose,
  eyePresets,
  mouthPresets,
  parseCharacterDocument,
  serializeCharacter,
  type CharacterDocument,
  type CharacterExpression,
  type CharacterAnimation,
} from "@nx-alive/core";
import {
  createPreset,
  expressions as baseExpressions,
  animations as baseAnimations,
} from "@nx-alive/presets";
import { Button } from "@/components/ui/button";
import { Card, Color, Modal, Range } from "./controls";
import {
  addCharacter,
  historyStep,
  initialState,
  parseStudio,
  removeCharacter,
  selectedCharacter,
  storageKey,
  updateCharacter,
  type History,
  type StudioState,
} from "./store";
import {
  copyText,
  download,
  downloadDemo,
  exportDocument,
  importSvg,
  photo,
} from "./export";
const tabs = [
  ["avatar", "Avatar", Shapes],
  ["pose", "Pose", Move3D],
  ["expressions", "Expressions", Smile],
  ["animations", "Animations", Play],
  ["export", "Export", Download],
] as const;
type Tab = (typeof tabs)[number][0];
const title = (s: string) =>
  s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
const freshId = () => createId();

export function CharacterStudio({ initialId }: { initialId?: string }) {
  const viewportRef = useRef<Character3DHandle>(null);
  const [guides, setGuides] = useState(false),
    [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: initialState(),
    future: [],
  }));
  const hRef = useRef(history);
  hRef.current = history;
  const state = history.present,
    d = selectedCharacter(state);
  const [ready, setReady] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [status, setStatus] = useState("Loading library…"),
    [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("avatar"),
    [playing, setPlaying] = useState(true),
    [restart, setRestart] = useState(0),
    [photoMode, setPhotoMode] = useState(false),
    [background, setBackground] = useState("transparent"),
    [customBg, setCustomBg] = useState("#EDEAF7");
  const [newOpen, setNewOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [renameOpen, setRenameOpen] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false);
  const [format, setFormat] = useState<"react" | "esm">("react"),
    [exportIds, setExportIds] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [previewOpen, setPreviewOpen] = useState(false);
  const [expressionDraft, setExpressionDraft] =
      useState<CharacterExpression | null>(null),
    [animationDraft, setAnimationDraft] = useState<CharacterAnimation | null>(
      null,
    );
  const gesture = useRef(false),
    hasGestureEdit = useRef(false);
  const edit = (value: StudioState) => {
    const next = historyStep(hRef.current, {
      type: "edit",
      value,
      group: gesture.current && hasGestureEdit.current,
    });
    hasGestureEdit.current = gesture.current;
    hRef.current = next;
    setHistory(next);
  };
  const change = (next: CharacterDocument) =>
    edit(updateCharacter(hRef.current.present, next));
  const undo = () => setHistory((v) => historyStep(v, { type: "undo" }));
  const redo = () => setHistory((v) => historyStep(v, { type: "redo" }));
  const onStart = () => {
    gesture.current = true;
    hasGestureEdit.current = false;
  };
  const onEnd = () => {
    gesture.current = false;
    hasGestureEdit.current = false;
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      let loaded = raw ? parseStudio(raw) : initialState();
      if (initialId && loaded.characters.some((c) => c.id === initialId))
        loaded = { ...loaded, selectedId: initialId };
      setHistory({ past: [], present: loaded, future: [] });
    } catch {
      setStorageBlocked(true);
      setNotice(
        "Your saved library could not be opened. It has not been overwritten. Export a backup before starting a new save.",
      );
    }
    setReady(true);
  }, [initialId]);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    setStatus("Saving…");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        setStatus("Saved on this device");
      } catch {
        setStatus("Not saved");
        setNotice(
          "Device storage is unavailable or full. Export your project to keep your work.",
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state, ready, storageBlocked]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input,textarea,select") ||
          e.target.isContentEditable)
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setHistory((v) =>
          historyStep(v, { type: e.shiftKey ? "redo" : "undo" }),
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    setExportIds(Object.keys(d.animations));
  }, [d.id, Object.keys(d.animations).join(",")]);
  const run = async (fn: () => void | Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const chooseExpression = (id: string) => {
    edit({ ...state, expression: id });
    setRestart((v) => v + 1);
  };
  const chooseAnimation = (id: string) => {
    edit({
      ...state,
      animation: id,
      expression: d.animations[id]?.expression ?? "",
    });
    setPlaying(true);
    setRestart((v) => v + 1);
  };
  const poseRange = (
    label: string,
    key: keyof CharacterDocument["pose"],
    min: number,
    max: number,
    step = 1,
  ) => (
    <Range
      key={key}
      label={label}
      value={d.pose[key]}
      min={min}
      max={max}
      step={step}
      onChange={(v) => change({ ...d, pose: { ...d.pose, [key]: v } })}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
  const faceRange = (
    label: string,
    key: "spacing" | "eyeY" | "eyeScale" | "eyeRotation" | "mouthY" | "x" | "y",
    min: number,
    max: number,
    step = 1,
  ) => (
    <Range
      key={key}
      label={label}
      value={d.face[key]}
      min={min}
      max={max}
      step={step}
      onChange={(v) => change({ ...d, face: { ...d.face, [key]: v } })}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
  const bg =
    background === "custom"
      ? customBg
      : background === "white"
        ? "#FFFFFF"
        : background === "dark"
          ? "#111419"
          : undefined;
  const exported = exportDocument(d, exportIds);
  const quickStart =
    format === "react"
      ? `import { createCharacter } from './runtime/react.mjs'\nimport character from './character.character.json'\n\nconst Mascot = createCharacter(character)\n\nexport default function App() {\n  return <Mascot animation="${exportIds[0] ?? ""}" />\n}`
      : `import { mountCharacter } from './runtime/character.mjs'\n\nconst character = await fetch(\n  './character.character.json'\n).then(r => r.json())\n\nmountCharacter(element, character, {\n  animation: '${exportIds[0] ?? ""}'\n})`;
  return (
    <main className={`studio ${photoMode ? "photo-mode" : ""}`}>
      <nav className="editor-tabs" aria-label="Editor sections">
        {tabs.map(([id, label, Icon]) => (
          <button
            type="button"
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => {
              setPhotoMode(false);
              setTab(id);
            }}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <section
        className={`stage ${photoMode && background === "transparent" ? "checker" : ""}`}
        style={photoMode && bg ? { background: bg } : undefined}
        aria-label="Character preview"
      >
        <header className="stage-header">
          <a href="/" className="brand" aria-label="NX Alive Studio">
            <span className="brand-symbol">
              n<span>×</span>
            </span>
            <strong>
              NX <b>Alive</b>
            </strong>
            <span className="brand-divider" />
            <small>Studio</small>
          </a>
          <div className="workspace-title">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{d.name}</strong>
            <span className="local-badge">LOCAL</span>
          </div>
          <div className="stage-history">
            <Button
              variant="ghost"
              size="icon"
              disabled={!history.past.length}
              onClick={undo}
              aria-label="Undo"
              title="Undo · Ctrl Z"
            >
              <Undo2 size={17} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!history.future.length}
              onClick={redo}
              aria-label="Redo"
              title="Redo · Ctrl Shift Z"
            >
              <Redo2 size={17} />
            </Button>
            <Button
              className="header-export"
              variant="default"
              onClick={() => {
                setPhotoMode(false);
                setTab("export");
              }}
            >
              <ArrowUpRight size={15} /> Export character
            </Button>
          </div>
        </header>
        <div className="stage-meta">
          <div className="live-status">
            <i className={playing && !photoMode ? "live-dot" : "paused-dot"} />
            <div>
              <small>{playing && !photoMode ? "PLAYING" : "PAUSED"}</small>
              <span>
                {d.animations[state.animation]?.name || "Still"}{" "}
                <em>
                  {" "}
                  / {d.expressions[state.expression]?.name || "Base face"}
                </em>
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              change({ ...d, pose: { ...defaultPose } });
              setRestart((v) => v + 1);
            }}
            aria-label="Reset preview pose"
            title="Reset pose"
          >
            <RotateCcw size={17} />
          </Button>
        </div>
        <div className="hero-space">
          <div className="stage-orbit" aria-hidden="true" />
          <Character3D
            ref={viewportRef}
            document={d}
            expression={state.expression}
            animation={state.animation}
            playing={playing && !photoMode}
            ambient={!photoMode}
            guides={guides && !photoMode}
            zoom={zoom}
            restartKey={restart}
            className="hero-character"
            onPoseChange={(pose) => change({ ...d, pose })}
            onComplete={() => setPlaying(false)}
          />
          <div className="viewport-tools" aria-label="Viewport tools">
            <button
              type="button"
              onClick={() => setGuides((v) => !v)}
              aria-pressed={guides}
              title="Surface guides"
            >
              <Grid3X3 size={16} />
              <span>Surface</span>
            </button>
            <span className="tool-divider" />
            <button
              type="button"
              onClick={() =>
                change({
                  ...d,
                  pose: { ...d.pose, rotationX: 0, rotationY: 0, rotationZ: 0 },
                })
              }
            >
              Front
            </button>
            <button
              type="button"
              onClick={() =>
                change({
                  ...d,
                  pose: {
                    ...d.pose,
                    rotationX: 0,
                    rotationY: 90,
                    rotationZ: 0,
                  },
                })
              }
            >
              Side
            </button>
            <button
              type="button"
              onClick={() =>
                change({
                  ...d,
                  pose: {
                    ...d.pose,
                    rotationX: 0,
                    rotationY: 180,
                    rotationZ: 0,
                  },
                })
              }
            >
              Back
            </button>
            <span className="tool-divider" />
            <button
              type="button"
              onClick={() => setZoom((v) => Math.max(0.6, v - 0.1))}
              disabled={zoom <= 0.6}
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-label">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((v) => Math.min(1.6, v + 0.1))}
              disabled={zoom >= 1.6}
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
        <div className="stage-caption">
          <span className="specimen-label">CHARACTER / 3D VIEWPORT</span>
          <span>{d.name}</span>
          <p>
            {photoMode
              ? "Make it picture perfect."
              : "A little character. A whole new dimension."}
          </p>
        </div>
        <footer className="stage-footer">
          <span className="stage-hint">
            <MousePointer2 size={13} />
            Drag to rotate · Arrow keys to fine-tune
          </span>
          <Button
            onClick={() => setPhotoMode((v) => !v)}
            className="photo-button"
          >
            <Camera size={16} />
            {photoMode ? "Back to studio" : "Photo mode"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelpOpen(true)}
            aria-label="Help"
          >
            <CircleHelp size={17} />
          </Button>
        </footer>
        {!photoMode && (
          <section
            className="collection-dock"
            aria-label="Character collection"
          >
            <div className="collection-heading">
              <span>
                Collection <b>{state.characters.length}</b>
              </span>
              <small>YOUR CAST OF CHARACTERS</small>
            </div>{" "}
            <div className="collection-track">
              {state.characters.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`collection-tile ${c.id === d.id ? "selected" : ""}`}
                  aria-pressed={c.id === d.id}
                  onClick={() => {
                    edit({
                      ...state,
                      selectedId: c.id,
                      expression: "",
                      animation: "idle",
                    });
                    setRestart((v) => v + 1);
                  }}
                >
                  <Character
                    document={{
                      ...c,
                      pose: { ...c.pose, rotationX: 0, rotationY: 0 },
                    }}
                    ambient={false}
                    playing={false}
                  />
                  <span>{c.name}</span>
                  {c.id === d.id && (
                    <Check className="selection-check" size={14} />
                  )}
                </button>
              ))}
              <button
                type="button"
                className="collection-tile new-tile"
                onClick={() => setNewOpen(true)}
              >
                <span className="new-icon">
                  <Plus size={23} />
                </span>
                <span>New character</span>
              </button>
            </div>
          </section>
        )}
        <div className="mobile-notice">
          NX Alive Studio funciona melhor em uma tela maior.
        </div>
      </section>
      {!photoMode && (
        <aside className="editor" aria-label="Character editor">
          <div className="editor-scroll">
            <header className="editor-header">
              <div>
                <span className="eyebrow">CHARACTER INSPECTOR</span>
                <h1>{tab === "avatar" ? "Make it yours." : title(tab)}</h1>
                <p>
                  {tab === "avatar"
                    ? "Shape the details that make a character."
                    : `${d.name} · ${tab === "pose" ? "A few little adjustments. A whole new character." : tab === "expressions" ? "A face for every feeling." : tab === "animations" ? "Give your character a little life." : "Ready to meet the rest of your world."}`}
                </p>
              </div>
              <span className="editor-mark">
                <Sparkles size={20} />
              </span>
            </header>
            {notice && (
              <div className="notice" role="status">
                <p>{notice}</p>
                <Button size="sm" onClick={() => setNotice("")}>
                  Dismiss
                </Button>
              </div>
            )}
            {storageBlocked && (
              <Card title="Recover your library">
                <Button
                  onClick={() =>
                    run(() =>
                      download(
                        localStorage.getItem(storageKey) ?? "",
                        "nx-alive-recovery.json",
                      ),
                    )
                  }
                >
                  Download saved backup
                </Button>
                <Button onClick={() => setStorageBlocked(false)}>
                  Save this library instead
                </Button>
              </Card>
            )}
            {tab === "avatar" && (
              <>
                <div className="section-label">
                  <span>YOUR CHARACTERS</span>
                  <span>{state.characters.length} in your collection</span>
                </div>
                <div className="inspector-portrait">
                  <Character document={d} ambient={false} playing={false} />
                  <span>
                    <Box size={12} /> VOLUMETRIC CHARACTER
                  </span>
                </div>
                <div className="selected-summary">
                  <div>
                    <span className="eyebrow">SELECTED CHARACTER</span>
                    <strong>{d.name}</strong>
                  </div>
                  <div className="inline-actions">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Rename"
                      aria-label="Rename character"
                      onClick={() => setRenameOpen(true)}
                    >
                      <Code2 size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Duplicate"
                      aria-label="Duplicate character"
                      onClick={() =>
                        run(() =>
                          edit(
                            addCharacter(state, {
                              ...structuredClone(d),
                              id: freshId(),
                              name: `${d.name.slice(0, 53)} copy`,
                            }),
                          ),
                        )
                      }
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      aria-label="Delete character"
                      disabled={state.characters.length === 1}
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <Card title="Surface" detail="A soft finish, from every angle.">
                  <Color
                    label="Body color"
                    value={d.colors.body}
                    onChange={(body) =>
                      change({ ...d, colors: { ...d.colors, body } })
                    }
                  />
                  <Color
                    label="Eye color"
                    value={d.colors.eyes}
                    onChange={(eyes) =>
                      change({ ...d, colors: { ...d.colors, eyes } })
                    }
                  />
                  <Button onClick={() => setTab("pose")} className="full-width">
                    Edit shape & face <ArrowUpRight size={14} />
                  </Button>
                </Card>
                <div className="quiet-note">
                  <Sparkles size={17} />
                  <p>
                    Start with a shape. Explore every angle. Your changes are
                    saved as you go.
                  </p>
                </div>
              </>
            )}
            {tab === "pose" && (
              <>
                <Card
                  title="Body"
                  detail="Shape, color and proportions."
                  onReset={() => change({ ...d, pose: { ...defaultPose } })}
                >
                  <Color
                    label="Body color"
                    value={d.colors.body}
                    onChange={(body) =>
                      change({ ...d, colors: { ...d.colors, body } })
                    }
                  />
                  {poseRange("Scale", "scale", 0.3, 1.6, 0.01)}
                  {poseRange("Width", "width", 0.5, 1.5, 0.01)}
                  {poseRange("Height", "height", 0.5, 1.5, 0.01)}
                  {poseRange("Position X", "x", -100, 100)}
                  {poseRange("Position Y", "y", -100, 100)}
                </Card>
                <Card
                  title="Face"
                  detail="Small changes make a big impression."
                  onReset={() => change({ ...d, face: { ...defaultFace } })}
                >
                  <div className="two-col">
                    <Select
                      label="Eye preset"
                      value={d.face.eyes}
                      options={eyePresets}
                      onChange={(eyes) => {
                        edit({
                          ...updateCharacter(state, {
                            ...d,
                            face: {
                              ...d.face,
                              eyes: eyes as typeof d.face.eyes,
                            },
                          }),
                          expression: "",
                        });
                      }}
                    />
                    <Select
                      label="Mouth preset"
                      value={d.face.mouth}
                      options={mouthPresets}
                      onChange={(mouth) => {
                        edit({
                          ...updateCharacter(state, {
                            ...d,
                            face: {
                              ...d.face,
                              mouth: mouth as typeof d.face.mouth,
                            },
                          }),
                          expression: "",
                        });
                      }}
                    />
                  </div>
                  <Color
                    label="Eye color"
                    value={d.colors.eyes}
                    onChange={(eyes) =>
                      change({
                        ...d,
                        colors: { ...d.colors, eyes, mouth: eyes },
                      })
                    }
                  />
                  {faceRange("Eye spacing", "spacing", 12, 90)}
                  {faceRange("Eye Y", "eyeY", -40, 40)}
                  {faceRange("Eye scale", "eyeScale", 0.4, 2, 0.01)}
                  {faceRange("Eye rotation", "eyeRotation", -45, 45)}
                  {faceRange("Mouth Y", "mouthY", 0, 70)}
                  {faceRange("Face X", "x", -50, 50)}
                  {faceRange("Face Y", "y", -50, 50)}
                </Card>
                <Card
                  title="Orientation"
                  detail="Rotate in 3D. Drag the character or enter an angle."
                  onReset={() =>
                    change({
                      ...d,
                      pose: {
                        ...d.pose,
                        rotationX: 0,
                        rotationY: 0,
                        rotationZ: 0,
                      },
                    })
                  }
                >
                  {poseRange("Rotation X", "rotationX", -180, 180)}
                  {poseRange("Rotation Y", "rotationY", -180, 180)}
                  {poseRange("Rotation Z", "rotationZ", -180, 180)}
                </Card>
              </>
            )}
            {tab === "expressions" && (
              <>
                <div className="section-label">
                  <span>{Object.keys(d.expressions).length} EXPRESSIONS</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpressionDraft(
                        structuredClone(
                          d.expressions[state.expression] ??
                            d.expressions.neutral ??
                            baseExpressions.neutral!,
                        ),
                      )
                    }
                  >
                    <Plus size={14} />
                    Create expression
                  </Button>
                </div>
                <div className="mini-grid">
                  {Object.entries(d.expressions).map(([id, e]) => (
                    <button
                      type="button"
                      className={`mini-tile ${state.expression === id ? "selected" : ""}`}
                      key={id}
                      aria-pressed={state.expression === id}
                      onClick={() => chooseExpression(id)}
                    >
                      <Character
                        document={d}
                        expression={id}
                        playing={false}
                        ambient={false}
                      />
                      <span>{e.name}</span>
                    </button>
                  ))}
                </div>
                <Card
                  title="Make a feeling your own"
                  detail="Combine eye and mouth shapes, then save a new expression."
                >
                  <Button
                    onClick={() =>
                      setExpressionDraft({
                        ...structuredClone(
                          d.expressions[state.expression] ??
                            Object.values(d.expressions)[0] ??
                            baseExpressions.neutral!,
                        ),
                        name: "My expression",
                      })
                    }
                  >
                    <Smile size={16} />
                    Customize expression
                  </Button>
                </Card>
              </>
            )}
            {tab === "animations" && (
              <>
                <div className="section-label">
                  <span>{Object.keys(d.animations).length} ANIMATIONS</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAnimationDraft({
                        ...structuredClone(
                          d.animations[state.animation] ??
                            Object.values(d.animations)[0] ??
                            baseAnimations.idle!,
                        ),
                        name: "My animation",
                      })
                    }
                  >
                    <Plus size={14} />
                    Create animation
                  </Button>
                </div>
                {(["Life cycle", "Reactions", "Custom"] as const).map(
                  (category) => {
                    const entries = Object.entries(d.animations).filter(
                      ([, a]) => a.category === category,
                    );
                    return (
                      entries.length > 0 && (
                        <section className="animation-group" key={category}>
                          <h3 className="eyebrow">{category}</h3>
                          <div className="mini-grid">
                            {entries.map(([id, a]) => (
                              <button
                                type="button"
                                className={`mini-tile ${state.animation === id ? "selected" : ""}`}
                                key={id}
                                aria-pressed={state.animation === id}
                                onClick={() => chooseAnimation(id)}
                              >
                                <Character
                                  document={d}
                                  expression={a.expression}
                                  playing={false}
                                  ambient={false}
                                />
                                <span>{a.name}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      )
                    );
                  },
                )}
                <Card title="Little moments, on repeat">
                  <Button
                    onClick={() =>
                      setAnimationDraft({
                        ...structuredClone(
                          d.animations[state.animation] ??
                            Object.values(d.animations)[0] ??
                            baseAnimations.idle!,
                        ),
                        name: "My animation",
                      })
                    }
                  >
                    Customize timing & movement
                  </Button>
                </Card>
              </>
            )}
            {tab === "export" && (
              <>
                <Card
                  title="Photo mode"
                  detail="A perfect little portrait. SVG or high-resolution PNG."
                >
                  <Button onClick={() => setPhotoMode(true)}>
                    <Camera size={16} />
                    Open photo mode
                    <ChevronRight size={15} />
                  </Button>
                </Card>
                <Card
                  title="Export character"
                  detail="Your character and its personality, ready to use."
                >
                  <div className="export-character">
                    <Character document={d} playing={false} ambient={false} />
                    <div>
                      <small>Selected character</small>
                      <strong>{d.name}</strong>
                    </div>
                    <Check size={17} />
                  </div>
                  <div className="format-options">
                    <button
                      type="button"
                      className={format === "react" ? "selected" : ""}
                      onClick={() => setFormat("react")}
                    >
                      <Code2 size={19} />
                      <span>
                        React / TypeScript<small>Next.js demo included</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={format === "esm" ? "selected" : ""}
                      onClick={() => setFormat("esm")}
                    >
                      <Code2 size={19} />
                      <span>
                        JavaScript / ESM<small>No framework needed</small>
                      </span>
                    </button>
                  </div>
                  <details className="export-customize">
                    <summary>
                      <span>
                        <small>
                          {exportIds.length}/{Object.keys(d.animations).length}{" "}
                          SELECTED
                        </small>
                        Animations to export
                      </span>
                      <span>Customize</span>
                    </summary>
                    <div className="checkbox-grid">
                      {Object.entries(d.animations).map(([id, a]) => (
                        <label key={id}>
                          <input
                            type="checkbox"
                            checked={exportIds.includes(id)}
                            onChange={(e) =>
                              setExportIds((v) =>
                                e.target.checked
                                  ? [...v, id]
                                  : v.filter((i) => i !== id),
                              )
                            }
                          />
                          {a.name}
                        </label>
                      ))}
                    </div>
                  </details>
                  <div className="quick-start">
                    <span className="eyebrow">QUICK START</span>
                    <pre>
                      <code>{quickStart}</code>
                    </pre>
                    <p>
                      The demo includes its runtime. No package publishing
                      required.
                    </p>
                  </div>
                  <div className="export-actions">
                    <Button
                      variant="default"
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          download(
                            serializeCharacter(exported),
                            `${d.id}.character.json`,
                          ),
                        )
                      }
                    >
                      <Download size={16} />
                      Download character.json
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await downloadDemo(exported, format);
                          setNotice(
                            "Demo prepared. Check your browser downloads.",
                          );
                        })
                      }
                    >
                      <Download size={16} />
                      Download {format === "react" ? "React" : "ESM"} demo
                      (.zip)
                    </Button>
                    <div className="two-col">
                      <Button onClick={() => setPreviewOpen(true)}>
                        <Maximize2 size={15} />
                        Preview
                      </Button>
                      <Button
                        onClick={() =>
                          run(async () => {
                            await copyText(serializeCharacter(exported));
                            setNotice("Character JSON copied.");
                          })
                        }
                      >
                        <Copy size={15} />
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                </Card>
                <Card
                  title="Studio project"
                  detail="Keep a backup, or take your collection to another browser."
                >
                  <div className="two-col">
                    <Button
                      onClick={() =>
                        download(
                          JSON.stringify(state, null, 2),
                          "nx-alive-studio.json",
                        )
                      }
                    >
                      <Download size={15} />
                      Back up
                    </Button>
                    <label className="button button-outline upload-label">
                      <Upload size={15} />
                      Import
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) =>
                          run(async () => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const text = await f.text();
                            if (text.length > 5000000)
                              throw Error("Use a project smaller than 5 MB.");
                            const parsed = JSON.parse(text);
                            if (parsed.schemaVersion === 2) {
                              edit(parseStudio(text));
                            } else {
                              const character = parseCharacterDocument(parsed);
                              edit(
                                addCharacter(state, {
                                  ...character,
                                  id: freshId(),
                                }),
                              );
                            }
                            e.target.value = "";
                          })
                        }
                      />
                    </label>
                  </div>
                </Card>
              </>
            )}
          </div>
          <footer className="editor-footer">
            <div className="playback">
              <div className="filmstrip">
                {["neutral", "happy", "curious", "sleeping"]
                  .filter((id) => d.expressions[id])
                  .map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={state.expression === id ? "selected" : ""}
                      onClick={() => chooseExpression(id)}
                      aria-label={`Quick expression: ${id}`}
                    >
                      <Character
                        document={d}
                        expression={id}
                        playing={false}
                        ambient={false}
                      />
                    </button>
                  ))}
              </div>
              <div className="playback-label">
                <small>{playing ? "PLAYING" : "PAUSED"}</small>
                <strong>
                  {d.animations[state.animation]?.name ?? "Still"}
                </strong>
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={() => setPlaying((v) => !v)}
                aria-label={playing ? "Pause animation" : "Play animation"}
              >
                {playing ? (
                  <Pause size={19} fill="currentColor" />
                ) : (
                  <Play size={19} fill="currentColor" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setRestart((v) => v + 1);
                  setPlaying(true);
                }}
                aria-label="Restart animation"
              >
                <RotateCcw size={17} />
              </Button>
            </div>

            <div className="save-status">
              <i />
              {status}
              <span>NX ALIVE / STUDIO</span>
            </div>
          </footer>
        </aside>
      )}
      {photoMode && (
        <div className="photo-tools">
          <div>
            <span className="eyebrow">PHOTO MODE</span>
            <h2>A little portrait.</h2>
          </div>
          <Select
            label="Background"
            value={background}
            options={["transparent", "white", "dark", "custom"]}
            onChange={setBackground}
          />
          {background === "custom" && (
            <Color
              label="Custom color"
              value={customBg}
              onChange={setCustomBg}
            />
          )}
          <Button
            disabled={busy}
            variant="default"
            onClick={() =>
              run(async () => {
                if (!viewportRef.current)
                  throw Error("The 3D preview is not ready.");
                download(
                  await viewportRef.current.capture(bg),
                  `${d.id}-3d.png`,
                  "image/png",
                );
              })
            }
          >
            <Download size={16} />
            Export PNG
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              run(() =>
                photo(
                  d,
                  { expression: state.expression, background: bg },
                  "svg",
                ),
              )
            }
          >
            Export flat SVG
          </Button>
          <Button onClick={() => setPhotoMode(false)}>
            <X size={16} />
            Close
          </Button>
          {notice && <p role="status">{notice}</p>}
        </div>
      )}
      <NewCharacter
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(c) => {
          edit(addCharacter(state, c));
          setNewOpen(false);
        }}
      />
      <Modal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename character"
        description="Give your little friend a name."
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(
              new FormData(e.currentTarget).get("name"),
            ).trim();
            if (name) {
              change({ ...d, name });
              setRenameOpen(false);
            }
          }}
        >
          <label className="form-field">
            Name
            <input name="name" defaultValue={d.name} maxLength={60} required />
          </label>
          <Button type="submit" variant="default">
            Save name
          </Button>
        </form>
      </Modal>
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${d.name}?`}
        description="You can bring this character back with Undo."
      >
        <div className="two-col">
          <Button onClick={() => setDeleteOpen(false)}>Keep character</Button>
          <Button
            variant="danger"
            onClick={() => {
              edit(removeCharacter(state));
              setDeleteOpen(false);
            }}
          >
            Delete character
          </Button>
        </div>
      </Modal>
      <Modal
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="A little help."
        description="Pick a character, make it yours, and bring it into your product."
      >
        <div className="help-copy">
          <p>
            <strong>Avatar</strong> · Choose, create or duplicate a character.
          </p>
          <p>
            <strong>Pose</strong> · Adjust the body, face and orientation.
          </p>
          <p>
            <strong>Expressions & animations</strong> · Choose a mood and
            movement, or save your own.
          </p>
          <p>
            <strong>Export</strong> · Download a reusable character, a runnable
            demo, or a portrait.
          </p>
          <p>
            Ctrl / ⌘ Z to undo. Add Shift to redo. Your collection is saved on
            this device.
          </p>
          <p>
            <strong>3D viewport</strong> · Drag to rotate. Arrow keys turn the
            character; Home restores the front view. Use Front, Side and Back
            for precise views. Surface shows the geometry guides.
          </p>
          <p>
            <strong>Photo mode</strong> · PNG captures your current 3D view.
            Flat SVG is a separate 2D illustration.
          </p>
        </div>
      </Modal>
      <Modal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Export preview"
        description={`${exportIds.length} animations included in your character.`}
      >
        <Character3D
          document={exported}
          animation={exportIds[0]}
          className="export-preview"
        />
      </Modal>
      {expressionDraft && (
        <ExpressionEditor
          document={d}
          draft={expressionDraft}
          onClose={() => setExpressionDraft(null)}
          onSave={(e) => {
            const id = createId("expression");
            edit({
              ...updateCharacter(state, {
                ...d,
                expressions: { ...d.expressions, [id]: e },
              }),
              expression: id,
            });
            setExpressionDraft(null);
          }}
        />
      )}
      {animationDraft && (
        <AnimationEditor
          document={d}
          draft={animationDraft}
          onClose={() => setAnimationDraft(null)}
          onSave={(a) => {
            const id = createId("animation");
            edit({
              ...updateCharacter(state, {
                ...d,
                animations: { ...d.animations, [id]: a },
              }),
              animation: id,
              expression: a.expression,
            });
            setAnimationDraft(null);
          }}
        />
      )}
    </main>
  );
}
function Select({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="form-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? title(o)}
          </option>
        ))}
      </select>
    </label>
  );
}
function NewCharacter({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (d: CharacterDocument) => void;
}) {
  const [base, setBase] = useState<CharacterDocument["body"]["type"]>("blob"),
    [name, setName] = useState(""),
    [color, setColor] = useState("#A49AF4"),
    [eyes, setEyes] = useState("pill"),
    [eyeColor, setEyeColor] = useState("#24243B"),
    [body, setBody] = useState<CharacterDocument["body"] | null>(null),
    [error, setError] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Meet someone new."
      description="Start with a simple shape. The personality is up to you."
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (base === "custom" && !body)
              throw Error("Import a single-path SVG first.");
            const d = createPreset(
              freshId(),
              name.trim(),
              base,
              color,
              base === "custom" && body ? { body } : {},
            );
            onCreate(
              parseCharacterDocument({
                ...d,
                body: base === "custom" ? body : d.body,
                face: { ...d.face, eyes },
                colors: { ...d.colors, eyes: eyeColor, mouth: eyeColor },
              }),
            );
            setName("");
            setError("");
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Could not create character.",
            );
          }
        }}
      >
        <div className="base-grid">
          {bodyTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={base === type ? "selected" : ""}
              onClick={() => setBase(type)}
            >
              {type === "custom" ? (
                <Upload size={28} />
              ) : (
                <Character
                  document={createPreset("preview", "Preview", type, color)}
                  playing={false}
                  ambient={false}
                />
              )}
              <span>{type === "custom" ? "Custom SVG" : title(type)}</span>
            </button>
          ))}
        </div>
        {base === "custom" && (
          <label className="form-field">
            Import SVG
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={async (e) => {
                try {
                  const f = e.target.files?.[0];
                  if (f) {
                    setBody(importSvg(await f.text()));
                    setError("");
                  }
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
            <small>
              One outlined path with a viewBox. Flatten transforms before
              importing.
            </small>
            {body && <span>SVG ready ✓</span>}
          </label>
        )}
        <label className="form-field">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Give your character a name"
            required
          />
        </label>
        <Color label="Body color" value={color} onChange={setColor} />
        <div className="two-col">
          <Select
            label="Eye preset"
            value={eyes}
            options={eyePresets}
            onChange={setEyes}
          />
          <Color label="Eye color" value={eyeColor} onChange={setEyeColor} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="default">
          <Plus size={16} />
          Create character
        </Button>
      </form>
    </Modal>
  );
}
function ExpressionEditor({
  document,
  draft,
  onSave,
  onClose,
}: {
  document: CharacterDocument;
  draft: CharacterExpression;
  onSave: (e: CharacterExpression) => void;
  onClose: () => void;
}) {
  const [e, set] = useState(draft);
  return (
    <Modal
      open
      onOpenChange={onClose}
      title="A new expression."
      description="A few simple shapes. A completely different feeling."
    >
      <Character
        document={{
          ...document,
          expressions: {
            ...document.expressions,
            preview: { ...e, name: e.name.trim() || "Preview" },
          },
        }}
        expression="preview"
        ambient={false}
        playing={false}
        className="draft-preview"
      />
      <form
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault();
          if (e.name.trim()) onSave({ ...e, name: e.name.trim() });
        }}
      >
        <label className="form-field">
          Expression name
          <input
            value={e.name}
            maxLength={60}
            required
            onChange={(ev) => set({ ...e, name: ev.target.value })}
          />
        </label>
        <div className="two-col">
          <Select
            label="Eyes"
            value={e.eyes}
            options={eyePresets}
            onChange={(eyes) => set({ ...e, eyes: eyes as typeof e.eyes })}
          />
          <Select
            label="Mouth"
            value={e.mouth}
            options={mouthPresets}
            onChange={(mouth) => set({ ...e, mouth: mouth as typeof e.mouth })}
          />
        </div>
        <Range
          label="Face tilt"
          value={e.tilt}
          min={-20}
          max={20}
          onChange={(tilt) => set({ ...e, tilt })}
        />
        <Range
          label="Face offset Y"
          value={e.y}
          min={-15}
          max={15}
          onChange={(y) => set({ ...e, y })}
        />
        <label className="check-row">
          <input
            type="checkbox"
            checked={e.blush}
            onChange={(ev) => set({ ...e, blush: ev.target.checked })}
          />
          Rosy cheeks
        </label>
        <Button type="submit" variant="default">
          Save expression
        </Button>
      </form>
    </Modal>
  );
}
function AnimationEditor({
  document,
  draft,
  onSave,
  onClose,
}: {
  document: CharacterDocument;
  draft: CharacterAnimation;
  onSave: (a: CharacterAnimation) => void;
  onClose: () => void;
}) {
  const [a, set] = useState({
    ...draft,
    expression: Object.hasOwn(document.expressions, draft.expression)
      ? draft.expression
      : Object.keys(document.expressions)[0]!,
  });
  return (
    <Modal
      open
      onOpenChange={onClose}
      title="A new little movement."
      description="Start from this motion and make it your own."
    >
      <Character
        document={{
          ...document,
          animations: {
            ...document.animations,
            preview: { ...a, name: a.name.trim() || "Preview" },
          },
        }}
        animation="preview"
        className="draft-preview"
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (a.name.trim())
            onSave({ ...a, name: a.name.trim(), category: "Custom" });
        }}
      >
        <label className="form-field">
          Animation name
          <input
            value={a.name}
            maxLength={60}
            required
            onChange={(e) => set({ ...a, name: e.target.value })}
          />
        </label>
        <Select
          label="Expression"
          value={a.expression}
          options={Object.keys(document.expressions)}
          labels={Object.fromEntries(
            Object.entries(document.expressions).map(([id, e]) => [id, e.name]),
          )}
          onChange={(expression) => set({ ...a, expression })}
        />
        <Range
          label="Duration (ms)"
          min={300}
          max={12000}
          step={50}
          value={a.durationMs}
          onChange={(durationMs) => set({ ...a, durationMs })}
        />
        <Range
          label="Bounce height"
          min={-40}
          max={40}
          value={a.frames[2]?.y ?? 0}
          onChange={(y) =>
            set({
              ...a,
              frames: a.frames.map((f, i) => (i === 2 ? { ...f, y } : f)),
            })
          }
        />
        <Range
          label="Peak tilt"
          min={-30}
          max={30}
          value={a.frames[2]?.rotation ?? 0}
          onChange={(rotation) =>
            set({
              ...a,
              frames: a.frames.map((f, i) =>
                i === 2 ? { ...f, rotation } : f,
              ),
            })
          }
        />
        <label className="check-row">
          <input
            type="checkbox"
            checked={a.loop}
            onChange={(e) => set({ ...a, loop: e.target.checked })}
          />
          Loop animation
        </label>
        <Button type="submit" variant="default">
          Save animation
        </Button>
      </form>
    </Modal>
  );
}
