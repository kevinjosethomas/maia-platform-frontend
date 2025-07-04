<p align="center">
  <p align="center">
   <img width="150" src="public/maia-no-bg.png" alt="Logo">
  </p>
	<h1 align="center"><b>Maia Chess</b></h1>
	<p align="center">
		A human-like chess engine.
    <br />
    <a href="https://www.maiachess.com"><strong>maiachess.com »</strong></a>
    <br />
    <br />
  </p>
</p>

This repository contains the source code for the [Maia Chess Platform](https://www.maiachess.com), a modern web application designed for chess training and analysis. It leverages the Maia chess engine, developed by the University of Toronto's Computational Social Science Lab, to provide human-like move predictions and insights. The platform is built with Next.js, TypeScript, and Tailwind CSS. Join our [Discord server](https://discord.gg/hHb6gqFpxZ) for discussions, questions, and to connect with the community. 

## Getting Started

Follow these instructions to set up the development environment on your local machine.

### Prerequisites

- Node.js (v17+ recommended)
- npm (comes bundled with Node.js)

### Installation

1.  Clone the repository to your local machine:

    ```bash
    git clone https://github.com/maia-chess/maia-platform-frontend.git
    cd maia-platform-frontend
    ```

2.  Install the project dependencies using npm:
    ```bash
    npm install
    ```

### Running the Development Server

To start the local development server, run the following command. This will launch the application on `http://localhost:3000` with hot-reloading enabled.

```bash
npm run dev
```

### Building for Production

To create a production-ready build of the application, use the following command. This will compile and optimize the code, outputting the final assets to the `.next` directory.

```bash
npm run build
```

You can then start the production server with `npm run start`.

## Development Guide

This section provides guidelines for contributing to the platform's development.

### Branching Strategy

The repository follows a simple branching model:

- `main`: This branch is synced with the live deployment on Vercel. All code on this branch is considered production-ready.
- **Feature Branches**: All development work, including new features and bug fixes, should be done on separate feature branches. These branches are then merged into `main` via pull requests.

### Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This standard creates a more readable and structured commit history. Each commit message should follow the format:

`{type}: {description}`

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Changes to the build process or auxiliary tools
- `style`: Code style changes (formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `docs`: Documentation only changes

### Architectural Overview

The platform is architected around a modular and scalable structure, leveraging modern React patterns.

#### File Structure

The `src/` directory contains all the core application code, organized as follows:

```
src/
├── api/          # Backend API client functions, organized by feature
├── components/   # Reusable React components, structured by feature or domain
├── contexts/     # React Context providers for global state management
├── hooks/        # Custom React Hooks containing business logic and state
├── pages/        # Next.js pages, defining the application's routes
├── providers/    # Wrappers for context providers
├── styles/       # Global styles and Tailwind CSS configuration
├── types/        # TypeScript type definitions, organized by feature
└── utils/        # Utility functions and helpers
```

#### Core Concepts and Interactions

The application's logic is primarily driven by a combination of custom hooks, React contexts, and components, creating a clear separation of concerns.

- **Components (`src/components/`)**: These are the building blocks of the UI. They are designed to be "dumb" or presentational, receiving data and callbacks via props. Major features like `Analysis`, `Play`, `Openings`, and `Training` have their own dedicated component directories.

- **Hooks (`src/hooks/`)**: This is where the majority of the application's business logic resides. Each major feature has a corresponding "controller" hook (e.g., `usePlayController`, `useAnalysisController`). These hooks encapsulate state management, interactions with the chess engines, and API calls. They effectively act as state machines for their respective features.

- **Contexts (`src/contexts/`)**: To avoid prop drilling, we use React Context to provide the state and methods from our controller hooks to the component tree. For example, `PlayControllerContext` will expose the state and functions from the `usePlayController` hook to any child component that needs it, such as the `GameBoard` or `PlayControls`.

This architecture allows for a decoupled system where the UI (components) is a function of the state managed by the hooks, and the state is shared efficiently through contexts. For example, a page component under `src/pages` will initialize a controller hook. That hook's state is then provided to the component tree via a Context Provider. Child components can then consume that context to access state and dispatch actions without passing props down multiple levels.

#### Learning Resources

To better understand the patterns used in this codebase, we recommend reviewing the official documentation for these core React and Next.js features:

- [React Hooks](https://react.dev/reference/react/hooks)
- [React Context](https://react.dev/reference/react/createContext)
- [Next.js App Router](https://nextjs.org/docs)

### Client-Side Chess Engines

A key feature of the platform is its ability to run both Stockfish and Maia directly in the user's browser. This is accomplished using WebAssembly and ONNX Runtime Web.

- **Stockfish (`src/hooks/useStockfishEngine/`)**: We use a WebAssembly (WASM) version of Stockfish for standard chess analysis. The `useStockfishEngine` hook provides a simple interface to interact with the engine, allowing for move evaluation streams. This provides the "objective" best moves in any given position.

- **Maia (`src/hooks/useMaiaEngine/`)**: The Maia engine is a neural network provided as an ONNX (Open Neural Network Exchange) model. We use the `onnxruntime-web` library to load and run Maia models on the client-side. The `useMaiaEngine` hook manages the download, initialization, and execution of the various Maia models (e.g., `maia_kdd_1100` to `maia_kdd_1900`). This engine provides the "human-like" move predictions that are central to the platform's mission.

These hooks are consumed by higher-level controller hooks (like `useAnalysisController`) to provide the dual-engine analysis that powers many of the platform's features.

## Deployment

The Maia Chess Platform is deployed on [Vercel](https://vercel.com/). The `main` branch is automatically built and deployed to the production URL. Pull requests also generate unique preview deployments, allowing for easy testing and review before merging.
