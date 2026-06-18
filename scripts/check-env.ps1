[CmdletBinding()]
param()

$ErrorActionPreference = 'SilentlyContinue'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$docsPath = Join-Path $projectRoot 'docs'
$reportPath = Join-Path $docsPath 'setup-status-generated.md'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'

function Get-FirstLine {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    return ($Text -split "`r?`n")[0].Trim()
}

function Invoke-VersionCommand {
    param(
        [string]$Command,
        [string[]]$Arguments = @('--version')
    )

    try {
        $output = & $Command @Arguments 2>&1 | Out-String
        if ($LASTEXITCODE -ne 0 -and [string]::IsNullOrWhiteSpace($output)) {
            return $null
        }
        return $output.Trim()
    }
    catch {
        return $null
    }
}

function New-Check {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Detail
    )

    [pscustomobject]@{
        Name = $Name
        Status = $Status
        Detail = $Detail
    }
}

$checks = @()

$windowsVersion = Get-FirstLine (Invoke-VersionCommand -Command 'cmd' -Arguments @('/c', 'ver'))
if ($windowsVersion) {
    $checks += New-Check -Name 'Windows' -Status 'ok' -Detail $windowsVersion
}

$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (Test-Path $chromePath) {
    $checks += New-Check -Name 'Chrome' -Status 'ok' -Detail $chromePath
}
else {
    $checks += New-Check -Name 'Chrome' -Status 'missing' -Detail 'Chrome path not found'
}

$nodeVersion = Get-FirstLine (Invoke-VersionCommand -Command 'node')
if ($nodeVersion) {
    $checks += New-Check -Name 'Node.js' -Status 'ok' -Detail $nodeVersion
}
else {
    $checks += New-Check -Name 'Node.js' -Status 'missing' -Detail 'node command not found'
}

$npmCmdVersion = Get-FirstLine (Invoke-VersionCommand -Command 'npm.cmd')
if ($npmCmdVersion) {
    $checks += New-Check -Name 'npm.cmd' -Status 'ok' -Detail $npmCmdVersion
}
else {
    $checks += New-Check -Name 'npm.cmd' -Status 'missing' -Detail 'npm.cmd command not found'
}

$npmPolicyOutput = Invoke-VersionCommand -Command 'npm'
if ($npmPolicyOutput -and $npmPolicyOutput -notmatch 'PSSecurityException|UnauthorizedAccess|Execution_Policies|SecurityError') {
    $checks += New-Check -Name 'npm' -Status 'ok' -Detail (Get-FirstLine $npmPolicyOutput)
}
else {
    $checks += New-Check -Name 'npm' -Status 'warning' -Detail 'Use npm.cmd in PowerShell because npm.ps1 is blocked by policy'
}

$pythonVersion = Get-FirstLine (Invoke-VersionCommand -Command 'python')
if ($pythonVersion) {
    $pythonStatus = if ($pythonVersion -match '3\.6\.') { 'warning' } else { 'ok' }
    $pythonDetail = if ($pythonStatus -eq 'warning') {
        "$pythonVersion; okay for preview, but upgrade later if you need newer tooling"
    }
    else {
        $pythonVersion
    }
    $checks += New-Check -Name 'Python' -Status $pythonStatus -Detail $pythonDetail
}
else {
    $checks += New-Check -Name 'Python' -Status 'missing' -Detail 'python command not found'
}

$codeVersion = Get-FirstLine (Invoke-VersionCommand -Command 'code')
if ($codeVersion) {
    $checks += New-Check -Name 'VS Code' -Status 'ok' -Detail $codeVersion
}
else {
    $checks += New-Check -Name 'VS Code' -Status 'missing' -Detail 'code command not found'
}

$cursorVersion = Get-FirstLine (Invoke-VersionCommand -Command 'cursor')
if ($cursorVersion) {
    $checks += New-Check -Name 'Cursor CLI' -Status 'ok' -Detail $cursorVersion
}
else {
    $checks += New-Check -Name 'Cursor CLI' -Status 'warning' -Detail 'cursor command not found; VS Code is still fine'
}

$gitVersion = Get-FirstLine (Invoke-VersionCommand -Command 'git')
if ($gitVersion) {
    $checks += New-Check -Name 'Git' -Status 'ok' -Detail $gitVersion
}
else {
    $checks += New-Check -Name 'Git' -Status 'missing' -Detail 'git command not found'
}

$ollamaVersion = Get-FirstLine (Invoke-VersionCommand -Command 'ollama')
if ($ollamaVersion) {
    $checks += New-Check -Name 'Ollama' -Status 'ok' -Detail $ollamaVersion
}
else {
    $checks += New-Check -Name 'Ollama' -Status 'missing' -Detail 'ollama command not found'
}

$statusMap = @{
    ok = 'READY'
    warning = 'WARN'
    missing = 'MISSING'
}

$lines = @(
    '# Local Environment Check Report',
    '',
    "- Generated at: $timestamp",
    "- Project path: $projectRoot",
    '',
    '| Item | Status | Detail |',
    '| --- | --- | --- |'
)

foreach ($check in $checks) {
    $detail = ($check.Detail -replace '\|', '/')
    $lines += "| $($check.Name) | $($statusMap[$check.Status]) | $detail |"
}

$lines += ''
$lines += '## Recommended next actions'
$lines += ''

if (($checks | Where-Object { $_.Name -eq 'Git' }).Status -ne 'ok') {
    $lines += '- Install Git so you can push this project to GitHub.'
}

if (($checks | Where-Object { $_.Name -eq 'Ollama' }).Status -ne 'ok') {
    $lines += '- Install Ollama so the local model workflow matches your plan.'
}

if (($checks | Where-Object { $_.Name -eq 'npm' }).Status -eq 'warning') {
    $lines += '- Use npm.cmd instead of npm inside PowerShell.'
}

if (($checks | Where-Object { $_.Name -eq 'Python' }).Status -eq 'warning') {
    $lines += '- Python 3.6 works for a simple preview, but newer tooling may need an upgrade.'
}

Set-Content -Path $reportPath -Value $lines -Encoding UTF8

Write-Host 'Environment check complete.'
Write-Host "Report written to: $reportPath"
Write-Host ''

foreach ($check in $checks) {
    $statusLabel = $statusMap[$check.Status]
    Write-Host ("[{0}] {1}: {2}" -f $statusLabel, $check.Name, $check.Detail)
}
