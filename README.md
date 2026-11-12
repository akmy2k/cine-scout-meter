# CINELIT METER

A camera-first browser app for colour balance, lighting ratios, composition guides, reference overlays, spot estimates and sound checks.

## ZONEZ

Controls → ZONEZ selects 9 bands (−4…+4), 5 bands (−2…+2), or 3 bands with independently adjustable under/over boundaries relative to 18% middle gray. Fractional stop distances are supported. The left legend keeps its frame while numbers grow with fewer bands. Tap it to cycle overlay strength 0/35/50/75/100%; default is 75% colour over 25% original picture. Tap the picture to compare with the source.

## Ratios and reset

Place A/B/C/D spots for approximate brightness relationships. Ratio headings show whole-stop doubling factors only: 1:1, 2:1, 4:1, 8:1 and onward, reversed where appropriate. f/T labels use a relative middle-gray reference; this app does not measure lens transmission. The circular-arrow button beside Controls returns to clean 60/30/10 mode. Reloading a started tab reconnects to the clean colour feed.

## Existing tools

The original composition guides, colour/match behaviour, camera controls, reference photo, reference-calibrated spot tool and sound tools are retained. First use: Start Viewfinder and allow camera access. Add to Home Screen for the installed phone experience. Camera/lens, microphone, offline and sharing capabilities depend on browser/device.

These are processed browser-image estimates, not independently calibrated photometric or acoustic measurements. Browser SDR clipping cannot be recovered by ZONEZ. Source code delivered to the browser remains inspectable even if repository history is private.

Serve this static folder over HTTPS or localhost. For helper-source changes, run python3 build-runtime.py to refresh meter-runtime.js.

## Composition: clean until aligned

Composition starts without a permanent guide. Choose one of 21 compositions. With Soft alignment glow enabled, the selected guide softly appears only as nearby scene edges or focal points align. Enable Always show composition overlay for a constant guide, or disable both switches for no guides. Existing alignment-tolerance choices remain unchanged. This is a visual alignment heuristic, not a judgement of artistic composition.


## Quick ZONEZ controls

The first nonzero colour-overlay level is 35%; tapping the legend cycles 0/35/50/75/100%. The 3 / 5 / 9 button immediately below the legend cycles map size and highlights the active count. It stays synchronized with Controls, where the three-band thresholds can be programmed. Default strength remains 75% overlay with 25% original picture.

## Coloured sticky ratio spots

A/B/C/D use cyan/pink/yellow/green in the markers and readings. Stop values are parenthesized, for example A f(4) or A T(4). The large ratio remains numeric and rounded to whole-stop factors.

Sticky ratio spots is enabled by default. Markers follow nearby image texture locally; no camera images are uploaded. This is a small-motion texture tracker, not guaranteed face/object recognition. Uniform, repeating, blurred or occluded targets can lose tracking; a dashed ring and Reposition message hold the last location instead of jumping. Drag the letter onto a textured part of the target to reattach. Disable Sticky ratio spots to pin points to the screen. Large jumps, source changes or frame resizing may require repositioning.
