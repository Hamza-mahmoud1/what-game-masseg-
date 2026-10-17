/* What Game Masseg — frontend prototype only.
   Real multi-device chat, secure auth, cloud backups and end-to-end encryption
   require a trusted backend and provider configuration. Do not store real passwords here. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const STORE_USERS = "wgm_demo_users_v1";
  const STORE_SESSION = "wgm_demo_session_v1";
  const STORE_CHATS = "wgm_demo_chats_v1";
  const STORE_MESSAGES = "wgm_demo_messages_v1";
  const EXPIRY_MS = 12 * 60 * 60 * 1000;

  const questions = [
    ["حقيقة","إيه أكتر حاجة بتخليك تضحك مهما كان يومك صعب؟"],["تحدي","اكتب مجاملة لطيفة لشخص في الجروب."],
    ["حقيقة","إيه مهارة نفسك تتعلمها؟"],["تحدي","اكتب جملة كاملة من غير حرف الألف."],
    ["حقيقة","إيه أكتر أكلة بتحبها؟"],["تحدي","استخدم 3 إيموجي لوصف يومك."],
    ["حقيقة","إيه مكان نفسك تزوره؟"],["تحدي","اكتب اسم فيلم أو لعبة بالإيموجي."],
    ["حقيقة","إيه أحسن نصيحة سمعتها؟"],["تحدي","اكتب بيت شعر أو جملة من تأليفك."],
    ["حقيقة","لو عندك يوم فاضي تمامًا، هتعمل إيه؟"],["تحدي","قول حقيقة إيجابية عن نفسك."],
    ["حقيقة","إيه لعبة بتحبها وليه؟"],["تحدي","اكتب رسالة شكر لشخص ساعدك."],
    ["حقيقة","إيه أكتر مادة دراسية بتحبها؟"],["تحدي","عدّ من 20 إلى 1 بالعكس في رسالة."],
    ["حقيقة","إيه عادة حلوة نفسك تحافظ عليها؟"],["تحدي","اختر لقبًا مضحكًا لنفسك لمدة الجولة."],
    ["حقيقة","إيه أكتر حاجة بتفتخر إنك اتعلمتها؟"],["تحدي","اكتب قصة من 5 كلمات فقط."],
    ["حقيقة","بتفضل الصبح ولا الليل؟ وليه؟"],["تحدي","صف الجو الحالي بثلاث كلمات."],
    ["حقيقة","مين شخصية خيالية بتحبها؟"],["تحدي","اكتب سؤالًا لطيفًا للشخص اللي بعدك."],
    ["حقيقة","إيه أغرب حلم أو فكرة خيالية عندك؟"],["تحدي","اكتب كلمة صعبة وحاول تشرحها."],
    ["حقيقة","إيه أكتر إنجاز صغير فرحك مؤخرًا؟"],["تحدي","اكتب 3 حاجات ممتن ليها."],
    ["حقيقة","بتفضل الشغل في فريق ولا لوحدك؟"],["تحدي","اكتب جملة من غير استخدام حرف الميم."],
    ["حقيقة","إيه أكتر لون بتحبه؟"],["تحدي","اختر اسمًا لفريق خيالي."],
    ["حقيقة","إيه أكتر حاجة بتساعدك تركز؟"],["تحدي","اكتب وصفًا لنفسك في 4 كلمات."],
    ["حقيقة","لو هتخترع تطبيق، هيعمل إيه؟"],["تحدي","اكتب إعلانًا مضحكًا لقلم."],
    ["حقيقة","إيه أكتر نوع موسيقى بتحبه؟"],["تحدي","اكتب جملة فيها 3 كلمات تبدأ بنفس الحرف."],
    ["حقيقة","إيه موقف خلاك تتعلم حاجة مهمة؟"],["تحدي","اختار إيموجي يمثل شخصيتك واشرحه."],
    ["حقيقة","بتحب البحر ولا الجبل؟"],["تحدي","اكتب نهاية مختلفة لقصة مشهورة."],
    ["حقيقة","إيه أكتر حاجة بتحب تعملها مع أصحابك؟"],["تحدي","اكتب اسم مستخدم خيالي ومميز."],
    ["حقيقة","إيه أكتر صفة بتقدرها في الصديق؟"],["تحدي","اكتب لغزًا بسيطًا للمجموعة."],
    ["حقيقة","إيه أكتر اختراع شايفه مفيد؟"],["تحدي","اكتب جملة تشجيع لشخص بيذاكر."],
    ["حقيقة","إيه كتاب أو قصة أثرت فيك؟"],["تحدي","لخص لعبة بتحبها في سطر."],
    ["حقيقة","لو تتقن لغة جديدة، تختار إيه؟"],["تحدي","اكتب جملة فيها اسم حيوان ومدينة."],
    ["حقيقة","إيه حاجة بسيطة بتحسن مزاجك؟"],["تحدي","اختر عنوانًا لفيلم عن يومك."],
    ["حقيقة","إيه أكتر حاجة نفسك تحققها السنة دي؟"],["تحدي","اكتب رسالة لنفسك بعد سنة."],
    ["حقيقة","إيه أكتر فصل بتحبه؟"],["تحدي","اكتب 5 كلمات مرتبطة بالفضاء."],
    ["حقيقة","بتفضل تخطط ولا ترتجل؟"],["تحدي","اختر تحديًا آمنًا ومضحكًا للجولة."],
    ["حقيقة","إيه أكتر نوع فيديوهات بتتفرج عليه؟"],["تحدي","اكتب تعليقًا إيجابيًا على إنجاز افتراضي."],
    ["حقيقة","إيه صفة تتمنى تطورها في نفسك؟"],["تحدي","اكتب حوارًا من سطرين بين قط وروبوت."],
    ["حقيقة","إيه أكتر وقت بتحس فيه بالراحة؟"],["تحدي","اكتب اسم 3 ألعاب من غير تكرار حرف البداية."],
    ["حقيقة","لو عندك قوة خارقة، تختار إيه؟"],["تحدي","اختر شعارًا مضحكًا للمجموعة."],
    ["حقيقة","إيه أكتر حاجة بتخلي الصداقة قوية؟"],["تحدي","اكتب سؤال معلومات عامة للمجموعة."],
    ["حقيقة","إيه حاجة كنت فاهمها غلط واتعلمت الصح؟"],["تحدي","اكتب وصفًا لوجبة خيالية."],
    ["حقيقة","بتفضل المكالمات ولا الرسائل؟"],["تحدي","اكتب جملة من 6 كلمات بالضبط."],
    ["حقيقة","إيه أكتر مكان بتحب تقعد فيه؟"],["تحدي","اختر اسمًا لفريق أبطال خارقين."],
    ["حقيقة","إيه نصيحة تقدمها لشخص بيتعلم حاجة جديدة؟"],["تحدي","اكتب لغزًا إجابته بسيطة."],
    ["حقيقة","إيه أكتر شيء بتستمتع بصناعته أو رسمه؟"],["تحدي","صف لعبة مشهورة من غير ما تقول اسمها."],
    ["حقيقة","لو تقدر تقابل مخترعًا، مين تختار؟"],["تحدي","اكتب 3 استخدامات خيالية لعلبة كرتون."],
    ["حقيقة","إيه أكتر شيء تتمنى الناس تفهمه عنك؟"],["تحدي","اكتب جملة تبدأ وتنتهي بنفس الكلمة."],
    ["حقيقة","إيه أفضل طريقة عندك لحل الخلاف؟"],["تحدي","اختر سؤالًا محترمًا يفتح نقاشًا."],
    ["حقيقة","إيه حاجة جديدة جربتها وعجبتك؟"],["تحدي","اكتب قصة قصيرة فيها مفتاح ونجمة."],
    ["حقيقة","إيه أكتر شيء يخليك تثق في شخص؟"],["تحدي","اكتب اسمًا مبتكرًا لكوكب خيالي."],
    ["حقيقة","لو عندك قناة، هتقدم محتوى عن إيه؟"],["تحدي","اكتب مقدمة فيديو في سطر واحد."],
    ["حقيقة","إيه أكتر ذكرى لطيفة من المدرسة؟"],["تحدي","اكتب تشبيهًا مضحكًا للإنترنت."],
    ["حقيقة","إيه شيء صغير نفسك تحسنه في يومك؟"],["تحدي","اكتب جملة تحفيزية من عندك."],
    ["حقيقة","إيه أكتر صفة بتساعدك وقت الضغط؟"],["تحدي","اختر اسمًا للروبوت المساعد بتاعك."],
    ["حقيقة","إيه لعبة قديمة لسه بتحبها؟"],["تحدي","اكتب 4 كلمات تصف مغامرة."],
    ["حقيقة","إيه أكتر شيء تتعلمه بسرعة؟"],["تحدي","اختر سؤالًا لطيفًا لشخص جديد."],
    ["حقيقة","لو تقدر تغير قاعدة في لعبة، هتغير إيه؟"],["تحدي","اكتب نهاية سعيدة لقصة من سطرين."],
    ["حقيقة","إيه أكتر شيء بتقدره في عيلتك أو أصحابك؟"],["تحدي","اكتب كلمة جديدة واخترع لها معنى."],
    ["حقيقة","إيه هدف صغير تقدر تبدأ فيه النهارده؟"],["تحدي","اكتب 3 كلمات تبدأ بآخر حرف من اسمك."],
    ["حقيقة","إيه أكثر شيء يثير فضولك؟"],["تحدي","اقترح قاعدة عادلة وممتعة للعبة."],
    ["حقيقة","إيه أفضل مشروع نفسك تنفذه؟"],["تحدي","اكتب عنوانًا جذابًا لقصة خيال علمي."],
    ["حقيقة","إيه أكتر شيء يخلي المحادثة ممتعة؟"],["تحدي","اختم الجولة برسالة إيجابية للجميع."]
  ].slice(0,100);

  let currentUser = null, activeChatId = "truth", chats = [], messages = [];
  const getJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const setJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const safe = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const initials = (name) => (name || "?").trim().slice(0,1).toUpperCase();
  const timeLabel = (time) => new Date(time).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"});
  function showAuth(message="") { $("authView").classList.remove("hidden"); $("appView").classList.add("hidden"); $("authMessage").textContent = message; }
  function showApp() { $("authView").classList.add("hidden"); $("appView").classList.remove("hidden"); }
  function loadUsers(){ return getJSON(STORE_USERS, []); }
  function saveUsers(users){ setJSON(STORE_USERS, users); }
  function seedData(){
    chats = getJSON(STORE_CHATS, null);
    if(!Array.isArray(chats) || !chats.length) {
      chats = [{id:"truth",title:"حقيقة أو تحدي",subtitle:"اللعبة المثبتة • 100 سؤال",type:"game",pinned:true,avatar:"🎯"},{id:"welcome",title:"ملاحظاتك",subtitle:"مساحة تجريبية خاصة بك",type:"self",pinned:false,avatar:"📝"}];
      setJSON(STORE_CHATS,chats);
    }
    messages = getJSON(STORE_MESSAGES, []);
    purgeExpired();
    if(!messages.some(m=>m.chatId==="truth")) {
      messages.push({id:uid(),chatId:"truth",userId:"system",sender:"What Game Masseg",text:"أهلًا بيك! اختار «سؤال عشوائي» عشان تبدأ لعبة حقيقة أو تحدي. دي نسخة تجريبية محلية.",time:Date.now(),system:true});
      saveMessages();
    }
  }
  function saveMessages(){ setJSON(STORE_MESSAGES,messages); }
  function purgeExpired(){
    const now=Date.now(), before=messages.length;
    messages=messages.filter(m=>m.system || (now - Number(m.time||0) < EXPIRY_MS));
    if(messages.length!==before) saveMessages();
  }
  function setSession(user){ currentUser=user; setJSON(STORE_SESSION,{email:user.email}); }
  function loginFromStored(email){
    const user=loadUsers().find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(!user) return false;
    setSession(user); seedData(); startApp(); return true;
  }
  function startApp(){
    showApp();
    $("myDisplayName").textContent=currentUser.displayName;
    $("myUsername").textContent="@"+currentUser.username;
    $("myAvatar").textContent=initials(currentUser.displayName);
    renderChatList(); renderMessages(); updateHeader();
  }
  function switchTab(tab){
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    $("loginForm").classList.toggle("hidden",tab!=="login");
    $("signupForm").classList.toggle("hidden",tab!=="signup");
    $("authMessage").textContent="";
  }
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  $("signupForm").addEventListener("submit",e=>{
    e.preventDefault();
    const displayName=$("displayName").value.trim(), username=$("username").value.trim(), email=$("signupEmail").value.trim(), password=$("signupPassword").value;
    if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){ $("authMessage").textContent="اسم المستخدم لازم يكون من 3 إلى 20 حرفًا إنجليزيًا أو رقمًا أو _."; return; }
    const users=loadUsers();
    if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){ $("authMessage").textContent="اسم المستخدم مستخدم بالفعل على هذا الجهاز. جرّب اسمًا مختلفًا."; return; }
    if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())){ $("authMessage").textContent="البريد الإلكتروني مسجل بالفعل على هذا الجهاز."; return; }
    if(password.length<8){ $("authMessage").textContent="كلمة المرور لازم تكون 8 أحرف على الأقل."; return; }
    // Demo only: passwords are not sent to a server. Do not use real credentials.
    const user={id:uid(),displayName,username,email,createdAt:Date.now()};
    users.push(user); saveUsers(users); setSession(user); seedData(); startApp();
  });
  $("loginForm").addEventListener("submit",e=>{
    e.preventDefault();
    const email=$("loginEmail").value.trim(), password=$("loginPassword").value;
    if(password.length<8){ $("authMessage").textContent="راجع كلمة المرور."; return; }
    // Prototype limitation: authentication is only simulated in this browser.
    if(loginFromStored(email)) return;
    $("authMessage").textContent="الحساب مش موجود على الجهاز ده. أنشئ حسابًا تجريبيًا أو استخدم نفس المتصفح والجهاز.";
  });
  $("googleBtn").addEventListener("click",()=>alert("تسجيل Google الحقيقي غير مفعّل في النسخة التجريبية. يحتاج إعداد Firebase Authentication أو مزوّد OAuth."));
  $("appleBtn").addEventListener("click",()=>alert("تسجيل Apple الحقيقي غير مفعّل. يحتاج إعداد Sign in with Apple وموقعًا موثقًا."));
  $("logoutBtn").addEventListener("click",()=>{localStorage.removeItem(STORE_SESSION);currentUser=null;showAuth("تم تسجيل الخروج من النسخة التجريبية.");});
  function renderChatList(){
    const query=$("searchInput").value.trim().toLowerCase();
    const list=$("chatList"); list.innerHTML="";
    [...chats].filter(c=>(c.title+" "+c.subtitle).toLowerCase().includes(query)).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)).forEach(chat=>{
      const last=[...messages].filter(m=>m.chatId===chat.id).sort((a,b)=>b.time-a.time)[0];
      const button=document.createElement("button"); button.className="chat-item"+(chat.id===activeChatId?" active":"");
      button.innerHTML=`<div class="avatar">${safe(chat.avatar||initials(chat.title))}</div><div class="chat-meta"><strong>${chat.pinned?"📌 ":""}${safe(chat.title)}</strong><span>${safe(last?last.text:chat.subtitle)}</span></div><span class="chat-time">${last?timeLabel(last.time):""}</span>`;
      button.addEventListener("click",()=>{activeChatId=chat.id;renderChatList();renderMessages();updateHeader();});
      list.appendChild(button);
    });
  }
  function updateHeader(){
    const chat=chats.find(c=>c.id===activeChatId)||chats[0]; if(!chat)return;
    $("activeTitle").textContent=chat.title; $("activeSubtitle").textContent=chat.subtitle||("محادثة باسم المستخدم");
    $("activeAvatar").textContent=chat.avatar||initials(chat.title);
    $("gameBar").classList.toggle("hidden",chat.id!=="truth");
  }
  function renderMessages(){
    purgeExpired();
    const box=$("messages"); box.innerHTML="";
    const selected=messages.filter(m=>m.chatId===activeChatId).sort((a,b)=>a.time-b.time);
    if(!selected.length){const empty=document.createElement("div");empty.className="system-message";empty.textContent="لسه مفيش رسائل هنا. ابدأ المحادثة برسالة لطيفة.";box.appendChild(empty);}
    selected.forEach(m=>{
      if(m.system){const sys=document.createElement("div");sys.className="system-message";sys.textContent=m.text;box.appendChild(sys);return;}
      const mine=m.userId===currentUser?.id;
      const row=document.createElement("div");row.className="message-row"+(mine?" mine":"");
      const bubble=document.createElement("div");bubble.className="bubble";
      bubble.innerHTML=`${!mine?`<div class="sender">${safe(m.sender||"مستخدم")}</div>`:""}<div>${safe(m.text)}</div><div class="timestamp">${timeLabel(m.time)}${mine?" • ✓":""}</div>`;
      row.appendChild(bubble);box.appendChild(row);
    });
    box.scrollTop=box.scrollHeight;
  }
  function addMessage(text,extra={}){
    const message={id:uid(),chatId:activeChatId,userId:currentUser.id,sender:currentUser.displayName,username:currentUser.username,text:String(text).slice(0,2000),time:Date.now(),...extra};
    messages.push(message);saveMessages();renderMessages();renderChatList();
  }
  $("messageForm").addEventListener("submit",e=>{
    e.preventDefault();const text=$("messageInput").value.trim();if(!text)return;
    addMessage(text);$("messageInput").value="";
  });
  $("randomQuestionBtn").addEventListener("click",()=>{
    const q=questions[Math.floor(Math.random()*questions.length)];
    addMessage(`🎲 ${q[0]}: ${q[1]}`,{kind:"truth-or-dare"});
  });
  $("showGameBtn").addEventListener("click",()=>{
    activeChatId="truth";renderChatList();renderMessages();updateHeader();
  });
  $("clearChatBtn").addEventListener("click",()=>{
    if(!confirm("تمسح رسائل المحادثة دي من التخزين المحلي على الجهاز؟"))return;
    messages=messages.filter(m=>m.chatId!==activeChatId||m.system);saveMessages();renderMessages();renderChatList();
  });
  $("searchInput").addEventListener("input",renderChatList);
  $("emojiBtn").addEventListener("click",()=>{$("messageInput").value += " 😊";$("messageInput").focus();});
  const dialog=$("promptDialog");let dialogMode="chat";
  function openCreate(mode){
    dialogMode=mode;$("dialogInput").value="";$("dialogMessage").textContent="";
    $("dialogTitle").textContent=mode==="group"?"إنشاء مجموعة":"محادثة جديدة";
    $("dialogHelp").textContent=mode==="group"?"اكتب اسم المجموعة.":"اكتب اسم المستخدم الذي تريد بدء محادثة معه.";
    $("dialogLabel").firstChild.textContent=mode==="group"?"اسم المجموعة":"اسم المستخدم";
    $("dialogInput").placeholder=mode==="group"?"أصدقاء الجيمرز":"username";
    $("dialog").showModal();
  }
  $("newChatBtn").addEventListener("click",()=>openCreate("chat"));
  $("newGroupBtn").addEventListener("click",()=>openCreate("group"));
  $("dialogConfirm").addEventListener("click",e=>{
    e.preventDefault();const value=$("dialogInput").value.trim();if(!value){$("dialogMessage").textContent="اكتب قيمة الأول.";return;}
    let chat;
    if(dialogMode==="group"){
      chat={id:"g_"+uid(),title:value,subtitle:"مجموعة تجريبية • أعضاء باسم المستخدم",type:"group",avatar:"👥",pinned:false};
    }else{
      const username=value.replace(/^@/,"");
      if(username.toLowerCase()===currentUser.username.toLowerCase()){$("dialogMessage").textContent="ده اسم المستخدم بتاعك بالفعل.";return;}
      chat=chats.find(c=>c.type==="direct"&&c.username?.toLowerCase()===username.toLowerCase());
      if(chat){activeChatId=chat.id;dialog.close();renderChatList();renderMessages();updateHeader();return;}
      chat={id:"d_"+uid(),title:"@"+username,subtitle:"محادثة تجريبية • ليست متصلة بمستخدم آخر",type:"direct",username,avatar:initials(username),pinned:false};
    }
    chats.push(chat);setJSON(STORE_CHATS,chats);activeChatId=chat.id;dialog.close();renderChatList();renderMessages();updateHeader();
    addMessage(dialogMode==="group"?"تم إنشاء المجموعة محليًا. إضافة أعضاء حقيقيين تحتاج خادمًا.":"تم إنشاء نافذة محادثة محلية. لن تصل الرسائل لمستخدم آخر بدون خادم.",{system:true});
  });
  window.addEventListener("storage",()=>{messages=getJSON(STORE_MESSAGES,[]);chats=getJSON(STORE_CHATS,chats);renderChatList();renderMessages();});
  const session=getJSON(STORE_SESSION,null);
  if(session?.email && loginFromStored(session.email)) return;
  showAuth();
})();