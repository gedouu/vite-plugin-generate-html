# Vite Plugin Generate HTML

Define separate output files for JS and CSS bundles. Plugin will generate `<script>` and `<link>` elements from entry files and copy elements to defined output files.
\
\
This plugin is useful for bundles that include a hash in the filename which changes in every compilation, and if you have several different views in which you want to include those JS- and CSS-bundles.\
Output file can have any file extension: `.html`, `.cshtml` (Razor), `.php` etc.\
The source of inspiration for this plugin is the Webpack's HtmlWebpackPlugin.

## Install

Install the package from npm.

```bash
npm install --save-dev vite-plugin-generate-html
```

### Parameters object

```ts
{
  /**
   * Directory to serve as plain static assets.
   * @default "/dist/"
   */
  publicDir?: string;

  /**
   * The file to write the generated script HTML to.
   */
  jsEntryFile: string;

  /**
   * The file to write the generated link HTML to.
   */
  cssEntryFile: string;

  /**
   * Custom script and link element attributes for application's entry points. 
   * Entry point name must match those defined in configs.
   * E.g. if your application's default main entry point is "main.ts" you must pass "main" as an entry point name for output.
   * 
   * If output is used, you must define all entry points to it, unless you filter them by using the chunks-parameter.
   * If output is left empty default attributes for script and link elements are used.
   * Script element default attributes: ['type="module"']
   * Link element default attributes: ['media="all"']
   * 
   * @default = []
   * @example
   * output: [
   *  {
   *    main: {
   *      attrs: ['type="module"', 'data-foo="bar"'],
   *      linkAttrs: ['media="all"']
   *    },
   *    ....
   *  }
   * ]
   */
   output?: Array<
    Record<
      string,
      {
        /**
         * Attributes provided for the generated bundle script element. Passed as an array of strings.
         */
        attrs: string[];

        /**
         * Attributes provided for the generated link element. Passed as an array of strings.
         */
        linkAttrs: string[];
      }
    >
  >;

  /**
   * By default the plugin will handle all chunks that are defined as entry points,
   * but you can also limit it to handle only certain ones.
   * This allows to reuse the plugin and define different output paths for some other entries.
   * @default = []
   * @example
   * chunks: ["app", "otherEntry"]
   */
  chunks?: string[]
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
You can change the bundles output loading order by changing the order in `rollupOptions.input`.\
Add the plugin to plugins array.
```ts
// vite.config.ts
import { resolve as pathResolve } from "path";
import { defineConfig } from "vite";
import VitePluginGenerateHtmlFiles from "vite-plugin-generate-html";

export default defineConfig({
  // ...other config options
  build: {
    rollupOptions: {
      input: {
        app: pathResolve(__dirname, "src/main.ts")
        // otherEntry: pathResolve(__dirname, "src/other_entry.ts")
      }
    }
  },
  plugins: [
    VitePluginGenerateHtmlFiles({
      publicDir: "/dist/",
      jsEntryFile: pathResolve(__dirname, "../some/dir/for/javascript.html"),
      cssEntryFile: pathResolve(__dirname, "../some/dir/for/css.html")
    }
    // Reuse the plugin for some other entry with custom output options:
    // 
    // VitePluginGenerateHtmlFiles({
    //   publicDir: "/dist/",
    //   jsEntryFile: pathResolve(__dirname, "../some/dir/for/another-javascript.html"),
    //   cssEntryFile: pathResolve(__dirname, "../some/dir/for/another-css.html")
    //   output: [
    //     {
    //       otherEntry: {
    //         attrs: ['type="module"', 'data-foo="bar"'],
    //         linkAttrs: ['media="all"']
    //       }
    //     }
    //   ],
    //   chunks: ["otherEntry"]
    // }
  ]
)}
```

This will generate following files (ending part after /dist/ may be different depending on other config settings in your app):

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
