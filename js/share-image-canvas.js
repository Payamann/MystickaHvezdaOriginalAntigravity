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

    const graphemeSegmenter = typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

    function splitLongToken(ctx, token, maxWidth) {
        const graphemes = graphemeSegmenter
            ? Array.from(graphemeSegmenter.segment(token), (part) => part.segment)
            : Array.from(token);
        const lines = [];
        let current = '';

        graphemes.forEach((grapheme) => {
            const candidate = current + grapheme;
            if (current && ctx.measureText(candidate).width > maxWidth) {
                lines.push(current);
                current = grapheme;
            } else {
                current = candidate;
            }
        });

        if (current) lines.push(current);
        return lines;
    }

    function wrapText(ctx, text, maxWidth) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach((word) => {
            if (ctx.measureText(word).width > maxWidth) {
                if (current) lines.push(current);
                const wordLines = splitLongToken(ctx, word, maxWidth);
                lines.push(...wordLines.slice(0, -1));
                current = wordLines[wordLines.length - 1] || '';
                return;
            }

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

    function appendEllipsis(ctx, line, maxWidth) {
        const graphemes = graphemeSegmenter
            ? Array.from(graphemeSegmenter.segment(String(line)), (part) => part.segment)
            : Array.from(String(line));
        let text = graphemes.join('').trimEnd();

        while (text && ctx.measureText(`${text}…`).width > maxWidth) {
            const parts = graphemeSegmenter
                ? Array.from(graphemeSegmenter.segment(text), (part) => part.segment)
                : Array.from(text);
            parts.pop();
            text = parts.join('').trimEnd();
        }

        return `${text}…`;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
        const visibleLines = lines.slice(0, maxLines);
        if (visibleLines.length && Number.isFinite(maxWidth) && maxWidth > 0) {
            const hasOmittedLines = lines.length > visibleLines.length;
            const lastIndex = visibleLines.length - 1;
            visibleLines.forEach((line, index) => {
                if (ctx.measureText(line).width > maxWidth || (hasOmittedLines && index === lastIndex)) {
                    visibleLines[index] = appendEllipsis(ctx, line, maxWidth);
                }
            });
        }

        visibleLines.forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + visibleLines.length * lineHeight;
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

    let brandArtworkPromise;
    function loadBrandArtwork() {
        if (!brandArtworkPromise) {
            brandArtworkPromise = loadImage('/img/atlas/tools-v1/02-mesicni-krajina.webp').catch(() => null);
        }
        return brandArtworkPromise;
    }

    // Shared navy/gold share-card background with the site's painted landscape.
    async function drawBrandBackground(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0b1929');
        gradient.addColorStop(0.58, '#102638');
        gradient.addColorStop(1, '#0b1929');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const artwork = await loadBrandArtwork();
        if (artwork) {
            const artworkHeight = canvas.width * artwork.naturalHeight / artwork.naturalWidth;
            ctx.drawImage(artwork, 0, 0, canvas.width, artworkHeight);

            const veil = ctx.createLinearGradient(0, 0, 0, artworkHeight + 180);
            veil.addColorStop(0, 'rgba(11,25,41,0.78)');
            veil.addColorStop(0.5, 'rgba(11,25,41,0.28)');
            veil.addColorStop(1, '#102638');
            ctx.fillStyle = veil;
            ctx.fillRect(0, 0, canvas.width, artworkHeight + 180);
        }

        ctx.strokeStyle = 'rgba(189,155,101,0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e9e3d7';
        ctx.font = '600 38px Cinzel, Georgia, serif';
        ctx.fillText('Mystická Hvězda', canvas.width / 2, 130);
    }

    function drawFooter(ctx, canvas, pageUrl, ctaText) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(233,227,215,0.78)';
        ctx.font = '500 30px Inter, Arial, sans-serif';
        ctx.fillText(pageUrl, canvas.width / 2, 1218, canvas.width - 120);

        if (ctaText) {
            ctx.fillStyle = 'rgba(208,177,124,0.94)';
            ctx.font = '600 26px Inter, Arial, sans-serif';
            ctx.fillText(ctaText, canvas.width / 2, 1258, canvas.width - 120);
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

    async function downloadCanvas(canvas, fileName) {
        const file = await canvasToPngFile(canvas, fileName);
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        try {
            link.click();
        } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
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
    async function shareOrDownload({ canvas, fileName, shareTitle, shareText, eventBase, metadata = {}, preferDownload = false }) {
        if (preferDownload) {
            await downloadCanvas(canvas, fileName);
            track(`${eventBase}_saved`, { ...metadata, share_target: 'download', format: 'png' });
            return 'downloaded';
        }
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
        drawBrandBackground,
        drawFooter,
        canvasToPngFile,
        downloadCanvas,
        shareOrDownload
    };
})();
