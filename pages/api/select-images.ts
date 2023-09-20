import { getImages } from "@server/getImages";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
	if (request.method === "POST") {
		try {
			const { directory } = request.body;
			const images = directory ? await getImages(directory) : [];
			response.status(200).json({ path: directory, images });
		} catch (error) {
			response.status(500).json({ error: "Failed to get directory path." });
		}
	} else {
		response.status(405).end(); // Method not allowed
	}
}
