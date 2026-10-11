# AF1 18-region mask asset contract

The current licensed Nike Air Force 1 GLB is a single mesh/material. Independent panel coloring must therefore be driven by an authored UV region atlas (or a replacement segmented GLB); application code must not guess boundaries from 3D coordinates.

## Required region IDs

1. tip
2. vamp
3. eyestay
4. quarterLeft
5. quarterRight
6. swooshLeft
7. swooshRight
8. tongue
9. laces
10. liningLeft
11. liningRight
12. backtab
13. backtabLogo
14. midsole
15. midsoleStripe
16. midsoleLogo
17. outsole
18. seams

## Preferred deliverable

Add `public/models/af1-region-mask.png` using the exact UV layout of `nike_air_force_1 (1).glb`.

Each texel must identify exactly one region. Use a lossless PNG with nearest-neighbor sampling. A companion JSON palette should map RGB values to the region IDs above. Regions that are not physically represented by distinct UV texels in the source model must be separated in Blender (or equivalent) before export rather than approximated in the browser.

This contract intentionally prevents fake region isolation. Once the mask exists, the Three.js material can sample it and apply all 18 stored colors in one shader while preserving normal/roughness detail.
