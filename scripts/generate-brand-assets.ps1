# Gera os PNGs da marca (icone, icone adaptativo, splash, favicon) desenhando
# o raio do Hype — a mesma forma do icone "zap" do Feather usado no app.
#
# Uso (na raiz do projeto):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-brand-assets.ps1
#
# Sem dependencia nova: usa o System.Drawing do .NET e a fonte Space Grotesk
# que ja esta em node_modules.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "assets/images"
$fontFile = Join-Path $root "node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf"

$background = [System.Drawing.Color]::FromArgb(255, 10, 10, 13)
$boltTop = [System.Drawing.Color]::FromArgb(255, 247, 208, 116)
$boltBottom = [System.Drawing.Color]::FromArgb(255, 222, 163, 56)
$textColor = [System.Drawing.Color]::FromArgb(255, 242, 242, 244)

function New-Canvas([int]$size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas($canvas, [string]$name) {
  $path = Join-Path $out $name
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Bitmap.Dispose()
  Write-Host "gerado: $path"
}

# Forma do "zap" do Feather (grade 24x24; o raio ocupa x de 3 a 21 e y de 2 a 22,
# entao o centro dele e (12, 12) e a altura vale 20 unidades).
function Get-BoltPath([single]$cx, [single]$cy, [single]$height) {
  $unit = $height / 20
  $points = @(@(13, 2), @(3, 14), @(12, 14), @(11, 22), @(21, 10), @(12, 10))
  $list = New-Object 'System.Drawing.PointF[]' 6
  for ($i = 0; $i -lt 6; $i++) {
    $x = $cx + ($points[$i][0] - 12) * $unit
    $y = $cy + ($points[$i][1] - 12) * $unit
    $list[$i] = New-Object System.Drawing.PointF ([single]$x), ([single]$y)
  }
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddPolygon($list)
  return $path
}

# Raio preenchido com degrade vertical; o contorno do mesmo degrade, com
# juncao redonda, tira a ponta "dura" das quinas.
function Draw-Bolt($graphics, [single]$cx, [single]$cy, [single]$height, $top, $bottom) {
  $path = Get-BoltPath $cx $cy $height
  # O degrade precisa cobrir tambem a espessura do contorno; senao ele "repete"
  # fora do retangulo e as pontas do raio saem com a cor invertida.
  $pad = $height * 0.1
  $rect = New-Object System.Drawing.RectangleF ([single]($cx - $height / 2)), ([single]($cy - $height / 2 - $pad)), ([single]$height), ([single]($height + 2 * $pad))
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $top, $bottom, ([System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $pen = New-Object System.Drawing.Pen $brush, ([single]($height * 0.06))
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.FillPath($brush, $path)
  $graphics.DrawPath($pen, $path)
  $pen.Dispose()
  $brush.Dispose()
  $path.Dispose()
}

function Draw-Glow($graphics, [single]$cx, [single]$cy, [single]$radius, [int]$alpha) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse([single]($cx - $radius), [single]($cy - $radius), [single]($radius * 2), [single]($radius * 2))
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
  $brush.CenterColor = [System.Drawing.Color]::FromArgb($alpha, 232, 178, 77)
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 232, 178, 77))
  $graphics.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

# Texto letra a letra pra controlar o espacamento entre elas (o GDI+ nao tem tracking).
function Draw-SpacedText($graphics, [string]$text, $font, $brush, [single]$cx, [single]$y, [single]$spacing) {
  $format = [System.Drawing.StringFormat]::GenericTypographic
  $widths = @()
  $total = 0
  foreach ($char in $text.ToCharArray()) {
    $w = $graphics.MeasureString([string]$char, $font, 10000, $format).Width
    $widths += $w
    $total += $w + $spacing
  }
  $total -= $spacing
  $x = $cx - $total / 2
  for ($i = 0; $i -lt $text.Length; $i++) {
    $graphics.DrawString([string]$text[$i], $font, $brush, [single]$x, [single]$y, $format)
    $x += $widths[$i] + $spacing
  }
}

# --- icon.png: raio sobre o fundo escuro com brilho suave (1024x1024, sem transparencia) ---
$c = New-Canvas 1024
$c.Graphics.Clear($background)
Draw-Glow $c.Graphics 512 512 470 95
Draw-Bolt $c.Graphics 512 512 600 $boltTop $boltBottom
Save-Canvas $c "icon.png"

# --- icone adaptativo do Android: fundo, frente e monocromatico ---
# A frente fica dentro da "zona segura" (circulo central de ~66%) pra nao ser cortada.
$c = New-Canvas 1024
$c.Graphics.Clear($background)
Draw-Glow $c.Graphics 512 512 470 95
Save-Canvas $c "android-icon-background.png"

$c = New-Canvas 1024
Draw-Bolt $c.Graphics 512 512 440 $boltTop $boltBottom
Save-Canvas $c "android-icon-foreground.png"

$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$c = New-Canvas 1024
Draw-Bolt $c.Graphics 512 512 440 $white $white
Save-Canvas $c "android-icon-monochrome.png"

# --- splash.png: raio + wordmark, fundo transparente (a cor vem do app.config.js) ---
$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile($fontFile)
$font = New-Object System.Drawing.Font $fonts.Families[0], 116, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$textBrush = New-Object System.Drawing.SolidBrush $textColor

$c = New-Canvas 1024
Draw-Glow $c.Graphics 512 400 380 70
Draw-Bolt $c.Graphics 512 380 420 $boltTop $boltBottom
Draw-SpacedText $c.Graphics "HYPEAPP" $font $textBrush 512 660 16
Save-Canvas $c "splash.png"

# --- favicon.png (web) ---
$c = New-Canvas 256
$c.Graphics.Clear($background)
Draw-Glow $c.Graphics 128 128 118 95
Draw-Bolt $c.Graphics 128 128 150 $boltTop $boltBottom
Save-Canvas $c "favicon.png"

$textBrush.Dispose()
$font.Dispose()
$fonts.Dispose()
Write-Host "pronto."
