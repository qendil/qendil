# Contributing

Thank you for your interest in contributing to this project.

## Setup

The package manager used to install and lock dependencies on this project
must be [`pnpm`](https://pnpm.io/).

Only the latest LTS version of `node` is supported.

Rust nightly is required to build the project:

- Rust: https://rustup.rs/
- Wasm-pack: https://rustwasm.github.io/wasm-pack/installer/

The project is separated into multiple packages.

- Run `pnpm install` in the root directory to install all dependencies.

### Client

It's a web client mostly, but cordova can be used to deploy as an Elecron,
iOS or Android app.

- Run `pnpm dev:web` to start the development server.
  - Changes to the code will be reflected automatically in the browser.
  - Since this project depends heavily on web workers, due to a [vitejs
    limitations][1] you must use a Chromium-based browser for development.

In case you need to try a production build locally:

- Run `pnpm i --prod` to remove dev dependencies. (optional)
- Run `pnpm preview:web` to build and preview the production app.

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
- Run `pnpm test:cov` to run all tests and generate a coverage report,
  it will be available in the `coverage/` directory.

To run specific client tests:

- To run all tests in a given file:

  ```bash
  pnpm test --filter=client -- <test_file_name>
  ```

- To run a test using its name/description:

  ```bash
  pnpm test --filter=client -- -t <test_description>
  ```

[1]: https://vitejs.dev/guide/features.html#import-with-query-suffixes

#### Previewing Cordova targets

- Run `pnpm preview:<platform>` to preview the build in the `www/`.
- Run `pnpm preview:<platform> -- --serve=<url>` to preview the given URL
  on the given platform.
  - This is useful to develop the app on a remote device, as you will
    have access to hot module reloading when using `pnpm dev`.

> **Warning**<br>
> Cordova and its targets are marked as optional dependencies to avoid
> installing them when deploying to staging.
>
> If you're planning on running or building Cordova targets,
> make sure you didn't use `--no-optional` when running `pnpm i`.

> **Warning**<br>
> Running `cordova build` breaks pnpm's `node_modules/` folders,
> probably because it uses `npm`.
> If ever you need to run it locally, remember to re-run `pnpm i --force`
> afterwards.

Here are platform specific instructions:

##### Electron

- Run `pnpm dev` to start the development server.
- Run `pnpm preview:electron -- --serve=localhost:3000`

##### Android

- [Install the requirements of the cordova Android Platform][2].
  On ubuntu 22.04+, you can:

  ```bash
  curl -s "https://get.sdkman.io" | bash
  sdk install java 8.0.332-zulu
  sdk install gradle

  export ANDROID_SDK_ROOT=$HOME/.android/sdk  # Do not forget to add this to your .bashrc
  mkdir -p "$ANDROID_SDK_ROOT"
  sudo apt-get install sdkmanager # Ubuntu 22.04+
  sdkmanager --sdk_root=~/.android/sdk --install 'platforms;android-30' 'build-tools;30.0.3' platform-tools tools
  ```

- Connect an android device for remote debugging:

  - You can enable wireless debugging in your android phone's developer options,
    and then pair and connect to the device with adb.
    ```bash
    adb pair <your_phones_IP>:<port>
    adb connect <your_phones_IP>:<port>
    adb devices  # Should show your device
    ```
  - Since you'll need to be on the same network to access the dev server,
    USB debugging is obsolete.
  - You use avdmanager or android studio to make an android virtual device,
    just make sure you have access to the host's IP.
  - You can also use Windows Subsystem for Android, it is generally faster.

- Run `pnpm dev -- --host=0.0.0.0` to start the development server.

  - Using `--host=0.0.0.0` is required to allow access from the
    same local network. You can also use your host's IP address instead.
  - WSL users will need to [port forward][3] the port to the WSL VM.

- Run `pnpm preview:android -- --device --serve=192.168.1.94:3000` where
  `192.168.1.94` is the IP of the host or your computer in the local network.

  - replace `--device` with `--emulator` if using an emulator.

- To debug, you can visit `chrome://inspect/#devices` on Google Chrome,
  and your device should appear in a few seconds as long as it's connected
  to the same local network.

[2]: https://cordova.apache.org/docs/en/11.x/guide/platforms/android/
[3]: https://www.youtube.com/watch?v=ACjlvzw4bVE

##### iOS

- [Install Xcode](https://apps.apple.com/app/xcode/id497799835).
- Run `pnpm dev` to start the development server.
- Run `pnpm preview:ios -- --serve=localhost:3000` to start the simulator.
- To debug, the application's developper tools can be accessed from Safari's
  developer menu.
  - This assumes Safari's developer mode is enabled.

## Pull Request workflow

These are the things reviewers look out for when reviewing a pull request.

- **PR Names**: When merging the pull request, make sure the commit
  message matches the [seven rules][4].

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

  > **Warning**<br>
  > The list of supported browser versions is yet to be determined.

- **Unused code**: unused code should be removed. No commented-out code.

[4]: https://cbea.ms/git-commit/#seven-rules
