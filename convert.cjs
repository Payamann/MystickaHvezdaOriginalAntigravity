const Fontmin = require('fontmin');
const path = require('path');

const fonts = [
    { src: 'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', name: 'Inter Regular' },
    { src: 'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf', name: 'Inter Bold' },
    { src: 'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf', name: 'Inter Medium' }
];

let completed = 0;

fonts.forEach(font => {
    const fm = new Fontmin()
        .src(font.src)
        .use(Fontmin.ttf2woff2())
        .dest('fonts');
    
    fm.run((err, files) => {
        completed++;
        if (err) {
            console.error(`ERROR converting ${font.name}:`, err.message);
        } else {
            files.forEach(f => {
                console.log(`✓ ${font.name} → ${path.basename(f.path)}`);
            });
        }
        
        if (completed === fonts.length) {
            console.log('\nConversion complete!');
            process.exit(err ? 1 : 0);
        }
    });
});
