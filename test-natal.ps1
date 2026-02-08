$body = @{
    birthDate = "1990-01-15"
    birthPlace = "Prague"
    birthTime = "12:00"
    name = "Test"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/natal-chart" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content
