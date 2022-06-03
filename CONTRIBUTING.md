# Contributing

Thank you for your interest in contributing to this project.

## Setup

The package manager used to install and lock dependencies on this project
must be [`pnpm`](https://pnpm.io/).

Only the latest LTS version of `node` is supported.

- Run `pnpm install` in the root directory to install all dependencies.

The project is separated into multiple sub-projects that you will have to
`cd` into before you can work on them.

### Client

```console
cd client/
```

It's a web client mostly, but cordova can be used to deploy as an Elecron,
iOS or Android app.

- Run `pnpm dev` to start the development server.
  - Changes to the code will be reflected automatically in the browser.
  - Since this project depends heavily on web workers, due to a [vitejs
    limitations][1] you must use a Chromium-based browser for development.

In case you need to try a production build locally:

- Run `pnpm i --prod` to remove dev dependencies. (optional)
- Run `pnpm build` to build the bundle.
- Run `pnpm preview` to start the preview server.

Debugging:

- Use your browser's dev tools for debugging.
- For iOS targets, when running a debug build through the simulator,
  you can use Safari's Developer menu to remote debug the webview.
- For Android targets, when running a debug build, You can visit
  `chrome://inspect/#devices` to remote debug the webview.
  - Make sure `Discover network targets` is checked, and that your
    device is connected to the same network as your computer.

To run tests:

- Run `pnpm test` to run all tests.
- Run `pnpm test -- <test_filename>` to run all tests in a given file.
- Run `pnpm test -- -t <test_description>` to run a test by description.
- Run `pnpm test:cov` to run all tests and generate a coverage report,
  it will be available in the `coverage/` directory.

[1]: https://vitejs.dev/guide/features.html#import-with-query-suffixes

## Pull Request workflow

These are the things reviewers look out for when reviewing a pull request.

- **PR Names**: When merging the pull request, make sure the commit
  message matches the [seven rules](https://cbea.ms/git-commit/#seven-rules).

  - Commits in the PR do not matter, since everything is getting squashed.
  - If it's a bug fix, add `(fixes #xxx[,#xxx])`, where `#xxx` is the
    corresponding issue ID, for clearer release change logs.

- **Specs**: Make sure the included tests correctly test the changes of the PR.

  - Bug fix PRs _must_ include tests that cover the bug.
  - The tests must be readable, ideally with a gherkhin-style comment
    (Given... When... Then...) to help explain the test.

- **TSDoc**: Functions, classes, and props must have TSDoc comments.

- **Code readability**: complex chunks of code must always include
  some comment explaining what they do.

- **Accessibility**: changes should keep the same level of accessible
  content or improve it. This includes:

  - UI elements should have good contrast and indifferent to color
    blindness.
  - Actionable elements should be accessible through the different
    input methods (keyboard, touch, gamepad mainly. Vimium is a plus)
  - Aria and other accessibility attributes are correctly used.

- **Internationalization**: changes must adhere to basic i18n rules:

  - Client text strings must go through to i18next.
  - Non-client data should always use enums (or equivalent).
  - Extra-care for right-to-left direction.

- **UI layouts**: any given screen must look correctly on different
  screen sizes, no matter the orientation or cut-outs (notch).

- **Error handling**: the user should not have to deal with
  cryptic error messages.

- **Browser compatibility**: while we can rely on esbuild to output
  correct syntax, but provide polyfills or workarounds for
  missing browser compatiblity.

  > **Warning**
  > The list of supported browser versions is yet to be determined.

- **Unused code**: unused code should be removed. No commented-out code.
