# Changelog

## [Unreleased](https://github.com/qendil/qendil/tree/HEAD)

[Full Changelog](https://github.com/qendil/qendil/compare/client/0.1.0...HEAD)

**Implemented enhancements:**

- Add manual ECS entity queries and arbitrary queries in ECS systems [\#186](https://github.com/qendil/qendil/pull/186)
- Standalone mesh component [\#179](https://github.com/qendil/qendil/pull/179)
- Ecs add resources [\#168](https://github.com/qendil/qendil/pull/168)
- Ecs improvements [\#167](https://github.com/qendil/qendil/pull/167)
- Add smooth position animation [\#164](https://github.com/qendil/qendil/pull/164)
- ECS Refactoring and improvements [\#125](https://github.com/qendil/qendil/pull/125)

**Fixed bugs:**

- Fix ECS commands not cleaning up after each run [\#180](https://github.com/qendil/qendil/pull/180)
- Fix useWasm failing when the initializer resolves to undefined [\#129](https://github.com/qendil/qendil/pull/129)

**Other changes:**

- Add a basic ECS commands system [\#177](https://github.com/qendil/qendil/pull/177)
- Extract the client-common package [\#174](https://github.com/qendil/qendil/pull/174)
- Rename client workers [\#163](https://github.com/qendil/qendil/pull/163)

## [0.1.0](https://github.com/qendil/qendil/tree/client/0.1.0) (2022-06-26)

[Full Changelog](https://github.com/qendil/qendil/compare/client/0.0.1...client/0.1.0)

**Implemented enhancements:**

- Add an on-screen touch joystick [\#121](https://github.com/qendil/qendil/pull/121)
- Improve the ThreeView component [\#108](https://github.com/qendil/qendil/pull/108)
- Add a basic ECS [\#96](https://github.com/qendil/qendil/pull/96)

**Fixed bugs:**

- Fix ThreeView re-initializing on each re-render [\#119](https://github.com/qendil/qendil/pull/119)
- Fix layout issues in iOS and Electron [\#106](https://github.com/qendil/qendil/pull/106)
- Fix handling of disposal in ECS [\#100](https://github.com/qendil/qendil/pull/100)

**Other changes:**

- Refactor App scene to use ECS [\#104](https://github.com/qendil/qendil/pull/104)
- Update dependency vite-plugin-sentry to ^1.0.18 [\#92](https://github.com/qendil/qendil/pull/92) ([renovate[bot]](https://github.com/apps/renovate))

## [0.0.1](https://github.com/qendil/qendil/tree/client/0.0.1) (2022-06-16)

[Full Changelog](https://github.com/qendil/qendil/compare/9e10223cc8d159a918bdc781818249c84644e133...client/0.0.1)

**Implemented enhancements:**

- Add keyboard movement to the cube [\#59](https://github.com/qendil/qendil/pull/59)
- Add a keyboard InputManager [\#58](https://github.com/qendil/qendil/pull/58)
- Add a visible orange cube [\#52](https://github.com/qendil/qendil/pull/52)
- Add Sentry support [\#40](https://github.com/qendil/qendil/pull/40)
- Add unit tests [\#39](https://github.com/qendil/qendil/pull/39)
- Add PWA support [\#36](https://github.com/qendil/qendil/pull/36)
- Add iOS support [\#33](https://github.com/qendil/qendil/pull/33)
- Add Android support [\#24](https://github.com/qendil/qendil/pull/24)
- Add Desktop apps support [\#16](https://github.com/qendil/qendil/pull/16)

**Other changes:**

- Add service worker production file test [\#63](https://github.com/qendil/qendil/pull/63)
- Add a Lighthouse check on the staging deployment [\#60](https://github.com/qendil/qendil/pull/60)
- Make ThreeView camera optional [\#57](https://github.com/qendil/qendil/pull/57)
- Create client [\#2](https://github.com/qendil/qendil/pull/2)
