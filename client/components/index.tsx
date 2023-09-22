// Atom for the selected image
import { allTagsAtom, imagesAtom } from "@client//atoms";
import { useHistoryImage, useUpdateAndSwitchImage } from "@client/hooks";
import CheckIcon from "@mui/icons-material/Check";
import HistoryIcon from "@mui/icons-material/History";
import RemoveIcon from "@mui/icons-material/Remove";
import SaveIcon from "@mui/icons-material/Save";
import UpdateIcon from "@mui/icons-material/Update";
import { Badge } from "@mui/joy";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import axios from "axios";
import { useAtom } from "jotai";
import Image from "next/image";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import type { ImageRowProps, TagRowProps } from ".types/client";

export function ImageRow({ index, style, data }: ImageRowProps) {
	const image = data.images[index];
	const [selectedImage] = useHistoryImage();
	const updateAndSwitch = useUpdateAndSwitchImage();
	const caption = image.caption.filter(Boolean).join(", ").trim();
	return (
		<ListItem style={style}>
			<ListItemButton
				selected={image.id === selectedImage?.id}
				onClick={async () => {
					await updateAndSwitch(image);
				}}
			>
				<Badge
					color={caption.length ? "success" : "danger"}
					badgeContent={caption.length ? <CheckIcon /> : <RemoveIcon />}
					size="lg"
					sx={{ mt: 3, mr: 3 }}
				>
					<Image
						src={image.publicPath}
						alt={`Image ${index}`}
						width={image.width}
						height={image.height}
						style={{ objectFit: "contain", height: 142, width: 142 }}
					/>
				</Badge>
				<Box sx={{ flex: 1, alignSelf: "stretch", pl: 2 }}>
					<Typography level="body-lg" sx={{ mb: 2 }}>
						Image {index + 1}
					</Typography>
					<Typography sx={{ mt: 2 }}>{caption}</Typography>
				</Box>
			</ListItemButton>
		</ListItem>
	);
}

export function TagRow({ index, style, data }: TagRowProps) {
	const tag = data.tags[index];
	const [selectedImage, setSelectedImage] = useHistoryImage();

	const handleTagClick = () => {
		if (selectedImage) {
			const humanized = tag.tagName.replace(/_/g, " ");
			// Add the tag to the selectedImage's caption array if it's not already there
			if (!selectedImage.caption.includes(humanized)) {
				setSelectedImage({
					...selectedImage,
					caption: [...selectedImage.caption, humanized],
				});
			}
		}
	};

	return (
		<ListItem style={style}>
			<ListItemButton onClick={handleTagClick}>
				<Typography sx={{ p: 1 }}>{tag.tagName}</Typography>
			</ListItemButton>
		</ListItem>
	);
}

export function Buttons() {
	const [selectedImage, , api] = useHistoryImage();
	const [images, setImages] = useAtom(imagesAtom);

	return (
		<Stack spacing={1} sx={{ p: 1 }}>
			<IconButton
				// Disabled={!api.modifiedSinceFlush}
				color="primary"
				variant="solid"
				onClick={async () => {
					if (selectedImage) {
						// Update the current image in the images list
						const updatedImages = images.map(image =>
							image.id === selectedImage.id ? selectedImage : image
						);
						setImages(updatedImages);
						await axios.post(`/api/files/${selectedImage.id}/update`, {
							content: selectedImage.caption.join(", "),
						});
						api.flush();
					}
				}}
			>
				<SaveIcon />
			</IconButton>

			<IconButton
				disabled={!api.hasPast}
				color="primary"
				variant="solid"
				onClick={() => {
					if (selectedImage) {
						api.undo();
					}
				}}
			>
				<HistoryIcon />
			</IconButton>
			<IconButton
				disabled={!api.hasFuture}
				color="primary"
				variant="solid"
				onClick={() => {
					if (selectedImage) {
						api.redo();
					}
				}}
			>
				<UpdateIcon />
			</IconButton>
		</Stack>
	);
}

export function ImageList() {
	const [images] = useAtom(imagesAtom);

	return (
		<Box sx={{ flex: 1, position: "relative" }}>
			<AutoSizer>
				{({ height, width }) => (
					<List
						innerElementType="ul"
						height={height}
						itemCount={images.length}
						itemSize={150}
						width={width}
						itemData={{ images }}
					>
						{ImageRow}
					</List>
				)}
			</AutoSizer>
		</Box>
	);
}

export function ImagePreview() {
	const [selectedImage] = useHistoryImage();
	return (
		selectedImage && (
			<Box sx={{ pb: "100%", position: "relative" }}>
				<Image
					src={selectedImage.publicPath}
					alt=""
					width={selectedImage.width}
					height={selectedImage.height}
					style={{
						position: "absolute",
						inset: 0,
						objectFit: "contain",
						width: "100%",
						height: "100%",
					}}
				/>
			</Box>
		)
	);
}

export function Tags() {
	const [allTags] = useAtom(allTagsAtom);

	return (
		<Box sx={{ position: "relative", flex: 1 }}>
			<AutoSizer>
				{({ height, width }) => (
					<List
						height={height}
						innerElementType="ul"
						itemCount={allTags.length}
						itemSize={50} // Adjust according to your preference
						width={width}
						itemData={{ tags: allTags }}
					>
						{TagRow}
					</List>
				)}
			</AutoSizer>
		</Box>
	);
}
