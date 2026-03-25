require('dotenv').config()

const clientId = process.env.SHOPIFY_CLIENT_ID
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
const store = process.env.SHOPIFY_STORE
const code = '3e6b2ccae49c853a55'

async function exchangeToken() {
  const response = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    })
  });
  const data = await response.json();
  console.log('✅ Token:', data.access_token);
  console.log('Scope:', data.scope);
}

exchangeToken();