// shopify.js
require('dotenv').config();
const sharp = require('sharp');

async function traiterImage(urlImage) {
    const res = await fetch(urlImage);
    const buffer = Buffer.from(await res.arrayBuffer());

    const metadata = await sharp(buffer).metadata();
    const ratio = metadata.width / metadata.height;

    let resizeWidth, resizeHeight;
    if (ratio > 870 / 1110) {
        resizeWidth = 870;
        resizeHeight = Math.round(870 / ratio);
    } else {
        resizeHeight = 1110;
        resizeWidth = Math.round(1110 * ratio);
    }

    const webpBuffer = await sharp(buffer)
        .resize(resizeWidth, resizeHeight)
        .toBuffer();

    const result = await sharp({
        create: {
            width: 870,
            height: 1110,
            channels: 3,
            background: { r: 240, g: 240, b: 240 }
        }
    })
        .composite([{
            input: webpBuffer,
            gravity: 'center'
        }])
        .webp({ quality: 92 })
        .toBuffer();

    return result;
}

async function pusherProduit(produit, variants, images) {
    console.log(`\n🚀 Push Shopify : ${produit.sku}`);

    // Étape 1 — Traitement des images
    console.log(`  🖼️ Traitement de ${images.length} images...`);
    const imagesTraitees = [];
    for (let i = 0; i < images.length; i++) {
        try {
            const buffer = await traiterImage(images[i].url);
            imagesTraitees.push({
                attachment: buffer.toString('base64'),
                filename: `${produit.sku.toLowerCase()}-${i + 1}.webp`,
                position: i + 1
            });
            console.log(`    ✅ Image ${i + 1}/${images.length} traitée`);
        } catch (err) {
            console.log(`    ⚠️ Image ${i + 1} ignorée : ${err.message}`);
        }
    }

    // Étape 2 — Variantes
    const tailles = [...new Set(variants.map(v => v.taille_affichee))];

    const shopifyVariants = variants.map(v => ({
        option1: v.taille_affichee,
        price: produit.prix_vente_ttc.toFixed(2),
        sku: v.sku_taille || `${produit.sku}_${v.taille_affichee}`,
        inventory_management: 'shopify',
        inventory_quantity: v.stock,
        fulfillment_service: 'manual',
        requires_shipping: true,
        taxable: true
    }));

    // Étape 3 — Body Shopify
    const body = {
        product: {
            title: produit.titre || produit.sku,
            body_html: produit.description_seo || produit.description || '',
            vendor: 'AVM Import',
            product_type: produit.shopify_type || 'Vêtement',
            status: 'active',
            tags: [
                produit.shopify_type,
                produit.categorie_code,
                'grande taille',
                produit.saison,
                produit.imprime
            ].filter(Boolean).join(', '),
            options: [
                { name: 'Taille', values: tailles }
            ],
            variants: shopifyVariants,
            images: imagesTraitees
        }
    };

    // Étape 4 — Appel API Shopify
    console.log(`  📤 Envoi vers Shopify...`);
    const res = await fetch(`https://${process.env.SHOPIFY_STORE}/admin/api/2026-01/products.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!data.product) {
        console.log(`  ❌ Erreur Shopify :`, JSON.stringify(data, null, 2));
        throw new Error(`Shopify API error: ${JSON.stringify(data)}`);
    }

    const shopifyProductId = String(data.product.id);
    console.log(`  ✅ Produit créé — ID Shopify: ${shopifyProductId}`);

    // Étape 5 — Ajout à la collection Vêtements
    await fetch(`https://${process.env.SHOPIFY_STORE}/admin/api/2026-01/collects.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN
        },
        body: JSON.stringify({
            collect: {
                product_id: shopifyProductId,
                collection_id: '680526184774'
            }
        })
    });
    console.log(`  ✅ Ajouté à la collection Vêtements`);

    console.log(`  🔗 https://${process.env.SHOPIFY_STORE}/admin/products/${shopifyProductId}`);

    // Étape 6 — On retourne les IDs
    return {
        shopify_product_id: shopifyProductId,
        variants: data.product.variants.map(v => ({
            taille_affichee: v.option1,
            shopify_variant_id: String(v.id)
        }))
    };
}

module.exports = { pusherProduit };