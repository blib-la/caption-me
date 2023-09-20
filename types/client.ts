import type React from "react";

export interface ImageModel {
	id: string;
	fullPath: string;
	publicPath: string;
	height: number;
	width: number;
	caption: string[];
}

export interface ImageRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		images: ImageModel[];
	};
}

export interface CaptionRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		captions: string[];
	};
}

export interface BooruItem {
	tagName: string;
	unknownColumn: string;
	score: string;
	aliases: string;
}

export interface TagRowProps {
	index: number;
	style: React.CSSProperties;
	data: {
		tags: BooruItem[];
	};
}
