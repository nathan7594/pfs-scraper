// test-shopify.js
require('dotenv').config();
const db = require('better-sqlite3')('./boutique.db');
const { pusherProduit } = require('./shopify');
const { mettreAJourShopifyIds } = require('./database');

async function main() {
  // On prend le premier produit en base
  const produit = db.prepare(`
    SELECT * FROM products 
    WHERE shopify_product_id IS NULL 
    AND prix_vente_ttc IS NOT NULL
    LIMIT 1
  `).get();

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ?').all(produit.id);
  const images = db.prepare('SELECT * FROM images WHERE product_id = ?').all(produit.id);

  console.log(`Test avec : ${produit.sku} — ${produit.prix_vente_ttc}€`);
  console.log(`Tailles : ${variants.map(v => v.taille_affichee).join(', ')}`);
  console.log(`Images : ${images.length}`);

  const result = await pusherProduit(produit, variants, images);
  console.log('\n✅ Résultat :', result);

  db.close();
}

main().catch(console.error);