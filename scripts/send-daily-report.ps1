[CmdletBinding()]
param(
    [string]$SubjectPrefix = 'AI Learning Resource Daily Report',
    [switch]$Required
)

$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$opsDir = Join-Path $projectRoot 'docs\operations'
$reports = @(
    (Join-Path $opsDir 'ai-daily-report.md'),
    (Join-Path $opsDir 'daily-ops-report.md'),
    (Join-Path $opsDir 'content-watch-report.md'),
    (Join-Path $opsDir 'search-report.md')
)

function Get-RequiredEnv([string]$Name) {
    $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = [Environment]::GetEnvironmentVariable($Name, 'User')
    }
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = [Environment]::GetEnvironmentVariable($Name, 'Machine')
    }
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Missing required environment variable: $Name"
    }
    return $value
}

function Get-OptionalEnv([string]$Name, [string]$DefaultValue) {
    $value = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = [Environment]::GetEnvironmentVariable($Name, 'User')
    }
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = [Environment]::GetEnvironmentVariable($Name, 'Machine')
    }
    if ([string]::IsNullOrWhiteSpace($value)) { return $DefaultValue }
    return $value
}

$missing = @()
foreach ($name in @('AI_DAILY_SMTP_HOST', 'AI_DAILY_SMTP_PORT', 'AI_DAILY_SMTP_USER', 'AI_DAILY_SMTP_PASS', 'AI_DAILY_MAIL_FROM', 'AI_DAILY_MAIL_TO')) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Process')
    if ([string]::IsNullOrWhiteSpace($value)) { $value = [Environment]::GetEnvironmentVariable($name, 'User') }
    if ([string]::IsNullOrWhiteSpace($value)) { $value = [Environment]::GetEnvironmentVariable($name, 'Machine') }
    if ([string]::IsNullOrWhiteSpace($value)) { $missing += $name }
}

if ($missing.Count -gt 0) {
    Write-Warning ('Daily email skipped. Missing SMTP environment variables: ' + ($missing -join ', '))
    exit 0
}

$smtpHost = Get-RequiredEnv 'AI_DAILY_SMTP_HOST'
$smtpPort = [int](Get-RequiredEnv 'AI_DAILY_SMTP_PORT')
$smtpUser = Get-RequiredEnv 'AI_DAILY_SMTP_USER'
$smtpPass = Get-RequiredEnv 'AI_DAILY_SMTP_PASS'
$mailFrom = Get-RequiredEnv 'AI_DAILY_MAIL_FROM'
$mailTo = Get-RequiredEnv 'AI_DAILY_MAIL_TO'
$enableSslText = Get-OptionalEnv 'AI_DAILY_SMTP_SSL' 'true'
$enableSsl = $enableSslText -notin @('0', 'false', 'False', 'FALSE', 'no', 'No', 'NO')

$bodyParts = New-Object System.Collections.Generic.List[string]
$bodyParts.Add("# $SubjectPrefix")
$bodyParts.Add('')
$bodyParts.Add("Generated at: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))")
$bodyParts.Add('')

foreach ($report in $reports) {
    if (Test-Path $report) {
        $bodyParts.Add('---')
        $bodyParts.Add('')
        $bodyParts.Add((Get-Content -Raw -Encoding UTF8 $report))
        $bodyParts.Add('')
    }
}

$body = $bodyParts -join "`r`n"
$subject = "$SubjectPrefix - $((Get-Date).ToString('yyyy-MM-dd'))"

$message = [System.Net.Mail.MailMessage]::new()
$message.From = $mailFrom
foreach ($recipient in $mailTo.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $message.To.Add($recipient.Trim())
}
$message.Subject = $subject
$message.Body = $body
$message.BodyEncoding = [System.Text.Encoding]::UTF8
$message.SubjectEncoding = [System.Text.Encoding]::UTF8
$message.IsBodyHtml = $false

$client = [System.Net.Mail.SmtpClient]::new($smtpHost, $smtpPort)
$client.EnableSsl = $enableSsl
$client.Credentials = [System.Net.NetworkCredential]::new($smtpUser, $smtpPass)

try {
    $client.Send($message)
    Write-Host "Daily report email sent to $mailTo"
} catch {
    $warning = "Daily email skipped. $($_.Exception.Message)"
    if ($Required) {
        throw $warning
    }
    Write-Warning $warning
    exit 0
} finally {
    $message.Dispose()
    $client.Dispose()
}
