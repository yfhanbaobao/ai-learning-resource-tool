[CmdletBinding()]
param(
    [int]$Port = 4173
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$sitePath = Join-Path $projectRoot 'site'

if (-not (Test-Path $sitePath)) {
    throw "Site folder not found: $sitePath"
}

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
$pyLauncher = Get-Command py -ErrorAction SilentlyContinue

if ($pythonCommand) {
    $runner = 'python'
    $arguments = @('-m', 'http.server', $Port)
}
elseif ($pyLauncher) {
    $runner = 'py'
    $arguments = @('-m', 'http.server', $Port)
}
else {
    throw 'No Python interpreter was found, so local preview cannot start.'
}

Set-Location $sitePath

Write-Host "Site folder: $sitePath"
Write-Host "Preview URL: http://localhost:$Port"
Write-Host 'Press Ctrl + C to stop the preview.'
Write-Host ''

& $runner @arguments
