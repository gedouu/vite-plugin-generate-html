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
   * Attributes provided to the generated bundle script element. Passed as an array of strings.
   * @default ['type="module"']
   */
  attrs?: string[];

  /**
   * Attributes provided to the generated bundle link element. Passed as an array of strings.
   * @default ['media="all"']
   */
  linkAttrs?: string[];
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

Bundles are generated based on your applications entry points so you need to have at least one entry defined. \
Add the plugin to plugins array.
```ts
// vite.config.ts
import { resolve as pathResolve } from "path";
import { defineConfig } from "vite";
import generateHtmlFiles from "vite-plugin-generate-html";

export default defineConfig({
  // ...other config options
  build: {
    rollupOptions: {
      input: {
        app: pathResolve(__dirname, "src/main.ts")
      }
    }
  },
  plugins: [
    generateHtmlFiles({
      publicDir: "/dist/",
      jsEntryFile: pathResolve(__dirname, "../some/dir/for/javascript.html"),
      cssEntryFile: pathResolve(__dirname, "../some/dir/for/css.html"),
      attrs: ['type="module"'],
      linkAttrs: ['media="all"']
    }
  ]
)}
```

This will generate following files:

`javascript.html`

```html
<script type="module" src="/dist/app.[hash].js"></script>
```

`css.html`

```html
<link href="/dist/main.[hash].css" rel="stylesheet" media="all" />
```

> Note: plugin will override contents in the defined files.

## License

MIT
