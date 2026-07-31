# Script para iniciar o Frontend (React/Vite)
Write-Host "Iniciando o Frontend (Agenda Salão Online)..." -ForegroundColor Cyan

cd frontend
if ($?) {
    npm run dev
} else {
    Write-Host "Erro: Pasta 'frontend' não encontrada." -ForegroundColor Red
}
