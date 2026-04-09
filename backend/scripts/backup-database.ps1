param(
    [string]$OutputDir = ""
)

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $backendRoot ".env"

if (-not (Test-Path $envPath)) {
    throw "Missing backend/.env file. Create it before running a database backup."
}

$databaseUrlLine = Get-Content -Path $envPath |
    Where-Object { $_ -match '^\s*DATABASE_URL=' } |
    Select-Object -First 1

if (-not $databaseUrlLine) {
    throw "DATABASE_URL is missing from backend/.env."
}

$databaseUrl = ($databaseUrlLine -replace '^\s*DATABASE_URL=', '').Trim()

if (-not $databaseUrl) {
    throw "DATABASE_URL is empty in backend/.env."
}

if ($databaseUrl -match 'postgresql://user:password' -or $databaseUrl -match 'user:password@neon\.tech') {
    throw "DATABASE_URL is still using the placeholder value. Replace it with the real Neon connection string first."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    throw "pg_dump is not installed on this machine. Install PostgreSQL client tools before running the backup."
}

if (-not $OutputDir) {
    $OutputDir = Join-Path $backendRoot "backups"
}

$resolvedOutputDir = New-Item -ItemType Directory -Force -Path $OutputDir
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $resolvedOutputDir.FullName "cp-automation-$timestamp.dump"

$env:PGSSLMODE = "require"

Write-Host "Creating database backup at $backupFile"

& $pgDump.Path `
    "--dbname=$databaseUrl" `
    "--format=custom" `
    "--file=$backupFile" `
    "--no-owner" `
    "--no-privileges"

if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE."
}

Write-Host "Backup completed successfully."
Write-Host "Restore example:"
Write-Host "pg_restore --clean --if-exists --no-owner --no-privileges --dbname `"<target_database_url>`" `"$backupFile`""
