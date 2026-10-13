# JeopardyMaker

A tool for building and running Jeopardy-style trivia games, made for streaming to a TV.
No online/multiplayer mode — everything runs locally in your browser and nothing leaves
your computer.

## Features

- **Edit mode** — build a board with two rounds:
  - Round 1: 100 / 200 / 300 / 400 / 500
  - Round 2 (Double): 200 / 400 / 600 / 800 / 1000
  - No Final Jeopardy round — just the two boards.
  - Add as many categories as you like per round (up to 8), and give every clue
    text, an image, an audio clip, or a video.
- **Host (control) mode** — a private screen for the host: pick a clue, see the
  question and correct answer, reveal the answer to the board, and award points to a
  team with one click. Scores can always be corrected by clicking directly on them.
- **Board (TV) mode** — a clean, full-screen board meant to be dragged onto a second
  monitor or TV. Clues flip open with an animation when the host selects them.
- **Local-first** — games (including embedded media) are saved in your browser's
  IndexedDB. Export a game to a single `.json` file to back it up or move it to
  another computer, and import it back in anywhere.

## How it works

Games are edited and played entirely in the browser — there's no server and no
internet connection required beyond loading the app once. To present:

1. Open the game and click **Play This Game** to go to the Host screen.
2. Click **Open Board Display**, which opens a second window — drag that window onto
   your TV/projector and click **Start Display** (this also unlocks audio/video
   playback and can enter fullscreen).
3. Control everything from the Host screen on your laptop: clicking a clue on the
   Host screen's mini-board opens it on the TV with a flip animation, reveals the
   answer on your command, and awards points to whichever team answered correctly.

The Host and Board windows stay in sync live via the browser's `BroadcastChannel`
API, so they must be opened in the *same browser* on the *same computer* (e.g. your
laptop with the TV as a second, extended display).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (e.g. `http://localhost:5173`) in your browser.

To build a static, deployable copy:

```bash
npm run build
npm run preview
```

## Tech stack

React + TypeScript + Vite, Tailwind CSS for styling, Framer Motion for the clue
flip animation, Zustand for live game-state, and IndexedDB (via `idb`) for local
storage of games and media.

By Ricky (rriicckkyy)
