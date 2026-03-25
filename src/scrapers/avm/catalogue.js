// src/scrapers/avm/catalogue.js
// Récupère automatiquement toutes les URLs produits depuis le catalogue AVM
// Utilise l'API Ajax AVM sans Puppeteer — ultra rapide

const axios = require('axios');

const CATALOGUE_URL = 'https://www.avmimport.com/fr/4-grossiste-vetement-femme-grande-taille';

async function recupererUrlsCatalogue() {
  console.log('📋 Récupération du catalogue AVM...');

  // Étape 1 — On récupère la page 1 pour connaître le nombre total de pages
  const page1 = await axios.get(`${CATALOGUE_URL}?page=1&content_only=1&infinitescroll=1`);
  const pagination = page1.data.pagination;
  const totalPages = pagination.pages_count;
  const totalProduits = pagination.total_items;

  console.log(`  📦 ${totalProduits} produits trouvés sur ${totalPages} pages`);

  const toutesLesUrls = [];

  // Étape 2 — On extrait les URLs de la page 1 déjà chargée
  const urlsPage1 = page1.data.products.map(p => p.url);
  toutesLesUrls.push(...urlsPage1);
  console.log(`  ✅ Page 1/${totalPages} — ${urlsPage1.length} URLs`);

  // Étape 3 — On boucle sur les pages suivantes
  for (let page = 2; page <= totalPages; page++) {
    try {
      const response = await axios.get(
        `${CATALOGUE_URL}?page=${page}&content_only=1&infinitescroll=1`
      );
      const urls = response.data.products.map(p => p.url);
      toutesLesUrls.push(...urls);
      console.log(`  ✅ Page ${page}/${totalPages} — ${urls.length} URLs`);

      // Délai de 300ms pour ne pas surcharger AVM
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.log(`  ❌ Erreur page ${page} : ${err.message}`);
    }
  }

  console.log(`\n✅ Catalogue récupéré — ${toutesLesUrls.length} URLs au total\n`);
  return toutesLesUrls;
}

module.exports = { recupererUrlsCatalogue };