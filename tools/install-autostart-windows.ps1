param(
  [string]$TaskName = "FishOpsServer"
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )) {
  throw "Run this script from an elevated PowerShell (Run as Administrator)."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverEntry = Join-Path $projectRoot "server\index.mjs"

if (-not (Test-Path $serverEntry)) {
  throw "Cannot find server entry file at: $serverEntry"
}

$candidateNodePaths = @(
  (Join-Path $env:ProgramFiles "nodejs\node.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "nodejs\node.exe"),
  (Join-Path $env:LocalAppData "Programs\nodejs\node.exe")
)

$nodePath = $candidateNodePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $nodePath) {
  $nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
}
if (-not $nodePath) {
  throw "Node.js not found. Install Node.js LTS and run again."
}

$argument = "`"$serverEntry`""

$action = New-ScheduledTaskAction -Execute $nodePath -Argument $argument -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Force | Out-Null

Write-Host "Installed startup task: $TaskName"
Write-Host "Project root: $projectRoot"
Write-Host "Node path: $nodePath"
Write-Host "Starts on boot as SYSTEM. Check status with:"
Write-Host "  Get-ScheduledTask -TaskName `"$TaskName`""
