# TRACE//5 — one-command GitHub push helper (Windows PowerShell)
#
# HOW TO USE
#   1. Run in PowerShell:  .\PUSH-TO-GITHUB.ps1
#   (the remote below is already set to your fork, so no manual setup is needed)
#
# If PowerShell blocks the script, run this once first:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# NOTE: scripts/flags.json is the plaintext flag authoring file. It is
# gitignored, so this helper will never commit or push it.

$ErrorActionPreference = 'Stop'
# Your fork. Change this only if you fork the project again.
$repoUrl = 'https://github.com/balukali/trace5.git'

# Make sure git is reachable (it is installed but not on PATH by default here).
$gitDir = 'C:\Program Files\Git\cmd'
if (Test-Path $gitDir) { $env:Path += ";$gitDir" }

Write-Host ''
Write-Host '  TRACE//5  -  GitHub push helper' -ForegroundColor Cyan
Write-Host '  ---------------------------------' -ForegroundColor Cyan
Write-Host "  Folder : $PWD"
Write-Host "  Repo   : $repoUrl"
Write-Host ''

# Step 1: verify the local repository
$branch = (& git rev-parse --abbrev-ref HEAD 2>&1)
$count  = (& git rev-list --count HEAD 2>&1)
$dirty  = (& git status --porcelain 2>&1)

if ($LASTEXITCODE -ne 0) {
    Write-Host '  ERROR: this folder is not a git repository.' -ForegroundColor Red
    Write-Host '  Run "git init" first, or ask for help.' -ForegroundColor Red
    exit 1
}

Write-Host "  [1/4] Local repository found" -ForegroundColor Green
Write-Host "        branch  : $branch"
Write-Host "        commits : $count"
Write-Host "        pending : $(($dirty | Measure-Object).Count) file(s) changed"

# Step 2: commit anything outstanding so nothing is lost
if (($dirty | Measure-Object).Count -gt 0) {
    Write-Host '  [2/4] Committing your latest changes...' -ForegroundColor Yellow
    & git add -A
    & git commit -m 'Update from TRACE//5 push helper' 2>&1 | Out-Null
    Write-Host '        committed.' -ForegroundColor Green
} else {
    Write-Host '  [2/4] Nothing to commit - working tree is clean' -ForegroundColor Green
}

# Step 3: point at the GitHub remote
$current = (& git remote get-url origin 2>&1)
if ($current -eq $repoUrl) {
    Write-Host '  [3/4] Remote already correct' -ForegroundColor Green
} else {
    Write-Host '  [3/4] Setting remote...' -ForegroundColor Yellow
    if ($current -and $LASTEXITCODE -eq 0) {
        & git remote set-url origin $repoUrl
    } else {
        & git remote add origin $repoUrl
    }
    Write-Host '        origin set.' -ForegroundColor Green
}

# Step 4: push
Write-Host '  [4/4] Pushing to GitHub...' -ForegroundColor Cyan
Write-Host ''
Write-Host '  >>> If a browser window opens asking you to sign in to GitHub,'
Write-Host '  >>> approve it there. Never type your password into this window.'
Write-Host ''

& git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ''
    Write-Host '  SUCCESS - your code is on GitHub.' -ForegroundColor Green
    Write-Host ''
    Write-Host "  Repo URL : https://github.com/balukali/trace5" -ForegroundColor White
    Write-Host ''
    Write-Host '  NEXT STEP - go live on Vercel:' -ForegroundColor Cyan
    Write-Host '    1. Open https://vercel.com/new' -ForegroundColor White
    Write-Host '    2. Sign in with GitHub' -ForegroundColor White
    Write-Host '    3. Find the "trace5" repo and click Import' -ForegroundColor White
    Write-Host '    4. Click Deploy (no settings needed)' -ForegroundColor White
    Write-Host '    5. Wait ~60 seconds for your live link.' -ForegroundColor White
    Write-Host ''
} else {
    Write-Host ''
    Write-Host '  PUSH FAILED' -ForegroundColor Red
    Write-Host ''
    Write-Host '  Most likely cause: the repository does not exist on GitHub yet.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  FIX: open https://github.com/new and create it:' -ForegroundColor Yellow
    Write-Host '    - Repository name : trace5' -ForegroundColor White
    Write-Host '    - Visibility      : Public' -ForegroundColor White
    Write-Host '    - LEAVE EVERY CHECKBOX UNCHECKED (no README / .gitignore / licence)' -ForegroundColor White
    Write-Host '    - Click "Create repository"' -ForegroundColor White
    Write-Host ''
    Write-Host '  Then run this script again.' -ForegroundColor Yellow
    Write-Host ''
}
