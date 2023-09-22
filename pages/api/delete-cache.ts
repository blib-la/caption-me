import { rm } from "node:fs/promises";
import path from "node:path";

import { createPathHash } from "@server/createPathHash";
import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
	if (request.method === "POST") {
		try {
			const { directory } = request.body;
			const hashFolder = createPathHash(directory);
			const folder = path.join(process.cwd(), ".cm-cache", hashFolder);
			console.log(folder);
			await rm(folder, { recursive: true, force: true });
			console.log("done");
			response.status(200).json({ success: true });
		} catch (error) {
			response.status(500).json({ error: "Failed to get directory path." });
		}
	} else {
		response.status(405).end(); // Method not allowed
	}
}
