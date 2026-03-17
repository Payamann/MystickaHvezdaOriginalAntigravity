// Diagnostic wrapper — catches crashes during module import
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.stack || err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

console.log('=== Server Startup Diagnostics ===');
console.log('Node version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CSRF_SECRET set:', !!process.env.CSRF_SECRET);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('SUPABASE_URL set:', !!process.env.SUPABASE_URL);
console.log('Memory:', Math.round(process.memoryUsage().rss / 1024 / 1024), 'MB');
console.log('==================================');

try {
    await import('./index.js');
} catch (err) {
    console.error('FATAL: Server failed to start:', err.stack || err);
    process.exit(1);
}
