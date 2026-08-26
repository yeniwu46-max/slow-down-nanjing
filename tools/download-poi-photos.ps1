$ErrorActionPreference = "Stop"
$OutDir = Join-Path $PSScriptRoot "..\public\images\pois"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$headers = @{
  "User-Agent" = "NingKeManYiDian/1.0 (educational map photos; Wikimedia Commons)"
  "Accept" = "application/json"
}

$queries = @{
  "xuanwu-lake" = "Xuanwu Lake Nanjing"
  "xuanwu-lake-pavilion" = "Xuanwu Lake island Nanjing"
  "jiming-temple" = "Jiming Temple Nanjing"
  "taicheng" = "Nanjing City Wall Taicheng"
  "nanjing-museum" = "Nanjing Museum"
  "presidential-palace" = "Presidential Palace Nanjing"
  "confucius-temple" = "Fuzimiao Nanjing"
  "laomendong" = "Laomendong Nanjing"
  "zhonghua-gate" = "Zhonghua Gate Nanjing"
  "yuhuatai" = "Yuhuatai Nanjing"
  "zhongshan" = "Purple Mountain Nanjing"
  "sun-yat-sen" = "Sun Yat-sen Mausoleum Nanjing"
  "ming-xiaoling" = "Ming Xiaoling Nanjing"
  "meihua-hill" = "Meihua Hill Nanjing"
  "1912" = "1912 district Nanjing"
  "pioneer-bookstore" = "Librairie Avant-Garde Nanjing"
  "yihe-road" = "Yihe Road Nanjing"
  "yijiu-cafe" = "Nanjing villa plane tree"
  "mochou-lake" = "Mochou Lake Nanjing"
  "chaotian-palace" = "Chaotian Palace Nanjing"
  "dabaosi" = "Porcelain Tower Nanjing"
  "qixia" = "Qixia Temple Nanjing"
  "wutong-avenue" = "plane trees Nanjing Zhongshan Road"
}

function Get-ThumbUrls([string]$Query) {
  $encoded = [uri]::EscapeDataString($Query)
  $api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$encoded&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json"
  try {
    $res = Invoke-RestMethod -Uri $api -Headers $headers -TimeoutSec 25
  } catch {
    return @()
  }
  $pages = $res.query.pages
  if (-not $pages) { return @() }
  $urls = @()
  foreach ($p in $pages.PSObject.Properties.Value) {
    $info = $p.imageinfo
    if ($info -and $info[0].thumburl) { $urls += $info[0].thumburl }
    elseif ($info -and $info[0].url) { $urls += $info[0].url }
  }
  return $urls
}

foreach ($id in $queries.Keys) {
  Write-Host "=== $id ==="
  $urls = Get-ThumbUrls $queries[$id]
  $n = 0
  foreach ($url in $urls) {
    if ($n -ge 3) { break }
    $dest = Join-Path $OutDir "$id-$($n+1).jpg"
    try {
      Invoke-WebRequest -Uri $url -Headers $headers -OutFile $dest -TimeoutSec 30
      if ((Get-Item $dest).Length -gt 8000) {
        $n++
        Write-Host "  saved $dest"
      } else {
        Remove-Item $dest -Force -ErrorAction SilentlyContinue
      }
    } catch {
      Write-Host "  fail $url"
    }
  }
  Write-Host "  got $n"
}

Write-Host "done"
Get-ChildItem $OutDir | Measure-Object | Select-Object -ExpandProperty Count
