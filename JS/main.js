// Command: These names are used to save data in the browser.
var MANGA_STORAGE_KEY = 'bpPanelsMangaPosts';
var MANGA_ACTIONS_KEY = 'bpPanelsMangaActions';

// Command: This array keeps the selected image panels before publishing.
var selectedPublishPanels = [];

// Command: Demo cards show on the feed before the user publishes anything.
var demoMangaPosts = [
    {
        id: 'demo-first-panel',
        mangaName: 'The First Panel',
        creatorName: 'BP Studio',
        genre: 'Action',
        description: 'A sample manga card for testing the interactive feed, details page, and reader page.',
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

// Command: Find a parent element by class name.
function findParentWithClass(element, className) {
    while (element && element !== document) {
        if (element.classList && element.classList.contains(className)) {
            return element;
        }

        element = element.parentNode;
    }

    return null;
}

// Command: Find a parent element that has a specific attribute.
function findParentWithAttribute(element, attributeName) {
    while (element && element !== document) {
        if (element.getAttribute && element.getAttribute(attributeName) !== null) {
            return element;
        }

        element = element.parentNode;
    }

    return null;
}

// Command: Make text safe before putting it inside HTML.
function escapeHTML(value) {
    value = String(value);
    value = value.replace(/&/g, '&amp;');
    value = value.replace(/</g, '&lt;');
    value = value.replace(/>/g, '&gt;');
    value = value.replace(/"/g, '&quot;');
    value = value.replace(/'/g, '&#039;');
    return value;
}

// Command: Read saved manga posts from localStorage.
function getStoredMangaPosts() {
    var savedPosts = localStorage.getItem(MANGA_STORAGE_KEY);

    if (!savedPosts) {
        return [];
    }

    try {
        return JSON.parse(savedPosts);
    } catch (error) {
        return [];
    }
}

// Command: Save manga posts to localStorage.
function saveMangaPosts(posts) {
    localStorage.setItem(MANGA_STORAGE_KEY, JSON.stringify(posts));
}

// Command: Read likes, comments, shares, and saves from localStorage.
function getMangaActions() {
    var savedActions = localStorage.getItem(MANGA_ACTIONS_KEY);

    if (!savedActions) {
        return {};
    }

    try {
        return JSON.parse(savedActions);
    } catch (error) {
        return {};
    }
}

// Command: Save likes, comments, shares, and saves to localStorage.
function saveMangaActions(actions) {
    localStorage.setItem(MANGA_ACTIONS_KEY, JSON.stringify(actions));
}

// Command: Get action data for one manga.
function getActionState(mangaId) {
    var actions = getMangaActions();

    if (actions[mangaId]) {
        return actions[mangaId];
    }

    return {
        liked: false,
        saved: false,
        likes: 0,
        shares: 0,
        comments: []
    };
}

// Command: Save action data for one manga.
function saveActionState(mangaId, state) {
    var actions = getMangaActions();
    actions[mangaId] = state;
    saveMangaActions(actions);
}

// Command: Get all manga posts for the feed.
function getAllMangaPosts() {
    var storedPosts = getStoredMangaPosts();
    var allPosts = [];
    var i;

    for (i = 0; i < storedPosts.length; i++) {
        allPosts.push(storedPosts[i]);
    }

    for (i = 0; i < demoMangaPosts.length; i++) {
        allPosts.push(demoMangaPosts[i]);
    }

    return allPosts;
}

// Command: Find one manga post by id.
function getMangaPostById(mangaId) {
    var posts = getAllMangaPosts();
    var i;

    for (i = 0; i < posts.length; i++) {
        if (posts[i].id === mangaId) {
            return posts[i];
        }
    }

    return null;
}

// Command: Some old posts may have panels as strings, and new posts have panel objects.
function getPanelSource(panel) {
    if (typeof panel === 'string') {
        return panel;
    }

    return panel.src;
}

// Command: Get the original image filename if it exists.
function getPanelName(panel, index) {
    if (typeof panel === 'string') {
        return 'Panel ' + (index + 1);
    }

    return panel.name;
}

// Command: Create a placeholder cover if the manga has no image.
function createPlaceholderCover(mangaName) {
    var shortName = mangaName.slice(0, 2).toUpperCase();

    return '<div class="manga-cover-placeholder">' +
        '<span>' + escapeHTML(shortName) + '</span>' +
        '</div>';
}

// Command: Create the Like, Comment, Share, and Save buttons.
function createCardActions(post) {
    var state = getActionState(post.id);
    var likedClass = '';
    var savedClass = '';
    var saveText = 'Save';

    if (state.liked) {
        likedClass = ' is-active';
    }

    if (state.saved) {
        savedClass = ' is-active';
        saveText = 'Saved';
    }

    return '<div class="manga-card-actions" aria-label="' + escapeHTML(post.mangaName) + ' actions">' +
        '<button class="card-action-button' + likedClass + '" type="button" data-action="like" data-manga-id="' + escapeHTML(post.id) + '">Like <span>' + state.likes + '</span></button>' +
        '<button class="card-action-button" type="button" data-action="comment" data-manga-id="' + escapeHTML(post.id) + '">Comment <span>' + state.comments.length + '</span></button>' +
        '<button class="card-action-button" type="button" data-action="share" data-manga-id="' + escapeHTML(post.id) + '">Share <span>' + state.shares + '</span></button>' +
        '<button class="card-action-button' + savedClass + '" type="button" data-action="save" data-manga-id="' + escapeHTML(post.id) + '">' + saveText + '</button>' +
        '</div>';
}

// Command: Create one manga card for the home feed.
function createMangaCard(post) {
    var coverHTML;
    var firstPanel = post.panels[0];

    if (firstPanel) {
        coverHTML = '<img class="manga-card-cover" src="' + getPanelSource(firstPanel) + '" alt="' + escapeHTML(post.mangaName) + ' cover">';
    } else {
        coverHTML = createPlaceholderCover(post.mangaName);
    }

    return '<article class="story-card manga-card" tabindex="0" data-manga-id="' + escapeHTML(post.id) + '" role="link" aria-label="Open details for ' + escapeHTML(post.mangaName) + '">' +
        coverHTML +
        '<div class="manga-card-body">' +
        '<p class="manga-card-meta">' + escapeHTML(post.genre) + ' · ' + escapeHTML(post.creatorName) + '</p>' +
        '<h2>' + escapeHTML(post.mangaName) + '</h2>' +
        '<p>' + escapeHTML(post.description) + '</p>' +
        '<span class="read-more-link">View details</span>' +
        '</div>' +
        createCardActions(post) +
        '</article>';
}

// Command: Open the details page for one manga.
function openMangaDetails(mangaId) {
    window.location.href = 'details.html?id=' + encodeURIComponent(mangaId);
}

// Command: Refresh one card after Like, Share, or Save changes.
function refreshCardActions(mangaId) {
    var post = getMangaPostById(mangaId);
    var cards = document.querySelectorAll('.manga-card');
    var card = null;
    var i;

    for (i = 0; i < cards.length; i++) {
        if (cards[i].dataset.mangaId === mangaId) {
            card = cards[i];
        }
    }

    if (!post || !card) {
        return;
    }

    card.querySelector('.manga-card-actions').outerHTML = createCardActions(post);
}

// Command: Handle Like, Comment, Share, and Save.
function handleCardAction(event) {
    var button = findParentWithClass(event.target, 'card-action-button');
    var mangaId;
    var action;
    var state;
    var shareUrl;

    if (!button) {
        return;
    }

    event.stopPropagation();
    mangaId = button.dataset.mangaId;
    action = button.dataset.action;
    state = getActionState(mangaId);

    if (action === 'like') {
        state.liked = !state.liked;

        if (state.liked) {
            state.likes = state.likes + 1;
        } else {
            state.likes = Math.max(0, state.likes - 1);
        }

        saveActionState(mangaId, state);
        refreshCardActions(mangaId);
    }

    if (action === 'save') {
        state.saved = !state.saved;
        saveActionState(mangaId, state);
        refreshCardActions(mangaId);
    }

    if (action === 'comment') {
        window.location.href = 'comments.html?id=' + encodeURIComponent(mangaId);
    }

    if (action === 'share') {
        state.shares = state.shares + 1;
        saveActionState(mangaId, state);
        refreshCardActions(mangaId);

        shareUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'details.html?id=' + encodeURIComponent(mangaId);

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
        } else {
            window.prompt('Copy this manga link:', shareUrl);
        }
    }
}

// Command: Show manga cards on the home feed.
function renderMangaFeed() {
    var feed = document.querySelector('#manga-feed');
    var posts;
    var html = '';
    var cards;
    var i;

    if (!feed) {
        return;
    }

    posts = getAllMangaPosts();

    for (i = 0; i < posts.length; i++) {
        html = html + createMangaCard(posts[i]);
    }

    feed.innerHTML = html;
    feed.addEventListener('click', handleCardAction);

    cards = feed.querySelectorAll('.manga-card');

    for (i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function (event) {
            if (findParentWithClass(event.target, 'card-action-button')) {
                return;
            }

            openMangaDetails(this.dataset.mangaId);
        });

        cards[i].addEventListener('keydown', function (event) {
            if (findParentWithClass(event.target, 'card-action-button')) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openMangaDetails(this.dataset.mangaId);
            }
        });
    }
}

// Command: Create the comment list and form.
function createCommentSection(post) {
    var state = getActionState(post.id);
    var html = '<div class="comment-section comment-section-page" data-comment-section="' + escapeHTML(post.id) + '">';
    var i;

    html = html + '<div class="comment-list">';

    if (state.comments.length === 0) {
        html = html + '<p class="empty-comments">No comments yet. Be the first one.</p>';
    }

    for (i = 0; i < state.comments.length; i++) {
        html = html +
            '<div class="comment-item">' +
            '<div class="comment-avatar">U</div>' +
            '<div class="comment-bubble">' +
            '<strong>Reader</strong>' +
            '<p>' + escapeHTML(state.comments[i]) + '</p>' +
            '</div>' +
            '</div>';
    }

    html = html + '</div>';
    html = html + '<form class="comment-form" data-comment-form="' + escapeHTML(post.id) + '">' +
        '<input type="text" name="comment" placeholder="Write a comment..." autocomplete="off">' +
        '<button type="submit">Post</button>' +
        '</form>';
    html = html + '</div>';

    return html;
}

// Command: Save a new comment.
function handleCommentSubmit(event) {
    var form = findParentWithClass(event.target, 'comment-form');
    var mangaId;
    var input;
    var comment;
    var state;

    if (!form) {
        return;
    }

    event.preventDefault();
    mangaId = form.dataset.commentForm;
    input = form.querySelector('input[name="comment"]');
    comment = input.value.trim();

    if (comment === '') {
        return;
    }

    state = getActionState(mangaId);
    state.comments.push(comment);
    saveActionState(mangaId, state);
    renderCommentsPage();
}

// Command: Show the comments page.
function renderCommentsPage() {
    var commentsShell = document.querySelector('#comments-shell');
    var params;
    var mangaId;
    var post;
    var form;
    var input;

    if (!commentsShell) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    mangaId = params.get('id');
    post = getMangaPostById(mangaId);

    if (!post) {
        commentsShell.innerHTML =
            '<p class="page-kicker">Comments</p>' +
            '<h1 class="page-title">Manga not found</h1>' +
            '<p class="page-copy">This manga may have been deleted from this browser.</p>' +
            '<div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>';
        return;
    }

    commentsShell.innerHTML =
        '<section class="comments-page-card">' +
        '<p class="page-kicker">' + escapeHTML(post.genre) + ' · ' + escapeHTML(post.creatorName) + '</p>' +
        '<h1 class="page-title">' + escapeHTML(post.mangaName) + '</h1>' +
        '<p class="page-copy">Read and write comments for this manga.</p>' +
        createCommentSection(post) +
        '<div class="action-row">' +
        '<a class="secondary-action" href="details.html?id=' + encodeURIComponent(post.id) + '">Back to details</a>' +
        '<a class="secondary-action" href="index.html">Back to feed</a>' +
        '</div>' +
        '</section>';

    form = commentsShell.querySelector('.comment-form');
    input = commentsShell.querySelector('input[name="comment"]');
    form.addEventListener('submit', handleCommentSubmit);
    input.focus();
}

// Command: Read image files selected by the user.
function readImageFiles(files, finishedCallback) {
    var imageFiles = [];
    var panels = [];
    var loadedCount = 0;
    var i;

    for (i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image/') === 0) {
            imageFiles.push(files[i]);
        }
    }

    if (imageFiles.length === 0) {
        finishedCallback([]);
        return;
    }

    for (i = 0; i < imageFiles.length; i++) {
        readOneImageFile(imageFiles[i], i, panels, function () {
            loadedCount = loadedCount + 1;

            if (loadedCount === imageFiles.length) {
                finishedCallback(panels);
            }
        });
    }
}

// Command: Read one image file.
function readOneImageFile(file, index, panels, doneCallback) {
    var reader = new FileReader();

    reader.onload = function () {
        panels[index] = {
            src: reader.result,
            name: file.name
        };

        doneCallback();
    };

    reader.readAsDataURL(file);
}

// Command: Move a panel inside the selected panel list.
function moveArrayItem(items, fromIndex, toIndex) {
    var movedItem;

    if (toIndex < 0 || toIndex >= items.length) {
        return items;
    }

    movedItem = items[fromIndex];
    items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    return items;
}

// Command: Show selected panel previews before publishing.
function renderPanelPreview(previewGrid) {
    var html = '';
    var i;
    var panel;

    for (i = 0; i < selectedPublishPanels.length; i++) {
        panel = selectedPublishPanels[i];
        html = html +
            '<figure class="panel-preview" data-panel-index="' + i + '" draggable="true">' +
            '<button class="panel-delete-button" type="button" data-panel-action="delete" data-panel-index="' + i + '" aria-label="Delete ' + escapeHTML(getPanelName(panel, i)) + '">Delete</button>' +
            '<img src="' + getPanelSource(panel) + '" alt="' + escapeHTML(getPanelName(panel, i)) + '" data-panel-action="preview" data-panel-index="' + i + '">' +
            '<figcaption>' +
            '<span>Panel ' + (i + 1) + '</span>' +
            '<strong title="' + escapeHTML(getPanelName(panel, i)) + '">' + escapeHTML(getPanelName(panel, i)) + '</strong>' +
            '<div class="panel-order-controls" aria-label="Panel ' + (i + 1) + ' order controls">' +
            '<button type="button" data-panel-action="up" data-panel-index="' + i + '"' + (i === 0 ? ' disabled' : '') + '>Up</button>' +
            '<button type="button" data-panel-action="down" data-panel-index="' + i + '"' + (i === selectedPublishPanels.length - 1 ? ' disabled' : '') + '>Down</button>' +
            '</div>' +
            '</figcaption>' +
            '</figure>';
    }

    previewGrid.innerHTML = html;
}

// Command: Open a big preview of one selected panel.
function openPanelPreview(panel) {
    var existingModal = document.querySelector('.panel-preview-modal');
    var modal;

    if (existingModal) {
        existingModal.remove();
    }

    modal = document.createElement('div');
    modal.className = 'panel-preview-modal';
    modal.innerHTML =
        '<div class="panel-preview-dialog" role="dialog" aria-modal="true" aria-label="' + escapeHTML(panel.name) + ' preview">' +
        '<button class="panel-preview-close" type="button">Close</button>' +
        '<img src="' + panel.src + '" alt="' + escapeHTML(panel.name) + '">' +
        '<p>' + escapeHTML(panel.name) + '</p>' +
        '</div>';

    modal.addEventListener('click', function (event) {
        if (event.target === modal || findParentWithClass(event.target, 'panel-preview-close')) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// Command: Handle clicks inside the panel preview grid.
function handlePanelPreviewClick(event, previewGrid) {
    var button = findParentWithAttribute(event.target, 'data-panel-action');
    var action;
    var currentIndex;
    var nextIndex;

    if (!button) {
        return;
    }

    action = button.dataset.panelAction;
    currentIndex = Number(button.dataset.panelIndex);

    if (action === 'preview') {
        openPanelPreview(selectedPublishPanels[currentIndex]);
        return;
    }

    if (action === 'delete') {
        selectedPublishPanels.splice(currentIndex, 1);
        renderPanelPreview(previewGrid);
        return;
    }

    if (action === 'up') {
        nextIndex = currentIndex - 1;
    }

    if (action === 'down') {
        nextIndex = currentIndex + 1;
    }

    moveArrayItem(selectedPublishPanels, currentIndex, nextIndex);
    renderPanelPreview(previewGrid);
}

// Command: Set up drag and drop ordering for panel previews.
function setupPanelDragAndDrop(previewGrid) {
    previewGrid.addEventListener('dragstart', function (event) {
        var preview = findParentWithClass(event.target, 'panel-preview');

        if (!preview) {
            return;
        }

        preview.classList.add('is-dragging');
        event.dataTransfer.setData('text/plain', preview.dataset.panelIndex);
    });

    previewGrid.addEventListener('dragend', function (event) {
        var preview = findParentWithClass(event.target, 'panel-preview');

        if (preview) {
            preview.classList.remove('is-dragging');
        }
    });

    previewGrid.addEventListener('dragover', function (event) {
        event.preventDefault();
    });

    previewGrid.addEventListener('drop', function (event) {
        var targetPreview;
        var fromIndex;
        var toIndex;

        event.preventDefault();
        targetPreview = findParentWithClass(event.target, 'panel-preview');

        if (!targetPreview) {
            return;
        }

        fromIndex = Number(event.dataTransfer.getData('text/plain'));
        toIndex = Number(targetPreview.dataset.panelIndex);
        moveArrayItem(selectedPublishPanels, fromIndex, toIndex);
        renderPanelPreview(previewGrid);
    });
}

// Command: Set up the publish page form.
function setupPublishForm() {
    var form = document.querySelector('#publish-form');
    var panelInput = document.querySelector('#manga-panels');
    var previewGrid = document.querySelector('#panel-preview-grid');
    var message = document.querySelector('#publish-message');

    if (!form || !panelInput || !previewGrid) {
        return;
    }

    panelInput.addEventListener('change', function () {
        readImageFiles(panelInput.files, function (panels) {
            selectedPublishPanels = panels;
            renderPanelPreview(previewGrid);
        });
    });

    previewGrid.addEventListener('click', function (event) {
        handlePanelPreviewClick(event, previewGrid);
    });

    setupPanelDragAndDrop(previewGrid);

    form.addEventListener('reset', function () {
        selectedPublishPanels = [];
        previewGrid.innerHTML = '';
        message.textContent = '';
    });

    form.addEventListener('submit', function (event) {
        var formData;
        var posts;
        var newPost;

        event.preventDefault();
        formData = new FormData(form);

        if (selectedPublishPanels.length === 0) {
            message.textContent = 'Please add at least one manga panel image.';
            return;
        }

        newPost = {
            id: 'manga-' + Date.now(),
            mangaName: formData.get('mangaName').trim(),
            creatorName: formData.get('creatorName').trim(),
            genre: formData.get('genre'),
            description: formData.get('description').trim(),
            panels: selectedPublishPanels
        };

        posts = getStoredMangaPosts();
        posts.unshift(newPost);
        saveMangaPosts(posts);
        message.textContent = 'Manga published! Returning to the home feed...';

        setTimeout(function () {
            window.location.href = 'index.html';
        }, 600);
    });
}

// Command: Show the manga details page.
function renderDetailsPage() {
    var detailsShell = document.querySelector('#details-shell');
    var params;
    var mangaId;
    var post;
    var state;
    var coverHTML;

    if (!detailsShell) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    mangaId = params.get('id');
    post = getMangaPostById(mangaId);
    state = getActionState(mangaId);

    if (!post) {
        detailsShell.innerHTML =
            '<p class="page-kicker">Manga details</p>' +
            '<h1 class="page-title">Manga not found</h1>' +
            '<p class="page-copy">This manga may have been deleted from this browser.</p>' +
            '<div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>';
        return;
    }

    if (post.panels[0]) {
        coverHTML = '<img class="details-cover" src="' + getPanelSource(post.panels[0]) + '" alt="' + escapeHTML(post.mangaName) + ' cover">';
    } else {
        coverHTML = createPlaceholderCover(post.mangaName);
    }

    detailsShell.innerHTML =
        '<section class="details-card">' +
        coverHTML +
        '<div class="details-body">' +
        '<p class="page-kicker">' + escapeHTML(post.genre) + ' · ' + escapeHTML(post.creatorName) + '</p>' +
        '<h1 class="page-title">' + escapeHTML(post.mangaName) + '</h1>' +
        '<p class="page-copy">' + escapeHTML(post.description) + '</p>' +
        '<div class="details-stats">' +
        '<span>' + state.likes + ' likes</span>' +
        '<span>' + state.comments.length + ' comments</span>' +
        '<span>' + state.shares + ' shares</span>' +
        '<span>' + (state.saved ? 'Saved' : 'Not saved') + '</span>' +
        '</div>' +
        '<div class="action-row">' +
        '<a class="primary-action" href="reader.html?id=' + encodeURIComponent(post.id) + '">Read</a>' +
        '<a class="secondary-action" href="index.html">Back to feed</a>' +
        '</div>' +
        '</div>' +
        '</section>';
}

// Command: Show the reader page.
function renderReaderPage() {
    var readerShell = document.querySelector('#reader-shell');
    var params;
    var mangaId;
    var post;
    var panelHTML = '';
    var i;
    var panel;

    if (!readerShell) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    mangaId = params.get('id');
    post = getMangaPostById(mangaId);

    if (!post) {
        readerShell.innerHTML =
            '<p class="page-kicker">Reader</p>' +
            '<h1 class="page-title">Manga not found</h1>' +
            '<p class="page-copy">This card may have been deleted from this browser.</p>' +
            '<div class="action-row"><a class="primary-action" href="index.html">Back to feed</a></div>';
        return;
    }

    if (post.panels.length === 0) {
        panelHTML = '<div class="reader-empty-panel"><p>This demo manga has no uploaded panels yet.</p></div>';
    } else {
        for (i = 0; i < post.panels.length; i++) {
            panel = post.panels[i];
            panelHTML = panelHTML +
                '<figure class="reader-panel-frame">' +
                '<img class="reader-panel" src="' + getPanelSource(panel) + '" alt="' + escapeHTML(getPanelName(panel, i)) + '">' +
                '<figcaption>' + escapeHTML(getPanelName(panel, i)) + '</figcaption>' +
                '</figure>';
        }
    }

    readerShell.innerHTML =
        '<div class="reader-header">' +
        '<p class="page-kicker">' + escapeHTML(post.genre) + ' · ' + escapeHTML(post.creatorName) + '</p>' +
        '<h1 class="page-title">' + escapeHTML(post.mangaName) + '</h1>' +
        '<p class="page-copy">' + escapeHTML(post.description) + '</p>' +
        '<div class="action-row">' +
        '<a class="secondary-action" href="details.html?id=' + encodeURIComponent(post.id) + '">Back to details</a>' +
        '<a class="secondary-action" href="index.html">Back to feed</a>' +
        '</div>' +
        '</div>' +
        '<div class="reader-panels" aria-label="' + escapeHTML(post.mangaName) + ' manga panels">' +
        panelHTML +
        '</div>';
}

// Command: Hide the header when scrolling down and show it when scrolling up.
function setupHeaderScroll() {
    var header = document.querySelector('.header');
    var root = document.documentElement;
    var lastScrollY = window.scrollY;
    var ticking = false;

    if (!header) {
        return;
    }

    window.addEventListener('scroll', function () {
        if (ticking) {
            return;
        }

        window.requestAnimationFrame(function () {
            var currentScrollY = window.scrollY;
            var scrollingUp = currentScrollY < lastScrollY;
            var nearTop = currentScrollY <= 10;
            var shouldHideHeader = !scrollingUp && !nearTop;

            header.classList.toggle('header--hidden', shouldHideHeader);
            root.classList.toggle('header-is-hidden', shouldHideHeader);

            lastScrollY = Math.max(currentScrollY, 0);
            ticking = false;
        });

        ticking = true;
    }, { passive: true });
}

// Command: Start the JavaScript for the current page.
setupHeaderScroll();
renderMangaFeed();
setupPublishForm();
renderDetailsPage();
renderReaderPage();
renderCommentsPage();
