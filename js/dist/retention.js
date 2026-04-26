(()=>{async function o(e,t){const n=window.getCSRFToken?await window.getCSRFToken():null;return fetch(e,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...n&&{"X-CSRF-Token":n}},body:JSON.stringify(t)})}const s={showCancellationModal(e){this.onConfirm=typeof e=="function"?e:null;const t=document.createElement("div");t.className="retention-modal-overlay",t.innerHTML=`
            <div class="retention-modal">
                <button class="retention-modal__close" type="button" data-retention-action="close">\xD7</button>

                <h2 class="retention-modal__title">Chceme se zlep\u0161it! \u{1F4AB}</h2>
                <p class="retention-modal__subtitle">Pros\xEDm \u0159ekn\u011Bte n\xE1m, pro\u010D chcete odej\xEDt</p>

                <form id="cancellation-feedback-form" class="retention-form">
                    <!-- Cancellation reason options -->
                    <div class="retention-form__options">
                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="too_expensive" required>
                            <span class="retention-form__label">\u{1F4B0} P\u0159\xEDli\u0161 drah\xE9</span>
                            <span class="retention-form__hint">Nab\xEDdneme \xFAsporn\u011Bj\u0161\xED variantu</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="not_using">
                            <span class="retention-form__label">\u{1F634} Nepou\u017E\xEDv\xE1m</span>
                            <span class="retention-form__hint">Pozastavte na m\u011Bs\xEDc zdarma</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="found_better">
                            <span class="retention-form__label">\u{1F50D} M\xE1m lep\u0161\xED alternativu</span>
                            <span class="retention-form__hint">Kterou aplikaci?</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="personal">
                            <span class="retention-form__label">\u{1F937} Osobn\xED d\u016Fvody</span>
                            <span class="retention-form__hint">M\u016F\u017Eete se vr\xE1tit pozd\u011Bji</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="other">
                            <span class="retention-form__label">\u2753 Jin\xE9</span>
                            <span class="retention-form__hint">M\u016F\u017Eete napsat v\xEDce</span>
                        </label>
                    </div>

                    <!-- Optional feedback text -->
                    <textarea
                        id="cancellation-feedback-text"
                        class="retention-form__textarea"
                        placeholder="Ostatn\xED informace (voliteln\xE9)..."
                        rows="3"
                    ></textarea>

                    <!-- Action buttons -->
                    <div class="retention-form__actions">
                        <button type="button" class="btn btn--secondary" data-retention-action="cancel">
                            Zru\u0161it
                        </button>
                        <button type="button" class="btn btn--primary" data-retention-action="offer">
                            Pod\xEDvat se na nab\xEDdky
                        </button>
                    </div>
                </form>

                <!-- Pause subscription offer (appears after selecting reason) -->
                <div id="pause-offer" class="retention-offer" hidden>
                    <h3>\u23F8\uFE0F Pozastavit m\xEDsto zru\u0161en\xED?</h3>
                    <p>Va\u0161e p\u0159edplatn\xE9 bude pozastaveno na <strong>1 m\u011Bs\xEDc zdarma</strong>.</p>
                    <p>Vra\u0165te se, a\u017E v\xE1m budeme chyb\u011Bt \u2014 bez ztr\xE1ty dat.</p>
                    <button class="btn btn--primary" type="button" data-retention-action="pause">
                        Pozastavit na m\u011Bs\xEDc
                    </button>
                </div>

                <!-- Discount offer (appears for "too expensive") -->
                <div id="discount-offer" class="retention-offer" hidden>
                    <h3>\u{1F49D} Speci\xE1ln\xED nab\xEDdka</h3>
                    <p>M\xE1me pro v\xE1s <strong>25% slevu</strong> na p\u0159\xED\u0161t\xED 3 m\u011Bs\xEDce.</p>
                    <p class="retention-offer__code">K\xF3d: <code>STAY25</code></p>
                    <button class="btn btn--primary" type="button" data-retention-action="discount">
                        P\u0159ijmout slevu
                    </button>
                </div>
            </div>
        `,document.body.appendChild(t),this.currentModal=t,t.addEventListener("click",n=>{const a=n.target.closest("[data-retention-action]")?.dataset.retentionAction;if(!a)return;({close:()=>this.closeCancellationModal(),cancel:()=>this.handleCancellation(),offer:()=>this.handleOffer(),pause:()=>this.handlePause(),discount:()=>this.handleDiscountAccept()})[a]?.()}),document.getElementById("cancellation-feedback-form").addEventListener("change",n=>{const a=n.target.value;this.showRelevantOffer(a)}),trackEvent("churn_prevention_shown",{timestamp:new Date})},showRelevantOffer(e){document.getElementById("pause-offer").hidden=!0,document.getElementById("discount-offer").hidden=!0,e==="not_using"?(document.getElementById("pause-offer").hidden=!1,trackEvent("pause_offer_shown")):e==="too_expensive"&&(document.getElementById("discount-offer").hidden=!1,trackEvent("discount_offer_shown"))},async handleCancellation(){const t=document.getElementById("cancellation-feedback-form").querySelector('input[name="reason"]:checked')?.value,n=document.getElementById("cancellation-feedback-text").value;try{(await o("/api/payment/retention/feedback",{type:"churn",reason:t||"not_provided",feedback:n,timestamp:new Date().toISOString()})).ok&&trackEvent("churn_confirmed",{reason:t})}catch(a){console.warn("Failed to save churn feedback:",a)}this.closeCancellationModal(),this.onConfirm?.(),this.onConfirm=null},async handlePause(){try{const e=await o("/api/payment/subscription/pause",{pauseDays:30}),t=await e.json();e.ok?(this.showToast("\u2713 Va\u0161e p\u0159edplatn\xE9 je pozastaveno na 1 m\u011Bs\xEDc!","success"),trackEvent("pause_accepted"),this.closeCancellationModal(),this.sendPauseEmail(),setTimeout(()=>{window.location.href="/profil.html"},2e3)):this.showToast("Chyba: "+(t.error||"Unknown error"),"error")}catch(e){this.showToast("Chyba p\u0159i pozastaven\xED: "+e.message,"error")}},async handleDiscountAccept(){try{(await o("/api/payment/subscription/apply-discount",{couponCode:"STAY25"})).ok&&(this.showToast("\u2713 Sleva byla aplikov\xE1na! 25% na 3 m\u011Bs\xEDce.","success"),trackEvent("discount_accepted"),this.closeCancellationModal(),this.sendDiscountEmail(),setTimeout(()=>{window.location.reload()},2e3))}catch(e){this.showToast("Chyba p\u0159i aplikov\xE1n\xED slevy: "+e.message,"error")}},handleOffer(){const e=document.querySelector('input[name="reason"]:checked')?.value;if(!e){this.showToast("Pros\xEDm vyberte d\u016Fvod odchodu","info");return}e==="not_using"?this.handlePause():e==="too_expensive"?this.handleDiscountAccept():this.handleCancellation()},closeCancellationModal(){this.currentModal&&(this.currentModal.classList.add("retention-modal-overlay--closing"),setTimeout(()=>{this.currentModal.remove(),this.currentModal=null},300))},showToast(e,t="info"){const n=document.createElement("div");n.className=`retention-toast retention-toast--${t}`,n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("retention-toast--closing"),setTimeout(()=>n.remove(),300)},3e3)},async sendPauseEmail(){try{await o("/api/payment/email/send",{template:"subscription_paused",data:{daysUntilResume:30}})}catch(e){console.warn("Failed to send pause email:",e)}},async sendDiscountEmail(){try{await o("/api/payment/email/send",{template:"discount_applied",data:{discount:25,months:3}})}catch(e){console.warn("Failed to send discount email:",e)}}};window.MH_RETENTION=s;})();
