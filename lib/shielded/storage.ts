import { EncodedNote } from "@/types/encodedNote.types";

const key = "zkVault::notes";

export const saveNote = (note: EncodedNote): void => {
  const encoded = btoa(JSON.stringify(note));
  const baseUrl = window.location.origin;

  // create link
  const noteLink = `${baseUrl}?note=${encoded}`;
  const notes = getNotes();

  window.localStorage.setItem(key, [noteLink, ...notes].toString());
};

export const getNotes = (): string[] => {
  const notesRaw = window.localStorage.getItem(key);
  if (!notesRaw) return [];

  return JSON.parse(notesRaw);
};
