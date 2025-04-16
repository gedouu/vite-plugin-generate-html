import { promises as fsPromises } from "fs";
import type {
  OutputBundle,
  OutputChunk,
  NormalizedOutputOptions,
  Plugin,
} from "rollup";

// Vite-specific metadata for chunks
interface ViteChunkData extends OutputChunk {
  viteMetadata: {
    importedCss: Set<string>;
  };
}

// Plugin configuration options
interface VitePluginGenerateHtmlOptions {
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
   * Entry point names must match those defined in your Vite configuration.
   *
   * If `output` is used, all entry points must be defined unless filtered using the `chunks` parameter.
   * Default attributes:
   * - `<script>`: `['type="module"']`
   * - `<link>`: `['media="all"']`
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
   * By default, all entry points are handled.
   *
   * @default []
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
    throw new Error("Configuration error: 'jsEntryFile' is required.");
  }

  if (!cssEntryFile) {
    throw new Error("Configuration error: 'cssEntryFile' is required.");
  }

  if (!Array.isArray(output)) {
    throw new Error("Configuration error: 'output' must be an array.");
  }

  const defaultScriptElementAttributes = ['type="module"'];
  const defaultLinkElementAttributes = ['media="all"'];

  return {
    name: "vite-plugin-generate-html",
    async generateBundle(
      _options: NormalizedOutputOptions,
      bundle: OutputBundle
    ) {
      // Filter entry scripts based on the provided chunks or include all by default
      const entryScripts = Object.values(bundle)
        .filter((chunk) => chunk.type === "chunk" && chunk.isEntry)
        .filter((chunk) => {
          if (chunks.length > 0) {
            return chunk.name && chunks.includes(chunk.name);
          }
          return true;
        }) as ViteChunkData[];

      if (entryScripts.length === 0) {
        throw new Error(
          "No application entry points found. Please define at least one entry point in your Vite configuration."
        );
      }

      // Generate <script> tags
      try {
        const scripts = entryScripts
          .map((chunk) => {
            // Use default attributes if no output configuration is provided
            if (output.length === 0) {
              return `<script ${defaultScriptElementAttributes.join(
                " "
              )} src="${publicDir}${chunk.fileName}"></script>`;
            }

            // Find matching entry in the output configuration
            const matchingEntry = output.find((entry) => entry[chunk.name]);

            if (!matchingEntry) {
              throw new Error(
                `Output configuration error: No matching key found for entry point "${chunk.name}".`
              );
            }

            const scriptElementAttributes = matchingEntry[chunk.name].attrs;
            if (!Array.isArray(scriptElementAttributes)) {
              throw new Error(
                `Output configuration error: 'attrs' for entry point "${chunk.name}" must be an array.`
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
            `Failed to write <script> elements to '${jsEntryFile}': ${error.message}`
          );
        }
        throw new Error(
          `Failed to write <script> elements to '${jsEntryFile}'.`
        );
      }

      // Generate <link> tags
      try {
        const links = entryScripts
          .filter((chunk) => chunk.viteMetadata.importedCss.size > 0)
          .map((chunk) => {
            let linkAttrs = defaultLinkElementAttributes;

            // Find matching entry in the output configuration
            const matchingEntry = output.find((entry) => entry[chunk.name]);

            if (matchingEntry) {
              if (!Array.isArray(matchingEntry[chunk.name].linkAttrs)) {
                throw new Error(
                  `Output configuration error: 'linkAttrs' for entry point "${chunk.name}" must be an array.`
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
            `Failed to write <link> elements to '${cssEntryFile}': ${error.message}`
          );
        }
        throw new Error(
          `Failed to write <link> elements to '${cssEntryFile}'.`
        );
      }
    },
  };
}

export default generateHtmlFiles;
