import { atom } from "jotai";

import type { BooruItem, ImageModel } from ".types/client";

export const selectedImageAtom = atom<ImageModel | null>(null);
export const selectedCaptionAtom = atom<number>(-1);
export const allTagsAtom = atom<BooruItem[]>([]);
// Atom for all images
export const imagesAtom = atom<ImageModel[]>([]);
// Atom to store the history of the images
// History atom
export const historyAtom = atom<{
	states: ImageModel[];
	pointer: number;
	baseState: ImageModel | null;
}>({
	states: [],
	pointer: -1,
	baseState: null,
});
