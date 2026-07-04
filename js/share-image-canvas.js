/**
 * Mystická Hvězda – Shared result-image canvas helpers
 * Reusable 1080x1350 branded share cards: canvas drawing primitives plus the
 * share-first flow (native file share on mobile, PNG download fallback) with
 * unified `${eventBase}_shared|_share_cancelled|_saved` analytics.
 */
(function () {
    'use strict';

    const CARD_WIDTH = 1080;
    const CARD_HEIGHT = 1350;

    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = CARD_WIDTH;
        canvas.height = CARD_HEIGHT;
        return canvas;
    }

    function wrapText(ctx, text, maxWidth) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach((word) => {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidth) {
                current = test;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        });

        if (current) lines.push(current);
        return lines;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length) {
        lines.slice(0, maxLines).forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + Math.min(lines.length, maxLines) * lineHeight;
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image failed: ${src}`));
            image.src = src;
        });
    }

    function drawImageContain(ctx, image, x, y, width, height) {
        const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    }

    function drawSeededStars(ctx, seed, width, height) {
        for (let i = 0; i < 220; i += 1) {
            const x = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
            const y = (Math.sin(seed + i * 78.233) * 24634.6345) % 1;
            const px = Math.abs(x) * width;
            const py = Math.abs(y) * height * 0.72;
            const r = i % 9 === 0 ? 2.3 : 1.2;
            ctx.fillStyle = i % 7 === 0 ? 'rgba(230,195,80,0.75)' : 'rgba(235,240,255,0.72)';
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Gradient night sky + stars + double gold frame + brand header.
    function drawBrandBackground(ctx, canvas, seed = 7) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#141038');
        gradient.addColorStop(0.48, '#070716');
        gradient.addColorStop(1, '#050510');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawSeededStars(ctx, seed, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(212,175,55,0.84)';
        ctx.lineWidth = 5;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
        ctx.strokeStyle = 'rgba(212,175,55,0.34)';
        ctx.lineWidth = 2;
        ctx.strokeRect(78, 78, canvas.width - 156, canvas.height - 156);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.font = '600 38px Inter, Arial, sans-serif';
        ctx.fillText('Mystická Hvězda', canvas.width / 2, 130);
    }

    function drawFooter(ctx, canvas, pageUrl, ctaText) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.font = '500 30px Inter, Arial, sans-serif';
        ctx.fillText(pageUrl, canvas.width / 2, 1268);

        if (ctaText) {
            ctx.fillStyle = 'rgba(212,175,55,0.9)';
            ctx.font = '600 26px Inter, Arial, sans-serif';
            ctx.fillText(ctaText, canvas.width / 2, 1304);
        }
    }

    function canvasToPngFile(canvas, fileName) {
        return new Promise((resolve, reject) => {
            if (!canvas.toBlob) {
                reject(new Error('canvas.toBlob unsupported'));
                return;
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], fileName, { type: 'image/png' }));
                } else {
                    reject(new Error('Canvas render produced no blob.'));
                }
            }, 'image/png');
        });
    }

    function downloadCanvas(canvas, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function track(eventName, metadata) {
        window.MH_ANALYTICS?.trackAction?.(eventName, metadata);
    }

    /**
     * Share-first delivery of a rendered canvas: native share sheet with the
     * PNG file where supported, otherwise a direct download. Emits
     * `${eventBase}_shared`, `${eventBase}_share_cancelled` or
     * `${eventBase}_saved` through MH_ANALYTICS.
     * Returns 'shared' | 'cancelled' | 'downloaded'.
     */
    async function shareOrDownload({ canvas, fileName, shareTitle, shareText, eventBase, metadata = {} }) {
        let file = null;
        try {
            file = await canvasToPngFile(canvas, fileName);
        } catch (blobError) {
            console.warn('[ShareImage] Blob render fallback:', blobError.message);
        }

        const canShareFile = Boolean(
            file
            && typeof navigator.share === 'function'
            && navigator.canShare
            && navigator.canShare({ files: [file] })
        );

        if (canShareFile) {
            try {
                await navigator.share({ files: [file], title: shareTitle, text: shareText });
                track(`${eventBase}_shared`, { ...metadata, share_target: 'web_share', format: 'png' });
                return 'shared';
            } catch (shareError) {
                if (shareError && shareError.name === 'AbortError') {
                    track(`${eventBase}_share_cancelled`, metadata);
                    return 'cancelled';
                }
                downloadCanvas(canvas, fileName);
                track(`${eventBase}_saved`, { ...metadata, share_target: 'download_fallback', format: 'png' });
                return 'downloaded';
            }
        }

        downloadCanvas(canvas, fileName);
        track(`${eventBase}_saved`, { ...metadata, share_target: 'download', format: 'png' });
        return 'downloaded';
    }

    window.MH_SHARE_IMAGE = {
        CARD_WIDTH,
        CARD_HEIGHT,
        createCanvas,
        wrapText,
        drawCenteredLines,
        loadImage,
        drawImageContain,
        drawSeededStars,
        drawBrandBackground,
        drawFooter,
        canvasToPngFile,
        downloadCanvas,
        shareOrDownload
    };
})();
