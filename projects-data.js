/**
 * Shared by index (gallery) and project-detail.html.
 * Optional `shortDesc` — legacy; gallery overlay shows title + “View Detail” only.
 * Optional `longDesc` — design: in-page detail on index; fine art: project-detail.html only (`desc`/`longDesc`).
 * Optional `body` — extra copy on the standalone detail page.
 * Optional `thumbSrc` — strip thumbnail only; falls back to `src` for main image.
 * Optional `detailStartIndex` — 0-based index into `slides` when opening detail (else matches `src`).
 * Optional `slides` — if set, detail page left rail shows only these images for this project.
 * Optional `artworkSpec.lines` — fine art only: medium / dimensions (bottom-right under hero).
 * Optional `artworkDescription` — fine art only: short copy under hero (bottom-left).
 * Design detail pages: `longDesc` or `desc` (bottom-left) and `year` (bottom-right), same footer layout as fine art.
 */
window.PORTFOLIO_GALLERY = {
    design: [
        {
            src: "./images/1.jpg",
            title: "Postcards",
            year: "2023",
            shortDesc: "Postcards filled with ordinary moments.",
            longDesc: "Postcards filled with moments that grow more meaningful when shared. Send it with your heart :)",
            desc: "Postcards filled with moments that grow more meaningful when shared. Send it with your heart :)",
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
            src: "./images/INDIEGO/PF4.png",
            detailStartIndex: 0,
            title: "INDIEGO",
            year: "2026",
            shortDesc: "Music festival design and branding.",
            longDesc: "Music festival design — branding and visuals for INDIEGO.",
            desc: "Music festival design and branding for INDIEGO.",
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
            src: "./images/3.jpg",
            title: "Fujii Kaze Poster",
            year: "2025",
            longDesc: "A fan art poster exploring visual hierarchy and design elements",
            desc: "",
            body: "",
            slides: ["./images/3.jpg", "./images/3.1.jpg"],
        },
        {
            src: "./images/CS4.jpg",
            detailStartIndex: 0,
            title: "Crescendo",
            year: "2024",
            longDesc:
                "Inspired by my appreciation for the power of music, this project evolved into a brand concept that helps people with verbal communication challenges find their voice.",
            desc: "A music therapy branding project",
            body: "",
            slides: [
                "./images/4.jpg",
                "./images/CS1.jpg",
                "./images/CS2.jpg",
                "./images/CS4.jpg",
                "./images/CS3.jpg",
            ],
        },
        {
            src: "./images/2.jpg",
            title: "Secret Society Logo",
            year: "2026",
            shortDesc: "For people who enjoy walking and drinking coffee",
            longDesc: "For people who enjoy walking and drinking coffee",
            desc: "",
            body: "",
            slides: ["./images/2.jpg", "./images/2.1.jpg", "./images/2.2.png"],
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
    ],
};
