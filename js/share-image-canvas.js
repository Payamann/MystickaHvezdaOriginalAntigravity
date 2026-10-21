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
    const PAINTED_BACKGROUND_SRC = '/img/atlas/tools-v1/02-mesicni-krajina.webp';
    const COLOR_NAVY = '#0b1929';
    const COLOR_NAVY_DEEP = '#07121f';
    const COLOR_GOLD = '#d0b17c';
    const COLOR_CREAM = '#e9e3d7';
    let paintedBackground = null;
    const graphemeSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

    function splitGraphemes(text) {
        return graphemeSegmenter
            ? Array.from(graphemeSegmenter.segment(text), part => part.segment)
            : Array.from(text);
    }

    // Keep drawBrandBackground synchronous for legacy callers. The local
    // artwork is warmed in the background and the renderer falls back to a
    // complete navy card when the image is not ready or cannot be loaded.
    const paintedBackgroundImage = new Image();
    paintedBackgroundImage.onload = () => { paintedBackground = paintedBackgroundImage; };
    paintedBackgroundImage.onerror = () => { paintedBackground = null; };
    paintedBackgroundImage.decoding = 'async';
    paintedBackgroundImage.src = PAINTED_BACKGROUND_SRC;

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
                if (ctx.measureText(word).width <= maxWidth) {
                    current = word;
                    return;
                }

                const segments = splitGraphemes(word);
                let chunk = '';
                segments.forEach((segment) => {
                    const next = `${chunk}${segment}`;
                    if (chunk && ctx.measureText(next).width > maxWidth) {
                        lines.push(chunk);
                        chunk = segment;
                    } else {
                        chunk = next;
                    }
                });
                current = chunk;
            }
        });

        if (current) lines.push(current);
        return lines;
    }

    function ellipsizeLine(ctx, line, maxWidth) {
        const characters = splitGraphemes(String(line || '').trimEnd());
        while (characters.length > 0 && ctx.measureText(`${characters.join('')}…`).width > maxWidth) {
            characters.pop();
        }
        return `${characters.join('').trimEnd()}…`;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
        const visibleLines = lines.slice(0, maxLines);
        if (visibleLines.length > 0 && Number.isFinite(maxWidth) && maxWidth > 0) {
            const hasOmittedLines = lines.length > visibleLines.length;
            const lastIndex = visibleLines.length - 1;
            visibleLines.forEach((line, index) => {
                if (ctx.measureText(line).width > maxWidth || (hasOmittedLines && index === lastIndex)) {
                    visibleLines[index] = ellipsizeLine(ctx, line, maxWidth);
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

    function drawSeededStars(ctx, seed, width, height) {
        // Retained as a no-op for older tools that reference this public
        // helper directly. Current exports use the painted navy background.
        if (!ctx || !Number.isFinite(seed) || width <= 0 || height <= 0) return;
    }

    function drawImageCover(ctx, image, x, y, width, height) {
        const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    }

    // Painted navy surface + restrained gold frame + brand header. The seed
    // argument remains accepted because existing tools pass it. Cards that
    // already place artwork or a heading at the top may hide the shared header.
    function drawBrandBackground(ctx, canvas, seed = 7, options = {}) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, COLOR_NAVY);
        gradient.addColorStop(0.52, '#102638');
        gradient.addColorStop(1, COLOR_NAVY_DEEP);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (paintedBackground?.naturalWidth) {
            const artworkHeight = Math.min(660, canvas.height * 0.52);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, artworkHeight);
            ctx.clip();
            drawImageCover(ctx, paintedBackground, 0, 0, canvas.width, artworkHeight);
            const veil = ctx.createLinearGradient(0, 0, 0, artworkHeight);
            veil.addColorStop(0, 'rgba(11,25,41,0.86)');
            veil.addColorStop(0.5, 'rgba(11,25,41,0.34)');
            veil.addColorStop(1, '#102638');
            ctx.fillStyle = veil;
            ctx.fillRect(0, 0, canvas.width, artworkHeight);
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(208,177,124,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

        if (options.showHeader !== false) {
            ctx.textAlign = 'center';
            ctx.fillStyle = COLOR_GOLD;
            ctx.font = '600 38px Inter, Arial, sans-serif';
            ctx.fillText('Mystická Hvězda', canvas.width / 2, 130);
        }
    }

    function drawFooter(ctx, canvas, pageUrl, ctaText) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLOR_CREAM;
        ctx.font = '500 30px Inter, Arial, sans-serif';
        ctx.fillText(pageUrl, canvas.width / 2, 1240);

        if (ctaText) {
            ctx.fillStyle = COLOR_GOLD;
            ctx.font = '600 26px Inter, Arial, sans-serif';
            ctx.fillText(ctaText, canvas.width / 2, 1280);
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
                await downloadCanvas(canvas, fileName);
                track(`${eventBase}_saved`, { ...metadata, share_target: 'download_fallback', format: 'png' });
                return 'downloaded';
            }
        }

        await downloadCanvas(canvas, fileName);
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
