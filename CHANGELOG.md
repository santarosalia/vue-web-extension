# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.0](https://github.com/Kocal/vue-web-extension/compare/v1.12.0...v2.0.0) (2020-08-31)

Vue-web-extension now becomes a [Vue CLI 3+ preset](https://cli.vuejs.org/guide/plugins-and-presets.html#presets)!

Support for Vue CLI <2 has been removed.

See [#622](https://github.com/Kocal/vue-web-extension/pull/622) for more information!

### Bug Fixes

* images & fonts not being properly bundled ([#571](https://github.com/Kocal/vue-web-extension/issues/571)) ([91de1d5](https://github.com/Kocal/vue-web-extension/commit/91de1d5f031ce17d9b3c1ffeaf38e855d4251d23))

## [1.12.0](https://github.com/Kocal/vue-web-extension/compare/v1.11.0...v1.12.0) (2019-08-15)


### Bug Fixes

* change fonts directory to `/fonts/` ([#453](https://github.com/Kocal/vue-web-extension/issues/453)) ([8700217](https://github.com/Kocal/vue-web-extension/commit/8700217))
* fix images loading when using a relative path ([#474](https://github.com/Kocal/vue-web-extension/issues/474)) ([795d91a](https://github.com/Kocal/vue-web-extension/commit/795d91a))


### Features

* **webpack:** handle fonts ([#445](https://github.com/Kocal/vue-web-extension/issues/445)) ([9ee09ae](https://github.com/Kocal/vue-web-extension/commit/9ee09ae))



## [1.11.0](https://github.com/Kocal/vue-web-extension/compare/v1.10.0...v1.11.0) (2019-06-08)


### Build System

* **deps:** update ESLint ([688a2d5](https://github.com/Kocal/vue-web-extension/commit/688a2d5))
* **deps:** update Vue to ^2.6.10 ([df9ae97](https://github.com/Kocal/vue-web-extension/commit/df9ae97))


### Features

* install babel runtime ([#411](https://github.com/Kocal/vue-web-extension/issues/411)) ([4319a38](https://github.com/Kocal/vue-web-extension/commit/4319a38))
* use core-js 3 ([#410](https://github.com/Kocal/vue-web-extension/issues/410)) ([e27d910](https://github.com/Kocal/vue-web-extension/commit/e27d910))
* **hot-reload:** migrate to webpack-extension-reloader ([#431](https://github.com/Kocal/vue-web-extension/issues/431)) ([cd68341](https://github.com/Kocal/vue-web-extension/commit/cd68341))



<a name="1.10.0"></a>

# [1.10.0](https://github.com/Kocal/vue-web-extension/compare/v1.9.0...v1.10.0) (2019-04-05)

### Bug Fixes

- Handle `eval` removal properly, remove "remove-evals" script and WebpackShellPlugin ([#398](https://github.com/Kocal/vue-web-extension/issues/398)) ([ab1ce52](https://github.com/Kocal/vue-web-extension/commit/ab1ce52))

### Features

- add core-js dependency ([#381](https://github.com/Kocal/vue-web-extension/issues/381)) ([01066ba](https://github.com/Kocal/vue-web-extension/commit/01066ba))



<a name="1.9.0"></a>
# [1.9.0](https://github.com/Kocal/vue-web-extension/compare/v1.8.1...v1.9.0) (2018-11-08)


### Features

* `browser` object is now accessible in Vue templates by using `$browser` ([#357](https://github.com/Kocal/vue-web-extension/issues/357)) ([83b76fe](https://github.com/Kocal/vue-web-extension/commit/83b76fe))



<a name="1.8.1"></a>
## [1.8.1](https://github.com/Kocal/vue-web-extension/compare/v1.8.0...v1.8.1) (2018-10-26)


### Bug Fixes

* remove vulnerable "zip-folder" package for "archiver" ([#347](https://github.com/Kocal/vue-web-extension/issues/347)) ([a42d20f](https://github.com/Kocal/vue-web-extension/commit/a42d20f)), closes [#338](https://github.com/Kocal/vue-web-extension/issues/338)



<a name="1.8.0"></a>
# [1.8.0](https://github.com/Kocal/vue-web-extension/compare/v1.7.0...v1.8.0) (2018-10-23)


### Features

* use EJS on html files, inject process.env.* vars ([#336](https://github.com/Kocal/vue-web-extension/issues/336)) ([8171f3e](https://github.com/Kocal/vue-web-extension/commit/8171f3e)), closes [/github.com/Kocal/vue-web-extension/issues/334#issuecomment-430491330](https://github.com//github.com/Kocal/vue-web-extension/issues/334/issues/issuecomment-430491330)



<a name="1.7.0"></a>
# [1.7.0](https://github.com/Kocal/vue-web-extension/compare/v1.6.0...v1.7.0) (2018-10-14)


### Bug Fixes

* **ci:** use TRAVIS_PULL_REQUEST_BRANCH env var ([870bc9b](https://github.com/Kocal/vue-web-extension/commit/870bc9b))


### Features

* **prompt:** add prompt for Mozilla Polyfill ([#335](https://github.com/Kocal/vue-web-extension/issues/335)) ([ec0277b](https://github.com/Kocal/vue-web-extension/commit/ec0277b))



<a name="1.6.0"></a>
# [1.6.0](https://github.com/Kocal/vue-web-extension/compare/v1.5.0...v1.6.0) (2018-07-08)


### Features

* add prompt for options page ([#263](https://github.com/Kocal/vue-web-extension/issues/263)) ([0bdb5e6](https://github.com/Kocal/vue-web-extension/commit/0bdb5e6))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/Kocal/vue-web-extension/compare/v1.4.0...v1.5.0) (2018-07-01)


### Bug Fixes

* prettier git hook is not asked during init ([#255](https://github.com/Kocal/vue-web-extension/issues/255)) ([391a17b](https://github.com/Kocal/vue-web-extension/commit/391a17b))
* rename prettier configuration file ([#253](https://github.com/Kocal/vue-web-extension/issues/253)) ([2927a0d](https://github.com/Kocal/vue-web-extension/commit/2927a0d)), closes [#252](https://github.com/Kocal/vue-web-extension/issues/252)
* **tmpl:** do not use vuex getter if vuex is disabled ([#259](https://github.com/Kocal/vue-web-extension/issues/259)) ([7739197](https://github.com/Kocal/vue-web-extension/commit/7739197)), closes [#254](https://github.com/Kocal/vue-web-extension/issues/254)


### Features

* **deps:** add [@types](https://github.com/types)/chrome ([#258](https://github.com/Kocal/vue-web-extension/issues/258)) ([35e68a3](https://github.com/Kocal/vue-web-extension/commit/35e68a3))
* **eslint:** add web extension environment ([#257](https://github.com/Kocal/vue-web-extension/issues/257)) ([5a904f1](https://github.com/Kocal/vue-web-extension/commit/5a904f1))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/Kocal/vue-web-extension/compare/v1.3.1...v1.4.0) (2018-06-24)


### Features

* setup git precommit hook for running Prettier ([#224](https://github.com/Kocal/vue-web-extension/issues/224)) ([7a8ee9b](https://github.com/Kocal/vue-web-extension/commit/7a8ee9b)), closes [#219](https://github.com/Kocal/vue-web-extension/issues/219)



<a name="1.3.1"></a>
## [1.3.1](https://github.com/Kocal/vue-web-extension/compare/v1.3.0...v1.3.1) (2018-06-24)


### Bug Fixes

* .babelrc format ([#225](https://github.com/Kocal/vue-web-extension/issues/225)) ([0e39124](https://github.com/Kocal/vue-web-extension/commit/0e39124))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/Kocal/vue-web-extension/compare/v1.2.0...v1.3.0) (2018-05-08)


### Features

* add auto-install behavior ([#68](https://github.com/Kocal/vue-web-extension/issues/68)) ([d1e0f1a](https://github.com/Kocal/vue-web-extension/commit/d1e0f1a))
* **auto-install:** run eslint ([#69](https://github.com/Kocal/vue-web-extension/issues/69)) ([7378ac3](https://github.com/Kocal/vue-web-extension/commit/7378ac3))
* **auto-install:** run Prettier ([#70](https://github.com/Kocal/vue-web-extension/issues/70)) ([03a63fb](https://github.com/Kocal/vue-web-extension/commit/03a63fb))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/Kocal/vue-web-extension/compare/v1.1.0...v1.2.0) (2018-05-05)


### Bug Fixes

* **tests:** handle external scripts errors properly ([#64](https://github.com/Kocal/vue-web-extension/issues/64)) ([cbe4415](https://github.com/Kocal/vue-web-extension/commit/cbe4415))


### Features

* add eslint support ([#53](https://github.com/Kocal/vue-web-extension/issues/53)) ([2341518](https://github.com/Kocal/vue-web-extension/commit/2341518))
* **babel:** add optional chaining plugin ([#59](https://github.com/Kocal/vue-web-extension/issues/59)) ([efda722](https://github.com/Kocal/vue-web-extension/commit/efda722))
* **babel:** specify browser list ([#57](https://github.com/Kocal/vue-web-extension/issues/57)) ([dbd9b21](https://github.com/Kocal/vue-web-extension/commit/dbd9b21))
* add Hot Module Reloading ([#61](https://github.com/Kocal/vue-web-extension/issues/61)) ([892713c](https://github.com/Kocal/vue-web-extension/commit/892713c))
* add prettier ([#55](https://github.com/Kocal/vue-web-extension/issues/55)) ([b54de3e](https://github.com/Kocal/vue-web-extension/commit/b54de3e))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/Kocal/vue-web-extension/compare/v1.0.3...v1.1.0) (2018-05-04)


### Bug Fixes

* **script:remove-evals:** regex for development  ([90d9958](https://github.com/Kocal/vue-web-extension/commit/90d9958))


### Features

* add package json ([#46](https://github.com/Kocal/vue-web-extension/issues/46)) ([1e162e3](https://github.com/Kocal/vue-web-extension/commit/1e162e3))
* allow unsafe-eval for Chrome CSP, in development mode only ([e7c0b4f](https://github.com/Kocal/vue-web-extension/commit/e7c0b4f))
* manifest.json's version is hydrated by package.json's version ([e9b6138](https://github.com/Kocal/vue-web-extension/commit/e9b6138))
* **script:** implement npm release script ([#47](https://github.com/Kocal/vue-web-extension/issues/47)) ([fb2e649](https://github.com/Kocal/vue-web-extension/commit/fb2e649))
