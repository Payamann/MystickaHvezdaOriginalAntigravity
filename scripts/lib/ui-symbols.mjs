// Local decorative symbol vocabulary; actual card, zodiac and planet data stays separate.
export const SYMBOL_IDS = new Set(["angel","crystal","tarot","star","chart","partner","numbers","globe","dream","wave","rune","book","pen","energy","flame","wolf","hourglass","spectrum","eye","compass","leaf","flower","gem","heart","search","balance","home","cycle","gift","seed","yin","people","spiral","strength","bird","tooth","storm","snake","coffin","pregnancy","brokenHeart","mask","lock","check","error","info","warning","dot","music","camera","facebook","calendar","bookmark","settings","user"]);
export function symbolMarkup(id, inline = false) {
 if (!SYMBOL_IDS.has(id)) throw new Error('Unknown UI symbol: ' + id);
 return '<svg class="mh-symbol' + (inline ? ' mh-symbol--inline' : '') + '" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#' + id + '"></use></svg>';
}
