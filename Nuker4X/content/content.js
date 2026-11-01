(async function() {
    // Fetching settings
    const filterlist = await getSettings();

    function checkProfile(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return filterlist.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    async function getSettings() {
        const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
        const result = await storage.local.get('blockedKeywords');
        return result.blockedKeywords || ['🇺🇦', '🇪🇺', 'fella', 'nafo', 'UA'];
    }

    function removeAnnoyingComments() {
        // Target elements that X uses for comment blocks & timeline entries
        const comments = document.querySelectorAll('[data-testid="cellInnerDiv"], article[role="article"]');

        comments.forEach(comment => {
            if (comment.hasAttribute('data-comment-filtered')) return;

            // Target the block containing the username and handle, hopefully
            const userBlock = comment.querySelector('[data-testid="User-Name"]');

            if (userBlock) {
                const userIdentityText = userBlock.innerText; // Contains "Name \n @handle"

                if (checkProfile(userIdentityText)) {
                    // Hide the comment
                    comment.style.setProperty('display', 'none', 'important');
                }
            }

            // Mark already filtered
            comment.setAttribute('data-comment-filtered', 'true');
        });
    }

    // Checking immediately and frequently
    removeAnnoyingComments();

    // Trim X's aggressive l-load/scroll
    const observer = new MutationObserver(() => {
        removeAnnoyingComments();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
