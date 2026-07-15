// Command: Use one localStorage key for all frontend-only manga posts.
const MANGA_STORAGE_KEY = 'bpPanelsMangaPosts';

// Command: Use one localStorage key for like/comment/share/save button states.
const MANGA_ACTIONS_KEY = 'bpPanelsMangaActions';

// Command: Keep the selected publish panels in the order chosen by the creator.
let selectedPublishPanels = [];

// Command: Create demo manga so the feed still has cards before the user publishes anything.
const demoMangaPosts = [
    {
        id: 'demo-first-panel',
        mangaName: 'The First Panel',
        creatorName: 'BP Studio',
        genre: 'Action',
        description: 'A sample manga card for testing the interactive feed, manga details page, and reader page.',
        panels: []
    },
    {
        id: 'demo-city-ink',
        mangaName: 'City of Ink',
        creatorName: 'Ink Runner',
        genre: 'Drama',
        description: 'Creators can share chapters and build an audience here.',
        panels: []
    },
    {
        id: 'demo-paper-moons',
        mangaName: 'Paper Moons',
        creatorName: 'Moon Shelf',
        genre: 'Fantasy',
        description: 'Click this card to open the manga description page first. Then press Read to open the panels.',
        panels: []
    }
];

// Command: Find the fixed header in the page.
const header = document.querySelector('.header');

// Command: Use the html element to share the header state with CSS.
const root = document.documentElement;

// Command: Remember the last scroll position so we can detect scroll direction.
let lastScrollY = window.scrollY;

// Command: Prevent the scroll event from running too many layout updates at once.
let ticking = false;

// Command: Hide the header when scrolling down, and show it again when scrolling up.
function updateHeader() {
    const currentScrollY = window.scrollY;
    const scrollingUp = currentScrollY < lastScrollY;
    const nearTop = currentScrollY <= 10;
    const shouldHideHeader = !scrollingUp && !nearTop;

    header.classList.toggle('header--hidden', shouldHideHeader);
    root.classList.toggle('header-is-hidden', shouldHideHeader);

    lastScrollY = Math.max(currentScrollY, 0);
    ticking = false;
}

// Command: Listen for page scrolling and update the header smoothly.
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
    }
}, { passive: true });

// Command: Safely read manga posts from localStorage.
function getStoredMangaPosts() {
    const savedPosts = localStorage.getItem(MANGA_STORAGE_KEY);

    if (!savedPosts) {
        return [];
    }

    try {
        return JSON.parse(savedPosts);
    } catch (error) {
        console.warn('Could not read saved manga posts:', error);
        return [];
    }
}

// Command: Save manga posts back into localStorage.
function saveMangaPosts(posts) {
    localStorage.setItem(MANGA_STORAGE_KEY, JSON.stringify(posts));
}

// Command: Safely read social action data from localStorage.
function getMangaActions() {
    const savedActions = localStorage.getItem(MANGA_ACTIONS_KEY);

    if (!savedActions) {
        return {};
    }

    try {
        return JSON.parse(savedActions);
    } catch (error) {
        console.warn('Could not read manga action data:', error);
        return {};
    }
}

// Command: Save social action data back into localStorage.
function saveMangaActions(actions) {
    localStorage.setItem(MANGA_ACTIONS_KEY, JSON.stringify(actions));
}

// Command: Create default action state for a manga card.
function getActionState(mangaId) {
    const actions = getMangaActions();

    return actions[mangaId] || {
        liked: false,
        saved: false,
        likes: 0,
        shares: 0,
        comments: []
    };
}

// Command: Update one manga action state and save it.
function updateActionState(mangaId, updater) {
    const actions = getMangaActions();
    const currentState = getActionState(mangaId);
    actions[mangaId] = updater(currentState);
    saveMangaActions(actions);
    return actions[mangaId];
}

// Command: Combine saved posts and demo posts for the homepage feed.
function getAllMangaPosts() {
    return [...getStoredMangaPosts(), ...demoMangaPosts];
}

// Command: Find one manga by id from saved posts or demo posts.
function getMangaPostById(mangaId) {
    return getAllMangaPosts().find((item) => item.id === mangaId);
}

// Command: Escape user text before putting it inside HTML.
function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Command: Create a simple placeholder cover when a manga has no uploaded image.
function createPlaceholderCover(mangaName) {
    return `
        <div class="manga-cover-placeholder">
            <span>${escapeHTML(mangaName.slice(0, 2).toUpperCase())}</span>
        </div>
    `;
}

// Command: Support both old panel strings and new panel objects with name/src.
function getPanelSource(panel) {
    return typeof panel === 'string' ? panel : panel.src;
}

// Command: Use original filename when available, otherwise create a simple fallback name.
function getPanelName(panel, index) {
    return typeof panel === 'string' ? `Panel ${index + 1}` : panel.name;
}

// Command: Render the action buttons at the bottom of each manga card.
function createCardActions(post) {
    const state = getActionState(post.id);
    const likedClass = state.liked ? ' is-active' : '';
    const savedClass = state.saved ? ' is-active' : '';

    return `
        <div class="manga-card-actions" aria-label="${escapeHTML(post.mangaName)} actions">
            <button class="card-action-button${likedClass}" type="button" data-action="like" data-manga-id="${escapeHTML(post.id)}">Like <span>${state.likes}</span></button>
            <button class="card-action-button" type="button" data-action="comment" data-manga-id="${escapeHTML(post.id)}">Comment <span>${state.comments.length}</span></button>
            <button class="card-action-button" type="button" data-action="share" data-manga-id="${escapeHTML(post.id)}">Share <span>${state.shares}</span></button>
            <button class="card-action-button${savedClass}" type="button" data-action="save" data-manga-id="${escapeHTML(post.id)}">${state.saved ? 'Saved' : 'Save'}</button>
        </div>
    `;
}

// Command: Render a Facebook-like comment section on the dedicated comments page.
function createCommentSection(post) {
    const state = getActionState(post.id);
    const commentsMarkup = state.comments.length > 0
        ? state.comments.map((comment) => `
            <div class="comment-item">
                <div class="comment-avatar">U</div>
                <div class="comment-bubble">
                    <strong>Reader</strong>
                    <p>${escapeHTML(comment)}</p>
                </div>
            </div>
        `).join('')
        : '<p class="empty-comments">No comments yet. Be the first one.</p>';

    return `
        <div class="comment-section comment-section-page" data-comment-section="${escapeHTML(post.id)}">
            <div class="comment-list">
                ${commentsMarkup}
            </div>
            <form class="comment-form" data-comment-form="${escapeHTML(post.id)}">
                <input type="text" name="comment" placeholder="Write a comment..." autocomplete="off">
                <button type="submit">Post</button>
            </form>
        </div>
    `;
}

// Command: Render one manga card in the homepage feed.
function createMangaCard(post) {
    const coverPanel = post.panels?.[0];
    const coverMarkup = post.panels?.[0]
        ? `<img class="manga-card-cover" src="${getPanelSource(coverPanel)}" alt="${escapeHTML(post.mangaName)} cover">`
        : createPlaceholderCover(post.mangaName);

    return `
        <article class="story-card manga-card" tabindex="0" data-manga-id="${escapeHTML(post.id)}" role="link" aria-label="Open details for ${escapeHTML(post.mangaName)}">
            ${coverMarkup}
            <div class="manga-card-body">
                <p class="manga-card-meta">${escapeHTML(post.genre)} · ${escapeHTML(post.creatorName)}</p>
                <h2>${escapeHTML(post.mangaName)}</h2>
                <p>${escapeHTML(post.description)}</p>
                <span class="read-more-link">View details</span>
            </div>
            ${createCardActions(post)}
        </article>
    `;
}

// Command: Go to the details page first instead of opening the reader immediately.
function openMangaDetails(mangaId) {
    window.location.href = `details.html?id=${encodeURIComponent(mangaId)}`;
}

// Command: Refresh one card's action buttons after like/comment/share/save changes.
function refreshCardActions(mangaId) {
    const post = getMangaPostById(mangaId);
    const card = Array.from(document.querySelectorAll('.manga-card')).find((item) => item.dataset.mangaId === mangaId);

    if (!post || !card) {
        return;
    }

    const actions = card.querySelector('.manga-card-actions');
    actions.outerHTML = createCardActions(post);

}

// Command: Save a comment from the dedicated comments page form.
function handleCommentSubmit(event) {
    const form = event.target.closest('.comment-form');

    if (!form) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const mangaId = form.dataset.commentForm;
    const input = form.querySelector('input[name="comment"]');
    const comment = input.value.trim();

    if (!comment) {
        return;
    }

    updateActionState(mangaId, (state) => ({
        ...state,
        comments: [...state.comments, comment]
    }));

    input.value = '';
    renderCommentsPage();
}

// Command: Handle Like, Comment, Share, and Save button clicks.
async function handleCardAction(event) {
    const button = event.target.closest('.card-action-button');

    if (!button) {
        return;
    }

    event.stopPropagation();

    const mangaId = button.dataset.mangaId;
    const action = button.dataset.action;
    const post = getMangaPostById(mangaId);

    if (!post) {
        return;
    }

    if (action === 'like') {
        updateActionState(mangaId, (state) => {
            const liked = !state.liked;
            const likes = Math.max(0, state.likes + (liked ? 1 : -1));
            return { ...state, liked, likes };
        });
    }

    if (action === 'save') {
        updateActionState(mangaId, (state) => ({ ...state, saved: !state.saved }));
    }

    if (action === 'comment') {
        window.location.href = `comments.html?id=${encodeURIComponent(mangaId)}`;
        return;
    }

    if (action === 'share') {
        const shareUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}details.html?id=${encodeURIComponent(mangaId)}`;

        updateActionState(mangaId, (state) => ({ ...state, shares: state.shares + 1 }));

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
            button.dataset.notice = 'Copied';
        } else {
            window.prompt('Copy this manga link:', shareUrl);
        }
    }

    refreshCardActions(mangaId);
}

// Command: Fill the homepage feed with interactive manga cards.
function renderMangaFeed() {
    const feed = document.querySelector('#manga-feed');

    if (!feed) {
        return;
    }

    const posts = getAllMangaPosts();
    feed.innerHTML = posts.map(createMangaCard).join('');

    feed.addEventListener('click', handleCardAction);
    feed.querySelectorAll('.manga-card').forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.card-action-button')) {
                return;
            }

            openMangaDetails(card.dataset.mangaId);
        });

        card.addEventListener('keydown', (event) => {
            if (event.target.closest('.card-action-button')) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openMangaDetails(card.dataset.mangaId);
            }
        });
    });
}

// Command: Render the dedicated comments page for one manga.
function renderCommentsPage() {
    const commentsShell = document.querySelector('#comments-shell');

    if (!commentsShell) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const mangaId = params.get('id');
    const post = getMangaPostById(mangaId);

    if (!post) {
        commentsShell.innerHTML = `
            <p class="page-kicker">Comments</p>
            <h1 class="page-title">Manga not found</h1>
            <p class="page-copy">This manga may have been deleted from this browser.</p>
            <div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>
        `;
        return;
    }

    commentsShell.innerHTML = `
        <section class="comments-page-card">
            <p class="page-kicker">${escapeHTML(post.genre)} · ${escapeHTML(post.creatorName)}</p>
            <h1 class="page-title">${escapeHTML(post.mangaName)}</h1>
            <p class="page-copy">Read and write comments for this manga.</p>
            ${createCommentSection(post)}
            <div class="action-row"><a class="secondary-action" href="details.html?id=${encodeURIComponent(post.id)}">Back to details</a><a class="secondary-action" href="index.html">Back to feed</a></div>
        </section>
    `;

    const form = commentsShell.querySelector('.comment-form');
    const input = commentsShell.querySelector('input[name="comment"]');
    form.addEventListener('submit', handleCommentSubmit);
    input.focus();
}

// Command: Convert uploaded image files into data URLs for frontend-only preview/storage.
function readImageFiles(files) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

    return Promise.all(imageFiles.map((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                src: reader.result,
                name: file.name
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }));
}

// Command: Move one item inside an array from one position to another position.
function moveArrayItem(items, fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= items.length) {
        return items;
    }

    const reorderedItems = [...items];
    const [movedItem] = reorderedItems.splice(fromIndex, 1);
    reorderedItems.splice(toIndex, 0, movedItem);
    return reorderedItems;
}

// Command: Render panel thumbnails with reorder controls before publishing.
function renderPanelPreview(previewGrid) {
    previewGrid.innerHTML = selectedPublishPanels.map((panel, index) => `
        <figure class="panel-preview" data-panel-index="${index}" draggable="true">
            <button class="panel-delete-button" type="button" data-panel-action="delete" data-panel-index="${index}" aria-label="Delete ${escapeHTML(getPanelName(panel, index))}">Delete</button>
            <img src="${getPanelSource(panel)}" alt="${escapeHTML(getPanelName(panel, index))}" data-panel-action="preview" data-panel-index="${index}">
            <figcaption>
                <span>Panel ${index + 1}</span>
                <strong title="${escapeHTML(getPanelName(panel, index))}">${escapeHTML(getPanelName(panel, index))}</strong>
                <div class="panel-order-controls" aria-label="Panel ${index + 1} order controls">
                    <button type="button" data-panel-action="up" data-panel-index="${index}" ${index === 0 ? 'disabled' : ''}>Up</button>
                    <button type="button" data-panel-action="down" data-panel-index="${index}" ${index === selectedPublishPanels.length - 1 ? 'disabled' : ''}>Down</button>
                </div>
            </figcaption>
        </figure>
    `).join('');
}

// Command: Open a larger preview so the creator can confirm which image it is.
function openPanelPreview(panel) {
    const existingModal = document.querySelector('.panel-preview-modal');

    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'panel-preview-modal';
    modal.innerHTML = `
        <div class="panel-preview-dialog" role="dialog" aria-modal="true" aria-label="${escapeHTML(panel.name)} preview">
            <button class="panel-preview-close" type="button">Close</button>
            <img src="${panel.src}" alt="${escapeHTML(panel.name)}">
            <p>${escapeHTML(panel.name)}</p>
        </div>
    `;

    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.panel-preview-close')) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// Command: Read selected files, save them in order, and show reorderable previews.
async function previewSelectedPanels(fileInput, previewGrid) {
    selectedPublishPanels = await readImageFiles(fileInput.files);
    renderPanelPreview(previewGrid);
}

// Command: Connect the publish page form to localStorage.
function setupPublishForm() {
    const form = document.querySelector('#publish-form');
    const panelInput = document.querySelector('#manga-panels');
    const previewGrid = document.querySelector('#panel-preview-grid');
    const message = document.querySelector('#publish-message');

    if (!form || !panelInput || !previewGrid) {
        return;
    }

    panelInput.addEventListener('change', () => {
        previewSelectedPanels(panelInput, previewGrid);
    });

    previewGrid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-panel-action]');

        if (!button) {
            return;
        }

        const currentIndex = Number(button.dataset.panelIndex);

        if (button.dataset.panelAction === 'preview') {
            openPanelPreview(selectedPublishPanels[currentIndex]);
            return;
        }

        if (button.dataset.panelAction === 'delete') {
            selectedPublishPanels.splice(currentIndex, 1);
            renderPanelPreview(previewGrid);
            return;
        }

        const nextIndex = button.dataset.panelAction === 'up' ? currentIndex - 1 : currentIndex + 1;
        selectedPublishPanels = moveArrayItem(selectedPublishPanels, currentIndex, nextIndex);
        renderPanelPreview(previewGrid);
    });

    previewGrid.addEventListener('dragstart', (event) => {
        const preview = event.target.closest('.panel-preview');

        if (!preview) {
            return;
        }

        preview.classList.add('is-dragging');
        event.dataTransfer.setData('text/plain', preview.dataset.panelIndex);
    });

    previewGrid.addEventListener('dragend', (event) => {
        const preview = event.target.closest('.panel-preview');

        if (preview) {
            preview.classList.remove('is-dragging');
        }
    });

    previewGrid.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    previewGrid.addEventListener('drop', (event) => {
        event.preventDefault();

        const targetPreview = event.target.closest('.panel-preview');

        if (!targetPreview) {
            return;
        }

        const fromIndex = Number(event.dataTransfer.getData('text/plain'));
        const toIndex = Number(targetPreview.dataset.panelIndex);
        selectedPublishPanels = moveArrayItem(selectedPublishPanels, fromIndex, toIndex);
        renderPanelPreview(previewGrid);
    });

    form.addEventListener('reset', () => {
        selectedPublishPanels = [];
        previewGrid.innerHTML = '';
        message.textContent = '';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const panels = selectedPublishPanels;

        if (panels.length === 0) {
            message.textContent = 'Please add at least one manga panel image.';
            return;
        }

        const newPost = {
            id: `manga-${Date.now()}`,
            mangaName: formData.get('mangaName').trim(),
            creatorName: formData.get('creatorName').trim(),
            genre: formData.get('genre'),
            description: formData.get('description').trim(),
            panels
        };

        const posts = getStoredMangaPosts();
        posts.unshift(newPost);
        saveMangaPosts(posts);

        message.textContent = 'Manga published! Returning to the home feed...';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    });
}

// Command: Render the full manga description page with a Read button.
function renderDetailsPage() {
    const detailsShell = document.querySelector('#details-shell');

    if (!detailsShell) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const mangaId = params.get('id');
    const post = getMangaPostById(mangaId);
    const state = getActionState(mangaId);

    if (!post) {
        detailsShell.innerHTML = `
            <p class="page-kicker">Manga details</p>
            <h1 class="page-title">Manga not found</h1>
            <p class="page-copy">This manga may have been deleted from this browser.</p>
            <div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>
        `;
        return;
    }

    const coverMarkup = post.panels?.[0]
        ? `<img class="details-cover" src="${getPanelSource(post.panels[0])}" alt="${escapeHTML(post.mangaName)} cover">`
        : createPlaceholderCover(post.mangaName);

    detailsShell.innerHTML = `
        <section class="details-card">
            ${coverMarkup}
            <div class="details-body">
                <p class="page-kicker">${escapeHTML(post.genre)} · ${escapeHTML(post.creatorName)}</p>
                <h1 class="page-title">${escapeHTML(post.mangaName)}</h1>
                <p class="page-copy">${escapeHTML(post.description)}</p>
                <div class="details-stats">
                    <span>${state.likes} likes</span>
                    <span>${state.comments.length} comments</span>
                    <span>${state.shares} shares</span>
                    <span>${state.saved ? 'Saved' : 'Not saved'}</span>
                </div>
                <div class="action-row">
                    <a class="primary-action" href="reader.html?id=${encodeURIComponent(post.id)}">Read</a>
                    <a class="secondary-action" href="index.html">Back to feed</a>
                </div>
            </div>
        </section>
    `;
}

// Command: Render the full page reading mode from the manga id in the URL.
function renderReaderPage() {
    const readerShell = document.querySelector('#reader-shell');

    if (!readerShell) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const mangaId = params.get('id');
    const post = getMangaPostById(mangaId);

    if (!post) {
        readerShell.innerHTML = `
            <p class="page-kicker">Reader</p>
            <h1 class="page-title">Manga not found</h1>
            <p class="page-copy">This card may have been deleted from this browser.</p>
            <div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>
        `;
        return;
    }

    const panelMarkup = post.panels.length > 0
        ? post.panels.map((panel, index) => `<figure class="reader-panel-frame"><img class="reader-panel" src="${getPanelSource(panel)}" alt="${escapeHTML(getPanelName(panel, index))}"><figcaption>${escapeHTML(getPanelName(panel, index))}</figcaption></figure>`).join('')
        : `
            <div class="reader-empty-panel">
                <p>This demo manga has no uploaded panels yet.</p>
            </div>
        `;

    readerShell.innerHTML = `
        <div class="reader-header">
            <p class="page-kicker">${escapeHTML(post.genre)} · ${escapeHTML(post.creatorName)}</p>
            <h1 class="page-title">${escapeHTML(post.mangaName)}</h1>
            <p class="page-copy">${escapeHTML(post.description)}</p>
            <div class="action-row"><a class="secondary-action" href="details.html?id=${encodeURIComponent(post.id)}">Back to details</a><a class="secondary-action" href="index.html">Back to feed</a></div>
        </div>
        <div class="reader-panels" aria-label="${escapeHTML(post.mangaName)} manga panels">
            ${panelMarkup}
        </div>
    `;
}

// Command: Start page-specific JavaScript after the document is ready.
renderMangaFeed();
setupPublishForm();
renderDetailsPage();
renderReaderPage();
renderCommentsPage();
