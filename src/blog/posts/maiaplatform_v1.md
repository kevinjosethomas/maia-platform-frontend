---
title: 'Introducing Maia Platform v1'
date: '2025-07-'
tags:
  - chess
  - maia
  - human-ai
excerpt: >-
  We release MaiaChess v1, a major update to our platform for human-aligned chess analysis. Powered by the new Maia 2 model, the platform combines neural predictions with engine insights to provide detailed, rating-aware feedback on games, drills, and puzzles.
github: https://github.com/CSSLab/maia-platform-frontend
image: all_lineplot.png
---

We are thrilled to announce the beta launch of Maia Chess v1. This release represents a significant step forward in our goal of providing a more human-centered chess analysis experience, combining insights from neural models trained on human games with traditional engine-based evaluation.

Version 1.0 includes major changes across all core functionalities, beginning with the introduction of the Maia 2 model. These updates affect every part of the user experience and introduce new tools for analysis, training, and gameplay exploration.

## Introducing the Maia 2 Model

The most substantial change in v1 is the adoption of the new Maia 2 model, a new version of our neural network trained to predict human moves at various rating levels. As a unified model, Maia 2 has improved predictive accuracy and generalization, as well as consistent coherence across all rating levels. You can read more about the model in our [research paper](https://arxiv.org/abs/2409.20553).

This model underpins nearly every page of the platform and enables tighter integration with Stockfish evaluations. You can now see each move through two lenses: one rooted in traditional engine evaluation and one informed by how humans are likely to play. This dual perspective provides more contextually grounded feedback, helping you understand not only what was wrong with a move but also how it compares to the decisions typical of players at different skill levels.

## New Analysis Page

The analysis page has been restructured to make use of Maia 2 and expose deeper feedback mechanisms highlighting the relationship between engine accuracy and human-like play. New components and functionalities include:

- **Insight Panel**: Presents a combined Maia and Stockfish breakdown of move quality and intention. This helps you understand the relationship between engine accuracy and human-like play.
- **Moves by Rating Graph**: Displays the likelihood of each candidate move being played by humans at different rating levels. This helps you understand which moves are typical at different skill levels, and how moves improve as players get stronger.
- **Blunder Meter**: Highlights sharp drops in move quality based on both engine and human-aligned expectations. This helps you understand the difficulty of the position, while also showing you how a player of the specified rating level makes good, okay, and bad moves.
- **Move Map**: A revamped interactive heatmap that shows move popularity and divergence across ratings. This blends engine accuracy with human-like play, and helps you understand the relationship between optimal and human-like play.
- **Custom Game Loader**: Allows you to load and analyze arbitrary games or positions using PGN or FEN formats.
- **Free Play Mode**: Enables experimentation from any game position, with real-time evaluation and branching. This helps you understand the relationship between engine accuracy and human-like play.

## Opening Drill Page

The new Opening Drill page provides a structured way to rehearse post-opening decision-making:

- Users can configure a custom set of openings and select how many drills to complete.
- Each drill begins shortly after the opening phase, allowing users to practice the transition into the middlegame.
- During drills, all standard analysis tools are available, including Maia/Stockfish insights, evaluation history, and move ratings.
- After each drill, users receive feedback on critical decisions, Maia rating equivalence, Stockfish evaluations over time, and move-by-move quality assessment.
- Upon completing a set, users can review aggregate performance across all openings.

This mode is designed to promote deeper pattern recognition and decision-making practice in positions that arise frequently in practical play.

## Puzzle Page Enhancements

The puzzle page now allows users to analyze each puzzle post-solution:

- Full access to the same analysis tools available on the game analysis page.
- Ability to play out and explore the puzzle position after solving or skipping.
- Improved puzzle history tracking, including rating changes and review of past puzzles.

## Bot or Not (Turing Test) Improvements

The Turing Challenge feature, where users guess whether a game was played by a human or Maia, has also been improved:

- Rating history and challenge outcomes are now tracked more clearly.
- Past challenges can be revisited and reviewed in detail.

## Platform Walkthroughs and Onboarding

To improve platform usability, we have introduced interactive onboarding walkthroughs:

- Each major page includes an optional tutorial that sequentially explains interface components and intended use cases.
- Designed to assist both new and returning users in understanding the full capabilities of the platform.

## User Interface and Experience Revisions

Version 1 includes numerous usability and aesthetic updates:

- Unified visual design across all pages with consistent layout, colors, and component structure.
- Enhanced mobile and small-screen support.
- Smooth transitions and animations to clarify user interactions.
- Pagination for long game histories, including sorting and export options (PGN/FEN).
- Clearer explanations for advanced features and analysis outputs.

## Updated Leaderboards and Player Profiles

The leaderboard now reflects active participation more accurately:

- Displays top-rated users who have played within the last seven days.
- Clicking on a username allows access to their game history and links to their external profiles (e.g., Lichess).

## New Homepage and Research Visibility

The new homepage presents a clearer explanation of the platform's objectives and functionalities. It also provides direct access to the research work that supports Maia Chess, including published papers and model documentation. This supports transparency and facilitates engagement with researchers and practitioners interested in human-aligned chess AI.

## Open Source and Community Involvement

The Maia Chess platform is open-source. Developers, researchers, and contributors are welcome to view the codebase, suggest improvements, or integrate components into their own work. The full repository is available at:

**GitHub**: [github.com/CSSLab/maia-platform-frontend](https://github.com/CSSLab/maia-platform-frontend)

We also encourage users to participate in discussions, share feedback, and help shape future features. You can join the community through our public Discord:

**Discord**: [discord.gg/hHb6gqFpxZ](https://discord.gg/hHb6gqFpxZ)

---

Thank you to the community members and testers who have contributed to Maia Chess over the last year. We look forward to continued collaboration and feedback as we refine and expand the platform.

—
_The Maia Chess Team_
