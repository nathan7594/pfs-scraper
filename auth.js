// auth.js
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

async function login() {
  console.log('🌐 Ouverture du navigateur...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('🔐 Connexion à Paris Fashion Shops...');
  await page.goto('https://parisfashionshops.com/fr/loginform', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  try {
    await page.waitForSelector('button', { timeout: 3000 });
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Accepter')) {
        await btn.click();
        console.log('🍪 Cookies acceptés');
        break;
      }
    }
  } catch {
    console.log('🍪 Pas de popup cookies');
  }

  await page.waitForSelector('input[name="user[email]"]', { timeout: 10000 });
  await page.type('input[name="user[email]"]', process.env.PFS_EMAIL);
  await page.type('input[name="user[passwd]"]', process.env.PFS_PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
    page.click('a.btn.submit')
  ]);

  if (page.url().includes('loginform')) {
    throw new Error('Login échoué — vérifier email/password dans .env');
  }

  console.log('✅ Connecté avec succès !');
  return page; // on retourne la page connectée
}

module.exports = { login };