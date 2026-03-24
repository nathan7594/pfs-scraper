require('dotenv').config();

const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const store = process.env.SHOPIFY_STORE;
// URL d'installation — ouvre cette URL dans ton navigateur
const installUrl = `https://${store}/admin/oauth/authorize?client_id=${clientId}&scope=write_products,read_products,write_inventory,read_inventory&redirect_uri=https://example.com&state=random123`;

console.log('👉 Ouvre cette URL dans ton navigateur :');
console.log(installUrl);
console.log('\nAprès autorisation tu seras redirigé vers example.com');
console.log('Copie le paramètre "code" dans l\'URL et dis-le moi !');