/**
 * Shared by index (work feed + in-page detail) and project-detail.html.
 * Field usage (see script.js / project-detail.js):
 * - `feedBlurb` (design): work feed caption under the image; overrides `longDesc` / `desc` / `shortDesc` when set.
 * - `longDesc` / `desc` / `shortDesc` (design): feed caption when no `feedBlurb` (`longDesc` first). Fine art feed: `artworkDescription`, else `desc`.
 * - `longDesc` + `body` (design): in-page / standalone detail footer (#work-detail-artwork-description / #detail-artwork-description) when layout is NOT scroll-page. First paragraph = `longDesc || desc`, second = `body`.
 * - `workFeedThumbSlideIndices` (design, optional): 0-based indices into `slides` for which images appear in the work-feed thumbnail strip only; `slides` / detail unchanged.
 * - `feedCoverWidth` / `feedCoverHeight` (design, optional): fixed feed hero frame (e.g. 1080×1350) with object-fit cover so slide swaps do not resize the card.
 * - `detailCarousel` (design, optional): Instagram-style left/right slide navigation instead of vertical scroll-page (even when slides.length > 2).
 * - `detailHideYear` (design, optional): hide year in the detail artwork footer (feed year still shown).
 * - `detailArticleHtml`, `detailArticleHtmlAfterHero`, `detailArticleHtmlAfterFirstStackedImage`, `detailArticleStackHeading`: scroll-page design detail (slides > 2 or `detailScrollPage`), via portfolioDetailScrollArticle* helpers.
 * - `detailDesc` / year in index modal: hidden for design + fine art (copy lives in artwork footer instead).
 */
window.PORTFOLIO_GALLERY = {
    design: [
        {
            src: "./images 2/JGS.pdf/9.webp",
            width: 1920,
            height: 1080,
            title: "Redesign the Ordinary: Jorgenson Lockers",
            year: "2026",
            longDesc:
                "Through a redesigned logo and visual identity, this project reimagines Jorgenson Lockers to balance durability and stability with the creative and immersive qualities lockers can offer.",
            body: "",
            detailScrollPage: true,
            slides: [
                "./images 2/JGS.pdf/1.webp",
                "./images 2/JGS.pdf/2.webp",
                "./images 2/JGS.pdf/3.webp",
                "./images 2/JGS.pdf/4.webp",
                "./images 2/JGS.pdf/5.webp",
                "./images 2/JGS.pdf/6.webp",
                "./images 2/JGS.pdf/7.webp",
                "./images 2/JGS.pdf/8.webp",
                "./images 2/JGS.pdf/9.webp",
                "./images 2/JGS.pdf/10.webp",
                "./images 2/JGS.pdf/11.webp",
                "./images 2/JGS.pdf/12.webp",
                "./images 2/JGS.pdf/13.webp",
            ],
            /* Main feed: strip shows slides 7–13 only (indices 6–12). Detail still uses full `slides`. */
            workFeedThumbSlideIndices: [6, 7, 8, 9, 10, 11, 12],
        },
        {
            src: "./images 2/Fujii Kaze poster only.webp",
            width: 2000,
            height: 2860,
            title: "Fujii Kaze Poster",
            year: "2025",
            detailHideYear: true,
            longDesc: "A fan art poster exploring visual hierarchy and design elements",
        },
        {
            src: "./images 2/1.webp",
            width: 3000,
            height: 1854,
            title: "Postcards",
            year: "2024",
            longDesc:
                "Postcards filled with moments that grow more meaningful when shared.",
            slides: [
                "./images 2/1.webp",
                "./images 2/PC1.webp",
                "./images 2/PC2.webp",
                "./images 2/PC3.webp",
                "./images 2/PC4.webp",
            ],
        },
        {
            src: "./images 2/CS2.webp",
            width: 5121,
            height: 3166,
            detailStartIndex: 1,
            title: "Crescendo",
            year: "2024",
            feedBlurb:
                "Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people who struggle with verbal communication find their own voice.",
            detailArticleHtml:
                "<p>Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.</p>",
            slides: [
                "./images 2/CS1.webp",
                "./images 2/CS2.webp",
                "./images 2/CS3.webp",
                "./images 2/CS4.webp",
            ],
        },
        {
            src: "./images 2/LILLIAN.webp",
            width: 1080,
            height: 1350,
            feedCoverWidth: 1080,
            feedCoverHeight: 1350,
            title: "BAND KORI: NEWBIES",
            year: "2026",
            detailCarousel: true,
            longDesc:
                "Social media content design for a K-pop band at USC, with a Y2K theme.",
            slides: ["./images 2/LILLIAN.webp", "./images 2/GENUINE.webp", "./images 2/AMANDA.webp"],
        },
        {
            src: "./images 2/KORI_eboardpost1.webp",
            width: 1080,
            height: 1350,
            feedCoverWidth: 1080,
            feedCoverHeight: 1350,
            title: "BAND KORI: E-BOARD",
            year: "2026",
            detailCarousel: true,
            longDesc:
                "E-board post design for Band Kori, USC's K-pop band.",
            slides: [
                "./images 2/KORI_eboardpost1.webp",
                "./images 2/KORI_eboardpost2.webp",
                "./images 2/KORI_eboardpost3.webp",
                "./images 2/KORI_eboardpost4.webp",
                "./images 2/KORI_eboardpost5.webp",
                "./images 2/KORI_eboardpost6.webp",
            ],
        },
        {
            src: "./images 2/INDIEGO/PF4.webp",
            width: 6755,
            height: 4175,
            detailStartIndex: 0,
            title: "INDIEGO",
            year: "2026",
            feedBlurb:
                "INDIEGO is a concept music festival identity that moves between curated performances and open competition. The visual system is built on a monochromatic violet scale, mapping how emerging artists begin invisible and become legible over time.",
            slides: [
                "./images 2/INDIEGO/PF3.webp",
                "./images 2/INDIEGO/PF4.webp",
                "./images 2/INDIEGO/PF5.webp",
                "./images 2/INDIEGO/PF6.webp",
            ],
        },
        {
            src: "./images 2/IN.webp?v=2",
            width: 8846,
            height: 5466,
            title: "Research Project: The Transformation of the Digital Music Ecosystem",
            year: "2026",
            feedBlurb:
                "This infographic traces the ongoing development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed.",
            detailArticleHtmlAfterHero:
                "<p>Today, the music industry is facing a new challenge with AI-generated music. Major record labels such as UMG, Sony, and Warner have filed lawsuits against AI music platforms like Suno and Udio over copyright ownership, and the legal battle is still ongoing.</p>" +
                "<p>This system works through the constant development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed. The rules of the system have gradually shifted from ownership (buying albums or downloads) to access (streaming subscriptions), and now to algorithm-driven exposure, where visibility depends on data, engagement, and virality rather than direct purchase.</p>" +
                "<p>Rather than being controlled mainly by record labels, the system is now largely structured by technology companies that design platforms and recommendation algorithms. As shown in the diagram, every new device and platform reshapes access, redistributes power, and redefines economic value within the ecosystem. Listeners benefit from easier and cheaper access to music, while platforms gain data and long-term user engagement. However, artists often receive smaller revenue per stream, and their visibility depends heavily on algorithmic systems they do not control. What is also noticeable is that the roles of these three groups keep shifting over time.</p>" +
                "<p>Even though the number of listeners increased dramatically since 1999, industry revenue shrank for years before slowly recovering. This was largely due to the shift in listening methods, from physical ownership to subscription-based streaming. This suggests that increased access does not automatically translate into revenue. Now that AI-generated music is entering the market, it has opened up a new kind of conflict that we have not experienced before. AI can produce music faster and on a larger scale, and it challenges ideas of authorship and originality, raising new questions about copyright and creative labor.</p>",
            detailArticleStackHeading: "Close up shots",
            slides: [
                "./images 2/IN.webp?v=2",
                "./images 2/INFO 1/1.webp",
                "./images 2/INFO 1/2.webp",
                "./images 2/INFO 1/3.webp",
                "./images 2/INFO 1/4.webp",
            ],
        },
    ],
};

/**
 * Scroll-page design: copy shown above the hero (`detailArticleHtml`).
 */
window.portfolioDetailScrollArticleLeadHtml = function (item) {
    if (!item) return "";
    return typeof item.detailArticleHtml === "string" ? item.detailArticleHtml : "";
};

/**
 * Scroll-page design detail: remaining slides stacked vertically (slide 0 is the hero only — not repeated).
 */
window.portfolioDetailScrollArticleHtml = function (item) {
    if (!item) return "";
    const slideList =
        Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [item.src];
    const rest = slideList.length > 1 ? slideList.slice(1) : [];
    const afterFirstStacked =
        typeof item.detailArticleHtmlAfterFirstStackedImage === "string"
            ? item.detailArticleHtmlAfterFirstStackedImage
            : "";
    const title = (item.title || "").trim() || "Project";
    const escAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const escHtmlText = (v) =>
        String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const stackHeadingRaw =
        typeof item.detailArticleStackHeading === "string" ? item.detailArticleStackHeading.trim() : "";
    const stackHeadingHtml = stackHeadingRaw
        ? `<h3 class="work-detail-article__stack-heading">${escHtmlText(stackHeadingRaw)}</h3>`
        : "";
    const stack = rest
        .map((src, i) => {
            let block = "";
            if (/\.obj$/i.test(src)) {
                block = `<div class="work-detail-article__asset work-detail-obj-viewer-wrap" data-obj-src="${escAttr(
                    src
                )}"><div class="work-detail-obj-viewer__stage" aria-label="Interactive 3D model"></div><p class="work-detail-obj-viewer__hint">Drag to rotate</p></div>`;
            } else {
                block = `<figure class="work-detail-article__fig"><img class="work-detail-article__img" src="${escAttr(
                    src
                )}" alt="${escAttr(`${title} — image ${i + 2}`)}" loading="lazy" decoding="async"></figure>`;
            }
            if (i === 0 && afterFirstStacked) {
                block += afterFirstStacked;
            }
            return block;
        })
        .join("");
    return stackHeadingHtml + stack;
};
