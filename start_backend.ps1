# Script para iniciar o Backend (Spring Boot) e o Banco de Dados (Postgres)
Write-Host "Iniciando o Banco de Dados via Docker Compose..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Iniciando o Backend (Agenda Salão Online)..." -ForegroundColor Cyan
cd backend
if ($?) {
    # Carrega backend/.env (JWT_SECRET, PGPASSWORD...) sem sobrescrever o que já está no ambiente
    if (Test-Path .env) {
        Get-Content .env | Where-Object { $_ -match '^\s*[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object {
            $name, $value = $_ -split '=', 2
            $name = $name.Trim()
            if (-not [Environment]::GetEnvironmentVariable($name)) {
                [Environment]::SetEnvironmentVariable($name, $value.Trim())
            }
        }
    }
    .\mvnw spring-boot:run
} else {
    Write-Host "Erro: Pasta 'backend' não encontrada." -ForegroundColor Red
}
