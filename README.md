# Vite Plugin Generate HTML

This plugin allows you to define separate output files for JavaScript and CSS bundles. It generates `<script>` and `<link>` elements from entry files and writes them to specified output files.

This is particularly useful when:

- Your bundles include a hash in the filename that changes with every compilation.
- You have multiple views that need to include these JS and CSS bundles.
- You want to output files in formats like `.html`, `.cshtml` (Razor), `.php`, etc.

Inspired by Webpack's `HtmlWebpackPlugin`, this plugin provides similar functionality for Vite.

---

## Installation

Install the plugin using npm:

```bash
npm install --save-dev vite-plugin-generate-html
```

---

## Parameters

The plugin accepts the following configuration options:

```ts
{
  /**
   * Directory to serve as plain static assets.
   * @default "/dist/"
   */
  publicDir?: string;

  /**
   * The file to write the generated `<script>` HTML to.
   */
  jsEntryFile: string;

  /**
   * The file to write the generated `<link>` HTML to.
   */
  cssEntryFile: string;

  /**
   * Custom attributes for `<script>` and `<link>` elements for specific entry points.
   *
   * - Entry point names must match those defined in your Vite configuration.
   * - If `output` is used, all entry points must be defined unless filtered using the `chunks` parameter.
   * - Default attributes:
   *   - `<script>`: `['type="module"']`
   *   - `<link>`: `['media="all"']`
   *
   * @default []
   * @example
   * output: [
   *   {
   *     main: {
   *       attrs: ['type="module"', 'data-foo="bar"'],
   *       linkAttrs: ['media="all"']
   *     }
   *   }
   * ]
   */
  output?: Array<
    Record<
      string,
      {
        /**
         * Attributes for the generated `<script>` element.
         */
        attrs: string[];

        /**
         * Attributes for the generated `<link>` element.
         */
        linkAttrs: string[];
      }
    >
  >;

  /**
   * Limit the plugin to handle only specific entry points.
   *
   * - By default, all entry points are handled.
   * - Use this to define different output paths for specific entries.
   *
   * @default []
   * @example
   * chunks: ["app", "otherEntry"]
   */
  chunks?: string[];
}
```

---

## Basic Usage

### Step 1: Import CSS in Your Main Entry File

Ensure your main entry file (e.g., `main.ts`) imports the required CSS:

```js
import "sass/styles.scss";

// Other entry-related code
import { createApp } from "vue";

const app = createApp({});
app.mount("#app");
```

### Step 2: Configure the Plugin in `vite.config.ts`

Add the plugin to your Vite configuration:

```ts
// vite.config.ts
import { resolve as pathResolve } from "path";
import { defineConfig } from "vite";
import VitePluginGenerateHtmlFiles from "vite-plugin-generate-html";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: pathResolve(__dirname, "src/main.ts"),
        // otherEntry: pathResolve(__dirname, "src/other_entry.ts")
      },
    },
  },
  plugins: [
    VitePluginGenerateHtmlFiles({
      publicDir: "/dist/",
      jsEntryFile: pathResolve(__dirname, "../some/dir/for/javascript.html"),
      cssEntryFile: pathResolve(__dirname, "../some/dir/for/css.html"),
    }),
    // Reuse the plugin for another entry with custom output options:
    // VitePluginGenerateHtmlFiles({
    //   publicDir: "/dist/",
    //   jsEntryFile: pathResolve(__dirname, "../some/dir/for/another-javascript.html"),
    //   cssEntryFile: pathResolve(__dirname, "../some/dir/for/another-css.html"),
    //   output: [
    //     {
    //       otherEntry: {
    //         attrs: ['type="module"', 'data-foo="bar"'],
    //         linkAttrs: ['media="all"'],
    //       },
    //     },
    //   ],
    //   chunks: ["otherEntry"],
    // }),
  ],
});
```

### Step 3: Generated Output

After building your project, the plugin will generate the following files (paths may vary based on your configuration):

#### `javascript.html`

```html
<script type="module" src="/dist/app.[hash].js"></script>
```

#### `css.html`

```html
<link href="/dist/main.[hash].css" rel="stylesheet" media="all" />
```

> **Note:** The plugin will overwrite the contents of the specified output files.

---

## Advanced Usage

### Custom Attributes for Entry Points

You can define custom attributes for `<script>` and `<link>` elements for specific entry points using the `output` parameter:

```ts
output: [
  {
    main: {
      attrs: ['type="module"', 'data-foo="bar"'],
      linkAttrs: ['media="all"'],
    },
  },
];
```

### Handling Specific Chunks

Use the `chunks` parameter to limit the plugin to specific entry points:

```ts
chunks: ["app", "otherEntry"];
```

This allows you to reuse the plugin for different entries with separate configurations.

---

## License

This project is licensed under the [MIT License](./LICENSE).