param(
    [string]$SiteUrl = "http://127.0.0.1:4173",
    [string]$OutputDir = "artifacts/lighthouse",
    [int]$MinPerformance = 75,
    [int]$MinAccessibility = 90,
    [int]$MinBestPractices = 85,
    [int]$MinSeo = 90
)

$ErrorActionPreference = "Stop"

$npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npxCommand) {
    $npxCommand = Get-Command npx -ErrorAction SilentlyContinue
}

if (-not $npxCommand) {
    throw "npx is required to run Lighthouse audits."
}

$resolvedOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null

function Invoke-LighthouseRun {
    param(
        [string]$Mode,
        [switch]$Desktop
    )

    $jsonPath = Join-Path $resolvedOutputDir "$Mode.json"
    $args = @(
        "--yes",
        "lighthouse",
        $SiteUrl,
        "--chrome-flags=--headless=new --no-sandbox --disable-features=HttpsUpgrades",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--output=json",
        "--output-path=$jsonPath"
    )

    if ($Desktop) {
        $args += "--preset=desktop"
    }

    & $npxCommand.Source @args

    if ($LASTEXITCODE -ne 0) {
        throw "Lighthouse $Mode run failed."
    }

    return Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
}

function Get-CategoryScore {
    param(
        $Report,
        [string]$Name
    )

    return [int][math]::Round(($Report.categories.$Name.score * 100), 0)
}

function Get-AuditValue {
    param(
        $Report,
        [string]$Name
    )

    return $Report.audits.$Name.displayValue
}

$mobile = Invoke-LighthouseRun -Mode "mobile"
$desktop = Invoke-LighthouseRun -Mode "desktop" -Desktop

$summary = [pscustomobject]@{
    site_url = $SiteUrl
    thresholds = [pscustomobject]@{
        accessibility = $MinAccessibility
        best_practices = $MinBestPractices
        performance = $MinPerformance
        seo = $MinSeo
    }
    mobile = [pscustomobject]@{
        performance = Get-CategoryScore -Report $mobile -Name "performance"
        accessibility = Get-CategoryScore -Report $mobile -Name "accessibility"
        best_practices = Get-CategoryScore -Report $mobile -Name "best-practices"
        seo = Get-CategoryScore -Report $mobile -Name "seo"
        lcp = Get-AuditValue -Report $mobile -Name "largest-contentful-paint"
        cls = Get-AuditValue -Report $mobile -Name "cumulative-layout-shift"
        tbt = Get-AuditValue -Report $mobile -Name "total-blocking-time"
        speed_index = Get-AuditValue -Report $mobile -Name "speed-index"
    }
    desktop = [pscustomobject]@{
        performance = Get-CategoryScore -Report $desktop -Name "performance"
        accessibility = Get-CategoryScore -Report $desktop -Name "accessibility"
        best_practices = Get-CategoryScore -Report $desktop -Name "best-practices"
        seo = Get-CategoryScore -Report $desktop -Name "seo"
        lcp = Get-AuditValue -Report $desktop -Name "largest-contentful-paint"
        cls = Get-AuditValue -Report $desktop -Name "cumulative-layout-shift"
        tbt = Get-AuditValue -Report $desktop -Name "total-blocking-time"
        speed_index = Get-AuditValue -Report $desktop -Name "speed-index"
    }
}

$summaryPath = Join-Path $resolvedOutputDir "summary.json"
$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryPath
$summary | ConvertTo-Json -Depth 6

$failingScores = @()

foreach ($mode in @("mobile", "desktop")) {
    $report = $summary.$mode

    if ($report.performance -lt $MinPerformance) {
        $failingScores += "$mode performance score $($report.performance) is below $MinPerformance"
    }

    if ($report.accessibility -lt $MinAccessibility) {
        $failingScores += "$mode accessibility score $($report.accessibility) is below $MinAccessibility"
    }

    if ($report.best_practices -lt $MinBestPractices) {
        $failingScores += "$mode best-practices score $($report.best_practices) is below $MinBestPractices"
    }

    if ($report.seo -lt $MinSeo) {
        $failingScores += "$mode SEO score $($report.seo) is below $MinSeo"
    }
}

if ($failingScores.Count -gt 0) {
    throw ("Quality audit failed:`n" + ($failingScores -join "`n"))
}
