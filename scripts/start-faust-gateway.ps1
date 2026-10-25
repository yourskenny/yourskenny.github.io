$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gatewayEntry = Join-Path $PSScriptRoot 'faust-gateway.mjs'
$runtimeDir = Join-Path $siteRoot '.tmp-dev-server'
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot 'dist/faust/index.html'))) { throw 'Run npm run build first.' }
if (Get-NetTCPConnection -LocalPort 4322 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 4322 is already in use. Check the existing gateway before starting another.' }
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$gatewayProcess = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList ('"' + $gatewayEntry + '"') -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'faust-gateway.out.log') -RedirectStandardError (Join-Path $runtimeDir 'faust-gateway.err.log') -PassThru
$gatewayProcess.Id | Set-Content -LiteralPath (Join-Path $runtimeDir 'faust-gateway.pid')
Write-Output ('Gateway started (PID ' + $gatewayProcess.Id + '). HTTPS mapping is managed separately by tailscale funnel.')
