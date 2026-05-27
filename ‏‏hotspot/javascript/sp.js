(function(){
function waitForSpeeds(callback) {
    if (window.speedsLoaded) {
        callback();
    } else {
        window.addEventListener('speedsConfigLoaded', callback, { once: true });
    }
}

document.addEventListener("DOMContentLoaded",function(){
    waitForSpeeds(function() {
        const a=document.getElementById("speed"),b=document.getElementById("speed2"),c=document.getElementById("reconnect-btn"),d=document.getElementById("optionsModal"),e=document.getElementById("username"),f=document.getElementById("recent-cards-list");
        
        // فحص وجود العناصر الأساسية
        if(!a || !b) {
            console.warn('عناصر السرعة غير موجودة');
            return;
        }
        
        a.addEventListener("change",function(){const v=a.value;document.cookie="domain="+encodeURIComponent(v)+"; path=/";document.cookie="speed="+encodeURIComponent(v)+"; path=/"});
        
        var editBtn = document.getElementById("edit");
        if(editBtn) {
            editBtn.addEventListener("click",function(){
                const settings = window.speedSettings || {};
                const isLoggedIn = typeof loggedIn !== 'undefined' && loggedIn === true;
                
                if(!settings.disableSpeedSelection && (isLoggedIn || settings.forceSpeed)) {
                    b.classList.remove("hidden");
                    b.style.display="block";
                }
                if(c) c.classList.remove("hidden");
                if(d) d.style.display="block";
            });
        }
        
        if(c) {
            c.addEventListener("click",function(){if(d) d.style.display="none"});
            c.addEventListener("click",function(){if(!window.animating){window.animating=true;if(typeof userLogout==='function')userLogout();setTimeout(function(){if(typeof onLoginSubmitted==='function')onLoginSubmitted();const msg=document.getElementById("status-message");if(msg)msg.classList.remove("hidden");setTimeout(function(){if(msg)msg.classList.add("hidden");window.animating=false},3000)},2000)}});
        }
        
        document.querySelectorAll(".app-logout").forEach(btn=>{btn.addEventListener("click",()=>{if(e)e.value=""})});
        
        const g=a,h=b;
        for(let option of g.options){
            const cloned=option.cloneNode(true);
            cloned.setAttribute("data-id",option.id||"");
            if(option.id)cloned.id="cloned_"+option.id;
            cloned.style.cssText=option.style.cssText;
            cloned.className=option.className;
            h.appendChild(cloned);
        }
        
        h.addEventListener("change",function(){
            const selected=h.options[h.selectedIndex],dataId=selected.getAttribute("data-id");
            for(let opt of g.options){
                if(opt.id===dataId||opt.value.startsWith(selected.value)){
                    g.value=opt.value;
                    opt.style.cssText=selected.style.cssText;
                    g.dispatchEvent(new Event("change",{bubbles:true}));
                    break;
                }
            }
        });
        
        const observer=new MutationObserver(mutations=>{
            for(let mutation of mutations){
                if(mutation.type==="attributes"&&mutation.attributeName==="style"){
                    const changed=mutation.target,id=changed.id;
                    for(let opt of h.options){
                        if(opt.getAttribute("data-id")===id){
                            opt.style.cssText=changed.style.cssText;
                            break;
                        }
                    }
                }
            }
        });
        g.querySelectorAll("option").forEach(option=>{observer.observe(option,{attributes:true,attributeFilter:["style"]})});
        
        function getCookie(name){const match=document.cookie.match(new RegExp("(^| )"+name+"=([^;]+)"));return match?decodeURIComponent(match[2]):null}
        
        // استخراج اسم السرعة من قيمة الدومين
        function getSpeedName(domainValue){
            if(!domainValue || !a) return "";
            for(let opt of a.options){
                if(opt.value===domainValue) return opt.textContent.trim();
            }
            // محاولة مطابقة جزئية
            const parts=domainValue.split("|");
            if(parts.length>=2){
                const speedPart=parts[0]+"K/"+parts[1];
                for(let opt of a.options){
                    if(opt.value.includes(speedPart)) return opt.textContent.trim();
                }
            }
            return "";
        }
        
        function loadRecentCards(){
            if(!f) return;
            const cards=JSON.parse(getCookie("recentCards")||"[]");
            f.innerHTML='<option disabled selected>اختر كرت سابق</option>';
            cards.forEach(cardData=>{
                const opt=document.createElement("option");
                const cardUsername=typeof cardData==="string"?cardData:cardData.username;
                opt.value=cardUsername;
                // عرض اسم الكرت مع السرعة إن وجدت
                let displayText=cardUsername;
                if(typeof cardData==="object"&&cardData.domain){
                    const speedName=getSpeedName(cardData.domain);
                    if(speedName) displayText=cardUsername+" ("+speedName+")";
                    opt.setAttribute("data-domain",cardData.domain);
                }
                opt.textContent=displayText;
                if(typeof cardData==="object"&&cardData.password){
                    opt.setAttribute("data-password",cardData.password);
                }
                f.appendChild(opt);
            });
        }
        
        function saveCard(card,password,domain){
            if(!card.trim())return;
            password=password||"";
            domain=domain||"";
            let cards=JSON.parse(getCookie("recentCards")||"[]");
            // البحث عن كرت موجود بنفس الاسم
            const existingIndex=cards.findIndex(c=>{const username=typeof c==="string"?c:c.username;return username===card});
            // إذا موجود ونفس البيانات، نقله للأعلى فقط
            if(existingIndex!==-1){
                const existing=cards[existingIndex];
                const existingPass=typeof existing==="object"?existing.password||"":"";
                const existingDomain=typeof existing==="object"?existing.domain||"":"";
                if(existingPass===password&&existingDomain===domain){
                    // نقله للأعلى فقط
                    cards.splice(existingIndex,1);
                    cards.unshift({username:card,password:password,domain:domain});
                    document.cookie="recentCards="+encodeURIComponent(JSON.stringify(cards))+"; path=/; max-age=31536000";
                    loadRecentCards();
                    return;
                }
            }
            // حذف القديم إن وجد
            cards=cards.filter(c=>{const username=typeof c==="string"?c:c.username;return username!==card});
            const cardData={username:card,password:password,domain:domain};
            cards.unshift(cardData);
            if(cards.length>5)cards=cards.slice(0,5);
            document.cookie="recentCards="+encodeURIComponent(JSON.stringify(cards))+"; path=/; max-age=31536000";
            loadRecentCards();
        }
        
        // مراقبة الكتابة في حقلي اسم المستخدم وكلمة السر
        let isTypedManually=false;
        let isPasswordTyped=false;
        if(e) e.addEventListener("input",()=>{isTypedManually=true});
        
        // مراقبة حقل كلمة السر أيضاً
        const pwdField=document.login?document.login.querySelector("input[password-field]"):null;
        if(pwdField && pwdField!==e) pwdField.addEventListener("input",()=>{isPasswordTyped=true});
        
        if(f) {
            f.addEventListener("change",function(){
                if(this.value && e){
                    e.value=this.value;
                    const selectedOption=this.options[this.selectedIndex];
                    const savedPassword=selectedOption.getAttribute("data-password");
                    const savedDomain=selectedOption.getAttribute("data-domain");
                    const passwordField=document.login?document.login.querySelector("input[password-field]"):null;
                    if(passwordField&&savedPassword&&passwordField!==e){passwordField.value=savedPassword}
                    // استعادة الدومين/السرعة المحفوظة
                    if(savedDomain&&a){
                        // البحث عن السرعة المطابقة
                        for(let opt of a.options){
                            if(opt.value===savedDomain){
                                a.value=savedDomain;
                                a.dispatchEvent(new Event("change",{bubbles:true}));
                                break;
                            }
                        }
                    }
                    isTypedManually=false;
                    isPasswordTyped=false;
                }
            });
        }
        
        let lastCardSaved=null;
        let lastPassSaved=null;
        let lastDomainSaved=null;
        setInterval(()=>{
            if(typeof loggedIn!=="undefined"&&loggedIn===true&&e){
                const currentCard=e.value.trim();
                // تحديد حقل كلمة السر بشكل صحيح حسب نوع الدخول
                const passwordField=document.login?document.login.querySelector("input[password-field]"):null;
                let currentPassword="";
                if(passwordField){
                    // في حالة passwordAsUser، حقل الباسورد هو نفس حقل اليوزر
                    currentPassword=(passwordField===e)?currentCard:passwordField.value.trim();
                }
                // الحصول على الدومين الحالي
                const currentDomain=a?a.value:"";
                // حفظ إذا تم الكتابة يدوياً (في اليوزر أو الباسورد) وهناك تغيير
                const hasChange=(currentCard&&currentCard!==lastCardSaved)||(currentPassword!==lastPassSaved)||(currentDomain!==lastDomainSaved);
                if(currentCard&&(isTypedManually||isPasswordTyped)&&hasChange){
                    saveCard(currentCard,currentPassword,currentDomain);
                    lastCardSaved=currentCard;
                    lastPassSaved=currentPassword;
                    lastDomainSaved=currentDomain;
                    isTypedManually=false;
                    isPasswordTyped=false;
                }
            }
        },1000);
        
        loadRecentCards();
    });
});
})();
