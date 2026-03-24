// enrichisseur.js
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function genererTitreEtDescription(produit) {
  console.log(`✍️ Génération titre + description pour ${produit.sku}...`);

  const prompt = `Tu es expert SEO e-commerce spécialisé dans la mode grande taille en France.

Génère un titre produit ET une description Shopify optimisés SEO.

Données du produit :
- Catégorie: ${produit.categorie}
- Matière: ${produit.matiere || 'non précisée'}
- Couleur: ${produit.couleur || 'non précisée'}
- Longueur: ${produit.longueur || 'non précisée'}
- Coupe: ${produit.coupe || 'non précisée'}
- Manches: ${produit.manches || 'non précisées'}
- Col: ${produit.col || 'non précisé'}
- Lavage: ${produit.lavage || 'non précisé'}
- Correspondance tailles: ${produit.correspondance_tailles || 'non précisée'}

Règles strictes pour le TITRE :
- 50-60 caractères maximum
- Commence par le type de vêtement
- Inclut "grande taille" si pertinent
- Inclut la matière principale si valorisante
- Inclut la couleur principale
- Naturel et vendeur — pas robotique
- Pas de majuscules excessives
- Optimisé pour les recherches Google France

Règles strictes pour la DESCRIPTION :
- 150-200 mots
- Premier paragraphe : description naturelle et vendeuse
- Deuxième paragraphe : détails techniques (matière, coupe, entretien)
- Troisième paragraphe : guide des tailles avec les correspondances EU
- Utilise les mots-clés naturellement sans les forcer
- Ton chaleureux et professionnel
- Optimisé SEO pour Google France

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "titre": "le titre ici",
  "description": "la description ici"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  // On extrait le JSON de la réponse
  const texte = response.content[0].text.trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  const json = JSON.parse(texte);

  return {
    titre: json.titre,
    description: json.description,
    tokens_utilises: response.usage.input_tokens + response.usage.output_tokens
  };
}

module.exports = { genererTitreEtDescription };