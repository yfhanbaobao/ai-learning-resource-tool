[CmdletBinding()]
param(
    [int]$Port = 4173
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$sitePath = Join-Path $projectRoot 'site'
$nodeServer = Join-Path $projectRoot 'scripts\preview-server.js'

if (-not (Test-Path $sitePath)) {
    throw "Site folder not found: $sitePath"
}

if (-not (Test-Path $nodeServer)) {
    throw "Preview server not found: $nodeServer"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js was not found, so local preview cannot start.'
}

Write-Host "Site folder: $sitePath"
Write-Host "Preview URL: http://127.0.0.1:$Port"
Write-Host 'Press Ctrl + C to stop the preview.'
Write-Host ''

& node $nodeServer $Port
