[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

Write-Host 'Running AI learning resource daily operations...'
& npm.cmd run agent:resource-search
& npm.cmd run ops:update
& npm.cmd run check:env
Write-Host 'Daily operations complete.'
