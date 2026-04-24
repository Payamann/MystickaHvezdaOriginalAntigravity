const a={showCancellationModal(e){const t=document.createElement("div");t.className="retention-modal-overlay",t.innerHTML=`
            <div class="retention-modal">
                <button class="retention-modal__close" onclick="MH_RETENTION.closeCancellationModal()">\xD7</button>

                <h2 class="retention-modal__title">Chceme se zlep\u0161it! \u{1F4AB}</h2>
                <p class="retention-modal__subtitle">Pros\xEDm \u0159ekn\u011Bte n\xE1m, pro\u010D chcete odej\xEDt</p>

                <form id="cancellation-feedback-form" class="retention-form">
                    <!-- Cancellation reason options -->
                    <div class="retention-form__options">
                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="too_expensive" required>
                            <span class="retention-form__label">\u{1F4B0} P\u0159\xEDli\u0161 drah\xE9</span>
                            <span class="retention-form__hint">Nab\xEDdneme v\xE1m slevu</span>
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
                        <button type="button" class="btn btn--secondary" onclick="MH_RETENTION.handleCancellation()">
                            Zru\u0161it
                        </button>
                        <button type="button" class="btn btn--primary" onclick="MH_RETENTION.handleOffer()">
                            Pod\xEDvat se na nab\xEDdky
                        </button>
                    </div>
                </form>

                <!-- Pause subscription offer (appears after selecting reason) -->
                <div id="pause-offer" class="retention-offer" style="display: none;">
                    <h3>\u23F8\uFE0F Pozastavit m\xEDsto zru\u0161en\xED?</h3>
                    <p>Va\u0161e p\u0159edplatn\xE9 bude pozastaveno na <strong>1 m\u011Bs\xEDc zdarma</strong>.</p>
                    <p>Vra\u0165te se, a\u017E v\xE1m budeme chyb\u011Bt \u2014 bez ztr\xE1ty dat.</p>
                    <button class="btn btn--primary" onclick="MH_RETENTION.handlePause()">
                        Pozastavit na m\u011Bs\xEDc
                    </button>
                </div>

                <!-- Discount offer (appears for "too expensive") -->
                <div id="discount-offer" class="retention-offer" style="display: none;">
                    <h3>\u{1F49D} Speci\xE1ln\xED nab\xEDdka</h3>
                    <p>M\xE1me pro v\xE1s <strong>50% slevu</strong> na p\u0159\xED\u0161t\xED 3 m\u011Bs\xEDce.</p>
                    <p class="retention-offer__code">K\xF3d: <code>COMEBACK50</code></p>
                    <button class="btn btn--primary" onclick="MH_RETENTION.handleDiscountAccept()">
                        P\u0159ijmout slevu
                    </button>
                </div>
            </div>
        `,document.body.appendChild(t),this.currentModal=t,document.getElementById("cancellation-feedback-form").addEventListener("change",n=>{const o=n.target.value;this.showRelevantOffer(o)}),trackEvent("churn_prevention_shown",{timestamp:new Date})},showRelevantOffer(e){document.getElementById("pause-offer").style.display="none",document.getElementById("discount-offer").style.display="none",e==="not_using"?(document.getElementById("pause-offer").style.display="block",trackEvent("pause_offer_shown")):e==="too_expensive"&&(document.getElementById("discount-offer").style.display="block",trackEvent("discount_offer_shown"))},async handleCancellation(){const t=document.getElementById("cancellation-feedback-form").querySelector('input[name="reason"]:checked')?.value,n=document.getElementById("cancellation-feedback-text").value;try{(await fetch("/api/retention/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"cancellation",reason:t||"not_provided",feedback:n,timestamp:new Date().toISOString()})})).ok&&trackEvent("churn_confirmed",{reason:t})}catch(o){console.warn("Failed to save churn feedback:",o)}this.closeCancellationModal(),window.onCancellationConfirmed&&window.onCancellationConfirmed()},async handlePause(){try{const e=await fetch("/api/subscription/pause",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pauseDays:30})}),t=await e.json();e.ok?(this.showToast("\u2713 Va\u0161e p\u0159edplatn\xE9 je pozastaveno na 1 m\u011Bs\xEDc!","success"),trackEvent("pause_accepted"),this.closeCancellationModal(),this.sendPauseEmail(),setTimeout(()=>{window.location.href="/profil.html"},2e3)):this.showToast("Chyba: "+(t.error||"Unknown error"),"error")}catch(e){this.showToast("Chyba p\u0159i pozastaven\xED: "+e.message,"error")}},async handleDiscountAccept(){try{(await fetch("/api/subscription/apply-discount",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({couponCode:"COMEBACK50"})})).ok&&(this.showToast("\u2713 Sleva byla aplikov\xE1na! 50% na 3 m\u011Bs\xEDce.","success"),trackEvent("discount_accepted"),this.closeCancellationModal(),this.sendDiscountEmail(),setTimeout(()=>{window.location.reload()},2e3))}catch(e){this.showToast("Chyba p\u0159i aplikov\xE1n\xED slevy: "+e.message,"error")}},handleOffer(){const e=document.querySelector('input[name="reason"]:checked')?.value;if(!e){this.showToast("Pros\xEDm vyberte d\u016Fvod odchodu","info");return}e==="not_using"?this.handlePause():e==="too_expensive"?this.handleDiscountAccept():this.handleCancellation()},closeCancellationModal(){this.currentModal&&(this.currentModal.style.animation="retention-modal-fade-out 0.3s ease-out",setTimeout(()=>{this.currentModal.remove(),this.currentModal=null},300))},showToast(e,t="info"){const n=document.createElement("div");n.className=`retention-toast retention-toast--${t}`,n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.style.animation="retention-toast-fade-out 0.3s ease-out",setTimeout(()=>n.remove(),300)},3e3)},async sendPauseEmail(){try{await fetch("/api/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({template:"subscription_paused",data:{daysUntilResume:30}})})}catch(e){console.warn("Failed to send pause email:",e)}},async sendDiscountEmail(){try{await fetch("/api/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({template:"discount_applied",data:{discount:50,months:3}})})}catch(e){console.warn("Failed to send discount email:",e)}}};window.MH_RETENTION=a;
