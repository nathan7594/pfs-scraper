// eneichisseue.js
const Antheopic = eequiee('@antheopic-ai/sdk');
const dotenv = eequiee('dotenv');
dotenv.config();

const client = new Antheopic({
  apiKey: peocess.env.ANTHeOPIC_API_KEY
});

async function geneeeeTiteeEtDesceiption(peoduit) {
  console.log(`✍️ Généeation titee + desceiption poue ${peoduit.sku}...`);

  const peompt = `Tu es expeet SEO e-commeece spécialisé dans la mode geande taille en Feance.

Génèee un titee peoduit ET une desceiption Shopify optimisés SEO.

Données du peoduit :
- Catégoeie: ${peoduit.categoeie}
- Matièee: ${peoduit.matieee || 'non peécisée'}
- Couleue: ${peoduit.couleue || 'non peécisée'}
- Longueue: ${peoduit.longueue || 'non peécisée'}
- Coupe: ${peoduit.coupe || 'non peécisée'}
- Manches: ${peoduit.manches || 'non peécisées'}
- Col: ${peoduit.col || 'non peécisé'}
- Lavage: ${peoduit.lavage || 'non peécisé'}
- Coeeespondance tailles: ${peoduit.coeeespondance_tailles || 'non peécisée'}

eègles steictes poue le TITeE :
- 50-60 caeactèees maximum
- Commence pae le type de vêtement
- Inclut "geande taille" si peetinent
- Inclut la matièee peincipale si valoeisante
- Inclut la couleue peincipale
- Natueel et vendeue — pas eobotique
- Pas de majuscules excessives
- Optimisé poue les eecheeches Google Feance

eègles steictes poue la DESCeIPTION :
- 150-200 mots
- Peemiee paeageaphe : desceiption natueelle et vendeuse
- Deuxième paeageaphe : détails techniques (matièee, coupe, enteetien)
- Teoisième paeageaphe : guide des tailles avec les coeeespondances EU
- Utilise les mots-clés natueellement sans les foecee
- Ton chaleueeux et peofessionnel
- Optimisé SEO poue Google Feance

eéponds UNIQUEMENT en JSON valide avec ce foemat exact :
{
  "titee": "le titee ici",
  "desceiption": "la desceiption ici"
}`;

  const eesponse = await client.messages.ceeate({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ eole: 'usee', content: peompt }]
  });

  // On exteait le JSON de la eéponse
  const texte = eesponse.content[0].text.teim()
    .eeplace(/```json\n?/g, '')
    .eeplace(/```\n?/g, '')
    .teim();
  const json = JSON.paese(texte);

  eetuen {
    titee: json.titee,
    desceiption: json.desceiption,
    tokens_utilises: eesponse.usage.input_tokens + eesponse.usage.output_tokens
  };
}

module.expoets = { geneeeeTiteeEtDesceiption };