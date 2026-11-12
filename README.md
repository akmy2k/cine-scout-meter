# CineLit Meter

A camera-first browser app for colour balance, lighting ratios, composition guides, reference overlays, spot estimates and sound checks.

## A ZONE

Controls → A ZONE selects 9 bands (−4…+4), 5 bands (−2…+2), or 3 bands with independently adjustable under/over boundaries relative to 18% middle gray. Fractional stop distances are supported. The left legend keeps its frame while numbers grow with fewer bands. Tap it to cycle overlay strength 0/25/50/75/100%; default is 75% colour over 25% original picture. Tap the picture to compare with the source.

## Ratios and reset

Place A/B/C/D spots for approximate brightness relationships. Ratio headings show whole-stop doubling factors only: 1:1, 2:1, 4:1, 8:1 and onward, reversed where appropriate. f/T labels use a relative middle-gray reference; this app does not measure lens transmission. The circular-arrow button beside Controls returns to clean 60/30/10 mode. Reloading a started tab reconnects to the clean colour feed.

## Existing tools

The original composition guides, colour/match behaviour, camera controls, reference photo, reference-calibrated spot tool and sound tools are retained. First use: Start Viewfinder and allow camera access. Add to Home Screen for the installed phone experience. Camera/lens, microphone, offline and sharing capabilities depend on browser/device.

These are processed browser-image estimates, not independently calibrated photometric or acoustic measurements. Browser SDR clipping cannot be recovered by A ZONE. Source code delivered to the browser remains inspectable even if repository history is private.

Serve this static folder over HTTPS or localhost. For helper-source changes, run python3 build-runtime.py to refresh meter-runtime.js.

## Composition: clean until aligned

Composition starts without a permanent guide. Choose one of 21 compositions. With Soft alignment glow enabled, the selected guide softly appears only as nearby scene edges or focal points align. Enable Always show composition overlay for a constant guide, or disable both switches for no guides. Existing alignment-tolerance choices remain unchanged. This is a visual alignment heuristic, not a judgement of artistic composition.
