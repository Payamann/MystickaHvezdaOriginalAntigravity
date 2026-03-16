import Fontmin from 'fontmin';

const fonts = [
    'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf',
    'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf',
    'fonts/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'
];

fonts.forEach(fontPath => {
    const fm = new Fontmin()
        .src(fontPath)
        .use(Fontmin.ttf2woff2())
        .dest('fonts');
    
    fm.run((err, files) => {
        if (err) {
            console.error(`Error converting ${fontPath}:`, err);
        } else {
            console.log(`Converted ${fontPath}`);
            files.forEach(f => console.log(`  → ${f.path}`));
        }
    });
});
