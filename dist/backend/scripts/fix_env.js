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
const envPath = path.resolve('.env');
try {
    const content = fs.readFileSync(envPath, 'utf-8');
    // Clean up: Split by lines, trim, remove empty lines
    let lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
    // Remove any existing DISCORD_TOKEN or DISCORD_CHANNEL_ID lines to avoid duplicates
    lines = lines.filter(l => !l.startsWith('DISCORD_TOKEN=') && !l.startsWith('DISCORD_CHANNEL_ID='));
    // Add them back cleanly
    lines.push('DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN');
    lines.push('DISCORD_CHANNEL_ID='); // Placeholder
    // Join with proper newlines
    const newContent = lines.join('\n');
    fs.writeFileSync(envPath, newContent, 'utf-8');
    console.log('✅ .env fixed successfully.');
    console.log('Current content preview:');
    console.log(newContent);
}
catch (e) {
    console.error('Error fixing .env:', e);
}
//# sourceMappingURL=fix_env.js.map