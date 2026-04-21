document.addEventListener('DOMContentLoaded', () => {
    const useFinePointerChrome =
        window.matchMedia('(pointer: fine)').matches &&
        window.matchMedia('(hover: hover)').matches;

    // --- Custom Cursor (mouse / fine pointer only) ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (useFinePointerChrome && cursor && follower) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;
        });

        function animateFollower() {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;

            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;

            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        const attachHoverEffects = () => {
            const interactiveElements = document.querySelectorAll(
                'a, button, .interactive, .main-title, .site-sidebar__social-link, .work-detail-close, .work-feed-item, .work-feed-thumb'
            );
            interactiveElements.forEach((el) => {
                el.addEventListener('mouseenter', () => follower.classList.add('active'));
                el.addEventListener('mouseleave', () => follower.classList.remove('active'));
            });
        };
        attachHoverEffects();
    } else {
        if (cursor) cursor.style.display = 'none';
        if (follower) follower.style.display = 'none';
    }

    // --- Cursor click stamps (fine pointer only) ---
    if (useFinePointerChrome) {
        const stampsLayer = document.createElement('div');
        stampsLayer.id = 'cursor-stamps-layer';
        stampsLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(stampsLayer);

        const STAMP_DRAG_THRESHOLD_PX = 12;
        const STAMP_DRAG_THRESHOLD_SQ = STAMP_DRAG_THRESHOLD_PX * STAMP_DRAG_THRESHOLD_PX;
        const STAMP_VISIBLE_MS = 2600;
        const STAMP_FADE_MS = 550;
        const STAMP_MAX_COUNT = 24;

        let stampGestureOrigin = null;
        let stampMaxDistSq = 0;
        let stampClickEligible = false;

        window.addEventListener(
            'pointerdown',
            (e) => {
                if (e.button !== 0) return;
                stampGestureOrigin = { x: e.clientX, y: e.clientY };
                stampMaxDistSq = 0;
                stampClickEligible = false;
            },
            true
        );

        window.addEventListener(
            'pointermove',
            (e) => {
                if (!stampGestureOrigin || !e.buttons) return;
                const dx = e.clientX - stampGestureOrigin.x;
                const dy = e.clientY - stampGestureOrigin.y;
                const d = dx * dx + dy * dy;
                if (d > stampMaxDistSq) stampMaxDistSq = d;
            },
            true
        );

        window.addEventListener(
            'pointerup',
            (e) => {
                if (e.button !== 0 || !stampGestureOrigin) return;
                stampClickEligible = stampMaxDistSq <= STAMP_DRAG_THRESHOLD_SQ;
                stampGestureOrigin = null;
            },
            true
        );

        function spawnCursorStamp(clientX, clientY) {
            if (!stampsLayer) return;
            while (stampsLayer.children.length >= STAMP_MAX_COUNT) {
                stampsLayer.firstElementChild?.remove();
            }

            const ringLarge = follower && follower.classList.contains('active');
            const stamp = document.createElement('div');
            stamp.className = 'cursor-stamp';
            stamp.style.left = `${clientX}px`;
            stamp.style.top = `${clientY}px`;

            const ring = document.createElement('div');
            ring.className =
                'cursor-stamp__ring' + (ringLarge ? ' cursor-stamp__ring--large' : '');

            stamp.appendChild(ring);
            stampsLayer.appendChild(stamp);

            requestAnimationFrame(() => stamp.classList.add('cursor-stamp--visible'));

            window.setTimeout(() => {
                stamp.classList.add('cursor-stamp--leaving');
                window.setTimeout(() => stamp.remove(), STAMP_FADE_MS);
            }, STAMP_VISIBLE_MS);
        }

        /** Stamps on “empty” clicks only — not on links, buttons, or other UI that does something. */
        function shouldSuppressCursorStamp(target) {
            return Boolean(
                target.closest(
                    [
                        'a[href]',
                        'button',
                        'input',
                        'textarea',
                        'select',
                        'label',
                        '.link-item',
                        '#logo',
                        '.about-inline-link',
                        '.social-links a',
                        '.work-feed-item__media img',
                        '.work-feed-thumb',
                        '.work-detail-thumb',
                        '#work-detail-close',
                        '.work-detail-close',
                        '#work-detail-youtube',
                        '.work-detail-youtube',
                        '.detail-back',
                        '.detail-thumb',
                    ].join(', ')
                )
            );
        }

        document.addEventListener(
            'click',
            (e) => {
                if (e.button !== 0) return;
                if (!stampClickEligible) return;
                stampClickEligible = false;
                if (shouldSuppressCursorStamp(e.target)) return;
                spawnCursorStamp(e.clientX, e.clientY);
            },
            true
        );
    }

    // --- Drag to draw floating gray lines ---
    const drawLayer = document.getElementById('draw-layer');
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const floatingLines = [];
    let drawingPath = null;
    let drawingPoints = [];
    let isDrawingLine = false;

    function isInteractiveTarget(target) {
        return Boolean(target.closest(
            'a, button, input, textarea, select, .work-detail-panel, .work-detail-dialog, .work-detail-layer, #work-detail-close, .work-feed, #about-section, .site-sidebar'
        ));
    }

    function compressPoints(points) {
        if (points.length <= 2) return points;
        const reduced = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
            const prev = reduced[reduced.length - 1];
            const curr = points[i];
            if (Math.hypot(curr.x - prev.x, curr.y - prev.y) >= 3) reduced.push(curr);
        }
        reduced.push(points[points.length - 1]);
        return reduced;
    }

    function pointsToPath(points) {
        if (!points.length) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return d;
    }

    function animateFloatingLines() {
        for (let i = 0; i < floatingLines.length; i++) {
            const line = floatingLines[i];
            line.tx += line.vx;
            line.ty += line.vy;
            line.rot += line.vr;

            const bb = line.baseBox;
            const minX = bb.x + line.tx;
            const minY = bb.y + line.ty;
            const maxX = minX + bb.width;
            const maxY = minY + bb.height;
            const pad = 50;

            if (maxX < -pad) line.tx += window.innerWidth + bb.width + pad * 2;
            if (minX > window.innerWidth + pad) line.tx -= window.innerWidth + bb.width + pad * 2;
            if (maxY < -pad) line.ty += window.innerHeight + bb.height + pad * 2;
            if (minY > window.innerHeight + pad) line.ty -= window.innerHeight + bb.height + pad * 2;

            line.el.setAttribute('transform', `translate(${line.tx} ${line.ty}) rotate(${line.rot} ${line.cx} ${line.cy})`);
        }
        requestAnimationFrame(animateFloatingLines);
    }
    if (useFinePointerChrome) {
        requestAnimationFrame(animateFloatingLines);
    }

    if (useFinePointerChrome && drawLayer) {
        const setLayerSize = () => {
            drawLayer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
        };
        setLayerSize();
        window.addEventListener('resize', setLayerSize);

        window.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || isInteractiveTarget(e.target)) return;
            isDrawingLine = true;
            drawingPoints = [{ x: e.clientX, y: e.clientY }];
            drawingPath = document.createElementNS(SVG_NS, 'path');
            drawingPath.classList.add('draw-line');
            drawLayer.appendChild(drawingPath);
            drawingPath.setAttribute('d', pointsToPath(drawingPoints));
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDrawingLine || !drawingPath) return;
            drawingPoints.push({ x: e.clientX, y: e.clientY });
            drawingPath.setAttribute('d', pointsToPath(compressPoints(drawingPoints)));
        });

        window.addEventListener('pointerup', () => {
            if (!isDrawingLine || !drawingPath) return;
            isDrawingLine = false;
            const finalPoints = compressPoints(drawingPoints);
            if (finalPoints.length < 2) {
                drawingPath.remove();
                drawingPath = null;
                drawingPoints = [];
                return;
            }

            drawingPath.setAttribute('d', pointsToPath(finalPoints));
            const box = drawingPath.getBBox();
            floatingLines.push({
                el: drawingPath,
                tx: 0,
                ty: 0,
                rot: 0,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                vr: (Math.random() - 0.5) * 0.035,
                cx: box.x + box.width / 2,
                cy: box.y + box.height / 2,
                baseBox: box
            });

            // Let each line live ~10s, then fade out and remove.
            const lineEl = drawingPath;
            setTimeout(() => {
                lineEl.style.transition = 'opacity 0.6s ease';
                lineEl.style.opacity = '0';
                setTimeout(() => {
                    const idx = floatingLines.findIndex((line) => line.el === lineEl);
                    if (idx !== -1) floatingLines.splice(idx, 1);
                    lineEl.remove();
                }, 620);
            }, 10000);

            drawingPath = null;
            drawingPoints = [];
        });
    }

    // --- Page Transitions ---
    const navDesign = document.getElementById('nav-design');
    const navArt = document.getElementById('nav-art');
    const navAbout = document.getElementById('nav-about');
    const logo = document.getElementById('logo');

    // --- Work feed (single scrollable list: custom order, pairs read left → right in the grid) ---
    const galleryData = window.PORTFOLIO_GALLERY || { design: [], fineart: [] };

    /** Matches `title` in projects-data.js: even index = left column, odd = right (each column stacks top → bottom). */
    const PORTFOLIO_FEED_ORDER = [
        'Crescendo',
        'Postcards',
        '愛 (the invisible)',
        '3D Unreal Object',
        'The Elusive',
        'INDIEGO',
        'Research Project: The Transformation of the Digital Music Ecosystem',
        'BAND KORI',
        'Natural Forms',
        'Remnants of Being',
        'Fujii Kaze Poster',
        'Anxiety',
    ];

    /** `section`: `design` | `art` (fine art only). Order follows PORTFOLIO_FEED_ORDER within that section. */
    function mergePortfolioProjects(data, section) {
        const design = Array.isArray(data.design) ? data.design : [];
        const fine = Array.isArray(data.fineart) ? data.fineart : [];
        const d = design.map((p) => ({ ...p, _kind: 'design' }));
        const f = fine.map((p) => ({ ...p, _kind: 'fineart' }));
        const sourceList = section === 'art' ? f : d;
        const byTitle = new Map(sourceList.map((p) => [p.title, p]));
        const out = [];
        const seen = new Set();
        for (const title of PORTFOLIO_FEED_ORDER) {
            const item = byTitle.get(title);
            if (item) {
                out.push(item);
                seen.add(title);
            }
        }
        sourceList.forEach((p) => {
            if (!seen.has(p.title)) {
                seen.add(p.title);
                out.push(p);
            }
        });
        return out;
    }

    function projectDisplayYear(item) {
        const y = item.year;
        if (y != null && String(y).trim()) return String(y).trim();
        const lines =
            item.artworkSpec && Array.isArray(item.artworkSpec.lines) ? item.artworkSpec.lines : [];
        const first = lines[0];
        if (first != null && /^\d{4}$/.test(String(first).trim())) return String(first).trim();
        return '';
    }

    function projectFeedDescription(item, kind) {
        if (kind === 'fineart') {
            const t = (item.artworkDescription || '').trim();
            if (t) return t;
            return (item.desc || '').trim();
        }
        return (item.longDesc || item.desc || item.shortDesc || '').trim();
    }

    const IMAGE_FADE_MS = 260;

    function fadeSwapImage(imgEl, nextSrc, onAfterSwap) {
        if (!imgEl || !nextSrc) return;
        imgEl.style.opacity = '0';
        setTimeout(() => {
            imgEl.src = nextSrc;
            if (typeof onAfterSwap === 'function') onAfterSwap();
            imgEl.style.opacity = '1';
        }, IMAGE_FADE_MS);
    }

    const aboutPortraitImg = document.querySelector('.about-portrait');
    const ABOUT_PORTRAIT_SRC = './images/me%204.png';
    const aboutPortraitPreload = new Image();
    aboutPortraitPreload.src = ABOUT_PORTRAIT_SRC;
    if (aboutPortraitPreload.decode) {
        aboutPortraitPreload.decode().catch(() => {});
    }

    function applyAboutPortrait() {
        if (!aboutPortraitImg) return;
        aboutPortraitImg.src = ABOUT_PORTRAIT_SRC;
        if (aboutPortraitImg.decode) {
            aboutPortraitImg.decode().catch(() => {});
        }
    }

    const aboutPortraitObserver = new MutationObserver(() => {
        if (document.body.classList.contains('about-mode')) {
            applyAboutPortrait();
        }
    });
    aboutPortraitObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (document.body.classList.contains('about-mode')) {
        applyAboutPortrait();
    }

    let workSection = 'design';
    let currentImages = [];
    let currentGalleryIndex = 0;

    const workFeed = document.getElementById('work-feed');

    const detailLayer = document.getElementById('work-detail-layer');
    const detailClose = document.getElementById('work-detail-close');
    const detailPanel = document.getElementById('work-detail-panel');
    const detailThumbs = document.getElementById('work-detail-thumbs');
    const detailHero = document.getElementById('work-detail-hero');
    const detailVideo = document.getElementById('work-detail-video');
    const detailYoutubeFrame = document.getElementById('work-detail-youtube');
    const detailTitle = document.getElementById('work-detail-title');
    const detailYear = document.getElementById('work-detail-year');
    const detailDesc = document.getElementById('work-detail-desc');
    const workDetailArtworkSpec = document.getElementById('work-detail-artwork-spec');
    const workDetailArtworkDesc = document.getElementById('work-detail-artwork-description');
    const workDetailArticle = document.getElementById('work-detail-article');
    const workDetailArticleLead = document.getElementById('work-detail-article-lead');
    const workDetailArticleAfterHero = document.getElementById('work-detail-article-after-hero');

    let detailOpen = false;
    let detailArtworkRevealTimeout = null;
    let previousWorkIndex = 0;
    let detailSlideSources = [];
    let detailSlideIndex = 0;

    function youtubeIdFromItem(obj) {
        if (!obj) return '';
        const raw = obj.youtubeVideoId && String(obj.youtubeVideoId).trim();
        if (raw && /^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
        const url = obj.youtubeUrl && String(obj.youtubeUrl).trim();
        if (!url) return '';
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : '';
    }

    function resetWorkDetailYoutube() {
        if (detailYoutubeFrame) detailYoutubeFrame.src = '';
        if (detailVideo) {
            detailVideo.hidden = true;
            detailVideo.classList.remove('detail-hero-grow');
        }
        if (detailHero) detailHero.hidden = false;
        detailLayer?.classList.remove('work-detail--youtube');
    }

    function updateWorkDetailHeroAdvanceState() {
        if (!detailHero) return;
        const multi = detailSlideSources.length > 1;
        detailHero.classList.toggle('detail-hero--advance', multi);
        if (multi) {
            detailHero.setAttribute('role', 'button');
            detailHero.setAttribute('tabindex', '0');
            detailHero.setAttribute(
                'aria-label',
                'Show next image. Use Arrow Down for next and Arrow Up for previous.'
            );
        } else {
            detailHero.removeAttribute('role');
            detailHero.removeAttribute('tabindex');
            detailHero.removeAttribute('aria-label');
        }
    }

    function goToDetailSlide(nextIndex) {
        if (!detailOpen || !detailHero || detailSlideSources.length <= 1) return;
        const n = detailSlideSources.length;
        const idx = ((nextIndex % n) + n) % n;
        detailSlideIndex = idx;
        const src = detailSlideSources[idx];
        const item = currentImages[currentGalleryIndex];
        fadeSwapImage(detailHero, src, () => {
            detailHero.classList.remove('detail-hero-grow');
            requestAnimationFrame(() => detailHero.classList.add('detail-hero-grow'));
        });
        if (detailThumbs) {
            detailThumbs.querySelectorAll('.work-detail-thumb').forEach((b, i) => {
                b.classList.toggle('active', i === idx);
            });
        }
        detailHero.alt = item ? `${item.title} — image ${idx + 1}` : 'Project image';
    }

    function advanceWorkDetailHero(e) {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.type === 'keydown') e.preventDefault();
        if (!detailOpen || !detailHero || detailSlideSources.length <= 1) return;
        goToDetailSlide(detailSlideIndex + 1);
    }

    if (detailHero) {
        detailHero.addEventListener('click', advanceWorkDetailHero);
        detailHero.addEventListener('keydown', advanceWorkDetailHero);
    }

    function renderDetailThumbs(slides, activeIndex) {
        if (!detailThumbs) return;
        detailThumbs.innerHTML = '';

        slides.forEach((src, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'work-detail-thumb';
            if (i === activeIndex) btn.classList.add('active');

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            btn.appendChild(img);

            btn.addEventListener('click', () => {
                goToDetailSlide(i);
            });

            detailThumbs.appendChild(btn);
        });
    }

    document.addEventListener('keydown', (e) => {
        const el = e.target;
        if (el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]')) {
            return;
        }

        if (detailOpen) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDetailView();
                return;
            }
            if (detailSlideSources.length > 1 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                goToDetailSlide(detailSlideIndex + delta);
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                return;
            }
            return;
        }
    });

    function clearInPageDetailFooter() {
        if (detailArtworkRevealTimeout) {
            clearTimeout(detailArtworkRevealTimeout);
            detailArtworkRevealTimeout = null;
        }
        if (workDetailArtworkDesc) {
            workDetailArtworkDesc.classList.remove('detail-artwork-description--visible');
            workDetailArtworkDesc.hidden = true;
            workDetailArtworkDesc.replaceChildren();
        }
        if (workDetailArtworkSpec) {
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--visible');
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--year-only');
            workDetailArtworkSpec.hidden = true;
            workDetailArtworkSpec.replaceChildren();
        }
    }

    function setInPageDetailFooter(item) {
        if (detailArtworkRevealTimeout) {
            clearTimeout(detailArtworkRevealTimeout);
            detailArtworkRevealTimeout = null;
        }

        const isFineArt = item._kind === 'fineart';
        const isDesign = item._kind === 'design';

        if (workDetailArtworkDesc) {
            workDetailArtworkDesc.classList.remove('detail-artwork-description--visible');
            if (isDesign) {
                const primary = (item.longDesc || item.desc || '').trim();
                const extra = (item.body || '').trim();
                const paragraphs = [];
                if (primary) paragraphs.push(primary);
                if (extra) paragraphs.push(extra);
                if (!paragraphs.length) {
                    workDetailArtworkDesc.hidden = true;
                    workDetailArtworkDesc.replaceChildren();
                } else {
                    workDetailArtworkDesc.hidden = false;
                    workDetailArtworkDesc.replaceChildren();
                    paragraphs.forEach((text) => {
                        const p = document.createElement('p');
                        p.className = 'detail-artwork-description__text';
                        p.textContent = text;
                        workDetailArtworkDesc.appendChild(p);
                    });
                }
            } else {
                let descText = '';
                if (isFineArt) {
                    const raw = item.artworkDescription;
                    if (typeof raw === 'string') descText = raw.trim();
                    else if (raw && typeof raw.text === 'string') descText = raw.text.trim();
                }
                if (!descText) {
                    workDetailArtworkDesc.hidden = true;
                    workDetailArtworkDesc.replaceChildren();
                } else {
                    workDetailArtworkDesc.hidden = false;
                    workDetailArtworkDesc.replaceChildren();
                    const p = document.createElement('p');
                    p.className = 'detail-artwork-description__text';
                    p.textContent = descText;
                    workDetailArtworkDesc.appendChild(p);
                }
            }
        }

        if (workDetailArtworkSpec) {
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--visible');
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--year-only');

            if (isDesign) {
                const y = (item.year != null ? String(item.year) : '').trim();
                if (!y) {
                    workDetailArtworkSpec.hidden = true;
                    workDetailArtworkSpec.replaceChildren();
                } else {
                    workDetailArtworkSpec.hidden = false;
                    workDetailArtworkSpec.classList.add('detail-artwork-spec--year-only');
                    workDetailArtworkSpec.replaceChildren();
                    const p = document.createElement('p');
                    p.textContent = y;
                    workDetailArtworkSpec.appendChild(p);
                }
            } else {
                const spec = item.artworkSpec;
                const lines =
                    isFineArt && spec && Array.isArray(spec.lines) ? spec.lines.filter(Boolean) : [];
                if (!lines.length) {
                    workDetailArtworkSpec.hidden = true;
                    workDetailArtworkSpec.replaceChildren();
                } else {
                    workDetailArtworkSpec.hidden = false;
                    workDetailArtworkSpec.replaceChildren();
                    lines.forEach((line) => {
                        const p = document.createElement('p');
                        p.textContent = line;
                        workDetailArtworkSpec.appendChild(p);
                    });
                }
            }
        }
    }

    function revealInPageDetailFooter() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (workDetailArtworkDesc && !workDetailArtworkDesc.hidden) {
                    workDetailArtworkDesc.classList.add('detail-artwork-description--visible');
                }
                if (workDetailArtworkSpec && !workDetailArtworkSpec.hidden) {
                    workDetailArtworkSpec.classList.add('detail-artwork-spec--visible');
                }
            });
        });
    }

    function openDetailView(options = {}) {
        const fromGalleryImage = Boolean(options.fromGalleryImage);
        let idx = currentGalleryIndex;
        if (typeof options.projectIndex === 'number' && !Number.isNaN(options.projectIndex)) {
            idx = options.projectIndex;
        }
        currentGalleryIndex = idx;
        const item = currentImages[idx];
        if (!item || !detailLayer || !detailHero || !detailTitle || !detailDesc) return;

        previousWorkIndex = idx;
        const slides = Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [item.src];
        let activeSlide = Math.max(0, slides.indexOf(item.src));

        if (typeof options.initialSlideIndex === 'number' && !Number.isNaN(options.initialSlideIndex)) {
            activeSlide = Math.max(0, Math.min(options.initialSlideIndex, slides.length - 1));
        } else if (
            typeof item.detailStartIndex === 'number' &&
            !Number.isNaN(item.detailStartIndex)
        ) {
            activeSlide = Math.max(
                0,
                Math.min(item.detailStartIndex, slides.length - 1)
            );
        }

        const ytId = youtubeIdFromItem(item);
        const scrollDetailPage =
            item._kind === 'design' &&
            !ytId &&
            (item.detailScrollPage === true || slides.length > 2);
        if (scrollDetailPage) {
            activeSlide = 0;
        }

        detailSlideSources = scrollDetailPage ? [slides[0] || item.src] : slides;
        detailSlideIndex = scrollDetailPage ? 0 : activeSlide;

        if (ytId && detailVideo && detailYoutubeFrame) {
            detailYoutubeFrame.src = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`;
            detailVideo.hidden = false;
            detailHero.hidden = true;
            detailLayer.classList.add('work-detail--youtube');
        } else {
            if (detailYoutubeFrame) detailYoutubeFrame.src = '';
            if (detailVideo) detailVideo.hidden = true;
            detailHero.hidden = false;
            detailLayer.classList.remove('work-detail--youtube');
            detailHero.src = slides[activeSlide] || item.src;
            const slideCountForLabel = scrollDetailPage ? 1 : slides.length;
            detailHero.alt = item.title
                ? slideCountForLabel > 1
                    ? `${item.title} — image ${activeSlide + 1}`
                    : item.title
                : 'Project image';
        }
        detailTitle.textContent = item.title || '';
        const isFineArt = item._kind === 'fineart';
        const isDesign = item._kind === 'design';

        if (isDesign) {
            detailLayer.classList.add('work-detail--design');
        } else {
            detailLayer.classList.remove('work-detail--design');
        }

        if (isFineArt) {
            detailLayer.classList.add('work-detail--fine-art');
        } else {
            detailLayer.classList.remove('work-detail--fine-art');
        }

        if (isFineArt || isDesign) {
            detailDesc.hidden = true;
            detailDesc.textContent = '';
            if (detailYear) {
                detailYear.hidden = true;
                detailYear.textContent = '';
            }
        } else {
            const longExplanation = item.longDesc || item.body || item.desc || '';
            detailDesc.textContent = longExplanation;
            detailDesc.hidden = !longExplanation;
            if (detailYear) {
                const yearText = (item.year || '').trim();
                detailYear.textContent = yearText;
                detailYear.hidden = !yearText;
            }
        }
        const hasMultipleSlides = slides.length > 1;
        const showThumbs = !isFineArt && hasMultipleSlides && !scrollDetailPage;

        if (!showThumbs) {
            detailLayer.classList.add('work-detail--no-thumbs');
            if (detailThumbs) detailThumbs.innerHTML = '';
        } else {
            detailLayer.classList.remove('work-detail--no-thumbs');
            renderDetailThumbs(slides, activeSlide);
        }

        updateWorkDetailHeroAdvanceState();

        if (scrollDetailPage) {
            clearInPageDetailFooter();
            detailLayer.classList.add('work-detail--scroll-page');
            const leadHtml =
                typeof window.portfolioDetailScrollArticleLeadHtml === 'function'
                    ? window.portfolioDetailScrollArticleLeadHtml(item)
                    : typeof item.detailArticleHtml === 'string'
                      ? item.detailArticleHtml
                      : '';
            if (workDetailArticleLead) {
                if (leadHtml) {
                    workDetailArticleLead.innerHTML = leadHtml;
                    workDetailArticleLead.hidden = false;
                } else {
                    workDetailArticleLead.innerHTML = '';
                    workDetailArticleLead.hidden = true;
                }
            }
            const afterHeroHtml =
                typeof item.detailArticleHtmlAfterHero === 'string' ? item.detailArticleHtmlAfterHero : '';
            if (workDetailArticleAfterHero) {
                if (afterHeroHtml) {
                    workDetailArticleAfterHero.innerHTML = afterHeroHtml;
                    workDetailArticleAfterHero.hidden = false;
                } else {
                    workDetailArticleAfterHero.innerHTML = '';
                    workDetailArticleAfterHero.hidden = true;
                }
            }
            if (workDetailArticle) {
                if (typeof window.destroyPortfolioObjViewers === 'function') {
                    window.destroyPortfolioObjViewers(workDetailArticle);
                }
                workDetailArticle.hidden = false;
                workDetailArticle.innerHTML =
                    typeof window.portfolioDetailScrollArticleHtml === 'function'
                        ? window.portfolioDetailScrollArticleHtml(item)
                        : '';
            }
        } else {
            detailLayer.classList.remove('work-detail--scroll-page');
            if (workDetailArticleLead) {
                workDetailArticleLead.innerHTML = '';
                workDetailArticleLead.hidden = true;
            }
            if (workDetailArticleAfterHero) {
                workDetailArticleAfterHero.innerHTML = '';
                workDetailArticleAfterHero.hidden = true;
            }
            if (workDetailArticle) {
                if (typeof window.destroyPortfolioObjViewers === 'function') {
                    window.destroyPortfolioObjViewers(workDetailArticle);
                }
                workDetailArticle.hidden = true;
                workDetailArticle.innerHTML = '';
            }
            setInPageDetailFooter(item);
            detailArtworkRevealTimeout = setTimeout(() => {
                detailArtworkRevealTimeout = null;
                revealInPageDetailFooter();
            }, 520);
        }

        detailLayer.classList.add('active');
        detailLayer.setAttribute('aria-hidden', 'false');
        detailHero.classList.remove('detail-hero-grow', 'detail-hero-from-gallery');
        if (detailVideo) detailVideo.classList.remove('detail-hero-grow', 'detail-hero-from-gallery');

        const narrowWorkUi = window.matchMedia('(max-width: 768px)').matches;
        if (ytId && detailVideo) {
            if (narrowWorkUi) {
                detailVideo.classList.add('detail-hero-grow');
            } else if (fromGalleryImage) {
                detailVideo.classList.add('detail-hero-from-gallery');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        detailVideo.classList.remove('detail-hero-from-gallery');
                        detailVideo.classList.add('detail-hero-grow');
                    });
                });
            } else {
                requestAnimationFrame(() => detailVideo.classList.add('detail-hero-grow'));
            }
        } else if (!detailHero.hidden) {
            if (narrowWorkUi) {
                /* Keep hero stable in layout — no scale-from-small entrance that reads as a jump */
                detailHero.classList.add('detail-hero-grow');
            } else if (fromGalleryImage) {
                detailHero.classList.add('detail-hero-from-gallery');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        detailHero.classList.remove('detail-hero-from-gallery');
                        detailHero.classList.add('detail-hero-grow');
                    });
                });
            } else {
                requestAnimationFrame(() => detailHero.classList.add('detail-hero-grow'));
            }
        }
        detailOpen = true;
        document.body.classList.add('work-detail-modal-open');
        if (scrollDetailPage && workDetailArticle) {
            /* After .active + layout: avoids 0-size stage and ensures THREE is ready */
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (typeof window.initPortfolioObjViewers === 'function') {
                        window.initPortfolioObjViewers(workDetailArticle);
                    }
                });
            });
        }
    }

    function closeDetailView(restorePrevious = true) {
        if (!detailOpen || !detailLayer) return;
        resetWorkDetailYoutube();
        if (detailHero) {
            detailHero.classList.remove(
                'detail-hero-grow',
                'detail-hero-from-gallery',
                'detail-hero--advance'
            );
            detailHero.removeAttribute('role');
            detailHero.removeAttribute('tabindex');
            detailHero.removeAttribute('aria-label');
        }
        clearInPageDetailFooter();
        detailLayer.classList.remove('active');
        detailLayer.classList.remove('work-detail--no-thumbs');
        detailLayer.classList.remove('work-detail--scroll-page');
        detailLayer.classList.remove('work-detail--design');
        detailLayer.classList.remove('work-detail--fine-art');
        if (workDetailArticleLead) {
            workDetailArticleLead.innerHTML = '';
            workDetailArticleLead.hidden = true;
        }
        if (workDetailArticleAfterHero) {
            workDetailArticleAfterHero.innerHTML = '';
            workDetailArticleAfterHero.hidden = true;
        }
        if (workDetailArticle) {
            if (typeof window.destroyPortfolioObjViewers === 'function') {
                window.destroyPortfolioObjViewers(workDetailArticle);
            }
            workDetailArticle.hidden = true;
            workDetailArticle.innerHTML = '';
        }
        detailLayer.setAttribute('aria-hidden', 'true');
        detailOpen = false;
        document.body.classList.remove('work-detail-modal-open');
        if (detailClose && document.activeElement === detailClose) {
            detailClose.blur();
        }
        if (restorePrevious && previousWorkIndex >= 0 && workFeed) {
            currentGalleryIndex = previousWorkIndex;
            const row = workFeed.querySelector(
                `.work-feed-item[data-project-index="${previousWorkIndex}"]`
            );
            row?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }

    /** Keep the feed preview box the same size as the first main image (multi-slide cards only). */
    function lockWorkFeedHeroSlot(media, hero) {
        const apply = () => {
            if (!hero.naturalWidth) return;
            hero.style.removeProperty('max-height');
            hero.style.maxWidth = '100%';
            hero.style.width = '100%';
            hero.style.height = 'auto';
            hero.style.objectFit = 'contain';
            void hero.offsetHeight;
            const h = Math.round(hero.getBoundingClientRect().height);
            if (h < 2) return;
            media.style.height = `${h}px`;
            media.style.alignItems = 'center';
            media.dataset.heroSlotLocked = '1';
            hero.style.maxHeight = '100%';
        };
        if (hero.complete && hero.naturalWidth) {
            requestAnimationFrame(apply);
        } else {
            hero.addEventListener('load', () => requestAnimationFrame(apply), { once: true });
        }
    }

    function renderWorkFeed() {
        if (!workFeed) return;
        workFeed.innerHTML = '';
        const colLeft = document.createElement('div');
        colLeft.className = 'work-feed__col work-feed__col--left';
        const colRight = document.createElement('div');
        colRight.className = 'work-feed__col work-feed__col--right';
        workFeed.appendChild(colLeft);
        workFeed.appendChild(colRight);

        currentImages.forEach((item, index) => {
            const kind = item._kind;
            const year = projectDisplayYear(item);
            const desc = projectFeedDescription(item, kind);
            const feedBlurb = (item.feedBlurb && String(item.feedBlurb).trim()) || '';
            const captionText =
                kind === 'fineart' ? '' : (feedBlurb || desc || '').trim();
            const slides =
                Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [item.src];

            const article = document.createElement('article');
            article.className =
                'work-feed-item' + (captionText ? ' work-feed-item--caption' : '');
            article.dataset.projectIndex = String(index);
            article.style.order = String(index);

            const useMainGrid =
                item.feedAllSlidesAsMain === true && Array.isArray(slides) && slides.length > 1;

            let media;
            if (useMainGrid) {
                media = document.createElement('div');
                media.className = 'work-feed-item__media-group';
                slides.forEach((src, si) => {
                    const cell = document.createElement('div');
                    cell.className = 'work-feed-item__media';
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = item.title ? `${item.title} — ${si + 1}` : 'Project';
                    img.loading = 'lazy';
                    img.dataset.slideIndex = String(si);
                    cell.appendChild(img);
                    media.appendChild(cell);
                });
            } else {
                media = document.createElement('div');
                media.className = 'work-feed-item__media';
                const hero = document.createElement('img');
                hero.src = item.src;
                hero.alt = item.title ? `${item.title}` : 'Project';
                hero.loading = 'lazy';
                const startSlide = Math.max(0, slides.indexOf(item.src));
                hero.dataset.slideIndex = String(Number.isNaN(startSlide) ? 0 : startSlide);
                media.appendChild(hero);
                if (slides.length > 1) {
                    lockWorkFeedHeroSlot(media, hero);
                }
                const ytFeedId = youtubeIdFromItem(item);
                if (ytFeedId) {
                    media.classList.add('work-feed-item__media--video');
                    const playMark = document.createElement('span');
                    playMark.className = 'work-feed-item__play';
                    playMark.setAttribute('aria-hidden', 'true');
                    playMark.innerHTML =
                        '<svg class="work-feed-item__play-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6.5v11l9-5.5-9-5.5z" fill="currentColor"/></svg>';
                    media.appendChild(playMark);
                }
            }

            const info = document.createElement('div');
            info.className = 'work-feed-item__info';

            const headerRow = document.createElement('div');
            headerRow.className = 'work-feed-item__header-row';
            const h2 = document.createElement('h2');
            h2.className = 'work-feed-item__title';
            h2.textContent = item.title || '';
            const yearEl = document.createElement('span');
            yearEl.className = 'work-feed-item__year';
            yearEl.textContent = year;
            headerRow.appendChild(h2);
            headerRow.appendChild(yearEl);

            const rule = document.createElement('hr');
            rule.className = 'work-feed-item__rule';

            const copy = document.createElement('div');
            copy.className = 'work-feed-item__copy';
            const p = document.createElement('p');
            p.className = 'work-feed-item__desc';
            p.textContent = captionText;
            copy.appendChild(p);

            info.appendChild(headerRow);
            info.appendChild(rule);
            if (captionText) {
                info.appendChild(copy);
            }

            const rasterSlideEntries = slides
                .map((src, si) => ({ src, si }))
                .filter(({ src }) => !/\.obj$/i.test(src));
            if (rasterSlideEntries.length > 1 && !useMainGrid) {
                const thumbsRow = document.createElement('div');
                thumbsRow.className = 'work-feed-item__thumbs';
                rasterSlideEntries.forEach(({ src, si }, ti) => {
                    const tb = document.createElement('button');
                    tb.type = 'button';
                    tb.className = 'work-feed-thumb' + (ti === 0 ? ' active' : '');
                    tb.dataset.slideIndex = String(si);
                    tb.setAttribute('aria-label', `Show image ${si + 1} in preview`);
                    if (ti === 0) tb.setAttribute('aria-current', 'true');
                    const im = document.createElement('img');
                    im.src = src;
                    im.alt = '';
                    tb.appendChild(im);
                    thumbsRow.appendChild(tb);
                });
                info.appendChild(thumbsRow);
            }

            article.appendChild(media);
            article.appendChild(info);
            (index % 2 === 0 ? colLeft : colRight).appendChild(article);
        });
    }

    function setWorkSection(section) {
        workSection = section === 'art' ? 'art' : 'design';
        document.body.dataset.workFeed = workSection;
        currentImages = mergePortfolioProjects(galleryData, workSection);
        if (detailOpen) closeDetailView(false);
        renderWorkFeed();
    }

    setWorkSection('design');

    if (navDesign) {
        navDesign.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('about-mode');
            document.body.classList.add('work-mode');
            setWorkSection('design');
        });
    }

    if (navArt) {
        navArt.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('about-mode');
            document.body.classList.add('work-mode');
            setWorkSection('art');
        });
    }

    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('work-mode');
            document.body.classList.add('about-mode');
        });
    }

    if (workFeed) {
        workFeed.addEventListener('click', (e) => {
            const t = e.target;
            const thumbBtn = t.closest && t.closest('.work-feed-thumb');
            if (thumbBtn && workFeed.contains(thumbBtn)) {
                e.preventDefault();
                e.stopPropagation();
                const article = thumbBtn.closest('.work-feed-item');
                if (!article) return;
                const idx = parseInt(article.dataset.projectIndex, 10);
                const slideIdx = parseInt(thumbBtn.dataset.slideIndex, 10);
                if (Number.isNaN(idx) || Number.isNaN(slideIdx)) return;
                const item = currentImages[idx];
                if (!item) return;
                const slideList =
                    Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [item.src];
                const nextSrc = slideList[slideIdx];
                if (!nextSrc) return;
                const hero = article.querySelector(':scope > .work-feed-item__media > img');
                if (!hero) return;
                hero.src = nextSrc;
                hero.dataset.slideIndex = String(slideIdx);
                const media = hero.parentElement;
                if (media && media.classList.contains('work-feed-item__media')) {
                    const rerender = () => lockWorkFeedHeroSlot(media, hero);
                    hero.addEventListener('load', rerender, { once: true });
                    requestAnimationFrame(() => {
                        if (hero.complete && hero.naturalWidth) rerender();
                    });
                }
                article.querySelectorAll('.work-feed-thumb').forEach((btn) => {
                    const on = parseInt(btn.dataset.slideIndex, 10) === slideIdx;
                    btn.classList.toggle('active', on);
                    btn.setAttribute('aria-current', on ? 'true' : 'false');
                });
                return;
            }

            const titleEl = t.closest && t.closest('.work-feed-item__title');
            const mediaImg = t.closest && t.closest('.work-feed-item__media img');
            if (titleEl || mediaImg) {
                const row = (titleEl || mediaImg).closest('.work-feed-item');
                if (!row) return;
                const idx = parseInt(row.dataset.projectIndex, 10);
                if (Number.isNaN(idx)) return;
                e.preventDefault();
                let initialSlideIndex = 0;
                if (mediaImg) {
                    if (mediaImg.dataset.slideIndex != null && mediaImg.dataset.slideIndex !== '') {
                        const si = parseInt(mediaImg.dataset.slideIndex, 10);
                        if (!Number.isNaN(si)) initialSlideIndex = si;
                    }
                } else if (titleEl) {
                    const hero = row.querySelector(':scope > .work-feed-item__media > img');
                    if (hero && hero.dataset.slideIndex != null && hero.dataset.slideIndex !== '') {
                        const si = parseInt(hero.dataset.slideIndex, 10);
                        if (!Number.isNaN(si)) initialSlideIndex = si;
                    }
                }
                openDetailView({
                    projectIndex: idx,
                    initialSlideIndex,
                    fromGalleryImage: Boolean(mediaImg),
                });
            }
        });
    }

    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            if (detailOpen) closeDetailView(false);
            document.body.classList.add('work-mode');
            document.body.classList.remove('about-mode');
            document.body.dataset.workFeed = workSection;
            document.getElementById('work-gallery')?.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.addEventListener('pageshow', (ev) => {
        if (!ev.persisted) return;
        if (detailOpen) closeDetailView(false);
    });

    if (detailClose) {
        detailClose.addEventListener('click', () => closeDetailView());
    }

    if (detailLayer) {
        detailLayer.addEventListener('click', (e) => {
            if (e.target === detailLayer) closeDetailView();
        });
    }

});
