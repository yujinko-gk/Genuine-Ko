/**
 * Shared by index (work feed + project-detail pages).
 * On the index Work page, Design and Art are separate feeds (script.js); each uses `PORTFOLIO_FEED_ORDER` filtered to that category.
 * Optional `shortDesc` — legacy; gallery overlay shows title + “View Detail” only.
 * Optional `longDesc` — design: in-page detail on index; fine art: project-detail.html only (`desc`/`longDesc`).
 * Optional `body` — design: second paragraph under hero after `longDesc`; other entries: extra block on standalone detail page.
 * Optional `thumbSrc` — strip thumbnail only; falls back to `src` for main image.
 * Optional `detailStartIndex` — 0-based index into `slides` when opening detail (else matches `src`).
 * Optional `feedBlurb` — design: short copy shown under the image on the index work grid (optional per project).
 * Optional `feedAllSlidesAsMain` — design: if true and `slides` has multiple images, show each slide as a full main image in one grid (no small thumb strip).
 * Optional `youtubeUrl` or `youtubeVideoId` — design: in-page detail shows embedded YouTube instead of hero image (11-char id or youtu.be / watch URL).
 * Optional `detailScrollPage` + `detailArticleHtml` — design: same scroll layout as when `slides` has more than two images (thumb rail hidden; hero = first slide). Optional `detailArticleHtml` is shown above the hero image; remaining slides stack in the article column below the hero.
 * Optional `detailArticleHtmlAfterHero` — design scroll only: HTML shown after the hero image and before the stacked slides (e.g. long essay for one project).
 * Optional `detailArticleStackHeading` — plain text shown as a subheading immediately above the stacked slides (slides after the hero).
 * Optional `detailArticleHtmlAfterFirstStackedImage` — design scroll article: HTML inserted immediately after the first stacked image (slide index 1), before the remaining slides.
 * Optional `slides` — if set, detail page left rail shows only these images for this project.
 * Optional `artworkSpec.lines` — fine art only: medium / dimensions (bottom-right under hero).
 * Optional `artworkDescription` — fine art only: short copy under hero (bottom-left).
 * Design detail pages: `longDesc` or `desc` (bottom-left) and `year` (bottom-right), same footer layout as fine art.
 */
window.PORTFOLIO_GALLERY = {
    design: [
        {
            src: "./images/3.png",
            title: "Fujii Kaze Poster",
            year: "2025",
            longDesc: "A fan art poster exploring visual hierarchy and design elements",
            desc: "",
            body: "",
            detailScrollPage: true,
            detailArticleHtml:
                "<p>A fan art poster exploring visual hierarchy and design elements</p>",
            slides: ["./images/3.png", "./images/3.1.jpg"],
        },
        {
            src: "./images/1.jpg",
            title: "Postcards",
            year: "2024",
            shortDesc: "Postcards filled with moments that grow more meaningful when shared.",
            longDesc:
                "Postcards filled with moments that grow more meaningful when shared.",
            desc: "Postcards filled with moments that grow more meaningful when shared.",
            body: "",
            slides: [
                "./images/1.jpg",
                "./images/PC1.jpg",
                "./images/PC2.jpg",
                "./images/PC3.jpg",
                "./images/PC4.JPG",
            ],
        },
        {
            src: "./images/CS4.jpg",
            detailStartIndex: 0,
            title: "Crescendo",
            year: "2024",
            feedBlurb:
                "Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.",
            longDesc:
                "Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.",
            desc: "Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.",
            body: "",
            detailArticleHtml:
                "<p>Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.</p>",
            slides: [
                "./images/4.jpg",
                "./images/CS1.jpg",
                "./images/CS2.jpg",
                "./images/CS4.jpg",
                "./images/CS3.jpg",
            ],
        },
        {
            src: "./images/GENUINE.jpg",
            title: "BAND KORI",
            year: "2026",
            longDesc:
                "Social media content design for a K-pop band at USC, with a Y2K theme.",
            desc: "Social media content design for a K-pop performance group at USC, with a Y2K theme.",
            body: "",
            slides: ["./images/GENUINE.jpg", "./images/AMANDA.jpg", "./images/LILLIAN.jpg"],
        },
        {
            src: "./images/INDIEGO/PF4.png",
            detailStartIndex: 0,
            title: "INDIEGO",
            year: "2026",
            feedBlurb:
                "INDIEGO is a concept music festival identity that moves between curated performances and open competition. The visual system is built on a monochromatic violet scale, mapping how emerging artists begin invisible and become legible over time.",
            longDesc:
                "INDIEGO is a concept music festival identity that moves between curated performances and open competition. The visual system is built on a monochromatic violet scale, mapping how emerging artists begin invisible and become legible over time.",
            desc:
                "INDIEGO is a concept music festival identity that moves between curated performances and open competition. The visual system is built on a monochromatic violet scale, mapping how emerging artists begin invisible and become legible over time.",
            body: "",
            slides: [
                "./images/INDIEGO/PF1.png",
                "./images/INDIEGO/PF2.png",
                "./images/INDIEGO/PF3.png",
                "./images/INDIEGO/PF4.png",
                "./images/INDIEGO/PF5.png",
                "./images/INDIEGO/PF6.png",
                "./images/INDIEGO/PF7.png",
            ],
        },
        {
            src: "./images/UO.png",
            title: "3D Unreal Object",
            year: "2026",
            longDesc:
                "A kitbashed 3D object merging the Playmobil aesthetic with a drum kit.",
            desc: "A kitbashed 3D object merging the Playmobil aesthetic with a drum kit.",
            body: "",
            detailScrollPage: true,
            slides: ["./images/UO.png", "./images/Unreal Object.obj"],
        },
        {
            src: "./images/IN.png",
            title: "Research Project: The Transformation of the Digital Music Ecosystem",
            year: "2026",
            feedBlurb:
                "This infographic traces the ongoing development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed.",
            longDesc:
                "This infographic traces the ongoing development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed. The rules of the system have gradually shifted from ownership (buying albums or downloads) to access (streaming subscriptions), and now to algorithm-driven exposure, where visibility depends on data, engagement, and virality rather than direct purchase.",
            desc:
                "This infographic traces the ongoing development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed. The rules of the system have gradually shifted from ownership (buying albums or downloads) to access (streaming subscriptions), and now to algorithm-driven exposure, where visibility depends on data, engagement, and virality rather than direct purchase.",
            body: "",
            detailArticleHtmlAfterHero:
                "<p>Today, the music industry is facing a new challenge with AI-generated music. Major record labels such as UMG, Sony, and Warner have filed lawsuits against AI music platforms like Suno and Udio over copyright ownership, and the legal battle is still ongoing.</p>" +
                "<p>This system works through the constant development of devices and platforms that shape how listeners access music. From MP3 players and iPods to streaming apps and short-form video platforms, each technological shift has changed not only how music is distributed but also how it is consumed. The rules of the system have gradually shifted from ownership (buying albums or downloads) to access (streaming subscriptions), and now to algorithm-driven exposure, where visibility depends on data, engagement, and virality rather than direct purchase.</p>" +
                "<p>Rather than being controlled mainly by record labels, the system is now largely structured by technology companies that design platforms and recommendation algorithms. As shown in the diagram, every new device and platform reshapes access, redistributes power, and redefines economic value within the ecosystem. Listeners benefit from easier and cheaper access to music, while platforms gain data and long-term user engagement. However, artists often receive smaller revenue per stream, and their visibility depends heavily on algorithmic systems they do not control. What is also noticeable is that the roles of these three groups keep shifting over time.</p>" +
                "<p>Even though the number of listeners increased dramatically since 1999, industry revenue shrank for years before slowly recovering. This was largely due to the shift in listening methods, from physical ownership to subscription-based streaming. This suggests that increased access does not automatically translate into revenue. Now that AI-generated music is entering the market, it has opened up a new kind of conflict that we have not experienced before. AI can produce music faster and on a larger scale, and it challenges ideas of authorship and originality, raising new questions about copyright and creative labor.</p>",
            detailArticleStackHeading: "Close up shots",
            slides: [
                "./images/IN.png",
                "./images/INFO 1/1.png",
                "./images/INFO 1/2.png",
                "./images/INFO 1/3.png",
                "./images/INFO 1/4.png",
            ],
        },
    ],
    fineart: [
        {
            src: "./images/art1.jpg",
            title: "愛 (the invisible)",
            desc: "",
            body: "",
            artworkDescription:
                "Words cannot fully capture the nature of love and affection across time and moments.",
            artworkSpec: {
                lines: ["2024", "Acrylic Gouache and Colored Pencils", '11.5" × 15"'],
            },
        },
        {
            src: "./images/art2.jpg",
            title: "The Elusive",
            desc: "",
            body: "",
            artworkDescription:
                "People sometimes treat others as extensions of themselves, but we all live our own lives. No one can truly be held.",
            artworkSpec: {
                lines: ["2024", "Mixed Media", '20.5" × 18"'],
            },
        },
        {
            src: "./images/art3.jpg",
            title: "Remnants of Being",
            desc: "",
            body: "",
            artworkDescription:
                "A pen drawing capturing the traces left behind in the bathroom of Mosaic House, Venice, CA.",
            artworkSpec: {
                lines: ["2024", "Pen on Illustration Board", '15" × 12.1"'],
            },
        },
        {
            src: "./images/art4.jpg",
            title: "Natural Forms",
            desc: "",
            body: "",
            artworkDescription:
                "An abstract exploration of natural forms inspired by the patterns and shapes found in nature.",
            artworkSpec: {
                lines: ["2023", "Mixed Media", '21" × 31" × 19"'],
            },
        },
        {
            src: "./images/anxiety.png",
            title: "Anxiety: Experimental Video Art",
            year: "2025",
            desc: "",
            body: "",
            slides: ["./images/anxiety.png"],
            youtubeUrl: "https://youtu.be/QlxtINml57g?si=HdDlkoYDDYY6AhW1",
            artworkDescription: "",
            artworkSpec: {
                lines: ["2025", "Video"],
            },
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
