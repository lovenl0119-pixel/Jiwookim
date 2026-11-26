# Windows 내장 기능(WinRT)으로 영상 변환·썸네일 추출 — ffmpeg 없이 동작
# sync-media.ps1 에서 . (dot-source) 로 불러서 사용합니다.

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$script:AsTaskOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$script:AsTaskProg = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncActionWithProgress`1' })[0]

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.FileProperties.StorageItemThumbnail, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime] | Out-Null

function Wait-WinRt($op, [Type]$type) {
  $t = $script:AsTaskOp.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result
}

# 영상 코덱 확인: 'avc1'(H.264) / 'hvc1','hev1'(HEVC) 등
function Get-VideoCodec([string]$path) {
  $fs = [IO.File]::OpenRead($path)
  try {
    $len = [Math]::Min($fs.Length, 8MB); $buf = New-Object byte[] $len; [void]$fs.Read($buf, 0, $len)
    $s = [Text.Encoding]::ASCII.GetString($buf)
    if ($fs.Length -gt 8MB) { $fs.Seek(-8MB, 'End') | Out-Null; [void]$fs.Read($buf, 0, 8MB); $s += [Text.Encoding]::ASCII.GetString($buf) }
  } finally { $fs.Close() }
  foreach ($c in 'avc1', 'hvc1', 'hev1', 'av01', 'vp09') { if ($s.Contains($c)) { return $c } }
  return 'unknown'
}

# 어디서나 재생되는 H.264 mp4로 변환 (해상도 유지, 짝수로 맞춤)
function Convert-ToH264([string]$inPath, [string]$outPath, [int]$maxW = 1920, [int]$bitrate = 4000000) {
  $src = Wait-WinRt ([Windows.Storage.StorageFile]::GetFileFromPathAsync($inPath)) ([Windows.Storage.StorageFile])
  $folder = Wait-WinRt ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync([IO.Path]::GetDirectoryName($outPath))) ([Windows.Storage.StorageFolder])
  $dst = Wait-WinRt ($folder.CreateFileAsync([IO.Path]::GetFileName($outPath), [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])

  $props = Wait-WinRt ($src.Properties.GetVideoPropertiesAsync()) ([Windows.Storage.FileProperties.VideoProperties])
  $w = [int]$props.Width; $h = [int]$props.Height
  if ($props.Orientation -in 'Rotate90', 'Rotate270') { $w, $h = $h, $w }
  if ($w -gt $maxW) { $h = [int]($h * $maxW / $w); $w = $maxW }
  $w -= $w % 2; $h -= $h % 2

  $profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD1080p)
  $profile.Video.Width = $w; $profile.Video.Height = $h; $profile.Video.Bitrate = $bitrate
  $tc = New-Object Windows.Media.Transcoding.MediaTranscoder
  $tc.HardwareAccelerationEnabled = $true
  $prep = Wait-WinRt ($tc.PrepareFileTranscodeAsync($src, $dst, $profile)) ([Windows.Media.Transcoding.PrepareTranscodeResult])
  if (-not $prep.CanTranscode) { throw "변환 불가: $($prep.FailureReason) — $inPath" }
  $t = $script:AsTaskProg.MakeGenericMethod([double]).Invoke($null, @($prep.TranscodeAsync())); $t.Wait(-1) | Out-Null
  if ($t.IsFaulted) { throw $t.Exception }
}

# 영상의 대표 장면을 이미지로 저장 (Windows 탐색기 썸네일과 같은 기능)
function Save-VideoFrame([string]$videoPath, [string]$outPath, [int]$size = 1600) {
  [Windows.Storage.FileProperties.ThumbnailMode, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
  $file = Wait-WinRt ([Windows.Storage.StorageFile]::GetFileFromPathAsync($videoPath)) ([Windows.Storage.StorageFile])
  $thumb = Wait-WinRt ($file.GetThumbnailAsync([Windows.Storage.FileProperties.ThumbnailMode]::SingleItem, [uint32]$size, [Windows.Storage.FileProperties.ThumbnailOptions]::ResizeThumbnail)) ([Windows.Storage.FileProperties.StorageItemThumbnail])
  $stream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($thumb)
  $fs = [IO.File]::Create($outPath)
  try { $stream.CopyTo($fs) } finally { $fs.Close(); $stream.Dispose(); $thumb.Dispose() }
}
