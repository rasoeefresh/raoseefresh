Add-Type -ReferencedAssemblies 'System.Drawing' -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Text;
using System.IO;

public class SvgTracer {
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

    public static string TraceMask(bool[,] mask, int w, int h, double epsilon) {
        // Marching Squares / Contour tracing
        bool[,] visitedH = new bool[w + 1, h + 1];
        bool[,] visitedV = new bool[w + 1, h + 1];

        StringBuilder sb = new StringBuilder();

        // Edge lookup: an edge exists between (x,y) and (x+1,y) if mask[x, y-1] != mask[x, y]
        // Let us use border following
        bool[,] visited = new bool[w, h];

        // 8-direction Moore neighborhood
        int[] dx = { 1, 1, 0, -1, -1, -1, 0, 1 };
        int[] dy = { 0, 1, 1, 1, 0, -1, -1, -1 };

        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                if (mask[x, y] && !visited[x, y]) {
                    // Check if boundary pixel
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

                    // Trace this contour
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

                        // Look for next boundary neighbor
                        bool foundNext = false;
                        int checkDir = (currDir + 6) % 8; // backtrack 90 deg
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

                    if (contour.Count > 15) {
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

Write-Output "SvgTracer compiled successfully!"
