# Start Postgres for local development (Windows PowerShell)
# Run from repo root: .\scripts\start-dev-db.ps1

Set-Location $PSScriptRoot\..

$ComposeFiles = @('-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml')

function Invoke-DockerCompose {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & docker compose @ComposeFiles @Args 2>&1 | ForEach-Object { Write-Host $_ }
  return $LASTEXITCODE
}

if (-not (Test-Path '.env')) {
  if (Test-Path '.env.example') {
    Copy-Item '.env.example' '.env'
    Write-Host 'Created .env from .env.example — set POSTGRES_PASSWORD if needed.' -ForegroundColor Yellow
  } else {
    Write-Error 'Missing .env and .env.example in repo root.'
  }
}

Write-Host 'Starting Postgres (dev overlay, port 5432)...' -ForegroundColor Cyan
$upCode = Invoke-DockerCompose 'up', '-d', 'postgres'

if ($upCode -ne 0) {
  Write-Host ''
  Write-Host 'Docker failed. Start Docker Desktop, wait until it is running, then run this script again.' -ForegroundColor Red
  exit 1
}

Write-Host 'Waiting for Postgres...' -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  $null = Invoke-DockerCompose 'exec', '-T', 'postgres', 'pg_isready', '-U', 'invitation_user', '-d', 'invitation_db'
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  Write-Error 'Postgres did not become ready in time.'
}

Set-Location apps\web

if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created apps/web/.env — check DATABASE_URL password matches root .env POSTGRES_PASSWORD.' -ForegroundColor Yellow
}

Write-Host 'Applying migrations and seed...' -ForegroundColor Cyan
pnpm db:generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

pnpm exec prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

pnpm db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Done. Start the app: cd apps\web; pnpm dev' -ForegroundColor Green
