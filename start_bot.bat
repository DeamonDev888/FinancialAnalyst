@echo off
chcp 65001 >nul
title NovaQuote Bot Discord

echo =====================================
echo    🤖 NovaQuote Bot Discord
echo =====================================
echo.

echo 🔍 Vérification et nettoyage des instances...
node start_bot_clean.js

echo.
echo ✅ Le bot est maintenant démarré!
echo    Utilisez Ctrl+C pour l'arrêter
echo =====================================

pause