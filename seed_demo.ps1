# Popula o banco local com um salão de demonstração cheio de dados:
# 6 profissionais (+1 inativo), 11 serviços (+1 inativo), 120 clientes e ~3 meses de agenda.
#
# Pré-requisitos: banco no ar (docker compose up -d) e backend rodando (.\start_backend.ps1).
# Uso: .\seed_demo.ps1   (pode rodar de novo: recria os dados do salão de demonstração)
#
# Login do salão de demonstração (só para o ambiente local):
#   e-mail: demo@agenda.local
#   senha:  demo1234

param(
    [string]$ApiUrl = "http://localhost:8080/api"
)

$ErrorActionPreference = "Stop"
$Email = "demo@agenda.local"
$Password = "demo1234"

function Get-DemoToken {
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    try {
        return (Invoke-RestMethod -Method Post -Uri "$ApiUrl/auth/login" -ContentType "application/json" -Body $body).token
    } catch {
        return $null
    }
}

Write-Host "1/3 Salão de demonstração..." -ForegroundColor Cyan
$token = Get-DemoToken
if (-not $token) {
    $register = @{
        salonName     = "Salao Bela Vista"
        adminName     = "Demo"
        adminEmail    = $Email
        adminPassword = $Password
    } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$ApiUrl/tenants/register" -ContentType "application/json" -Body $register | Out-Null
    $token = Get-DemoToken
    if (-not $token) { throw "Não foi possível entrar com o usuário de demonstração depois do cadastro." }
    Write-Host "    salão criado" -ForegroundColor Green
} else {
    Write-Host "    salão já existia: os dados dele serão recriados" -ForegroundColor Yellow
}

# O id do salão vem no próprio JWT (claim tenant_id)
$payload = $token.Split(".")[1].Replace("-", "+").Replace("_", "/")
$payload = $payload.PadRight($payload.Length + (4 - $payload.Length % 4) % 4, "=")
$tenantId = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json).tenant_id

Write-Host "2/3 Populando o banco (salão $tenantId)..." -ForegroundColor Cyan
Push-Location $PSScriptRoot
try {
    # Copia o SQL para o container: evita problemas de acentuação ao passar o arquivo pelo pipe do PowerShell
    docker compose cp scripts/seed_demo.sql db:/tmp/seed_demo.sql
    if ($LASTEXITCODE -ne 0) { throw "Falha ao copiar o SQL para o container do banco." }
    docker compose exec -T db psql -U postgres -d agendadb -v ON_ERROR_STOP=1 -v "tenant_id=$tenantId" -f /tmp/seed_demo.sql
    if ($LASTEXITCODE -ne 0) { throw "Falha ao rodar scripts/seed_demo.sql." }
} finally {
    Pop-Location
}

Write-Host "3/3 Conferindo pela API..." -ForegroundColor Cyan
$dashboard = Invoke-RestMethod -Uri "$ApiUrl/dashboard/today" -Headers @{ Authorization = "Bearer $token" }
$s = $dashboard.summary
Write-Host ("    hoje: {0} atendimentos, {1} concluídos, {2} a confirmar, {3} cancelados" -f $s.total, $s.completed, $s.toConfirm, $s.canceled)
Write-Host ("    pendências: {0} a confirmar, {1} atrasados" -f $dashboard.pending.toConfirmTotal, $dashboard.pending.overdueTotal)

Write-Host ""
Write-Host "Pronto. Entre em http://localhost:5173/login com $Email / $Password" -ForegroundColor Green
