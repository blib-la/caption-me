import { createReadStream, promises as fsPromises, statSync } from "fs";
import path from "node:path";

import { getRootFolder } from "@server/path";
import * as fileType from "file-type";
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

async function streamOptimizedImage(filePath: string, response: NextApiResponse) {
	const readStream = createReadStream(filePath);

	// Optimize the image on the fly
	const transformer = sharp().resize(1080).jpeg({ quality: 80 });

	readStream.pipe(transformer).pipe(response);

	// Deduce the MIME type and set the header
	const bufferChunk = readStream.read(4100) || Buffer.alloc(0);
	const type = await fileType.fileTypeFromBuffer(bufferChunk);
	response.setHeader("Content-Type", type?.mime || "application/octet-stream");
}

async function serveOtherFile(filePath: string, response: NextApiResponse) {
	// Read the file into memory
	const fileData = await fsPromises.readFile(filePath);

	// Deduce the MIME type and set the header
	const type = await fileType.fileTypeFromBuffer(fileData);
	response.setHeader("Content-Type", type?.mime || "application/octet-stream");

	// Send the file as a response
	response.send(fileData);
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
	const rootFolder = getRootFolder(request.cookies);
	switch (request.method) {
		case "GET":
			try {
				const args = request.query.args as string[];
				const filePath = path.join(rootFolder, ...args);
				console.log(filePath);

				// Check if the file is an image
				const stats = statSync(filePath);
				if (stats.isFile()) {
					const bufferChunk =
						createReadStream(filePath, { start: 0, end: 4100 }).read() ||
						Buffer.alloc(0);
					const type = await fileType.fileTypeFromBuffer(bufferChunk);

					if (type?.mime.startsWith("image/")) {
						await streamOptimizedImage(filePath, response);
					} else {
						await serveOtherFile(filePath, response);
					}
				} else {
					response.status(404).send({ message: "File not found." });
				}
			} catch (error) {
				console.error(error);
				response.status(500).send({ message: "An unexpected error occurred." });
			}

			break;

		default:
			response.setHeader("Allow", ["GET"]);
			response.status(405).send({ message: "Method Not Allowed." });
	}
}
