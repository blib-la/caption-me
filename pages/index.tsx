import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { Popper } from "@mui/base/Popper";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpIcon from "@mui/icons-material/ArrowUpward";
import HistoryIcon from "@mui/icons-material/History";
import RemoveIcon from "@mui/icons-material/Remove";
import SaveIcon from "@mui/icons-material/Save";
import StyleIcon from "@mui/icons-material/Style";
import Autocomplete, { createFilterOptions } from "@mui/joy/Autocomplete";
import AutocompleteListbox from "@mui/joy/AutocompleteListbox";
import AutocompleteOption from "@mui/joy/AutocompleteOption";
import Box from "@mui/joy/Box";
import Grid from "@mui/joy/Grid";
import IconButton from "@mui/joy/IconButton";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { globby } from "globby";
import { atom } from "jotai";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";
import Image from "next/image";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import type { ListChildComponentProps } from "react-window";
import { FixedSizeList as List } from "react-window";
import sharp from "sharp";

import DirectorySelector from "@/components/DirectorySelector";

// Atom for the selected image
export const selectedImageAtom = atom<ImageModel | null>(null);
export const selectedCaptionAtom = atom<number>(-1);
export const allTagsAtom = atom<BooruItem[]>([]);

// Atom for all images
export const imagesAtom = atom<ImageModel[]>([]);

// Atom to store the history of the images
const imagesHistoryAtom = atom<{ past: ImageModel[][]; future: ImageModel[][] }>({
	past: [],
	future: [],
});

export function useHistoryImages() {
	const [images, setImages] = useAtom(imagesAtom);
	const [history, setHistory] = useAtom(imagesHistoryAtom);

	const undo = () => {
		if (history.past.length === 0) {
			return;
		}

		const newPast = [...history.past];
		const newFuture = [images, ...history.future];

		setImages(newPast.pop() as ImageModel[]);
		setHistory({ past: newPast, future: newFuture });
	};

	const redo = () => {
		if (history.future.length === 0) {
			return;
		}

		const newPast = [images, ...history.past];
		const newFuture = [...history.future];

		setImages(newFuture.shift() as ImageModel[]);
		setHistory({ past: newPast, future: newFuture });
	};

	const updateImages = (newImages: ImageModel[]) => {
		const newPast = [images, ...history.past];

		setImages(newImages);
		setHistory({ past: newPast, future: [] }); // Reset future when new data is added
	};

	return [images, updateImages, { undo, redo }];
}

// Atom for the current image

interface ImageModel {
	id: string;
	fullPath: string;
	publicPath: string;
	height: number;
	width: number;
	caption: string[];
	modified?: boolean;
}

interface ImageRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		images: ImageModel[];
	};
}

interface CaptionRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		captions: string[];
	};
}

interface BooruItem {
	tagName: string;
	unknownColumn: string;
	score: string;
	aliases: string;
}
interface TagRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		tags: BooruItem[];
	};
}

export function useUpdateAndSwitchImage() {
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const [images, setImages] = useAtom(imagesAtom);
	const [, setCaption] = useAtom(selectedCaptionAtom);

	const updateAndSwitch = (newImage: ImageModel) => {
		if (selectedImage) {
			// Update the current image in the images list
			const updatedImages = images.map(img =>
				img.id === selectedImage.id ? selectedImage : img
			);
			setImages(updatedImages);
			setCaption(-1);
		}

		// Switch to the new image
		setSelectedImage(newImage);
	};

	return updateAndSwitch;
}

function renderRow(props: ListChildComponentProps) {
	const { data, index, style } = props;
	const dataSet = data[index];
	const inlineStyle = {
		...style,
		padding: 0,
		top: (style.top as number) + 6,
	};

	return (
		<AutocompleteOption component="div" style={inlineStyle}>
			{dataSet}
		</AutocompleteOption>
	);
}

function ImageRow({ index, style, data }: ImageRowProps) {
	const image = data.images[index];
	const updateAndSwitch = useUpdateAndSwitchImage();
	return (
		<ListItem style={style}>
			<ListItemButton
				onClick={() => {
					updateAndSwitch(image);
				}}
			>
				<Image
					src={image.publicPath}
					alt={`Image ${index}`}
					width={image.width}
					height={image.height}
					style={{ objectFit: "contain", height: 142, width: 142 }}
				/>
				<Typography sx={{ pl: 2 }}>Image {index + 1}</Typography>
			</ListItemButton>
		</ListItem>
	);
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
	const outerProps = React.useContext(OuterElementContext);
	return (
		<AutocompleteListbox
			{...props}
			{...outerProps}
			component="div"
			ref={ref}
			sx={{
				"& ul": {
					padding: 0,
					margin: 0,
					flexShrink: 0,
				},
			}}
		/>
	);
});

const ListboxComponent = React.forwardRef<
	HTMLDivElement,
	{
		anchorEl: any;
		open: boolean;
		modifiers: any[];
	} & React.HTMLAttributes<HTMLElement>
>(function (props, ref) {
	const { children, anchorEl, open, modifiers, ...other } = props;
	const itemData: Array<any> = [];
	(children as [Array<{ children: Array<React.ReactElement> | undefined }>])[0].forEach(item => {
		if (item) {
			itemData.push(item);
			itemData.push(...(item.children || []));
		}
	});

	const itemCount = itemData.length;
	const itemSize = 50;

	return (
		<Popper ref={ref} anchorEl={anchorEl} open={open} modifiers={modifiers}>
			<OuterElementContext.Provider value={other}>
				<List
					itemData={itemData}
					height={itemSize * 8}
					width="100%"
					outerElementType={OuterElementType}
					innerElementType="ul"
					itemSize={itemSize}
					overscanCount={5}
					itemCount={itemCount}
				>
					{renderRow}
				</List>
			</OuterElementContext.Provider>
		</Popper>
	);
});

const filter = createFilterOptions<string>();

function CaptionRow({ index, style, data }: CaptionRowProps) {
	const initialCaption = data.captions[index];
	const [caption, setCaption] = useState(initialCaption);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const [selectedCaption, setSelectedCaption] = useAtom(selectedCaptionAtom);
	const [allTags, setAllTags] = useAtom(allTagsAtom);
	const handleTagCreation = (tag: string) => {
		// Add the new tag to the allTagsAtom
		if (!allTags.some(({ tagName }) => tagName === tag)) {
			setAllTags(prevTags => [
				{ tagName: tag, aliases: "", score: "0", unknownColumn: "0" },
				...prevTags,
			]);
		}
	};

	const handleInputChange = (event: any, newValue: any) => {
		if (typeof newValue === "string") {
			handleTagCreation(newValue);
			if (selectedImage) {
				const updatedCaptions = [...selectedImage.caption];
				updatedCaptions[index] = newValue;
				setSelectedImage({
					...selectedImage,
					modified: true,
					caption: updatedCaptions,
				});
			}
		} else if (newValue && newValue.inputValue) {
			handleTagCreation(newValue.inputValue);
		}
	};

	useEffect(() => {
		setCaption(selectedImage?.caption[index] || "");
	}, [selectedImage, index]);

	const handleInputBlur = () => {
		if (selectedImage) {
			// Create a copy of the caption array and update the caption at the current index
			const updatedCaptions = [...selectedImage.caption];
			updatedCaptions[index] = caption;

			// Update the selectedImage with the new captions
			setSelectedImage({
				...selectedImage,
				caption: updatedCaptions,
			});
		}
	};

	return (
		<ListItem style={style}>
			<ListItemButton component="label" tabIndex={-1} selected={selectedCaption === index}>
				<Autocomplete
					disableListWrap
					freeSolo
					variant="plain"
					value={caption}
					startDecorator={<StyleIcon />}
					filterOptions={(options, params) => {
						const filtered = filter(options, params);
						const { inputValue } = params;
						const isExisting = options.some(option => inputValue === option);
						if (inputValue !== "" && !isExisting) {
							filtered.push(inputValue);
						}

						return filtered;
					}}
					options={allTags.map(tag => tag.tagName)} // Assuming allTags is an array of objects with a tagName property
					getOptionDisabled={option => Boolean(selectedImage?.caption.includes(option))}
					slots={{
						listbox: ListboxComponent,
					}}
					slotProps={{
						listbox: {
							variant: "plain",
						},
					}}
					sx={{ width: "100%" }}
					onChange={handleInputChange}
					onBlur={handleInputBlur}
					onFocus={() => {
						setSelectedCaption(index);
					}}
				/>
			</ListItemButton>
		</ListItem>
	);
}

function TagRow({ index, style, data }: TagRowProps) {
	const tag = data.tags[index];
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);

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

export default function Page({
	images: initialImages,
	booru,
}: {
	images: ImageModel[];
	booru: BooruItem[];
}) {
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const [selectedCaption, setSelectedCaption] = useAtom(selectedCaptionAtom);
	const [allTags, setAllTags] = useAtom(allTagsAtom);
	const [images, setImages] = useAtom(imagesAtom);

	useEffect(() => {
		setImages(initialImages);
	}, [initialImages, setImages]);

	useEffect(() => {
		setAllTags(booru);
	}, [booru, setAllTags]);

	return (
		<Stack sx={{ height: "100%" }}>
			<DirectorySelector />

			<Grid container columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }} sx={{ flex: 1 }}>
				<Grid xs={1} lg={2} sx={{ display: "flex", flexDirection: "column" }}>
					{selectedImage && (
						<Box sx={{ bp: "100%", position: "relative" }}>
							<Image
								src={selectedImage.publicPath}
								alt=""
								width={selectedImage.width}
								height={selectedImage.height}
								style={{ objectFit: "contain", width: "100%", height: "100%" }}
							/>
						</Box>
					)}

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
				</Grid>
				<Grid xs={1} xl={2} sx={{ display: "flex" }}>
					<Box sx={{ flex: 1, position: "relative" }}>
						<AutoSizer>
							{({ height, width }) => (
								<List
									height={height}
									innerElementType="ul"
									itemCount={selectedImage ? selectedImage.caption.length : 0}
									itemSize={50} // Adjust according to your preference
									width={width}
									itemData={{
										captions: selectedImage ? selectedImage.caption : [],
									}}
								>
									{CaptionRow}
								</List>
							)}
						</AutoSizer>
					</Box>
					<Stack spacing={1} sx={{ p: 1 }}>
						<IconButton
							disabled={!selectedImage}
							color="success"
							variant="solid"
							onClick={() => {
								if (selectedImage) {
									setSelectedImage({
										...selectedImage,
										caption: [...selectedImage.caption, ""],
									});
								}
							}}
						>
							<AddIcon />
						</IconButton>

						<IconButton
							color="danger"
							variant="solid"
							disabled={selectedCaption < 0}
							onClick={() => {
								if (selectedImage && selectedCaption > -1) {
									setSelectedCaption(
										selectedCaption === selectedImage.caption.length - 1
											? selectedCaption - 1
											: selectedCaption
									);
									setSelectedImage({
										...selectedImage,
										caption: selectedImage.caption.filter(
											(_, index) => index !== selectedCaption
										),
									});
								}
							}}
						>
							<RemoveIcon />
						</IconButton>
						<IconButton
							disabled={!selectedImage || selectedCaption <= 0}
							color="neutral"
							variant="solid"
							onClick={() => {
								if (selectedImage && selectedCaption > 0) {
									const updatedCaptions = [...selectedImage.caption];
									[
										updatedCaptions[selectedCaption - 1],
										updatedCaptions[selectedCaption],
									] = [
										updatedCaptions[selectedCaption],
										updatedCaptions[selectedCaption - 1],
									];
									setSelectedCaption(selectedCaption - 1);
									setSelectedImage({
										...selectedImage,
										modified: true,
										caption: updatedCaptions,
									});
								}
							}}
						>
							<ArrowUpIcon />
						</IconButton>
						<IconButton
							disabled={
								!selectedImage ||
								selectedCaption >= selectedImage.caption.length - 1 ||
								selectedCaption < 0
							}
							color="neutral"
							variant="solid"
							onClick={() => {
								if (
									selectedImage &&
									selectedCaption < selectedImage.caption.length - 1
								) {
									const updatedCaptions = [...selectedImage.caption];
									[
										updatedCaptions[selectedCaption + 1],
										updatedCaptions[selectedCaption],
									] = [
										updatedCaptions[selectedCaption],
										updatedCaptions[selectedCaption + 1],
									];
									setSelectedCaption(selectedCaption + 1);
									setSelectedImage({
										...selectedImage,
										modified: true,
										caption: updatedCaptions,
									});
								}
							}}
						>
							<ArrowDownIcon />
						</IconButton>
						<IconButton
							disabled={!selectedImage?.modified}
							color="primary"
							variant="solid"
							onClick={() => {
								if (selectedImage) {
									// Update the current image in the images list
									const updatedImages = images.map(image =>
										image.id === selectedImage.id
											? { ...selectedImage, modified: undefined }
											: image
									);
									setImages(updatedImages);
									setSelectedImage({ ...selectedImage, modified: false });
								}
							}}
						>
							<SaveIcon />
						</IconButton>

						<IconButton
							disabled={!selectedImage?.modified}
							color="primary"
							variant="solid"
							onClick={() => {
								if (selectedImage) {
									// Todo, revert to original value

									setSelectedImage({ ...selectedImage, modified: false });
								}
							}}
						>
							<HistoryIcon />
						</IconButton>
					</Stack>
				</Grid>
				<Grid xs={1} sm={2} md={1}>
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
				</Grid>
			</Grid>
		</Stack>
	);
}

export async function getServerSideProps() {
	const imagePaths = await globby(
		["./public/dataset/*/*.png", "./public/dataset/*/*.jpeg", "./public/dataset/*/*.jpg"],
		{ cwd: process.cwd() }
	);

	const images = await Promise.all(
		imagePaths.map(async fullPath => {
			const publicPath = fullPath.split("public").pop();
			const captionPath = fullPath.replace(/\.(jpe?g|png)$/, ".txt");
			console.log(`${captionPath}`);
			const caption: string[] = [];
			try {
				const existingCaption = await fs.readFile(captionPath, "utf-8");
				caption.push(
					...existingCaption
						.trim()
						.toLowerCase()
						.split(",")
						.map(value => value.trim().replace(/\s+/, " "))
				);
			} catch {
				console.log(`no caption found for file ${fullPath}`);
			}

			// Use sharp to get the dimensions of the image
			const { width, height } = await sharp(fullPath).metadata();

			return {
				id: nanoid(),
				fullPath,
				publicPath,
				width,
				height,
				caption: caption.filter(Boolean),
			} as ImageModel;
		})
	);

	// Read and parse the CSV file
	const csvFilePath = path.join(process.cwd(), "data", "danbooru.csv");
	const csvContent = await fs.readFile(csvFilePath, "utf8");
	const results = Papa.parse<BooruItem>(csvContent, { header: true });
	const imageTags = images.flatMap(image =>
		image.caption.map(tagName => ({
			tagName: tagName.replace(/_/g, " "), // Replace underscores with spaces
			score: "0",
			unknownColumn: "0",
			aliases: "",
		}))
	);

	// Convert CSV tags, replacing underscores with spaces
	const csvTags = results.data.slice(0, 10_000).map(item => ({
		...item,
		tagName: item.tagName.replace(/_/g, " "),
	}));

	const seenTags = new Set();
	const finalTags: BooruItem[] = [];

	// Add unique booru tags
	for (const tag of csvTags) {
		if (!seenTags.has(tag.tagName)) {
			seenTags.add(tag.tagName);
			finalTags.push(tag);
		}
	}

	// Add unique image tags not in the booru list
	for (const tag of imageTags) {
		if (!seenTags.has(tag.tagName)) {
			seenTags.add(tag.tagName);
			finalTags.unshift(tag);
		}
	}

	return {
		props: {
			images,
			booru: finalTags,
		},
	};
}
