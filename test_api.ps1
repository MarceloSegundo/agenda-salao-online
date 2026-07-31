$baseUrl = "http://localhost:8080/api"

function Invoke-With-Error-Handling {
    param(
        [string]$Uri,
        [string]$Method,
        [string]$Body,
        [hashtable]$Headers = @{}
    )
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -Headers $Headers -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -ContentType "application/json"
        }
        return $response
    } catch {
        if ($_.Exception.Response) {
            $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errResp = $streamReader.ReadToEnd()
            Write-Host "Error Body: $errResp"
        } else {
            Write-Host "Error: $($_.Exception.Message)"
        }
        return $null
    }
}

$suffix = Get-Random

Write-Host "`n=== 1. Register Tenant ==="
$regBody = '{"salonName": "Salao Teste ' + $suffix + '", "adminName": "Marcelo", "adminEmail": "marcelo' + $suffix + '@test.com", "adminPassword": "password"}'
$regResponse = Invoke-With-Error-Handling -Uri "$baseUrl/tenants/register" -Method Post -Body $regBody
$regResponse | ConvertTo-Json

Write-Host "`n=== 2. Login ==="
$loginBody = '{"email": "marcelo' + $suffix + '@test.com", "password": "password"}'
$loginResponse = Invoke-With-Error-Handling -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody
$token = $loginResponse.token
$headers = @{ "Authorization" = "Bearer $token" }
$loginResponse | ConvertTo-Json

Write-Host "`n=== 3. Create Customer ==="
$custBody = '{"name": "Cliente Um", "email": "cliente1' + $suffix + '@test.com", "phone": "11999999999"}'
$custResponse = Invoke-With-Error-Handling -Uri "$baseUrl/customers" -Method Post -Body $custBody -Headers $headers
$custId = $custResponse.id
$custResponse | ConvertTo-Json

Write-Host "`n=== 4. Create Professional ==="
$profBody = '{"name": "Profissional Um", "email": "prof1' + $suffix + '@test.com", "phone": "11888888888", "active": true}'
$profResponse = Invoke-With-Error-Handling -Uri "$baseUrl/professionals" -Method Post -Body $profBody -Headers $headers
$profId = $profResponse.id
$profResponse | ConvertTo-Json

Write-Host "`n=== 5. Create Service ==="
$svcBody = '{"name": "Corte de Cabelo", "description": "Corte masculino", "price": 50.0, "durationMinutes": 30, "requiresOnlinePayment": false}'
$svcResponse = Invoke-With-Error-Handling -Uri "$baseUrl/services" -Method Post -Body $svcBody -Headers $headers
$svcId = $svcResponse.id
$svcResponse | ConvertTo-Json

Write-Host "`n=== 6. Create Appointment ==="
# Calculate a start time in the future (next day at 10:00 AM) to avoid validation errors
$startTime = (Get-Date).AddDays(1).ToString("yyyy-MM-ddT10:00:00")
$aptBody = "{`"customerId`": `"$custId`", `"professionalId`": `"$profId`", `"serviceId`": `"$svcId`", `"startTime`": `"$startTime`"}"
$aptResponse = Invoke-With-Error-Handling -Uri "$baseUrl/appointments" -Method Post -Body $aptBody -Headers $headers
$aptResponse | ConvertTo-Json
$aptId = $aptResponse.id

Write-Host "`n=== 7. Get Customer ==="
$getC = Invoke-With-Error-Handling -Uri "$baseUrl/customers/$custId" -Method Get -Headers $headers
$getC | ConvertTo-Json

Write-Host "`n=== 8. Get Professional ==="
$getP = Invoke-With-Error-Handling -Uri "$baseUrl/professionals/$profId" -Method Get -Headers $headers
$getP | ConvertTo-Json

Write-Host "`n=== 9. Get Service ==="
$getS = Invoke-With-Error-Handling -Uri "$baseUrl/services/$svcId" -Method Get -Headers $headers
$getS | ConvertTo-Json

Write-Host "`n=== 10. List Appointments ==="
$listApt = Invoke-With-Error-Handling -Uri "$baseUrl/appointments" -Method Get -Headers $headers
$listApt | ConvertTo-Json

Write-Host "`n=== 11. Update Appointment Status ==="
$statusBody = "{`"status`": `"CONFIRMED`"}"
$updateApt = Invoke-With-Error-Handling -Uri "$baseUrl/appointments/$aptId/status" -Method Patch -Body $statusBody -Headers $headers
$updateApt | ConvertTo-Json
