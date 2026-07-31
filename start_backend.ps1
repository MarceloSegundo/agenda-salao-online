# Script para iniciar o Backend (Spring Boot) e o Banco de Dados (Postgres)
Write-Host "Iniciando o Banco de Dados via Docker Compose..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Iniciando o Backend (Agenda Salão Online)..." -ForegroundColor Cyan
cd backend
if ($?) {
    .\mvnw spring-boot:run
} else {
    Write-Host "Erro: Pasta 'backend' não encontrada." -ForegroundColor Red
}
