// scraper.js
async function scraperProduit(page, url) {
    console.log(`🔍 Scraping : ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const produit = await page.evaluate(() => {

        const nom = document.querySelector('h1.product-title')?.innerText?.trim();
        const prixTexte = document.querySelector('.variant-sale-price')?.innerText?.trim();
        const prix = prixTexte?.replace('€', '').replace(',', '.').trim();
        const description = document.querySelector('[data-content="description"]')?.innerText?.trim();
        const fournisseur = document.querySelector('[data-content="wholesaler"] .value')?.innerText?.replace(':', '').trim();
        const sku = document.querySelector('[data-content="reference"] .value')?.innerText?.replace(':', '').trim();

        const tousLesItems = [...document.querySelectorAll('.variant-item')];

        const unitesUniquement = tousLesItems.filter(item => {
            const typeTexte = item.querySelector('.item-type')?.innerText?.trim();
            return typeTexte && typeTexte.includes('Unité');
        });

        const variantes = unitesUniquement.map(item => {
            const variantId = item.getAttribute('data-variant-id');
            const couleurRef = item.querySelector('.color-circle')?.getAttribute('data-color-reference');
            const couleurLabel = item.querySelector('.color-label')?.innerText?.trim();
            const taille = item.querySelector('.item-size')?.innerText?.trim();

            // ─── Détection stock — 3 cas ────────────────────────────
            let stock;
            if (item.classList.contains('no-stock')) {
                // Rupture totale
                stock = 0;
            } else if (item.querySelector('.low-stock')) {
                // Stock faible — on extrait le chiffre
                const match = item.querySelector('.low-stock').innerText.match(/\d+/);
                stock = match ? parseInt(match[0]) : 1;
            } else {
                // Stock normal — disponible
                stock = 99;
            }

            const imageUrl = item.querySelector('.color-hover img')?.getAttribute('src')
                ?.replace('w_200', 'w_1200');

            return {
                variant_id: variantId,
                couleur_ref: couleurRef,
                couleur_label: couleurLabel,
                taille: taille,
                stock: stock,
                disponible: stock > 0,
                image: imageUrl
            };
        });

        return { nom, prix, description, fournisseur, sku, variantes };
    });

    produit.url = url;
    produit.scraped_at = new Date().toISOString();
    return produit;
}

module.exports = { scraperProduit };