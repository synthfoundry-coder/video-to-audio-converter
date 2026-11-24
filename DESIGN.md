# DESIGN.md: AudioExtract (Editorial Audio Lab)

- **Identity**: Editorial Audio Lab, a calm, high-craft in-browser audio extraction workbench with acoustic telemetry and gallery-grade typography.
- **Dial**: ENERGY 2 / RHYTHM 2 / MOTION 2
- **Palette (2 core neutral sets + 1 signal accent)**:
  - Light (Gallery Ivory): Canvas `#F6F5F0`, Surface `#FFFFFF`, Inset `#EDEBE3`, Ink `#141413` / `#4A4842` / `#5C5952`, Signal Emerald `#047857` (hover `#065F46`, soft `#E6F4EF`).
  - Dark (Obsidian Lab): Canvas `#0C0E0D`, Surface `#141716`, Inset `#1D2220`, Ink `#F3F2EC` / `#B5B9B3` / `#959C96`, Signal Emerald `#34D399` (button ink `#052E1F`, soft `#0D2B22`).
- **Typography**:
  - Display: `Fraunces` (expressive optical-size editorial serif for the wordmark and H1).
  - UI Sans: `Plus Jakarta Sans` (clear humanist sans for controls and body copy).
  - Telemetry Mono: `IBM Plex Mono` (tabular numerals strictly for durations, bitrates, sample rates, progress percentages, and byte counts).
- **Identity Motif**: Architectural hairline dividers + fine acoustic tick-scale markings paired with a fluid multi-wave harmonic visualizer during active extraction.
- **Elevation & Radius**: Flat border-defined workbench surfaces (`1px solid`), reserving shadow strictly for the modal dialog and active elevated states. Deliberate radius hierarchy: `14px` primary stage/racks, `10px` controls, `6px` technical tags.
- **Motion**: Fluid 60fps canvas harmonic waveform during active conversion with a visible Pause/Resume toggle and full `prefers-reduced-motion: reduce` compliance; compositor-only CSS transitions (`opacity`, `transform`).
