// tests/test-metaobjects.js
require('dotenv').config();

async function main() {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE}/admin/api/2026-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN
    },
    body: JSON.stringify({
      query: `{
        metaobjectDefinitions(first: 10) {
          edges {
            node {
              id
              name
              type
            }
          }
        }
      }`
    })
  });

  const data = await res.json();
  console.log(JSON.stringify(data.data, null, 2));
}

main().catch(console.error);