let aetheriaData = null;

/*
========================================
SLIDER STATE
========================================
*/
const sliderState = {
    home: 0,
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
        topNav.innerHTML = aetheriaData.topNavLinks.map(link => 
            `<a href="${link.href}" class="top-nav-btn" ${link.target ? `target="${link.target}" rel="noopener noreferrer"` : ''}>${link.label}</a>`
        ).join('');
    }

    // 2. Quick Links
    const quickLinks = document.getElementById("quick-links-bar");
    if (quickLinks) {
        quickLinks.innerHTML = aetheriaData.quickLinks.map(link => 
            `<a href="${link.href}" class="quick-link">${link.label}</a>`
        ).join('');
    }

    // 3. Home Slider
    const homeSlider = document.getElementById("homeSlider");
    const homeDots = document.getElementById("homeDots");
    if (homeSlider) {
        homeSlider.innerHTML = aetheriaData.homeSlides.map(slide => {
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

        if (homeDots) {
            homeDots.innerHTML = aetheriaData.homeSlides.map((_, i) => 
                `<div class="dot ${i === 0 ? 'active' : ''}" onclick="userSelectHomeSlide(${i})"></div>`
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
let homeAutoCycleTimer = null;

function startHomeAutoCycle() {
    stopHomeAutoCycle();
    homeAutoCycleTimer = setInterval(() => {
        const slider = document.getElementById("homeSlider");
        if (!slider) return;

        const totalSlides = slider.querySelectorAll(".slide").length;
        let nextIndex = (sliderState.home + 1) % totalSlides;
        swapSlide("home", nextIndex);
    }, 4000);
}

function stopHomeAutoCycle() {
    if (homeAutoCycleTimer) {
        clearInterval(homeAutoCycleTimer);
    }
}

function userSelectHomeSlide(index) {
    swapSlide("home", index);
    startHomeAutoCycle();
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
EVENTS & INIT
========================================
*/
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("data_main.json");
        aetheriaData = await response.json();
    } catch (err) {
        console.error("Error loading data_main.json:", err);
        return;
    }

    renderApp();

    const homeSliderElement = document.getElementById("homeSlider");
    if (homeSliderElement) {
        homeSliderElement.addEventListener("mouseenter", stopHomeAutoCycle);
        homeSliderElement.addEventListener("mouseleave", startHomeAutoCycle);
    }

    window.addEventListener("resize", updateSliderPositions);

    updateSliderPositions();

    swapSlide("home", 0);
    swapSlide("features", 0);
    swapSlide("realms", 0);
    swapSlide("races", 0);
    swapSlide("classes", 0);

    startHomeAutoCycle();
});