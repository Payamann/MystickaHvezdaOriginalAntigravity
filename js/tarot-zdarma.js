// Fixed illustrative examples, separate from the actual tarot draw.
const previewCards = [
 ['hvezda', 'Hvězda', 'Co ti pomáhá znovu najít klid a směr?'],
 ['slunce', 'Slunce', 'Kterou jednoduchou radost si dnes můžeš dopřát?'],
 ['soud', 'Soud', 'Na kterou zkušenost se dnes můžeš podívat s odstupem?']
];
document.addEventListener('click', (event) => {
 const button = event.target.closest('[data-action="flipCard"][data-preview-card]');
 if (!button) return;
 const card = previewCards[Number(button.dataset.previewCard)];
 if (!card) return;
 const [slug, name, message] = card;
 const image = button.querySelector('img');
 image.onerror = () => {
  image.onerror = null;
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  image.src = '/img/tarot-v2/tarot_card_back.webp';
 };
 image.srcset = `/img/tarot-v2/tarot_${slug}-240.webp 240w, /img/tarot-v2/tarot_${slug}-360.webp 360w, /img/tarot-v2/tarot_${slug}.webp 600w`;
 image.sizes = '(max-width: 480px) 80px, 120px';
 image.src = `/img/tarot-v2/tarot_${slug}.webp`;
 image.alt = name;
 image.decoding = 'async';
 button.classList.add('flipped');
 button.setAttribute('aria-label', `${name}: ${message}`);
 document.getElementById('tarot-demo-caption').textContent = `${name} — ${message} Toto je ukázka, vlastní kartu si vytáhneš v nástroji.`;
});
