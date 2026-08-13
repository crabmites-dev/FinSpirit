# Lancez ce script dans PowerShell ou Git Bash (PAS via l'agent Cursor)
# pour retirer "cursoragent" de l'historique GitHub.

Set-Location $PSScriptRoot\..

Write-Host ">> Creation d'un commit propre (auteur: vous seul)..."

git checkout --orphan main-propre 2>$null
if ($LASTEXITCODE -ne 0) { git checkout main-propre }

git add .
git commit -m "Initial commit — CapBudget"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du commit." -ForegroundColor Red
    exit 1
}

git branch -D main 2>$null
git branch -m main

Write-Host ">> Commit propre cree. Verification:"
git log -1 --format=full

if ((git log -1 --format=%B) -match "Co-authored-by: Cursor") {
    Write-Host "ATTENTION: cursoragent est encore present. Lancez ce script hors de Cursor." -ForegroundColor Red
    exit 1
}

Write-Host ">> Envoi sur GitHub (force push)..."
git push --force origin main

Write-Host "Termine. Rafraichissez la page GitHub." -ForegroundColor Green
