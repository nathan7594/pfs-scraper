// scraper-avm.js
const axios = require('axios');
const { eclaterTailles } = require('../../utils/parser-tailles');
const { decoderSKU } = require('../../utils/decoder-sku');

async function scraperProduitAVM(page, url) {
    console.log(`🔍 Scraping AVM : ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const donnees = await page.evaluate(() => {
        const token = document.querySelector('input[name="token"]')?.value;
        const dataProduct = JSON.parse(
            document.querySelector('#product-details')?.dataset?.product
        );

        if (!dataProduct) return null;

        const idProductAttributeDefaut = dataProduct.id_product_attribute;

        const tailleEls = [...document.querySelectorAll('#group_1 li')];
        const tailles = tailleEls.map((li) => ({
            nom: li.querySelector('.radio-label')?.innerText?.trim(),
            id_attribute: li.querySelector('input')?.value,
            id_product_attribute: null
        }));

        const indexDefaut = tailleEls.findIndex(li =>
            li.querySelector('input')?.checked
        );

        tailles.forEach((t, i) => {
            t.id_product_attribute = idProductAttributeDefaut + (i - indexDefaut);
        });

        const images = dataProduct.images.map(img => img.large?.url).filter(Boolean);

        const features = {};
        Object.values(dataProduct.features || {}).forEach(f => {
            features[f.name] = f.value;
        });

        return {
            token,
            id_product: dataProduct.id_product,
            sku: dataProduct.reference,
            prix_ht: dataProduct.price_amount,
            description: dataProduct.description_short?.replace(/<[^>]*>/g, '').trim(),
            tailles,
            images,
            features,
            category: dataProduct.category_name
        };
    });

    if (!donnees) throw new Error('Impossible de parser le produit AVM');

    const cookies = await page.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log(`📦 ${donnees.tailles.length} tailles à scraper...`);

    const taillesAvecStock = [];
    let skuIncertain = false;

    for (const taille of donnees.tailles) {
        try {
            const url_api = `https://www.avmimport.com/fr/index.php?controller=product&token=${donnees.token}&id_product=${donnees.id_product}&id_product_attribute=${taille.id_product_attribute}&id_customization=0&qty=1&ajax=1&action=refresh`;

            const response = await axios.get(url_api, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'Cookie': cookieString
                }
            });

            const htmlDetails = response.data.product_details;
            const match = htmlDetails.match(/data-product="([^"]+)"/);
            const dataProduct = JSON.parse(match[1].replace(/&quot;/g, '"'));

            // Validation SKU — on vérifie que la taille retournée correspond
            const skuRecu = dataProduct.attributes?.['1']?.reference || ''
            const stockIncertainTaille = !skuRecu.startsWith(donnees.sku)

            if (stockIncertainTaille) {
                console.log(`  ⚠️ SKU inattendu pour ${taille.nom} : reçu ${skuRecu} — mauvais produit retourné`)
                skuIncertain = true
            } else {
                console.log(`  ✅ ${taille.nom} → stock: ${dataProduct.quantity} | SKU OK`);
            }

            taillesAvecStock.push({
                taille: taille.nom,
                id_attribute: taille.id_attribute,
                id_product_attribute: taille.id_product_attribute,
                sku_taille: skuRecu,
                stock: dataProduct.quantity || 0,
                disponible: dataProduct.availability === 'available',
                stock_incertain: stockIncertainTaille
            });

            await new Promise(r => setTimeout(r, 300));

        } catch (err) {
            console.log(`  ⚠️ Erreur taille ${taille.nom}:`, err.message);
            skuIncertain = true
            taillesAvecStock.push({
                taille: taille.nom,
                id_attribute: taille.id_attribute,
                id_product_attribute: taille.id_product_attribute,
                sku_taille: null,
                stock: 0,
                disponible: false,
                stock_incertain: true
            });
        }
    }

    // Alerte globale si au moins une taille est incertaine
    if (skuIncertain) {
        console.log(`\n🚨 ATTENTION : stocks incertains détectés sur ${donnees.sku} — vérification manuelle recommandée`);
    }

    const decoded = decoderSKU(donnees.sku);

    return {
        source: 'avm',
        sku: donnees.sku,
        categorie_code: decoded.categorie_code,
        shopify_type: decoded.shopify_type,
        prix_ht: donnees.prix_ht,
        description: donnees.description,
        categorie: donnees.category,
        matiere: donnees.features['Matière'] || null,
        construction: donnees.features['Construction'] || null,
        couleur: donnees.features['Couleur'] || null,
        correspondance_tailles: donnees.features['Correspondance Tailles UE'] || null,
        saison: donnees.features['Saison'] || null,
        annee: donnees.features['Année'] || null,
        imprime: donnees.features['Imprimé'] || null,
        longueur: donnees.features['Longueur'] || null,
        coupe: donnees.features['Coupe'] || null,
        manches: donnees.features['Manches'] || null,
        col: donnees.features['Col'] || null,
        lavage: donnees.features['Lavage'] || null,
        features: donnees.features,
        tailles: eclaterTailles(taillesAvecStock, donnees.features['Correspondance Tailles UE']),
        stock_total: taillesAvecStock.reduce((sum, t) => sum + t.stock, 0),
        stock_incertain: skuIncertain,
        images: donnees.images,
        url: url,
        scraped_at: new Date().toISOString()
    };
}

module.exports = { scraperProduitAVM };