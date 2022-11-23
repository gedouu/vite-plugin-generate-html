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

interface RollupPluginCreateHtmlFilesOptions {
  /**
   * Directory to serve as plain static assets.
   * @default "/dist/"
   */
  publicDir?: string;

  /**
   * Entry point where JS bundle(s) is served from.
   */
  jsEntryFile: string;

  /**
   * Entry point where CSS bundle(s) is served from.
   */
  cssEntryFile: string;
}

function generateHtmlFiles({
  publicDir = "/dist/",
  jsEntryFile,
  cssEntryFile,
}: RollupPluginCreateHtmlFilesOptions): Plugin {
  if (!jsEntryFile) {
    throw new Error("jsEntryFile is required");
  }

  if (!cssEntryFile) {
    throw new Error("cssEntryFile is required");
  }

  return {
    name: "vite-plugin-generate-html",
    async generateBundle(
      _options: NormalizedOutputOptions,
      bundle: OutputBundle
    ) {
      const entryScripts = Object.values(bundle).filter(
        (chunk) => chunk.type === "chunk" && chunk.isEntry
      ) as ViteChunkData[];

      // Create script-tags
      try {
        const scripts = entryScripts
          .map((chunk) => {
            return `<script type="module" src="${publicDir}${chunk.fileName}"></script>`;
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
          (chunk) => chunk.viteMetadata.importedCss.size > 0
        );

        if (chunksWithImportedCss.length <= 0) return;

        const links = chunksWithImportedCss
          .map((data) => data.viteMetadata.importedCss)
          .map((cssSet) => {
            return Array.from(cssSet)
              .map(
                (fileName) =>
                  `<link href="${publicDir}${fileName}" rel="stylesheet" media="all">`
              )
              .join("\n");
          })
          .join("\n");

        await fsPromises.writeFile(cssEntryFile, links);
      } catch (e) {
        console.error(e);
        throw new Error(`Writing <link>-elements to ${cssEntryFile} failed`);
      }
    },
  };
}

export default generateHtmlFiles;
