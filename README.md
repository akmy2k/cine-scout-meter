# Cine Scout Meter

https://akmy2k.github.io/cine-scout-meter/

Browser camera tool for 60-30-10 colour balance, lighting ratios and EL Zone exposure overlays. These browser estimates are visual guides, not calibrated light-meter readings.

## Install on phone

- iPhone Safari: Share → Add to Home Screen → Add.
- Android Chrome: menu → Install app / Add to Home screen.
- Tap Start Viewfinder and allow camera access. Load once online for offline availability.

No API key or server required. GitHub Pages serves this folder from main. Original plugin source is preserved in the FILM vault; this release checkout is separate.

## Composition and full screen

Select Composition in the existing controls menu, then choose one of 21 guides. Rotate or mirror a guide in the menu. Edges and focal marks glow green after sustained nearby edge/contrast alignment. This is an on-device visual heuristic, not object recognition or an aesthetic judgement; ambiguous, low-contrast and busy scenes may not register correctly.

Tap Full screen or Landscape full screen. Requests depend on the browser; iPhone Safari may retain browser tabs. For a tab-free experience, Safari → Share → Add to Home Screen (enable Open as Web App if offered), then launch the icon. Rotate the phone with its portrait lock off. Existing home-screen installs may require reinstalling the icon to pick up the previous portrait-lock removal. Android Chrome installed mode also avoids browser tabs.

Tap the shutter to freeze, then Save / Share photo. On iPhone choose Save Image in the native sheet. Other devices may offer Save Image, a Photos destination, or download; the app cannot silently write into the photo library. In Composition mode, Include guide in saved photo lets you choose an annotated or clean frame. Cancelling the share sheet keeps the frozen frame. Browser screenshots are another option.

Double-tap the viewfinder to open controls, or tap the enlarged top handle. Composition opens a scrollable visual legend with a thumbnail and replication tip for each of 21 guides, including Room corner / leading lines for shooting into the L of a room. Tap a legend entry to apply it and return to the viewfinder. Show composition overlay and Alignment glow are separate switches. Double-tapping in Ratios restores the pre-gesture measurements, avoiding accidental nodes.

In Composition mode, a bottom strip shows all 21 shape thumbnails. Swipe it sideways to browse, tap a shape to apply it, or use Show shapes / Hide shapes to collapse it. The top iris button reads Controls while shooting and Camera while the menu is open. Double-tap access remains available. Matched lines and focal marks now use a stronger, steady glow. The strip is excluded from saved photos and hidden outside Composition mode.
