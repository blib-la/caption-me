import { allTagsAtom } from "@client/atoms";
import { filter, renderRow } from "@client/components/index";
import { MasonryContainer } from "@client/components/MasonryContainer";
import { useHistoryImage } from "@client/hooks";
import type { ClientRect } from "@dnd-kit/core";
import type { SortingStrategy } from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { Popper } from "@mui/base/Popper";
import StyleIcon from "@mui/icons-material/Style";
import type { AutocompleteRenderGetTagProps } from "@mui/joy";
import { Chip, ChipDelete } from "@mui/joy";
import Autocomplete from "@mui/joy/Autocomplete";
import AutocompleteListbox from "@mui/joy/AutocompleteListbox";
import Box from "@mui/joy/Box";
import { useAtom } from "jotai";
import type { HTMLProps, ReactNode } from "react";
import React from "react";
import { FixedSizeList as List } from "react-window";

const defaultScale = {
	scaleX: 1,
	scaleY: 1,
};

function getItemGap(rects: ClientRect[], index: number, activeIndex: number) {
	const currentRect: ClientRect | undefined = rects[index];
	const previousRect: ClientRect | undefined = rects[index - 1];
	const nextRect: ClientRect | undefined = rects[index + 1];

	if (!currentRect || (!previousRect && !nextRect)) {
		return 0;
	}

	if (activeIndex < index) {
		return previousRect
			? currentRect.left - (previousRect.left + previousRect.width)
			: nextRect.left - (currentRect.left + currentRect.width);
	}

	return nextRect
		? nextRect.left - (currentRect.left + currentRect.width)
		: currentRect.left - (previousRect.left + previousRect.width);
}

export const horizontalWrapStrategy: SortingStrategy = ({
	rects,
	activeNodeRect: fallbackActiveRect,
	activeIndex,
	overIndex,
	index,
}) => {
	const activeNodeRect = rects[activeIndex] ?? fallbackActiveRect;

	if (!activeNodeRect) {
		return null;
	}

	const newRects = arrayMove(rects, overIndex, activeIndex);

	const oldRect = rects[index];
	const newRect = newRects[index];

	const itemGap = getItemGap(rects, index, activeIndex);

	if (index === activeIndex) {
		const newIndexRect = rects[overIndex];

		if (!newIndexRect) {
			return null;
		}

		return {
			x:
				activeIndex < overIndex
					? newIndexRect.left +
					  newIndexRect.width -
					  (activeNodeRect.left + activeNodeRect.width)
					: newIndexRect.left - activeNodeRect.left,
			y: newRect.top - (oldRect.top - (newRect.height - oldRect.height)),
			...defaultScale,
		};
	}

	if (index > activeIndex && index <= overIndex) {
		return {
			x: -activeNodeRect.width - itemGap,
			y: newRect.top - (oldRect.top - (newRect.height - oldRect.height)),
			...defaultScale,
		};
	}

	if (index < activeIndex && index >= overIndex) {
		return {
			x: activeNodeRect.width + itemGap,
			y: newRect.top - (oldRect.top - (newRect.height - oldRect.height)),
			...defaultScale,
		};
	}

	return {
		x: 0,
		y: newRect.top - (oldRect.top - (newRect.height - oldRect.height)),
		...defaultScale,
	};
};

export const OuterElementContext = React.createContext({});
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
export const ListboxComponent = React.forwardRef<
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

interface SortableItemProps extends HTMLProps<HTMLDivElement> {
	id: string;
	children?: ReactNode;
	getTagProps: AutocompleteRenderGetTagProps;
	index: number;
}
export function SortableItem({ children, getTagProps, index }: SortableItemProps) {
	return (
		<Chip
			endDecorator={<ChipDelete {...getTagProps({ index })} />}
			sx={{
				borderRadius: 4,
			}}
		>
			{children}
		</Chip>
	);
}

export function CaptionEntries() {
	const [selectedImage, setSelectedImage] = useHistoryImage();
	const [allTags, setAllTags] = useAtom(allTagsAtom);

	return (
		<Box sx={{ flex: 1, p: 1 }}>
			{selectedImage && (
				<Autocomplete
					disableListWrap
					freeSolo
					multiple
					variant="plain"
					value={selectedImage?.caption ?? []}
					startDecorator={<StyleIcon />}
					renderTags={(tags, getTagProps) => (
						<MasonryContainer
							onSort={(oldIndex, newIndex) => {
								setSelectedImage({
									...selectedImage,
									caption: arrayMove(selectedImage.caption, oldIndex, newIndex),
								});
							}}
						>
							{tags.map((item, index) => (
								<SortableItem
									key={item}
									id={item}
									getTagProps={getTagProps}
									index={index}
								>
									{item}
								</SortableItem>
							))}
						</MasonryContainer>
					)}
					filterOptions={(options, params) => {
						const filtered = filter(options, params);
						const { inputValue } = params;
						const isExisting = options.some(
							option =>
								inputValue.trim().toLowerCase() === option.trim().toLowerCase()
						);
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
					sx={{
						width: "100%",
						alignItems: "flex-start",
						py: 1,
						".MuiAutocomplete-clearIndicator": { alignSelf: "unset", mt: -0.5 },
					}}
					onChange={(_event, caption) => {
						setSelectedImage({
							...selectedImage,
							caption: caption.flatMap(term => term.split(",")),
						});
					}}
					onBlur={() => {
						setAllTags(previousTags => {
							const combinedTags = [
								...previousTags,
								...(selectedImage?.caption.map(tagName => ({
									tagName: tagName.replace(/_/g, " "),
									score: "0",
									unknownColumn: "0",
									aliases: "",
								})) ?? []),
							];

							return Array.from(
								combinedTags
									.reduce((map, tag) => map.set(tag.tagName, tag), new Map())
									.values()
							);
						});
					}}
				/>
			)}
		</Box>
	);
}
