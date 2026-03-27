// main.js
const { loginAVM } = require('./src/scrapers/avm/auth');
const { scraperProduitAVM } = require('./src/scrapers/avm/produit');
const { recupererUrlsCatalogue } = require('./src/scrapers/avm/catalogue');
const { initialiserDb, sauvegarderProduit, getStats } = require('./src/db/index');
const fs = require('fs');

async function main() {
    try {
        console.log('═══════════════════════════════════');
        console.log('🚀 Démarrage scraper AVM');
        console.log('═══════════════════════════════════\n');

        initialiserDb();

        // Étape 1 — Récupération automatique du catalogue
        console.log('Étape 1 : récupération du catalogue...');
        const urls = await recupererUrlsCatalogue();
        console.log(`✅ ${urls.length} produits trouvés\n`);

        // Étape 2 — Connexion AVM
        console.log('Étape 2 : connexion AVM...');
        const page = await loginAVM();
        console.log('');

        // Étape 3 — Scraping de chaque produit
        for (let i = 0; i < urls.length; i++) {
            console.log(`═══════════════════════════════════`);
            console.log(`Produit ${i + 1}/${urls.length}`);
            console.log(`═══════════════════════════════════`);

            const produit = await scraperProduitAVM(page, urls[i]);

            console.log(`\n💾 Sauvegarde en base de données...`);
            const productId = await sauvegarderProduit(produit);
            console.log(`✅ Produit sauvegardé — ID: ${productId}\n`);
        }

        // Étape 4 — Stats finales
        console.log('\n═══════════════════════════════════');
        console.log('📊 Stats base de données :');
        const stats = getStats();
        console.log(`  Total produits  : ${stats.total}`);
        console.log(`  Publiés Shopify : ${stats.publies}`);
        console.log(`  Sans prix vente : ${stats.sans_prix}`);
        console.log(`  Incertains      : ${stats.incertains}`);
        console.log('═══════════════════════════════════');

        await page.browser().close();

    } catch (error) {
        console.error('\n❌ Erreur :', error.message);
        console.error('Stack :', error.stack);
        process.exit(1);
    }
}

main();