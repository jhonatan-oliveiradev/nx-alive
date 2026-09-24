import { characterSchema, type CharacterDocument } from "./schema";
export class CharacterValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join("; "));
    this.name = "CharacterValidationError";
  }
}
export function validateCharacterDocument(value: unknown): string[] {
  const result = characterSchema.safeParse(value);
  return result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}
export function parseCharacterDocument(value: unknown): CharacterDocument {
  const result = characterSchema.safeParse(value);
  if (!result.success)
    throw new CharacterValidationError(validateCharacterDocument(value));
  return result.data;
}
export function serializeCharacter(document: CharacterDocument) {
  return JSON.stringify(parseCharacterDocument(document), null, 2);
}
