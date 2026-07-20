$frontendDir = "C:\Users\nnith\OneDrive\Desktop\worktrees\garments latest\green-gorge\garments latest\frontend"
$process = Start-Process -FilePath "C:\Program Files\nodejs\npx.cmd" -ArgumentList "vite","--host" -WindowStyle Normal -WorkingDirectory $frontendDir -PassThru
Write-Output "Vite started with PID: $($process.Id)"
