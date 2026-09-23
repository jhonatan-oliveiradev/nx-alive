import Link from "next/link";

import { pingCharacter } from "@nx-alive/presets";
import { Character } from "@nx-alive/react";
import { Plus, Sparkles } from "lucide-react";

export const metadata = {
  title: "Characters",
};

export default function CharactersPage() {
  return (
    <main className="library-page">
      <header className="library-page-header">
        <div>
          <span className="eyebrow">NX Alive Studio</span>
          <h1>Your characters</h1>
          <p>Create, animate and ship characters as product components.</p>
        </div>

        <button className="primary" type="button">
          <Plus size={15} />
          New character
        </button>
      </header>

      <section className="character-grid" aria-label="Character library">
        <Link className="library-character-card" href="/characters/ping">
          <div className="library-character-preview">
            <Character document={pingCharacter} state="idle" />
          </div>
          <div className="library-character-meta">
            <div>
              <strong>PING</strong>
              <span>7 states · first stress test</span>
            </div>
            <Sparkles size={16} />
          </div>
        </Link>

        <button className="library-create-card" type="button">
          <Plus size={22} />
          <strong>Create character</strong>
          <span>Gate 1 will make this flow interactive.</span>
        </button>
      </section>
    </main>
  );
}
