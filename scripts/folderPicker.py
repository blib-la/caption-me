import tkinter as tk
from tkinter import filedialog

# Create a root window but hide it
root = tk.Tk()
root.withdraw()

# Open folder picker and get the selected path
folder_selected = filedialog.askdirectory()

# Print the folder path (this can be read by your Node.js process)
print(folder_selected)
