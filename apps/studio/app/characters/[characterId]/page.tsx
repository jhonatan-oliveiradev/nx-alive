import { notFound } from "next/navigation";

import { pingCharacter } from "@nx-alive/presets";

import { CharacterStudio } from "@/features/character-editor/character-studio";

type CharacterPageProps = {
  params: Promise<{
    characterId: string;
  }>;
};

export function generateStaticParams() {
  return [{ characterId: pingCharacter.id }];
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { characterId } = await params;

  if (characterId !== pingCharacter.id) {
    notFound();
  }

  return <CharacterStudio document={pingCharacter} />;
}
