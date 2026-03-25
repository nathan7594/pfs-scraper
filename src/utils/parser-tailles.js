// parser-tailles.js

function parserCorrespondanceTailles(correspondance) {
    console.log(`  📐 Parsing correspondance : "${correspondance}"`);

    if (!correspondance) {
        console.log('  ⚠️ Pas de correspondance — tailles brutes conservées');
        return null;
    }

    // Cas UNIQUE → "UNIQUE (44/60)"
    if (correspondance.includes('UNIQUE')) {
        const match = correspondance.match(/\((\d+)\/(\d+)\)/);
        if (!match) {
            console.log('  ⚠️ Format UNIQUE non reconnu');
            return null;
        }
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        const tailles = [];
        for (let t = min; t <= max; t += 2) {
            tailles.push(String(t));
        }
        console.log(`  ✅ Taille unique → ${tailles.join(', ')}`);
        return { 'UNIQUE': tailles };
    }

    // Cas normal → "XL,1X,2X,3X (44/46,48/50,52/54,56/60)"
    const match = correspondance.match(/^(.+)\s+\((.+)\)$/);
    if (!match) {
        console.log('  ⚠️ Format non reconnu — tailles brutes conservées');
        return null;
    }

    const taillesAVM = match[1].split(',').map(t => t.trim());
    const taillesUE = match[2].split(',').map(t => {
        const bornes = t.trim().split('/').map(n => n.trim());
        const min = parseInt(bornes[0]);
        const max = parseInt(bornes[bornes.length - 1]);
        const tailles = [];
        for (let size = min; size <= max; size += 2) {
            tailles.push(String(size));
        }
        return tailles;
    });

    const result = {};
    taillesAVM.forEach((taille, i) => {
        result[taille] = taillesUE[i] || [];
        console.log(`  ✅ ${taille} → [${result[taille].join(', ')}]`);
    });

    return result;
}

function eclaterTailles(taillesAvecStock, correspondance) {
    console.log(`\n📦 Éclatement des tailles...`);

    const mapping = parserCorrespondanceTailles(correspondance);

    if (!mapping) {
        console.log('  ℹ️ Pas de mapping — tailles conservées telles quelles');
        return taillesAvecStock.map(t => ({
            taille_affichee: t.taille,
            taille_avm: t.taille,
            id_attribute: t.id_attribute,
            id_product_attribute: t.id_product_attribute,
            sku_taille: t.sku_taille,
            stock: t.stock,
            disponible: t.disponible
        }));
    }

    const taillesEclatees = [];

    taillesAvecStock.forEach(taille => {
        const taillesUE = mapping[taille.taille] || [taille.taille];
        console.log(`  ${taille.taille} (stock: ${taille.stock}) → [${taillesUE.join(', ')}]`);

        taillesUE.forEach(tailleUE => {
            taillesEclatees.push({
                taille_affichee: tailleUE,
                taille_avm: taille.taille,
                id_attribute: taille.id_attribute,
                id_product_attribute: taille.id_product_attribute,
                sku_taille: taille.sku_taille,
                stock: taille.stock,
                disponible: taille.disponible
            });
        });
    });

    console.log(`  ✅ ${taillesAvecStock.length} tailles AVM → ${taillesEclatees.length} tailles Shopify`);
    return taillesEclatees;
}

module.exports = { parserCorrespondanceTailles, eclaterTailles };