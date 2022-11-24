## Vite Plugin Generate HTML

Generate `<script>` and `<link>` elements from entry files to serve Javascript and CSS bundles for your application.

## Install

Install the package from npm.

```bash
npm install --save-dev vite-plugin-generate-html
```

### Parameters

```ts
{
  /**
   * Directory to serve as plain static assets.
   * @default "/dist/"
   */
  publicDir?: string;

  /**
   * Entry point where JS bundles are served from.
   */
  jsEntryFile: string;

  /**
   * Entry point where CSS bundles are served from.
   */
  cssEntryFile: string;

  /**
   * Attributes provided to the generated bundle script tag. Passed as an array of strings.
   * @default ['type="module"']
   */
  attrs?: string[];
}
```

### Basic usage

Import your main entry css in application's main entry file (e.g. `main.ts`)

```js
import "sass/styles.scss";

// Other entry related code
import { createApp } from "vue";

const app = createApp({});

app.mount("#app");
```

Add the plugin to `vite.config.ts`

```ts
import { resolve as pathResolve } from "path";
import { defineConfig } from "vite";
import generateHtmlFiles from "vite-plugin-generate-html";

export default defineConfig({
  plugins: [
    generateHtmlFiles({
      publicDir: "/dist/",
      jsEntryFile: pathResolve(__dirname, "../some/dir/for/javascript.html")
      cssEntryFile: pathResolve(__dirname, "../some/dir/for/css.html"),
      attrs: ['type="module"']
    }
  ]
})
```

This will generate following files:

`javascript.html`

```html
<script type="module" src="/dist/main.[hash].js"></script>
```

`css.html`

```html
<link href="/dist/main.[hash].css" rel="stylesheet" media="all" />
```

> Note: plugin will override contents in the defined files.

## License

Copyright [Jari Ketolainen](https://github.com/gedouu)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
