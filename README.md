# hjson-config
A file read/write/watch/setProperty wrapper around hjson.

Uses promises. Persists comments

![](https://img.shields.io/bundlephobia/min/hjson-config.svg?style=for-the-badge)
![](https://img.shields.io/npm/dt/hjson-config.svg?style=for-the-badge)

## Install

``` bash
npm install hjson-config
```

## Usage

### constructor

```js
const Config = require('hjson-config')

const serverConfig = new Config('./serverconfig.hjson')
```

### get

```js
let servers = await serverConfig.get()
```

### set

```js
servers.ip = '192.168.0.1'
await serverConfig.set(servers)
```

### setProperty

```js
await serverConfig.setProperty('.ip', '192.168.0.1)
```


### watch

```js
serverConfig.watch(newConfig => {
    
})
```