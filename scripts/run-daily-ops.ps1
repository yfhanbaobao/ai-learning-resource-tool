[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

function Invoke-NativeStep {
    param(
        [string]$Label,
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    Write-Host $Label
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

Write-Host 'Running AI learning resource daily operations...'
Invoke-NativeStep 'Running content watch agent...' 'npm.cmd' @('run', 'agent:content-watch')
Invoke-NativeStep 'Running resource search agent...' 'npm.cmd' @('run', 'agent:resource-search')
Invoke-NativeStep 'Running AI daily agent...' 'npm.cmd' @('run', 'agent:ai-daily')
Invoke-NativeStep 'Generating site data...' 'npm.cmd' @('run', 'ops:update')
Invoke-NativeStep 'Checking local environment...' 'npm.cmd' @('run', 'check:env')
Invoke-NativeStep 'Sending daily report email when configured...' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'send-daily-report.ps1'))
Write-Host 'Daily operations complete.'
