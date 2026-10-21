const WIDTH = 540;
const HEIGHT = 675;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function drawImageCover(image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawBackground(landscape) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#0b1929');
    gradient.addColorStop(0.52, '#102638');
    gradient.addColorStop(1, '#07121f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (landscape?.naturalWidth) {
        const artHeight = 330;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, WIDTH, artHeight);
        ctx.clip();
        drawImageCover(landscape, 0, 0, WIDTH, artHeight);
        const veil = ctx.createLinearGradient(0, 0, 0, artHeight);
        veil.addColorStop(0, 'rgba(11,25,41,0.86)');
        veil.addColorStop(0.5, 'rgba(11,25,41,0.35)');
        veil.addColorStop(1, '#102638');
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, WIDTH, artHeight);
        ctx.restore();
    }

    ctx.strokeStyle = 'rgba(208,177,124,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(27, 27, WIDTH - 54, HEIGHT - 54);
}

function wrapText(text, maxWidth) {
    const lines = [];
    let line = '';
    String(text).split(/\s+/).filter(Boolean).forEach((word) => {
        const nextLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(nextLine).width <= maxWidth || !line) {
            line = nextLine;
        } else {
            lines.push(line);
            line = word;
        }
    });
    if (line) lines.push(line);
    return lines;
}

function drawPreview(landscape = null) {
    drawBackground(landscape);

    const centerX = WIDTH / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d0b17c';
    ctx.font = '600 15px Inter, Arial, sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('UKÁZKOVÝ DENNÍ HOROSKOP', centerX, 54);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = 'rgba(233,227,215,0.78)';
    ctx.font = '400 14px Inter, Arial, sans-serif';
    ctx.fillText('Symbolický podnět pro Berana', centerX, 82);

    const circleY = 210;
    const circleRadius = 104;
    const circle = ctx.createRadialGradient(centerX, circleY, 25, centerX, circleY, circleRadius);
    circle.addColorStop(0, 'rgba(208,177,124,0.16)');
    circle.addColorStop(0.65, 'rgba(208,177,124,0.05)');
    circle.addColorStop(1, 'rgba(208,177,124,0)');
    ctx.fillStyle = circle;
    ctx.beginPath();
    ctx.arc(centerX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, circleY, circleRadius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(208,177,124,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '90px serif';
    ctx.fillText('♈', centerX, 241);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '600 34px Cinzel, Georgia, serif';
    ctx.fillText('BERAN', centerX, 328);

    ctx.beginPath();
    ctx.moveTo(centerX - 60, 345);
    ctx.lineTo(centerX + 60, 345);
    ctx.strokeStyle = 'rgba(208,177,124,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e9e3d7';
    ctx.font = '400 16px Inter, Arial, sans-serif';
    const prediction = 'Zkus si vybrat jednu věc, které chceš dnes věnovat pozornost. Když se objeví něco nečekaného, ujasni si, co máš skutečně ve svých rukou.';
    const lines = wrapText(prediction, WIDTH - 90);
    lines.slice(0, 5).forEach((line, index) => {
        const visibleLine = index === 4 && lines.length > 5 ? `${line.slice(0, -1)}…` : line;
        ctx.fillText(visibleLine, 45, 386 + index * 24);
    });

    const boxX = 45;
    const boxY = 525;
    const boxWidth = WIDTH - 90;
    const boxHeight = 78;
    ctx.fillStyle = 'rgba(208,177,124,0.08)';
    ctx.strokeStyle = 'rgba(208,177,124,0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d0b17c';
    ctx.font = '500 14px Inter, Arial, sans-serif';
    ctx.fillText('Afirmace', boxX + 12, boxY + 26);
    ctx.fillStyle = 'rgba(233,227,215,0.85)';
    ctx.font = 'italic 15px Inter, Arial, sans-serif';
    ctx.fillText('„Všímám si toho, co mohu ovlivnit.“', boxX + 12, boxY + 54);

    ctx.beginPath();
    ctx.moveTo(45, HEIGHT - 43);
    ctx.lineTo(WIDTH - 45, HEIGHT - 43);
    ctx.strokeStyle = 'rgba(208,177,124,0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d0b17c';
    ctx.font = '500 14px Cinzel, Georgia, serif';
    ctx.fillText('Mystická Hvězda', centerX, HEIGHT - 20);
}

drawPreview();

const landscape = new Image();
landscape.decoding = 'async';
landscape.onload = () => drawPreview(landscape);
landscape.src = '/img/atlas/tools-v1/02-mesicni-krajina.webp';
