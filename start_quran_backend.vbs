Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:/Users/SAA/Documents/projects/Quran-By-Ear/backend"
WshShell.Run "node server.js", 0, False
