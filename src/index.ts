import { promises as fsPromises } from "fs";
import type {
  OutputBundle,
  OutputChunk,
  NormalizedOutputOptions,
  Plugin
} from "rollup";

// viteMetadata has no typescript references
interface ViteChunkData extends OutputChunk {
  viteMetadata: {
    importedCss: Set<string>;
  };
}

interface OutputOptions {
  /**
   * Attributes provided to the generated bundle script element. Passed as an array of strings.
   */
  attrs: string[];

  /**
   * Attributes provided to the generated link element. Passed as an array of strings.
   */
  linkAttrs: string[];
}

interface VitePluginGenerateHtmlOptions {
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
   * Script and link element attributes provided per bundle's entry point. Entry point name must match those defined in configs.
   * E.g. if your applications default main entry point is "main.ts" you must pass "main" as an entry point name for output.
   * If output is left empty default attributes for script and link elements are used.
   * Script element default attributes: ['type="module"']
   * Link element default attributes: ['media="all"']
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
  output?: Array<Record<string, OutputOptions>>;
}

function generateHtmlFiles({
  publicDir = "/dist/",
  jsEntryFile,
  cssEntryFile,
  output = []
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
      const entryScripts = Object.values(bundle).filter(
        chunk => chunk.type === "chunk" && chunk.isEntry
      ) as ViteChunkData[];

      if (entryScripts.length <= 0) {
        throw new Error(
          "Application entry point was not found. Please define at least one entry point for the application."
        );
      }

      // Create script-tags
      try {
        const scripts = entryScripts
          .map(chunk => {
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
          this.error(
            `\n${error.message}\nWriting <script>-elements to ${jsEntryFile} failed\n`
          );
        }

        this.error(`\nWriting <script>-elements to ${jsEntryFile} failed`);
      }

      // Create link-tags
      try {
        const links = entryScripts
          .filter(chunk => chunk.viteMetadata.importedCss.size > 0)
          .map(chunk => {
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
                fileName =>
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
    }
  };
}

export default generateHtmlFiles;
