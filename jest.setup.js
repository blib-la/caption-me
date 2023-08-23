import { createCanvas } from "canvas";

global.HTMLCanvasElement.prototype.getContext = function () {
	return createCanvas(1, 1).getContext("2d");
};
