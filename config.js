const promisify = require('promisify-node');
const fs = promisify('fs');
const hjson = require('hjson');
const log = require('logger');
const deep = require('deep-get-set');
const extend = require('extend');

const CONFIGWRITEOPTIONS = {
    quotes: 'strings',
    space: 4, // can also use \t for tabs
    bracesSameLine: true,
};

/**
 * Module used to read, write and validate hjson configs
 * Usage: new Config('./path-to-file.hjson')
 */
module.exports = class Config
{
    constructor(path) {
        this.cache = false
        this.path = path
    }

    /**
     * Asynchronously get the config with Comments (as __COMMENTS__) and return it
     *
     * @param {boolean} [freshcopy=false]
     * @returns {}
     */
    async get(freshcopy = false) {
        if (this.cache && !freshcopy) {
            log.verbose(`config ${this.path} loaded from cache`, { topic: 'Config' });
            return this.cache;
        }

        // Only retrieve a new config, when there is nothing cached or freshcopy force flag is set
        const file = await fs.readFile(this.path);
        this.cache = hjson.rt.parse(file.toString());
        log.verbose(`Config ${this.path} loaded`, { topic: 'Config' });
        return this.cache;
    }

    /**
     * Overwrite existing config JSON with new object
     * If the config file is first obtained via `get`, the comments will be preserved
     * If you want to extend the previous object, use `get`,
     * change the returned object and use it with `set`
     *
     * @param {any} config
     * @param {any} [options={}]
     */
    async set(config, options = {}) {
        const json = hjson.rt.stringify(config, Object.assign(options, CONFIGWRITEOPTIONS));
        // this.cache = JSON.parse(json);
        return fs.writeFile(this.path, json);
    }


    /**
     * Set a property based on jq-like paths. e.g. (.IT.IPAddress)
     *
     * @param {string} field
     * @param {string} value
     * @returns
     */
    async setProperty(field, value) {
        if (!field) return false;
        // Since JQ only allows setting specific properties via e.g. .Host.Name,
        // We should also support this here and trim it for use with deep-get-set.
        // TODO: implement node implementation of JQ: https://www.npmjs.com/package/node-jq
        field = field.indexOf('.') == 0 ? field.substring(1) : field;
        let config = await this.get();
        deep(config, field, value);
        this.set(config);
    }


    /**
     * By using extend, we are merging the new config on top of the old config.
     * No properties will be lost, but new ones added and equal ones overwritten
     *
     * @param {Config} newConfig
     * @param {boolean} [mergeOldOnTop=false]
     * @returns true|false
     */
    async merge(newConfig, mergeOldOnTop = false) {
        if (!newConfig instanceof Config) {
            return false;
        }
        const [oldConfigJson, newConfigJson] = await Promise.all(
            [
                this.get(true),
                newConfig.get(true)
            ]
        );
        let mergeOrder = mergeOldOnTop ?
            [newConfigJson, oldConfigJson] :
            [oldConfigJson, newConfigJson];
        await this.set(extend(true, ...mergeOrder));
        return true;
    }

    /**
     * validate based on Validator object
     *
     * @param {ObjectValidator} validator
     * @returns array
     */
    validate(validator) {
        validator.setConfig(this.cache);
        return validator.validate().getErrors();
    }

    /**
     *
     *
     * @param {function} callback
     */
    watch(callback) {
        let currentFile = ''
        fs.watchFile(
            this.path,
            {interval: 1000},
            async (cur, prev) => {
                let config = await this.get(true);
                if (config == currentFile) return;
                callback(config);
            }
        );
    }
}