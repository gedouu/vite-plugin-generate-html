import { promises as fsPromises } from "fs";
import type {
  OutputBundle,
  OutputChunk,
  NormalizedOutputOptions,
  Plugin,
} from "rollup";

// viteMetadata has no typescript references
interface ViteChunkData extends OutputChunk {
  viteMetadata: {
    importedCss: Set<string>;
  };
}

interface VitePluginGenerateHtmlOptions {
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
  chunks?: string[];
}

function generateHtmlFiles({
  publicDir = "/dist/",
  jsEntryFile,
  cssEntryFile,
  output = [],
  chunks = [],
}: VitePluginGenerateHtmlOptions): Plugin {
  if (!jsEntryFile) {
    throw new Error("Missing option - jsEntryFile is required");
  }

  if (!cssEntryFile) {
    throw new Error("Missing option - cssEntryFile is required");
  }

  if (!Array.isArray(output)) {
    throw new Error("Output error - output must be type of array");
  }

  const defaultScriptElementAttributes = ['type="module"'];
  const defaultLinkElementAttributes = ['media="all"'];

  return {
    name: "vite-plugin-generate-html",
    async generateBundle(
      _options: NormalizedOutputOptions,
      bundle: OutputBundle
    ) {
      const entryScripts = Object.values(bundle)
        .filter((chunk) => chunk.type === "chunk" && chunk.isEntry)
        .filter((chunk) => {
          if (chunks.length > 0) {
            if (chunk.name && chunks.indexOf(chunk.name) !== -1) {
              return true;
            }

            return false;
          }

          return true;
        }) as ViteChunkData[];

      if (entryScripts.length <= 0) {
        throw new Error(
          "Application entry point was not found. Please define at least one entry point for the application."
        );
      }

      // Create script-tags
      try {
        const scripts = entryScripts
          .map((chunk) => {
            // if output is not set return default attributes
            if (output.length <= 0) {
              return `<script ${defaultScriptElementAttributes.join(
                " "
              )} src="${publicDir}${chunk.fileName}"></script>`;
            }

            // check if output array contains correct entry point names
            const matchingEntry = output.find((_, index) => {
              return output[index][chunk.name];
            });

            if (!matchingEntry) {
              throw new Error(
                `Output error - Entry point "${chunk.name}" has no matching key in output entry points.`
              );
            }

            const scriptElementAttributes = matchingEntry[chunk.name].attrs;
            if (!Array.isArray(scriptElementAttributes)) {
              throw new Error(
                `Output error - output.${chunk.name}.attrs is not a valid array.`
              );
            }

            return `<script ${scriptElementAttributes.join(
              " "
            )} src="${publicDir}${chunk.fileName}"></script>`;
          })
          .join("\n");

        await fsPromises.writeFile(jsEntryFile, scripts);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(
            `\n${error.message}\nWriting <script>-elements to ${jsEntryFile} failed\n`
          );
        }

        throw new Error(`\nWriting <script>-elements to ${jsEntryFile} failed`);
      }

      // Create link-tags
      try {
        const links = entryScripts
          .filter((chunk) => chunk.viteMetadata.importedCss.size > 0)
          .map((chunk) => {
            let linkAttrs = defaultLinkElementAttributes;

            // check if output array contains correct entry point names
            const matchingEntry = output.find((_, index) => {
              return output[index][chunk.name];
            });

            if (matchingEntry) {
              if (!Array.isArray(matchingEntry[chunk.name].linkAttrs)) {
                throw new Error(
                  `Output error - output.${chunk.name}.linkAttrs is not a valid array`
                );
              }

              linkAttrs = matchingEntry[chunk.name].linkAttrs;
            }

            return Array.from(chunk.viteMetadata.importedCss)
              .map(
                (fileName) =>
                  `<link href="${publicDir}${fileName}" rel="stylesheet" ${linkAttrs.join(
                    " "
                  )} />`
              )
              .join("\n");
          })
          .join("\n");

        await fsPromises.writeFile(cssEntryFile, links);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(
            `\n${error.message}\nWriting <link>-elements to ${cssEntryFile} failed\n`
          );
        }

        throw new Error(`\nWriting <link>-elements to ${cssEntryFile} failed`);
      }
    },
  };
}

export default generateHtmlFiles;
