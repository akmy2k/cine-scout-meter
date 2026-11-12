# CINELIT METER

A camera-first browser app for colour balance, lighting ratios, composition guides, reference overlays, spot estimates and ROOM TONE checks.

## ZONEZ

Controls → ZONEZ selects 9 bands (−4…+4), 7 bands (−3…+3), 5 bands (−2…+2), or 3 bands with independently adjustable under/over boundaries relative to 18% middle gray. Fractional stop distances are supported. The left legend keeps its frame while numbers grow with fewer bands. Tap it to cycle overlay strength 0/35/50/75/100%; default is 75% colour over 25% original picture. Tap the picture to compare with the source.

## Ratios and reset

Place A/B/C/D spots for approximate brightness relationships. Ratio headings show whole-stop doubling factors only: 1:1, 2:1, 4:1, 8:1 and onward, reversed where appropriate. f/T labels use a relative middle-gray reference; this app does not measure lens transmission. The circular-arrow button beside Controls returns to clean 60/30/10 mode. Reloading a started tab reconnects to the clean colour feed.

## Existing tools

The original composition guides, colour/match behaviour, camera controls, reference photo, reference-calibrated spot tool and ROOM TONE tools are retained. First use: Start Viewfinder and allow camera access. Add to Home Screen for the installed phone experience. Camera/lens, microphone, offline and sharing capabilities depend on browser/device.

These are processed browser-image estimates, not independently calibrated photometric or acoustic measurements. Browser SDR clipping cannot be recovered by ZONEZ. Source code delivered to the browser remains inspectable even if repository history is private.

Serve this static folder over HTTPS or localhost. For helper-source changes, run python3 build-runtime.py to refresh meter-runtime.js.

## Composition: clean until aligned

Composition starts without a permanent guide. Choose one of 21 compositions. Choose Appear on alignment to see the selected guide softly appear as nearby scene edges or focal points align, Always on for a constant guide, or Off for no guide. This selector is available beside the shape choices and in Controls. Existing alignment-tolerance choices remain unchanged. This is a visual alignment heuristic, not a judgement of artistic composition.


## Quick ZONEZ controls

The first nonzero colour-overlay level is 35%; tapping the legend cycles 0/35/50/75/100%. The single-number button immediately below the legend cycles 9 → 7 → 5 → 3 and highlights the active count. It stays synchronized with Controls, where the three-band thresholds can be programmed. Default strength remains 75% overlay with 25% original picture.

## Coloured sticky ratio spots

A/B/C/D use cyan/pink/yellow/green in the markers and readings. Stop values are parenthesized, for example A f(4) or A T(4). The large ratio remains numeric and rounded to whole-stop factors.

Sticky ratio spots is enabled by default. Markers follow nearby image texture locally; no camera images are uploaded. This is a small-motion texture tracker, not guaranteed face/object recognition. Uniform, repeating, blurred or occluded targets can lose tracking; a dashed ring and Reposition message hold the last location instead of jumping. Drag the letter onto a textured part of the target to reattach. Disable Sticky ratio spots to pin points to the screen. Large jumps, source changes or frame resizing may require repositioning.


## Mobile view and camera sides

On mobile the ZONEZ legend wraps the numbers closely, with the 3/5/7/9 button directly below it. Desktop keeps the larger frame. A single flip-camera symbol to the left of Controls alternates between back and front cameras. Actual camera availability depends on the device/browser; unavailable sides use the camera the browser exposes. Flip Lens and the camera/lens list remain in Controls.

## Compact toolbar

The single flip-camera symbol immediately to the left of Controls switches between front and back cameras. The circular arrow beside them returns to the clean colour feed. The palette-information control is a small Info text button. The ZONEZ count button displays only its current number and cycles 9→7→5→3; the detailed Controls selector remains synchronized.

## Live spot readings and wider Controls

Spot mode shows a relative f/T stop immediately against 18% gray, with the reading beside its target. Match gray and shutter/ISO/ND controls stay at the bottom. Kelvin estimates are larger and warm/cool coloured. Enter a known lux or foot-candle reference before matching to estimate light levels on the same gray card at fixed camera exposure. These are image-based relative estimates; camera auto-exposure and different surface reflectance affect readings. Controls choices span the available width on mobile.

## Bottom Controls, freeze and camera range

Controls and Refresh stay at the top of the camera frame. The menu opens upward from the bottom. Interface accents are neutral gray; ZONEZ exposure colours and measured colour readings remain meaningful. Freeze frame is first in Controls, with a 0–100% dissolve over the live camera and a quick on-image slider; measurements stay frozen. Rotation buttons are compact. Spot shows relative f/T beside the target and a 36px warm/cool Kelvin estimate. Hardware zoom uses the full range reported by the camera; otherwise the slider remains a labelled preview crop. When multiple cameras/lenses are exposed by the browser, one camera toggle beneath Zoom cycles through the available devices and shows the active camera number. Physical lens availability and zoom range depend on the phone/browser. Sound is labelled ROOM TONE.
