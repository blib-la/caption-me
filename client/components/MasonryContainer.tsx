import type { ReactElement } from "react";
import React, { useEffect, useState, useRef } from "react";

type ChildDimension = { index: number; width: number; height: number };
type Position = { top: number; left: number };

export function calculateMasonryLayout(
	containerWidth: number,
	childDimensions: ChildDimension[]
): { positions: Position[]; height: number } {
	const positions: Position[] = [];
	let currentX = 0;
	let currentRowMaxHeight = 0;
	let top = 0;
	let containerHeight = 0;

	for (const { index, width, height } of childDimensions) {
		if (currentX + width > containerWidth) {
			currentX = 0;
			top += currentRowMaxHeight;
			containerHeight += currentRowMaxHeight;
			currentRowMaxHeight = 0;
		}

		positions[index] = { top, left: currentX };
		currentX += width;

		if (height > currentRowMaxHeight) {
			currentRowMaxHeight = height;
		}
	}

	// Add the height of the last row to the container height
	containerHeight += currentRowMaxHeight;

	return { positions, height: containerHeight };
}

export function arrayMove<T>(items: T[], oldIndex: number, newIndex: number) {
	const newItems = [...items];
	const [movedItem] = newItems.splice(oldIndex, 1);
	newItems.splice(newIndex, 0, movedItem);
	return newItems;
}

function getNewIndex(
	draggingIndex: number,
	initialMousePosition: { x: number; y: number },
	positions: Position[],
	currentMousePosition: { x: number; y: number }
): number {
	let closestIndex = draggingIndex;
	let closestDistance = Infinity;

	for (let i = 0; i < positions.length; i++) {
		const position = positions[i];
		const deltaX =
			currentMousePosition.x -
			(initialMousePosition.x - positions[draggingIndex].left + position.left);
		const deltaY =
			currentMousePosition.y -
			(initialMousePosition.y - positions[draggingIndex].top + position.top);

		const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

		if (distance < closestDistance) {
			closestIndex = i;
			closestDistance = distance;
		}

		if (i === draggingIndex) {
			continue;
		}
	}

	return closestIndex;
}

interface MasonryProps {
	children?: React.ReactNode;
	onSort?(currentIndex: number, nextIndex: number): void;
}

export function MasonryContainer({ children, onSort }: MasonryProps) {
	const [containerHeight, setContainerHeight] = useState(0);
	const [positions, setPositions] = useState<Position[]>([]);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);
	const [initialMousePosition, setInitialMousePosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const childRefs = useRef<(HTMLDivElement | null)[]>([]);

	const handleMouseDown = (e: React.MouseEvent, index: number) => {
		setInitialMousePosition({ x: e.clientX, y: e.clientY });
		setDraggingIndex(index);
		document.body.style.cursor = "grabbing";
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (draggingIndex === null || initialMousePosition === null) {
				return;
			}

			const ref = childRefs.current[draggingIndex];
			const position = positions[draggingIndex];
			if (!ref || !position) {
				return;
			}

			const deltaX = e.clientX - initialMousePosition.x;
			const deltaY = e.clientY - initialMousePosition.y;

			const elementInitialLeft = ref.offsetLeft - position.left;
			const elementInitialTop = ref.offsetTop - position.top;

			ref.style.transform = `translate(${elementInitialLeft + deltaX}px, ${
				elementInitialTop + deltaY
			}px)`;
			const currentMousePosition = { x: e.clientX, y: e.clientY };

			const newIndex = getNewIndex(
				draggingIndex,
				initialMousePosition,
				positions,
				currentMousePosition
			);
			setOverIndex(newIndex);
		};

		const handleMouseUp = (e: MouseEvent) => {
			document.body.style.cursor = "";
			if (draggingIndex === null || !initialMousePosition) {
				return;
			}

			const ref = childRefs.current[draggingIndex];
			if (ref) {
				ref.style.transform = "none";
			}

			const currentMousePosition = { x: e.clientX, y: e.clientY };

			const newIndex = getNewIndex(
				draggingIndex,
				initialMousePosition,
				positions,
				currentMousePosition
			);

			const reorderedChildren = arrayMove(
				React.Children.toArray(children),
				draggingIndex,
				newIndex
			);
			if (onSort) {
				onSort(draggingIndex, newIndex);
			}

			const childDimensions = reorderedChildren
				.map((child, index) => {
					if (React.isValidElement(child) && childRefs.current[index]) {
						const { width, height } = childRefs.current[
							index
						]?.getBoundingClientRect() ?? { height: 0, width: 0 };
						return { index, width, height };
					}

					return null;
				})
				.filter(Boolean) as ChildDimension[];
			const containerWidth = containerRef.current?.offsetWidth ?? 100;

			const { positions: newPositions, height } = calculateMasonryLayout(
				containerWidth,
				childDimensions
			);
			setContainerHeight(height);

			setPositions(newPositions);
			setDraggingIndex(null);
			setInitialMousePosition(null);
			setOverIndex(null);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [children, draggingIndex, initialMousePosition, positions, onSort]);

	useEffect(() => {
		let timerId: number;

		const updateSize = () => {
			if (timerId) {
				window.clearTimeout(timerId);
			}

			timerId = window.setTimeout(
				() => {
					if (containerRef.current && children) {
						const containerWidth = containerRef.current.offsetWidth;
						const childDimensions = React.Children.map(
							children as ReactElement[],
							(child: React.ReactElement, index: number) => {
								if (React.isValidElement(child) && childRefs.current[index]) {
									const { width, height } = childRefs.current[
										index
									]?.getBoundingClientRect() ?? { height: 0, width: 0 };
									return { index, width, height };
								}

								return null;
							}
						).filter(Boolean) as ChildDimension[];

						const { positions: newPositions, height } = calculateMasonryLayout(
							containerWidth,
							childDimensions
						);
						setPositions(newPositions);
						setContainerHeight(height);
					}
				},
				(1000 / 60) * 3
			);
		};

		updateSize();

		window.addEventListener("resize", updateSize);

		return () => {
			window.removeEventListener("resize", updateSize);
			if (timerId) {
				window.clearTimeout(timerId);
			}
		};
	}, [children]);

	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: containerHeight,
			}}
		>
			{React.Children.map(children, (child, index) => {
				if (!React.isValidElement(child)) {
					return child;
				}

				const position = positions[index] || { top: 0, left: 0 };
				const newStyle: React.CSSProperties = {
					...(child.props as React.HTMLProps<HTMLDivElement>).style,
					position: "absolute",
					top: `${position.top}px`,
					left: `${position.left}px`,
					cursor: draggingIndex !== null ? "grabbing" : "grab",
					zIndex: draggingIndex === index ? 2 : 0,
					opacity: overIndex === index ? 0.3 : 1,
				};

				return (
					<div
						key={index}
						ref={(el: HTMLDivElement) => {
							childRefs.current[index] = el;
						}}
						style={newStyle}
						onMouseDown={(event: React.MouseEvent) => {
							handleMouseDown(event, index);
						}}
					>
						{child}
					</div>
				);
			})}
		</div>
	);
}
