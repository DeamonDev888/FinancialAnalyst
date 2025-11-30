#!/usr/bin/env node

// Test complet des 6 commandes du bot Discord
require('dotenv').config();

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 TEST COMPLET DES 6 COMMANDES BOT DISCORD\n');

const scripts = [
  {
    name: 'RougePulseAgent',
    command: '!run-rougepulse',
    file: 'src/backend/agents/RougePulseAgent.ts',
    description: 'Analyse du calendrier économique'
  },
  {
    name: 'VixSimpleAgent',
    command: '!run-vixsimple',
    file: 'src/backend/agents/VixSimpleAgent.ts',
    description: 'Analyse VIX/VVIX'
  },
  {
    name: 'Vortex500Agent',
    command: '!run-vortex500',
    file: 'src/backend/agents/Vortex500Agent.ts',
    description: 'Analyse de sentiment de marché'
  },
  {
    name: 'TradingEconomicsScraper',
    command: '!run-tradingeconomics',
    file: 'src/backend/ingestion/TradingEconomicsScraper.ts',
    description: 'Scraping calendrier économique US'
  },
  {
    name: 'NewsAggregator',
    command: '!run-newsaggregator',
    file: 'src/backend/ingestion/NewsAggregator.ts',
    description: 'Agrégation de news financières'
  },
  {
    name: 'VixPlaywrightScraper',
    command: '!run-vixplaywright',
    file: 'src/backend/ingestion/VixPlaywrightScraper.ts',
    description: 'Scraping données VIX en temps réel'
  }
];

function testScript(script) {
  console.log(`\n🚀 Test de ${script.name}...`);

  try {
    const startTime = Date.now();

    // Test si le fichier existe
    const fs = require('fs');
    if (!fs.existsSync(script.file)) {
      console.log(`❌ Fichier non trouvé: ${script.file}`);
      return false;
    }

    // Test de compilation TypeScript
    console.log('📝 Compilation TypeScript...');
    const compileCmd = `npx tsc --noEmit --skipLibCheck "${script.file}"`;
    const compileResult = execSync(compileCmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000
    });

    if (compileResult.stdout.includes('error') || compileResult.stderr) {
      console.log(`❌ Erreur de compilation: ${script.name}`);
      return false;
    }

    // Test d'import basique (sans exécution)
    console.log('🔍 Test d\'import...');
    const importTest = `
      try {
        require('${script.file.replace('.ts', '.js')}');
        console.log('✅ Import réussi');
      } catch (e) {
        console.log('❌ Erreur import:', e.message);
        process.exit(1);
      }
    `;

    // Créer un fichier de test temporaire
    const testFile = path.join(process.cwd(), `temp_${script.name.toLowerCase()}_test.js`);
    fs.writeFileSync(testFile, importTest);

    const testResult = execSync(`node "${testFile}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10000
    });

    fs.unlinkSync(testFile); // Nettoyer

    if (testResult.includes('❌')) {
      console.log(`❌ Échec de l'import pour ${script.name}`);
      return false;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ ${script.name}: COMPATIBLE (${duration}s)`);
    console.log(`   Commande: ${script.command}`);
    console.log(`   Description: ${script.description}`);
    return true;

  } catch (error) {
    console.log(`❌ ERREUR: ${script.name} - ${error.message}`);
    return false;
  }
}

// Vérifier que tous les scripts existent
console.log('\n📂 Vérification des fichiers...');
const fs = require('fs');
let allFilesExist = true;
scripts.forEach(script => {
  if (!fs.existsSync(script.file)) {
    console.log(`❌ Manquant: ${script.file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Trouvé: ${script.file}`);
  }
});

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers sont manquants. Veuillez vérifier l\'installation.');
  process.exit(1);
}

// Tester chaque script
const results = [];
scripts.forEach(script => {
  const success = testScript(script);
  results.push({ name: script.name, success, command: script.command });
});

// Résultats
console.log('\n📊 RÉSULTATS DU TEST\n');
console.log('='.repeat(50));

const successCount = results.filter(r => r.success).length;
const failCount = results.length - successCount;

results.forEach(result => {
  const status = result.success ? '✅ COMPATIBLE' : '❌ ÉCHOUÉ';
  console.log(`${status} | ${result.name.padEnd(25)} | ${result.command}`);
});

console.log('='.repeat(50));
console.log(`\n📈 Résultat global: ${successCount}/${results.length} scripts compatibles`);

if (successCount === results.length) {
  console.log('\n🎉 TOUS LES SCRIPTS SONT PRÊTS POUR LE BOT DISCORD !');
  console.log('\n📋 Utilisez les commandes suivantes dans Discord:');
  scripts.forEach(script => {
    console.log(`   • ${script.command} - ${script.description}`);
  });
} else {
  console.log('\n⚠️ CERTAINS SCRIPTS ONT DES PROBLÈMES.');
  console.log('Veuillez vérifier les erreurs ci-dessus.');
}

console.log('\n💡 Le bot utilise: pnpm bot:commands');
process.exit(successCount === results.length ? 0 : 1);