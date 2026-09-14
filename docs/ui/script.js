const stage = document.getElementById("ui-stage");
const settingsKey = "aetheria-ui-settings";
const skillBarIds = ["hotbar-1", "hotbar-2", "hotbar-3"];
let uiDataCache = null;
let topWindowLayer = 10;
const defaultPositions = {
    character: { left: "2.5vw", top: "3vh" },
    quest: { right: "2.5vw", top: "58vh" },
    party: { left: "2.5vw", top: "28vh" },
    minimap: { right: "2.5vw", top: "3vh" },
    chat: { left: "2.5vw", bottom: "3vh" },
    "hotbar-1": { left: "calc(50% - 240px)", bottom: "3vh", width: "480px" },
    "hotbar-2": { left: "calc(50% - 240px)", bottom: "13vh" },
    "hotbar-3": { left: "calc(50% - 240px)", bottom: "23vh" }
};

function getSettingsState() {
    const defaults = {
        opacity: 1.00,
        editMode: false,
        windows: {
            "hotbar-1": true,
            "hotbar-2": false,
            "hotbar-3": false
        },
        panelConfig: {
            chat: { width: 350, height: 95, fontSize: 10 },
            "hotbar-1": { orientation: "horizontal", slots: 10 },
            "hotbar-2": { orientation: "horizontal", slots: 10 },
            "hotbar-3": { orientation: "horizontal", slots: 10 }
        }
    };

    try {
        const saved = JSON.parse(localStorage.getItem(settingsKey) || "{}");
        return {
            ...defaults,
            ...saved,
            panelConfig: {
                ...defaults.panelConfig,
                ...(saved.panelConfig || {})
            }
        };
    } catch (error) {
        return { ...defaults };
    }
}

function saveSettingsState(settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
}

async function loadUi() {
    const response = await fetch("data.json");
    const uiData = await response.json();
    uiDataCache = uiData;
    renderPanels(uiData);
    restoreSettings();
    restoreLayout();
    setupSettings();
    setupDragging();
    setupHotbar();
}

function buildSkillBarMarkup(barId, barNumber, slotCount, abilities) {
    const slots = Array.from({ length: slotCount }, (_, slotIndex) => {
        const ability = abilities[(barNumber - 1) * 15 + slotIndex];
        if (!ability) {
            return `<button class="ability empty" type="button" aria-label="Empty ability slot"><span class="ability-icon">+</span></button>`;
        }
        return `<button class="ability" type="button" aria-label="${ability.name}"><span class="ability-icon">${ability.icon}</span>${ability.cooldown ? `<b>${ability.cooldown}</b>` : ""}</button>`;
    }).join("");

    return `<section class="hud-panel hotbar-panel" data-panel="${barId}" data-hotbar-id="${barId}" aria-label="Skill Bar ${barNumber}">
        <div class="hotbar-bar visible" data-hotbar-bar="${barNumber}">
            <div class="ability-row">${slots}</div>
        </div>
    </section>`;
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
        ${skillBarIds.map((barId, index) => {
            const barNumber = index + 1;
            const settings = getSettingsState();
            const slots = Math.min(15, Math.max(5, settings.panelConfig?.[barId]?.slots ?? 10));
            return buildSkillBarMarkup(barId, barNumber, slots, data.abilities);
        }).join("")}
    `);
 }

function restoreSettings() {
    const settings = getSettingsState();
    const opacityValue = Number(settings.opacity ?? 1.0);
    setCssSetting("--panel-opacity", opacityValue);
    document.getElementById("opacity-control").value = String(opacityValue);
    document.querySelectorAll(".hud-panel").forEach(panel => {
        panel.hidden = settings.windows?.[panel.dataset.panel] === false;
    });
    applyPanelSettings();
}

function applyPanelSettings() {
    const settings = getSettingsState();
    const chatPanel = document.querySelector('[data-panel="chat"]');
    const chatConfig = settings.panelConfig?.chat || { width: 350, height: 95, fontSize: 10 };

    if (chatPanel) {
        chatPanel.style.setProperty("--chat-width", `${chatConfig.width || 350}px`);
        chatPanel.style.setProperty("--chat-height", `${chatConfig.height || 95}px`);
        chatPanel.style.setProperty("--chat-font-size", `${chatConfig.fontSize || 10}px`);
    }

    skillBarIds.forEach((barId, index) => {
        const barPanel = document.querySelector(`[data-panel="${barId}"]`);
        const barConfig = settings.panelConfig?.[barId] || { orientation: "horizontal", slots: 10 };
        if (!barPanel) return;
        const orientation = barConfig.orientation === "vertical" ? "vertical" : "horizontal";
        barPanel.classList.toggle("vertical", orientation === "vertical");
        barPanel.dataset.orientation = orientation;

        const slotCount = Math.min(15, Math.max(5, Number(barConfig.slots) || 10));
        const row = barPanel.querySelector(".ability-row");
        if (!row) return;

        row.innerHTML = Array.from({ length: slotCount }, (_, slotIndex) => {
            const ability = uiDataCache?.abilities?.[(index) * 15 + slotIndex];
            if (!ability) {
                return `<button class="ability empty" type="button" aria-label="Empty ability slot"><span class="ability-icon">+</span></button>`;
            }
            return `<button class="ability" type="button" aria-label="${ability.name}"><span class="ability-icon">${ability.icon}</span>${ability.cooldown ? `<b>${ability.cooldown}</b>` : ""}</button>`;
        }).join("");
    });
}

function setCssSetting(name, value) { document.documentElement.style.setProperty(name, value); }

function updateSettingLabels(scale, opacity) {
    document.getElementById("opacity-value").textContent = `${Math.round(opacity * 100)}%`;
}

function showWindowSettingsPopover(panelName) {
    const settings = getSettingsState();
    const popover = document.getElementById("window-settings-popover");
    if (!popover) return;

    const config = settings.panelConfig?.[panelName] || {};
    let content = '';

    if (panelName === "chat") {
        content = `
            <h3>Chat settings</h3>
            <label class="setting-field">
                <span>Width</span>
                <input type="number" min="220" max="600" step="10" value="${config.width || 350}" data-config-key="width" data-panel-name="chat">
            </label>
            <label class="setting-field">
                <span>Height</span>
                <input type="number" min="70" max="220" step="5" value="${config.height || 95}" data-config-key="height" data-panel-name="chat">
            </label>
            <label class="setting-field">
                <span>Font size</span>
                <input type="number" min="8" max="20" step="1" value="${config.fontSize || 10}" data-config-key="fontSize" data-panel-name="chat">
            </label>
        `;
    } else if (skillBarIds.includes(panelName)) {
        const orientation = config.orientation === "vertical" ? "vertical" : "horizontal";
        const slots = Math.min(15, Math.max(5, Number(config.slots) || 10));
        content = `
            <h3>Skill bar settings</h3>
            <label class="setting-field">
                <span>Layout</span>
                <select data-config-key="orientation" data-panel-name="${panelName}">
                    <option value="horizontal" ${orientation === "horizontal" ? "selected" : ""}>Horizontal</option>
                    <option value="vertical" ${orientation === "vertical" ? "selected" : ""}>Vertical</option>
                </select>
            </label>
            <label class="setting-field">
                <span>Skill slots</span>
                <input type="number" min="5" max="15" step="1" value="${slots}" data-config-key="slots" data-panel-name="${panelName}">
            </label>
        `;
    }

    if (!content) {
        popover.hidden = true;
        return;
    }

    popover.innerHTML = content;
    popover.hidden = false;
    popover.style.left = `${window.innerWidth - 380}px`;
    popover.style.top = `${window.innerHeight - 240}px`;

    popover.querySelectorAll("[data-config-key]").forEach(input => {
        input.addEventListener("change", event => {
            const settingsState = getSettingsState();
            const key = event.target.dataset.configKey;
            const current = settingsState.panelConfig?.[panelName] || {};
            const value = event.target.type === "number" ? Number(event.target.value) : event.target.value;
            current[key] = value;
            settingsState.panelConfig[panelName] = current;
            saveSettingsState(settingsState);
            applyPanelSettings();
        });
    });
}

function setupSettings() {
    const toggle = document.getElementById("settings-toggle");
    const panel = document.getElementById("settings-panel");
    const opacity = document.getElementById("opacity-control");
    const editMode = document.getElementById("edit-ui-mode");
    const settings = getSettingsState();
    const windowToggles = document.querySelectorAll("[data-window-toggle]");
    const hotbarToggles = document.querySelectorAll("[data-hotbar-toggle]");
    const save = () => {
        const windows = {};
        windowToggles.forEach(toggle => { windows[toggle.dataset.windowToggle] = toggle.checked; });
        hotbarToggles.forEach(toggle => {
            const barId = `hotbar-${toggle.dataset.hotbarToggle}`;
            windows[barId] = toggle.checked;
        });
        settings.opacity = Number(opacity.value);
        settings.editMode = editMode.checked;
        settings.windows = windows;
        saveSettingsState(settings);
    };

    editMode.checked = settings.editMode === true;
    windowToggles.forEach(toggle => {
        const target = document.querySelector(`[data-panel="${toggle.dataset.windowToggle}"]`);
        toggle.checked = !target || target.hidden !== true;
        toggle.addEventListener("change", () => {
            const panelElement = document.querySelector(`[data-panel="${toggle.dataset.windowToggle}"]`);
            if (panelElement) {
                panelElement.hidden = !toggle.checked;
            }
            save();
        });
    });

    hotbarToggles.forEach(toggle => {
        const barId = `hotbar-${toggle.dataset.hotbarToggle}`;
        const target = document.querySelector(`[data-panel="${barId}"]`);
        toggle.checked = !target || target.hidden !== true;
        toggle.addEventListener("change", () => {
            const panelElement = document.querySelector(`[data-panel="${barId}"]`);
            if (panelElement) {
                panelElement.hidden = !toggle.checked;
            }
            save();
        });
    });

    document.querySelectorAll(".window-visibility .window-settings").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            const panelName = event.currentTarget.dataset.windowSettings;
            const popover = document.getElementById("window-settings-popover");
            if (!popover) return;
            const hide = popover.hidden === false && popover.dataset.panelName === panelName;
            popover.hidden = hide;
            if (hide) return;
            popover.dataset.panelName = panelName;
            showWindowSettingsPopover(panelName);
        });
    });

    toggle.addEventListener("click", () => { panel.hidden = !panel.hidden; toggle.setAttribute("aria-expanded", String(!panel.hidden)); });
    editMode.addEventListener("change", save);
    opacity.addEventListener("input", () => { setCssSetting("--panel-opacity", opacity.value); updateSettingLabels(null, opacity.value); save(); });
    document.addEventListener("click", (event) => {
        const popover = document.getElementById("window-settings-popover");
        if (!popover || popover.hidden) return;
        if (!event.target.closest(".window-settings") && !event.target.closest(".window-settings-popover")) {
            popover.hidden = true;
        }
    });
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
    skillBarIds.forEach((barId, index) => {
        const barPanel = document.querySelector(`[data-panel="${barId}"]`);
        if (!barPanel) return;

        const barConfig = getSettingsState().panelConfig?.[barId] || { orientation: "horizontal", slots: 10 };
        const orientation = barConfig.orientation === "vertical" ? "vertical" : "horizontal";
        barPanel.classList.toggle("vertical", orientation === "vertical");
        barPanel.dataset.orientation = orientation;

        const slotCount = Math.min(15, Math.max(5, Number(barConfig.slots) || 10));
        const row = barPanel.querySelector(".ability-row");
        if (!row) return;

        row.innerHTML = Array.from({ length: slotCount }, (_, slotIndex) => {
            const ability = uiDataCache?.abilities?.[(index) * 15 + slotIndex];
            if (!ability) {
                return `<button class="ability empty" type="button" aria-label="Empty ability slot"><span class="ability-icon">+</span></button>`;
            }
            return `<button class="ability" type="button" aria-label="${ability.name}"><span class="ability-icon">${ability.icon}</span>${ability.cooldown ? `<b>${ability.cooldown}</b>` : ""}</button>`;
        }).join("");
    });
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
