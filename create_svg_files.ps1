Add-Type -AssemblyName System.Drawing

$croppedPath = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_cropped_transparent.png"
$squarePath = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_square_transparent.png"

$croppedBytes = [System.IO.File]::ReadAllBytes($croppedPath)
$croppedB64 = [Convert]::ToBase64String($croppedBytes)

$img = [System.Drawing.Image]::FromFile($croppedPath)
$w = $img.Width
$h = $img.Height
$img.Dispose()

Write-Output "Cropped logo: ${w}x${h}"

# 1. Create official logo.svg
$svgOfficial = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $w $h" width="$w" height="$h">
  <defs>
    <!-- Brand Metadata -->
    <meta name="brand" content="Rasoee Fresh" />
  </defs>
  <!-- Official Rasoee Fresh Brand Artwork (High Resolution, Transparent Background) -->
  <image href="data:image/png;base64,$croppedB64" width="$w" height="$h" preserveAspectRatio="xMidYMid meet" />
</svg>
"@

[System.IO.File]::WriteAllText("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo.svg", $svgOfficial)
Write-Output "Successfully written logo.svg ($w x $h)!"

# 2. Create official favicon.svg (512x512 square viewport)
$squareBytes = [System.IO.File]::ReadAllBytes($squarePath)
$squareB64 = [Convert]::ToBase64String($squareBytes)

$faviconSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <meta name="brand" content="Rasoee Fresh" />
  </defs>
  <!-- Rasoee Fresh Favicon (Square 1:1, Lossless) -->
  <image href="data:image/png;base64,$squareB64" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>
"@

[System.IO.File]::WriteAllText("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/favicon.svg", $faviconSvg)
Write-Output "Successfully written favicon.svg (512 x 512)!"

# 3. Also update raster icons for Android/iOS/PWA using the new official brand artwork
$sqImg = [System.Drawing.Bitmap]::FromFile($squarePath)

# 512x512 PWA & Play Store
$icon512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon512)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($sqImg, 0, 0, 512, 512)
$g.Dispose()
$icon512.Save("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 192x192 PWA & Android xxxhdpi
$icon192 = New-Object System.Drawing.Bitmap(192, 192, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon192)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($sqImg, 0, 0, 192, 192)
$g.Dispose()
$icon192.Save("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 180x180 Apple Touch Icon
$icon180 = New-Object System.Drawing.Bitmap(180, 180, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon180)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($sqImg, 0, 0, 180, 180)
$g.Dispose()
$icon180.Save("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 64x64 browser fallback favicon.png
$icon64 = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($icon64)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($sqImg, 0, 0, 64, 64)
$g.Dispose()
$icon64.Save("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Update Android mipmaps with the official logo
$androidMipmaps = @(
    @{ dir = "mobile-android/app/src/main/res/mipmap-mdpi"; size = 48 },
    @{ dir = "mobile-android/app/src/main/res/mipmap-hdpi"; size = 72 },
    @{ dir = "mobile-android/app/src/main/res/mipmap-xhdpi"; size = 96 },
    @{ dir = "mobile-android/app/src/main/res/mipmap-xxhdpi"; size = 144 },
    @{ dir = "mobile-android/app/src/main/res/mipmap-xxxhdpi"; size = 192 }
)

foreach ($m in $androidMipmaps) {
    if (Test-Path $m.dir) {
        $s = $m.size
        $bmpM = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gm = [System.Drawing.Graphics]::FromImage($bmpM)
        $gm.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gm.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gm.Clear([System.Drawing.Color]::Transparent)
        $gm.DrawImage($sqImg, 0, 0, $s, $s)
        $gm.Dispose()
        $bmpM.Save("$($m.dir)/ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpM.Save("$($m.dir)/ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpM.Dispose()
    }
}

# Update iOS Assets.xcassets
$iosIcons = @(
    @{ name = "AppIcon-1024.png"; size = 1024 },
    @{ name = "AppIcon-180.png"; size = 180 },
    @{ name = "AppIcon-120.png"; size = 120 },
    @{ name = "AppIcon-87.png"; size = 87 },
    @{ name = "AppIcon-80.png"; size = 80 },
    @{ name = "AppIcon-58.png"; size = 58 },
    @{ name = "AppIcon-40.png"; size = 40 }
)

$iosDir = "mobile-ios/RaoseeFresh/Assets.xcassets/AppIcon.appiconset"
if (Test-Path $iosDir) {
    foreach ($item in $iosIcons) {
        $s = $item.size
        $bmpIos = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gi = [System.Drawing.Graphics]::FromImage($bmpIos)
        $gi.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gi.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gi.Clear([System.Drawing.Color]::Transparent)
        $gi.DrawImage($sqImg, 0, 0, $s, $s)
        $gi.Dispose()
        $bmpIos.Save("$iosDir/$($item.name)", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpIos.Dispose()
    }
}

$sqImg.Dispose()
$icon512.Dispose()
$icon192.Dispose()
$icon180.Dispose()
$icon64.Dispose()

Write-Output "ALL icons & SVGs generated and updated perfectly!"
