# tetris.plus

A single-player marathon block puzzle built with **Vite** and **TypeScript**. Original visuals and WebAudio sounds — not an official Tetris client.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47281](http://127.0.0.1:47281) (dev server binds to `0.0.0.0:47281`).

Shared leaderboards (all-time and today, UTC) are served from `GET /api/leaderboards` and updated with `POST /api/leaderboards` (`{ "score": number, "name"?: string }`). Scores persist in `data/leaderboards.json` during dev/preview.

## Build

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|--------|--------|
| **Enter** | Start / resume |
| **Esc** | Pause |
| **R** | Restart after game over |
| **← / →** | Move left / right |
| **↓** | Soft drop |
| **Space** | Hard drop |
| **↑** or **X** | Rotate clockwise |
| **Z** or **Ctrl** | Rotate counterclockwise |
| **A** | Rotate 180° |
| **C** or **Shift** | Hold (once per piece until lock) |

## Rules (marathon)

- 10×20 visible well; pieces spawn in hidden rows above.
- Seven tetrominoes with a 7-bag randomizer, SRS wall kicks, ghost piece, 5-piece preview queue.
- Lock delay ~500ms with limited move/rotate resets; horizontal DAS 130ms, ARR 46ms.
- Level increases every 10 lines; gravity speeds up per level.
- Scoring: single 100, double 300, triple 500, four lines 800 (× level); soft drop +1/cell, hard drop +2/cell.
