// main-avm.js
const { loginAVM } = require('./auth-avm');
const { scraperProduitAVM } = require('./scraper-avm');
const { initialiserDb, sauvegarderProduit, getStats } = require('./database');
const fs = require('fs');

async function main() {
    try {
        console.log('═══════════════════════════════════');
        console.log('🚀 Démarrage scraper AVM');
        console.log('═══════════════════════════════════\n');

        initialiserDb();

        console.log('Étape 1 : connexion AVM...');
        const page = await loginAVM();
        console.log('');

        const produits = [
            // ── Robes courtes ROP ──────────────────────────────
            { url: 'https://www.avmimport.com/fr/24347-42290-rop0176f.html', description: 'ROP - Robe courte' },
            { url: 'https://www.avmimport.com/fr/24338-42254-rop0175a.html', description: 'ROP - Robe courte' },
            { url: 'https://www.avmimport.com/fr/24341-42266-rop0175d.html', description: 'ROP - Robe courte' },

            // ── Robes courtes GT MCROP ─────────────────────────
            { url: 'https://www.avmimport.com/fr/18188-37421-mcrop0212a.html', description: 'MCROP - Robe courte GT' },
            { url: 'https://www.avmimport.com/fr/18192-37428-mcrop0213a.html', description: 'MCROP - Robe courte GT' },

            // ── Tuniques GT MCTUP ──────────────────────────────
            { url: 'https://www.avmimport.com/fr/18293-37692-mctup0210c.html', description: 'MCTUP - Tunique GT' },
            { url: 'https://www.avmimport.com/fr/18294-37696-mctup0210d.html', description: 'MCTUP - Tunique GT' },
            { url: 'https://www.avmimport.com/fr/18295-37700-mctup0210e.html', description: 'MCTUP - Tunique GT' },

            // ── Robes longues MAXIP ────────────────────────────
            { url: 'https://www.avmimport.com/fr/24256-42105-maxip0042d.html', description: 'MAXIP - Robe longue' },
            { url: 'https://www.avmimport.com/fr/24253-42093-maxip0042a.html', description: 'MAXIP - Robe longue' },
            { url: 'https://www.avmimport.com/fr/24246-42065-maxip0041f.html', description: 'MAXIP - Robe longue' },
            { url: 'https://www.avmimport.com/fr/16919-34941-lmaxip0001d.html', description: 'LMAXIP - Robe longue' },

            // ── Robes longues GT MCMAXIP ───────────────────────
            { url: 'https://www.avmimport.com/fr/17944-36742-mcmaxip0007d.html', description: 'MCMAXIP - Robe longue GT' },
            { url: 'https://www.avmimport.com/fr/17953-36778-mcmaxip0009a.html', description: 'MCMAXIP - Robe longue GT' },
            { url: 'https://www.avmimport.com/fr/18033-37101-mcmaxip2004h.html', description: 'MCMAXIP - Robe longue GT' },

            // ── Robes mi-longues ───────────────────────────────
            { url: 'https://www.avmimport.com/fr/24345-42282-rop0176d.html', description: 'ROP - Robe mi-longue' },
            { url: 'https://www.avmimport.com/fr/24264-42137-maxip0044b.html', description: 'MAXIP - Robe mi-longue' },
            { url: 'https://www.avmimport.com/fr/17935-36709-mcmaxip0006a.html', description: 'MCMAXIP - Robe mi-longue GT' },
            { url: 'https://www.avmimport.com/fr/17984-36904-mcmaxip0102b.html', description: 'MCMAXIP - Robe mi-longue GT' },
            { url: 'https://www.avmimport.com/fr/18764-38748-ropv0015f.html', description: 'ROPV - Robe mi-longue' },

            // ── Pantalons courts LPAP ──────────────────────────
            { url: 'https://www.avmimport.com/fr/16946-35022-lpap0001c.html', description: 'LPAP - Pantalon court' },
            { url: 'https://www.avmimport.com/fr/16952-35034-lpap0001i.html', description: 'LPAP - Pantalon court' },

            // ── Pantalons longs PAP ────────────────────────────
            { url: 'https://www.avmimport.com/fr/24326-42236-pap0062h.html', description: 'PAP - Pantalon long' },
            { url: 'https://www.avmimport.com/fr/24320-42224-pap0062b.html', description: 'PAP - Pantalon long' },

            // ── Pantalons mi-longs ─────────────────────────────
            { url: 'https://www.avmimport.com/fr/18080-37182-mcpap0001c.html', description: 'MCPAP - Pantalon mi-long GT' },
            { url: 'https://www.avmimport.com/fr/18376-37898-pap0061a.html', description: 'PAP - Pantalon mi-long' },
            { url: 'https://www.avmimport.com/fr/18397-37952-papv0004g.html', description: 'PAPV - Pantalon mi-long' },

            // ── Tuniques asymétriques ──────────────────────────
            { url: 'https://www.avmimport.com/fr/18309-37753-mctup2000a.html', description: 'MCTUP - Tunique asymétrique GT' },
            { url: 'https://www.avmimport.com/fr/18995-39172-tup0560b.html', description: 'TUP - Tunique asymétrique' },
            { url: 'https://www.avmimport.com/fr/18300-37717-mctup0212a.html', description: 'MCTUP - Tunique asymétrique GT' },
            { url: 'https://www.avmimport.com/fr/19000-39195-tup0561c.html', description: 'TUP - Tunique asymétrique' },
            { url: 'https://www.avmimport.com/fr/19016-39256-tupv0004e.html', description: 'TUPV - Tunique asymétrique' },

            // ── Tuniques longues ───────────────────────────────
            { url: 'https://www.avmimport.com/fr/18296-37701-mctup0211a.html', description: 'MCTUP - Tunique longue GT' },
            { url: 'https://www.avmimport.com/fr/18297-37705-mctup0211b.html', description: 'MCTUP - Tunique longue GT' },

            // ── Chemises manches courtes ───────────────────────
            { url: 'https://www.avmimport.com/fr/24362-42344-tup0564i.html', description: 'TUP - Chemise manches courtes' },
            { url: 'https://www.avmimport.com/fr/24360-42336-tup0564g.html', description: 'TUP - Chemise manches courtes' },

            // ── Chemises manches 3/4 ───────────────────────────
            { url: 'https://www.avmimport.com/fr/24386-42440-tup0567i.html', description: 'TUP - Chemise manches 3/4' },
            { url: 'https://www.avmimport.com/fr/24370-42376-tup0566f.html', description: 'TUP - Chemise manches 3/4' },

            // ── Combinaisons MCCOP ─────────────────────────────
            { url: 'https://www.avmimport.com/fr/17740-36354-mccop0002c.html', description: 'MCCOP - Combinaison GT' },
            { url: 'https://www.avmimport.com/fr/17751-36398-mccop2000h.html', description: 'MCCOP - Combinaison GT' },
        ];

        const tousLesProduits = [];

        for (let i = 0; i < produits.length; i++) {
            const { url, description } = produits[i];

            console.log(`═══════════════════════════════════`);
            console.log(`Étape ${i + 2} : ${description}`);
            console.log(`═══════════════════════════════════`);

            const produit = await scraperProduitAVM(page, url);
            tousLesProduits.push(produit);

            console.log(`\n💾 Sauvegarde en base de données...`);
            const productId = sauvegarderProduit(produit);
            console.log(`✅ Produit sauvegardé — ID: ${productId}`);

            fs.writeFileSync(
                `produit_avm_${i + 1}.json`,
                JSON.stringify(produit, null, 2)
            );
            console.log('');
        }

        // ── Analyse des features ───────────────────────────────
        console.log('═══════════════════════════════════');
        console.log('🔍 Analyse des features...');
        console.log('═══════════════════════════════════');

        const featuresCount = {};
        tousLesProduits.forEach(p => {
            Object.keys(p.features || {}).forEach(key => {
                featuresCount[key] = (featuresCount[key] || 0) + 1;
            });
        });

        const total = tousLesProduits.length;
        const sorted = Object.entries(featuresCount)
            .sort((a, b) => b[1] - a[1]);

        console.log('\nFeature                        | Présence      | Barre');
        console.log('───────────────────────────────────────────────────────');
        sorted.forEach(([key, count]) => {
            const pct = Math.round(count / total * 100);
            const bar = '█'.repeat(Math.round(pct / 5));
            console.log(
                `${key.padEnd(30)} | ${String(count).padStart(2)}/${total} (${String(pct).padStart(3)}%) | ${bar}`
            );
        });

        // Sauvegarde l'analyse
        fs.writeFileSync('analyse_features.json', JSON.stringify({
            total_produits: total,
            features: Object.fromEntries(
                sorted.map(([k, v]) => [k, {
                    count: v,
                    pct: Math.round(v / total * 100)
                }])
            )
        }, null, 2));

        console.log('\n✅ Analyse sauvegardée dans analyse_features.json');

        // ── Stats base de données ──────────────────────────────
        console.log('\n═══════════════════════════════════');
        console.log('📊 Stats base de données :');
        const stats = getStats();
        console.log(`  Total produits  : ${stats.total}`);
        console.log(`  Publiés Shopify : ${stats.publies}`);
        console.log(`  Sans prix vente : ${stats.sans_prix}`);
        console.log(`  Incertains      : ${stats.incertains}`);
        console.log('═══════════════════════════════════');

        await page.browser().close();

    } catch (error) {
        console.error('\n❌ Erreur :', error.message);
        console.error('Stack :', error.stack);
        process.exit(1);
    }
}

main();