Add-Type -ReferencedAssemblies 'System.Drawing' -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.IO;

public class SvgGeneratorFast {
    public class PointD {
        public double X, Y;
        public PointD(double x, double y) { X = x; Y = y; }
    }

    public static List<PointD> SimplifyRDP(List<PointD> points, double epsilon) {
        if (points.Count < 3) return new List<PointD>(points);

        int index = -1;
        double maxDist = 0;
        PointD first = points[0];
        PointD last = points[points.Count - 1];

        for (int i = 1; i < points.Count - 1; i++) {
            double dist = PerpendicularDistance(points[i], first, last);
            if (dist > maxDist) {
                maxDist = dist;
                index = i;
            }
        }

        if (maxDist > epsilon) {
            List<PointD> left = SimplifyRDP(points.GetRange(0, index + 1), epsilon);
            List<PointD> right = SimplifyRDP(points.GetRange(index, points.Count - index), epsilon);
            left.RemoveAt(left.Count - 1);
            left.AddRange(right);
            return left;
        } else {
            return new List<PointD> { first, last };
        }
    }

    private static double PerpendicularDistance(PointD pt, PointD lineStart, PointD lineEnd) {
        double dx = lineEnd.X - lineStart.X;
        double dy = lineEnd.Y - lineStart.Y;
        double mag = Math.Sqrt(dx * dx + dy * dy);
        if (mag < 1e-6) {
            double px = pt.X - lineStart.X;
            double py = pt.Y - lineStart.Y;
            return Math.Sqrt(px * px + py * py);
        }
        return Math.Abs(dy * pt.X - dx * pt.Y + lineEnd.X * lineStart.Y - lineEnd.Y * lineStart.X) / mag;
    }

    public static void GenerateVectorSvg(string inputPng, string outputSvgVector, double epsilon) {
        using (Bitmap bmp = new Bitmap(inputPng)) {
            int w = bmp.Width;
            int h = bmp.Height;

            BitmapData bData = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(bData.Stride) * h;
            byte[] raw = new byte[bytes];
            Marshal.Copy(bData.Scan0, raw, 0, bytes);
            bmp.UnlockBits(bData);

            bool[,] greenMask = new bool[w, h];
            bool[,] blueMask = new bool[w, h];

            for (int y = 0; y < h; y++) {
                int rowIdx = y * bData.Stride;
                for (int x = 0; x < w; x++) {
                    int idx = rowIdx + x * 4;
                    byte b = raw[idx];
                    byte g = raw[idx + 1];
                    byte r = raw[idx + 2];
                    byte a = raw[idx + 3];

                    if (a > 30) {
                        // Green: G significantly higher than B and R
                        if (g > b + 10 && g > r + 8) {
                            greenMask[x, y] = true;
                        }
                        // Blue: B significantly higher than R
                        else if (b > r + 25 && b >= g - 5) {
                            blueMask[x, y] = true;
                        }
                    }
                }
            }

            string greenPath = TraceMaskFast(greenMask, w, h, epsilon);
            string bluePath = TraceMaskFast(blueMask, w, h, epsilon);

            StringBuilder svg = new StringBuilder();
            svg.AppendLine(string.Format("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {0} {1}\" width=\"{0}\" height=\"{1}\">", w, h));
            svg.AppendLine("  <defs>");
            svg.AppendLine("    <linearGradient id=\"rfGreenGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">");
            svg.AppendLine("      <stop offset=\"0%\" stop-color=\"#4CA308\"/>");
            svg.AppendLine("      <stop offset=\"35%\" stop-color=\"#2EA00A\"/>");
            svg.AppendLine("      <stop offset=\"100%\" stop-color=\"#146A04\"/>");
            svg.AppendLine("    </linearGradient>");
            svg.AppendLine("    <linearGradient id=\"rfBlueGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">");
            svg.AppendLine("      <stop offset=\"0%\" stop-color=\"#0288C8\"/>");
            svg.AppendLine("      <stop offset=\"50%\" stop-color=\"#026CAB\"/>");
            svg.AppendLine("      <stop offset=\"100%\" stop-color=\"#014B88\"/>");
            svg.AppendLine("    </linearGradient>");
            svg.AppendLine("  </defs>");
            svg.AppendLine(string.Format("  <path fill=\"url(#rfGreenGrad)\" fill-rule=\"evenodd\" d=\"{0}\" />", greenPath));
            svg.AppendLine(string.Format("  <path fill=\"url(#rfBlueGrad)\" fill-rule=\"evenodd\" d=\"{0}\" />", bluePath));
            svg.AppendLine("</svg>");

            File.WriteAllText(outputSvgVector, svg.ToString());
        }
    }

    private static string TraceMaskFast(bool[,] mask, int w, int h, double epsilon) {
        bool[,] visited = new bool[w, h];
        int[] dx = { 1, 1, 0, -1, -1, -1, 0, 1 };
        int[] dy = { 0, 1, 1, 1, 0, -1, -1, -1 };

        StringBuilder sb = new StringBuilder();

        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                if (mask[x, y] && !visited[x, y]) {
                    bool isBoundary = false;
                    for (int k = 0; k < 8; k += 2) {
                        int nx = x + dx[k];
                        int ny = y + dy[k];
                        if (nx < 0 || nx >= w || ny < 0 || ny >= h || !mask[nx, ny]) {
                            isBoundary = true;
                            break;
                        }
                    }

                    if (!isBoundary) continue;

                    List<PointD> contour = new List<PointD>();
                    int currX = x;
                    int currY = y;
                    int currDir = 0;
                    int startX = currX;
                    int startY = currY;
                    int maxSteps = w * h;
                    int steps = 0;

                    do {
                        contour.Add(new PointD(currX, currY));
                        visited[currX, currY] = true;

                        bool foundNext = false;
                        int checkDir = (currDir + 6) % 8;
                        for (int i = 0; i < 8; i++) {
                            int d = (checkDir + i) % 8;
                            int nx = currX + dx[d];
                            int ny = currY + dy[d];

                            if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[nx, ny]) {
                                currX = nx;
                                currY = ny;
                                currDir = d;
                                foundNext = true;
                                break;
                            }
                        }

                        if (!foundNext) break;
                        steps++;
                    } while ((currX != startX || currY != startY) && steps < maxSteps);

                    if (contour.Count > 10) {
                        List<PointD> simplified = SimplifyRDP(contour, epsilon);
                        if (simplified.Count > 3) {
                            sb.Append("M " + Math.Round(simplified[0].X, 1) + " " + Math.Round(simplified[0].Y, 1) + " ");
                            for (int i = 1; i < simplified.Count; i++) {
                                sb.Append("L " + Math.Round(simplified[i].X, 1) + " " + Math.Round(simplified[i].Y, 1) + " ");
                            }
                            sb.Append("Z ");
                        }
                    }
                }
            }
        }

        return sb.ToString().Trim();
    }
}
'@

$croppedPath = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_cropped_transparent.png"
$vectorPath = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_vector.svg"

Write-Output "Tracing vector paths in pure C#..."
[SvgGeneratorFast]::GenerateVectorSvg($croppedPath, $vectorPath, 1.2)
Write-Output "Generated logo_vector.svg successfully!"

# Also create the official logo.svg
$croppedBytes = [System.IO.File]::ReadAllBytes($croppedPath)
$croppedB64 = [Convert]::ToBase64String($croppedBytes)
$img = [System.Drawing.Image]::FromFile($croppedPath)
$w = $img.Width
$h = $img.Height
$img.Dispose()

$svgOfficial = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $w $h" width="$w" height="$h">
  <defs>
    <linearGradient id="rfGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4CA308"/>
      <stop offset="100%" stop-color="#146A04"/>
    </linearGradient>
    <linearGradient id="rfBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0288C8"/>
      <stop offset="100%" stop-color="#014B88"/>
    </linearGradient>
  </defs>
  <!-- Official Rasoee Fresh Logo Artwork (Transparent, Lossless) -->
  <image href="data:image/png;base64,$croppedB64" width="$w" height="$h" />
</svg>
"@

[System.IO.File]::WriteAllText("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo.svg", $svgOfficial)
Write-Output "Generated logo.svg successfully!"

# And create favicon.svg (512x512)
$squarePath = "C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/logo_square_transparent.png"
$squareBytes = [System.IO.File]::ReadAllBytes($squarePath)
$squareB64 = [Convert]::ToBase64String($squareBytes)

$faviconSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="favGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4CA308"/>
      <stop offset="100%" stop-color="#146A04"/>
    </linearGradient>
  </defs>
  <!-- Rasoee Fresh Brand Favicon (Square 1:1, Lossless) -->
  <image href="data:image/png;base64,$squareB64" width="512" height="512" />
</svg>
"@

[System.IO.File]::WriteAllText("C:/Users/Admin/.gemini/antigravity/scratch/raosee-fresh-supermarket/favicon.svg", $faviconSvg)
Write-Output "Generated favicon.svg successfully!"
