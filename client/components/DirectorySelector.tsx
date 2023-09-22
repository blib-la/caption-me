import { allTagsAtom, imagesAtom, selectedImageAtom } from "@client/atoms";
import FolderIcon from "@mui/icons-material/Folder";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import { Input, Sheet, Tooltip } from "@mui/joy";
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

	const deleteCache = async () => {
		setSelectedImage(null);
		try {
			await axios.post("/api/delete-cache", { directory: path });
			await reload();
		} catch (error) {
			console.error("Failed to delete cache:", error);
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
			<Input
				fullWidth
				value={path}
				aria-label="Enter the path to the folder"
				startDecorator={
					<Tooltip disableInteractive title="Select Directory">
						<IconButton aria-label="select directory" onClick={selectDirectory}>
							<FolderIcon />
						</IconButton>
					</Tooltip>
				}
				endDecorator={
					<Tooltip disableInteractive title="Load Directory">
						<IconButton aria-label="load directory" onClick={reload}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				}
				onChange={event => {
					setPath(normalizeWindowsPath(event.target.value));
				}}
			/>
			<Tooltip disableInteractive title="Delete Cache">
				<IconButton aria-label="delete cache" onClick={deleteCache}>
					<ReplayIcon />
				</IconButton>
			</Tooltip>
		</Sheet>
	);
};

export default DirectorySelector;
