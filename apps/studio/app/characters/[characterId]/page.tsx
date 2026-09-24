import { CharacterStudio } from '@/features/character-editor/character-studio';
export default async function CharacterPage({params}:{params:Promise<{characterId:string}>}){const {characterId}=await params;return <CharacterStudio initialId={characterId}/>;}
