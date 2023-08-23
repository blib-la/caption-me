import { Button, Sheet } from "@mui/joy";
import Typography from "@mui/joy/Typography";
import React, { useState } from "react";

const DirectorySelector = () => {
	const [path, setPath] = useState("");

	const selectDirectory = async () => {
		try {
			const response = await fetch("/api/select-folder");
			const data = await response.json();
			console.log(data);
			setPath(data.path);
		} catch (error) {
			console.error("Failed to select directory:", error);
		}
	};

	return (
		<Sheet sx={{ position: "sticky", top: 0, display: "flex", alignItems: "center", gap: 2 }}>
			<Button onClick={selectDirectory}>Select Directory</Button>
			<Typography>Selected Path: {path}</Typography>
		</Sheet>
	);
};

export default DirectorySelector;
