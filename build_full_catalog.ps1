# Script to build full products catalog from raw_items.csv
$raw = Import-Csv 'raw_items.csv' | Where-Object { $_.'Item Name' -ne 'NA' }
$items = [ordered]@{}

foreach ($row in $raw) {
    $name = $row.'Item Name'.Trim()
    $mrp = [double]$row.MRP
    $rawCat = $row.'Category Name'.Trim()
    if (-not $items.Contains($name)) {
        $items[$name] = @{
            Name = $name
            MRP = $mrp
            RawCats = [System.Collections.Generic.List[string]]@($rawCat)
        }
    } else {
        if (-not $items[$name].RawCats.Contains($rawCat)) {
            $items[$name].RawCats.Add($rawCat)
        }
    }
}

function Get-CategoryInfo($name, $rawCats) {
    $leafyNames = @('ALLU PAAN', 'AMBAT CHUKA', 'CHAVALI BHAJI', 'CHUKKA', 'KADIPATTA', 'KANDA PAT (SPRING ONION)', 'KOTHIMBIR (DHANIYA PATTA)', 'LAL MATH', 'METHI', 'MINT (PUDINA)', 'PALAK', 'SHEPU')
    if ($leafyNames -contains $name) {
        return @{ id = 'leafy-greens'; label = 'Leafy Greens & Herbs' }
    }

    if ($name -match 'PICKLE|PICKIL') {
        return @{ id = 'pickles-chutneys'; label = 'Pickles & Chutneys' }
    }

    if ($rawCats -contains 'DAIRY' -or $rawCats -contains 'CHEESE & BUTTER' -or $rawCats -contains 'MILK' -or $rawCats -contains 'PANEER' -or $rawCats -contains 'CREAM & WHITENER') {
        if ($name -notmatch 'WATER') {
            return @{ id = 'dairy-breakfast'; label = 'Dairy, Milk & Paneer' }
        }
    }

    if ($name -match 'LASSI|BUTTERMILK|DRINKING WATER') {
        return @{ id = 'beverages'; label = 'Beverages & Coolers' }
    }

    if ($rawCats -contains 'INSTANT FOOD' -or $rawCats -contains 'NOODLES' -or $rawCats -contains 'SOUPS' -or $name -match 'NOODLE|SOUP|BAKING POWDER') {
        return @{ id = 'instant-food'; label = 'Instant Food, Noodles & Soups' }
    }

    if ($rawCats -contains 'SAUCES' -or $rawCats -contains 'SAUCES, SYRUPS & SPREADS' -or $rawCats -contains 'SPREADS' -or $rawCats -contains 'SYRUPS' -or $name -match 'SAUCE|SOYA|KETCHUP|MAYONNAISE|MAYO|SPREAD|SYRUP|NUTELLA|TOPPING|VINEGAR|SCHEZWAN CHUTNEY') {
        return @{ id = 'sauces-spreads'; label = 'Sauces, Spreads & Syrups' }
    }

    if ($rawCats -contains 'SPICES' -or $rawCats -contains 'READY MIX SPICES' -or $rawCats -contains 'SEASONING SPICES' -or $name -match 'MASALA|POWDER|CHILLY|PWD|CORN STARCH|SNAPIN|KASURI METHI|OREGANO|CHILLI FLAKES|PERI PERI') {
        return @{ id = 'spices-masalas'; label = 'Spices & Masalas' }
    }

    $fruits = @('AVOCADO', 'DRAGON FRUIT', 'KIWI', 'ANJIR', 'APPLE (ROYAL)', 'BANANA', 'CHERRY', 'CHIKU', 'COCONUT', 'COCONUT TENDER', 'ELAICHI KELA (YELLAKI BANANA)', 'GREEN GRAPES', 'GUAVA PINK (AMRUD)', 'GUAVA WHITE (AMRUD)', 'JAMUN', 'KHARBUJ (MUSKMELON)', 'MANGO DEVGAD', 'MANGO KESHAR', 'MANGO RATNAGIRI', 'MANGO TOTAPURI', 'MOSAMBI', 'ORANGE', 'PAPAYA', 'PINEAPPLE (ANANAS)', 'POMEGRANATE (ANAR)', 'SITAFAL', 'WATERMELON (KALINGAD)')
    if ($fruits -contains $name) {
        return @{ id = 'fresh-fruits'; label = 'Fresh & Exotic Fruits' }
    }

    return @{ id = 'fresh-vegetables'; label = 'Fresh & Exotic Vegetables' }
}

function Get-Unit($name, $catId) {
    if ($name -match '(\d+\s*(?:ML|G|GM|KG))\s*(?:JAR|BOX|POUCH|PAC|TUB|WEIKFIELD|FUNFOODS|VEEBA|JAR)?') {
        $u = $matches[1].ToLower()
        if ($name -match 'JAR') { return "$u jar" }
        if ($name -match 'BOX') { return "$u box" }
        if ($name -match 'POUCH') { return "$u pouch" }
        if ($name -match 'TUB') { return "$u tub" }
        if ($name -match '5 SLICE') { return "5 slices ($u)" }
        if ($name -match '8 CHIPLETS') { return "8 cubes ($u)" }
        return $u
    }
    if ($catId -eq 'leafy-greens') { return '1 bunch' }
    if ($name -match 'TENDER|PINEAPPLE|COCONUT|WATERMELON|PAPAYA') { return '1 pc' }
    if ($name -match 'APPLE|AVOCADO|DRAGON|KIWI|ORANGE|MOSAMBI|MANGO|GUAVA|CHIKU|SITAFAL') { return '500 g' }
    if ($catId -eq 'fresh-fruits' -or $catId -eq 'fresh-vegetables') { return '1 kg' }
    return '1 unit'
}

function Get-Image($name, $catId) {
    # Dairy
    if ($name -match 'BUTTER') { return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CHEESE') { return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'PANEER') { return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MILK') { return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GHEE') { return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CREAM|MITHAI MATE') { return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80' }
    
    # Beverages
    if ($name -match 'LASSI|BUTTERMILK') { return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'WATER') { return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&auto=format&fit=crop&q=80' }

    # Fruits
    if ($name -match 'APPLE') { return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BANANA') { return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MANGO') { return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'ORANGE|MOSAMBI') { return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'WATERMELON') { return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'PAPAYA') { return 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'PINEAPPLE') { return 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GRAPES') { return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'POMEGRANATE') { return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'AVOCADO') { return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'DRAGON') { return 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'KIWI') { return 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'COCONUT') { return 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GUAVA') { return 'https://images.unsplash.com/photo-1536511136775-27a3c399b512?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CHERRY') { return 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'KHARBUJ') { return 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=400&auto=format&fit=crop&q=80' }

    # Leafy Greens
    if ($name -match 'PALAK') { return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'KOTHIMBIR|DHANIYA') { return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MINT|PUDINA') { return 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&auto=format&fit=crop&q=80' }
    if ($catId -eq 'leafy-greens') { return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80' }

    # Vegetables
    if ($name -match 'TOMATO') { return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'POTATO|BATATA') { return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'ONION|KANDA') { return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GARLIC|LASUN') { return 'https://images.unsplash.com/photo-1584947983637-8e68cfb99db2?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GINGER|ADRAK') { return 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MIRCHI|CHILLI') { return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CAPSICUM|SHIMLA') { return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BROKALI|BROCCOLI') { return 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'FLOWER|CAULI') { return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CABBAGE|KOBI') { return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'GAJAR|CARROT') { return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'KAKADI|CUCUMBER') { return 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BHENDI') { return 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'VANGA|VANGI|BAIGAN') { return 'https://images.unsplash.com/photo-1615484477778-ca3b783256fd?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'PEAS|MATAR|VATANA') { return 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BEET') { return 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MUSHROOM') { return 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'CORN|MAKKA') { return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BEANS|GAVAR|GHEVDA') { return 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'ZUCCHINI') { return 'https://images.unsplash.com/photo-1563252722-643325e24391?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'BHOPLA|DODKA|DUDHI|PADWAL') { return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80' }

    # Instant Food
    if ($name -match 'NOODLE') { return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'SOUP') { return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&auto=format&fit=crop&q=80' }

    # Pickles
    if ($catId -eq 'pickles-chutneys') { return 'https://images.unsplash.com/photo-1589135233689-d56d814237c0?w=400&auto=format&fit=crop&q=80' }

    # Sauces & Spreads
    if ($name -match 'KETCHUP|TOMATO SAUCE') { return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'MAYO|MAYONNAISE|SPREAD') { return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80' }
    if ($name -match 'NUTELLA|SYRUP') { return 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&auto=format&fit=crop&q=80' }
    if ($catId -eq 'sauces-spreads') { return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80' }

    # Spices
    if ($name -match 'SNAPIN|OREGANO|PERI PERI') { return 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400&auto=format&fit=crop&q=80' }
    if ($catId -eq 'spices-masalas') { return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80' }

    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
}

function Format-DisplayName($rawName) {
    $text = (Get-Culture).TextInfo.ToTitleCase($rawName.ToLower())
    $text = $text -replace '(?<=\d)Ml\b', ' ml' `
                 -replace '(?<=\d)Gm\b', ' g' `
                 -replace '(?<=\d)G\b', ' g' `
                 -replace '(?<=\d)Kg\b', ' kg' `
                 -replace '\bMl\b', 'ml' `
                 -replace '\bKg\b', 'kg' `
                 -replace '\bGm\b', 'g' `
                 -replace '\bPwd\b', 'Powder' `
                 -replace '\bPac\b', 'Pack' `
                 -replace '\bAmul\b', 'Amul' `
                 -replace '\bChitale\b', 'Chitale' `
                 -replace '\bChings\b', "Ching's" `
                 -replace '\bKnor\b', 'Knorr' `
                 -replace '\bEverest\b', 'Everest' `
                 -replace '\bSuhana\b', 'Suhana' `
                 -replace '\bAmbari\b', 'Ambari' `
                 -replace '\bPravin\b', 'Pravin' `
                 -replace '\bVeeba\b', 'Veeba' `
                 -replace '\bFunfoods\b', 'FunFoods' `
                 -replace '\bHersheys\b', "Hershey's" `
                 -replace '\bWeikfield\b', 'Weikfield' `
                 -replace '\bSnapin\b', 'Snapin' `
                 -replace '\bNutella\b', 'Nutella' `
                 -replace '\bKissan\b', 'Kissan' `
                 -replace '\bMaggi\b', 'Maggi'
    return $text
}

$prodList = @()
$idx = 1

foreach ($k in $items.Keys) {
    $item = $items[$k]
    $cat = Get-CategoryInfo $item.Name $item.RawCats
    $unit = Get-Unit $item.Name $cat.id
    $img = Get-Image $item.Name $cat.id
    $displayName = Format-DisplayName $item.Name

    $p = [ordered]@{
        id = "prod-$idx"
        name = $displayName
        category = $cat.id
        categoryLabel = $cat.label
        price = [int][Math]::Round($item.MRP)  # Selling rate left as MRP initially so user can update manually
        mrp = [int][Math]::Round($item.MRP)
        unit = $unit
        image = $img
        inStock = $true
        tag = if ($idx % 5 -eq 0) { "Bestseller" } elseif ($idx % 7 -eq 0) { "Fresh Arrival" } else { "" }
        rating = [Math]::Round(4.5 + (($idx % 5) * 0.1), 1)
        reviewsCount = 40 + (($idx * 17) % 350)
        deliveryTime = "Fresh Delivery"
    }
    $prodList += $p
    $idx++
}

# 1. Output products.js
$jsonProds = ($prodList | ConvertTo-Json -Depth 5) -replace '\\u0026', '&'
$header = @"
/**
 * Rasoee Fresh Supermarket - Product Catalog Data
 * Contains 207 verified grocery items across all supermarket categories
 */
const DEFAULT_PRODUCTS = 
"@

$footer = @"
;

// Helper functions for catalog
function getStoredProducts() {
  try {
    const saved = (localStorage.getItem("rasoee_fresh_products") || localStorage.getItem("raosee_fresh_products"));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load products from localStorage", e);
  }
  return DEFAULT_PRODUCTS;
}

function saveProducts(products) {
  try {
    localStorage.setItem("rasoee_fresh_products", JSON.stringify(products)); 
    localStorage.setItem("raosee_fresh_products", JSON.stringify(products));
  } catch (e) {
    console.warn("Could not save products to localStorage (quota exceeded or blocked)", e);
  }
  if (typeof saveToIndexedDB === "function") {
    saveToIndexedDB("rasoee_fresh_products", products); 
    saveToIndexedDB("raosee_fresh_products", products);
  }
  if (typeof syncToCloud === "function") {
    syncToCloud();
  }
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("storage")); } catch (e) {}
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getStoredProducts, saveProducts };
}
"@

$fullProductsJs = $header + $jsonProds + $footer
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PSScriptRoot\products.js", $fullProductsJs, $utf8NoBom)
Write-Output "products.js written with $($prodList.Count) items."

# 2. Prepare Category list
$catJson = @'
[
  { "id": "all", "label": "All Items", "icon": "🛒", "enabled": true },
  { "id": "fresh-vegetables", "label": "Fresh Vegetables", "icon": "🥬", "enabled": true },
  { "id": "leafy-greens", "label": "Leafy Greens & Herbs", "icon": "🌿", "enabled": true },
  { "id": "fresh-fruits", "label": "Fresh & Exotic Fruits", "icon": "🍎", "enabled": true },
  { "id": "dairy-breakfast", "label": "Dairy, Milk & Paneer", "icon": "🥛", "enabled": true },
  { "id": "beverages", "label": "Beverages & Coolers", "icon": "🥤", "enabled": true },
  { "id": "spices-masalas", "label": "Spices & Masalas", "icon": "🌶️", "enabled": true },
  { "id": "pickles-chutneys", "label": "Pickles & Chutneys", "icon": "🥭", "enabled": true },
  { "id": "sauces-spreads", "label": "Sauces, Spreads & Syrups", "icon": "🍯", "enabled": true },
  { "id": "instant-food", "label": "Instant Food & Soups", "icon": "🍜", "enabled": true }
]
'@
$categories = $catJson | ConvertFrom-Json

# 3. Export to JSON payload for Firebase sync
$cloudPayload = [ordered]@{
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    categories = $categories
    products = $prodList
}
$cloudJson = $cloudPayload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText("$PSScriptRoot\cloud_catalog_payload.json", $cloudJson, $utf8NoBom)
Write-Output "cloud_catalog_payload.json written."
