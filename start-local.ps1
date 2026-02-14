# Local hosting: Postgres + migrate + seed, then start backend & frontend
# Prerequisite: Start Docker Desktop, then run this script from project root.

$ErrorActionPreference = "Stop"
$dbUrl = "postgresql://hireflow:hireflow_secret@localhost:5432/hireflow"

Write-Host "Starting Postgres..."
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker not available or failed. Ensure Docker Desktop is running and try again."
    exit 1
}

Write-Host "Waiting for Postgres to be ready..."
Start-Sleep -Seconds 5

Push-Location backend
try {
    $env:DATABASE_URL = $dbUrl
    Write-Host "Running migrations..."
    npx prisma migrate deploy
    Write-Host "Seeding database..."
    npm run db:seed
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Database ready. Start the app in two terminals:"
Write-Host "  Terminal 1:  cd backend  && set DATABASE_URL=$dbUrl && npm run dev"
Write-Host "  Terminal 2:  cd frontend && npm run dev"
Write-Host ""
Write-Host "Then open http://localhost:5173 (or the port Vite shows)"
Write-Host "Login: admin@hireflow.com / Admin123!"
Write-Host ""

# To start backend and frontend manually:
#   Terminal 1:  cd backend  ; $env:DATABASE_URL="$dbUrl"; npm run dev
#   Terminal 2:  cd frontend; npm run dev
