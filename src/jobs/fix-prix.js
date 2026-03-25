const db = require('better-sqlite3')(require('path').join(__dirname, '../../boutique.db'));
const { calculerPrixVente } = require('../db/index');
const { decoderSKU } = require('../utils/decoder-sku');

// Étape 1 — On corrige les shopify_type manquants
console.log('🔧 Correction des types manquants...');
const sans_type = db.prepare('SELECT id, sku FROM products WHERE shopify_type IS NULL').all();
sans_type.forEach(p => {
    const decoded = decoderSKU(p.sku);
    db.prepare('UPDATE products SET shopify_type = ?, categorie_code = ? WHERE id = ?')
        .run(decoded.shopify_type, decoded.categorie_code, p.id);
    console.log(`  ${p.sku} → ${decoded.shopify_type}`);
});

// Étape 2 — On recalcule tous les prix
console.log('\n💰 Recalcul des prix...');
const produits = db.prepare('SELECT id, sku, prix_ht, shopify_type FROM products').all();
produits.forEach(p => {
    const prix = calculerPrixVente(p.prix_ht, p.shopify_type);
    db.prepare('UPDATE products SET prix_vente_ttc = ? WHERE id = ?').run(prix, p.id);
});

// Étape 3 — On affiche tous les prix
const resultats = db.prepare('SELECT sku, shopify_type, prix_ht, prix_vente_ttc FROM products ORDER BY shopify_type, prix_ht').all();

console.log('\nSKU                  | Type          | Prix HT  | Prix TTC');
console.log('──────────────────────────────────────────────────────────');
resultats.forEach(p => {
    console.log(
        `${p.sku.padEnd(20)} | ${(p.shopify_type || '?').padEnd(13)} | ${String(p.prix_ht + '€').padEnd(8)} | ${p.prix_vente_ttc}€`
    );
});

db.close();
console.log('\n✅ Tous les prix mis à jour !');