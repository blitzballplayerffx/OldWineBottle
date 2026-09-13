let aetheriaData = null;
let wikiData = null;

/*
========================================
SLIDER STATE
========================================
*/
const sliderState = {
    news: 0,
    features: 0,
    realms: 0,
    races: 0,
    classes: 0
};

/*
========================================
RENDER DATA INTO HTML
========================================
*/
function renderApp() {
    if (!aetheriaData) return;

    // 1. Top Navigation
    const topNav = document.getElementById("top-nav-bar");
    if (topNav) {
        topNav.innerHTML = `<div class="top-nav-links">${aetheriaData.topNavLinks.map(link => {
            const href = link.label.includes("Wiki") ? "#wiki" : link.href;
            return link.disabled
                ? `<button type="button" class="top-nav-btn">${link.label}</button>`
                : `<a href="${href}" class="top-nav-btn" ${href === link.href && link.target ? `target="${link.target}" rel="noopener noreferrer"` : ''}>${link.label}</a>`;
        }).join('')}</div>`;
    }

    // 2. Quick Links
    const quickLinks = document.getElementById("quick-links-bar");
    if (quickLinks) {
        quickLinks.innerHTML = aetheriaData.quickLinks.map(link => 
            `<a href="${link.href}" class="quick-link">${link.label}</a>`
        ).join('');
    }

    // 3. News Slider (formerly Home Slider)
    const newsSlider = document.getElementById("newsSlider");
    const newsDots = document.getElementById("newsDots");
    if (newsSlider) {
        newsSlider.innerHTML = aetheriaData.homeSlides.map(slide => {
            if (slide.type === "social") {
                const btns = slide.buttons.map(b => `<a href="${b.href}" class="social-btn">${b.label}</a>`).join('');
                return `<div class="slide">
                    <h3>${slide.title}</h3>
                    <p>${slide.description}</p>
                    <div class="social-buttons">${btns}</div>
                </div>`;
            } else if (slide.type === "list") {
                const feats = slide.features.map(f => `<li>${f}</li>`).join('');
                return `<div class="slide">
                    <h3>${slide.title}</h3>
                    <p>${slide.description}</p>
                    <ul class="features">${feats}</ul>
                </div>`;
            } else if (slide.type === "video") {
                return `<div class="slide">
                    <div class="video-container">
                        <iframe src="${slide.videoUrl}" title="Trailer" allowfullscreen></iframe>
                    </div>
                </div>`;
            }
        }).join('');

        if (newsDots) {
            newsDots.innerHTML = aetheriaData.homeSlides.map((_, i) => 
                `<div class="dot ${i === 0 ? 'active' : ''}" onclick="userSelectNewsSlide(${i})"></div>`
            ).join('');
        }
    }

    // 4. Story Section
    const storyContent = document.getElementById("storyContent");
    if (storyContent) {
        const paragraphs = aetheriaData.story.paragraphs.map(p => `<p>${p}</p>`).join('');
        const features = aetheriaData.story.features.map(f => `<li>${f}</li>`).join('');
        storyContent.innerHTML = `
            <h1>${aetheriaData.story.title}</h1>
            <h2>${aetheriaData.story.subtitle}</h2>
            ${paragraphs}
            <ul class="features">${features}</ul>
        `;
    }

    // 5. Generic Section Renderer (Features, Realms, Races, Classes)
    renderStandardSection("features", aetheriaData.features);
    renderStandardSection("realms", aetheriaData.realms);
    renderStandardSection("races", aetheriaData.races);
    renderStandardSection("classes", aetheriaData.classes);
    renderStandardSection("crafting", aetheriaData.crafting);

}

function renderStandardSection(sectionKey, dataArray) {
    const slider = document.getElementById(`${sectionKey}Slider`);
    const nav = document.getElementById(`${sectionKey}Nav`);

    if (slider) {
        slider.innerHTML = dataArray.map(item => {
            const features = item.features.map(f => `<li>${f}</li>`).join('');
            return `<div class="slide">
                <div class="slide-emoji">${item.emoji}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <ul class="features">${features}</ul>
            </div>`;
        }).join('');
    }

    if (nav) {
        nav.innerHTML = dataArray.map((item, index) => 
            `<div class="nav-item ${index === 0 ? 'active' : ''}" onclick="swapSlide('${sectionKey}', ${index})">
                ${item.emoji}
                <div class="nav-label">${item.label}</div>
            </div>`
        ).join('');
    }
}

/*
========================================
CHANGE SLIDE
========================================
*/
function swapSlide(sectionName, index) {
    const slider = document.getElementById(sectionName + "Slider");
    if (!slider) return;

    const slides = slider.querySelectorAll(".slide");
    if (!slides.length) return;

    index = Math.max(0, Math.min(index, slides.length - 1));
    sliderState[sectionName] = index;

    const offset = index * slider.clientWidth;
    slider.scrollTo({
        left: offset,
        behavior: "smooth"
    });

    const section = document.getElementById(sectionName);
    if (section) {
        const navItems = section.querySelectorAll(".nav-item");
        navItems.forEach((item, itemIndex) => {
            item.classList.toggle("active", itemIndex === index);
        });

        const dots = section.querySelectorAll(".dot");
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === index);
        });
    }
}

/*
========================================
AUTO-CYCLE FOR HOME SECTION
========================================
*/
let newsAutoCycleTimer = null;

function startNewsAutoCycle() {
    stopNewsAutoCycle();
    newsAutoCycleTimer = setInterval(() => {
        const slider = document.getElementById("newsSlider");
        if (!slider) return;

        const totalSlides = slider.querySelectorAll(".slide").length;
        let nextIndex = (sliderState.news + 1) % totalSlides;
        swapSlide("news", nextIndex);
    }, 4000);
}

function stopNewsAutoCycle() {
    if (newsAutoCycleTimer) {
        clearInterval(newsAutoCycleTimer);
    }
}

function userSelectNewsSlide(index) {
    swapSlide("news", index);
    startNewsAutoCycle();
}

/*
========================================
KEEP SLIDES CORRECT AFTER RESIZING
========================================
*/
function updateSliderPositions() {
    Object.keys(sliderState).forEach(sectionName => {
        const slider = document.getElementById(sectionName + "Slider");
        if (!slider) return;

        const index = sliderState[sectionName];
        slider.scrollLeft = index * slider.clientWidth;
    });
}

/*
========================================
SECTION SHOW / HIDE NAVIGATION
========================================
*/
const sectionGroups = {
    home: ['home','story','features','realms','races','classes','crafting'],
    news: ['news'],
    support: ['support'],
    media: ['media'],
    account: ['account'],
    wiki: ['wiki']
};

function hideAllSections() {
    document.querySelectorAll('section.card, section').forEach(s => {
        s.classList.add('hidden');
    });
}

function showGroup(name) {
    const ids = sectionGroups[name] || [name];
    hideAllSections();
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });

    // Update top nav active state
    const topNavBtns = document.querySelectorAll('.top-nav-bar .top-nav-btn');
    topNavBtns.forEach(btn => {
        const href = btn.getAttribute('href') || '';
        const targetId = href.startsWith('#') ? href.slice(1) : '';
        btn.classList.toggle('active', targetId === name);
    });

    // Refresh sliders layout if needed
    updateSliderPositions();
}

function setupNavBehavior() {
    const topNav = document.getElementById('top-nav-bar');
    if (!topNav) return;

    topNav.querySelectorAll('a.top-nav-btn').forEach(a => {
        const href = a.getAttribute('href') || '';
        const isExternal = a.hasAttribute('target');
        if (isExternal) return; // let external links behave normally
        if (!href.startsWith('#')) return;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            const id = href.slice(1);
            if (id === 'home') {
                showGroup('home');
            } else if (id === 'wiki') {
                showGroup('wiki');
                loadMainPage();
            } else {
                showGroup(id);
            }

            // Manage news auto-cycle
            if (id === 'news') startNewsAutoCycle();
            else stopNewsAutoCycle();
        });
    });

    const quickLinks = document.getElementById('quick-links-bar');
    if (quickLinks) {
        quickLinks.querySelectorAll('a.quick-link').forEach(a => {
            const href = a.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const id = href.slice(1);
                if (sectionGroups.home.includes(id)) {
                    showGroup('home');
                    const target = document.getElementById(id);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                } else {
                    showGroup(id);
                }
            });
        });
    }

    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const id = a.getAttribute('href').slice(1);
                showGroup(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
}

function setupAccountBehavior() {
    const signInButton = document.getElementById('show-sign-in-button');
    const signInForm = document.getElementById('sign-in-form');
    const accountAuth = document.getElementById('account-auth');
    const registerPage = document.getElementById('register-page');
    const signInPage = document.getElementById('sign-in-page');
    const accountOverview = document.getElementById('account-overview');
    const signInMessage = document.getElementById('sign-in-message');
    const signOutButton = document.getElementById('sign-out-button');
    const registerButton = document.getElementById('register-button');
    const backFromRegisterButton = document.getElementById('back-from-register-button');
    const backFromSignInButton = document.getElementById('back-from-sign-in-button');

    if (!signInButton || !signInForm || !accountAuth || !registerPage || !signInPage || !accountOverview || !signInMessage || !signOutButton || !registerButton || !backFromRegisterButton || !backFromSignInButton) return;

    const showAccountOverview = () => {
        accountAuth.hidden = true;
        registerPage.hidden = true;
        signInPage.hidden = true;
        accountOverview.hidden = false;
    };

    const showAccountLanding = () => {
        accountAuth.hidden = false;
        registerPage.hidden = true;
        signInPage.hidden = true;
        accountOverview.hidden = true;
    };

    if (sessionStorage.getItem('aetheriaSignedIn') === 'true') {
        showAccountOverview();
    }

    registerButton.addEventListener('click', () => {
        accountAuth.hidden = true;
        registerPage.hidden = false;
    });

    signInButton.addEventListener('click', () => {
        accountAuth.hidden = true;
        signInPage.hidden = false;
        signInMessage.textContent = '';
        document.getElementById('account-username').focus();
    });

    backFromRegisterButton.addEventListener('click', showAccountLanding);
    backFromSignInButton.addEventListener('click', showAccountLanding);

    signInForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('account-username').value;
        const password = document.getElementById('account-password').value;
        if (username === 'user' && password === 'password') {
            sessionStorage.setItem('aetheriaSignedIn', 'true');
            showAccountOverview();
            return;
        }

        signInMessage.textContent = 'Use the demo username and password to continue.';
    });

    signOutButton.addEventListener('click', () => {
        sessionStorage.removeItem('aetheriaSignedIn');
        showAccountLanding();
        signInForm.reset();
        signInMessage.textContent = '';
    });
}

/*
========================================
EVENTS & INIT
========================================
*/
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("data.json");
        const combinedData = await response.json();
        aetheriaData = combinedData.main;
        wikiData = combinedData.wiki;
    } catch (err) {
        console.error("Error loading data.json:", err);
        return;
    }

    renderApp();
    setupNavBehavior();
    setupAccountBehavior();

    // Default to home view on load
    showGroup('home');

    const newsSliderElement = document.getElementById("newsSlider");
    if (newsSliderElement) {
        newsSliderElement.addEventListener("mouseenter", stopNewsAutoCycle);
        newsSliderElement.addEventListener("mouseleave", startNewsAutoCycle);
    }

    window.addEventListener("resize", updateSliderPositions);

    updateSliderPositions();

    swapSlide("news", 0);
    swapSlide("features", 0);
    swapSlide("realms", 0);
    swapSlide("races", 0);
    swapSlide("classes", 0);

    startNewsAutoCycle();
});


// =========================
// WIKI PAGE LOGIC
// =========================
function renderContent(html) {
    const wikiHeader = document.querySelector('.wiki-header');
    const container = document.getElementById('content-area');
    if (wikiHeader) wikiHeader.hidden = true;
    container.innerHTML = html;
}

// 1. Home Page
function loadMainPage() {
    const home = wikiData.home;
    const html = `
        <div class="card">
            <span class="section-tag">${home.tag}</span>
            <h2>${home.title}</h2>
            <p>${home.description}</p>
        </div>
    `;
    renderContent(html);
    const wikiHeader = document.querySelector('.wiki-header');
    if (wikiHeader) wikiHeader.hidden = false;
}

// 2. Classes Index & Details
function loadClassesIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Archetypes</span>
            <h2>Classes</h2>
            <p>Select a combat class below to view its specific roles, weaponry, and core stat modifiers:</p>
            <ul>
    `;

    // Use classes_full from the data source; each entry has name and description
    const classesSource = wikiData.classes_full || wikiData.classes || {};
    for (const [key, classItem] of Object.entries(classesSource)) {
        html += `<li><a class="wiki-link" onclick="loadClassDetail('${key}')">${classItem.name}</a> â€” ${classItem.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadClassDetail(classKey) {
    const classesSource = wikiData.classes_full || wikiData.classes || {};
    const classData = classesSource[classKey];
    if (!classData) {
        renderContent(`<div class="card"><h2>Class Not Found</h2><p>No information available for ${classKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadClassesIndex()">â† Back to Classes</button>
        <div class="card">
            <span class="section-tag">Class Archetype</span>
            <h2>${classData.name}</h2>
            <p>${classData.description}</p>
            <h3>Key Traits & Features</h3>
            <ul>` + (classData.features || []).map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 3. Magic Schools & Spells
function loadMagicIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Mystic Arts</span>
            <h2>Magic Schools</h2>
            <p>Select a magic school below to view its abilities and spell list by level:</p>
            <ul>
    `;

    for (const [key, school] of Object.entries(wikiData.schools)) {
        html += `<li><a class="wiki-link" onclick="loadSchoolPage('${key}')">${school.name}</a> â€” ${school.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadSchoolPage(schoolKey) {
    const school = wikiData.schools[schoolKey];

    let html = `
        <button class="btn-back" onclick="loadMagicIndex()">â† Back to Magic</button>
        <div class="card">
            <span class="section-tag">Magic School</span>
            <h2>${school.name}</h2>
            <p>${school.description}</p>
            <h3>School Overview</h3>
            <ul>
                <li><strong>Stat Modifiers:</strong> ${school.modifiers}</li>
                <li><strong>Special Abilities:</strong> ${school.abilities.join(', ')}</li>
            </ul>
            <h3>Spell List by Level</h3>
    `;

    // Group spells by level requirement
    const levelGroups = {};
    for (const [spellKey, spell] of Object.entries(school.spells)) {
        if (!levelGroups[spell.level]) levelGroups[spell.level] = [];
        levelGroups[spell.level].push({ key: spellKey, name: spell.name });
    }

    // Sort level values numerically
    const sortedLevels = Object.keys(levelGroups).sort((a, b) => Number(a) - Number(b));

    for (const level of sortedLevels) {
        // Sort spell names alphabetically within level container
        levelGroups[level].sort((a, b) => a.name.localeCompare(b.name));

        const spellLinks = levelGroups[level].map(spell => 
            `<a class="wiki-link" onclick="loadSpellDetail('${schoolKey}', '${spell.key}')">${spell.name}</a>`
        ).join(' <span class="spell-dot-separator">â€¢</span> ');

        html += `
            <div class="spell-level-card">
                <h4>Level ${level}</h4>
                <p class="spell-inline-list">${spellLinks}</p>
            </div>
        `;
    }

    html += `</div>`;
    renderContent(html);
}

function loadSpellDetail(schoolKey, spellKey) {
    const spell = wikiData.schools[schoolKey].spells[spellKey];
    const schoolName = wikiData.schools[schoolKey].name;

    const html = `
        <button class="btn-back" onclick="loadSchoolPage('${schoolKey}')">â† Back to ${schoolName}</button>
        <div class="card">
            <span class="section-tag">${schoolName} Spell</span>
            <h2>${spell.name}</h2>
            <p>${spell.description}</p>
            <ul>
                <li><strong>School:</strong> ${schoolName}</li>
                <li><strong>Required Level:</strong> Level ${spell.level}</li>
                <li><strong>Cast Time:</strong> ${spell.castTime}</li>
                <li><strong>Mana Cost:</strong> ${spell.manaCost}</li>
            </ul>
        </div>
    `;
    renderContent(html);
}

// 4. Realms Hub & Details
function loadRealmsIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">World Regions</span>
            <h2>Realms</h2>
            <p>Select a world realm below to inspect its environmental features, monster threats, and zone lore:</p>
            <ul>
    `;

    // Use realms_full from the data source
    const realmsSource = wikiData.realms_full || wikiData.realms || {};
    for (const [key, realm] of Object.entries(realmsSource)) {
        html += `<li><a class="wiki-link" onclick="loadRealmDetail('${key}')">${realm.name}</a> â€” ${realm.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadRealmDetail(realmKey) {
    const realmsSource = wikiData.realms_full || wikiData.realms || {};
    const realm = realmsSource[realmKey];
    if (!realm) {
        renderContent(`<div class="card"><h2>Realm Not Found</h2><p>No information available for ${realmKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadRealmsIndex()">â† Back to Realms</button>
        <div class="card">
            <span class="section-tag">World Realm</span>
            <h2>${realm.name}</h2>
            <p>${realm.description}</p>
            <h3>Realm Features</h3>
            <ul>` + (realm.features || []).map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 5. Races Index & Details
function loadRacesIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Ancestries</span>
            <h2>Races</h2>
            <p>Select a race below to view racial traits and lore:</p>
            <ul>
    `;

    for (const [key, race] of Object.entries(wikiData.races)) {
        html += `<li><a class="wiki-link" onclick="loadRaceDetail('${key}')">${race.name}</a> â€” ${race.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadRaceDetail(raceKey) {
    const race = wikiData.races[raceKey];
    const html = `
        <button class="btn-back" onclick="loadRacesIndex()">â† Back to Races</button>
        <div class="card">
            <span class="section-tag">Race</span>
            <h2>${race.name}</h2>
            <p>${race.description}</p>
            <h3>Racial Features</h3>
            <ul>` + race.features.map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 6. Game Features (direct pages accessible from nav)
function loadFeature(featureKey) {
    const feature = wikiData.gameFeatures[featureKey];
    if (!feature) {
        renderContent(`<div class="card"><h2>Feature Not Found</h2><p>No information available for ${featureKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadMainPage()">â† Back to Home</button>
        <div class="card">
            <span class="section-tag">Game Feature</span>
            <h2>${feature.name}</h2>
            <p>${feature.description}</p>
            <h3>Details</h3>
            <ul>` + feature.details.map((detail, index) => `<li><a class="wiki-link" onclick="loadFeatureDetail('${featureKey}', ${index})">${detail}</a></li>`).join('') + `</ul>
        </div>
    `;

    renderContent(html);
}

function loadFeatureDetail(featureKey, detailIndex) {
    const feature = wikiData.gameFeatures[featureKey];
    const detail = feature && feature.details[detailIndex];
    if (!feature || !detail) {
        renderContent(`<div class="card"><h2>Article Not Found</h2><p>No information available for this entry.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadFeature('${featureKey}')">â† Back to ${feature.name}</button>
        <div class="card">
            <span class="section-tag">${feature.name} Guide</span>
            <h2>${detail}</h2>
            <p>This starter article covers ${detail.toLowerCase()} as part of ${feature.name.toLowerCase()} in Aetheria. Expand this page later with recipes, requirements, locations, rewards, and gameplay notes.</p>
            <h3>Template Details</h3>
            <ul>
                <li><strong>Category:</strong> ${feature.name}</li>
                <li><strong>Common uses:</strong> Progression, exploration, trade, and adventure preparation</li>
                <li><strong>Availability:</strong> Found through normal play and related activities</li>
            </ul>
        </div>
    `;

    renderContent(html);
}

// =========================
// WIKI PAGE LOGIC
// =========================
function renderContent(html) {
    const wikiHeader = document.querySelector('.wiki-header');
    const container = document.getElementById('content-area');
    if (wikiHeader) wikiHeader.hidden = true;
    container.innerHTML = html;
}

// 1. Home Page
function loadMainPage() {
    const home = wikiData.home;
    const html = `
        <div class="card">
            <span class="section-tag">${home.tag}</span>
            <h2>${home.title}</h2>
            <p>${home.description}</p>
        </div>
    `;
    renderContent(html);
    const wikiHeader = document.querySelector('.wiki-header');
    if (wikiHeader) wikiHeader.hidden = false;
}

// 2. Classes Index & Details
function loadClassesIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Archetypes</span>
            <h2>Classes</h2>
            <p>Select a combat class below to view its specific roles, weaponry, and core stat modifiers:</p>
            <ul>
    `;

    // Use classes_full from the data source; each entry has name and description
    const classesSource = wikiData.classes_full || wikiData.classes || {};
    for (const [key, classItem] of Object.entries(classesSource)) {
        html += `<li><a class="wiki-link" onclick="loadClassDetail('${key}')">${classItem.name}</a> — ${classItem.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadClassDetail(classKey) {
    const classesSource = wikiData.classes_full || wikiData.classes || {};
    const classData = classesSource[classKey];
    if (!classData) {
        renderContent(`<div class="card"><h2>Class Not Found</h2><p>No information available for ${classKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadClassesIndex()">← Back to Classes</button>
        <div class="card">
            <span class="section-tag">Class Archetype</span>
            <h2>${classData.name}</h2>
            <p>${classData.description}</p>
            <h3>Key Traits & Features</h3>
            <ul>` + (classData.features || []).map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 3. Magic Schools & Spells
function loadMagicIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Mystic Arts</span>
            <h2>Magic Schools</h2>
            <p>Select a magic school below to view its abilities and spell list by level:</p>
            <ul>
    `;

    for (const [key, school] of Object.entries(wikiData.schools)) {
        html += `<li><a class="wiki-link" onclick="loadSchoolPage('${key}')">${school.name}</a> — ${school.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadSchoolPage(schoolKey) {
    const school = wikiData.schools[schoolKey];

    let html = `
        <button class="btn-back" onclick="loadMagicIndex()">← Back to Magic</button>
        <div class="card">
            <span class="section-tag">Magic School</span>
            <h2>${school.name}</h2>
            <p>${school.description}</p>
            <h3>School Overview</h3>
            <ul>
                <li><strong>Stat Modifiers:</strong> ${school.modifiers}</li>
                <li><strong>Special Abilities:</strong> ${school.abilities.join(', ')}</li>
            </ul>
            <h3>Spell List by Level</h3>
    `;

    // Group spells by level requirement
    const levelGroups = {};
    for (const [spellKey, spell] of Object.entries(school.spells)) {
        if (!levelGroups[spell.level]) levelGroups[spell.level] = [];
        levelGroups[spell.level].push({ key: spellKey, name: spell.name });
    }

    // Sort level values numerically
    const sortedLevels = Object.keys(levelGroups).sort((a, b) => Number(a) - Number(b));

    for (const level of sortedLevels) {
        // Sort spell names alphabetically within level container
        levelGroups[level].sort((a, b) => a.name.localeCompare(b.name));

        const spellLinks = levelGroups[level].map(spell => 
            `<a class="wiki-link" onclick="loadSpellDetail('${schoolKey}', '${spell.key}')">${spell.name}</a>`
        ).join(' <span class="spell-dot-separator">•</span> ');

        html += `
            <div class="spell-level-card">
                <h4>Level ${level}</h4>
                <p class="spell-inline-list">${spellLinks}</p>
            </div>
        `;
    }

    html += `</div>`;
    renderContent(html);
}

function loadSpellDetail(schoolKey, spellKey) {
    const spell = wikiData.schools[schoolKey].spells[spellKey];
    const schoolName = wikiData.schools[schoolKey].name;

    const html = `
        <button class="btn-back" onclick="loadSchoolPage('${schoolKey}')">← Back to ${schoolName}</button>
        <div class="card">
            <span class="section-tag">${schoolName} Spell</span>
            <h2>${spell.name}</h2>
            <p>${spell.description}</p>
            <ul>
                <li><strong>School:</strong> ${schoolName}</li>
                <li><strong>Required Level:</strong> Level ${spell.level}</li>
                <li><strong>Cast Time:</strong> ${spell.castTime}</li>
                <li><strong>Mana Cost:</strong> ${spell.manaCost}</li>
            </ul>
        </div>
    `;
    renderContent(html);
}

// 4. Realms Hub & Details
function loadRealmsIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">World Regions</span>
            <h2>Realms</h2>
            <p>Select a world realm below to inspect its environmental features, monster threats, and zone lore:</p>
            <ul>
    `;

    // Use realms_full from the data source
    const realmsSource = wikiData.realms_full || wikiData.realms || {};
    for (const [key, realm] of Object.entries(realmsSource)) {
        html += `<li><a class="wiki-link" onclick="loadRealmDetail('${key}')">${realm.name}</a> — ${realm.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadRealmDetail(realmKey) {
    const realmsSource = wikiData.realms_full || wikiData.realms || {};
    const realm = realmsSource[realmKey];
    if (!realm) {
        renderContent(`<div class="card"><h2>Realm Not Found</h2><p>No information available for ${realmKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadRealmsIndex()">← Back to Realms</button>
        <div class="card">
            <span class="section-tag">World Realm</span>
            <h2>${realm.name}</h2>
            <p>${realm.description}</p>
            <h3>Realm Features</h3>
            <ul>` + (realm.features || []).map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 5. Races Index & Details
function loadRacesIndex() {
    let html = `
        <div class="card">
            <span class="section-tag">Ancestries</span>
            <h2>Races</h2>
            <p>Select a race below to view racial traits and lore:</p>
            <ul>
    `;

    for (const [key, race] of Object.entries(wikiData.races)) {
        html += `<li><a class="wiki-link" onclick="loadRaceDetail('${key}')">${race.name}</a> — ${race.description}</li>`;
    }

    html += `</ul></div>`;
    renderContent(html);
}

function loadRaceDetail(raceKey) {
    const race = wikiData.races[raceKey];
    const html = `
        <button class="btn-back" onclick="loadRacesIndex()">← Back to Races</button>
        <div class="card">
            <span class="section-tag">Race</span>
            <h2>${race.name}</h2>
            <p>${race.description}</p>
            <h3>Racial Features</h3>
            <ul>` + race.features.map(f => `<li>${f}</li>`).join('') + `</ul>
        </div>
    `;
    renderContent(html);
}

// 6. Game Features (direct pages accessible from nav)
function loadFeature(featureKey) {
    const feature = wikiData.gameFeatures[featureKey];
    if (!feature) {
        renderContent(`<div class="card"><h2>Feature Not Found</h2><p>No information available for ${featureKey}.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadMainPage()">← Back to Home</button>
        <div class="card">
            <span class="section-tag">Game Feature</span>
            <h2>${feature.name}</h2>
            <p>${feature.description}</p>
            <h3>Details</h3>
            <ul>` + feature.details.map((detail, index) => `<li><a class="wiki-link" onclick="loadFeatureDetail('${featureKey}', ${index})">${detail}</a></li>`).join('') + `</ul>
        </div>
    `;

    renderContent(html);
}

function loadFeatureDetail(featureKey, detailIndex) {
    const feature = wikiData.gameFeatures[featureKey];
    const detail = feature && feature.details[detailIndex];
    if (!feature || !detail) {
        renderContent(`<div class="card"><h2>Article Not Found</h2><p>No information available for this entry.</p></div>`);
        return;
    }

    const html = `
        <button class="btn-back" onclick="loadFeature('${featureKey}')">← Back to ${feature.name}</button>
        <div class="card">
            <span class="section-tag">${feature.name} Guide</span>
            <h2>${detail}</h2>
            <p>This starter article covers ${detail.toLowerCase()} as part of ${feature.name.toLowerCase()} in Aetheria. Expand this page later with recipes, requirements, locations, rewards, and gameplay notes.</p>
            <h3>Template Details</h3>
            <ul>
                <li><strong>Category:</strong> ${feature.name}</li>
                <li><strong>Common uses:</strong> Progression, exploration, trade, and adventure preparation</li>
                <li><strong>Availability:</strong> Found through normal play and related activities</li>
            </ul>
        </div>
    `;

    renderContent(html);
}
