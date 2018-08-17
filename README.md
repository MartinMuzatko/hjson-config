# hjson-config
A file read/write/watch/setProperty wrapper around hjson.

Uses promises.

![](https://img.shields.io/bundlephobia/min/hjson-config.svg)

## API

### Construct
```js
const Config = require('hjson-config')

const config = new Config('./my-file.hjson')
```

### Get

```js

await config.get
```