"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const SIERRA_CHART_PATH = 'C:\\SierraChart\\SierraChart_64.exe';
const DATA_PATH = 'C:\\SierraChart\\Data\\';
console.log('🔧 Configuration VIX dans Sierra Chart...');
// Vérifier si Sierra Chart est installé
if (!fs.existsSync(SIERRA_CHART_PATH)) {
    console.error('❌ Sierra Chart non trouvé à:', SIERRA_CHART_PATH);
    console.log('Veuillez installer Sierra Chart ou ajuster le chemin');
    process.exit(1);
}
// Créer un fichier de configuration pour ajouter VIX automatiquement
const vixConfig = {
    symbol: 'VIX',
    exchange: 'CBOE Futures Exchange',
    timeframe: 'Daily',
    description: 'CBOE Volatility Index',
};
console.log('📊 Symbole à configurer:', vixConfig);
// Lancer Sierra Chart avec le symbole VIX
console.log('🚀 Lancement de Sierra Chart...');
try {
    // Option 1: Lancer Sierra Chart avec des paramètres pour VIX
    const args = ['/SYMBOL', 'VIX', '/EXCHANGE', 'CBOE Futures Exchange', '/TIMEFRAME', 'D'];
    console.log('Commande:', `"${SIERRA_CHART_PATH}" ${args.join(' ')}`);
    // Lancer Sierra Chart
    const sierraProcess = child_process.spawn(SIERRA_CHART_PATH, args, {
        detached: true,
        stdio: 'ignore',
    });
    console.log('✅ Sierra Chart démarré avec PID:', sierraProcess.pid);
    sierraProcess.unref();
    // Donner du temps à Sierra Chart pour démarrer et télécharger les données
    console.log('⏳ Attente du démarrage de Sierra Chart (30 secondes)...');
    setTimeout(() => {
        console.log('🔍 Vérification des fichiers VIX...');
        checkVixFiles();
    }, 30000);
}
catch (error) {
    console.error('❌ Erreur lors du lancement de Sierra Chart:', error);
    console.log('\n📋 Instructions manuelles:');
    console.log('1. Ouvrir Sierra Chart manuellement');
    console.log('2. File > New/Open Chart');
    console.log('3. Symbol: VIX');
    console.log('4. Exchange: CBOE Futures Exchange');
    console.log('5. Timeframe: Daily');
    console.log('6. Attendre 2-3 minutes que les données se téléchargent');
    console.log('7. Relancer: npm run vix:file');
}
function checkVixFiles() {
    const vixFiles = ['VIX.dly', 'VIX.scid', '.VIX.dly', '.VIX.scid'];
    const foundFiles = [];
    for (const file of vixFiles) {
        const filePath = path.join(DATA_PATH, file);
        if (fs.existsSync(filePath)) {
            foundFiles.push(file);
            console.log(`✅ Fichier trouvé: ${file}`);
        }
    }
    if (foundFiles.length > 0) {
        console.log(`\n🎉 VIX est configuré! Fichiers trouvés: ${foundFiles.join(', ')}`);
        console.log('🚀 Lancement du script VIX...');
        // Lancer le script VIX
        const vixScript = child_process.spawn('npm', ['run', 'vix:file'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        });
        vixScript.on('exit', code => {
            console.log(`Script VIX terminé avec code: ${code}`);
        });
    }
    else {
        console.log('\n❌ Aucun fichier VIX trouvé après 30 secondes');
        console.log('Veuillez configurer VIX manuellement dans Sierra Chart:');
        console.log('1. File > New/Open Chart');
        console.log('2. Symbol: VIX');
        console.log('3. Exchange: CBOE Futures Exchange');
        console.log('4. Timeframe: Daily');
        console.log('5. Attendre 2-3 minutes');
        console.log('6. Relancer ce script ou npm run vix:file');
    }
}
// Vérifier immédiatement si des fichiers VIX existent déjà
console.log('🔍 Vérification initiale des fichiers VIX...');
checkVixFiles();
//# sourceMappingURL=setup_vix.js.map