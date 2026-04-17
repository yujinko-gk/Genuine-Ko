document.addEventListener("DOMContentLoaded", () => {
    const data = window.PORTFOLIO_GALLERY;
    if (!data) {
        window.location.replace("index.html");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const index = parseInt(params.get("index"), 10);

    const list = data[category];
    const project = list && !Number.isNaN(index) ? list[index] : null;

    if (!project) {
        window.location.replace("index.html");
        return;
    }

    document.title = `${project.title} | Genuine Ko`;

    const hero = document.getElementById("detail-hero");
    const thumbsWrap = document.getElementById("detail-thumbs");
    const titleEl = document.getElementById("detail-title");
    const yearEl = document.getElementById("detail-year");
    const descEl = document.getElementById("detail-desc");
    const bodyWrap = document.getElementById("detail-body-wrap");
    const bodyEl = document.getElementById("detail-body");
    const artworkSpecEl = document.getElementById("detail-artwork-spec");
    const artworkDescEl = document.getElementById("detail-artwork-description");

    const slideSources =
        Array.isArray(project.slides) && project.slides.length > 0
            ? project.slides
            : [project.src];

    const isFineArt = category === "fineart";
    const isDesign = category === "design";
    const hasMultipleSlides = slideSources.length > 1;
    const showThumbs = !isFineArt && hasMultipleSlides;
    if (!showThumbs) {
        document.body.classList.add("project-detail--no-thumbs");
        if (thumbsWrap) {
            thumbsWrap.innerHTML = "";
            thumbsWrap.hidden = true;
        }
    } else if (thumbsWrap) {
        document.body.classList.remove("project-detail--no-thumbs");
        thumbsWrap.hidden = false;
    }

    let activeSlide = 0;

    function setArtworkDescription() {
        if (!artworkDescEl) return;
        artworkDescEl.classList.remove("detail-artwork-description--visible");
        let text = "";
        if (isFineArt) {
            const raw = project.artworkDescription;
            if (typeof raw === "string") text = raw.trim();
            else if (raw && typeof raw.text === "string") text = raw.text.trim();
        } else if (isDesign) {
            text = (project.longDesc || project.desc || "").trim();
        }
        if (!text) {
            artworkDescEl.hidden = true;
            artworkDescEl.replaceChildren();
            return;
        }
        artworkDescEl.hidden = false;
        artworkDescEl.replaceChildren();
        const p = document.createElement("p");
        p.className = "detail-artwork-description__text";
        p.textContent = text;
        artworkDescEl.appendChild(p);
    }

    function setArtworkSpec() {
        if (!artworkSpecEl) return;
        artworkSpecEl.classList.remove("detail-artwork-spec--visible");
        artworkSpecEl.classList.remove("detail-artwork-spec--year-only");

        if (isDesign) {
            const y = (project.year || "").trim();
            if (!y) {
                artworkSpecEl.hidden = true;
                artworkSpecEl.replaceChildren();
                return;
            }
            artworkSpecEl.hidden = false;
            artworkSpecEl.classList.add("detail-artwork-spec--year-only");
            artworkSpecEl.replaceChildren();
            const p = document.createElement("p");
            p.textContent = y;
            artworkSpecEl.appendChild(p);
            return;
        }

        const spec = project.artworkSpec;
        const lines =
            isFineArt && spec && Array.isArray(spec.lines) ? spec.lines.filter(Boolean) : [];
        if (!lines.length) {
            artworkSpecEl.hidden = true;
            artworkSpecEl.replaceChildren();
            return;
        }
        artworkSpecEl.hidden = false;
        artworkSpecEl.replaceChildren();
        lines.forEach((line) => {
            const p = document.createElement("p");
            p.textContent = line;
            artworkSpecEl.appendChild(p);
        });
    }

    function revealArtworkFooter() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (artworkDescEl && !artworkDescEl.hidden) {
                    artworkDescEl.classList.add("detail-artwork-description--visible");
                }
                if (artworkSpecEl && !artworkSpecEl.hidden) {
                    artworkSpecEl.classList.add("detail-artwork-spec--visible");
                }
            });
        });
    }

    function setMeta() {
        titleEl.textContent = project.title;
        const longExplanation = project.longDesc || project.desc || "";
        const useFooterForDesignOrArt = isFineArt || isDesign;

        if (useFooterForDesignOrArt) {
            descEl.hidden = true;
            descEl.textContent = "";
            yearEl.hidden = true;
            yearEl.textContent = "";
        } else {
            descEl.textContent = longExplanation;
            descEl.hidden = !longExplanation;
            const year = (project.year || "").trim();
            if (year) {
                yearEl.textContent = year;
                yearEl.hidden = false;
            } else {
                yearEl.hidden = true;
                yearEl.textContent = "";
            }
        }

        const extra = (project.body || "").trim();
        if (extra) {
            bodyEl.textContent = extra;
            bodyWrap.hidden = false;
        } else {
            bodyWrap.hidden = true;
            bodyEl.textContent = "";
        }

        setArtworkDescription();
        setArtworkSpec();
    }

    function setHeroFromSlide(i) {
        activeSlide = i;
        const src = slideSources[i];
        hero.src = src;
        hero.alt = `${project.title} — image ${i + 1}`;
        setActiveThumb(i);
    }

    function setActiveThumb(activeIndex) {
        if (!thumbsWrap || !showThumbs) return;
        const buttons = thumbsWrap.querySelectorAll(".detail-thumb");
        buttons.forEach((btn, i) => {
            const on = i === activeIndex;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-current", on ? "true" : "false");
        });
    }

    if (showThumbs && thumbsWrap) {
        slideSources.forEach((src, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "detail-thumb";
            btn.setAttribute("aria-label", `Show image ${i + 1}`);

            const img = document.createElement("img");
            img.src = src;
            img.alt = "";
            btn.appendChild(img);

            btn.addEventListener("click", () => setHeroFromSlide(i));
            thumbsWrap.appendChild(btn);
        });
    }

    let initialSlide = slideSources.indexOf(project.src);
    if (initialSlide < 0) initialSlide = 0;
    if (
        typeof project.detailStartIndex === "number" &&
        !Number.isNaN(project.detailStartIndex)
    ) {
        initialSlide = Math.max(
            0,
            Math.min(project.detailStartIndex, slideSources.length - 1)
        );
    }

    setMeta();
    setHeroFromSlide(initialSlide);
    setTimeout(revealArtworkFooter, 520);

    if (hero && slideSources.length > 1) {
        hero.classList.add("detail-hero--advance");
        hero.setAttribute("role", "button");
        hero.setAttribute("tabindex", "0");
        hero.setAttribute(
            "aria-label",
            "Show next image. Use Arrow Down for next and Arrow Up for previous."
        );

        function goToNextSlide() {
            setHeroFromSlide((activeSlide + 1) % slideSources.length);
        }

        hero.addEventListener("click", goToNextSlide);
        hero.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goToNextSlide();
            }
        });

        function goToPrevSlide() {
            const n = slideSources.length;
            setHeroFromSlide((activeSlide - 1 + n) % n);
        }

        document.addEventListener("keydown", (e) => {
            const t = e.target;
            if (
                t &&
                t.closest &&
                t.closest('input, textarea, select, [contenteditable="true"]')
            ) {
                return;
            }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                if (e.key === "ArrowDown") goToNextSlide();
                else goToPrevSlide();
            }
        });
    }

    hero.classList.add("detail-hero--enter");
    requestAnimationFrame(() => hero.classList.add("detail-hero--enter-active"));
});
