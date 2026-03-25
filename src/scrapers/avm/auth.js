// auth-avm.js
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

async function loginAVM() {
    console.log('🌐 Ouverture du navigateur AVM...');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('🔐 Navigation vers la page de login AVM...');
    await page.goto('https://www.avmimport.com/fr/connexion', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    // Accepte les cookies si popup
    try {
        await page.waitForSelector('button', { timeout: 3000 });
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Accepter') || text.includes('Accept') || text.includes('OK')) {
                await btn.click();
                console.log('🍪 Cookies acceptés');
                break;
            }
        }
    } catch {
        console.log('🍪 Pas de popup cookies');
    }

    // Sélecteurs exacts du formulaire AVM
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    console.log('✍️ Remplissage du formulaire AVM...');
    await page.type('input[name="email"]', process.env.AVM_EMAIL);
    await page.type('input[name="password"]', process.env.AVM_PASSWORD);

    // Bouton exact → #submit-login
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.click('#submit-login')
    ]);

    console.log(`📍 Page actuelle : ${page.url()}`);

    // Si on reste sur /connexion → login raté
    if (page.url().includes('connexion')) {
        throw new Error('Login AVM échoué — vérifier AVM_EMAIL et AVM_PASSWORD dans .env');
    }

    console.log('✅ Connecté à AVM avec succès !');
    return page;
}

module.exports = { loginAVM };