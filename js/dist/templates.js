(()=>{(()=>{class t{static symbol(e){return`<svg class="mh-symbol" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><use href="/img/icons/mh-symbols.svg#${e}"></use></svg>`}static animationDelayClass(e){return`anim-delay-step-${Math.max(0,Math.min(10,Number.parseInt(e,10)||0))}`}static renderTarotResult(e,a,i=!0,s=""){const o=i?"Velk\xE1 ark\xE1na":"Mal\xE1 ark\xE1na";return`
            <div class="tarot-result-card fade-in-up ${this.animationDelayClass(a)}">
                <!-- Header Section -->
                <div class="tarot-result-header">
                    <div class="flex-between tarot-result-header__top">
                        <div>
                            <h3 class="tarot-result-title">${this.escapeHtml(String(e.name||"").toUpperCase())}</h3>
                            <div class="tarot-result-meta">
                                <span>${o.toUpperCase()}</span>
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
                        ${this.escapeHtml(e.interpretation)}
                    </p>

                    <!-- Practical Advice -->
                    <div class="tarot-practical-advice">
                        <strong class="text-starlight">Hlavn\xED motiv:</strong>
                        <span class="tarot-practical-advice__text">${this.escapeHtml(e.meaning)}</span>
                    </div>
                </div>
            </div>
        `}static renderSummary3Card(e){return`
            <div class="tarot-summary-enhanced tarot-summary-3card fade-in-up ${this.animationDelayClass(e.length)}">
                <div class="summary-header">
                    <div class="summary-icon">${this.symbol("tarot")}</div>
                    <h4>Souvislosti t\u0159\xED karet</h4>
                    <p class="summary-subtitle">Co bylo, co se d\u011Bje a jak\xFD krok m\u016F\u017Ee n\xE1sledovat</p>
                </div>
                <div class="summary-timeline">
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("book")}</span>
                        <span class="timeline-label">Minulost</span>
                        <span class="timeline-card">${this.escapeHtml(e[0]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("compass")}</span>
                        <span class="timeline-label">P\u0159\xEDtomnost</span>
                        <span class="timeline-card">${this.escapeHtml(e[1]?.name||"")}</span>
                    </div>
                    <div class="timeline-connector">\u2192</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol("star")}</span>
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
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                    </div>
                    <h4>Souvislosti keltsk\xE9ho k\u0159\xED\u017Ee</h4>
                    <p class="summary-subtitle">Komplexn\xED anal\xFDza keltsk\xE9ho k\u0159\xED\u017Ee</p>
                </div>
                
                <div class="celtic-grid">
                    <div class="celtic-section celtic-core">
                        <h5>J\xE1dro situace</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[0]?.name||"")}</span>
                            <span class="card-separator">\xD7</span>
                            <span>${this.escapeHtml(e[1]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-influences">
                        <h5>Skryt\xE9 vlivy</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[2]?.name||"")}</span>
                            <span class="card-separator">&</span>
                            <span>${this.escapeHtml(e[3]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-timeline">
                        <h5>Tok \u010Dasu</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(e[4]?.name||"")}</span>
                            <span class="card-separator">\u2192</span>
                            <span>${this.escapeHtml(e[5]?.name||"")}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-outcome">
                        <h5>Cesta k v\xFDsledku</h5>
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
                    <span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></span>
                    <span>Keltsk\xFD k\u0159\xED\u017E \u2013 nejkomplexn\u011Bj\u0161\xED tarotov\xFD v\xFDklad</span>
                    <span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></span>
                </div>
            </div>
        `}static renderSummaryDefault(e){return`
            <div class="interpretation-summary fade-in-up ${this.animationDelayClass(e.length)}">
                <h4>Souvislosti v\xFDkladu</h4>
                <div id="ethereal-tarot-summary">
                    <p class="text-center tarot-summary-loading-text">
                        <span class="loading-spinner" aria-hidden="true"></span> P\u0159ipravuje se v\xFDklad\u2026
                    </p>
                </div>
            </div>
        `}static renderEtherealSummaryLoading(){return`
            <div class="summary-content" id="ethereal-tarot-summary">
                <div class="summary-loading">
                    <div class="loading-crystal">
                        <span>${this.symbol("tarot")}</span>
                    </div>
                    <p>P\u0159ipravuje se spole\u010Dn\xFD v\xFDklad\u2026</p>
                    <small>Podle vybran\xFDch karet a tv\xE9 ot\xE1zky</small>
                </div>
            </div>
        `}static renderEtherealProgress(e=[],a="ethereal-progress"){const i=e.map((s,o)=>`
            <div class="ethereal-progress-step${o===0?" active":""}" data-step="${o}">
                <div class="ethereal-progress-step__dot"></div>
                <span class="ethereal-progress-step__label">${this.escapeHtml(s)}</span>
            </div>
        `).join('<div class="ethereal-progress-connector"></div>');return`
            <div class="ethereal-progress" id="${a}">
                ${i}
            </div>
        `}static updateEtherealProgress(e,a){const i=document.getElementById(e);i&&i.querySelectorAll(".ethereal-progress-step").forEach((s,o)=>{s.classList.remove("active","done"),o<a?s.classList.add("done"):o===a&&s.classList.add("active")})}static authCopy(){const e=document.documentElement?.lang?.slice(0,2);return{sk:{close:"Zavrie\u0165 prihl\xE1senie",loginTitle:"Prihl\xE1senie",registerTitle:"Registr\xE1cia",resetTitle:"Obnovenie hesla",password:"Heslo",confirmPassword:"Potvr\u010F heslo",passwordPolicy:"Zvo\u013E si heslo s d\u013A\u017Ekou 8 a\u017E 128 znakov. Niektor\xE9 be\u017En\xE9 hesl\xE1 nie s\xFA povolen\xE9.",forgotPassword:"Zabudnut\xE9 heslo?",resetHelp:"Zadaj e-mail svojho \xFA\u010Dtu. Ak ho u n\xE1s evidujeme, m\xF4\u017Ee ti pr\xEDs\u0165 odkaz na obnovenie hesla.",resetSending:"Odosiela sa \u017Eiados\u0165\u2026",resetSent:"Ak je tento e-mail u n\xE1s zaregistrovan\xFD, m\xF4\u017Ee na\u0148 pr\xEDs\u0165 odkaz na obnovenie hesla. Skontroluj aj spam; ak odkaz nepr\xEDde, m\xF4\u017Ee\u0161 po\u017Eiada\u0165 znova.",resetFailed:"\u017Diados\u0165 sa nepodarilo odosla\u0165. E-mail zostal vo formul\xE1ri. Sk\xFAs to znova.",connectionInterrupted:"Spojenie sa preru\u0161ilo. Skontroluj pripojenie a sk\xFAs to znova.",birthDate:"D\xE1tum narodenia",birthDateNote:"Volite\u013En\xE9. D\xE1tum pou\u017Eijeme iba pri osobn\xFDch v\xFDkladoch a nastaven\xED profilu. M\xF4\u017Ee\u0161 ho doplni\u0165 nesk\xF4r pri n\xE1stroji, ktor\xFD ho potrebuje.",consentHtml:'S\xFAhlas\xEDm s <a href="/podminky.html" target="_blank" rel="noopener">obchodn\xFDmi podmienkami (v \u010De\u0161tine)</a> a potvrdzujem obozn\xE1menie sa so <a href="/soukromi.html" target="_blank" rel="noopener">z\xE1sadami ochrany osobn\xFDch \xFAdajov (v \u010De\u0161tine)</a>.',submitLogin:"Prihl\xE1si\u0165 sa",submitRegister:"Zaregistrova\u0165 sa",submitReset:"Odosla\u0165 odkaz",toggleLogin:"Nem\xE1\u0161 \xFA\u010Det? Zaregistruj sa",toggleRegister:"U\u017E m\xE1\u0161 \xFA\u010Det? Prihl\xE1s sa",toggleReset:"Sp\xE4\u0165 na prihl\xE1senie",errorTitle:"Chyba",registrationErrorTitle:"Registr\xE1cia sa nepodarila",loginErrorTitle:"Prihl\xE1senie sa nepodarilo",registrationNetworkError:"Registr\xE1ciu sa teraz nepodarilo dokon\u010Di\u0165. Sk\xFAs to znova o chv\xED\u013Eu.",loginNetworkError:"Prihl\xE1senie sa teraz nepodarilo. Sk\xFAs to znova o chv\xED\u013Eu.",authFinalizationError:"Server po\u017Eiadavku prijal, ale str\xE1nke sa nepodarilo dokon\u010Di\u0165 \u010Fal\u0161\xED krok. Obnov str\xE1nku a skontroluj e-mail alebo stav \xFA\u010Dtu.",registrationFailed:"Registr\xE1cia sa nepodarila. Skontroluj zadan\xE9 \xFAdaje a sk\xFAs to znova.",loginFailed:"Prihl\xE1senie sa nepodarilo. Skontroluj e-mail a heslo.",registrationRecovery:"\xDA\u010Det u\u017E mo\u017Eno existuje. Prihl\xE1s sa alebo si obnov heslo.",registrationRateLimited:"Z tohto pripojenia prebehlo pr\xEDli\u0161 ve\u013Ea registr\xE1ci\xED. Sk\xFAs to znova nesk\xF4r.",loginRateLimited:"Pr\xEDli\u0161 ve\u013Ea ne\xFAspe\u0161n\xFDch pokusov o prihl\xE1senie. Sk\xFAs to znova nesk\xF4r.",resetRateLimited:"Odoslal sa pr\xEDli\u0161 ve\u013Ek\xFD po\u010Det \u017Eiadost\xED o obnovenie hesla. Sk\xFAs to znova nesk\xF4r.",passwordMin:"Heslo mus\xED ma\u0165 aspo\u0148 {length} znakov.",passwordTooLong:"Heslo m\xF4\u017Ee ma\u0165 najviac 128 znakov.",passwordCommon:"Toto heslo sa pou\u017E\xEDva pr\xEDli\u0161 \u010Dasto. Zvo\u013E si in\xE9.",passwordMismatch:"Hesl\xE1 sa nezhoduj\xFA.",consentRequiredTitle:"Vy\u017Eaduje sa s\xFAhlas",consentRequired:"Na vytvorenie \xFA\u010Dtu prijmi obchodn\xE9 podmienky a potvr\u010F obozn\xE1menie sa so z\xE1sadami ochrany osobn\xFDch \xFAdajov.",verificationTitle:"Overenie e-mailu",verificationMessage:"Na dokon\u010Denie registr\xE1cie potvr\u010F svoju e-mailov\xFA adresu.",welcomeTitle:"Vitaj!",registrationSuccess:"Registr\xE1cia prebehla \xFAspe\u0161ne.",loginSuccessTitle:"Vitaj sp\xE4\u0165",loginSuccess:"Prihl\xE1senie prebehlo \xFAspe\u0161ne.",verifiedTitle:"Overen\xE9!",verifiedMessage:"Tvoj e-mail bol \xFAspe\u0161ne overen\xFD. Teraz sa m\xF4\u017Ee\u0161 prihl\xE1si\u0165.",invalidLink:"Odkaz je neplatn\xFD alebo jeho platnos\u0165 vypr\u0161ala.",expiredLink:"Platnos\u0165 odkazu na overenie vypr\u0161ala. Sk\xFAs to znova."},pl:{close:"Zamknij logowanie",loginTitle:"Logowanie",registerTitle:"Rejestracja",resetTitle:"Resetowanie has\u0142a",password:"Has\u0142o",confirmPassword:"Potwierd\u017A has\u0142o",passwordPolicy:"Wybierz has\u0142o o d\u0142ugo\u015Bci od 8 do 128 znak\xF3w. Niekt\xF3re popularne has\u0142a s\u0105 niedozwolone.",forgotPassword:"Nie pami\u0119tasz has\u0142a?",resetHelp:"Wpisz adres e-mail swojego konta. Je\u015Bli jest u nas zarejestrowany, mo\u017Cesz otrzyma\u0107 link do zmiany has\u0142a.",resetSending:"Wysy\u0142anie pro\u015Bby\u2026",resetSent:"Je\u015Bli konto z tym adresem e-mail jest u nas zarejestrowane, mo\u017Cesz otrzyma\u0107 link do zmiany has\u0142a. Sprawd\u017A te\u017C spam; je\u015Bli link nie dotrze, mo\u017Cesz ponowi\u0107 pro\u015Bb\u0119.",resetFailed:"Nie uda\u0142o si\u0119 wys\u0142a\u0107 pro\u015Bby. Adres e-mail pozosta\u0142 w formularzu. Spr\xF3buj ponownie.",connectionInterrupted:"Po\u0142\u0105czenie zosta\u0142o przerwane. Sprawd\u017A internet i spr\xF3buj ponownie.",birthDate:"Data urodzenia",birthDateNote:"Opcjonalnie. U\u017Cyjemy tej daty tylko do spersonalizowanych interpretacji i ustawie\u0144 profilu. Mo\u017Cesz doda\u0107 j\u0105 p\xF3\u017Aniej przy narz\u0119dziu, kt\xF3re jej potrzebuje.",consentHtml:'Akceptuj\u0119 <a href="/podminky.html" target="_blank" rel="noopener">regulamin (w j\u0119zyku czeskim)</a> i potwierdzam zapoznanie si\u0119 z <a href="/soukromi.html" target="_blank" rel="noopener">polityk\u0105 prywatno\u015Bci (w j\u0119zyku czeskim)</a>.',submitLogin:"Zaloguj si\u0119",submitRegister:"Zarejestruj si\u0119",submitReset:"Wy\u015Blij link",toggleLogin:"Nie masz konta? Zarejestruj si\u0119",toggleRegister:"Masz ju\u017C konto? Zaloguj si\u0119",toggleReset:"Wr\xF3\u0107 do logowania",errorTitle:"B\u0142\u0105d",registrationErrorTitle:"Rejestracja nie powiod\u0142a si\u0119",loginErrorTitle:"Logowanie nie powiod\u0142o si\u0119",registrationNetworkError:"Nie uda\u0142o si\u0119 teraz doko\u0144czy\u0107 rejestracji. Spr\xF3buj ponownie za chwil\u0119.",loginNetworkError:"Nie uda\u0142o si\u0119 teraz zalogowa\u0107. Spr\xF3buj ponownie za chwil\u0119.",authFinalizationError:"Serwer przyj\u0105\u0142 \u017C\u0105danie, ale strona nie mog\u0142a doko\u0144czy\u0107 kolejnego kroku. Od\u015Bwie\u017C stron\u0119 i sprawd\u017A e-mail lub stan konta.",registrationFailed:"Rejestracja nie powiod\u0142a si\u0119. Sprawd\u017A wpisane dane i spr\xF3buj ponownie.",loginFailed:"Logowanie nie powiod\u0142o si\u0119. Sprawd\u017A adres e-mail i has\u0142o.",registrationRecovery:"Konto mo\u017Ce ju\u017C istnie\u0107. Zaloguj si\u0119 lub zresetuj has\u0142o.",registrationRateLimited:"Z tego po\u0142\u0105czenia wykonano zbyt wiele rejestracji. Spr\xF3buj ponownie p\xF3\u017Aniej.",loginRateLimited:"Zbyt wiele nieudanych pr\xF3b logowania. Spr\xF3buj ponownie p\xF3\u017Aniej.",resetRateLimited:"Wys\u0142ano zbyt wiele pr\xF3\u015Bb o zmian\u0119 has\u0142a. Spr\xF3buj ponownie p\xF3\u017Aniej.",passwordMin:"Has\u0142o musi mie\u0107 co najmniej {length} znak\xF3w.",passwordTooLong:"Has\u0142o mo\u017Ce mie\u0107 maksymalnie 128 znak\xF3w.",passwordCommon:"To has\u0142o jest zbyt cz\u0119sto u\u017Cywane. Wybierz inne.",passwordMismatch:"Has\u0142a nie s\u0105 takie same.",consentRequiredTitle:"Wymagana zgoda",consentRequired:"Aby utworzy\u0107 konto, zaakceptuj regulamin i potwierd\u017A zapoznanie si\u0119 z polityk\u0105 prywatno\u015Bci.",verificationTitle:"Potwierdzenie adresu e-mail",verificationMessage:"Aby doko\u0144czy\u0107 rejestracj\u0119, potwierd\u017A sw\xF3j adres e-mail.",welcomeTitle:"Witaj!",registrationSuccess:"Rejestracja przebieg\u0142a pomy\u015Blnie.",loginSuccessTitle:"Witaj ponownie",loginSuccess:"Logowanie przebieg\u0142o pomy\u015Blnie.",verifiedTitle:"Potwierdzono!",verifiedMessage:"Tw\xF3j adres e-mail zosta\u0142 potwierdzony. Mo\u017Cesz si\u0119 teraz zalogowa\u0107.",invalidLink:"Link jest nieprawid\u0142owy lub wygas\u0142.",expiredLink:"Link potwierdzaj\u0105cy wygas\u0142. Spr\xF3buj ponownie."}}[e]||{close:"Zav\u0159\xEDt p\u0159ihl\xE1\u0161en\xED",loginTitle:"P\u0159ihl\xE1\u0161en\xED",registerTitle:"Registrace",resetTitle:"Obnoven\xED hesla",password:"Heslo",confirmPassword:"Potvr\u010F heslo",passwordPolicy:"Zvol heslo dlouh\xE9 8 a\u017E 128 znak\u016F. N\u011Bkter\xE1 b\u011B\u017En\xE1 hesla nejsou povolena.",forgotPassword:"Zapomn\u011Bl jsi heslo?",resetHelp:"Zadej e-mail sv\xE9ho \xFA\u010Dtu. Pokud je u n\xE1s veden\xFD, m\u016F\u017Ee na n\u011Bj p\u0159ij\xEDt odkaz pro obnoven\xED hesla.",resetSending:"Odes\xEDl\xE1 se \u017E\xE1dost\u2026",resetSent:"Pokud je \xFA\u010Det s t\xEDmto e-mailem veden\xFD, m\u016F\u017Ee na n\u011Bj p\u0159ij\xEDt odkaz k obnoven\xED hesla. Zkontroluj i spam; pokud odkaz nedoraz\xED, m\u016F\u017Ee\u0161 \u017E\xE1dost zopakovat.",resetFailed:"\u017D\xE1dost se nepoda\u0159ilo odeslat. E-mail z\u016Fst\xE1v\xE1 ve formul\xE1\u0159i, zkus to znovu.",connectionInterrupted:"Spojen\xED se p\u0159eru\u0161ilo. Zkontroluj p\u0159ipojen\xED a zkus to znovu.",birthDate:"Datum narozen\xED",birthDateNote:"Nepovinn\xE9. Datum pou\u017Eijeme jen pro osobn\xED v\xFDklady a nastaven\xED profilu; m\u016F\u017Ee\u0161 ho doplnit pozd\u011Bji u n\xE1stroje, kter\xFD ho opravdu pot\u0159ebuje.",consentHtml:'Souhlas\xEDm s <a href="/podminky.html" target="_blank" rel="noopener">obchodn\xEDmi podm\xEDnkami</a> a potvrzuji sezn\xE1men\xED se <a href="/soukromi.html" target="_blank" rel="noopener">z\xE1sadami soukrom\xED</a>.',submitLogin:"P\u0159ihl\xE1sit se",submitRegister:"Zaregistrovat",submitReset:"Odeslat odkaz",toggleLogin:"Nem\xE1te \xFA\u010Det? Zaregistrujte se",toggleRegister:"Ji\u017E m\xE1te \xFA\u010Det? P\u0159ihlaste se",toggleReset:"Zp\u011Bt na p\u0159ihl\xE1\u0161en\xED",errorTitle:"Chyba",registrationErrorTitle:"Chyba registrace",loginErrorTitle:"Chyba p\u0159ihl\xE1\u0161en\xED",registrationNetworkError:"Registraci se te\u010F nepoda\u0159ilo dokon\u010Dit. Zkus to znovu za chv\xEDli.",loginNetworkError:"P\u0159ihl\xE1\u0161en\xED se te\u010F nepoda\u0159ilo. Zkus to znovu za chv\xEDli.",authFinalizationError:"Server po\u017Eadavek p\u0159ijal, ale str\xE1nce se nepoda\u0159ilo dokon\u010Dit dal\u0161\xED krok. Obnov str\xE1nku a zkontroluj e-mail nebo stav \xFA\u010Dtu.",registrationFailed:"Registrace se nepoda\u0159ila. Zkontroluj zadan\xE9 \xFAdaje a zkus to znovu.",loginFailed:"P\u0159ihl\xE1\u0161en\xED se nepoda\u0159ilo. Zkontroluj e-mail a heslo.",registrationRecovery:"\xDA\u010Det u\u017E mo\u017En\xE1 existuje. P\u0159ihlas se nebo si obnov heslo.",registrationRateLimited:"Z tohoto p\u0159ipojen\xED prob\u011Bhlo p\u0159\xEDli\u0161 mnoho registrac\xED. Zkus to znovu pozd\u011Bji.",loginRateLimited:"P\u0159\xEDli\u0161 mnoho ne\xFAsp\u011B\u0161n\xFDch pokus\u016F o p\u0159ihl\xE1\u0161en\xED. Zkus to znovu pozd\u011Bji.",resetRateLimited:"Odeslalo se p\u0159\xEDli\u0161 mnoho \u017E\xE1dost\xED o obnoven\xED hesla. Zkus to znovu pozd\u011Bji.",passwordMin:"Heslo mus\xED m\xEDt alespo\u0148 {length} znak\u016F.",passwordTooLong:"Heslo m\u016F\u017Ee m\xEDt nejv\xFD\u0161e 128 znak\u016F.",passwordCommon:"Toto heslo je p\u0159\xEDli\u0161 \u010Dast\xE9. Zvol jin\xE9.",passwordMismatch:"Hesla se neshoduj\xED.",consentRequiredTitle:"Souhlas je pot\u0159eba",consentRequired:"Pro vytvo\u0159en\xED \xFA\u010Dtu p\u0159ijmi obchodn\xED podm\xEDnky a potvr\u010F sezn\xE1men\xED se z\xE1sadami soukrom\xED.",verificationTitle:"Ov\u011B\u0159en\xED e-mailu",verificationMessage:"Pro dokon\u010Den\xED registrace potvr\u010F svou e-mailovou adresu.",welcomeTitle:"V\xEDtej!",registrationSuccess:"Registrace prob\u011Bhla \xFAsp\u011B\u0161n\u011B.",loginSuccessTitle:"V\xEDtej zp\u011Bt",loginSuccess:"P\u0159ihl\xE1\u0161en\xED prob\u011Bhlo \xFAsp\u011B\u0161n\u011B.",verifiedTitle:"Ov\u011B\u0159eno!",verifiedMessage:"Tv\u016Fj e-mail byl \xFAsp\u011B\u0161n\u011B ov\u011B\u0159en. Nyn\xED se m\u016F\u017Ee\u0161 p\u0159ihl\xE1sit.",invalidLink:"Odkaz je neplatn\xFD nebo vypr\u0161el.",expiredLink:"Odkaz pro ov\u011B\u0159en\xED vypr\u0161el. Zkus to znovu."}}static renderAuthModal(e=t.authCopy()){return`
  <div id="auth-modal" class="modal modal--auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" hidden>
    <div class="modal__content auth-modal__content">
        <button type="button" class="modal__close auth-modal__close" aria-label="${e.close}"><svg class="mh-symbol mh-symbol--inline" width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#close"></use></svg></button>
        <h2 id="auth-title" class="auth-modal__title">${e.loginTitle}</h2>
        <form id="login-form">
            <div class="auth-modal__field">
                <label class="auth-modal__label" for="auth-modal-email">E-mail</label>
                <input class="auth-modal__input" id="auth-modal-email" type="email" name="email" required autocomplete="email" inputmode="email">
            </div>
            <div id="password-field-wrapper" class="auth-modal__field auth-modal__field--compact">
                <label class="auth-modal__label" for="auth-modal-password">${e.password}</label>
                <input class="auth-modal__input" id="auth-modal-password" type="password" name="password" required autocomplete="current-password">
                <p id="auth-password-policy" class="auth-modal__help-text" hidden>${e.passwordPolicy}</p>
            </div>
            <div id="confirm-password-field-wrapper" class="auth-modal__field" hidden>
                <label class="auth-modal__label" for="auth-modal-password-confirm">${e.confirmPassword}</label>
                <input class="auth-modal__input" id="auth-modal-password-confirm" type="password" name="confirm_password" autocomplete="new-password">
            </div>
            <div id="forgot-password-link" class="auth-modal__forgot">
                <a href="#" id="auth-forgot-password" class="auth-modal__muted-link">${e.forgotPassword}</a>
            </div>

            <!-- Reset Password Fields (hidden by default) -->
            <div id="reset-password-fields" class="auth-modal__field" hidden>
                <p class="auth-modal__help-text">${e.resetHelp}</p>
            </div>

            <!-- Optional profile fields. Keep birth data clearly explained and non-blocking. -->
            <div id="register-fields" class="auth-modal__field" hidden>
                <div class="auth-modal__field">
                    <label class="auth-modal__label" for="auth-modal-birthdate">${e.birthDate}</label>
                    <input class="auth-modal__input" id="auth-modal-birthdate" type="date" name="birth_date" autocomplete="bday" aria-describedby="birth-date-privacy-note">
                    <p id="birth-date-privacy-note" class="auth-modal__help-text">${e.birthDateNote}</p>
                </div>
            </div>

            <div id="gdpr-consent-wrapper" class="auth-modal__field" hidden>
                <label class="checkbox-label">
                    <input type="checkbox" id="gdpr-consent" name="gdpr_consent">
                <span>${e.consentHtml}</span>
                </label>
            </div>

            <p id="auth-modal-status" class="auth-modal__help-text" role="status" hidden></p>
            <button type="submit" id="auth-submit" class="btn btn--primary auth-modal__submit" data-mode="login">${e.submitLogin}</button>
            <p class="auth-modal__toggle-wrap">
                <a href="#" id="auth-mode-toggle" class="auth-modal__mode-toggle">${e.toggleLogin}</a>
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
        `:""}static escapeHtml(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}}typeof window<"u"&&(window.Templates=t)})();})();
