// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");

    function publishShopifyEvent(eventName, data = {}) {
  try {
    if (window.Shopify && window.Shopify.analytics && typeof window.Shopify.analytics.publish === "function") {
      window.Shopify.analytics.publish("custom_event", {
        event_name: eventName,
        ...data
      });
    }
  } catch (e) {
    console.log("publish failed", e);
  }
}

    
    //SessionId created
    let sessionId = localStorage.getItem("session_id") || null;
    function createSession() {
        if (!sessionId) {
            sessionId = 'sid_' + crypto.randomUUID().replace(/-/g, '').slice(0, -10);
            localStorage.setItem("session_id", sessionId);
            console.log("New SessionId: ", sessionId);
        } else {
            console.log("Existed SessionId: ", sessionId);
        }
    };
    createSession();

    // Configuration
     // const API_URL = "https://ringexpert-backend.azurewebsites.net/ask";
    const API_URL = "http://newflaskappbot-dab5eve4d2emdyhw.centralindia-01.azurewebsites.net/ask";
    const TIMEOUT = 30000;
    const DB_API = "http://loginfunc-gaerhedqavacb3h2.centralindia-01.azurewebsites.net";
  
    const SPEECH_API = "http://newflaskappbot-dab5eve4d2emdyhw.centralindia-01.azurewebsites.net/speech_to_text";

    // DOM Elements
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotModal = document.getElementById('chatbot-modal');
    const closeButton = document.querySelector('.header-close');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
   
    const voiceButton = document.getElementById('voice-button');
    const voiceIndicator = document.getElementById('voice-indicator');
    const voiceSuccess = document.getElementById('voice-success');
    const micIcon = voiceButton.querySelector('.mic-icon');
    const recordingIcon = voiceButton.querySelector('.recording-icon');
    
    const initialOptions = document.querySelector('.initial-options');
    const expandedOptions = document.querySelector('.expanded-options');
    const seeMoreBtn = document.querySelector('.see-more');
    const seeLessBtn = document.querySelector('.see-less');
    const messageContainer = document.querySelector('.message-container');
    const contentArea = document.querySelector('.content-area');


document.addEventListener('DOMContentLoaded', function () {
    const chatInput = document.querySelector('.chat-input');
    const chatbotModal = document.querySelector('#chatbot-modal');
    const chatbotBody = document.querySelector('.chatbot-body');

    if (!chatInput || !chatbotModal || !chatbotBody) return;

    const originalModalHeight = chatbotModal.style.height || '100%';

    // 🔹 Force scroll to bottom safely
    function scrollToBottom(force = false) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                chatbotBody.scrollTop = chatbotBody.scrollHeight;
            }, force ? 350 : 150);
        });
    }

    // 🔹 Handle keyboard open
    function handleKeyboardOpen() {
        if (window.innerWidth > 450) return;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const viewportHeight = window.visualViewport
                    ? window.visualViewport.height
                    : window.innerHeight;

                chatbotModal.style.height = viewportHeight + 'px';
                chatbotModal.style.maxHeight = viewportHeight + 'px';

                scrollToBottom(true); // FORCE scroll
            }, 300);
        });
    }

    // 🔹 Handle keyboard close
    function handleKeyboardClose() {
        if (window.innerWidth > 450) return;

        chatbotModal.style.height = originalModalHeight;
        chatbotModal.style.maxHeight = originalModalHeight;

        scrollToBottom();
    }

    // 🔹 Input focus / blur
    chatInput.addEventListener('focus', handleKeyboardOpen);
    chatInput.addEventListener('blur', handleKeyboardClose);

    // 🔹 VisualViewport resize (MOST IMPORTANT FIX)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            if (document.activeElement === chatInput) {
                handleKeyboardOpen();
            }
        });
    }

    // 🔹 WHEN CHATBOT OPENS (🔥 THIS FIXES FIRST TIME ISSUE)
    const observer = new MutationObserver(() => {
        if (chatbotModal.offsetParent !== null) {
            scrollToBottom(true);
        }
    });

    observer.observe(chatbotModal, { attributes: true, attributeFilter: ['style', 'class'] });
});


    



    // Track if the current input is from voice
    let pendingAudioFlag = false;
    
    // Track microphone permission state
    let microphonePermission = 'prompt'; // 'prompt', 'granted', 'denied'
    let permissionAskedThisSession = false; // Track if we've asked for permission in this session

    // Helper to strip HTML tags 
    function stripHtml(html) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    function scrollToBottom(delay = 150) {
        setTimeout(() => {
            contentArea.scrollTop = contentArea.scrollHeight;
        }, delay);
    }

    function addTypingIndicator(id) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.id = id;
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>`;
        messageContainer.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTypingIndicator(id) {
        const elem = document.getElementById(id);
        if (elem) elem.remove();
    }

    // API functions to save messages
    async function saveMessage(sessionID, role, message, isAudio = false) {
        try {
            const plainMessage = stripHtml(message);
            await fetch(`${DB_API}/save_message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    session_id: sessionID, 
                    role, 
                    message: plainMessage,
                    is_audio: isAudio
                })
            });
            // console.log("success: save message");
        } catch (err) {
            console.error("Failed to save message:", err);
        }
    }

    // 🧩 Loader utility: works for both desktop & mobile
    function showChatLoader() {
        // Check if loader already exists
        let loader = document.getElementById('chat-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'chat-loader';
            loader.innerHTML = `
                <div class="loader-overlay">
                    <div class="loader-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="loader-text">Loading your previous chat...</div>
                </div>
            `;
        }

        // Detect if mobile (your chatbot becomes fullscreen)
        const isMobile = window.innerWidth <= 450;

        // Append loader correctly based on device
        if (isMobile) {
            document.body.appendChild(loader); // on mobile, attach to full page
            Object.assign(loader.style, {
                position: 'fixed',
                inset: '0',
                width: '100%',
                height: '100dvh',
                zIndex: '99999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.85)',
            });
        } else {
            const modal = document.getElementById('chatbot-modal');
            modal.appendChild(loader); // desktop — inside chat window
            Object.assign(loader.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '1000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.85)',
            });
        }
    }

    function hideChatLoader() {
        const loader = document.getElementById('chat-loader');
        if (loader) loader.remove();
    }

   async function loadPastMessages(sessionID) {
    try {
        const res = await fetch(`${DB_API}/get_message?session_id=${sessionID}`);
        const messages = await res.json();

        // Check if previous messages exist
        const hasMessages = Array.isArray(messages) && messages.length > 0;

        // Show loader ONLY when there are past messages to load
        if (hasMessages) {
            showChatLoader();

            // Smooth UX delay while loader is visible
            await new Promise(r => setTimeout(r, 300));

            // ---------------------------------------
            // 1️⃣ LOAD OLD MESSAGES (if any)
            // ---------------------------------------
            messages.forEach(msg => {
                const formatted = formatResponse(msg.message);

                const messageContainerDiv = document.createElement('div');

                // Apply correct styling
                if (msg.role === 'user') {
                    messageContainerDiv.className = 'message user';
                } else if (msg.role === 'bot') {
                    messageContainerDiv.className = 'response-container';
                }

                messageContainerDiv.innerHTML = formatted;

                // Add follow-up questions ONLY for bot messages
                if (msg.role === 'bot') {
                    const followUpElement = createFollowUpQuestions("");
                    if (followUpElement) {
                        messageContainerDiv.appendChild(followUpElement);
                    }
                }

                messageContainer.appendChild(messageContainerDiv);
            });
        }

        // ---------------------------------------
        // 2️⃣ ALWAYS ADD WELCOME MESSAGE
        // ---------------------------------------
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'response-container welcome-msg';

        // Your welcome text
        welcomeDiv.innerHTML = formatResponse("Welcome to RINGS & I!💍");

        // Append welcome message at bottom
        messageContainer.appendChild(welcomeDiv);

        // ---------------------------------------
        // 3️⃣ SCROLL TO BOTTOM
        // ---------------------------------------
        scrollToBottom();

    } catch (err) {
        console.error("Failed to load past messages:", err);
    } finally {
        // hideChatLoader() is safe to call even if loader wasn't shown
        hideChatLoader();
    }
}


    // Backend API call
    async function callBackend(question) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ question, session_id: sessionId  }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text().catch(() => '');
                throw new Error(`API ${response.status} ${response.statusText} – ${errText.slice(0, 200)}`);
            }

            const data = await response.json();
            return data.answer;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // Conversation history tracking
    let conversationHistory = {
        askedQuestions: [],    // Tracks all asked questions
        currentTopics: []      // Tracks detected topics
    };

    // Follow-up questions mapping
    const FOLLOW_UP_QUESTIONS = {
        "What is RINGS & I?": [
            "Why is RINGS & I different?",
            "Can I Book a Free Consultation"
        ],
        "Where is Your Studio Location?": [
            "How to Reach the Studio Location?",
            "Can I Book an Appointment Now"
        ],
        "What Are Your Working Days?": [
            "Tell Me Available Time Slots",
            "Can I Book a Visit Now",
            "Do You Take Online Appointments?"
        ],
        "Diiference between Natural or Lab-Grown Diamonds?": [
            "Price Difference in Natural or Lab-Grown Diamonds",
            "Can I Choose My Diamond Type?",
            "Can I View Certification Info"
        ],
        "What's the Price Range for Diamond Rings?": [
            "What Affects the Price?",
            "See Designs by Budget"
        ],
        "Which Metals Do You Use?": [
            "Can i Mix Metal Colors?",
            "Which Metal is Best for Daily Wear?",
            "Gold vs Platinum What to Choose?"
        ],
        "Which Metal Purities Do You Offer?": [
            "Which Carat Is Better?",
            "Can I Choose Based on Budget?",
            "Gold or Platinum Which Lasts Longer?"
        ],
        "What is the Delivery Time?": [
            "Can You Deliver Faster?",
            "Can I Track My Order?",
        ],
        "Do You Have Engagement Rings?": [
            "Show Available Engagement Rings",
            "Are your Engagement Rings Certified?",
            "How much do Engagement Rings cost at RINGS & I?"
        ],
        "Can I Personalise My Ring?": [
            "How Does Personalization Work?",
            "See Past Personalise Designs",
            "Can I Talk to your Ring Designer"
        ],
        "How Can I Book an Appointment?": [
            "Book Appointment in Pune Studio",
            "Book Appointment in Mumbai Studio",
            "What happens during an Appointment?",
            "Can I Reschedule Later?"
        ],
        "*": [
            "What's the difference between Natural and Lab-grown Diamonds?",
            "What Affects the Price of Rings?",
            "Can I see some Engagement Ring Designs?",
            "How do I Book an Appointment?",
            "Where's your Studio Location?",
            "What Metals do you work with?",
            "How do I choose the right Diamond?",
            "Do you offer Payment Plans?"
        ]
    };

    const TOPIC_FOLLOWUPS = {
        'diamond': [
            "How do the 4Cs affect Diamond Quality?",
            "Can I see Certified Diamonds?",
            "Which Diamond Shape looks Largest?",
            "What's better - Round or Oval Cut?",
            "How to check Diamond Authenticity?"
        ],
        'price': [
            "What is your Ring Prices?",
            "Do you offer Payment Plans?",
            "How can I get the best value?",
            "Why are your Prices lower than others?",
            "Can I see Rings by Price Range?"
        ],
        'Personalization': [
            "Can I Engrave my Ring?",
            "What Metal finishes are Available?",
            "Can I change the Center Stone?",
            "How long does Personalisation take?",
            "Can I see examples of Personalise Rings?"
        ],
        'delivery': [
            "How safe is Shipping?",
            "Do you offer International Delivery?",
            "Can I get same-day delivery?",
            "What's your packaging like?",
            "Can someone else receive my order?"
        ],
        'appointment': [
            "What happens during an Appointment?",
            "How long does it last?",
            "Can I do a Virtual Appointment?",
            "What should I bring to my Appointment?",
            "Can I Reschedule my Appointment?"
        ],
        // ... add other topics as needed
    };

    // Initialize chat
    function initChat() {
        console.log("Initializing chat...");
        
        adjustForSmallScreens();
        window.addEventListener('resize', adjustForSmallScreens);

        let hasLoadedMessages = false;
        
        // Toggle modal - FIXED
        chatbotIcon.addEventListener('click', function () {
            console.log("Chat icon clicked");
            const isOpening = chatbotModal.style.display === 'none' || chatbotModal.style.display === '';
            if (isOpening) {
                publishShopifyEvent("chatbot_opened", {
                    session_id: sessionId
                });
            }

            chatbotModal.style.display = isOpening ? 'flex' : 'none';
            chatbotIcon.style.display = isOpening ? 'none' : 'flex';

            if (window.innerWidth < 450) {
                document.body.style.overflow = isOpening ? 'hidden' : '';
            }

            if (isOpening) {
                contentArea.scrollTop = 0;
                if (!hasLoadedMessages && sessionId) {
                    hasLoadedMessages = true;
                    loadPastMessages(sessionId);
                }
            }
        });

        closeButton.addEventListener('click', function () {
            chatbotModal.style.display = 'none';
            chatbotIcon.style.display = 'flex';
            if (window.innerWidth < 450) {
                document.body.style.overflow = '';
            }
        });

        // See more/less functionality
        if (seeMoreBtn && seeLessBtn) {
            seeMoreBtn.addEventListener('click', function () {
                document.querySelector('.prompt-box').style.border = 'none';
                document.querySelector('.prompt-box').style.boxShadow = 'none';
                document.querySelector('.prompt-box').style.background = 'transparent';
                document.querySelector('.prompt-box').style.padding = '0';

                document.querySelector('.initial-options').style.display = 'none';
                expandedOptions.style.display = 'grid';
            });

            seeLessBtn.addEventListener('click', function () {
                document.querySelector('.prompt-box').style.border = '1px solid #222';
                document.querySelector('.prompt-box').style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                document.querySelector('.prompt-box').style.background = '#ffffff';
                document.querySelector('.prompt-box').style.padding = '20px 16px';

                document.querySelector('.initial-options').style.display = 'grid';
                expandedOptions.style.display = 'none';
            });
        }

        // Handle option button clicks
        const chatOptions = document.querySelectorAll('.chat-option:not(.see-more):not(.see-less)');
        chatOptions.forEach(option => {
            option.addEventListener('click', function () {
                // Reset audio flag for button clicks
                pendingAudioFlag = false;
                processUserMessage(this.textContent.trim());
            });
        });

        // Handle text input with Enter key - FIXED
        chatInput.addEventListener('keydown', e => { 
            if (e.key === 'Enter') {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;
                
                // Get the current audio flag and reset it
                const isAudio = pendingAudioFlag;
                pendingAudioFlag = false;
                
                chatInput.value = "";
                processUserMessage(text, isAudio);
            }
        });
        
        // Handle send button click
        sendButton.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (!text) return;
            
            // Get the current audio flag and reset it
            const isAudio = pendingAudioFlag;
            pendingAudioFlag = false;
            
            chatInput.value = "";
            processUserMessage(text, isAudio);
        });
        
       
        initVoiceInput();
    }

    // Handle small screens
    function adjustForSmallScreens() {
        if (window.innerWidth < 450) {
            const modal = document.getElementById('chatbot-modal');
            modal.style.right = '0';
            modal.style.left = '0';
            modal.style.bottom = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.borderRadius = '0';

            const icon = document.getElementById('chatbot-icon');
            icon.style.right = '20px';
            icon.style.bottom = '150px';

            if (modal.style.display === 'flex') {
                icon.style.display = 'none';
            } else {
                icon.style.display = 'flex';
            }

            const bubble = document.getElementById('chat-welcome-bubble');
            bubble.style.right = '20px';
            bubble.style.bottom = (parseInt(icon.style.bottom) + 70) + 'px';
        } else {
            const modal = document.getElementById('chatbot-modal');
            modal.style.right = '30px';
            modal.style.bottom = '100px';
            modal.style.width = '380px';
            modal.style.height = '580px';
            modal.style.borderRadius = '12px';

            const icon = document.getElementById('chatbot-icon');
            icon.style.right = '30px';
            icon.style.bottom = '30px';

            if (modal.style.display === 'flex') {
                icon.style.display = 'none';
            } else {
                icon.style.display = 'flex';
            }

            const bubble = document.getElementById('chat-welcome-bubble');
            bubble.style.right = '30px';
            bubble.style.bottom = '100px';
        }
    }

    // Create follow-up questions element
    function createFollowUpQuestions(userQuestion) {
        // Update conversation history
        conversationHistory.askedQuestions.push(userQuestion);
        if (conversationHistory.askedQuestions.length > 5) {
            conversationHistory.askedQuestions.shift();
        }

        // 1. Try exact matches first
        let suggestions = FOLLOW_UP_QUESTIONS[userQuestion] || [];

        // 2. If no exact matches, use topic-based suggestions
        if (suggestions.length === 0) {
            const lowerQ = userQuestion.toLowerCase();

            // Detect topics
            if (lowerQ.includes('diamond') || lowerQ.includes('gem')) {
                suggestions.push(...TOPIC_FOLLOWUPS['diamond']);
            }
            if (lowerQ.includes('price') || lowerQ.includes('cost')) {
                suggestions.push(...TOPIC_FOLLOWUPS['price']);
            }
            // Add more topic checks as needed
        }

        // 3. Always include some general follow-ups
        suggestions.push(...FOLLOW_UP_QUESTIONS['*']);

        // Process suggestions
        suggestions = [...new Set(suggestions)] // Remove duplicates
            .filter(q => !conversationHistory.askedQuestions.includes(q)) // Remove asked questions
            .slice(0, 3); // Limit to 3

        if (suggestions.length === 0) return null;

        // Create and return UI
        const container = document.createElement('div');
        container.className = 'follow-up-container';
        container.innerHTML = `
                 <div class="follow-up-title">You might also want to know:</div> 
                <div class="follow-up-grid">
                    ${suggestions.map(q =>
            `<button class="follow-up-btn">${q}</button>`
        ).join('')}
                </div>
            `;

        container.querySelectorAll('.follow-up-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const message = btn.textContent.trim();
                if (btn.disabled) return;
                btn.disabled = true;
                btn.classList.add('clicked');
                
                // Reset audio flag for follow-up questions
                pendingAudioFlag = false;
                await processUserMessage(message, false);
            });
        });
        return container;
    }

    // Normalize links in the chatbot response HTML
    function normalizeShopLink(html) {
        const SITE = 'https://www.ringsandi.com';
        const APPT_URL = `${SITE}/pages/appointment-booking`;   // Your live page
        const VAPPT_URL = `${SITE}/pages/virtual-appointment`;    // change/remove if not used
        const BROWSE_URL = `${SITE}/collections`;

        // Map legacy/variant slugs → canonical appointment page
        const SLUG_FIXES = {
            // '/appointments': '/pages/appointments',
            // '/appointment': '/pages/appointment-booking',
             '/book-appointment': '/pages/appointment-booking',
            '/book-consultation': '/pages/appointment-booking',
            '/consultation': '/pages/appointment-booking',
            // '/pages/appointments': '/pages/appointment-booking',
            // '/pages/appointment': '/pages/appointment-booking',
            '/pages/appointment-booking': '/pages/appointment-booking', // idempotent
        };

        const container = document.createElement('div');
        container.innerHTML = html;
        const fullText = container.textContent || '';

        // Choose a safe URL when the AI gave (#)
        const pickURL = (label, context) => {
            const l = (label || '').toLowerCase();
            const c = (context || '').toLowerCase();
            if (/virtual/.test(l) || /virtual appointment/.test(c)) return VAPPT_URL;
            if (/(appointment|consult)/.test(l) || /book( a)? (free )?consult/.test(c)) return APPT_URL;
            if (/(browse|design|ring|collection|product)/.test(l)) return BROWSE_URL;
            return ''; // no safe guess
        };

        container.querySelectorAll('a').forEach(a => {
            let href = (a.getAttribute('href') || '').trim();
            let label = (a.textContent || '').trim();

            // Fill placeholder links
            if (!href || href === '#' || href === '#/') {
                const guess = pickURL(label, fullText);
                if (!guess) { a.replaceWith(document.createTextNode(label)); return; }
                href = guess;
            }

            // Make absolute URL
            if (href.startsWith('/')) href = SITE + href;
            if (!/^https?:\/\//i.test(href)) href = 'https://' + href;

            // Internal links: apply slug fix + add return=chatbot
            try {
                const u = new URL(href, SITE);
                if (u.hostname.endsWith('ringsandi.com')) {
                    const fixedPath = SLUG_FIXES[u.pathname] || u.pathname;
                    const canon = `${u.origin}${fixedPath}${u.search}${u.hash}`;
                    const u2 = new URL(canon);
                    u2.searchParams.set('return', 'chatbot');
                    href = u2.toString();
                }
            } catch { /* ignore parse errors */ }

            // Improve vague labels like "here"
            if (/^\s*(?:click\s*)?here\s*$/i.test(label)) {
                if (/virtual/i.test(href)) label = 'Book a virtual appointment';
                else if (/(appointment|consult)/i.test(href)) label = 'Book an appointment';
                else if (/(collections|products|ring)/i.test(href)) label = 'Browse rings';
                else label = 'Learn more';
                a.textContent = label;
            }

            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
            a.classList.add('response-link', 'highlight-link');
        });

        return container.innerHTML;
    }

    // Format the response with professional styling and points
    function formatResponse(text) {
        let html = String(text || '');

        const KEYWORDS = [
        "RINGS & I",
        "Ring",
        "Diamond Rings",
        "Rings",
        "Gold",
        "14KT",
        "18KT",
        "Platinum",
        "Platinum",
        "P950",
        "Color",
        "Tone",
        "Purity",
        "Clarity",
        "Certifications",
        "Certifed",
        "Craft",
        "crafting",
        "Designed",
        "Design",
        "4C",
        "4Cs",
        "Experts",
        "Expert",
        "Alloys",
        "Hypoallergenic",
        "Purities",
        "Quality",
        "Metal",
        "Small",
        "Smaller",
        "Weight",
        "Size",
        "Appointment",
        "Location",
        "Authenticity",
        "Diamonds",
        "Diamond",
        "Exchange",
        "Buy-Back",
        "Styles",
        "Style",
        "Pricing",
        "Tier",
        "Buy-back",
        "Lifetime",
        "Personality",
        "Lifestyle",
        "Natural",
        "Certification",
        "Occasion",
        "Occasions",
        "Studio",
        "Studio Appointment",
        "Appointment Booking",
        "Personalised",
        "Make-To-Order",
        "Natural Diamonds",
        "Lab-Grown Diamonds",
        "BIS",
        "Hallmarked",
        "GIA",
        "IGI",
        "SGL"
        ];


        // 1) Convert **bold** to <strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // 2) Convert [label](url) to anchors
        html = html.replace(/\[([\s\S]+?)\]\((.*?)\)/g, (m, label, url) => {
            const u = (url || '').trim();
            if (!u || u === '#' || u === '#/') return label; // no placeholder links
            return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="response-link highlight-link">${label}</a>`;
        });

        html = html.replace(
        /(^|[^">])(https?:\/\/[^\s<]+)/g,
        (match, prefix, url) =>
            `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="response-link highlight-link">Explore here</a>`
        );

        // 3) Normalize links (standardize domain, add ?return=chatbot, etc.)
        html = normalizeShopLink(html);

        html = html
        .replace(/(^|[^>])(\d+\s*KT)/gi, (m,p,v)=>`${p}<strong>${v}</strong>`);
        
        // Bold only defined keywords, keep links safe
        KEYWORDS.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(<a\\b[^>]*>[\\s\\S]*?<\\/a>)|\\b${escaped}\\b`, 'gi');
        html = html.replace(regex, (m, link) => link ? link : `<strong>${word}</strong>`);
        });



        html = html.replace(/(<a\b[^>]*>[\s\S]*?<\/a>)|(Rings\s*&\s*I)|(\b[A-Z][A-Za-z-]*\b|\b\d+\b|&amp;|%)/g,(m,l,r,t)=>l?l:r?'<strong>Rings&I</strong>':t==='&amp;'?'<strong>&</strong>':`<strong>${t}</strong>`);

        // 4) Build proper lists so you don't get "• 1." double bullets
        const lines = html.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const isOrdered = lines.length > 1 && lines.every(l => /^\d+\.\s+/.test(l));
        const isUnordered = !isOrdered && lines.length > 1 && lines.every(l => /^[-*•]\s+/.test(l));

        if (isOrdered) {
            const items = lines.map(l => l.replace(/^\d+\.\s+/, ''));
            return `<div class="response-content"><ol>${items.map(i => `<li>${i}</li>`).join('')}</ol></div>`;
        }
        if (isUnordered) {
            const items = lines.map(l => l.replace(/^[-*•]\s+/, ''));
            return `<div class="response-content"><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
        }

        // Default: single paragraph, no injected bullets
        return `<div class="response-content">${lines.join('<br>')}</div>`;
    }

    function applySeeMore(container) {
    const content = container.querySelector('.response-content');
    if (!content) return;

    // Clone to measure real height
    const clone = content.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.display = 'block';
    clone.style.webkitLineClamp = 'unset';
    clone.style.maxHeight = 'none';

    document.body.appendChild(clone);

    const lineHeight = parseFloat(getComputedStyle(content).lineHeight);
    const lines = Math.round(clone.scrollHeight / lineHeight);

    document.body.removeChild(clone);

    // 🔥 Only if more than 5 lines
    if (lines <= 5) return;

    content.classList.add('collapsed');

    const toggle = document.createElement('div');
    toggle.className = 'response-toggle';
    toggle.textContent = 'See more';

    toggle.addEventListener('click', () => {
        const collapsed = content.classList.toggle('collapsed');
        toggle.textContent = collapsed ? 'See More' : 'See Less';
    });

    container.appendChild(toggle);
    }



    let messageQueue = [];
    let isProcessing = false;

    async function processUserMessage(message, isAudio = false) {
        if (!message || !message.trim()) return;

        messageQueue.push({ text: message.trim(), isAudio });
        if (!isProcessing) processNextMessage();
    }

    // Helper: Validate user message
    async function processNextMessage() {
        if (messageQueue.length === 0) {
            isProcessing = false;
            return;
        }

        isProcessing = true;
        const { text: message, isAudio } = messageQueue.shift();

        // 1. Display user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user';
        userMessageDiv.innerHTML = formatResponse(message);
        
        // No voice indicator in UI - just tracking in database
        
        messageContainer.appendChild(userMessageDiv);
        scrollToBottom(150);

        // 2. Save user message
        await saveMessage(sessionId, 'user', stripHtml(message), isAudio);

        // 3. Add typing indicator
        const typingId = `typing-${Date.now()}`;
        addTypingIndicator(typingId);

        try {
            // 4. Call backend
            const [botReply] = await Promise.all([
                callBackend(message),
                new Promise(r => setTimeout(r, 100)) // typing effect
            ]);

            // 5. Remove typing
            removeTypingIndicator(typingId);

            // 6. Display bot reply
        
            const responseContainer = document.createElement('div');
            responseContainer.className = 'response-container';

            let cleanedReply = formatResponse(botReply);

            // Remove ONLY spaces before a dot (safe)
            cleanedReply = cleanedReply.replace(/(\s+)\./g, ".");

            responseContainer.innerHTML = cleanedReply;
            messageContainer.appendChild(responseContainer);

            // ✅ Apply See more / See less
            applySeeMore(responseContainer);

            // 7. Save bot reply with the same audio flag as the user message
            await saveMessage(sessionId, 'bot', stripHtml(botReply), isAudio);

            // 8. Add follow-ups
            const followUpElement = createFollowUpQuestions(message);
            if (followUpElement) responseContainer.appendChild(followUpElement);

            scrollToBottom(150);

        } catch (err) {
            removeTypingIndicator(typingId);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message bot';
            errorDiv.textContent =
                err.name === "AbortError"
                    ? "Could you please clarify? So, I'll do my best to help."
                    : "Could you please clarify? So, I'll do my best to help.";
            messageContainer.appendChild(errorDiv);
            await saveMessage(sessionId, 'bot', errorDiv.textContent, isAudio);
            scrollToBottom();
        }
        processNextMessage();
    };

    // Check for previously granted permission on page load
    function checkMicrophonePermission() {
        const savedPermission = localStorage.getItem('microphonePermission');
        if (savedPermission) {
            microphonePermission = savedPermission;
            
        }
        
        // Reset permissionAskedThisSession on page load
        permissionAskedThisSession = false;
    }

    // Request microphone permission only when needed and release it when done
    async function getMicrophonePermission() {
        // If permission was already granted, return true without requesting again
        if (microphonePermission === 'granted') {
            
            return true;
        }
        
        // If permission was denied and we've already asked in this session, don't ask again
        if (microphonePermission === 'denied' && permissionAskedThisSession) {
            throw new Error('Microphone permission was denied. Please enable it in your browser settings to use voice input.');
        }

        try {
            
            // Request permission and get the stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphonePermission = 'granted';
            
            // Store the permission state in localStorage permanently
            localStorage.setItem('microphonePermission', 'granted');
            
            
            // Mark that we've asked for permission in this session
            permissionAskedThisSession = true;
            
            // Stop all tracks to release the microphone immediately
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            // Check error type
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                microphonePermission = 'denied';
                
                // Mark that we've asked for permission in this session
                permissionAskedThisSession = true;
                
                // Don't permanently store denied permission - it will reset on page refresh
                // This allows asking again on refresh
                console.log('Microphone permission denied');
                
                throw new Error('Microphone permission was denied. Please enable it in your browser settings to use voice services.');
            } else {
                // Other types of errors
                
                throw new Error('Error accessing microphone: ' + error.message);
            }
        }
    }

    // Show notification with instructions
    function showNotificationWithInstructions(message, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    // Show notification function
    function showNotification(message) {
        showNotificationWithInstructions(message, 3000);
    }
   
    function initVoiceInput() {
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let isProcessing = false;
        let originalPlaceholder = chatInput.placeholder;
        let microphoneStream = null; // Store the stream to properly close it
        let previousInputText = ""; // Store the previous input text

        // Check for previously granted permission
        checkMicrophonePermission();

        // Voice button click handler
        voiceButton.addEventListener('click', async () => {
            if (!isRecording && !isProcessing) {
                try {
                    // Check if we have permission first
                    const hasPermission = await getMicrophonePermission();
                    
                    if (hasPermission) {
                        // Store the current input text before starting voice input
                        previousInputText = chatInput.value;
                        
                        // Clear the input field during recording
                        chatInput.value = "";
                        
                        // Get microphone stream only when starting to record
                        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaRecorder = new MediaRecorder(microphoneStream);
                        
                        mediaRecorder.ondataavailable = event => {
                            audioChunks.push(event.data);
                        };
                        
                        mediaRecorder.onstop = async () => {
                            // Stop all tracks to release the microphone
                            if (microphoneStream) {
                                microphoneStream.getTracks().forEach(track => track.stop());
                                microphoneStream = null;
                            }
                            
                            // Process the recorded audio
                            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                            audioChunks = [];
                            
                            // Hide recording indicator
                            voiceButton.classList.remove('recording');
                            
                            // Show processing state
                            isProcessing = true;
                            chatInput.classList.remove('listening');
                            chatInput.classList.add('processing');
                            chatInput.placeholder = 'Processing...';
                            chatInput.readOnly = true;
                            
                            // Disable send button during processing
                            sendButton.disabled = true;
                            
                            try {
                                // Send audio to speech-to-text API
                                const formData = new FormData();
                                formData.append('audio', audioBlob, 'recording.webm');
                                // Add session_id to the form data
                                formData.append('session_id', sessionId);
                                
                                const response = await fetch(SPEECH_API, {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                // Get response as text first to debug
                                const responseText = await response.text();
    
                                // Try to parse as JSON
                                let result;
                                try {
                                    result = JSON.parse(responseText);
                                } catch (e) {
                                    console.error('Failed to parse JSON response:', e);
                                    throw new Error('Invalid response format from speech-to-text API');
                                }
                                
                                // Check if the response contains the expected field
                                let transcribedText = '';
                                if (result && result.transcribed_text) {
                                    transcribedText = result.transcribed_text;
                                } else if (result && result.text) {
                                    transcribedText = result.text;
                                } else if (result && typeof result === 'string') {
                                    transcribedText = result;
                                } else {
                                    console.error('Unexpected response format:', result);
                                    throw new Error('No transcribed text found in response');
                                }
                                
                                // Reset input field
                                chatInput.classList.remove('processing');
                                chatInput.placeholder = originalPlaceholder;
                                chatInput.readOnly = false;
                                
                                if (transcribedText && transcribedText.trim() !== '') {
                                    transcribedText = transcribedText.trim();
                                    
                                    // Check if the error message "Could not hear you" is in the response
                                    const isErrorMessage = transcribedText.toLowerCase().includes('could not hear you');
                                    
                                    if (isErrorMessage) {
                                        // If it's an error message, restore the original text
                                        chatInput.value = previousInputText;
                                        
                                        // Show the error notification positioned higher
                                        voiceSuccess.textContent = 'Could not hear you, please try again';
                                        voiceSuccess.classList.add('show');
                                        setTimeout(() => {
                                            voiceSuccess.classList.remove('show');
                                        }, 3000); // Show for 3 seconds
                                    } else {
                                        // Only restore and append if it's not an error message
                                        const combinedText = previousInputText + (previousInputText ? ' ' : '') + transcribedText;
                                        chatInput.value = combinedText;
                                        
                                        // Set the audio flag to true for this input
                                        pendingAudioFlag = true;
                                    }
                                    
                                    // Focus on the input field so user can edit if needed
                                    chatInput.focus();
                                } else {
                                    // Reset input field
                                    chatInput.classList.remove('processing');
                                    chatInput.placeholder = originalPlaceholder;
                                    chatInput.readOnly = false;
                                    
                                    // Restore the previous text if no speech was detected
                                    chatInput.value = previousInputText;
                                    
                                    // Show no speech detected message positioned higher
                                    voiceSuccess.textContent = 'Could not hear you, please try again';
                                    voiceSuccess.classList.add('show');
                                    setTimeout(() => {
                                        voiceSuccess.classList.remove('show');
                                    }, 3000); // Show for 3 seconds
                                }
                            } catch (error) {
                                console.error('Error converting speech to text:', error);
                                
                                // Reset input field
                                chatInput.classList.remove('processing');
                                chatInput.placeholder = originalPlaceholder;
                                chatInput.readOnly = false;
                                
                                // Restore the previous text if there was an error
                                chatInput.value = previousInputText;
                                
                                // Always show the same error message positioned higher
                                voiceSuccess.textContent = 'Could not hear you, please try again';
                                voiceSuccess.classList.add('show');
                                setTimeout(() => {
                                    voiceSuccess.classList.remove('show');
                                }, 3000); // Show for 3 seconds
                            } finally {
                                // Re-enable send button
                                sendButton.disabled = false;
                                
                                // Reset processing state
                                isProcessing = false;
                            }
                        };
                        
                        // Start recording
                        mediaRecorder.start();
                        isRecording = true;
                        
                        // Show recording indicator
                        voiceButton.classList.add('recording');
                        
                        // Update input field to show listening state
                        chatInput.classList.add('listening');
                        chatInput.placeholder = 'Listening...';
                        chatInput.readOnly = true;
                        
                        // Disable send button during recording
                        sendButton.disabled = true;
                    }
                } catch (error) {
                    console.error('Error accessing microphone:', error);
                    
                    // Provide more friendly error messages
                    if (error.message.includes('permission was denied')) {
                        // Show a more detailed prompt with instructions
                        showNotificationWithInstructions(
                            'Microphone access was denied. Click the lock icon in your address bar and allow microphone access.',
                            5000
                        );
                    } else {
                        showNotification('Failed to access microphone. Please check your permissions.');
                    }
                }
            } else if (isRecording) {
                // Stop recording
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    isRecording = false;
                }
            }
        });
    }
    
    // Initialize
    initChat();
});

