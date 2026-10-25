$ErrorActionPreference = 'Stop'
$taskName = 'Faust Web Gateway'
$watchScript = Join-Path $PSScriptRoot 'watch-faust-gateway.ps1'
$pwsh = (Get-Command pwsh.exe -ErrorAction Stop).Source
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute $pwsh -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $watchScript + '"') -WorkingDirectory ([IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')))
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  if ($existing.Actions.Count -ne 1 -or $existing.Actions[0].Arguments -notlike ('*' + $watchScript + '*')) { throw 'An unrelated task already uses this name.' }
  if ($existing.State -eq 'Running') { throw 'Gateway watcher already running; stop only this scheduled task before updating it.' }
}
Register-ScheduledTask -TaskName $taskName -Description 'Keep the local Faust web gateway available while the owner is signed in. Restore a missing gateway without stopping other services.' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output 'Faust Web Gateway watcher registered and started; also starts at owner logon.'
