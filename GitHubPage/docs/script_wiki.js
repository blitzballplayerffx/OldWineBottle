let wikiData = null;

// Initialize and fetch central JSON data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data_wiki.json');
        wikiData = await response.json();
        loadMainPage();
    } catch (error) {
        console.error('Error loading wiki data:', error);
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <h2>Error Loading Data</h2>
                <p>Could not fetch data.json. Ensure you are running on a local or web server.</p>
            </div>`;
    }
});

function renderContent(html) {
    const container = document.getElementById('content-area');
    container.innerHTML = html;
    window.scrollTo(0, 0);
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
        <button class="btn-back" onclick="loadMainPage()">← Back to Main Page</button>
        <div class="card">
            <span class="section-tag">Game Feature</span>
            <h2>${feature.name}</h2>
            <p>${feature.description}</p>
            <h3>Details</h3>
            <ul>` + feature.details.map(d => `<li>${d}</li>`).join('') + `</ul>
        </div>
    `;

    renderContent(html);
}
