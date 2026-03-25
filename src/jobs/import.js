// src/jobs/import.js
require('dotenv').config();
const { pusherProduit } = require('../shopify/client');
const {
    getProduitsAPublier,
    getVariantsProduit,
    getImagesProduit,
    mettreAJourShopifyIds
} = require('../db/index');

async function main() {
    const produits = await getProduitsAPublier();
    console.log(`🚀 Import de ${produits.length} produits sur Shopify\n`);

    let succes = 0;
    let erreurs = 0;

    for (const produit of produits) {
        try {
            const variants = await getVariantsProduit(produit.id);
            const images = await getImagesProduit(produit.id);

            const result = await pusherProduit(produit, variants, images);

            await mettreAJourShopifyIds(produit.sku, result.shopify_product_id, result.variants);

            succes++;
            console.log(`✅ ${produit.sku} → ${produit.prix_vente_ttc}€\n`);

            await new Promise(r => setTimeout(r, 500));

        } catch (err) {
            console.error(`❌ Erreur ${produit.sku} :`, err.message);
            erreurs++;
        }
    }

    console.log(`\n═══════════════════════════════════`);
    console.log(`✅ Succès  : ${succes}`);
    console.log(`❌ Erreurs : ${erreurs}`);
    console.log(`═══════════════════════════════════`);
}

main().catch(console.error);