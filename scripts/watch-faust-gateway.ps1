$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$entry = Join-Path $PSScriptRoot 'faust-gateway.mjs'
$runtimeDir = Join-Path $siteRoot '.tmp-dev-server'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$log = Join-Path $runtimeDir 'faust-gateway-watch.log'
$mutex = [Threading.Mutex]::new($false, 'Local\FaustWebGatewayWatch')
$acquired = $false
try {
  try { $acquired = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $acquired = $true }
  if (-not $acquired) { exit 0 }
  $lastState = ''
  while ($true) {
    try {
      $listeners = @(Get-NetTCPConnection -LocalPort 4322 -State Listen -ErrorAction SilentlyContinue)
      if ($listeners.Count -eq 0) {
        Add-Content -LiteralPath $log -Value ("$(Get-Date -Format o) Gateway absent; starting.")
        & (Join-Path $PSScriptRoot 'start-faust-gateway.ps1') | Out-Null
        Start-Sleep -Seconds 2
        $listeners = @(Get-NetTCPConnection -LocalPort 4322 -State Listen -ErrorAction SilentlyContinue)
        if ($listeners.Count -eq 0) { throw 'Gateway did not start.' }
      }
      foreach ($listener in $listeners) {
        $proc = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $listener.OwningProcess)
        if ($proc.Name -ne 'node.exe' -or $proc.CommandLine -notmatch [regex]::Escape($entry)) {
          throw 'Port 4322 belongs to another process; leaving it untouched.'
        }
      }
      $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4322/health/live' -TimeoutSec 5
      if ($response.service -ne 'faust-web-gateway' -or $response.status -ne 'ok') { throw 'Unexpected gateway health response.' }
      $state = 'healthy pid=' + $listeners[0].OwningProcess
    } catch {
      $state = 'attention: ' + $_.Exception.Message
    }
    if ($state -ne $lastState) {
      Add-Content -LiteralPath $log -Value ("$(Get-Date -Format o) $state")
      $lastState = $state
    }
    Start-Sleep -Seconds 15
  }
} finally {
  if ($acquired) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
