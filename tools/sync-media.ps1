<#
  ai work 폴더를 읽어서 사이트용 미디어 목록(media.js)을 만듭니다.

  [영상 작품]  ai work/Video/<작품명>/
                ├─ <영상>.mp4                 메인 영상 (_web 이 붙은 파일 우선)
                ├─ thumb.png                  (선택) 아카이브·커버 썸네일(웹용 1600px로 변환). 없으면 영상 첫 장면
                └─ Image/1.png, 2.png, 3.mp4… 상세 화면 오른쪽 패널 (숫자 오름차순, 영상도 가능)

  [이미지 작품] ai work/Image/<작품명>/  ·  ai work/Aesthetic/<작품명>/  ·  ai work/Design/<작품명>/ (형태 동일)
                ├─ 이미지들 (파일명 오름차순)  왼쪽 큰 이미지 + 오른쪽 썸네일 목록
                └─ thumb.png                  (선택) 아카이브 썸네일. 없으면 첫 번째 이미지

  - 원본은 건드리지 않고, 웹용 JPG를 Image_web 폴더(이미지 작품은 _web 폴더)에 만듭니다.
  - HEVC 등 브라우저 호환이 낮은 영상은 H.264로 변환해 같은 웹용 폴더에 둡니다 (이미 변환된 건 건너뜀).
  - 이미지 작품에 이미지가 없으면(영상만 있으면) 첫 영상 장면으로 썸네일을 만듭니다.
  - 새 폴더를 넣고 이 스크립트를 실행하면 사이트에 작품이 자동으로 추가됩니다.

  실행:  powershell -ExecutionPolicy Bypass -File tools\sync-media.ps1
#>
param([long]$Quality = 84)

$root = Split-Path $PSScriptRoot -Parent
$work = Join-Path $root "ai work"
Add-Type -AssemblyName System.Drawing
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, $Quality)

$IMG = '^\.(png|jpe?g|webp|bmp)$'
$VID = '^\.(mp4|webm)$'

# "2.png" < "10.png" 처럼 숫자 기준 정렬
function Get-NaturalKey([string]$name) { [regex]::Replace($name, '\d+', { param($m) $m.Value.PadLeft(10, '0') }) }
function ConvertTo-JsString([string]$s) { if ($null -eq $s) { return 'null' }; '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"' }

function Save-WebJpg([string]$src, [string]$dst, [int]$maxW) {
  $img = [System.Drawing.Image]::FromFile($src)
  try {
    $w = [Math]::Min($maxW, $img.Width); $h = [int][Math]::Round($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
    $g.Clear([System.Drawing.Color]::White); $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dst, $codec, $ep)
    $g.Dispose(); $bmp.Dispose()
  } finally { $img.Dispose() }
}

. (Join-Path $PSScriptRoot 'winmedia.ps1')  # 영상 변환·장면 추출 (Windows 내장 기능)

# 원본보다 새로 만든 파일이 최신이면 다시 만들지 않음
function Test-UpToDate([string]$out, [System.IO.FileInfo]$src) { (Test-Path $out) -and (Get-Item $out).LastWriteTime -ge $src.LastWriteTime }

# 폴더의 미디어 파일을 오름차순으로 웹용 변환 → 사이트 경로 목록 반환
#  - 이미지: 웹용 JPG
#  - 영상: H.264면 원본 그대로, HEVC 등이면 H.264로 변환 (브라우저 호환)
function Convert-Gallery([System.IO.FileInfo[]]$files, [string]$outDir, [string]$relSrcDir, [string]$relOutDir, [int]$maxW) {
  New-Item -ItemType Directory -Force $outDir | Out-Null
  $list = @(); $keep = @{}
  foreach ($f in ($files | Sort-Object { Get-NaturalKey $_.Name })) {
    if ($f.Extension -match $VID) {
      $codec = Get-VideoCodec $f.FullName
      if ($codec -eq 'avc1' -or $f.Extension -eq '.webm') { $list += "$relSrcDir/$($f.Name)"; continue }
      $out = Join-Path $outDir "$($f.BaseName).mp4"
      if (-not (Test-UpToDate $out $f)) { Write-Host "    변환 중 ($codec → H.264): $($f.Name)"; Convert-ToH264 $f.FullName $out }
      $keep["$($f.BaseName).mp4"] = 1
      $list += "$relOutDir/$($f.BaseName).mp4"
      continue
    }
    $out = Join-Path $outDir "$($f.BaseName).jpg"
    if (-not (Test-UpToDate $out $f)) { Save-WebJpg $f.FullName $out $maxW }
    $keep["$($f.BaseName).jpg"] = 1
    $list += "$relOutDir/$($f.BaseName).jpg"
  }
  # 원본에서 지운 파일은 웹용 폴더에서도 삭제
  Get-ChildItem $outDir -File | Where-Object { -not $keep.ContainsKey($_.Name) } | Remove-Item -Force -Confirm:$false
  return , $list
}

# 사이트 경로("ai work/...") → 실제 파일 경로
function Resolve-SitePath([string]$rel) { Join-Path $root ($rel -replace '/', '\') }

function Format-Entry([string]$key, [string]$kind, $video, $thumb, $gallery) {
  $gl = ($gallery | ForEach-Object { "      " + (ConvertTo-JsString $_) }) -join ",`n"
  "  $(ConvertTo-JsString $key): {`n    kind: $(ConvertTo-JsString $kind),`n    video: $(ConvertTo-JsString $video),`n    thumb: $(ConvertTo-JsString $thumb),`n    gallery: [`n$gl`n    ],`n  }"
}

$entries = @()

# ---------- 영상 작품: ai work/Video/<작품명> ----------
$videoRoot = Join-Path $work 'Video'
foreach ($dir in @(if (Test-Path $videoRoot) { Get-ChildItem $videoRoot -Directory | Sort-Object { Get-NaturalKey $_.Name } })) {
  $rel = "ai work/Video/$($dir.Name)"
  $files = Get-ChildItem $dir.FullName -File

  $videos = $files | Where-Object Extension -match $VID | Sort-Object { Get-NaturalKey $_.Name }
  $video = $videos | Where-Object BaseName -like '*_web' | Select-Object -First 1
  if (-not $video) { $video = $videos | Select-Object -First 1 }

  $gallery = @()
  $imgDir = Get-ChildItem $dir.FullName -Directory | Where-Object Name -in 'Image', 'Images' | Select-Object -First 1
  if ($imgDir) {
    $src = Get-ChildItem $imgDir.FullName -File | Where-Object { $_.Extension -match $IMG -or $_.Extension -match $VID }
    $gallery = Convert-Gallery $src (Join-Path $dir.FullName 'Image_web') "$rel/$($imgDir.Name)" "$rel/Image_web" 1400
  }

  $thumb = $null
  $thumbSrc = $files | Where-Object { $_.BaseName -eq 'thumb' -and $_.Extension -match $IMG } | Select-Object -First 1
  if ($thumbSrc) { Save-WebJpg $thumbSrc.FullName (Join-Path $dir.FullName 'thumb_web.jpg') 1600; $thumb = "$rel/thumb_web.jpg" }

  $entries += Format-Entry "Video/$($dir.Name)" 'video' $(if ($video) { "$rel/$($video.Name)" }) $thumb $gallery
  "[영상] {0}: video={1}, thumb={2}, 패널={3}" -f $dir.Name, $(if ($video) { $video.Name } else { '-' }), $(if ($thumbSrc) { $thumbSrc.Name } else { '-' }), $gallery.Count
}

# ---------- 이미지 폼 작품: ai work/Image · Aesthetic · Design/<작품명> ----------
foreach ($cat in 'Image', 'Aesthetic', 'Design') {
  $imageRoot = Join-Path $work $cat
  if (-not (Test-Path $imageRoot)) { continue }
  foreach ($dir in Get-ChildItem $imageRoot -Directory | Sort-Object { Get-NaturalKey $_.Name }) {
    $rel = "ai work/$cat/$($dir.Name)"
    $files = Get-ChildItem $dir.FullName -File
    $thumbSrc = $files | Where-Object { $_.BaseName -eq 'thumb' -and $_.Extension -match $IMG } | Select-Object -First 1
    $src = $files | Where-Object { ($_.Extension -match $IMG -or $_.Extension -match $VID) -and $_.BaseName -notin 'thumb', 'thumb_web' }
    if (-not $src) { continue }

    $gallery = Convert-Gallery $src (Join-Path $dir.FullName '_web') $rel "$rel/_web" 1800

    $first = $src | Where-Object Extension -match $IMG | Sort-Object { Get-NaturalKey $_.Name } | Select-Object -First 1
    $tsrc = if ($thumbSrc) { $thumbSrc } else { $first }
    $thumb = $null; $thumbFrom = '-'
    $thumbOut = Join-Path $dir.FullName 'thumb_web.jpg'
    if ($tsrc) {
      Save-WebJpg $tsrc.FullName $thumbOut 1600; $thumb = "$rel/thumb_web.jpg"
      $thumbFrom = if ($thumbSrc) { $thumbSrc.Name } else { '첫 이미지' }
    } elseif ($gallery.Count) {
      # 이미지가 하나도 없으면 첫 번째 영상의 장면으로 썸네일 생성
      $tmp = Join-Path $env:TEMP "sync-media-frame.bmp"
      Save-VideoFrame (Resolve-SitePath $gallery[0]) $tmp 1600
      Save-WebJpg $tmp $thumbOut 1600; Remove-Item $tmp -Force -Confirm:$false
      $thumb = "$rel/thumb_web.jpg"; $thumbFrom = '첫 영상 장면'
    }

    $entries += Format-Entry "$cat/$($dir.Name)" 'image' $null $thumb $gallery
    "[$cat] {0}: 파일={1}, thumb={2}" -f $dir.Name, $gallery.Count, $thumbFrom
  }
}

$js = "// 자동 생성 파일 — 직접 수정하지 마세요. tools/sync-media.ps1 을 실행하면 다시 만들어집니다.`n" +
      "window.MEDIA = {`n" + ($entries -join ",`n") + "`n};`n"
[IO.File]::WriteAllText((Join-Path $root "media.js"), $js, (New-Object Text.UTF8Encoding $false))
"media.js 업데이트 완료"
