import { createId } from "./id";
import { renderCharacterSvg, type RenderOptions } from "./render";
import { parseCharacterDocument } from "./validate";
export function mountCharacter(
  element: HTMLElement,
  document: unknown,
  options: RenderOptions = {},
) {
  const character = parseCharacterDocument(document);
  const id = createId("nx");
  let state = { ...options, id };
  const render = () => {
    element.innerHTML = renderCharacterSvg(character, state);
  };
  render();
  return {
    update(next: RenderOptions) {
      state = { ...state, ...next, id };
      render();
    },
    destroy() {
      element.replaceChildren();
    },
  };
}
export { parseCharacterDocument, renderCharacterSvg };
