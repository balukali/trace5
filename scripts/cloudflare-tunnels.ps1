<#
.SYNOPSIS
    Manage the Cloudflare quick tunnels that publish the TRACE//5 containers.

.DESCRIPTION
    Each container is published on its own trycloudflare.com hostname, so a single
    challenge can be shared on its own link while the hub exposes the full
    platform. The URLs are written to urls.txt so they can be read back after a
    restart, because quick tunnels get a new random hostname every time.

    This network blocks outbound QUIC (UDP 7844), so --protocol http2 is passed
    explicitly. Without it cloudflared retries QUIC forever and every request
    returns HTTP 530 even though a hostname was allocated.

.PARAMETER Action
    Start (default), Stop, or Status.

.EXAMPLE
    .\scripts\cloudflare-tunnels.ps1
    .\scripts\cloudflare-tunnels.ps1 -Action Stop
#>
[CmdletBinding()]
param(
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Start'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$cf = Join-Path $env:USERPROFILE 'cloudflared\cloudflared.exe'
$logDir = Join-Path $root '.tunnels'
$urlFile = Join-Path $logDir 'urls.txt'

if (-not (Test-Path $cf)) { throw "cloudflared not found at $cf" }

# service name -> local port
$targets = [ordered]@{
    'hub'    = 3000
    'lab-01' = 3001
    'lab-02' = 3002
    'lab-03' = 3003
    'lab-04' = 3004
    'lab-05' = 3005
}

function Get-CloudflaredProcs {
    Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue
}

if ($Action -eq 'Stop') {
    $procs = Get-CloudflaredProcs
    if ($procs) {
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Host "Stopped $($procs.Count) cloudflared process(es)." -ForegroundColor Yellow
    } else {
        Write-Host "No cloudflared processes running." -ForegroundColor DarkGray
    }
    return
}

if ($Action -eq 'Status') {
    if (Test-Path $urlFile) {
        Write-Host ''
        Get-Content $urlFile | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
        Write-Host ''
    }
    Write-Host "cloudflared processes: $((Get-CloudflaredProcs | Measure-Object).Count)" -ForegroundColor DarkGray
    return
}

# ---- Start ---------------------------------------------------------------
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

# Clear anything left over so we do not accumulate tunnels.
$existing = Get-CloudflaredProcs
if ($existing) {
    $existing | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}
Remove-Item (Join-Path $logDir '*.log') -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '  Publishing the TRACE//5 containers through Cloudflare quick tunnels' -ForegroundColor Cyan
Write-Host '  ---------------------------------------------------------------' -ForegroundColor Cyan
Write-Host '  Local containers must be running:  docker compose up -d' -ForegroundColor DarkGray
Write-Host ''

$started = @()
foreach ($name in $targets.Keys) {
    $port = $targets[$name]
    $log = Join-Path $logDir "$name.log"
    Start-Process -FilePath $cf -ArgumentList @(
        'tunnel', '--no-autoupdate', '--protocol', 'http2',
        '--url', "http://127.0.0.1:$port",
        '--logfile', $log
    ) -NoNewWindow | Out-Null
    $started += [PSCustomObject]@{ Name = $name; Port = $port; Log = $log }
    Write-Host "  starting $name -> 127.0.0.1:$port ..." -ForegroundColor DarkGray
}

# Wait for each tunnel to register a connection and hand back a hostname.
$deadline = (Get-Date).AddSeconds(90)
$results = @()
foreach ($t in $started) {
    $url = $null
    while ((Get-Date) -lt $deadline -and -not $url) {
        Start-Sleep -Seconds 3
        if (Test-Path $t.Log) {
            $raw = Get-Content $t.Log -Raw -ErrorAction SilentlyContinue
            $m = [regex]::Matches([string]$raw, 'https://[a-z0-9-]+\.trycloudflare\.com')
            if ($m.Count) { $url = $m[$m.Count - 1].Value }
        }
    }
    $results += [PSCustomObject]@{ Name = $t.Name; Port = $t.Port; Url = $url }
}

Write-Host ''
$lines = @()
foreach ($r in $results) {
    if ($r.Url) {
        Write-Host ("  {0,-8} https://{1}" -f $r.Name, ($r.Url -replace '^https://','')) -ForegroundColor Green
        $lines += "$($r.Name) $($r.Url)"
    } else {
        Write-Host ("  {0,-8} FAILED - no hostname assigned (see {1})" -f $r.Name, (Split-Path -Leaf $t.Log)) -ForegroundColor Red
    }
}

$lines | Set-Content $urlFile -Encoding utf8

Write-Host ''
Write-Host '  URLs saved to .tunnels\urls.txt' -ForegroundColor DarkGray
Write-Host '  Stop with:  .\scripts\cloudflare-tunnels.ps1 -Action Stop' -ForegroundColor DarkGray
Write-Host ''
Write-Host '  NOTE: these are account-less quick tunnels. The hostname is random and' -ForegroundColor Yellow
Write-Host '  changes on every restart, and anyone with the link can reach the app.' -ForegroundColor Yellow
Write-Host ''
