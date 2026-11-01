(async function() {
    console.log("[X-Filter] Script injected into page context. Initializing...");

    // Browser-agnostic storage retrieval
    async function getSettings() {
        console.log("[X-Filter] Attempting to load keywords from storage...");
        const defaultKeywords = ['🇺🇦', '🇪🇺', 'fella', 'nafo', 'UA'];

        try {
            // Check for Firefox WebExtensions API
            if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                console.log("[X-Filter] Detected Firefox storage API interface.");
                const result = await browser.storage.local.get('blockedKeywords');
                return result.blockedKeywords || defaultKeywords;
            }
            // Fallback for Chromium instances
            else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                console.log("[X-Filter] Detected Chrome storage API interface.");
                return new Promise((resolve) => {
                    chrome.storage.local.get('blockedKeywords', (result) => {
                        resolve(result.blockedKeywords || defaultKeywords);
                    });
                });
            }
            console.warn("[X-Filter] No storage API detected. Using fallback default array.");
            return defaultKeywords;
        } catch (e) {
            console.error("[X-Filter] Storage exception caught. Falling back to defaults:", e);
            return defaultKeywords;
        }
    }

    // Await settings safely
    let filterlist;
    try {
        filterlist = await getSettings();
        console.log("[X-Filter] Active filter keywords loaded:", filterlist);
    } catch (err) {
        console.error("[X-Filter] Fatal crash during keyword assignment:", err);
        return; // Stop execution to prevent cascading errors
    }

    function checkProfile(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return filterlist.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    function removeRetardedComments() {
        // Target elements that X uses for comment blocks & timeline entries
        const comments = document.querySelectorAll('[data-testid="cellInnerDiv"], article[role="article"]');

        comments.forEach(comment => {
            const userBlock = comment.querySelector('[data-testid="User-Name"]');

            if (userBlock) {
                // Get raw text data (usernames, handles)
                let userIdentityText = userBlock.innerText ? userBlock.innerText.trim() : "";

                // Fix for these stupid X emoji images inside the nickname
                const emojis = userBlock.querySelectorAll('img[alt], img[title]');
                emojis.forEach(emojiImg => {
                    const emojiAlt = emojiImg.getAttribute('alt') || "";
                    const emojiTitle = emojiImg.getAttribute('title') || "";

                    // Append attributes to the evaluation text block
                    userIdentityText += " " + emojiAlt + " " + emojiTitle;
                });

                // Not populated, skip cycle
                if (!userIdentityText.trim()) return;

                // Already checked
                if (comment.getAttribute('data-comment-filtered') === 'true') return;

                if (checkProfile(userIdentityText)) {
                    console.log("[X-Filter] Target locked! Removing potential retard:", userIdentityText.replace(/\n/g, " | "));

                    // Actual nuking here
                    comment.style.setProperty('display', 'none', 'important');
                    comment.style.setProperty('visibility', 'hidden', 'important');
                    comment.style.setProperty('height', '0px', 'important');
                    comment.style.setProperty('padding', '0px', 'important');
                    comment.style.setProperty('margin', '0px', 'important');
                    comment.style.setProperty('opacity', '0', 'important');
                }

                // Mark as filtered
                comment.setAttribute('data-comment-filtered', 'true');
            }
        });
    }


    // Initialization engine synchronized
    function init() {
        console.log("[X-Filter] Document ready. Attaching DOM MutationObserver...");

        // Initial pass
        removeRetardedComments();

        // 60ms debounce for infinite scroll layout
        let timeout;
        const observer = new MutationObserver(() => {
            clearTimeout(timeout);
            timeout = setTimeout(removeRetardedComments, 60);
        });

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log("[X-Filter] MutationObserver successfully listening to timeline events.");
        } else {
            console.error("[X-Filter] Setup failed: document.body missing during initialization phase.");
        }
    }

    // Execute immediately or defer to full load state
    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        window.addEventListener("DOMContentLoaded", init);
    }
})();

