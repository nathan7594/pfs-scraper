// import-shopify.js
require('dotenv').config();
const db = require('better-sqlite3')('./boutique.db');
const { pusherProduit } = require('./shopify');
const { mettreAJourShopifyIds } = require('./database');

async function main() {
    // On prend 20 produits pas encore publiés
    const produits = db.prepare(`
    SELECT * FROM products 
    WHERE shopify_product_id IS NULL 
    AND prix_vente_ttc IS NOT NULL
    AND sync_status = 'ok'
    LIMIT 20
  `).all();

    console.log(`🚀 Import de ${produits.length} produits sur Shopify\n`);

    let succes = 0;
    let erreurs = 0;

    for (const produit of produits) {
        try {
            const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND stock > 0').all(produit.id);
            const images = db.prepare('SELECT * FROM images WHERE product_id = ?').all(produit.id);

            const result = await pusherProduit(produit, variants, images);

            // On sauvegarde les IDs Shopify en base
            mettreAJourShopifyIds(produit.sku, result.shopify_product_id, result.variants);

            succes++;
            console.log(`✅ ${produit.sku} → ${produit.prix_vente_ttc}€\n`);

            // Délai entre chaque produit pour ne pas surcharger l'API
            await new Promise(r => setTimeout(r, 500));

        } catch (err) {
            console.error(`❌ Erreur ${produit.sku} :`, err.message);
            erreurs++;
        }
    }

    db.close();
    console.log(`\n═══════════════════════════════════`);
    console.log(`✅ Succès  : ${succes}`);
    console.log(`❌ Erreurs : ${erreurs}`);
    console.log(`═══════════════════════════════════`);
}

main().catch(console.error);