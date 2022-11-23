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
   * Public path for bundles
   * @default "/dist/"
   */
  bundlePublicPath?: string;

  /**
   * Path for a file JS bundle(s) is served from
   */
  jsFilename: string;

  /**
   * Path for a file CSS bundle(s) is served from
   */
  cssFilename: string;
}

function generateHtmlFiles({
  bundlePublicPath = "/dist/",
  jsFilename,
  cssFilename,
}: RollupPluginCreateHtmlFilesOptions): Plugin {
  if (!jsFilename) {
    throw new Error("jsFilename is required");
  }

  if (!cssFilename) {
    throw new Error("cssFilename is required");
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
            return `<script type="module" src="${bundlePublicPath}${chunk.fileName}"></script>`;
          })
          .join("\n");

        await fsPromises.writeFile(jsFilename, scripts);
      } catch (e) {
        console.error(e);
        throw new Error(`Writing scripts to ${jsFilename} failed`);
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
                  `<link href="${bundlePublicPath}${fileName}" rel="stylesheet" media="all">`
              )
              .join("\n");
          })
          .join("\n");

        await fsPromises.writeFile(cssFilename, links);
      } catch (e) {
        console.error(e);
        throw new Error(`Writing cssFilename to ${cssFilename} failed`);
      }
    },
  };
}

export default generateHtmlFiles;
