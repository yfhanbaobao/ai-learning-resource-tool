[CmdletBinding()]
param(
    [string]$TaskName = 'AI Learning Resource Daily Ops',
    [string]$At = '20:00'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$scriptPath = Join-Path $projectRoot 'scripts\publish-daily-site.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Daily publish script not found: $scriptPath"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries:$false -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'Generate, commit, and push AI learning resource site updates.' -Force | Out-Null

Write-Host "Registered task: $TaskName"
Write-Host "Daily time: $At"
Write-Host "Script: $scriptPath"
