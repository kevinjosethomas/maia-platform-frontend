# maia platform   

This is the code that powers the[ Maia Chess platform](https://www.maiachess.com).
   
It is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with the additions of [`typescript`](https://www.typescriptlang.org/), [`eslint`](https://eslint.org/), [`storybook`](https://storybook.js.org/), [`prettier`](https://prettier.io/), [`sass`](https://sass-lang.com/), [`testing-library`](https://testing-library.com/) ,and [`jest`](https://jestjs.io/).

Initialize a new `next-app` with this project as a template by running

```bash
npx create next-app --example https://github.com/datadeque/next-app
# or
yarn create next-app --example https://github.com/datadeque/next-app
```

## Development Guide

This project uses [`yarn`](https://yarnpkg.com/) and is developed & maintained for [`node`](https://nodejs.org/en/) version 17+ (however CI will try builds using versions 12, 14, and 16 as well).

The recommended code editor is [`vscode`](https://code.visualstudio.com/) along with the following extensions (see `.vscode/extensions.json`):

- eslint (Linter)
- prettier (Formatter)
- mdx (Syntax Highlighting for Storybook)

These extensions are highly recommended along with vscode because the project is pre-configured to format and fix ALL fixable issues on save. Furthermore, please open this project by running `code .` in the root directory from your terminal since there are known issues with environment variables when opening the project from gui.

It also helps to know the following tools:

- [`sass`](https://sass-lang.com/)
- [`react contexts`](https://reactjs.org/docs/context.html)
- [`react custom hooks`](https://reactjs.org/docs/hooks-custom.html)

### Design

Each page of the platform can be found in `src/pages`. Inside, a wrapper component fetches the data from the api and renders the page itself when the data is received. An example of this is in the `train` page where `TrainPage` fetches the game, and renders `Train`.

We'll refer the component rendered by the wrapper as the main component. Inside the main component a custom hook is used to isolate all the logic, and two variables `mobileLayout` and `desktopLayout` are initialized to represent the corresponding layouts.

The `GameControllerContext` is used to simply pass data down, as any child component of the main component can easily consume the controller without passing it down multiple layers using props.

Each main component typically contains a `GameBoard` component which renders the lichess chessboard UI, and a family of surrounding components that are either interactive or show information such as analysis.

### Getting Started

First, install the dependencies by running

```bash
yarn
# or
yarn install
```

Then start the development server by running

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

### Storybook

To start storybook development server by running

```bash
yarn storybook
```

Open http://localhost:6006/ with your browser and see the result.

### Linting & Testing

You can lint the entire project using the built-in `eslint` config by running

```bash
yarn lint
```

This is the same command that runs during the lint step of the initial CI.

You can run your test files by running

```bash
yarn test
```

This is the same command that runs during the test step of the initial CI.

## Development Practices

### Committing

Conventional commits is a pretty simple convention, you can learm more about it [here](https://www.conventionalcommits.org/en/v1.0.0/).

Basically commit messages follow the following format: `{action}: {description}`, where action is one of `feat`, `chore`, `fix`, `style`... and description is description of the change in present tense.

### Testing

Every react component should atleast have one test, to see if it renders. Test files are to be placed in `__test__` and follow the same file structure as the project root.

Suppose you built a new component under `src/components/button/button.tsx`, a test should be placed in `__tests__/components/button/button.test.tsx` with the following:

```tsx
import { render } from '@testing-library/react'
import Button from 'components/button'

describe('Button', () => {
  it('renders', () => {
    render(<Button />)
  })
})
```

This will ensure that future modifications by others won't severely break your component. Should you have a complex component that interacts with its props, you should add some more complex tests.

### File Structure

Below is the an example of a recommended file structure:

```
src/
    pages/
    components/
        ComponentName/
            ComponentName.tsx
            index.tsx
            styles.scss # Modular Styles if needed
        index.tsx
    styles/
    contexts/
    hooks/
    utils/
```

## Github Actions

This project is has the following pre-configuration, which tests, lints and builds all branches and PRs.

```yaml
name: CI

on:
  push:
  pull_request:
    branches: ['**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: yarn
      - run: yarn test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: yarn
      - run: yarn lint

  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ['12', '14', '16', '17']
    name: Node ${{ matrix.node }} Build
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node }}
      - run: yarn
      - run: yarn build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
