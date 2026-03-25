// main.js
const { login } = require('./auth');
const { scraperProduit } = require('./scraper');
const fs = require('fs');

async function main() {
    try {
        console.log('Étape 1 : connexion...');
        const page = await login();

        // Test produit 1 — jupe avec 10 couleurs
        console.log('Étape 2 : scraping produit 1...');
        const produit1 = await scraperProduit(
            page,
            'https://parisfashionshops.com/fr/femme/produit/danny-jupe-en-broderie_69b7cc29bb614'
        );
        fs.writeFileSync('produit1.json', JSON.stringify(produit1, null, 2));
        console.log(`✅ Produit 1 : ${produit1.variantes.length} variantes unité`);

        // Test produit 2 — tunique avec packs
        console.log('Étape 3 : scraping produit 2...');
        const produit2 = await scraperProduit(
            page,
            'https://parisfashionshops.com/fr/femme/produit/pomme-rouge-tunique-noir-grande-taille-avec-empiecement-imprime-a877_69b44926a5cce'
        );
        fs.writeFileSync('produit2.json', JSON.stringify(produit2, null, 2));
        console.log(`✅ Produit 2 : ${produit2.variantes.length} variantes unité`);

        // Dans main.js ajoute ce produit
        const produit3 = await scraperProduit(
            page,
            'https://parisfashionshops.com/fr/femme/produit/cmeloide-pantalon-feminin-decontracte_697795cb648a7'
        );
        fs.writeFileSync('produit3.json', JSON.stringify(produit3, null, 2));
        console.log(`✅ Produit 3 : ${produit3.variantes.length} variantes`);

        await page.browser().close();

    } catch (error) {
        console.error('❌ Erreur :', error.message);
        process.exit(1);
    }
}

main();