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
 image.src = `/img/tarot-v2/tarot_${slug}.webp`;
 image.alt = name;
 button.classList.add('flipped');
 button.setAttribute('aria-label', `${name}: ${message}`);
 document.getElementById('tarot-demo-caption').textContent = `${name} — ${message} Toto je ukázka, vlastní kartu si vytáhneš v nástroji.`;
});
