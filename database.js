// database.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'boutique.db');

function getDb() {
  return new Database(DB_PATH);
}

function initialiserDb() {
  console.log('🗄️ Initialisation de la base de données...');
  const db = getDb();

  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      source                TEXT NOT NULL,
      sku                   TEXT NOT NULL UNIQUE,
      url                   TEXT,
      titre                 TEXT,
      description_seo       TEXT,
      titre_genere          INTEGER DEFAULT 0,

      -- Catégorie
      categorie             TEXT,
      categorie_code        TEXT,
      shopify_type          TEXT,

      -- Features fréquentes (80%+)
      matiere               TEXT,
      construction          TEXT,
      couleur               TEXT,
      lavage                TEXT,
      correspondance_tailles TEXT,
      saison                TEXT,
      annee                 TEXT,
      imprime               TEXT,
      coupe                 TEXT,
      longueur              TEXT,
      col                   TEXT,
      manches               TEXT,

      -- Features rares
      features_json         TEXT,

      -- Prix
      prix_ht               REAL,
      prix_vente_ttc        REAL,

      -- Shopify / Vinted
      shopify_product_id    TEXT,
      vinted_item_id        TEXT,

      -- Statut
      sync_status           TEXT DEFAULT 'pending',
      stock_incertain       INTEGER DEFAULT 0,
      images_traitees       INTEGER DEFAULT 0,
      notes                 TEXT,
      error_message         TEXT,
      last_synced_at        TEXT,
      created_at            TEXT DEFAULT (datetime('now')),
      updated_at            TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS variants (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id            INTEGER NOT NULL,
      taille_affichee       TEXT NOT NULL,
      taille_avm            TEXT,
      sku_taille            TEXT,
      id_attribute          TEXT,
      id_product_attribute  INTEGER,
      stock                 INTEGER DEFAULT 0,
      disponible            INTEGER DEFAULT 1,
      stock_incertain       INTEGER DEFAULT 0,
      last_stock            INTEGER,
      shopify_variant_id    TEXT,
      updated_at            TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id            INTEGER NOT NULL,
      url                   TEXT NOT NULL,
      position              INTEGER DEFAULT 1,
      shopify_image_id      TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      source                TEXT NOT NULL,
      started_at            TEXT,
      finished_at           TEXT,
      produits_scrapes      INTEGER DEFAULT 0,
      produits_mis_a_jour   INTEGER DEFAULT 0,
      produits_archives     INTEGER DEFAULT 0,
      erreurs               INTEGER DEFAULT 0,
      sync_status           TEXT DEFAULT 'ok',
      error_message         TEXT
    );
  `);

  // Migrations
  const migrations = [
    "ALTER TABLE products ADD COLUMN construction TEXT",
    "ALTER TABLE products ADD COLUMN saison TEXT",
    "ALTER TABLE products ADD COLUMN annee TEXT",
    "ALTER TABLE products ADD COLUMN imprime TEXT",
    "ALTER TABLE products ADD COLUMN features_json TEXT",
    "ALTER TABLE products ADD COLUMN categorie_code TEXT",
    "ALTER TABLE products ADD COLUMN shopify_type TEXT",
    "ALTER TABLE products ADD COLUMN correspondance_tailles TEXT",
    "ALTER TABLE variants ADD COLUMN id_attribute TEXT",
    "ALTER TABLE variants ADD COLUMN id_product_attribute INTEGER",
  ];

  migrations.forEach(sql => {
    try {
      db.prepare(sql).run();
      console.log(`  ✅ Migration : ${sql.split('ADD COLUMN')[1]?.trim()}`);
    } catch (e) {
      // Colonne déjà existante — on ignore
    }
  });

  console.log('✅ Base de données initialisée');
  db.close();
}

function calculerPrixVente(prix_ht, shopify_type) {
  if (!prix_ht) return null;
  const prix_brut = prix_ht * 4 * 1.20;

  // Arrondi vers le bas au .90 le plus proche
  const prix_arrondi = Math.floor(prix_brut) - 0.10;

  // Plafond par catégorie
  const plafonds = {
    'Combinaison': 39.90,
    'Robe': 49.90,
    'Robe longue': 49.90,
    'Pantalon': 44.90,
    'Tunique': 34.90,
  }

  const plafond = plafonds[shopify_type] || 49.90;
  return Math.min(prix_arrondi, plafond);
}

function sauvegarderProduit(produit) {
  const db = getDb();
  db.pragma('foreign_keys = ON');

  // Features rares → JSON
  const colonnesSeparees = [
    'Matière', 'Construction', 'Couleur', 'Lavage',
    'Correspondance Tailles UE', 'Saison', 'Année',
    'Imprimé', 'Coupe', 'Longueur', 'Col', 'Manches'
  ];
  const featuresRares = {};
  Object.entries(produit.features || {}).forEach(([k, v]) => {
    if (!colonnesSeparees.includes(k)) {
      featuresRares[k] = v;
    }
  });
  const featuresJson = Object.keys(featuresRares).length > 0
    ? JSON.stringify(featuresRares)
    : null;

  try {
    const sauvegarder = db.transaction(() => {

      const existant = db.prepare(
        'SELECT id, shopify_product_id FROM products WHERE sku = ?'
      ).get(produit.sku);

      let productId;

      if (existant) {
        console.log(`  🔄 Produit existant — mise à jour : ${produit.sku}`);
        db.prepare(`
          UPDATE products SET
            url = ?, categorie = ?, categorie_code = ?, shopify_type = ?,
            matiere = ?, construction = ?, couleur = ?, lavage = ?,
            correspondance_tailles = ?, saison = ?, annee = ?,
            imprime = ?, coupe = ?, longueur = ?, col = ?, manches = ?,
            features_json = ?, prix_ht = ?,
            prix_vente_ttc = COALESCE(prix_vente_ttc, ?),
            stock_incertain = ?,
            sync_status = 'ok', error_message = null,
            last_synced_at = datetime('now'),
            updated_at = datetime('now')
          WHERE sku = ?
        `).run(
          produit.url,
          produit.categorie,
          produit.categorie_code || null,
          produit.shopify_type || null,
          produit.features?.['Matière'] || null,
          produit.features?.['Construction'] || null,
          produit.features?.['Couleur'] || null,
          produit.features?.['Lavage'] || null,
          produit.features?.['Correspondance Tailles UE'] || null,
          produit.features?.['Saison'] || null,
          produit.features?.['Année'] || null,
          produit.features?.['Imprimé'] || null,
          produit.features?.['Coupe'] || null,
          produit.features?.['Longueur'] || null,
          produit.features?.['Col'] || null,
          produit.features?.['Manches'] || null,
          featuresJson,
          produit.prix_ht,
          calculerPrixVente(produit.prix_ht),
          produit.stock_incertain ? 1 : 0,
          produit.sku
        );
        productId = existant.id;

        db.prepare('DELETE FROM variants WHERE product_id = ?').run(productId);

      } else {
        console.log(`  ➕ Nouveau produit : ${produit.sku}`);
        const result = db.prepare(`
          INSERT INTO products (
            source, sku, url, categorie, categorie_code, shopify_type,
            matiere, construction, couleur, lavage, correspondance_tailles,
            saison, annee, imprime, coupe, longueur, col, manches,
            features_json, prix_ht, prix_vente_ttc,
            stock_incertain, sync_status, last_synced_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, 'ok', datetime('now')
          )
        `).run(
          produit.source,
          produit.sku,
          produit.url,
          produit.categorie,
          produit.categorie_code || null,
          produit.shopify_type || null,
          produit.features?.['Matière'] || null,
          produit.features?.['Construction'] || null,
          produit.features?.['Couleur'] || null,
          produit.features?.['Lavage'] || null,
          produit.features?.['Correspondance Tailles UE'] || null,
          produit.features?.['Saison'] || null,
          produit.features?.['Année'] || null,
          produit.features?.['Imprimé'] || null,
          produit.features?.['Coupe'] || null,
          produit.features?.['Longueur'] || null,
          produit.features?.['Col'] || null,
          produit.features?.['Manches'] || null,
          featuresJson,
          produit.prix_ht,
          calculerPrixVente(produit.prix_ht),
          produit.stock_incertain ? 1 : 0
        );
        productId = result.lastInsertRowid;

        // Images
        if (produit.images?.length > 0) {
          const insertImage = db.prepare(`
            INSERT INTO images (product_id, url, position)
            VALUES (?, ?, ?)
          `);
          produit.images.forEach((url, i) => {
            insertImage.run(productId, url, i + 1);
          });
          console.log(`  🖼️ ${produit.images.length} images sauvegardées`);
        }
      }

      // Variantes
      const insertVariant = db.prepare(`
        INSERT INTO variants (
          product_id, taille_affichee, taille_avm, sku_taille,
          id_attribute, id_product_attribute,
          stock, disponible, stock_incertain
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      produit.tailles.forEach(taille => {
        insertVariant.run(
          productId,
          taille.taille_affichee,
          taille.taille_avm,
          taille.sku_taille,
          taille.id_attribute || null,
          taille.id_product_attribute || null,
          taille.stock,
          taille.disponible ? 1 : 0,
          taille.stock_incertain ? 1 : 0
        );
      });

      console.log(`  📦 ${produit.tailles.length} variantes sauvegardées`);
      return productId;
    });

    return sauvegarder();

  } finally {
    db.close();
  }
}

function mettreAJourSEO(sku, titre, description) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE products
      SET titre = ?,
          description_seo = ?,
          titre_genere = 1,
          updated_at = datetime('now')
      WHERE sku = ?
    `).run(titre, description, sku);
    console.log(`  ✅ SEO sauvegardé pour ${sku}`);
  } finally {
    db.close();
  }
}

function getProduitsAPublier() {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT p.*,
        GROUP_CONCAT(v.taille_affichee || ':' || v.stock) as tailles_stock
      FROM products p
      LEFT JOIN variants v ON v.product_id = p.id
      WHERE p.shopify_product_id IS NULL
        AND p.prix_vente_ttc IS NOT NULL
        AND p.sync_status = 'ok'
      GROUP BY p.id
    `).all();
  } finally {
    db.close();
  }
}

function logSync(source, data) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO sync_logs (
        source, started_at, finished_at,
        produits_scrapes, produits_mis_a_jour,
        produits_archives, erreurs, sync_status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      source,
      data.started_at,
      data.finished_at,
      data.produits_scrapes || 0,
      data.produits_mis_a_jour || 0,
      data.produits_archives || 0,
      data.erreurs || 0,
      data.sync_status || 'ok',
      data.error_message || null
    );
  } finally {
    db.close();
  }
}

function getStats() {
  const db = getDb();
  try {
    return {
      total: db.prepare('SELECT COUNT(*) as n FROM products').get().n,
      pending: db.prepare("SELECT COUNT(*) as n FROM products WHERE sync_status = 'pending'").get().n,
      publies: db.prepare('SELECT COUNT(*) as n FROM products WHERE shopify_product_id IS NOT NULL').get().n,
      sans_prix: db.prepare('SELECT COUNT(*) as n FROM products WHERE prix_vente_ttc IS NULL').get().n,
      incertains: db.prepare('SELECT COUNT(*) as n FROM products WHERE stock_incertain = 1').get().n,
    };
  } finally {
    db.close();
  }
}
function mettreAJourShopifyIds(sku, shopifyProductId, shopifyVariants) {
  const db = getDb();
  try {
    // Met à jour le produit
    db.prepare(`
      UPDATE products 
      SET shopify_product_id = ?,
          sync_status = 'ok',
          last_synced_at = datetime('now'),
          updated_at = datetime('now')
      WHERE sku = ?
    `).run(shopifyProductId, sku);

    // Met à jour chaque variante
    shopifyVariants.forEach(v => {
      db.prepare(`
        UPDATE variants 
        SET shopify_variant_id = ?
        WHERE product_id = (SELECT id FROM products WHERE sku = ?)
        AND taille_affichee = ?
      `).run(v.shopify_variant_id, sku, v.taille_affichee);
    });

    console.log(`  ✅ IDs Shopify sauvegardés pour ${sku}`);
  } finally {
    db.close();
  }
}

module.exports = {
  initialiserDb,
  sauvegarderProduit,
  mettreAJourSEO,
  mettreAJourShopifyIds,
  getProduitsAPublier,
  logSync,
  getStats,
  calculerPrixVente
};