import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { allTagsAtom, imagesAtom, selectedImageAtom } from "@client//atoms";
import { Buttons, ImageList, ImagePreview, Tags } from "@client/components";
import { CaptionEntries } from "@client/components/CaptionEntries";
import DirectorySelector from "@client/components/DirectorySelector";
import Box from "@mui/joy/Box";
import Grid from "@mui/joy/Grid";
import Stack from "@mui/joy/Stack";
import { getImages } from "@server/getImages";
import { useAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import Papa from "papaparse";
import React, { useEffect } from "react";

import type { BooruItem, ImageModel } from ".types/client";

// Atom for the current image

export default function Page({
	images: initialImages,
	booru,
}: {
	images: ImageModel[];
	booru: BooruItem[];
}) {
	const [, setAllTags] = useAtom(allTagsAtom);
	const [, setImages] = useAtom(imagesAtom);
	const [selectedImage] = useAtom(selectedImageAtom);

	useEffect(() => {
		setImages(initialImages);
	}, [initialImages, setImages]);

	useEffect(() => {
		setAllTags(booru);
	}, [booru, setAllTags]);

	return (
		<Stack sx={{ height: "100%" }}>
			<DirectorySelector />

			<Grid container columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ flex: 1 }}>
				<Grid
					xs={1}
					lg={2}
					sx={{ display: "flex", flexDirection: "column", maxWidth: "50vh" }}
				>
					<ImagePreview />
					<ImageList />
				</Grid>
				<Grid xs={1} md sx={{ display: "flex", flexDirection: "column" }}>
					{selectedImage && (
						<Box sx={{ display: "flex" }}>
							<CaptionEntries />
							<Buttons />
						</Box>
					)}
					<Tags />
				</Grid>
			</Grid>
		</Stack>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const { selectedDirectory } = context.req.cookies;
	const images = selectedDirectory ? await getImages(selectedDirectory) : [];

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
	const csvTags = results.data.slice(0, 1_000).map(item => ({
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
