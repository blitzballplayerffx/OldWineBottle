const stage = document.getElementById("ui-stage");
const settingsKey = "aetheria-ui-settings";
let topWindowLayer = 10;
const defaultPositions = {
    character: { left: "2.5vw", top: "3vh" },
    quest: { right: "2.5vw", top: "34vh" },
    party: { left: "2.5vw", top: "28vh" },
    minimap: { right: "2.5vw", top: "3vh" },
    chat: { left: "2.5vw", bottom: "3vh" },
    hotbar: { left: "calc(50% - 160px)", bottom: "3vh" }
};

async function loadUi() {
    const response = await fetch("data.json");
    const uiData = await response.json();
    renderPanels(uiData);
    restoreSettings();
    restoreLayout();
    setupSettings();
    setupDragging();
    setupHotbar();
}

function renderPanels(data) {
    stage.insertAdjacentHTML("beforeend", `
        <section class="hud-panel character-panel" data-panel="character" aria-label="Character status">
            <div class="panel-heading"><div class="character-identity"><div class="avatar-mark">KV</div><div><span class="eyebrow">Level ${data.player.level} · ${data.player.class}</span><h2>${data.player.name}</h2></div></div></div>
            <div class="resource health"><div class="resource-label"><span>Vitality</span><strong>${data.player.health}%</strong></div><div class="meter"><span style="width: ${data.player.health}%"></span></div></div>
            <div class="resource mana"><div class="resource-label"><span>Focus</span><strong>${data.player.mana}%</strong></div><div class="meter"><span style="width: ${data.player.mana}%"></span></div></div>
            <div class="resource stamina"><div class="resource-label"><span>Stamina</span><strong>${data.player.stamina}%</strong></div><div class="meter"><span style="width: ${data.player.stamina}%"></span></div></div>
        </section>
        <section class="hud-panel quest-panel" data-panel="quest" aria-label="Quest tracker">
            <div class="panel-heading"><div><span class="eyebrow accent">Active quest</span><h2>${data.quest.title}</h2></div></div>
            <p>${data.quest.description}</p><div class="quest-progress"><span></span></div><div class="quest-meta"><span>${data.quest.progress} objectives</span><span>${data.quest.reward}</span></div>
        </section>
        <section class="hud-panel party-panel" data-panel="party" aria-label="Party members">
            <div class="panel-heading"><div><span class="eyebrow">Adventuring party</span><h2>Three souls bound</h2></div></div>
            ${data.party.map(member => `<div class="party-member"><div class="member-avatar ${member.color}">${member.name.slice(0, 1)}</div><div class="member-info"><div><strong>${member.name}</strong><span>${member.role}</span></div><div class="mini-meter"><span style="width: ${member.health}%"></span></div></div><span class="member-health">${member.health}%</span></div>`).join("")}
        </section>
        <section class="hud-panel minimap-panel" data-panel="minimap" aria-label="Minimap">
            <div class="panel-heading"><div><span class="eyebrow">Current region</span><h2>${data.player.location}</h2></div></div>
            <div class="minimap"><span class="map-grid"></span><span class="map-path"></span><span class="map-player"></span><span class="map-label label-ruins">Ruins</span><span class="map-label label-camp">Camp</span></div><div class="map-footer"><span>◉ 12:48</span><span>☼ Clear</span></div>
        </section>
        <section class="hud-panel chat-panel" data-panel="chat" aria-label="Chat log">
            <div class="panel-heading"><div><span class="eyebrow">Social feed</span><h2>Party chat</h2></div></div>
            <div class="chat-log">${data.chat.map(line => `<p><span class="chat-channel ${line.channel.toLowerCase()}">${line.channel}</span>${line.name ? `<strong>${line.name}</strong>` : ""}<span>${line.message}</span></p>`).join("")}</div><div class="chat-input"><span>Send a message...</span><button type="button" aria-label="Send message">↵</button></div>
        </section>
        <section class="hud-panel hotbar-panel" data-panel="hotbar" aria-label="Ability hotbar">
            <div class="hotbar-bars">
                ${[1, 2, 3].map((barNumber) => `
                    <div class="hotbar-bar ${barNumber === 1 ? "visible" : "hidden"}" data-hotbar-bar="${barNumber}">
                        <div class="ability-row">
                            ${Array.from({ length: 10 }, (_, index) => {
                                const ability = data.abilities[(barNumber - 1) * 10 + index];
                                return ability ? `<button class="ability" type="button" aria-label="${ability.name}"><span class="ability-icon">${ability.icon}</span>${ability.cooldown ? `<b>${ability.cooldown}</b>` : ""}</button>` : `<button class="ability empty" type="button" aria-label="Empty ability slot"><span class="ability-icon">+</span></button>`;
                            }).join("")}
                        </div>
                    </div>
                `).join("")}
            </div>
        </section>
    `);
}

function restoreSettings() {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    setCssSetting("--panel-opacity", settings.opacity || 0.92);
    document.getElementById("opacity-control").value = settings.opacity || 0.92;
    document.querySelectorAll(".hud-panel").forEach(panel => {
        panel.hidden = settings.windows?.[panel.dataset.panel] === false;
    });
}

function setCssSetting(name, value) { document.documentElement.style.setProperty(name, value); }

function updateSettingLabels(scale, opacity) {
    document.getElementById("opacity-value").textContent = `${Math.round(opacity * 100)}%`;
}

function setupSettings() {
    const toggle = document.getElementById("settings-toggle");
    const panel = document.getElementById("settings-panel");
    const opacity = document.getElementById("opacity-control");
    const editMode = document.getElementById("edit-ui-mode");
    const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
    const windowToggles = document.querySelectorAll("[data-window-toggle]");
    const save = () => {
        const windows = {};
        windowToggles.forEach(toggle => { windows[toggle.dataset.windowToggle] = toggle.checked; });
        localStorage.setItem(settingsKey, JSON.stringify({ opacity: opacity.value, editMode: editMode.checked, windows }));
    };
    editMode.checked = settings.editMode === true;
    windowToggles.forEach(toggle => {
        toggle.checked = !document.querySelector(`[data-panel="${toggle.dataset.windowToggle}"]`).hidden;
        toggle.addEventListener("change", () => {
            const panel = document.querySelector(`[data-panel="${toggle.dataset.windowToggle}"]`);
            panel.hidden = !toggle.checked;
            save();
        });
    });
    document.querySelectorAll(".window-visibility .window-settings").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
        });
    });
    toggle.addEventListener("click", () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); });
    editMode.addEventListener("change", save);
    opacity.addEventListener("input", () => { setCssSetting("--panel-opacity", opacity.value); updateSettingLabels(null, opacity.value); save(); });
}

function setupDragging() {
    document.querySelectorAll(".hud-panel").forEach(panel => {
        panel.addEventListener("pointerdown", event => {
            if (event.button !== 0 || !document.getElementById("edit-ui-mode").checked || (!event.shiftKey && !event.ctrlKey)) return;
            event.preventDefault();
            panel.style.zIndex = String(++topWindowLayer);
            panel.setPointerCapture(event.pointerId);
            const bounds = panel.getBoundingClientRect();
            const scale = getUiScale();
            panel.classList.add("is-dragging");
            const startX = (event.clientX - bounds.left) / scale;
            const startY = (event.clientY - bounds.top) / scale;
            const startWindowScale = getWindowScale(panel);
            const resize = event.ctrlKey;
            const move = moveEvent => {
                const stageBounds = stage.getBoundingClientRect();
                const scale = getUiScale();
                const localX = (moveEvent.clientX - stageBounds.left) / scale;
                const localY = (moveEvent.clientY - stageBounds.top) / scale;
                if (resize) {
                    const diagonalMovement = ((moveEvent.clientX - event.clientX) + (moveEvent.clientY - event.clientY)) / 2;
                    const nextWindowScale = Math.max(0.6, Math.min(2, startWindowScale * (1 + diagonalMovement / 300)));
                    panel.style.setProperty("--window-scale", nextWindowScale.toFixed(3));
                    clampAllPanels();
                } else {
                    const position = clampPosition(panel, localX - startX, localY - startY);
                    panel.style.left = `${position.x}px`;
                    panel.style.top = `${position.y}px`;
                }
                panel.style.right = "auto";
                panel.style.bottom = "auto";
            };
            const stop = () => { panel.classList.remove("is-dragging"); panel.releasePointerCapture(event.pointerId); saveLayout(); panel.removeEventListener("pointermove", move); };
            panel.addEventListener("pointermove", move);
            panel.addEventListener("pointerup", stop, { once: true });
        });
    });
}

function setupHotbar() {
    const hotbarToggles = document.querySelectorAll("[data-hotbar-toggle]");
    const applyHotbarVisibility = () => {
        const visibleBarNumbers = Array.from(hotbarToggles)
            .filter(toggle => toggle.checked)
            .map(toggle => Number(toggle.dataset.hotbarToggle));

        document.querySelectorAll(".hotbar-bar").forEach(bar => {
            const barNumber = Number(bar.dataset.hotbarBar);
            const visible = visibleBarNumbers.includes(barNumber);
            bar.classList.toggle("visible", visible);
            bar.classList.toggle("hidden", !visible);
        });
    };

    hotbarToggles.forEach(toggle => {
        toggle.checked = toggle.dataset.hotbarToggle === "1";
        toggle.addEventListener("change", applyHotbarVisibility);
    });

    applyHotbarVisibility();
}

function saveLayout() {
    // Layout changes are intentionally session-only; scaling always rebuilds the grid.
}

function restoreLayout() {
    document.querySelectorAll(".hud-panel").forEach(panel => {
        const position = defaultPositions[panel.dataset.panel];
        Object.entries(position).forEach(([property, value]) => { panel.style[property] = value; });
        ["left", "top", "right", "bottom"].filter(property => !(property in position)).forEach(property => { panel.style[property] = ""; });
    });
    requestAnimationFrame(clampAllPanels);
}

function getUiScale() { return 1; }

function getWindowScale(panel) {
    return Number.parseFloat(getComputedStyle(panel).getPropertyValue("--window-scale")) || 1;
}

function clampPosition(panel, x, y) {
    const scale = getUiScale();
    const stageBounds = stage.getBoundingClientRect();
    const safetyInset = 2 / scale;
    const panelBounds = panel.getBoundingClientRect();
    const panelWidth = panelBounds.width / scale;
    const panelHeight = panelBounds.height / scale;
    const minimumX = Math.max(0, -stageBounds.left / scale) + safetyInset;
    const minimumY = Math.max(0, -stageBounds.top / scale) + safetyInset;
    const maximumX = Math.min(stage.clientWidth - panelWidth, (window.innerWidth - stageBounds.left) / scale - panelWidth) - safetyInset;
    const maximumY = Math.min(stage.clientHeight - panelHeight, (window.innerHeight - stageBounds.top) / scale - panelHeight) - safetyInset;

    return {
        x: Math.min(Math.max(x, minimumX), Math.max(minimumX, maximumX)),
        y: Math.min(Math.max(y, minimumY), Math.max(minimumY, maximumY))
    };
}

function clampAllPanels() {
    document.querySelectorAll(".hud-panel").forEach(panel => {
        if (panel.hidden) return;
        const bounds = panel.getBoundingClientRect();
        const stageBounds = stage.getBoundingClientRect();
        const scale = getUiScale();
        const position = clampPosition(panel, (bounds.left - stageBounds.left) / scale, (bounds.top - stageBounds.top) / scale);
        panel.style.left = `${position.x}px`;
        panel.style.top = `${position.y}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
    });
}

window.addEventListener("resize", () => {
    clampAllPanels();
});

loadUi().catch(error => console.error("Unable to load UI prototype data:", error));
