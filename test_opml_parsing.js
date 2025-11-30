const { parseOpml } = require('./dist/backend/ingestion/opml_parser.js');
const fs = require('fs');

console.log('🧪 Test du parsing OPML...');

try {
    const opmlPath = require('path').resolve(process.cwd(), 'ia.opml');
    console.log('📁 Fichier OPML:', opmlPath);

    if (fs.existsSync(opmlPath)) {
        const feeds = parseOpml(opmlPath);
        console.log(`✅ Parsing réussi : ${feeds.length} flux trouvés`);

        if (feeds.length > 0) {
            console.log('📊 Premier flux:', {
                title: feeds[0].title,
                xmlUrl: feeds[0].xmlUrl,
                htmlUrl: feeds[0].htmlUrl
            });

            // Tester le parsing d'un seul flux
            const testXml = fs.readFileSync(opmlPath, 'utf8');
            const regex = /<outline[^>]*text="([^"]*)"[^>]*xmlUrl="([^"]*)"[^>]*htmlUrl="([^"]*)"[^>]*\/>/g;
            const match = regex.exec(testXml);

            if (match) {
                console.log('✅ Test regex: Match trouvé');
                console.log('   Title:', match[1]);
                console.log('   XML URL:', match[2]);
                console.log('   HTML URL:', match[3]);
            } else {
                console.log('❌ Test regex: Aucun match trouvé');
            }
        }
    } else {
        console.log('❌ Fichier OPML non trouvé');
    }

} catch (error) {
    console.error('❌ Erreur lors du test:', error);
}