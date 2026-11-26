<#
  포폴사이트를 http://127.0.0.1:4173 으로 띄우는 간단한 로컬 서버 (이 PC에서만 접속 가능)
  VS Code 안에서 보기: Ctrl+Shift+P → "Simple Browser: Show" → http://127.0.0.1:4173

  실행:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1
  종료:  창을 닫거나 Ctrl+C
#>
param([int]$Port = 4173)

$root = Split-Path $PSScriptRoot -Parent
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.ico' = 'image/x-icon'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm'
  '.woff2' = 'font/woff2'; '.woff' = 'font/woff'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "서버 실행 중: http://127.0.0.1:$Port  (종료: Ctrl+C)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request; $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
      if (-not $rel) { $rel = 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $res.StatusCode = 404; $res.Close(); continue
      }
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
      $res.Headers['Cache-Control'] = 'no-cache'
      $res.Headers['Accept-Ranges'] = 'bytes'

      $fs = [IO.File]::Open($path, 'Open', 'Read', 'ReadWrite')
      try {
        $len = $fs.Length; $start = 0; $end = $len - 1
        # 영상 탐색(구간 요청) 지원
        if ($req.Headers['Range'] -match 'bytes=(\d*)-(\d*)') {
          if ($Matches[1]) { $start = [long]$Matches[1] }
          if ($Matches[2]) { $end = [Math]::Min([long]$Matches[2], $len - 1) }
          elseif (-not $Matches[1]) { $start = [Math]::Max(0, $len - [long]$Matches[2]) }
          $res.StatusCode = 206
          $res.Headers['Content-Range'] = "bytes $start-$end/$len"
        }
        $count = $end - $start + 1
        $res.ContentLength64 = $count
        if ($req.HttpMethod -ne 'HEAD') {
          $fs.Position = $start
          $buf = New-Object byte[] 65536
          while ($count -gt 0) {
            $n = $fs.Read($buf, 0, [Math]::Min($buf.Length, $count))
            if ($n -le 0) { break }
            $res.OutputStream.Write($buf, 0, $n); $count -= $n
          }
        }
      } finally { $fs.Dispose() }
    } catch {
      # 브라우저가 영상 요청을 중간에 끊는 경우 등은 무시
    } finally {
      try { $res.Close() } catch {}
    }
  }
} finally { $listener.Stop() }
