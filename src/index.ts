import axios, { AxiosInstance } from 'axios'
import * as FormData from 'form-data'
import { Agent } from 'https'

interface Response {
  success: boolean
  data: any
  error: string | undefined
}

/**
 * Base VyOS API.
 * 
 * Access subclasses via the different available properties.
 * 
 * See the HTTP API [docs](https://docs.vyos.io/en/latest/configuration/service/https.html) for information on enabling the API and provisioning keys.
 */
export class Vyos {
  #client: AxiosInstance

  /**
   * Creates a new VyOS API client with the given URL and API key.
   */
  constructor(url: string, key: string) {
    this.#client = axios.create({
      baseURL: new URL(url).href,
      httpsAgent: new Agent({ rejectUnauthorized: false }),
      transformRequest: [(data, headers) => {
        const form = new FormData()
        form.append('key', key)
        form.append('data', JSON.stringify(data))
        Object.entries(form.getHeaders()).forEach(([k, v]) => headers[k] = v)

        return form
      }]
    })
  }

  /**
   * @internal
   * Sends a raw request to the VyOS API.
   * This is the base upon which all other functions are implemented.
   * 
   * See the VyOS API [docs](https://docs.vyos.io/en/latest/configuration/service/https.html) 
   * for more information on the available API calls and their behavior.
   * 
   * ```typescript
   * await client.request('configure', {
   *   op: 'set',
   *   path: ['system', 'host-name'],
   *   value: 'my-vyos'
   * })
   * // { success: true, data: null, error: null }
   * ```
   * 
   * @param endpoint API endpoint to POST the payload to, appended to the end of the URL.
   * @param payload Request payload object.
   * @returns Returns the raw JSON response from the API.
   */
  async request(endpoint: string, payload: any): Promise<Response> {
    try {
      const body = (await this.#client.post(endpoint, payload)).data
      if (body.success === false && body.error) throw body.error

      return body
    } catch (err) {
      const body = err?.response?.data
      if (body?.success === false && body?.error) throw body.error

      throw err
    }
  }

  /**
   * Access the configuration related methods.
   * 
   * ```typescript
   * await client.config.get('system host-name')
   * // ...
   * await client.config.set('system host-name', 'my-vyos')
   * await client.config.save()
   * ```
   */
  get config() {
    return new VyosConfig(this)
  }

  get images() {
    return new VyosImages(this)
  }

  /**
   * Access the Operational Mode related methods.
   * 
   * See the Operational Mode [docs](https://docs.vyos.io/en/latest/cli.html) for available commands.
   */
  get ops() {
    return new VyosOps(this)
  }
}


/**
 * VyOS configuration API.
 * 
 * See the [Configuration Overview](https://docs.vyos.io/en/latest/cli.html#configuration-overview) for more info.
 */
export class VyosConfig {
  #vyos: Vyos

  /** 
   * @internal 
   * Creates an instance of the subclass from a parent [[Vyos]]
   */
  constructor(vyos: Vyos) {
    this.#vyos = vyos
  }

  /**
   * Updates the configuration at `path` and commits.
   * 
   * ```typescript
   * await client.config.set('system host-name', 'my-vyos')
   * ```
   * @param path Space delimited configuration path.
   */
  async set(path: string, value: string) {
    return await this.#vyos.request('configure', {
      op: 'set',
      path: path.split(' '),
      value,
    })
  }

  /**
   * Deletes the configuration at `path` and commits.
   * 
   * ```typescript
   * await client.config.delete('system host-name')
   * ```
   * 
   * @param path Space delimited configuration path.
   */
  async delete(path: string) {
    await this.#vyos.request('configure', {
      op: 'delete',
      path: path.split(' '),
    })
  }

  /**
   * Returns the configuration object or value at `path`.
   * 
   * ```typescript
   * await client.config.show('system host-name')
   * // 'my-vyos'
   * 
   * await client.config.show('system')
   * // { host-name: 'my-vyos', ... }
   * ```
   * 
   * @param path Space delimited configuration path.
   */
  async show(path: string) {
    const components = path.split(' ')
    const [terminal] = components.slice(-1)

    const { data } = await this.#vyos.request('retrieve', {
      op: 'showConfig',
      path: components,
    })

    return terminal in data ? data[terminal] : data
  }

  /**
   * Updates the comment for the configuration at `path` to `value`.
   * 
   * ```typescript
   * await client.config.comment('system host-name', "It's the host name!")
   * 
   * // Pass an empty string to remove the comment.
   * await client.config.comment('system host-name', '')
   * ```
   * 
   * @param path Space delimited configuration path.
   */
  async comment(path: string, value: string) {
    await this.#vyos.request('configure', {
      op: 'comment',
      path: path.split(' '),
      value,
    })
  }

  /**
   * Stores the current configuration to `file`.
   * 
   * Defaults to the system default configuration file, `/config/config.boot`.
   * 
   * ```typescript
   * await client.config.set('system host-name', 'my-vyos')
   * await client.config.save()
   * 
   * // Or, use a different file:
   * await client.config.save('/config/my-config.boot')
   * ```
   * 
   * @param file Configuration file path.
   */
  async save(file: string = '/config/config.boot') {
    await this.#vyos.request('config-file', {
      op: 'save',
      value: file,
    })
  }

  /**
   * Loads the configuration from `file`.
   * 
   * Defaults to the system default configuration file, `/config/config.boot`.
   * 
   * ```typescript
   * await client.config.load()
   * 
   * // Or, use a different file:
   * await client.config.load('/config/my-config.boot')
   * ```
   * 
   * @param file Configuration file path.
   */
  async load(file: string = '/config/config.boot') {
    await this.#vyos.request('config-file', {
      op: 'load',
      value: file,
    })
  }
}


/**
 * VyOS image management API.
 * 
 * See [Image Management](https://docs.vyos.io/en/latest/installation/image.html#image-management) for more info.
 */
export class VyosImages {
  #vyos: Vyos

  /** 
   * @internal 
   * Creates an instance of the subclass from a parent [[Vyos]]
   */
  constructor(vyos: Vyos) {
    this.#vyos = vyos
  }

  /**
   * Adds a new OS image from `url`.
   * 
   * ```typescript
   * await client.images.add('https://downloads.vyos.io/rolling/current/amd64/vyos-1.4-rolling-202101301326-amd64.iso')
   * ```
   * 
   * @param url VyOS image URL.
   */
  async add(url: string) {
    await this.#vyos.request('image', {
      op: 'add',
      url,
    })
  }

  /**
   * Removes the OS image `name`.
   * 
   * ```typescript
   * await client.images.remove('1.4-rolling-202101301326')
   * ```
   * 
   * @param url VyOS image name.
   */
  async remove(name: string) {
    await this.#vyos.request('image', {
      op: 'delete',
      name,
    })
  }
}


/**
 * VyOS operational mode API.
 * 
 * See [Operational Mode](https://docs.vyos.io/en/latest/cli.html#operational-mode) for more info.
 */
export class VyosOps {
  #vyos: Vyos

  /** 
   * @internal 
   * Creates an instance of the subclass from a parent [[Vyos]]
   */
  constructor(vyos: Vyos) {
    this.#vyos = vyos
  }

  /**
   * Runs the `show` command specified by `path`.
   * 
   * 
   * ```typescript
   * await client.ops.show('date')
   * // 'Mon 15 Feb 2021 10:54:54 PM EST\n'
   * ```
   * 
   * @param path Space-delimited show command path. 
   */
  async show(path: string) {
    return (await this.#vyos.request('show', {
      op: 'show',
      path: path.split(' '),
    })).data
  }

  /**
   * Runs the `generate` command specified by `path`.
   * 
   * See the Operational Mode [docs](https://docs.vyos.io/en/latest/cli.html) for a list of available `generate` commands.
   * 
   * ```typescript
   * await client.ops.generate('wireguard default-keypair')
   * ```
   * 
   * @param path Space-delimited generate command path. 
   */
  async generate(path: string) {
    return await this.#vyos.request('generate', {
      op: 'generate',
      path: path.split(' '),
    })
  }
}