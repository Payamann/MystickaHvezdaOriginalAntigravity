(()=>{window.sentryLoaded=new Promise(n=>{window.Sentry&&(window.Sentry.init({dsn:"SENTRY_DSN_PLACEHOLDER",environment:"production",tracesSampleRate:.1}),n())});})();
