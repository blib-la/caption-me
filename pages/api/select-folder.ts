import { spawn } from "node:child_process";
import os from "os";

import type { NextApiRequest, NextApiResponse } from "next";

export default (request: NextApiRequest, response: NextApiResponse) => {
	if (request.method === "GET") {
		try {
			let command;
			let args;

			switch (os.platform()) {
				case "win32":
					command = "powershell";
					args = [
						"-Command",
						`
# Import necessary .NET assembly for Windows Forms
Add-Type -AssemblyName System.Windows.Forms;

# Create an instance of OpenFileDialog for the user to select a file
$dialog = New-Object System.Windows.Forms.OpenFileDialog;
$dialog.Title = "Please select any file within the desired directory...";
$dialog.InitialDirectory = [Environment]::GetFolderPath('Desktop');
$dialog.Filter = "All Files (*.*)|*.*";

# Create a new form that will be our host
$form = New-Object System.Windows.Forms.Form;
$form.WindowState = [System.Windows.Forms.FormStartPosition]::CenterScreen;
$form.TopMost = $true;
$form.Add_Shown({
    $form.Activate();
    $result = $dialog.ShowDialog();
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        $form.Tag = $dialog.FileName | Split-Path;
    } else {
        $form.Tag = "No directory deduced";
    }
    $form.Close();
});

# Run our form
[void]$form.ShowDialog();

# Return the result stored in the form's Tag property
$form.Tag;

        `,
					];

					break;
				case "linux":
					command = "zenity";
					args = ["--file-selection", "--directory"];
					break;
				case "darwin": // MacOS
					command = "osascript";
					args = ["-e", "choose folder as string"];
					break;
				default:
					response.status(500).json({ error: "Operating system not supported." });
					return;
			}

			const child = spawn(command, args);

			let data = "";
			child.stdout.on("data", chunk => {
				data += chunk.toString();
			});

			child.on("close", code => {
				if (code !== 0) {
					response.status(500).json({ error: "Failed to get directory path." });
					return;
				}

				const path = data.trim();
				response.status(200).json({ path });
			});
		} catch (error) {
			response.status(500).json({ error: "Failed to get directory path." });
		}
	} else {
		response.status(405).end(); // Method not allowed
	}
};
