# migrate.ps1 — Restructuration complète du projet pfs-scraper
# Lance avec : .\migrate.ps1 depuis la racine du projet

Write-Host "`n📁 Etape 1 — Creation des dossiers`n" -ForegroundColor Cyan

# Créer la structure complète
$folders = @(
    "src\scrapers\avm",
    "src\scrapers\pfs",
    "src\db",
    "src\shopify",
    "src\jobs",
    "src\utils",
    "src\notifications",
    "setup",
    "tests",
    "data"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  OK Cree : $folder" -ForegroundColor Green
    }
}

Write-Host "`n📦 Etape 2 — Deplacement des fichiers`n" -ForegroundColor Cyan

function Move-Safe {
    param($src, $dst)
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "  OK $src -> $dst" -ForegroundColor Green
    } else {
        Write-Host "  SKIP $src (introuvable)" -ForegroundColor Yellow
    }
}

# Scrapers AVM
Move-Safe "auth-avm.js"    "src\scrapers\avm\auth.js"
Move-Safe "scraper-avm.js" "src\scrapers\avm\produit.js"

# Scrapers PFS (archivés — on y touche plus)
Move-Safe "auth.js"    "src\scrapers\pfs\auth.js"
Move-Safe "scraper.js" "src\scrapers\pfs\produit.js"
Move-Safe "main.js"    "src\scrapers\pfs\main.js"

# Base de données
Move-Safe "database.js" "src\db\index.js"

# Shopify
Move-Safe "shopify.js"        "src\shopify\client.js"
Move-Safe "import-shopify.js" "src\jobs\import.js"

# Jobs
Move-Safe "fix-prix.js"  "src\jobs\fix-prix.js"
Move-Safe "seoclaude.js" "src\jobs\seo.js"

# Utils
Move-Safe "decoder-sku.js"    "src\utils\decoder-sku.js"
Move-Safe "parser-tailles.js" "src\utils\parser-tailles.js"

# Setup (configuration initiale — usage unique)
Move-Safe "exchange-token.js" "setup\exchange-token.js"
Move-Safe "get-token.js"      "setup\get-token.js"

# Tests
Move-Safe "test-shopify.js" "tests\test-shopify.js"

# Data
Move-Safe "analyse_features.json" "data\analyse_features.json"

# Main — renommer main-avm.js en main.js
Move-Safe "main-avm.js" "main.js"

Write-Host "`n🔧 Etape 3 — Correction des imports`n" -ForegroundColor Cyan

function Fix-Imports {
    param($filePath, $replacements)
    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP $filePath (introuvable)" -ForegroundColor Yellow
        return
    }
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $changed = $false
    foreach ($rep in $replacements) {
        $old = $rep[0]
        $new = $rep[1]
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $new
            $changed = $true
        }
    }
    if ($changed) {
        Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  OK Imports corriges : $filePath" -ForegroundColor Green
    }
}

# main.js
Fix-Imports "main.js" @(
    @("require('./auth-avm')",    "require('./src/scrapers/avm/auth')"),
    @("require('./scraper-avm')", "require('./src/scrapers/avm/produit')"),
    @("require('./database')",    "require('./src/db/index')")
)

# src/scrapers/avm/produit.js
Fix-Imports "src\scrapers\avm\produit.js" @(
    @("require('./parser-tailles')", "require('../../utils/parser-tailles')"),
    @("require('./decoder-sku')",    "require('../../utils/decoder-sku')")
)

# src/jobs/import.js
Fix-Imports "src\jobs\import.js" @(
    @("require('./shopify')",                        "require('../shopify/client')"),
    @("require('./database')",                       "require('../db/index')"),
    @("require('better-sqlite3')('./boutique.db')",  "require('better-sqlite3')(require('path').join(__dirname, '../../boutique.db'))")
)

# src/jobs/fix-prix.js
Fix-Imports "src\jobs\fix-prix.js" @(
    @("require('./database')",                       "require('../db/index')"),
    @("require('./decoder-sku')",                    "require('../utils/decoder-sku')"),
    @("require('better-sqlite3')('./boutique.db')",  "require('better-sqlite3')(require('path').join(__dirname, '../../boutique.db'))")
)

# src/jobs/seo.js
Fix-Imports "src\jobs\seo.js" @(
    @("require('./database')", "require('../db/index')")
)

# tests/test-shopify.js
Fix-Imports "tests\test-shopify.js" @(
    @("require('./shopify')",                        "require('../src/shopify/client')"),
    @("require('./database')",                       "require('../src/db/index')"),
    @("require('better-sqlite3')('./boutique.db')",  "require('better-sqlite3')(require('path').join(__dirname, '../boutique.db'))")
)

Write-Host "`n✅ Migration terminee !`n" -ForegroundColor Green

Write-Host "Structure finale :" -ForegroundColor Cyan
Write-Host @"

pfs-scraper/
├── src/
│   ├── scrapers/
│   │   ├── avm/              <- Tout le scraping AVM (NE PAS TOUCHER)
│   │   │   ├── auth.js          Connexion AVM
│   │   │   └── produit.js       Scraping d'un produit
│   │   └── pfs/              <- Paris Fashion Shops (archivé)
│   │       ├── auth.js
│   │       ├── produit.js
│   │       └── main.js
│   ├── db/
│   │   └── index.js          <- Toutes les requetes base de donnees
│   ├── shopify/
│   │   └── client.js         <- API Shopify
│   ├── jobs/                 <- Taches a lancer
│   │   ├── import.js            Importer produits sur Shopify
│   │   ├── fix-prix.js          Recalculer les prix
│   │   └── seo.js               Generer le SEO
│   ├── utils/                <- Fonctions partagees
│   │   ├── decoder-sku.js       Decode les SKU AVM
│   │   └── parser-tailles.js    Convertit les tailles
│   └── notifications/        <- Alertes (Slack a venir)
├── setup/                    <- Configuration initiale (usage unique)
│   ├── get-token.js
│   └── exchange-token.js
├── tests/                    <- Tests
│   └── test-shopify.js
├── data/                     <- Donnees statiques
│   └── analyse_features.json
├── boutique.db
├── main.js                   <- Point d'entree principal
├── .env
└── package.json

PROCHAINS FICHIERS A CREER :
  src/scrapers/avm/catalogue.js   <- Scraper catalogue AVM automatique
  src/jobs/sync-stocks.js         <- Sync stocks toutes les 2h
  src/jobs/robot.js               <- Orchestre tout
  src/notifications/slack.js      <- Notifications Slack
"@

Write-Host "`nVerifie que tout fonctionne :" -ForegroundColor Yellow
Write-Host "  node main.js`n" -ForegroundColor Cyan