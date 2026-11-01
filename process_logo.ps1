Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/Admin/.gemini/antigravity/brain/07ab042d-bea7-412b-b932-fd585886e8d8/.user_uploaded/media_1791491530286_fb7648b2.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $bmp.Width
$h = $bmp.Height

# 1. Determine precise bounding box of non-white pixels
$minX = $w
$maxX = 0
$minY = $h
$maxY = 0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Check if pixel is not background (white is >= 250 in all channels)
        if ($c.R -lt 248 -or $c.G -lt 248 -or $c.B -lt 248) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Bounds: X=[$minX, $maxX], Y=[$minY, $maxY], Size=($($maxX - $minX + 1) x $($maxY - $minY + 1))"

# 2. Add a slight margin (e.g., 16px) around the bounds
$pad = 16
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + ($pad * 2))
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + ($pad * 2))

Write-Output "Cropped dimensions: ${cropW}x${cropH} at (${cropX}, ${cropY})"

# 3. Create transparent cropped image with smooth alpha matte extraction
$croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    $srcY = $cropY + $y
    for ($x = 0; $x -lt $cropW; $x++) {
        $srcX = $cropX + $x
        $c = $bmp.GetPixel($srcX, $srcY)

        $r = [int]$c.R
        $g = [int]$c.G
        $b = [int]$c.B

        $minCh = [Math]::Min($r, [Math]::Min($g, $b))
        $maxCh = [Math]::Max($r, [Math]::Max($g, $b))

        # Background is white (254, 254, 254)
        if ($r -ge 252 -and $g -ge 252 -and $b -ge 252) {
            # Fully transparent
            $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($minCh -ge 240 -and ($maxCh - $minCh) -le 10) {
            # Near-white background pixel
            $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # De-matte from white:
            # delta = distance from white in the channel with most saturation
            $deltaR = 255 - $r
            $deltaG = 255 - $g
            $deltaB = 255 - $b
            $maxDelta = [Math]::Max($deltaR, [Math]::Max($deltaG, $deltaB))

            # Alpha is proportional to max delta
            # Full opacity when max delta >= 120
            $alphaRatio = [Math]::Min(1.0, [double]$maxDelta / 120.0)
            if ($alphaRatio -lt 0.05) {
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                continue
            }

            # Un-premultiply color against white background to remove fringe:
            # Observed = Alpha * True + (1 - Alpha) * 255
            # True = (Observed - 255 * (1 - Alpha)) / Alpha
            $a = [Math]::Max(1, [Math]::Min(255, [int]($alphaRatio * 255.0)))
            $unpreR = [Math]::Max(0, [Math]::Min(255, [int](($r - 255.0 * (1.0 - $alphaRatio)) / $alphaRatio)))
            $unpreG = [Math]::Max(0, [Math]::Min(255, [int](($g - 255.0 * (1.0 - $alphaRatio)) / $alphaRatio)))
            $unpreB = [Math]::Max(0, [Math]::Min(255, [int](($b - 255.0 * (1.0 - $alphaRatio)) / $alphaRatio)))

            $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $unpreR, $unpreG, $unpreB))
        }
    }
}

$outCropped = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_cropped_transparent.png"
$croppedBmp.Save($outCropped, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved cropped transparent PNG: $outCropped ($($cropW)x$($cropH))"

# Also generate a square 512x512 version for favicon and app icons
$sqSize = 512
$squareBmp = New-Object System.Drawing.Bitmap($sqSize, $sqSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($squareBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Fit cropped logo with 10% padding inside 512x512
$targetPadding = 32
$availW = $sqSize - ($targetPadding * 2)
$availH = $sqSize - ($targetPadding * 2)

$scale = [Math]::Min([double]$availW / $cropW, [double]$availH / $cropH)
$destW = [int]($cropW * $scale)
$destH = [int]($cropH * $scale)
$destX = [int](($sqSize - $destW) / 2)
$destY = [int](($sqSize - $destH) / 2)

$g.DrawImage($croppedBmp, $destX, $destY, $destW, $destH)
$g.Dispose()

$outSquare = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_square_transparent.png"
$squareBmp.Save($outSquare, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved square 512x512 transparent PNG: $outSquare"

$bmp.Dispose()
$croppedBmp.Dispose()
$squareBmp.Dispose()
