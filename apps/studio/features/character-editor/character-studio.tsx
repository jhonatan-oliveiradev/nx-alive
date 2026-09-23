"use client";

import {
  ArrowLeft,
  Box,
  ChevronDown,
  CircleDot,
  Download,
  Film,
  Layers3,
  MousePointer2,
  Play,
  Plus,
  RotateCw,
  Shapes,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CharacterDocument } from "@nx-alive/core";
import { Character } from "@nx-alive/react";

const modes = [
  { id: "character", label: "Character", icon: CircleDot },
  { id: "pose", label: "Pose", icon: RotateCw },
  { id: "expressions", label: "Expressions", icon: Sparkles },
  { id: "animations", label: "Animations", icon: Film },
  { id: "export", label: "Export", icon: Download },
] as const;

type Mode = (typeof modes)[number]["id"];

export function CharacterStudio({ document }: { document: CharacterDocument }) {
  const [mode, setMode] = useState<Mode>("character");
  const [state, setState] = useState(document.defaultState);
  const [selectedPart, setSelectedPart] = useState("head");

  const selected = useMemo(
    () => document.parts.find((part) => part.id === selectedPart),
    [document.parts, selectedPart],
  );

  const states = Object.keys(document.states);

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand">
          <Link className="back-button" href="/characters" aria-label="Back to characters">
            <ArrowLeft size={15} />
          </Link>
          <span className="brand-mark">
            <Sparkles size={15} />
          </span>
          <strong>NX Alive</strong>
          <span>Character Studio</span>
          <em>Gate 0</em>
        </div>

        <div className="top-actions">
          <button className="ghost" type="button">
            Docs
          </button>
          <button className="primary" type="button">
            <Play size={14} fill="currentColor" />
            Preview
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="library panel">
          <div className="panel-title">
            <div>
              <small>Library</small>
              <h2>Characters</h2>
            </div>
            <button className="square" aria-label="New character" type="button">
              <Plus size={16} />
            </button>
          </div>

          <button className="character-card active" type="button">
            <span className="thumb">
              <Character document={document} state="idle" />
            </span>
            <span>
              <strong>{document.name}</strong>
              <small>First stress test</small>
            </span>
          </button>

          <button className="new-card" type="button">
            <Plus size={18} />
            New character
          </button>

          <div className="gate-note">
            <WandSparkles size={16} />
            <p>
              Gate 1 unlocks direct manipulation, transform handles and saving
              back to <code>.character.json</code>.
            </p>
          </div>
        </aside>

        <section className="viewport-panel">
          <div className="viewport-toolbar">
            <div className="tools">
              <button className="tool active" type="button" aria-label="Select">
                <MousePointer2 size={15} />
              </button>
              <button className="tool" type="button" aria-label="Shapes">
                <Shapes size={15} />
              </button>
              <button className="tool" type="button" aria-label="Layers">
                <Layers3 size={15} />
              </button>
            </div>

            <button className="state-picker" type="button">
              <span className="online-dot" />
              {state}
              <ChevronDown size={13} />
            </button>
          </div>

          <div className="viewport">
            <div className="grid" />
            <div className="halo" />
            <div className="character-stage">
              <div className="playing">
                <span className="online-dot" />
                PLAYING <strong>{state}</strong>
              </div>
              <Character
                document={document}
                state={state}
                className="hero-character"
              />
              <span className="axis">X · Y · Z</span>
            </div>
          </div>

          <div className="state-strip">
            {states.map((item) => (
              <button
                key={item}
                className={item === state ? "state-card active" : "state-card"}
                onClick={() => setState(item)}
                type="button"
              >
                <Character document={document} state={item} />
                <span>{item}</span>
              </button>
            ))}
          </div>

          <nav className="mode-tabs" aria-label="Editor mode">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={id === mode ? "mode active" : "mode"}
                onClick={() => setMode(id)}
                type="button"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </section>

        <aside className="inspector panel">
          <div className="panel-title">
            <div>
              <small>Scene</small>
              <h2>Parts</h2>
            </div>
            <Box size={17} />
          </div>

          <div className="part-tree">
            {document.parts.map((part) => (
              <button
                key={part.id}
                className={part.id === selectedPart ? "part active" : "part"}
                style={{ paddingLeft: part.parentId ? 28 : 12 }}
                onClick={() => setSelectedPart(part.id)}
                type="button"
              >
                <span />
                {part.name}
              </button>
            ))}
          </div>

          <div className="inspector-card">
            <small>Inspector</small>
            <h3>{selected?.name ?? "Nothing selected"}</h3>

            {selected ? (
              <>
                <div className="properties">
                  <label>
                    X <output>{selected.transform.x}</output>
                  </label>
                  <label>
                    Y <output>{selected.transform.y}</output>
                  </label>
                  <label>
                    Scale X <output>{selected.transform.scaleX}</output>
                  </label>
                  <label>
                    Scale Y <output>{selected.transform.scaleY}</output>
                  </label>
                  <label className="wide">
                    Rotation <output>{selected.transform.rotation}°</output>
                  </label>
                </div>

                <div className="shape-meta">
                  <span>Shape</span>
                  <strong>{selected.shape.kind}</strong>
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
