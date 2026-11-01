# Script to push updated catalog to Firebase RTDB
$url = "https://rasoee-fresh-default-rtdb.asia-southeast1.firebasedatabase.app/store_live_data"

# 1. Fetch current config & banners
$existingConfig = Invoke-RestMethod -Uri "$url/config.json" -Method Get
$existingBanners = Invoke-RestMethod -Uri "$url/banners.json" -Method Get

# 2. Read new products & categories payload
$cloudData = Get-Content -Raw "cloud_catalog_payload.json" | ConvertFrom-Json

$fullPayload = [ordered]@{
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    config = $existingConfig
    banners = $existingBanners
    categories = $cloudData.categories
    products = $cloudData.products
}

# 3. Save as full JSON and PUT to Firebase
$fullJson = $fullPayload | ConvertTo-Json -Depth 6
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PSScriptRoot\full_firebase_update.json", $fullJson, $utf8NoBom)

$response = Invoke-RestMethod -Uri "$url.json" -Method Put -Body $fullJson -ContentType "application/json; charset=utf-8"
Write-Output "Successfully synced $($response.products.Count) products to Firebase RTDB!"
