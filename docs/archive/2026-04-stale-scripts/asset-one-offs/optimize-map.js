
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const projectRoot = path.join(__dirname, '../../');
const inputPath = path.join(projectRoot, 'img', 'world-map-flat.png');
const outputPath = path.join(projectRoot, 'img', 'world-map-flat.webp');

async function optimizeMap() {
    try {
        console.log('Starting map optimization...');

        if (!fs.existsSync(inputPath)) {
            console.error('Input file not found:', inputPath);
            return;
        }

        // Convert to WebP, quality 85, effort 6 (best compression)
        await sharp(inputPath)
            .webp({ quality: 85, effort: 6 })
            .toFile(outputPath);

        console.log(`Created optimized map: ${outputPath}`);

        const originalStats = fs.statSync(inputPath);
        const newStats = fs.statSync(outputPath);

        console.log(`Original size: ${(originalStats.size / 1024).toFixed(2)} KB`);
        console.log(`New size: ${(newStats.size / 1024).toFixed(2)} KB`);
        console.log(`Savings: ${((1 - newStats.size / originalStats.size) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('Error optimizing map:', error);
    }
}

optimizeMap();
