$taskName = "ViteDevServer"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "C:\Program Files\nodejs\node.exe" -Argument "C:\Users\nnith\OneDrive\Desktop\worktrees\garments latest\green-gorge\garments latest\frontend\node_modules\vite\bin\vite.js --host" -WorkingDirectory "C:\Users\nnith\OneDrive\Desktop\worktrees\garments latest\green-gorge\garments latest\frontend"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(5)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Force
Start-ScheduledTask -TaskName $taskName
Write-Output "Vite started via scheduled task"
