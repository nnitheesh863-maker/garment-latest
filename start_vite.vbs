Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\nnith\OneDrive\Desktop\worktrees\garments latest\green-gorge\garments latest\frontend"
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""node_modules\vite\bin\vite.js"" --host", 0, False
