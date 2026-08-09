/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// shared/icons.js
// Single source of truth for all SVG icon paths used across the extension.
// All icons follow Lucide style: 24x24 viewBox, stroke-width 2, fill none,
// stroke currentColor, round caps/joins (applied at the SVG wrapper level).

const MARKMAP_ICONS = {
    zoomIn: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    zoomOut: `<line x1="5" y1="12" x2="19" y2="12"/>`,
    close: `<path d="M18 6L6 18M6 6l12 12"/>`,
    // NotebookLM-style controls
    toggleAll: `<polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/>`,
    download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
    expand: `<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>`,
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { MARKMAP_ICONS };
}
