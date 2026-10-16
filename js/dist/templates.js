(()=>{(()=>{class i{static symbol(a){return`<svg class="mh-symbol" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><use href="/img/icons/mh-symbols.svg#${a}"></use></svg>`}static animationDelayClass(a){return`anim-delay-step-${Math.max(0,Math.min(10,Number.parseInt(a,10)||0))}`}static renderTarotResult(a,e,l=!0,s=""){const t=l?"Velk\xE1 ark\xE1na":"Mal\xE1 ark\xE1na";return`
            <div class="tarot-result-card fade-in-up ${this.animationDelayClass(e)}">
                <!-- Header Section -->
                <div class="tarot-result-header">
                    <div class="flex-between tarot-result-header__top">
                        <div>
                            <h3 class="tarot-result-title">${this.escapeHtml(String(a.name||"").toUpperCase())}</h3>
                            <div class="tarot-result-meta">
                                <span>${t.toUpperCase()}</span>
                                ${s?`<span class="text-gold tarot-result-meta__separator">\u2022</span> <span class="text-gold">POZICE: ${this.escapeHtml(s.toUpperCase())}</span>`:""}
                            </div>
                        </div>
                        <div class="tarot-result-star">${this.symbol("star")}</div>
                    </div>
                </div>

                <!-- Interpretation Body -->
                <div class="tarot-result-body">
                    <div class="astrologer-note">
                        <span class="astrologer-note__icon">${this.symbol("tarot")}</span>
                        <span class="text-xs uppercase tracking-wide text-silver">SYMBOLICK\xDD V\xDDZNAM KARTY</span>
                    </div>
                    
                    <p class="tarot-main-text">
                        ${this.escapeHtml(a.interpretation)}
                    </p>

                    <!-- Practical Advice -->
                    <div class="tarot-practical-advice">
                        <strong class="text-starlight">Hlavn\xED motiv:</strong>
                        <span class="tarot-practical-advice__text">${this.escapeHtml(a.meaning)}</span>
                    </div>
                </div>
            </div>
        `}static renderSummary3Card(a){return`
            <div class="tarot-summary-enhanced tarot-summary-3card fade-in-up ${this.animationDelayClass(a.length)}">
                <div class="summary-header">
                    <div class="summary-icon">${this.symbol("tarot")}</div>
                    <h4>Souvislosti t\u0159\xED karet</h4>
                    <p class="summary-subtitle">Co bylo, co se d\u011Bje a jak\xFD krok m\u016F\u017Ee n\xE1sledovat</p>
                </div>
                <div class="summary-timeline">
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("book")}</span>
                        <span class="timeline-label">Minulost</span>
                        <span class="timeline-card">${this.escapeHtml(a[0]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("compass")}</span>
                        <span class="timeline-label">P\u0159\xEDtomnost</span>
                        <span class="timeline-card">${this.escapeHtml(a[1]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("star")}</span>
                        <span class="timeline-label">Budoucnost</span>
                        <span class="timeline-card">${this.escapeHtml(a[2]?.name||"")}</span>
                    </div>
                </div>
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
            </div>
        `}static renderSummaryCeltic(a){return`
            <div class="tarot-summary-enhanced tarot-summary-celtic fade-in-up ${this.animationDelayClass(a.length)}">
                <div class="celtic-header">
                    <div class="celtic-cross-icon">
                        <span>\u2606</span>
                        <span>\u2726</span>
                        <span>\u2606</span>
                    </div>
                    <h4>Souvislosti keltsk\xE9ho k\u0159\xED\u017Ee</h4>
                    <p class="summary-subtitle">Komplexn\xED anal\xFDza keltsk\xE9ho k\u0159\xED\u017Ee</p>
                </div>
                
                <div class="celtic-grid">
                    <div class="celtic-section celtic-core">
                        <h5>J\xE1dro situace</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(a[0]?.name||"")}</span>
                            <span class="card-separator">\xD7</span>
                            <span>${this.escapeHtml(a[1]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-influences">
                        <h5>Skryt\xE9 vlivy</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(a[2]?.name||"")}</span>
                            <span class="card-separator">&</span>
                            <span>${this.escapeHtml(a[3]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-timeline">
                        <h5>Tok \u010Dasu</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(a[4]?.name||"")}</span>
                            <span class="card-separator">\u2192</span>
                            <span>${this.escapeHtml(a[5]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-outcome">
                        <h5>Cesta k v\xFDsledku</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(a[6]?.name||"")}</span>
                            <span>${this.escapeHtml(a[7]?.name||"")}</span>
                            <span>${this.escapeHtml(a[8]?.name||"")}</span>
                            <span class="card-separator">\u2192</span>
                            <span class="outcome-card">${this.escapeHtml(a[9]?.name||"")}</span>
                        </div>
                    </div>
                </div>
                
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
                
                <div class="celtic-footer">
                    <span>\u2727</span>
                    <span>Keltsk\xFD k\u0159\xED\u017E \u2013 nejkomplexn\u011Bj\u0161\xED tarotov\xFD v\xFDklad</span>
                    <span>\u2727</span>
                </div>
            </div>
        `}static renderSummaryDefault(a){return`
            <div class="interpretation-summary fade-in-up ${this.animationDelayClass(a.length)}">
                <h4>Souvislosti v\xFDkladu</h4>
                <div id="ethereal-tarot-summary">
                    <p class="text-center tarot-summary-loading-text">
                        <span class="loading-spinner" aria-hidden="true"></span> P\u0159ipravuje se v\xFDklad\u2026
                    </p>
                </div>
            </div>
        `}static renderEtherealSummaryLoading(){return`
            <div class="summary-content" id="ethereal-tarot-summary" role="status">
                <div class="summary-loading">
                    <div class="loading-crystal">
                        <span>${this.symbol("tarot")}</span>
                    </div>
                    <p>P\u0159ipravuje se spole\u010Dn\xFD v\xFDklad\u2026</p>
                    <small>Podle vybran\xFDch karet a tv\xE9 ot\xE1zky</small>
                </div>
            </div>
        `}static renderEtherealProgress(a=[],e="ethereal-progress"){const l=a.map((s,t)=>`
            <div class="ethereal-progress-step${t===0?" active":""}" data-step="${t}">
                <div class="ethereal-progress-step__dot"></div>
                <span class="ethereal-progress-step__label">${this.escapeHtml(s)}</span>
            </div>
        `).join('<div class="ethereal-progress-connector"></div>');return`
            <div class="ethereal-progress" id="${e}">
                ${l}
            </div>
        `}static updateEtherealProgress(a,e){const l=document.getElementById(a);l&&l.querySelectorAll(".ethereal-progress-step").forEach((s,t)=>{s.classList.remove("active","done"),t<e?s.classList.add("done"):t===e&&s.classList.add("active")})}static renderAuthModal(){return`
  <div id="auth-modal" class="modal modal--auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" hidden>
    <div class="modal__content auth-modal__content">
        <button type="button" class="modal__close auth-modal__close" aria-label="Zav\u0159\xEDt p\u0159ihl\xE1\u0161en\xED">\u2715</button>
        <h2 id="auth-title" class="auth-modal__title">P\u0159ihl\xE1\u0161en\xED</h2>
        <form id="login-form">
            <div class="auth-modal__field">
                <label class="auth-modal__label" for="auth-modal-email">E-mail</label>
                <input class="auth-modal__input" id="auth-modal-email" type="email" name="email" required autocomplete="email" inputmode="email">
            </div>
            <div id="password-field-wrapper" class="auth-modal__field auth-modal__field--compact">
                <label class="auth-modal__label" for="auth-modal-password">Heslo</label>
                <input class="auth-modal__input" id="auth-modal-password" type="password" name="password" required autocomplete="current-password">
            </div>
            <div id="confirm-password-field-wrapper" class="auth-modal__field" hidden>
                <label class="auth-modal__label" for="auth-modal-password-confirm">Potvr\u010F heslo</label>
                <input class="auth-modal__input" id="auth-modal-password-confirm" type="password" name="confirm_password" minlength="8" autocomplete="new-password">
            </div>
            <div id="forgot-password-link" class="auth-modal__forgot">
                <a href="#" id="auth-forgot-password" class="auth-modal__muted-link">Zapomn\u011Bl jsi heslo?</a>
            </div>

            <!-- Reset Password Fields (hidden by default) -->
            <div id="reset-password-fields" class="auth-modal__field" hidden>
                <p class="auth-modal__help-text">Zadej e-mail sv\xE9ho \xFA\u010Dtu. Pokud je u n\xE1s veden\xFD, p\u0159ijde na n\u011Bj odkaz pro obnoven\xED hesla.</p>
            </div>

            <!-- Optional profile fields. Keep birth data clearly explained and non-blocking. -->
            <div id="register-fields" class="auth-modal__field" hidden>
                <div class="auth-modal__field">
                    <label class="auth-modal__label" for="auth-modal-birthdate">Datum narozen\xED</label>
                    <input class="auth-modal__input" id="auth-modal-birthdate" type="date" name="birth_date" autocomplete="bday" aria-describedby="birth-date-privacy-note">
                    <p id="birth-date-privacy-note" class="auth-modal__help-text">Nepovinn\xE9. Datum pou\u017Eijeme jen pro osobn\xED v\xFDklady a nastaven\xED profilu; m\u016F\u017Ee\u0161 ho doplnit pozd\u011Bji u n\xE1stroje, kter\xFD ho opravdu pot\u0159ebuje.</p>
                </div>
            </div>

            <div id="gdpr-consent-wrapper" class="auth-modal__field" hidden>
                <label class="checkbox-label">
                    <input type="checkbox" id="gdpr-consent" name="gdpr_consent">
                    <span>Souhlas\xEDm s <a href="/podminky.html" target="_blank" rel="noopener">obchodn\xEDmi podm\xEDnkami</a> a potvrzuji sezn\xE1men\xED se <a href="/soukromi.html" target="_blank" rel="noopener">z\xE1sadami soukrom\xED</a>.</span>
                </label>
            </div>

            <p id="auth-modal-status" class="auth-modal__help-text" role="status" hidden></p>
            <button type="submit" id="auth-submit" class="btn btn--primary auth-modal__submit">P\u0159ihl\xE1sit se</button>
            <p class="auth-modal__toggle-wrap">
                <a href="#" id="auth-mode-toggle" class="auth-modal__mode-toggle">Nem\xE1te \xFA\u010Det? Zaregistrujte se</a>
            </p>
        </form>
    </div>
  </div>`}static renderAuthorBox(a){return a?`
            <div class="author-box">
                <div class="author-box__avatar">
                    <img class="author-box__image" src="${a.image}" alt="${a.name}" width="80" height="80">
                </div>
                <div class="author-box__content">
                    <h4 class="author-box__name">${a.name}</h4>
                    <p class="author-box__role">${a.role}</p>
                    <p class="author-box__bio">${a.bio}</p>
                    ${a.links?`
                        <div class="author-box__links">
                            ${a.links.instagram?`<a class="author-box__link" href="${a.links.instagram}" target="_blank" rel="noopener">Instagram \u2197</a>`:""}
                            ${a.links.facebook?`<a class="author-box__link" href="${a.links.facebook}" target="_blank" rel="noopener">Facebook \u2197</a>`:""}
                        </div>
                    `:""}
                </div>
            </div>
        `:""}static escapeHtml(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}}typeof window<"u"&&(window.Templates=i)})();})();
