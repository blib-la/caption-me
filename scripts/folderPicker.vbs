Set objShell = CreateObject("Shell.Application")
Set objRootWindow = WScript.CreateObject("WScript.Shell")

' Bring the root window to the front
objRootWindow.AppActivate WScript.ScriptName

' Open folder picker and get the selected path
Set objFolder = objShell.BrowseForFolder(0, "Choose a folder", 0, "")

' Hide the root window again
objRootWindow.SendKeys "%{F4}"

If Not objFolder is Nothing Then
    Wscript.Echo objFolder.Self.Path
End If
