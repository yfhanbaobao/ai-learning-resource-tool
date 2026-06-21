[CmdletBinding()]
param(
    [string]$TaskName = 'AI Learning Resource Daily Ops',
    [string]$At = '09:00'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$scriptPath = Join-Path $projectRoot 'scripts\run-daily-ops.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Daily ops script not found: $scriptPath"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries:$false -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'Generate AI learning resource site data and daily operations reports.' -Force | Out-Null

Write-Host "Registered task: $TaskName"
Write-Host "Daily time: $At"
Write-Host "Script: $scriptPath"
