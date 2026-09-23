import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <span className="eyebrow">NX Alive</span>
      <h1>Character not found.</h1>
      <p>This character does not exist in the current library.</p>
      <Link className="primary link-button" href="/characters">
        Back to characters
      </Link>
    </main>
  );
}
