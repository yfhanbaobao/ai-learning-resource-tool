[CmdletBinding()]
param(
    [string]$Remote = 'origin',
    [string]$Branch = 'main',
    [string]$CommitPrefix = 'Daily AI learning resource update',
    [switch]$SkipPush
)

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

Write-Host 'Running daily site publishing workflow...'
Invoke-NativeStep 'Running daily operations...' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'run-daily-ops.ps1'))

$generatedPaths = @(
    'data/resources.json',
    'data/watched-content.json',
    'data/ai-daily.json',
    'site/data/resources.json',
    'site/data/feed.json',
    'site/data/ai-daily.json',
    'site/robots.txt',
    'site/sitemap.xml',
    'docs/operations/daily-ops-report.md',
    'docs/operations/market-research.md',
    'docs/operations/search-report.md',
    'docs/operations/update-log.md',
    'docs/operations/content-watch-report.md',
    'docs/operations/ai-daily-report.md'
)

$existingPaths = @($generatedPaths | Where-Object { Test-Path (Join-Path $projectRoot $_) })
if ($existingPaths.Count -eq 0) {
    Write-Host 'No generated files found to publish.'
    exit 0
}

$gitAddArgs = @('add', '--') + $existingPaths
Invoke-NativeStep 'Staging generated site files...' 'git' $gitAddArgs
& git diff --cached --quiet -- $existingPaths
if ($LASTEXITCODE -eq 0) {
    Write-Host 'No generated changes to commit.'
    exit 0
}
if ($LASTEXITCODE -ne 1) {
    throw 'Failed to inspect staged changes.'
}

$stamp = Get-Date -Format 'yyyy-MM-dd'
Invoke-NativeStep 'Committing generated site files...' 'git' @('commit', '-m', "$CommitPrefix - $stamp")

if ($SkipPush) {
    Write-Host 'SkipPush set; commit created but not pushed.'
    exit 0
}

Invoke-NativeStep "Pushing generated site files to $Remote/$Branch..." 'git' @('push', $Remote, $Branch)
Write-Host "Daily site update pushed to $Remote/$Branch."
