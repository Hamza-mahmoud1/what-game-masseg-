"use strict";

/* =========================================================
   WHAT GAME MASSEG
   Front-end demonstration application

   IMPORTANT:
   This version uses browser-local storage.
   It is NOT a production authentication or messaging server.

   Real multi-user messaging, OAuth, email verification,
   cloud backup and end-to-end encryption require a backend.
========================================================= */


/* =========================================================
   1. Configuration
========================================================= */

const CONFIG = Object.freeze({
    appName: "WHAT GAME MASSEG",

    storageKeys: {
        users: "wgm_demo_users_v1",
        session: "wgm_demo_session_v1",
        chats: "wgm_demo_chats_v1",
        settings: "wgm_demo_settings_v1"
    },

    messageLifetimeMs: 12 * 60 * 60 * 1000,

    maxMessageLength: 4000,

    minUsernameLength: 3,
    maxUsernameLength: 20,

    minPasswordLength: 8,

    maxGroupMembers: 100,

    maxChats: 500
});


/* =========================================================
   2. DOM helpers
========================================================= */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));


const DOM = {
    loadingScreen: $("#loadingScreen"),
    authScreen: $("#authScreen"),
    appScreen: $("#appScreen"),

    loginForm: $("#loginForm"),
    registerForm: $("#registerForm"),

    showLoginTab: $("#showLoginTab"),
    showRegisterTab: $("#showRegisterTab"),

    loginEmail: $("#loginEmail"),
    loginPassword: $("#loginPassword"),

    registerName: $("#registerName"),
    registerUsername: $("#registerUsername"),
    registerEmail: $("#registerEmail"),
    registerPassword: $("#registerPassword"),
    confirmPassword: $("#confirmPassword"),
    acceptTerms: $("#acceptTerms"),

    forgotPasswordButton: $("#forgotPasswordButton"),
    googleLoginButton: $("#googleLoginButton"),
    appleLoginButton: $("#appleLoginButton"),

    currentUserAvatar: $("#currentUserAvatar"),
    currentUserName: $("#currentUserName"),
    currentUsername: $("#currentUsername"),

    logoutButton: $("#logoutButton"),
    openProfileButton: $("#openProfileButton"),

    searchChats: $("#searchChats"),
    clearSearch: $("#clearSearch"),

    newChatButton: $("#newChatButton"),
    newGroupButton: $("#newGroupButton"),
    welcomeNewChat: $("#welcomeNewChat"),

    chatList: $("#chatList"),
    chatCount: $("#chatCount"),

    activeChatAvatar: $("#activeChatAvatar"),
    activeChatTitle: $("#activeChatTitle"),
    activeChatSubtitle: $("#activeChatSubtitle"),

    messagesArea: $("#messagesArea"),
    welcomePanel: $("#welcomePanel"),
    messagesList: $("#messagesList"),

    messageForm: $("#messageForm"),
    messageInput: $("#messageInput"),
    sendMessageButton: $("#sendMessageButton"),

    expirationBanner: $("#expirationBanner"),
    expirationText: $("#expirationText"),

    truthButton: $("#truthButton"),
    truthPanel: $("#truthPanel"),
    closeTruthPanel: $("#closeTruthPanel"),
    truthModeButton: $("#truthModeButton"),
    dareModeButton: $("#dareModeButton"),
    questionNumber: $("#questionNumber"),
    questionText: $("#questionText"),
    nextQuestionButton: $("#nextQuestionButton"),
    sendQuestionButton: $("#sendQuestionButton"),

    pinChatButton: $("#pinChatButton"),
    chatInfoButton: $("#chatInfoButton"),

    detailsPanel: $("#detailsPanel"),
    closeDetailsButton: $("#closeDetailsButton"),
    detailsAvatar: $("#detailsAvatar"),
    detailsTitle: $("#detailsTitle"),
    detailsSubtitle: $("#detailsSubtitle"),
    detailsMessageCount: $("#detailsMessageCount"),
    detailsType: $("#detailsType"),
    detailsPinned: $("#detailsPinned"),
    detailsPinButton: $("#detailsPinButton"),
    exportBackupButton: $("#exportBackupButton"),
    deleteChatButton: $("#deleteChatButton"),

    mobileBackButton: $("#mobileBackButton"),

    modalBackdrop: $("#modalBackdrop"),
    modalTitle: $("#modalTitle"),
    modalBody: $("#modalBody"),
    closeModalButton: $("#closeModalButton"),

    toastContainer: $("#toastContainer"),
    composerNotice: $("#composerNotice")
};


/* =========================================================
   3. Application state
========================================================= */

const state = {
    currentUser: null,

    chats: [],
    users: [],

    activeChatId: null,

    activeFilter: "all",

    truthMode: "truth",
    currentQuestion: null,

    lastQuestionIndexes: {
        truth: -1,
        dare: -1
    },

    lastFocusElement: null
};


/* =========================================================
   4. Storage helpers
========================================================= */

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}


function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Storage write error:", error);

        showToast(
            "مساحة التخزين المحلية غير كافية أو غير متاحة.",
            "error"
        );

        return false;
    }
}


function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Storage removal error:", error);
    }
}


function getUsers() {
    return readJSON(CONFIG.storageKeys.users, []);
}


function saveUsers(users) {
    return writeJSON(CONFIG.storageKeys.users, users);
}


function getChatsFromStorage() {
    return readJSON(CONFIG.storageKeys.chats, []);
}


function saveChats() {
    return writeJSON(CONFIG.storageKeys.chats, state.chats);
}


function getSession() {
    return readJSON(CONFIG.storageKeys.session, null);
}


function saveSession(userId) {
    return writeJSON(
        CONFIG.storageKeys.session,
        {
            userId,
            createdAt: Date.now()
        }
    );
}


function clearSession() {
    removeStorage(CONFIG.storageKeys.session);
}


/* =========================================================
   5. General utilities
========================================================= */

function makeId(prefix = "id") {
    if (
        globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === "function"
    ) {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 12)
    );
}


function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}


function normalizeUsername(username) {
    return String(username || "")
        .trim()
        .replace(/^@+/, "")
        .toLowerCase();
}


function normalizeDisplayName(name) {
    return String(name || "")
        .trim()
        .replace(/\s+/g, " ");
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitial(name) {
    const cleanName = String(name || "").trim();

    if (!cleanName) {
        return "?";
    }

    return Array.from(cleanName)[0].toUpperCase();
}


function randomItem(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return null;
    }

    return array[Math.floor(Math.random() * array.length)];
}


function formatTime(timestamp) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("ar-EG", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}


function formatDate(timestamp) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
}


function formatRemainingTime(milliseconds) {
    const safe = Math.max(0, milliseconds);

    const totalMinutes = Math.floor(
        safe / (60 * 1000)
    );

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    return `${hours} ساعة و${minutes} دقيقة`;
}


function sortByNewest(items, property = "updatedAt") {
    return [...items].sort((a, b) => {
        return (
            Number(b[property] || 0) -
            Number(a[property] || 0)
        );
    });
}


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function isValidUsername(username) {
    return (
        username.length >= CONFIG.minUsernameLength &&
        username.length <= CONFIG.maxUsernameLength &&
        /^[a-zA-Z0-9_]+$/.test(username)
    );
}


function isValidDisplayName(name) {
    return (
        name.length >= 2 &&
        name.length <= 40
    );
}


function isValidPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= CONFIG.minPasswordLength &&
        password.length <= 128
    );
}


/* =========================================================
   6. Toast notifications
========================================================= */

function showToast(message, type = "info", duration = 3200) {
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    const icon = document.createElement("span");

    icon.textContent =
        type === "success" ? "✓" :
        type === "error" ? "!" :
        "ℹ";

    const text = document.createElement("span");

    text.textContent = String(message);

    toast.append(icon, text);

    DOM.toastContainer.appendChild(toast);

    window.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(10px)";

        window.setTimeout(() => toast.remove(), 200);
    }, duration);
}


/* =========================================================
   7. Password hashing for local demonstration only
========================================================= */

/*
   This hashes passwords before storing them locally.

   It does NOT turn localStorage into secure authentication.
   Production authentication should be handled by a trusted
   authentication provider or server.
*/

async function hashPassword(password) {
    if (
        !globalThis.crypto ||
        !globalThis.crypto.subtle ||
        !globalThis.isSecureContext
    ) {
        throw new Error(
            "secure_context_required"
        );
    }

    const encoder = new TextEncoder();

    const bytes = encoder.encode(password);

    const digest = await crypto.subtle.digest(
        "SHA-256",
        bytes
    );

    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


function constantTimeStringEqual(a, b) {
    const left = String(a || "");
    const right = String(b || "");

    if (left.length !== right.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < left.length; i++) {
        difference |=
            left.charCodeAt(i) ^
            right.charCodeAt(i);
    }

    return difference === 0;
}


/* =========================================================
   8. Truth or dare questions
   50 truth questions + 50 safe challenges
========================================================= */

const QUESTIONS = Object.freeze({

    truth: [

        "إيه أكتر حاجة بتفرحك في يومك؟",

        "مين أكتر شخص بتثق فيه؟",

        "إيه أكتر موقف مضحك حصلك في المدرسة؟",

        "إيه الحاجة اللي نفسك تتعلمها؟",

        "إيه أكتر لعبة بتحب تلعبها؟",

        "لو تقدر تسافر أي بلد، هتختار إيه؟",

        "إيه أكتر أكلة بتحبها؟",

        "إيه أفضل ذكرى عندك من السنة اللي فاتت؟",

        "إيه أكتر صفة بتحبها في أصحابك؟",

        "لو تقدر تغير عادة واحدة عندك، هتغير إيه؟",

        "إيه أكتر فيلم أو مسلسل بتحبه؟",

        "إيه أكتر مادة دراسية بتحبها؟",

        "إيه المهارة اللي نفسك تتقنها؟",

        "إيه أكتر موقف خلاك تضحك جامد؟",

        "لو عندك يوم إجازة كامل، هتعمل إيه؟",

        "إيه أكتر حاجة بتساعدك تركز؟",

        "مين الشخصية الخيالية المفضلة عندك؟",

        "إيه أكتر حاجة بتفتخر إنك عملتها؟",

        "إيه نوع الموسيقى اللي بتحبه؟",

        "إيه أكتر لعبة لعبتها مع أصحابك؟",

        "إيه الحاجة اللي نفسك تجربها لأول مرة؟",

        "لو فتحت مشروع صغير، هيكون إيه؟",

        "إيه أفضل نصيحة حد قالهالك؟",

        "إيه أكتر حاجة بتحبها في الإجازة؟",

        "إيه أكتر تطبيق بتستخدمه؟",

        "لو تقدر تقابل شخصية مشهورة، تختار مين؟",

        "إيه الحاجة اللي بتخليك تحس بالإنجاز؟",

        "إيه أكتر رياضة بتحب تتفرج عليها؟",

        "إيه أكتر لون بتحبه؟",

        "إيه الحيوان اللي نفسك تربيه؟",

        "إيه أكتر حاجة بتحب تعملها مع أصحابك؟",

        "إيه أفضل هدية ممكن تفرحك؟",

        "إيه أكتر مكان بتحب تروحه؟",

        "لو هتختار قوة خارقة خيالية، هتختار إيه؟",

        "إيه أكتر حاجة نفسك تحققها السنة دي؟",

        "إيه صفة كويسة نفسك تطورها في نفسك؟",

        "إيه أكتر موقف علمك درس مهم؟",

        "إيه لعبتك المفضلة على الموبايل؟",

        "لو هتعيش في عالم لعبة، هتختار أنهي لعبة؟",

        "إيه أكتر حاجة بتساعدك لما تكون متضايق؟",

        "إيه أكتر وقت في اليوم بتحبه؟",

        "إيه أكتر مشروب بتحبه؟",

        "إيه نوع الفيديوهات اللي بتحب تتفرج عليها؟",

        "إيه حاجة بسيطة بتخلي يومك أحسن؟",

        "لو هتكتب كتاب، هتتكلم فيه عن إيه؟",

        "إيه أكتر اختراع شايف إنه مفيد؟",

        "إيه حاجة جديدة اتعلمتها مؤخرًا؟",

        "إيه أكتر صفة بتقدرها في أي شخص؟",

        "إيه المكان اللي نفسك تزوره مع أصحابك؟",

        "إيه الإنجاز الصغير اللي فرحك مؤخرًا؟"

    ],

    dare: [

        "قول نكتة خفيفة في الشات.",

        "اكتب 3 حاجات بتحبها في يومك.",

        "ابعت إيموجي بيوصف مزاجك دلوقتي.",

        "اكتب اسم لعبة بتحبها باستخدام الإيموجي فقط.",

        "اكتب جملة إيجابية تشجع بيها أصحابك.",

        "احكي موقف مضحك في 3 جمل.",

        "اكتب اسم فيلم باستخدام 3 إيموجي.",

        "قول معلومة مفيدة اتعلمتها مؤخرًا.",

        "اكتب 5 كلمات تبدأ بنفس الحرف.",

        "اكتب جملة من غير استخدام حرف الألف.",

        "اختار لاعبًا في الجروب وامدح مهارة عنده.",

        "اكتب اسم أكلك المفضل من غير ما تسميه مباشرة.",

        "صف لعبتك المفضلة في 5 كلمات.",

        "اكتب رسالة شكر لشخص ساعدك.",

        "اكتب عنوانًا مضحكًا ليومك.",

        "استخدم 4 إيموجي لتوصف آخر مباراة لعبتها.",

        "اكتب لغزًا بسيطًا وخلي أصحابك يحلوه.",

        "قول اسم 3 ألعاب في أقل من 10 ثوانٍ.",

        "اكتب جملة كاملة باستخدام الإيموجي.",

        "اقترح نشاطًا ممتعًا للجروب.",

        "اكتب 3 أسماء مستعارة مضحكة من اختيارك.",

        "صف نفسك بثلاث صفات إيجابية.",

        "اكتب حقيقة علمية قصيرة.",

        "اختر لونًا واكتب 5 أشياء بنفس اللون.",

        "اكتب كلمة بالعكس وخلي أصحابك يعرفوها.",

        "اكتب بيت شعر من تأليفك.",

        "احكي عن هواية نفسك تجربها.",

        "اكتب رسالة ترحيب لأي عضو جديد.",

        "اذكر 3 أشياء ممكن تعملها في الإجازة.",

        "اكتب اسم شخصية كرتونية من غير ما تقول اسمها مباشرة.",

        "اعمل تحدي تخمين رقم من 1 إلى 10.",

        "اكتب جملة تشجيعية قبل الامتحان.",

        "اختر موضوعًا واعمل له إعلانًا مضحكًا.",

        "اكتب اسم بلد باستخدام الإيموجي.",

        "قول 3 فوائد للتعاون مع أصحابك.",

        "اكتب وصفًا مضحكًا لشخصية خيالية.",

        "اكتب 4 كلمات مرتبطة بالبحر.",

        "اقترح اسمًا جديدًا لجروبكم.",

        "اكتب سؤال معلومات عامة للأعضاء.",

        "صف يومًا مثاليًا بالنسبة لك.",

        "اكتب 3 حاجات ممتن لوجودها في حياتك.",

        "اعمل لغزًا عن حيوان.",

        "اكتب اسم لعبة من 4 حروف إن أمكن.",

        "اكتب جملة من خمس كلمات بالضبط.",

        "شارك نصيحة مفيدة للتعلم.",

        "اختر فيلمًا ووصفه من غير ذكر اسمه.",

        "اكتب قصة خيالية قصيرة من سطرين.",

        "اكتب 3 استخدامات مفيدة للتكنولوجيا.",

        "اختر عضوًا واطلب منه سؤال معلومات عامة.",

        "اختم التحدي برسالة لطيفة لكل أعضاء الجروب."

    ]

});


/* =========================================================
   9. Questions logic
========================================================= */

function pickQuestion(mode) {
    const questions = QUESTIONS[mode];

    if (!questions || questions.length === 0) {
        return null;
    }

    let index;

    if (questions.length === 1) {
        index = 0;
    } else {
        do {
            index = Math.floor(
                Math.random() * questions.length
            );
        } while (
            index === state.lastQuestionIndexes[mode]
        );
    }

    state.lastQuestionIndexes[mode] = index;

    return {
        mode,
        index,
        number: index + 1,
        text: questions[index]
    };
}


function setQuestionMode(mode) {
    if (!QUESTIONS[mode]) {
        return;
    }

    state.truthMode = mode;

    DOM.truthModeButton.classList.toggle(
        "active",
        mode === "truth"
    );

    DOM.dareModeButton.classList.toggle(
        "active",
        mode === "dare"
    );

    renderQuestion();
}


function renderQuestion() {
    const question = pickQuestion(state.truthMode);

    state.currentQuestion = question;

    if (!question) {
        DOM.questionNumber.textContent = "لا يوجد سؤال";
        DOM.questionText.textContent = "";
        return;
    }

    DOM.questionNumber.textContent =
        `${state.truthMode === "truth" ? "حقيقة" : "تحدي"} ` +
        `رقم ${question.number} من ${QUESTIONS[state.truthMode].length}`;

    DOM.questionText.textContent = question.text;
}


function toggleTruthPanel(forceState) {
    const shouldOpen =
        typeof forceState === "boolean"
            ? forceState
            : DOM.truthPanel.classList.contains("hidden");

    DOM.truthPanel.classList.toggle(
        "hidden",
        !shouldOpen
    );

    if (shouldOpen && !state.currentQuestion) {
        renderQuestion();
    }

    if (shouldOpen) {
        DOM.truthPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }
}


/* =========================================================
   10. Local account creation
========================================================= */

function findUserByEmail(email) {
    const normalized = normalizeEmail(email);

    return getUsers().find(user =>
        normalizeEmail(user.email) === normalized
    ) || null;
}


function findUserByUsername(username) {
    const normalized = normalizeUsername(username);

    return getUsers().find(user =>
        normalizeUsername(user.username) === normalized
    ) || null;
}


function findUserById(id) {
    return getUsers().find(user => user.id === id) || null;
}


async function createLocalAccount({
    displayName,
    username,
    email,
    password
}) {
    const cleanName = normalizeDisplayName(displayName);

    const cleanUsername = normalizeUsername(username);

    const cleanEmail = normalizeEmail(email);

    if (!isValidDisplayName(cleanName)) {
        throw new Error(
            "اسم العرض لازم يكون من حرفين إلى 40 حرفًا."
        );
    }

    if (!isValidUsername(cleanUsername)) {
        throw new Error(
            "اسم المستخدم لازم يكون من 3 إلى 20 حرفًا، " +
            "ويحتوي على حروف إنجليزية أو أرقام أو _ فقط."
        );
    }

    if (!isValidEmail(cleanEmail)) {
        throw new Error(
            "اكتب بريدًا إلكترونيًا صحيحًا."
        );
    }

    if (!isValidPassword(password)) {
        throw new Error(
            "كلمة المرور لازم تكون 8 أحرف على الأقل."
        );
    }

    if (findUserByEmail(cleanEmail)) {
        throw new Error(
            "البريد ده مسجل بالفعل على الجهاز."
        );
    }

    if (findUserByUsername(cleanUsername)) {
        throw new Error(
            "اسم المستخدم ده مستخدم بالفعل. اختار اسمًا تانيًا."
        );
    }

    const passwordHash = await hashPassword(password);

    const user = {
        id: makeId("user"),

        displayName: cleanName,
        username: cleanUsername,
        email: cleanEmail,

        passwordHash,

        createdAt: Date.now(),

        authProvider: "local-demo",

        avatarColor: Math.floor(
            Math.random() * 5
        ) + 1
    };

    const users = getUsers();

    users.push(user);

    if (!saveUsers(users)) {
        throw new Error(
            "تعذر حفظ الحساب على الجهاز."
        );
    }

    return user;
}


/* =========================================================
   11. Authentication screen management
========================================================= */

function showLoginForm() {
    DOM.loginForm.classList.remove("hidden");
    DOM.registerForm.classList.add("hidden");

    DOM.showLoginTab.classList.add("active");
    DOM.showRegisterTab.classList.remove("active");

    DOM.loginEmail.focus();
}


function showRegisterForm() {
    DOM.registerForm.classList.remove("hidden");
    DOM.loginForm.classList.add("hidden");

    DOM.showRegisterTab.classList.add("active");
    DOM.showLoginTab.classList.remove("active");

    DOM.registerName.focus();
}


function showAuthenticationScreen() {
    state.currentUser = null;
    state.chats = [];
    state.activeChatId = null;

    DOM.appScreen.classList.add("hidden");
    DOM.authScreen.classList.remove("hidden");

    document.body.style.overflow = "auto";

    showLoginForm();
}


function showApplicationScreen() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    DOM.authScreen.classList.add("hidden");
    DOM.appScreen.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    renderCurrentUser();

    loadChatsForCurrentUser();

    renderChatList();

    if (state.activeChatId) {
        openChat(state.activeChatId);
    } else {
        showWelcomePanel();
    }

    DOM.composerNotice.classList.remove("hidden");
}


async function handleRegister(event) {
    event.preventDefault();

    if (!DOM.registerForm.reportValidity()) {
        return;
    }

    const displayName = DOM.registerName.value;
    const username = DOM.registerUsername.value;
    const email = DOM.registerEmail.value;
    const password = DOM.registerPassword.value;
    const confirmPassword = DOM.confirmPassword.value;

    if (password !== confirmPassword) {
        showToast(
            "كلمتا المرور مش متطابقتين.",
            "error"
        );

        DOM.confirmPassword.focus();
        return;
    }

    if (!DOM.acceptTerms.checked) {
        showToast(
            "لازم توافق على شروط الاستخدام.",
            "error"
        );

        return;
    }

    const submitButton = $(
        'button[type="submit"]',
        DOM.registerForm
    );

    submitButton.disabled = true;

    try {
        const user = await createLocalAccount({
            displayName,
            username,
            email,
            password
        });

        state.currentUser = user;

        saveSession(user.id);

        ensureDefaultTruthChat();

        DOM.registerForm.reset();

        showApplicationScreen();

        showToast(
            "تم إنشاء الحساب التجريبي بنجاح.",
            "success"
        );

    } catch (error) {
        showToast(
            error.message || "تعذر إنشاء الحساب.",
            "error",
            4500
        );

    } finally {
        submitButton.disabled = false;
    }
}


async function handleLogin(event) {
    event.preventDefault();

    if (!DOM.loginForm.reportValidity()) {
        return;
    }

    const email = normalizeEmail(
        DOM.loginEmail.value
    );

    const password = DOM.loginPassword.value;

    const user = findUserByEmail(email);

    if (!user) {
        showToast(
            "الحساب مش موجود على الجهاز ده. أنشئ حسابًا تجريبيًا أولًا.",
            "error",
            4500
        );

        return;
    }

    try {
        const candidateHash = await hashPassword(password);

        if (
            !constantTimeStringEqual(
                candidateHash,
                user.passwordHash
            )
        ) {
            showToast(
                "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
                "error"
            );

            return;
        }

        state.currentUser = user;

        saveSession(user.id);

        DOM.loginForm.reset();

        showApplicationScreen();

        showToast(
            "تم تسجيل الدخول بنجاح.",
            "success"
        );

    } catch (error) {
        showToast(
            "تعذر التحقق من كلمة المرور في بيئة المتصفح الحالية.",
            "error"
        );
    }
}


function handleLogout() {
    const shouldLogout = window.confirm(
        "هل أنت متأكد إنك عايز تسجل الخروج؟"
    );

    if (!shouldLogout) {
        return;
    }

    clearSession();

    state.currentUser = null;
    state.activeChatId = null;
    state.currentQuestion = null;

    DOM.loginPassword.value = "";

    showAuthenticationScreen();

    showToast(
        "تم تسجيل الخروج.",
        "success"
    );
}


/* =========================================================
   12. Social authentication placeholders
========================================================= */

function handleUnavailableOAuth(provider) {
    const providerName =
        provider === "google" ? "Google" : "Apple";

    showToast(
        `تسجيل ${providerName} الحقيقي محتاج إعداد مزود المصادقة ` +
        "ومفاتيح التطبيق في خدمة خلفية. الزر مش بيسجل دخول فعليًا حاليًا.",
        "info",
        5000
    );
}


function handleForgotPassword() {
    showToast(
        "استعادة كلمة المرور بالبريد تحتاج خادمًا يرسل رابط إعادة تعيين آمن.",
        "info",
        4500
    );
}


/* =========================================================
   13. Current user UI
========================================================= */

function renderCurrentUser() {
    const user = state.currentUser;

    if (!user) {
        return;
    }

    DOM.currentUserAvatar.textContent =
        getInitial(user.displayName);

    DOM.currentUserAvatar.className =
        `avatar avatar-gradient-${user.avatarColor || 1}`;

    DOM.currentUserName.textContent =
        user.displayName;

    DOM.currentUsername.textContent =
        `@${user.username}`;
}


/* =========================================================
   14. Default Truth or Dare chat
========================================================= */

function createDefaultTruthChat(userId) {
    return {
        id: makeId("chat"),

        ownerId: userId,

        type: "truth",

        title: "حقيقة أو تحدي",

        username: "truth_or_dare",

        avatar: "🎯",

        pinned: true,

        unread: 0,

        createdAt: Date.now(),
        updatedAt: Date.now(),

        memberIds: [userId],

        expiresAfterMs: CONFIG.messageLifetimeMs,

        messages: [
            {
                id: makeId("message"),

                senderId: "system",

                senderName: "What Game Masseg",

                text:
                    "أهلًا بيك في حقيقة أو تحدي! " +
                    "اختار حقيقة أو تحدي واسحب سؤالًا عشوائيًا.",

                createdAt: Date.now(),

                type: "system"
            }
        ]
    };
}


function ensureDefaultTruthChat() {
    if (!state.currentUser) {
        return;
    }

    const chats = getChatsFromStorage();

    const exists = chats.some(chat =>
        chat.ownerId === state.currentUser.id &&
        chat.type === "truth"
    );

    if (!exists) {
        chats.push(
            createDefaultTruthChat(
                state.currentUser.id
            )
        );

        writeJSON(
            CONFIG.storageKeys.chats,
            chats
        );
    }
}


/* =========================================================
   15. Chat loading and expiration
========================================================= */

function loadChatsForCurrentUser() {
    if (!state.currentUser) {
        state.chats = [];
        return;
    }

    ensureDefaultTruthChat();

    const allChats = getChatsFromStorage();

    state.chats = allChats
        .filter(chat =>
            chat.ownerId === state.currentUser.id
        )
        .map(chat => ({
            ...chat,
            messages: Array.isArray(chat.messages)
                ? chat.messages
                : []
        }));

    cleanupExpiredMessages();

    if (
        state.activeChatId &&
        !state.chats.some(chat =>
            chat.id === state.activeChatId
        )
    ) {
        state.activeChatId = null;
    }
}


function cleanupExpiredMessages() {
    const now = Date.now();

    let changed = false;

    for (const chat of state.chats) {
        if (!Array.isArray(chat.messages)) {
            chat.messages = [];
            changed = true;
            continue;
        }

        const originalLength = chat.messages.length;

        chat.messages = chat.messages.filter(message => {
            if (!message || !Number.isFinite(message.createdAt)) {
                return false;
            }

            return (
                now - message.createdAt <
                CONFIG.messageLifetimeMs
            );
        });

        if (chat.messages.length !== originalLength) {
            changed = true;
        }
    }

    if (changed) {
        saveChats();
    }
}


/*
   Demo expiration behavior:
   Messages are cleaned locally when the app runs.
   This is NOT a guaranteed server-side deletion schedule.
*/


function getActiveChat() {
    return state.chats.find(chat =>
        chat.id === state.activeChatId
    ) || null;
}


function getChatById(chatId) {
    return state.chats.find(chat =>
        chat.id === chatId
    ) || null;
}


function saveCurrentUserChats() {
    if (!state.currentUser) {
        return false;
    }

    const allChats = getChatsFromStorage();

    const otherUsersChats = allChats.filter(chat =>
        chat.ownerId !== state.currentUser.id
    );

    const merged = [
        ...otherUsersChats,
        ...state.chats
    ];

    if (merged.length > CONFIG.maxChats * 10) {
        showToast(
            "وصلت لحد التخزين التجريبي المتاح.",
            "error"
        );

        return false;
    }

    return writeJSON(
        CONFIG.storageKeys.chats,
        merged
    );
}


/* =========================================================
   16. Chat list rendering
========================================================= */

function getLastMessage(chat) {
    if (!chat.messages || chat.messages.length === 0) {
        return "ابدأ المحادثة";
    }

    const latest = sortByNewest(
        chat.messages,
        "createdAt"
    )[0];

    if (!latest) {
        return "ابدأ المحادثة";
    }

    if (latest.type === "question") {
        return "🎯 " + latest.text;
    }

    return latest.text;
}


function getChatTimestamp(chat) {
    if (chat.updatedAt) {
        return chat.updatedAt;
    }

    if (chat.createdAt) {
        return chat.createdAt;
    }

    return 0;
}


function matchesFilter(chat) {
    if (state.activeFilter === "unread") {
        return Number(chat.unread || 0) > 0;
    }

    if (state.activeFilter === "groups") {
        return chat.type === "group";
    }

    return true;
}


function matchesSearch(chat, query) {
    if (!query) {
        return true;
    }

    const searchText = [
        chat.title,
        chat.username,
        getLastMessage(chat)
    ].join(" ").toLowerCase();

    return searchText.includes(query);
}


function renderChatList() {
    if (!state.currentUser) {
        DOM.chatList.replaceChildren();
        DOM.chatCount.textContent = "0";
        return;
    }

    const query = String(
        DOM.searchChats.value || ""
    ).trim().toLowerCase();

    let chats = state.chats
        .filter(matchesFilter)
        .filter(chat =>
            matchesSearch(chat, query)
        );

    chats = chats.sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
            return a.pinned ? -1 : 1;
        }

        return (
            getChatTimestamp(b) -
            getChatTimestamp(a)
        );
    });

    DOM.chatCount.textContent =
        String(chats.length);

    DOM.chatList.replaceChildren();

    if (chats.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-chats";

        const icon = document.createElement("span");
        icon.textContent = "💬";

        const message = document.createElement("p");

        message.textContent = query
            ? "مفيش محادثات مطابقة للبحث."
            : "مفيش محادثات في التصنيف ده.";

        empty.append(icon, message);

        DOM.chatList.appendChild(empty);

        return;
    }

    for (const chat of chats) {
        DOM.chatList.appendChild(
            createChatListItem(chat)
        );
    }
}


function createChatListItem(chat) {
    const item = document.createElement("article");

    item.className = "chat-item";

    item.tabIndex = 0;
    item.setAttribute("role", "button");

    item.setAttribute(
        "aria-label",
        `فتح محادثة ${chat.title}`
    );

    if (chat.id === state.activeChatId) {
        item.classList.add("active");
    }

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    if (chat.type === "truth") {
        avatar.textContent = "🎯";
        avatar.style.background =
            "linear-gradient(135deg, #d9a43b, #f6d58a)";

    } else if (chat.type === "group") {
        avatar.textContent = "👥";
        avatar.style.background =
            "linear-gradient(135deg, #627de1, #91a7ff)";

    } else {
        avatar.textContent =
            chat.avatar || getInitial(chat.title);
    }

    const content = document.createElement("div");

    content.className = "chat-item-content";

    const top = document.createElement("div");

    top.className = "chat-item-top";

    const title = document.createElement("strong");

    title.textContent = chat.title;

    const time = document.createElement("time");

    time.textContent = formatTime(
        getChatTimestamp(chat)
    );

    top.append(title, time);

    const bottom = document.createElement("div");

    bottom.className = "chat-item-bottom";

    const preview = document.createElement("p");

    preview.textContent = getLastMessage(chat);

    const badges = document.createElement("div");

    badges.className = "chat-badges";

    if (chat.pinned) {
        const pin = document.createElement("span");

        pin.className = "pinned-badge";
        pin.textContent = "📌";

        badges.appendChild(pin);
    }

    if (chat.unread > 0) {
        const unread = document.createElement("span");

        unread.className = "unread-badge";
        unread.textContent = String(chat.unread);

        badges.appendChild(unread);
    }

    bottom.append(preview, badges);

    content.append(top, bottom);

    item.append(avatar, content);

    item.addEventListener("click", () => {
        openChat(chat.id);
    });

    item.addEventListener("keydown", event => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            openChat(chat.id);
        }
    });

    return item;
}


/* =========================================================
   17. Open and render a conversation
========================================================= */

function showWelcomePanel() {
    state.activeChatId = null;

    DOM.welcomePanel.classList.remove("hidden");
    DOM.messagesList.classList.add("hidden");

    DOM.messageForm.classList.add("hidden");

    DOM.activeChatTitle.textContent =
        "أهلًا بيك في What Game Masseg";

    DOM.activeChatSubtitle.textContent =
        "اختار محادثة من القائمة";

    DOM.activeChatAvatar.textContent = "🎮";

    DOM.expirationBanner.classList.add("hidden");

    DOM.truthPanel.classList.add("hidden");

    DOM.appScreen.classList.remove(
        "mobile-chat-open"
    );

    renderChatList();
}


function openChat(chatId) {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const chat = getChatById(chatId);

    if (!chat) {
        showToast(
            "المحادثة دي مش موجودة.",
            "error"
        );

        return;
    }

    state.activeChatId = chat.id;

    chat.unread = 0;

    saveCurrentUserChats();

    DOM.welcomePanel.classList.add("hidden");
    DOM.messagesList.classList.remove("hidden");

    DOM.messageForm.classList.remove("hidden");

    DOM.activeChatTitle.textContent =
        chat.title;

    DOM.activeChatSubtitle.textContent =
        getChatSubtitle(chat);

    DOM.activeChatAvatar.textContent =
        chat.type === "truth"
            ? "🎯"
            : chat.type === "group"
                ? "👥"
                : (chat.avatar || getInitial(chat.title));

    DOM.pinChatButton.style.color =
        chat.pinned ? "#c49336" : "";

    DOM.expirationBanner.classList.toggle(
        "hidden",
        chat.type !== "truth"
    );

    if (chat.type === "truth") {
        DOM.expirationText.textContent =
            "في النسخة التجريبية، تُنظف الرسائل بعد 12 ساعة " +
            "عند تشغيل التطبيق. الحذف مش مضمون من الخادم.";

    }

    DOM.appScreen.classList.add(
        "mobile-chat-open"
    );

    renderMessages(chat);

    renderChatList();

    if (!DOM.detailsPanel.classList.contains("hidden")) {
        renderChatDetails();
    }

    DOM.messageInput.focus();
}


function getChatSubtitle(chat) {
    if (chat.type === "truth") {
        return "🎯 حقيقة أو تحدي • أسئلة عشوائية";
    }

    if (chat.type === "group") {
        return `${chat.memberIds.length} أعضاء • جروب تجريبي`;
    }

    return `@${chat.username || "user"} • محادثة تجريبية`;
}


/* =========================================================
   18. Message rendering
========================================================= */

function renderMessages(chat) {
    DOM.messagesList.replaceChildren();

    const messages = [...chat.messages].sort(
        (a, b) => a.createdAt - b.createdAt
    );

    if (messages.length === 0) {
        const empty = document.createElement("div");

        empty.className = "message-row system-message";

        const bubble = document.createElement("div");

        bubble.className = "message-bubble";

        const text = document.createElement("p");

        text.className = "message-text";

        text.textContent =
            "مفيش رسائل لسه. ابدأ الكلام دلوقتي!";

        bubble.appendChild(text);
        empty.appendChild(bubble);

        DOM.messagesList.appendChild(empty);

        return;
    }

    let previousDay = null;

    for (const message of messages) {
        const messageDate = new Date(message.createdAt);

        const dayKey = [
            messageDate.getFullYear(),
            messageDate.getMonth(),
            messageDate.getDate()
        ].join("-");

        if (dayKey !== previousDay) {
            const separator = document.createElement("div");

            separator.className = "day-separator";

            separator.textContent =
                formatDate(message.createdAt);

            DOM.messagesList.appendChild(separator);

            previousDay = dayKey;
        }

        DOM.messagesList.appendChild(
            createMessageElement(message)
        );
    }

    requestAnimationFrame(() => {
        DOM.messagesArea.scrollTop =
            DOM.messagesArea.scrollHeight;
    });
}


function createMessageElement(message) {
    const row = document.createElement("article");

    const isMine =
        message.senderId === state.currentUser?.id;

    const isSystem =
        message.type === "system" ||
        message.senderId === "system";

    row.className = "message-row";

    if (isSystem) {
        row.classList.add("system-message");

    } else {
        row.classList.add(
            isMine ? "mine" : "theirs"
        );
    }

    if (!isSystem && !isMine) {
        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        avatar.textContent =
            getInitial(message.senderName);

        row.appendChild(avatar);
    }

    const content = document.createElement("div");

    content.className = "message-content";

    if (
        !isSystem &&
        !isMine &&
        state.activeChatId
    ) {
        const sender = document.createElement("span");

        sender.className = "message-sender";

        sender.textContent =
            message.senderName || "مستخدم";

        content.appendChild(sender);
    }

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    const text = document.createElement("p");

    text.className = "message-text";

    text.textContent = message.text || "";

    bubble.appendChild(text);

    const meta = document.createElement("div");

    meta.className = "message-meta";

    const time = document.createElement("time");

    time.textContent = formatTime(message.createdAt);

    meta.appendChild(time);

    if (isMine) {
        const status = document.createElement("span");

        status.className = "message-status";

        status.textContent = "✓";

        status.title = "تمت الإضافة محليًا فقط";

        meta.appendChild(status);
    }

    bubble.appendChild(meta);

    content.appendChild(bubble);

    row.appendChild(content);

    return row;
}


/* =========================================================
   19. Sending local demo messages
========================================================= */

function createMessage({
    senderId,
    senderName,
    text,
    type = "text"
}) {
    return {
        id: makeId("message"),

        senderId,
        senderName,

        text: String(text).slice(
            0,
            CONFIG.maxMessageLength
        ),

        type,

        createdAt: Date.now()
    };
}


function appendMessageToChat(chat, message) {
    if (!chat) {
        return false;
    }

    if (!Array.isArray(chat.messages)) {
        chat.messages = [];
    }

    chat.messages.push(message);

    chat.updatedAt = Date.now();

    if (
        chat.messages.length > 1000
    ) {
        chat.messages = chat.messages.slice(-1000);
    }

    const saved = saveCurrentUserChats();

    renderChatList();

    if (state.activeChatId === chat.id) {
        renderMessages(chat);
    }

    return saved;
}


function handleSendMessage(event) {
    event.preventDefault();

    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const chat = getActiveChat();

    if (!chat) {
        showToast(
            "اختار محادثة الأول.",
            "info"
        );

        return;
    }

    const text = String(
        DOM.messageInput.value || ""
    ).trim();

    if (!text) {
        return;
    }

    if (text.length > CONFIG.maxMessageLength) {
        showToast(
            "الرسالة طويلة جدًا.",
            "error"
        );

        return;
    }

    const message = createMessage({
        senderId: state.currentUser.id,
        senderName: state.currentUser.displayName,
        text,
        type: "text"
    });

    const previousValue = DOM.messageInput.value;

    DOM.messageInput.value = "";

    if (!appendMessageToChat(chat, message)) {
        DOM.messageInput.value = previousValue;
        return;
    }

    DOM.messageInput.style.height = "44px";
}


/* =========================================================
   20. Sending a Truth or Dare question
========================================================= */

function sendCurrentQuestion() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const chat = getActiveChat();

    if (!chat) {
        showToast(
            "افتح محادثة الأول علشان تبعت السؤال.",
            "info"
        );

        return;
    }

    if (!state.currentQuestion) {
        renderQuestion();
    }

    const question = state.currentQuestion;

    if (!question) {
        return;
    }

    const label =
        question.mode === "truth"
            ? "🤔 حقيقة"
            : "🎲 تحدي";

    const message = createMessage({
        senderId: state.currentUser.id,

        senderName: state.currentUser.displayName,

        text: `${label}: ${question.text}`,

        type: "question"
    });

    appendMessageToChat(chat, message);

    toggleTruthPanel(false);

    showToast(
        "تمت إضافة السؤال للمحادثة التجريبية.",
        "success"
    );
}


/* =========================================================
   21. Create a private demo chat
========================================================= */

function createPrivateChat(targetUser) {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return null;
    }

    if (targetUser.id === state.currentUser.id) {
        showToast(
            "مش ممكن تبدأ محادثة مع نفسك.",
            "error"
        );

        return null;
    }

    const existing = state.chats.find(chat =>
        chat.type === "private" &&
        chat.username === targetUser.username
    );

    if (existing) {
        return existing;
    }

    const chat = {
        id: makeId("chat"),

        ownerId: state.currentUser.id,

        type: "private",

        title: targetUser.displayName,

        username: targetUser.username,

        avatar: getInitial(targetUser.displayName),

        pinned: false,

        unread: 0,

        createdAt: Date.now(),
        updatedAt: Date.now(),

        memberIds: [
            state.currentUser.id,
            targetUser.id
        ],

        expiresAfterMs: CONFIG.messageLifetimeMs,

        messages: [
            createMessage({
                senderId: "system",

                senderName: "What Game Masseg",

                text:
                    `بدأت محادثة تجريبية مع @${targetUser.username}. ` +
                    "المراسلة بين الأجهزة غير مفعلة في النسخة دي.",

                type: "system"
            })
        ]
    };

    state.chats.push(chat);

    saveCurrentUserChats();

    renderChatList();

    return chat;
}


/* =========================================================
   22. New chat dialog
========================================================= */

function openNewChatModal() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const users = getUsers().filter(user =>
        user.id !== state.currentUser.id
    );

    DOM.modalTitle.textContent =
        "ابدأ محادثة جديدة";

    DOM.modalBody.replaceChildren();

    const description = document.createElement("p");

    description.className = "modal-description";

    description.textContent =
        "اختار حسابًا موجودًا على نفس الجهاز لفتح محادثة تجريبية.";

    const label = document.createElement("label");

    label.className = "modal-label";
    label.textContent = "البحث باسم المستخدم";

    label.htmlFor = "userSearchInput";

    const searchInput = document.createElement("input");

    searchInput.className = "modal-input";

    searchInput.id = "userSearchInput";

    searchInput.placeholder = "اكتب اسم المستخدم...";

    searchInput.autocomplete = "off";

    const list = document.createElement("div");

    list.className = "modal-list";

    function renderUsers(query = "") {
        list.replaceChildren();

        const normalized = query.trim().toLowerCase();

        const matches = users.filter(user => {
            const text =
                `${user.displayName} ${user.username} ${user.email}`
                    .toLowerCase();

            return text.includes(normalized);
        });

        if (matches.length === 0) {
            const empty = document.createElement("div");

            empty.className = "modal-empty";

            empty.textContent =
                "مفيش حسابات تجريبية مطابقة. الحسابات مش بتتشارك بين الأجهزة.";

            list.appendChild(empty);

            return;
        }

        for (const user of matches) {
            const row = document.createElement("div");

            row.className = "modal-list-item";

            const avatar = document.createElement("div");

            avatar.className =
                `avatar avatar-gradient-${user.avatarColor || 1}`;

            avatar.textContent =
                getInitial(user.displayName);

            const details = document.createElement("div");

            const name = document.createElement("strong");

            name.textContent = user.displayName;

            const username = document.createElement("small");

            username.textContent = `@${user.username}`;

            details.append(name, username);

            const openButton = document.createElement("button");

            openButton.className = "secondary-button";

            openButton.textContent = "فتح";

            openButton.addEventListener("click", () => {
                const chat = createPrivateChat(user);

                if (chat) {
                    closeModal();
                    openChat(chat.id);
                }
            });

            row.append(avatar, details, openButton);

            list.appendChild(row);
        }
    }

    searchInput.addEventListener("input", () => {
        renderUsers(searchInput.value);
    });

    DOM.modalBody.append(
        description,
        label,
        searchInput,
        list
    );

    renderUsers();

    openModal();
}


/* =========================================================
   23. Create group chat
========================================================= */

function openNewGroupModal() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const users = getUsers().filter(user =>
        user.id !== state.currentUser.id
    );

    DOM.modalTitle.textContent =
        "إنشاء جروب جديد";

    DOM.modalBody.replaceChildren();

    const description = document.createElement("p");

    description.className = "modal-description";

    description.textContent =
        "أنشئ مجموعة تجريبية وحدد اسمها والأعضاء. " +
        "المجموعة الحالية محفوظة محليًا على جهازك فقط.";

    const nameLabel = document.createElement("label");

    nameLabel.className = "modal-label";
    nameLabel.textContent = "اسم الجروب";

    const nameInput = document.createElement("input");

    nameInput.className = "modal-input";
    nameInput.placeholder = "مثال: صحاب المدرسة";
    nameInput.maxLength = 60;

    const membersLabel = document.createElement("label");

    membersLabel.className = "modal-label";
    membersLabel.textContent = "اختار الأعضاء";

    const membersList = document.createElement("div");

    membersList.className = "modal-list";

    if (users.length === 0) {
        const empty = document.createElement("div");

        empty.className = "modal-empty";

        empty.textContent =
            "مفيش حسابات أخرى على الجهاز. تقدر تنشئ الجروب من غير أعضاء إضافيين.";

        membersList.appendChild(empty);

    } else {
        for (const user of users) {
            const row = document.createElement("label");

            row.className = "modal-list-item";

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.value = user.id;
            checkbox.name = "groupMember";

            const avatar = document.createElement("div");

            avatar.className =
                `avatar avatar-gradient-${user.avatarColor || 1}`;

            avatar.textContent =
                getInitial(user.displayName);

            const details = document.createElement("div");

            const name = document.createElement("strong");

            name.textContent = user.displayName;

            const username = document.createElement("small");

            username.textContent = `@${user.username}`;

            details.append(name, username);

            row.append(checkbox, avatar, details);

            membersList.appendChild(row);
        }
    }

    const createButton = document.createElement("button");

    createButton.type = "button";

    createButton.className =
        "primary-button modal-action";

    createButton.textContent = "إنشاء الجروب";

    createButton.addEventListener("click", () => {
        const name = normalizeDisplayName(
            nameInput.value
        );

        if (name.length < 2 || name.length > 60) {
            showToast(
                "اسم الجروب لازم يكون من حرفين إلى 60 حرفًا.",
                "error"
            );

            return;
        }

        const selectedMembers = $$(
            'input[name="groupMember"]:checked',
            membersList
        ).map(input => input.value);

        if (
            selectedMembers.length + 1 >
            CONFIG.maxGroupMembers
        ) {
            showToast(
                "عدد أعضاء الجروب أكبر من الحد التجريبي.",
                "error"
            );

            return;
        }

        const group = {
            id: makeId("group"),

            ownerId: state.currentUser.id,

            type: "group",

            title: name,

            username: null,

            avatar: "👥",

            pinned: false,

            unread: 0,

            createdAt: Date.now(),
            updatedAt: Date.now(),

            memberIds: [
                state.currentUser.id,
                ...selectedMembers
            ],

            expiresAfterMs: CONFIG.messageLifetimeMs,

            messages: [
                createMessage({
                    senderId: "system",

                    senderName: "What Game Masseg",

                    text:
                        `تم إنشاء الجروب "${name}" بنجاح. ` +
                        "دي مجموعة تجريبية محلية.",

                    type: "system"
                })
            ]
        };

        state.chats.push(group);

        saveCurrentUserChats();

        closeModal();

        renderChatList();

        openChat(group.id);

        showToast(
            "تم إنشاء الجروب التجريبي.",
            "success"
        );
    });

    DOM.modalBody.append(
        description,
        nameLabel,
        nameInput,
        membersLabel,
        membersList,
        createButton
    );

    openModal();
}


/* =========================================================
   24. Pin and unpin chats
========================================================= */

function togglePinActiveChat() {
    const chat = getActiveChat();

    if (!chat) {
        showToast(
            "اختار محادثة الأول.",
            "info"
        );

        return;
    }

    chat.pinned = !chat.pinned;

    saveCurrentUserChats();

    DOM.pinChatButton.style.color =
        chat.pinned ? "#c49336" : "";

    renderChatList();

    renderChatDetails();

    showToast(
        chat.pinned
            ? "تم تثبيت المحادثة."
            : "تم إلغاء تثبيت المحادثة.",
        "success"
    );
}


/* =========================================================
   25. Conversation details
========================================================= */

function openDetailsPanel() {
    if (!getActiveChat()) {
        showToast(
            "افتح محادثة الأول.",
            "info"
        );

        return;
    }

    DOM.detailsPanel.classList.remove("hidden");

    renderChatDetails();
}


function closeDetailsPanel() {
    DOM.detailsPanel.classList.add("hidden");
}


function renderChatDetails() {
    const chat = getActiveChat();

    if (!chat) {
        return;
    }

    DOM.detailsAvatar.textContent =
        chat.type === "truth"
            ? "🎯"
            : chat.type === "group"
                ? "👥"
                : (chat.avatar || getInitial(chat.title));

    DOM.detailsTitle.textContent =
        chat.title;

    DOM.detailsSubtitle.textContent =
        chat.type === "private"
            ? `@${chat.username || ""}`
            : chat.type === "group"
                ? "مجموعة تجريبية"
                : "حقيقة أو تحدي";

    DOM.detailsMessageCount.textContent =
        String(chat.messages.length);

    DOM.detailsType.textContent =
        chat.type === "truth"
            ? "حقيقة أو تحدي"
            : chat.type === "group"
                ? "جروب"
                : "خاص";

    DOM.detailsPinned.textContent =
        chat.pinned ? "مثبتة" : "غير مثبتة";
}


/* =========================================================
   26. Delete active demo chat
========================================================= */

function deleteActiveChat() {
    const chat = getActiveChat();

    if (!chat) {
        showToast(
            "مفيش محادثة محددة.",
            "info"
        );

        return;
    }

    if (chat.type === "truth") {
        showToast(
            "شات حقيقة أو تحدي مثبت افتراضيًا ومش ممكن حذفه في النسخة دي.",
            "info"
        );

        return;
    }

    const confirmed = window.confirm(
        `هل أنت متأكد من حذف المحادثة "${chat.title}" ` +
        "من بياناتك المحلية التجريبية؟"
    );

    if (!confirmed) {
        return;
    }

    state.chats = state.chats.filter(item =>
        item.id !== chat.id
    );

    state.activeChatId = null;

    saveCurrentUserChats();

    closeDetailsPanel();

    showWelcomePanel();

    showToast(
        "تم حذف المحادثة من بياناتك التجريبية المحلية.",
        "success"
    );
}


/* =========================================================
   27. Local backup export
========================================================= */

function downloadBackup() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const backup = {
        app: CONFIG.appName,

        version: 1,

        exportedAt: new Date().toISOString(),

        account: {
            username: state.currentUser.username,
            displayName: state.currentUser.displayName,
            email: state.currentUser.email
        },

        chats: state.chats.map(chat => ({
            id: chat.id,

            type: chat.type,

            title: chat.title,

            username: chat.username || null,

            pinned: Boolean(chat.pinned),

            createdAt: chat.createdAt,

            updatedAt: chat.updatedAt,

            messages: chat.messages.map(message => ({
                senderName: message.senderName,
                text: message.text,
                type: message.type,
                createdAt: message.createdAt
            }))
        }))
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        {
            type: "application/json;charset=utf-8"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `what-game-masseg-backup-${Date.now()}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "تم تنزيل ملف النسخة الاحتياطية.",
        "success"
    );
}


/* =========================================================
   28. Profile modal
========================================================= */

function openProfileModal() {
    if (!state.currentUser) {
        showAuthenticationScreen();
        return;
    }

    const user = state.currentUser;

    DOM.modalTitle.textContent =
        "حسابي";

    DOM.modalBody.replaceChildren();

    const description = document.createElement("p");

    description.className = "modal-description";

    description.textContent =
        "بيانات الحساب التجريبي الحالي.";

    const rows = [
        ["اسم العرض", user.displayName],
        ["اسم المستخدم", `@${user.username}`],
        ["البريد الإلكتروني", user.email],
        ["نوع الحساب", "تجريبي محلي"],
        ["تاريخ الإنشاء", formatDate(user.createdAt)]
    ];

    for (const [labelText, valueText] of rows) {
        const row = document.createElement("div");

        row.className = "details-stat";

        const label = document.createElement("span");

        label.textContent = labelText;

        const value = document.createElement("strong");

        value.textContent = valueText;

        row.append(label, value);

        DOM.modalBody.appendChild(row);
    }

    const warning = document.createElement("p");

    warning.className = "modal-description";

    warning.style.marginTop = "15px";

    warning.textContent =
        "تعديل البيانات والتحقق من البريد الإلكتروني " +
        "يحتاجان إلى ربط خدمة حسابات حقيقية.";

    DOM.modalBody.append(
        description,
        warning
    );

    openModal();
}


/* =========================================================
   29. Modal utilities
========================================================= */

function openModal() {
    state.lastFocusElement = document.activeElement;

    DOM.modalBackdrop.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    const firstInput = $(
        "input, button, select, textarea",
        DOM.modalBody
    );

    if (firstInput) {
        window.setTimeout(() => {
            firstInput.focus();
        }, 30);
    }
}


function closeModal() {
    DOM.modalBackdrop.classList.add("hidden");

    if (state.currentUser) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }

    if (
        state.lastFocusElement &&
        typeof state.lastFocusElement.focus === "function"
    ) {
        state.lastFocusElement.focus();
    }
}


/* =========================================================
   30. Search and filtering
========================================================= */

function setChatFilter(filter) {
    const allowedFilters = [
        "all",
        "unread",
        "groups"
    ];

    if (!allowedFilters.includes(filter)) {
        return;
    }

    state.activeFilter = filter;

    $$(".filter-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );
    });

    renderChatList();
}


/* =========================================================
   31. Password visibility
========================================================= */

function togglePasswordVisibility(button) {
    const targetId = button.dataset.togglePassword;

    const input = document.getElementById(targetId);

    if (!input) {
        return;
    }

    const shouldShow =
        input.type === "password";

    input.type = shouldShow
        ? "text"
        : "password";

    button.textContent =
        shouldShow ? "🙈" : "👁";

    button.setAttribute(
        "aria-label",
        shouldShow
            ? "إخفاء كلمة المرور"
            : "إظهار كلمة المرور"
    );
}


/* =========================================================
   32. Responsive behavior
========================================================= */

function closeMobileChat() {
    DOM.appScreen.classList.remove(
        "mobile-chat-open"
    );
}


function handleResize() {
    if (window.innerWidth > 760) {
        DOM.appScreen.classList.remove(
            "mobile-chat-open"
        );
    }
}


/* =========================================================
   33. Emoji helper
========================================================= */

function insertEmoji(emoji) {
    const input = DOM.messageInput;

    const start =
        input.selectionStart ?? input.value.length;

    const end =
        input.selectionEnd ?? input.value.length;

    const value = input.value;

    input.value =
        value.slice(0, start) +
        emoji +
        value.slice(end);

    const position = start + emoji.length;

    input.focus();

    input.setSelectionRange(
        position,
        position
    );
}


function openEmojiPicker() {
    const emojis = [
        "😀", "😂", "😊", "😍",
        "😎", "🥳", "🤔", "😭",
        "👍", "❤️", "🔥", "🎮",
        "🎯", "🏆", "💚", "✨"
    ];

    DOM.modalTitle.textContent =
        "اختار إيموجي";

    DOM.modalBody.replaceChildren();

    const description = document.createElement("p");

    description.className = "modal-description";

    description.textContent =
        "اختار إيموجي لإضافته للرسالة.";

    const grid = document.createElement("div");

    grid.style.display = "grid";

    grid.style.gridTemplateColumns =
        "repeat(4, 1fr)";

    grid.style.gap = "8px";

    for (const emoji of emojis) {
        const button = document.createElement("button");

        button.type = "button";

        button.textContent = emoji;

        button.style.minHeight = "48px";
        button.style.fontSize = "24px";

        button.style.border = "1px solid #e4ece8";
        button.style.borderRadius = "12px";
        button.style.background = "#fff";

        button.addEventListener("click", () => {
            closeModal();

            insertEmoji(emoji);
        });

        grid.appendChild(button);
    }

    DOM.modalBody.append(
        description,
        grid
    );

    openModal();
}


/* =========================================================
   34. Main event listeners
========================================================= */

function bindAuthenticationEvents() {
    DOM.showLoginTab.addEventListener(
        "click",
        showLoginForm
    );

    DOM.showRegisterTab.addEventListener(
        "click",
        showRegisterForm
    );

    $$("[data-open-register]").forEach(button => {
        button.addEventListener(
            "click",
            showRegisterForm
        );
    });

    $$("[data-open-login]").forEach(button => {
        button.addEventListener(
            "click",
            showLoginForm
        );
    });

    DOM.loginForm.addEventListener(
        "submit",
        handleLogin
    );

    DOM.registerForm.addEventListener(
        "submit",
        handleRegister
    );

    DOM.forgotPasswordButton.addEventListener(
        "click",
        handleForgotPassword
    );

    DOM.googleLoginButton.addEventListener(
        "click",
        () => handleUnavailableOAuth("google")
    );

    DOM.appleLoginButton.addEventListener(
        "click",
        () => handleUnavailableOAuth("apple")
    );

    $$("[data-toggle-password]").forEach(button => {
        button.addEventListener("click", () => {
            togglePasswordVisibility(button);
        });
    });

    DOM.registerUsername.addEventListener(
        "input",
        () => {
            DOM.registerUsername.value =
                DOM.registerUsername.value
                    .replace(/[^a-zA-Z0-9_]/g, "")
                    .slice(0, CONFIG.maxUsernameLength);
        }
    );
}


function bindChatEvents() {
    DOM.logoutButton.addEventListener(
        "click",
        handleLogout
    );

    DOM.openProfileButton.addEventListener(
        "click",
        openProfileModal
    );

    DOM.newChatButton.addEventListener(
        "click",
        openNewChatModal
    );

    DOM.welcomeNewChat.addEventListener(
        "click",
        openNewChatModal
    );

    DOM.newGroupButton.addEventListener(
        "click",
        openNewGroupModal
    );

    DOM.searchChats.addEventListener(
        "input",
        renderChatList
    );

    DOM.clearSearch.addEventListener(
        "click",
        () => {
            DOM.searchChats.value = "";

            renderChatList();

            DOM.searchChats.focus();
        }
    );

    $$(".filter-button").forEach(button => {
        button.addEventListener("click", () => {
            setChatFilter(button.dataset.filter);
        });
    });

    DOM.messageForm.addEventListener(
        "submit",
        handleSendMessage
    );

    DOM.messageInput.addEventListener(
        "input",
        () => {
            DOM.messageInput.style.height = "auto";

            DOM.messageInput.style.height =
                Math.min(
                    DOM.messageInput.scrollHeight,
                    130
                ) + "px";
        }
    );

    DOM.messageInput.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();

                DOM.messageForm.requestSubmit();
            }
        }
    );

    DOM.pinChatButton.addEventListener(
        "click",
        togglePinActiveChat
    );

    DOM.chatInfoButton.addEventListener(
        "click",
        openDetailsPanel
    );

    DOM.closeDetailsButton.addEventListener(
        "click",
        closeDetailsPanel
    );

    DOM.detailsPinButton.addEventListener(
        "click",
        togglePinActiveChat
    );

    DOM.exportBackupButton.addEventListener(
        "click",
        downloadBackup
    );

    DOM.deleteChatButton.addEventListener(
        "click",
        deleteActiveChat
    );

    DOM.mobileBackButton.addEventListener(
        "click",
        closeMobileChat
    );

    DOM.truthButton.addEventListener(
        "click",
        () => toggleTruthPanel()
    );

    DOM.closeTruthPanel.addEventListener(
        "click",
        () => toggleTruthPanel(false)
    );

    DOM.truthModeButton.addEventListener(
        "click",
        () => setQuestionMode("truth")
    );

    DOM.dareModeButton.addEventListener(
        "click",
        () => setQuestionMode("dare")
    );

    DOM.nextQuestionButton.addEventListener(
        "click",
        renderQuestion
    );

    DOM.sendQuestionButton.addEventListener(
        "click",
        sendCurrentQuestion
    );

    $("#emojiButton").addEventListener(
        "click",
        openEmojiPicker
    );
}


function bindModalEvents() {
    DOM.closeModalButton.addEventListener(
        "click",
        closeModal
    );

    DOM.modalBackdrop.addEventListener(
        "click",
        event => {
            if (event.target === DOM.modalBackdrop) {
                closeModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                !DOM.modalBackdrop.classList.contains("hidden")
            ) {
                closeModal();
            }
        }
    );
}


/* =========================================================
   35. Session restoration
========================================================= */

function restoreSession() {
    const session = getSession();

    if (!session || !session.userId) {
        showAuthenticationScreen();
        return false;
    }

    const user = findUserById(session.userId);

    if (!user) {
        clearSession();

        showAuthenticationScreen();

        return false;
    }

    state.currentUser = user;

    return true;
}


/* =========================================================
   36. Startup
========================================================= */

function hideLoadingScreen() {
    DOM.loadingScreen.classList.add("hidden");
}


function initializeApplication() {
    bindAuthenticationEvents();

    bindChatEvents();

    bindModalEvents();

    window.addEventListener(
        "resize",
        handleResize
    );

    /*
       No authenticated session means no access
       to the application interface.
    */

    const hasValidSession = restoreSession();

    if (hasValidSession) {
        showApplicationScreen();
    } else {
        showAuthenticationScreen();
    }

    hideLoadingScreen();
}


/* =========================================================
   37. Storage synchronization notice
========================================================= */

/*
   The browser storage event does not create a real messaging
   connection. This listener only reacts to changes made by
   other tabs on the same origin and same browser profile.
*/

window.addEventListener("storage", event => {
    if (
        event.key === CONFIG.storageKeys.session &&
        !getSession()
    ) {
        state.currentUser = null;

        showAuthenticationScreen();

        return;
    }

    if (
        event.key === CONFIG.storageKeys.chats &&
        state.currentUser
    ) {
        loadChatsForCurrentUser();

        renderChatList();

        if (state.activeChatId) {
            const chat = getActiveChat();

            if (chat) {
                renderMessages(chat);
            }
        }
    }
});


/* =========================================================
   38. Periodic local cleanup
========================================================= */

window.setInterval(() => {
    if (!state.currentUser) {
        return;
    }

    loadChatsForCurrentUser();

    renderChatList();

    if (state.activeChatId) {
        const chat = getActiveChat();

        if (chat) {
            renderMessages(chat);
        }
    }
}, 60 * 1000);


/* =========================================================
   39. Protect the UI from accidental unauthenticated access
========================================================= */

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
        return;
    }

    if (!getSession()) {
        state.currentUser = null;

        DOM.appScreen.classList.add("hidden");

        DOM.authScreen.classList.remove("hidden");
    }
});


/* =========================================================
   40. Start
========================================================= */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        { once: true }
    );
} else {
    initializeApplication();
}
