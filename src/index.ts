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
   * Attributes provided to the generated bundle script element. Passed as an array of strings.
   * @default ['type="module"']
   */
  attrs?: string[];

  /**
   * Attributes provided to the generated link element. Passed as an array of strings.
   * @default ['media="all"']
   */
  linkAttrs?: string[];
}

function generateHtmlFiles({
  publicDir = "/dist/",
  jsEntryFile,
  cssEntryFile,
  attrs = ['type="module"'],
  linkAttrs = ['media="all"']
}: VitePluginGenerateHtmlOptions): Plugin {
  if (!jsEntryFile) {
    throw new Error("jsEntryFile is required");
  }

  if (!cssEntryFile) {
    throw new Error("cssEntryFile is required");
  }

  const scriptElementAttributes = attrs && attrs.length > 0 ? attrs : [];
  const linkElementAttributes =
    linkAttrs && linkAttrs.length > 0 ? linkAttrs : [];

  return {
    name: "vite-plugin-generate-html",
    async generateBundle(
      _options: NormalizedOutputOptions,
      bundle: OutputBundle
    ) {
      const entryScripts = Object.values(bundle).filter(
        chunk => chunk.type === "chunk" && chunk.isEntry
      ) as ViteChunkData[];

      // Create script-tags
      try {
        const scripts = entryScripts
          .map(chunk => {
            return `<script ${scriptElementAttributes.join(
              " "
            )} src="${publicDir}${chunk.fileName}"></script>`;
          })
          .join("\n");

        await fsPromises.writeFile(jsEntryFile, scripts);
      } catch (e) {
        console.error(e);
        throw new Error(`Writing <script>-elements to ${jsEntryFile} failed`);
      }

      // Create link-tags
      try {
        const chunksWithImportedCss = entryScripts.filter(
          chunk => chunk.viteMetadata.importedCss.size > 0
        );

        if (chunksWithImportedCss.length <= 0) return;

        const links = chunksWithImportedCss
          .map(data => data.viteMetadata.importedCss)
          .map(cssSet => {
            return Array.from(cssSet)
              .map(
                fileName =>
                  `<link href="${publicDir}${fileName}" rel="stylesheet" ${linkElementAttributes.join(
                    " "
                  )} />`
              )
              .join("\n");
          })
          .join("\n");

        await fsPromises.writeFile(cssEntryFile, links);
      } catch (e) {
        console.error(e);
        throw new Error(`Writing <link>-elements to ${cssEntryFile} failed`);
      }
    }
  };
}

export default generateHtmlFiles;
