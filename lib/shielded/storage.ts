"use client";

import { EncodedNote } from "@/types/encodedNote.types";

const key = "zkVault::notes";

export const saveNote = (note: EncodedNote): void => {
  const encoded = btoa(
    JSON.stringify({
      ...note,
      value: note.value.toString(),
      pk: note.pk.toString(),
      random: note.random.toString(),
      nullifier: note.nullifier.toString(),
    }),
  );
  const baseUrl = window.location.origin;

  // create link
  const noteLink = `${baseUrl}?note=${encoded}`;
  const notes = getNotes();

  window.localStorage.setItem(key, JSON.stringify([noteLink, ...notes]));
};

export const getNotes = (): string[] => {
  const notesRaw = window.localStorage.getItem(key);
  if (!notesRaw) return [];

  return JSON.parse(notesRaw);
};

export const parseEncodedNote = (urlNote: string): EncodedNote | null => {
    const urlObj = new URL(urlNote);
    const noteParam = urlObj.searchParams.get("note");
    if (!noteParam) return null;

    const tmp =  JSON.parse(atob(noteParam));
	return {
		...tmp,
      value: BigInt(tmp.value),
      pk: BigInt(tmp.pk),
      random: BigInt(tmp.random),
      nullifier: BigInt(tmp.nullifier)
	}
}
