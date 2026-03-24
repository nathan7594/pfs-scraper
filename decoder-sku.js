// decoder-sku.js

const PREFIXES_AVM = [
  // Combinaisons — en premier car MCCOP contient COP
  { prefix: 'MCCOP',   categorie_code: 'Combinaisons GT',  shopify_type: 'Combinaison' },

  // Robes longues
  { prefix: 'MCMAXIP', categorie_code: 'Robes longues GT', shopify_type: 'Robe longue' },
  { prefix: 'LMAXIP',  categorie_code: 'Robes longues',    shopify_type: 'Robe longue' },
  { prefix: 'MAXIP',   categorie_code: 'Robes longues',    shopify_type: 'Robe longue' },

  // Robes courtes
  { prefix: 'MCROP',   categorie_code: 'Robes courtes GT', shopify_type: 'Robe' },
  { prefix: 'ROPV',    categorie_code: 'Robes courtes',    shopify_type: 'Robe' },
  { prefix: 'ROP',     categorie_code: 'Robes courtes',    shopify_type: 'Robe' },

  // Pantalons
  { prefix: 'MCPAP',   categorie_code: 'Pantalons GT',     shopify_type: 'Pantalon' },
  { prefix: 'LPAP',    categorie_code: 'Pantalons',        shopify_type: 'Pantalon' },
  { prefix: 'PAPV',    categorie_code: 'Pantalons',        shopify_type: 'Pantalon' },
  { prefix: 'PAP',     categorie_code: 'Pantalons',        shopify_type: 'Pantalon' },

  // Tuniques / Chemises
  { prefix: 'MCTUP',   categorie_code: 'Tuniques GT',      shopify_type: 'Tunique' },
  { prefix: 'TUPV',    categorie_code: 'Tuniques',         shopify_type: 'Tunique' },
  { prefix: 'TUP',     categorie_code: 'Tuniques',         shopify_type: 'Tunique' },
];

function decoderSKU(sku) {
  console.log(`  🔍 Décodage SKU : ${sku}`);

  // On cherche le préfixe le plus long qui correspond
  // IMPORTANT : les préfixes longs doivent être testés avant les courts
  // Ex: MCMAXIP avant MAXIP, MCROP avant ROP
  for (const item of PREFIXES_AVM) {
    if (sku.startsWith(item.prefix)) {
      console.log(`  ✅ ${sku} → ${item.categorie_code} (${item.shopify_type})`);
      return {
        categorie_code: item.categorie_code,
        shopify_type: item.shopify_type
      };
    }
  }

  console.log(`  ⚠️ Préfixe inconnu pour : ${sku}`);
  return {
    categorie_code: 'Autres',
    shopify_type: 'Vêtement'
  };
}

module.exports = { decoderSKU };