import fs from "fs";
import path from "path";
import App from "../app";

export default class PluginManager {
    protected readonly app: App;

    public constructor(app: App) {
        this.app = app;
    }

    public async loadAll(): Promise<number> {
        let loaded: number = 0;

        if (fs.existsSync(this.app.options.pluginsPath)) {
            const pluginFolders: Set<string> = new Set();

            await new Promise((resolve) => {
                fs.readdir(this.app.options.pluginsPath, (error: Error, folders: string[]) => {
                    for (const folder in folders) {
                        pluginFolders.add(folder);
                    }

                    resolve();
                });
            });

            for (const pluginFolder of pluginFolders) {
                const entryPath: string = path.join(pluginFolder, "index.js");

                // Ensure entry file exists.
                if (fs.existsSync(entryPath)) {
                    // Require/load the plugin's entry file.
                    let plugin = require(entryPath);

                    // Support for ES5+ (default exports).
                    if (plugin.default !== undefined) {
                        plugin = plugin.default;
                    }

                    // TODO: Continue.
                }
            }
        }

        return loaded;
    }
}
