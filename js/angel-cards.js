/**
 * Angel Cards Logic
 * Handles card drawing, 3D animations, and API communication for deep readings.
 */

let angelCardsData = [];
let drawnCard = null;

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
}

function setCardBack(backEl, card) {
    if (!backEl || !card) return;

    const archetype = card.archetype || 'guidance';
    backEl.className = `angel-card-back angel-card-back--${archetype}`;
    backEl.innerHTML = `
        <div class="angel-card-overlay"></div>
        <div class="angel-card-content">
            <div class="angel-card-sparkle">✨</div>
            <h3 class="angel-name">${card.name}</h3>
            <div class="angel-theme">${card.theme}</div>
        </div>
    `;
}

function animateCardTilt(inner, transform) {
    if (!inner) return;
    inner.animate([
        { transform }
    ], {
        duration: 120,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load card database
    try {
        const res = await fetch('/data/angel-cards.json');
        if (!res.ok) throw new Error('Nepodařilo se načíst databázi karet.');
        angelCardsData = await res.json();
    } catch (error) {
        console.error('Error loading angel cards:', error);
        alert('Došlo k chybě při načítání karet. Zkuste prosím obnovit stránku.');
        return;
    }

    // 2. Check Daily Lock
    checkDailyLock();

    // 3. Attach listeners
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.addEventListener('click', drawCard);

        drawBtn.addEventListener('mousemove', handleMouseMove);
        drawBtn.addEventListener('mouseleave', () => {
            const inner = drawBtn.querySelector('.angel-card-inner');
            if (inner && !drawBtn.classList.contains('is-flipped')) {
                animateCardTilt(inner, 'rotateX(0deg) rotateY(0deg)');
            }
        });
    }

    const shareBtn = document.getElementById('btn-share-card');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCard);
    }
});

/**
 * Handles sharing the drawn card using the Web Share API if available.
 */
function shareCard() {
    if (!drawnCard) return;

    const shareTitle = `Moje andělská karta dne: ${drawnCard.name} ✨`;
    const shareText = `Dnes mě provází anděl ${drawnCard.name} s tématem: ${drawnCard.theme}. Zjistěte, jaká karta čeká na vás na Mystické Hvězdě! 🕊️`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
        }).catch(err => {
            console.warn('Share API failed:', err);
        });
    } else {
        // Fallback for desktop/unsupported browsers
        navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n${shareUrl}`).then(() => {
            alert('Odkaz a poselství byly zkopírovány do schránky! Můžete je vložit přátelům.');
        }).catch(err => {
            console.error('Clipboard failed', err);
            alert('Bohužel se nepodařilo zkopírovat odkaz.');
        });
    }
}

/**
 * Checks if the user has already drawn a card today and sets up the UI accordingly.
 */
function checkDailyLock() {
    const today = new Date().toISOString().split('T')[0];
    const savedDataStr = localStorage.getItem('angelCardDaily');

    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.date === today && savedData.cardData) {
                // User already drew a card today
                drawnCard = savedData.cardData;
                revealPreDrawnCard();
            } else {
                // Different day, clear the old reading to be safe
                localStorage.removeItem('angelCardDaily');
            }
        } catch (e) {
            console.error('Error parsing daily card:', e);
            localStorage.removeItem('angelCardDaily');
        }
    }
}

/**
 * Bypasses the animation for returning users and shows their already drawn card.
 */
function revealPreDrawnCard() {
    const container = document.getElementById('draw-btn');
    if (!container) return;

    // Populate Back of Card
    const backEl = container.querySelector('.angel-card-back');
    if (backEl) {
        setCardBack(backEl, drawnCard);
    }

    // Populate Results Area
    const shortMessageEl = document.getElementById('angel-short-message');
    if (shortMessageEl) {
        shortMessageEl.textContent = drawnCard.short_message;
    }

    // Skip animation lock
    const inner = container.querySelector('.angel-card-inner');
    if (inner) animateCardTilt(inner, 'rotateX(0deg) rotateY(0deg)');
    // Turn off transition temporarily so it just appears flipped
    if (inner) inner.classList.add('angel-card-inner--no-transition');

    container.classList.add('is-flipped');
    container.classList.remove('glow-effect');
    container.classList.add('angel-card-container--drawn');

    // Show results section immediately
    const intro = document.getElementById('angel-intro');
    if (intro) {
        const introTexts = intro.querySelectorAll('p');
        introTexts.forEach(p => {
            p.hidden = true;
        });

        // Add a small title for returning users
        const returnMsg = document.createElement('p');
        returnMsg.className = 'mb-xl text-lg w-mx-md mx-auto angel-return-message';
        returnMsg.innerHTML = '<em>Pro tento den už k vám andělé promluvili...</em>';
        intro.prepend(returnMsg);
    }

    const results = document.getElementById('angel-results');
    if (results) {
        setBlockVisible(results, true);
        results.classList.add('animate-in');
    }

    // Restore transition after a tiny delay so future interactions aren't broken
    setTimeout(() => {
        if (inner) inner.classList.remove('angel-card-inner--no-transition');
    }, 50);
}

/**
 * Creates a subtle 3D tilt effect before drawing
 */
function handleMouseMove(e) {
    const cardEl = e.currentTarget;
    if (cardEl.classList.contains('is-flipped')) return;

    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
    const rotateY = ((x - centerX) / centerX) * 10;

    const inner = cardEl.querySelector('.angel-card-inner');
    if (inner) {
        animateCardTilt(inner, `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    }
}

/**
 * Draws a random angel card and triggers the flip animation
 */
function drawCard() {
    const container = document.getElementById('draw-btn');
    if (container.classList.contains('is-flipped')) return; // Already drawn

    // Select random card
    const randomIndex = Math.floor(Math.random() * angelCardsData.length);
    drawnCard = angelCardsData[randomIndex];

    // Save to Daily Lock
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('angelCardDaily', JSON.stringify({
        date: today,
        cardData: drawnCard
    }));

    // Populate Back of Card
    const backEl = container.querySelector('.angel-card-back');
    if (backEl) {
        // We will use a soft abstract background image or CSS gradient
        setCardBack(backEl, drawnCard);
    }

    // Populate Results Area
    const shortMessageEl = document.getElementById('angel-short-message');
    if (shortMessageEl) {
        shortMessageEl.textContent = drawnCard.short_message;
    }

    // Trigger Flip
    // Reset any transform from mouse move
    const inner = container.querySelector('.angel-card-inner');
    if (inner) animateCardTilt(inner, 'rotateX(0deg) rotateY(0deg)');

    container.classList.add('is-flipped');
    container.classList.remove('glow-effect');
    container.classList.add('angel-card-container--drawn');

    // Show results section after flip completes smoothly
    setTimeout(() => {
        const intro = document.getElementById('angel-intro');
        if (intro) {
            // Hide intro text
            const introTexts = intro.querySelectorAll('p');
            introTexts.forEach(p => p.classList.add('angel-intro-text--hidden'));
        }

        const results = document.getElementById('angel-results');
        if (results) {
            setBlockVisible(results, true);
            // Trigger animation frame
            requestAnimationFrame(() => {
                results.classList.add('animate-in');
            });
        }
    }, 800);
}
