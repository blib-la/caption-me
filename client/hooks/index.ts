import { historyAtom, imagesAtom, selectedCaptionAtom, selectedImageAtom } from "@client/atoms";
import axios from "axios";
import { useAtom } from "jotai";
import isEqual from "lodash.isequal";
import { useCallback } from "react";

import type { ImageModel } from ".types/client";

export function useHistoryImage() {
	const [state, _setState] = useAtom(selectedImageAtom);
	const [history, setHistory] = useAtom(historyAtom);
	let lastFlushedPointer = 0;

	const flush = useCallback(() => {
		// Set the current state as the only entry in the history
		setHistory({
			states: state ? [state] : [],
			pointer: 0,
			baseState: state,
		});
		lastFlushedPointer = 0;
	}, [state]);

	const setState = useCallback(
		(newState: ImageModel) => {
			if (state?.id !== newState.id) {
				_setState(newState);
				flush();
			} else if (!isEqual(state, newState)) {
				// Update the state and add it to the history only if the new state is different
				_setState(newState);
				setHistory(prev => ({
					...prev,
					states: [...prev.states.slice(0, prev.pointer + 1), newState],
					pointer: prev.pointer + 1,
				}));
			}
		},
		[state, flush]
	);

	const undo = useCallback(() => {
		setHistory(prev => {
			if (prev.pointer <= 0) {
				return prev;
			}

			_setState(prev.states[prev.pointer - 1]);
			return { ...prev, pointer: prev.pointer - 1 };
		});
	}, []);

	const redo = useCallback(() => {
		setHistory(prev => {
			if (prev.pointer === prev.states.length - 1) {
				return prev;
			}

			_setState(prev.states[prev.pointer + 1]);
			return { ...prev, pointer: prev.pointer + 1 };
		});
	}, []);

	const reset = () => {
		if (history.baseState) {
			_setState(history.baseState);
			setHistory({ states: [history.baseState], pointer: 0, baseState: history.baseState });
		}
	};

	const hasPast = history.pointer > 0;
	const hasFuture = history.pointer < history.states.length - 1;
	const isPresent = history.pointer === history.states.length - 1;
	const isPast = history.pointer < history.states.length - 1;
	const initialState = history.pointer === 0;
	const historySize = history.states.length;
	const pointerPosition = history.pointer;
	const canReset = history.pointer !== 0;
	const modifiedSinceFlush = history.pointer !== lastFlushedPointer;

	return [
		state,
		setState,
		{
			undo,
			redo,
			reset,
			flush,
			hasPast,
			hasFuture,
			isPresent,
			isPast,
			initialState,
			historySize,
			pointerPosition,
			canReset,
			modifiedSinceFlush,
		},
	] as const;
}

export function useUpdateAndSwitchImage() {
	const [selectedImage, setSelectedImage] = useHistoryImage();
	const [images, setImages] = useAtom(imagesAtom);
	const [, setCaption] = useAtom(selectedCaptionAtom);

	return async function (newImage: ImageModel) {
		if (selectedImage) {
			// Update the current image in the images list
			const updatedImages = images.map(img =>
				img.id === selectedImage.id ? selectedImage : img
			);
			setImages(updatedImages);
			setCaption(-1);
			await axios.post(`/api/files/${selectedImage.id}/update`, {
				content: selectedImage.caption.join(", "),
			});
		}

		// Switch to the new image
		setSelectedImage(newImage);
	};
}
