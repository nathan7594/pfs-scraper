// src/db/index.js
// Base de données Supabase (PostgreSQL cloud)
// Remplace l'ancien database.js SQLite

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ─── Initialisation ────────────────────────────────────────────────────────
function initialiserDb() {
  console.log('🗄️ Connexion à Supabase...');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('SUPABASE_URL et SUPABASE_KEY manquants dans .env');
  }
  console.log('✅ Supabase connecté !');
}

// ─── Calcul prix de vente ──────────────────────────────────────────────────
function calculerPrixVente(prix_ht, shopify_type) {
  if (!prix_ht) return null;
  const prix_brut = prix_ht * 4 * 1.20;
  const prix_arrondi = Math.floor(prix_brut) - 0.10;

  const plafonds = {
    'Combinaison': 39.90,
    'Robe': 49.90,
    'Robe longue': 49.90,
    'Pantalon': 44.90,
    'Tunique': 34.90,
  };

  const plafond = plafonds[shopify_type] || 49.90;
  return Math.min(prix_arrondi, plafond);
}

// ─── Sauvegarder un produit ────────────────────────────────────────────────
async function sauvegarderProduit(produit) {

  // Features rares → JSON
  const colonnesSeparees = [
    'Matière', 'Construction', 'Couleur', 'Lavage',
    'Correspondance Tailles UE', 'Saison', 'Année',
    'Imprimé', 'Coupe', 'Longueur', 'Col', 'Manches'
  ];
  const featuresRares = {};
  Object.entries(produit.features || {}).forEach(([k, v]) => {
    if (!colonnesSeparees.includes(k)) featuresRares[k] = v;
  });
  const featuresJson = Object.keys(featuresRares).length > 0
    ? JSON.stringify(featuresRares)
    : null;

  // Vérifie si le produit existe déjà
  const { data: existant } = await supabase
    .from('products')
    .select('id, shopify_product_id')
    .eq('sku', produit.sku)
    .single();

  let productId;

  if (existant) {
    console.log(`  🔄 Produit existant — mise à jour : ${produit.sku}`);

    await supabase.from('products').update({
      url: produit.url,
      categorie: produit.categorie,
      categorie_code: produit.categorie_code || null,
      shopify_type: produit.shopify_type || null,
      matiere: produit.features?.['Matière'] || null,
      construction: produit.features?.['Construction'] || null,
      couleur: produit.features?.['Couleur'] || null,
      lavage: produit.features?.['Lavage'] || null,
      correspondance_tailles: produit.features?.['Correspondance Tailles UE'] || null,
      saison: produit.features?.['Saison'] || null,
      annee: produit.features?.['Année'] || null,
      imprime: produit.features?.['Imprimé'] || null,
      coupe: produit.features?.['Coupe'] || null,
      longueur: produit.features?.['Longueur'] || null,
      col: produit.features?.['Col'] || null,
      manches: produit.features?.['Manches'] || null,
      features_json: featuresJson,
      prix_ht: produit.prix_ht,
      stock_incertain: produit.stock_incertain ? 1 : 0,
      sync_status: 'ok',
      error_message: null,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('sku', produit.sku);

    productId = existant.id;

    // Supprime les anciennes variantes
    await supabase.from('variants').delete().eq('product_id', productId);

  } else {
    console.log(`  ➕ Nouveau produit : ${produit.sku}`);

    const { data: newProduct, error } = await supabase.from('products').insert({
      source: produit.source,
      sku: produit.sku,
      url: produit.url,
      categorie: produit.categorie,
      categorie_code: produit.categorie_code || null,
      shopify_type: produit.shopify_type || null,
      matiere: produit.features?.['Matière'] || null,
      construction: produit.features?.['Construction'] || null,
      couleur: produit.features?.['Couleur'] || null,
      lavage: produit.features?.['Lavage'] || null,
      correspondance_tailles: produit.features?.['Correspondance Tailles UE'] || null,
      saison: produit.features?.['Saison'] || null,
      annee: produit.features?.['Année'] || null,
      imprime: produit.features?.['Imprimé'] || null,
      coupe: produit.features?.['Coupe'] || null,
      longueur: produit.features?.['Longueur'] || null,
      col: produit.features?.['Col'] || null,
      manches: produit.features?.['Manches'] || null,
      features_json: featuresJson,
      prix_ht: produit.prix_ht,
      prix_vente_ttc: calculerPrixVente(produit.prix_ht, produit.shopify_type),
      stock_incertain: produit.stock_incertain ? 1 : 0,
      sync_status: 'ok',
      last_synced_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    productId = newProduct.id;

    // Images
    if (produit.images?.length > 0) {
      const images = produit.images.map((url, i) => ({
        product_id: productId,
        url: url,
        position: i + 1
      }));
      await supabase.from('images').insert(images);
      console.log(`  🖼️ ${produit.images.length} images sauvegardées`);
    }
  }

  // Variantes
  if (produit.tailles?.length > 0) {
    const variants = produit.tailles.map(taille => ({
      product_id: productId,
      taille_affichee: taille.taille_affichee,
      taille_avm: taille.taille_avm,
      sku_taille: taille.sku_taille,
      id_attribute: taille.id_attribute || null,
      id_product_attribute: taille.id_product_attribute || null,
      stock: taille.stock,
      disponible: taille.disponible ? 1 : 0,
      stock_incertain: taille.stock_incertain ? 1 : 0
    }));
    await supabase.from('variants').insert(variants);
    console.log(`  📦 ${produit.tailles.length} variantes sauvegardées`);
  }

  return productId;
}

// ─── Mettre à jour le SEO ──────────────────────────────────────────────────
async function mettreAJourSEO(sku, titre, description) {
  await supabase.from('products').update({
    titre: titre,
    description_seo: description,
    titre_genere: 1,
    updated_at: new Date().toISOString()
  }).eq('sku', sku);
  console.log(`  ✅ SEO sauvegardé pour ${sku}`);
}

// ─── Mettre à jour les IDs Shopify ────────────────────────────────────────
async function mettreAJourShopifyIds(sku, shopifyProductId, shopifyVariants) {
  await supabase.from('products').update({
    shopify_product_id: shopifyProductId,
    sync_status: 'ok',
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('sku', sku);

  for (const v of shopifyVariants) {
    await supabase.from('variants').update({
      shopify_variant_id: v.shopify_variant_id
    })
      .eq('taille_affichee', v.taille_affichee)
      .eq('product_id', supabase.from('products').select('id').eq('sku', sku));
  }

  console.log(`  ✅ IDs Shopify sauvegardés pour ${sku}`);
}

// ─── Récupérer les produits à publier ─────────────────────────────────────
async function getProduitsAPublier() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .is('shopify_product_id', null)
    .not('prix_vente_ttc', 'is', null)
    .eq('sync_status', 'ok')
    .limit(20);
  return data || [];
}

// ─── Récupérer les variantes d'un produit ─────────────────────────────────
async function getVariantsProduit(productId) {
  const { data } = await supabase
    .from('variants')
    .select('*')
    .eq('product_id', productId)
    .gt('stock', 0);
  return data || [];
}

// ─── Récupérer les images d'un produit ────────────────────────────────────
async function getImagesProduit(productId) {
  const { data } = await supabase
    .from('images')
    .select('*')
    .eq('product_id', productId);
  return data || [];
}

// ─── Logger une sync ──────────────────────────────────────────────────────
async function logSync(source, data) {
  await supabase.from('sync_logs').insert({
    source: source,
    started_at: data.started_at,
    finished_at: data.finished_at,
    produits_scrapes: data.produits_scrapes || 0,
    produits_mis_a_jour: data.produits_mis_a_jour || 0,
    produits_archives: data.produits_archives || 0,
    erreurs: data.erreurs || 0,
    sync_status: data.sync_status || 'ok',
    error_message: data.error_message || null
  });
}

// ─── Statistiques ─────────────────────────────────────────────────────────
async function getStats() {
  const total = await supabase.from('products').select('id', { count: 'exact' });
  const publies = await supabase.from('products').select('id', { count: 'exact' }).not('shopify_product_id', 'is', null);
  const sans_prix = await supabase.from('products').select('id', { count: 'exact' }).is('prix_vente_ttc', null);
  const incertains = await supabase.from('products').select('id', { count: 'exact' }).eq('stock_incertain', 1);

  return {
    total: total.count ?? 0,
    publies: publies.count ?? 0,
    sans_prix: sans_prix.count ?? 0,
    incertains: incertains.count ?? 0
  };
}

module.exports = {
  initialiserDb,
  sauvegarderProduit,
  mettreAJourSEO,
  mettreAJourShopifyIds,
  getProduitsAPublier,
  getVariantsProduit,
  getImagesProduit,
  logSync,
  getStats,
  calculerPrixVente,
  supabase
};