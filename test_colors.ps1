$token = "cf9bae96fa56cdf28fa5d64bc08e276c5880311a94ac6efbe7ff50d0d2abb3d7"
$url = "http://localhost:8080/api/shared/resume/$token"

$response = Invoke-WebRequest -Uri $url -Method GET
$data = $response.Content | ConvertFrom-Json

Write-Host "Colors from API:"
Write-Host "Primary: $($data.data.templateCustomization.colors.primary)"
Write-Host "Text: $($data.data.templateCustomization.colors.text)"  
Write-Host "Background: $($data.data.templateCustomization.colors.background)"
Write-Host "Accent: $($data.data.templateCustomization.colors.accent)"
Write-Host "Secondary: $($data.data.templateCustomization.colors.secondary)"
