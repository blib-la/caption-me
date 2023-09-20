import { allTagsAtom, imagesAtom, selectedImageAtom } from "@client/atoms";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button, Input, Sheet } from "@mui/joy";
import IconButton from "@mui/joy/IconButton";
import axios from "axios";
import { useAtom } from "jotai";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";

import type { ImageModel } from ".types/client";
import type { BooruItem } from ".types/client";

function normalizeWindowsPath(path: string) {
	return path.replace(/\\/g, "/");
}

const DirectorySelector = () => {
	const [, setSelectedImage] = useAtom(selectedImageAtom);
	const [, setImages] = useAtom(imagesAtom);
	const [path, setPath] = useState("");
	const [allTags, setAllTags] = useAtom(allTagsAtom);
	useEffect(() => {
		// On component mount, read the cookie
		const initialPath = Cookies.get("selectedDirectory");
		if (initialPath) {
			setPath(normalizeWindowsPath(initialPath));
		}
	}, []);
	const selectDirectory = async () => {
		setSelectedImage(null);
		try {
			const { data } = await axios.get("/api/select-folder");
			setPath(normalizeWindowsPath(data.path));
			setImages(data.images);
			const imageTags = data.images.flatMap((image: ImageModel) =>
				image.caption.map(tagName => ({
					tagName: tagName.replace(/_/g, " "), // Replace underscores with spaces
					score: "0",
					unknownColumn: "0",
					aliases: "",
				}))
			);

			const seenTags = new Set();
			const finalTags: BooruItem[] = allTags;

			for (const tag of imageTags) {
				if (!seenTags.has(tag.tagName)) {
					seenTags.add(tag.tagName);
					finalTags.unshift(tag);
				}
			}

			setAllTags(finalTags);

			// Set the cookie
			Cookies.set("selectedDirectory", normalizeWindowsPath(data.path), { expires: 7 });
		} catch (error) {
			console.error("Failed to select directory:", error);
		}
	};

	const reload = async () => {
		setSelectedImage(null);
		try {
			const { data } = await axios.post("/api/select-images", { directory: path });
			setImages(data.images);
			const imageTags = data.images.flatMap((image: ImageModel) =>
				image.caption.map(tagName => ({
					tagName: tagName.replace(/_/g, " "), // Replace underscores with spaces
					score: "0",
					unknownColumn: "0",
					aliases: "",
				}))
			);

			const seenTags = new Set();
			const finalTags: BooruItem[] = allTags;

			for (const tag of imageTags) {
				if (!seenTags.has(tag.tagName)) {
					seenTags.add(tag.tagName);
					finalTags.unshift(tag);
				}
			}

			setAllTags(finalTags);

			// Set the cookie
			Cookies.set("selectedDirectory", normalizeWindowsPath(data.path), { expires: 7 });
		} catch (error) {
			console.error("Failed to select directory:", error);
		}
	};

	return (
		<Sheet
			sx={{
				position: "sticky",
				top: 0,
				display: "flex",
				alignItems: "center",
				gap: 2,
				p: 1,
			}}
		>
			<Button onClick={selectDirectory} sx={{ minWidth: "max-content" }}>
				Select Directory
			</Button>
			<Input
				fullWidth
				value={path}
				aria-label="Enter the path to the folder"
				endDecorator={
					<IconButton onClick={reload}>
						<RefreshIcon />
					</IconButton>
				}
				onChange={event => {
					setPath(normalizeWindowsPath(event.target.value));
				}}
			/>
		</Sheet>
	);
};

export default DirectorySelector;
