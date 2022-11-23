## Vite Plugin Generate HTML

Generate `<script>` and `<link>` elements from entry files to serve Javascript and CSS bundles for your application.
Note: plugin will override contents in the defined files.

## Install

Install the package from npm.

```bash
npm install --save-dev vite-plugin-generate-html
```

### Basic usage

Import your main entry css in application's main entry file e.g. `main.ts`

```ts
import "sass/styles.scss";

// Other app related code
import { createApp } from "vue";

const app = createApp({});

app.mount("#app");
```

Add the plugin to `vite.config.ts`

```ts
// vite.config.ts
import generateHtmlFiles from "vite-plugin-generate-html";
// Other dependencies...

export default defineConfig({
  plugins: [
    generateHtmlFiles({
      publicDir: "/dist/",
      jsEntryFile: path.resolve("../some/dir/for/entryFileJs.html")
      cssEntryFile: path.resolve("../some/dir/for/entryFileCss.html")
    }
  ]
})
```

This will generate:

`entryFileJs.html`

```html
<script type="module" src="/dist/main.[hash].js"></script>
```

`entryFileCss.html`

```html
<link href="/dist/main.[hash].css" rel="stylesheet" media="all" />
```

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
