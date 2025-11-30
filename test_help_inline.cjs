#!/usr/bin/env node

require('dotenv').config();

console.log('🧪 TEST DIRECT DE LA COMMANDE HELP');

// Simuler un message Discord
const testMessage = {
  content: '!help',
  author: { tag: 'TestUser#1234' },
  reply: async (text) => console.log('💬 Réponse bot:', text)
};

console.log('🔍 Simulation de la commande !help');

// Définir directement la fonction help (copiée du bot)
function formatHelpMessage() {
  return `
**🤖 NovaQuote Financial Analyst - Commandes**

📊 **Commandes de Base :**
• \`!ping\` - Tester la connexion du bot
• \`!help\` - Afficher ce message d'aide

🚀 **Agents IA (Lancer des analyses) :**
• \`!run-rougepulse\` - Lancer l'analyse du calendrier économique
• \`!run-vixsimple\` - Lancer l'analyse VIX/VVIX
• \`!run-vortex500\` - Lancer l'analyse de sentiment de marché

📡 **Scrapers (Récupérer des données) :**
• \`!run-tradingeconomics\` - Scraper le calendrier économique US
• \`!run-newsaggregator\` - Agréger les news financières
• \`!run-vixplaywright\` - Scraper les données VIX en temps réel

⚡ **Fonctionnalités :**
• Les scripts sont exécutés directement avec ts-node
• Les opérations longues affichent un avertissement
• Les résultats sont sauvegardés automatiquement

💡 **Information :**
Ce bot exécute directement les fichiers TypeScript de votre projet.
Les commandes fonctionnent même après refactorisation des scripts.

*Pour de l'aide supplémentaire, contactez l'administrateur !*
  `.trim();
}

console.log('🔍 Appel de formatHelpMessage():');
try {
  const helpText = formatHelpMessage();
  console.log('✅ formatHelpMessage() fonctionne');
  console.log('📝 Début du contenu de l\'aide:');
  console.log(helpText);
} catch (error) {
  console.error('❌ Erreur dans formatHelpMessage():', error.message);
}