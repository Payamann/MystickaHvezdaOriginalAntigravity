(()=>{(()=>{class i{static renderSymbol(e,s="1em"){const l=new Set(["star","crystal","tarot","book","hourglass","compass","wave","gem","lock"]),a={"0.8em":"mh-symbol--template-size-08em","0.9em":"mh-symbol--template-size-09em","1em":"mh-symbol--template-size-1em","1.2em":"mh-symbol--template-size-12em","1.5em":"mh-symbol--template-size-15em","2em":"mh-symbol--template-size-2em","2.5rem":"mh-symbol--template-size-25rem","3rem":"mh-symbol--template-size-3rem"},t=l.has(e)?e:"star";return`<svg class="mh-symbol mh-symbol--template ${a[s]||a["1em"]}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#${t}"></use></svg>`}static animationDelayClass(e){return`anim-delay-step-${Math.max(0,Math.min(10,Number.parseInt(e,10)||0))}`}static renderTarotResult(e,s,l=!0,a=""){const t=l?"Velk\xE1 ark\xE1na":"Mal\xE1 ark\xE1na";return`
            <div class="tarot-result-card fade-in-up ${this.animationDelayClass(s)}">
                <!-- Header Section -->
                <div class="tarot-result-header">
                    <div class="flex-between tarot-result-header__top">
                        <div>
                            <h3 class="tarot-result-title">${e.name.toUpperCase()}</h3>
                            <div class="tarot-result-meta">
                                <span>${t.toUpperCase()}</span>
                                ${a?`<span class="text-gold tarot-result-meta__separator">\u2022</span> <span class="text-gold">POZICE: ${a.toUpperCase()}</span>`:""}
                            </div>
                        </div>
                        <div class="tarot-result-star">${this.renderSymbol("star","2.5rem")}</div>
                    </div>
                </div>

                <!-- Interpretation Body -->
                <div class="tarot-result-body">
                    <div class="astrologer-note">
                        <span class="astrologer-note__icon">${this.renderSymbol("crystal","1.2em")}</span>
                        <span class="text-xs uppercase tracking-wide text-silver">INTERPRETACE OD NA\u0160EHO ASTROLOGA:</span>
                    </div>
                    
                    <p class="tarot-main-text">
                        ${this.escapeHtml(e.interpretation)}
                    </p>

                    <!-- Practical Advice -->
                    <div class="tarot-practical-advice">
                        <strong class="text-starlight">Praktick\xE1 rada:</strong>
                        <span class="tarot-practical-advice__text">${this.escapeHtml(e.meaning)}. Nebojte se ud\u011Blat krok, kter\xFD c\xEDt\xEDte jako spr\xE1vn\xFD.</span>
                    </div>
                </div>
            </div>
        `}static renderSummary3Card(e){return`
            <div class="tarot-summary-enhanced tarot-summary-3card fade-in-up ${this.animationDelayClass(e.length)}">
                <div class="summary-header">
                    <div class="summary-icon">${this.renderSymbol("tarot","3rem")}</div>
                    <h4>Propojen\xED va\u0161\xED cesty</h4>
                    <p class="summary-subtitle">Odkaz minulosti, s\xEDla p\u0159\xEDtomnosti, p\u0159\xEDslib budoucnosti</p>
                </div>
                <div class="summary-timeline">
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.renderSymbol("book","1.5em")}</span>
                        <span class="timeline-label">Minulost</span>
                        <span class="timeline-card">${this.escapeHtml(e[0]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.renderSymbol("hourglass","1.5em")}</span>
                        <span class="timeline-label">P\u0159\xEDtomnost</span>
                        <span class="timeline-card">${this.escapeHtml(e[1]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.renderSymbol("compass","1.5em")}</span>
                        <span class="timeline-label">Budoucnost</span>
                        <span class="timeline-card">${this.escapeHtml(e[2]?.name||"")}</span>
                    </div>
                </div>
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
            </div>
        `}static renderSummaryCeltic(e){return`
            <div class="tarot-summary-enhanced tarot-summary-celtic fade-in-up ${this.animationDelayClass(e.length)}">
                <div class="celtic-header">
                    <div class="celtic-cross-icon">
                        <span>${this.renderSymbol("star","0.9em")}</span>
                        <span>${this.renderSymbol("star","1em")}</span>
                        <span>${this.renderSymbol("star","0.9em")}</span>
                    </div>
                    <h4>Hlubok\xFD vhled do va\u0161\xED cesty</h4>
                    <p class="summary-subtitle">Komplexn\xED anal\xFDza keltsk\xE9ho k\u0159\xED\u017Ee</p>
                </div>
                
                <div class="celtic-grid">
                    <div class="celtic-section celtic-core">
                        <h5>${this.renderSymbol("star","1em")} J\xE1dro situace</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[0]?.name||"")}</span>
                            <span class="card-separator">\xD7</span>
                            <span>${this.escapeHtml(e[1]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-influences">
                        <h5>${this.renderSymbol("wave","1em")} Skryt\xE9 vlivy</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[2]?.name||"")}</span>
                            <span class="card-separator">&</span>
                            <span>${this.escapeHtml(e[3]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-timeline">
                        <h5>${this.renderSymbol("hourglass","1em")} Tok \u010Dasu</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[4]?.name||"")}</span>
                            <span class="card-separator">\u2192</span>
                            <span>${this.escapeHtml(e[5]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-outcome">
                        <h5>${this.renderSymbol("compass","1em")} Cesta k v\xFDsledku</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[6]?.name||"")}</span>
                            <span>${this.escapeHtml(e[7]?.name||"")}</span>
                            <span>${this.escapeHtml(e[8]?.name||"")}</span>
                            <span class="card-separator">\u2192</span>
                            <span class="outcome-card">${this.escapeHtml(e[9]?.name||"")}</span>
                        </div>
                    </div>
                </div>
                
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
                
                <div class="celtic-footer">
                    <span>${this.renderSymbol("star","0.8em")}</span>
                    <span>Keltsk\xFD k\u0159\xED\u017E \u2013 nejkomplexn\u011Bj\u0161\xED tarotov\xFD v\xFDklad</span>
                    <span>${this.renderSymbol("star","0.8em")}</span>
                </div>
            </div>
        `}static renderSummaryDefault(e){return`
            <div class="interpretation-summary fade-in-up ${this.animationDelayClass(e.length)}">
                <h4>${this.renderSymbol("star","1em")} Cesta va\u0161\xED du\u0161e</h4>
                <div id="ethereal-tarot-summary">
                    <p class="text-center tarot-summary-loading-text">
                        <span class="loading-spinner"></span> Spojuji se s univerzem...
                    </p>
                </div>
            </div>
        `}static renderEtherealSummaryLoading(){return`
            <div class="summary-content" id="ethereal-tarot-summary">
                <div class="summary-loading">
                    <div class="loading-crystal">
                        <span>${this.renderSymbol("gem","2em")}</span>
                    </div>
                    <p>Komunikuji s vy\u0161\u0161\xEDmi \u0159\xED\u0161emi...</p>
                    <small>P\u0159ipravuji hlubokou anal\xFDzu va\u0161ich 10 karet</small>
                </div>
            </div>
        `}static renderEtherealProgress(e=[],s="ethereal-progress"){const l=e.map((a,t)=>`
            <div class="ethereal-progress-step${t===0?" active":""}" data-step="${t}">
                <div class="ethereal-progress-step__dot"></div>
                <span class="ethereal-progress-step__label">${this.escapeHtml(a)}</span>
            </div>
        `).join('<div class="ethereal-progress-connector"></div>');return`
            <div class="ethereal-progress" id="${s}">
                ${l}
            </div>
        `}static updateEtherealProgress(e,s){const l=document.getElementById(e);l&&l.querySelectorAll(".ethereal-progress-step").forEach((a,t)=>{a.classList.remove("active","done"),t<s?a.classList.add("done"):t===s&&a.classList.add("active")})}static renderAuthModal(){return`
  <div id="auth-modal" class="modal modal--auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" tabindex="-1" hidden>
    <div class="modal__content auth-modal__content">
        <button type="button" class="modal__close auth-modal__close" aria-label="Zav\u0159\xEDt">\xD7</button>
        <h2 id="auth-title" class="auth-modal__title">P\u0159ihl\xE1\u0161en\xED</h2>
        <form id="login-form">
            <div class="auth-modal__field">
                <label class="auth-modal__label" for="auth-modal-email">E-mail</label>
                <input id="auth-modal-email" class="auth-modal__input" type="email" name="email" required autocomplete="email" inputmode="email">
            </div>
            <div id="password-field-wrapper" class="auth-modal__field auth-modal__field--compact">
                <label class="auth-modal__label" for="auth-modal-password">Heslo</label>
                <input id="auth-modal-password" class="auth-modal__input" type="password" name="password" required autocomplete="current-password">
            </div>
            <div id="confirm-password-field-wrapper" class="auth-modal__field" hidden>
                <label class="auth-modal__label" for="auth-modal-confirm-password">Potvr\u010F heslo</label>
                <input id="auth-modal-confirm-password" class="auth-modal__input" type="password" name="confirm_password" minlength="8" autocomplete="new-password">
            </div>
            <div id="forgot-password-link" class="auth-modal__forgot">
                <a href="#" id="auth-forgot-password" class="auth-modal__muted-link">Zapomn\u011Bli jste heslo?</a>
            </div>

            <!-- Reset Password Fields (hidden by default) -->
            <div id="reset-password-fields" class="auth-modal__field" hidden>
                <p class="auth-modal__help-text">Zadejte sv\u016Fj email a po\u0161leme v\xE1m odkaz pro obnoven\xED hesla.</p>
            </div>

            <!-- Optional profile fields. Keep birth data clearly explained and non-blocking. -->
            <div id="register-fields" class="auth-modal__field" hidden>
                <div class="auth-modal__field">
                    <label class="auth-modal__label" for="auth-modal-birth-date">Datum narozen\xED</label>
                    <input id="auth-modal-birth-date" class="auth-modal__input" type="date" name="birth_date" autocomplete="bday" aria-describedby="birth-date-privacy-note">
                    <p id="birth-date-privacy-note" class="auth-modal__help-text">Nepovinn\xE9. Datum pou\u017Eijeme jen pro osobn\xED v\xFDklady a nastaven\xED profilu; m\u016F\u017Ee\u0161 ho doplnit pozd\u011Bji u n\xE1stroje, kter\xFD ho opravdu pot\u0159ebuje.</p>
                </div>
            </div>

            <div id="gdpr-consent-wrapper" class="auth-modal__field" hidden>
                <label class="checkbox-label">
                    <input type="checkbox" id="gdpr-consent" name="gdpr_consent">
                    <span>Souhlas\xEDm s <a href="/podminky.html" target="_blank" rel="noopener">obchodn\xEDmi podm\xEDnkami</a> a potvrzuji sezn\xE1men\xED se <a href="/soukromi.html" target="_blank" rel="noopener">z\xE1sadami soukrom\xED</a>.</span>
                </label>
            </div>

            <button type="submit" id="auth-submit" class="btn btn--primary auth-modal__submit">P\u0159ihl\xE1sit se</button>
            <p class="auth-modal__toggle-wrap">
                <a href="#" id="auth-mode-toggle" class="auth-modal__mode-toggle">Nem\xE1te \xFA\u010Det? Zaregistrujte se</a>
            </p>
        </form>
    </div>
  </div>`}static renderAuthorBox(e){return e?`
            <div class="author-box">
                <div class="author-box__avatar">
                    <img class="author-box__image" src="${e.image}" alt="${e.name}" width="80" height="80">
                </div>
                <div class="author-box__content">
                    <h4 class="author-box__name">${e.name}</h4>
                    <p class="author-box__role">${e.role}</p>
                    <p class="author-box__bio">${e.bio}</p>
                    ${e.links?`
                        <div class="author-box__links">
                            ${e.links.instagram?`<a class="author-box__link" href="${e.links.instagram}" target="_blank" rel="noopener">Instagram \u2197</a>`:""}
                            ${e.links.facebook?`<a class="author-box__link" href="${e.links.facebook}" target="_blank" rel="noopener">Facebook \u2197</a>`:""}
                        </div>
                    `:""}
                </div>
            </div>
        `:""}static escapeHtml(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}}typeof window<"u"&&(window.Templates=i)})();})();
