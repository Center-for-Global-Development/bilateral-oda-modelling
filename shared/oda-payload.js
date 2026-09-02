/* =============================================================================
   ODA payload client — fail-closed loading of the static scenario payload.

   Implements the binary contract stated in the payload manifest and in
   Visualisation files/SCOPE.md:
     - verify every axis hash before indexing; refuse to render on mismatch
     - verify each blob against sha256_raw of its INFLATED bytes
     - verify the cube support index before any cube read
     - a payload with no manifest is a refusal, not an error to paper over
     - absent cell == zero flow; NaN in tool/need_* == unavailable, never zero

   Exposes window.ODAPayload. No dependencies.
   ========================================================================== */
(() => {
  'use strict';

  /* The ONE place the release is named. web/data/README.md requires consumers to
     resolve the payload root from a single shared client constant, so a release
     bump is this line and nothing else. */
  const RELEASE = 'static-v2.2.9-swe-exit-scope';
  const DEFAULT_ROOT = `data/${RELEASE}/`;

  const SCHEMA_MAJOR = 1;

  class ODAPayloadError extends Error {
    constructor(message, detail) {
      super(message);
      this.name = 'ODAPayloadError';
      this.detail = detail || null;
    }
  }

  const toHex = buffer =>
    [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  async function sha256Hex(bytes) {
    if (!globalThis.crypto?.subtle) {
      throw new ODAPayloadError(
        'Web Crypto is unavailable, so payload integrity cannot be verified.',
        { cause: 'no-subtle-crypto' }
      );
    }
    return toHex(await crypto.subtle.digest('SHA-256', bytes));
  }

  /* Axis hash, matching build/emit_payload.py::axis_hash exactly:
     sha256 of the axis values joined by U+0000, encoded UTF-8. */
  async function axisHash(values) {
    const joined = values.map(v => String(v)).join('\u0000');
    return sha256Hex(new TextEncoder().encode(joined));
  }

  const DTYPES = {
    float32: Float32Array,
    float64: Float64Array,
    int32: Int32Array,
    uint8: Uint8Array,
    uint16: Uint16Array,
    uint32: Uint32Array,
    int8: Int8Array,
    int16: Int16Array
  };

  async function inflate(response) {
    if (typeof DecompressionStream === 'undefined') {
      throw new ODAPayloadError(
        'DecompressionStream is unavailable, so the payload cannot be read.',
        { cause: 'no-decompression-stream' }
      );
    }
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  async function fetchJson(url) {
    let response;
    try {
      response = await fetch(url, { cache: 'no-cache' });
    } catch (cause) {
      throw new ODAPayloadError(`Could not fetch ${url}.`, { cause: String(cause) });
    }
    if (!response.ok) {
      throw new ODAPayloadError(`${url} returned HTTP ${response.status}.`,
        { status: response.status });
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new ODAPayloadError(`${url} is not valid JSON.`, { cause: String(cause) });
    }
  }

  /* ---------------------------------------------------------------- the client */

  class Payload {
    constructor(root, manifest) {
      this.root = root;
      this.manifest = manifest;
      this.axes = {};
      for (const [name, axis] of Object.entries(manifest.axes)) {
        this.axes[name] = axis.values;
      }
      this._index = {};
      for (const [name, values] of Object.entries(this.axes)) {
        const map = new Map();
        values.forEach((value, i) => map.set(String(value), i));
        this._index[name] = map;
      }
      this._blobs = new Map();      // name -> typed array (verified)
      this._pending = new Map();    // name -> in-flight promise
      this._supportVerified = { cube: false, cube2024: false };
    }

    /* --- axis helpers ------------------------------------------------------ */

    /** Index of a value on an axis. Throws rather than returning -1, because a
     *  silent -1 becomes a wrong cell read. */
    indexOf(axis, value) {
      const map = this._index[axis];
      if (!map) throw new ODAPayloadError(`Unknown axis "${axis}".`);
      const i = map.get(String(value));
      if (i === undefined) {
        throw new ODAPayloadError(`"${value}" is not on the ${axis} axis.`);
      }
      return i;
    }

    has(axis, value) {
      return Boolean(this._index[axis]?.has(String(value)));
    }

    get scenarios() { return this.manifest.scenarios.slice(); }
    get release() { return this.manifest.model_build; }

    /* --- metadata ---------------------------------------------------------- */

    get donorMeta() { return this.manifest.donor_meta || {}; }
    get sectorMeta() { return this.manifest.sector_meta || {}; }
    get recipientMeta() { return this.manifest.recipient_meta || {}; }
    get geometryKey() { return this.manifest.recipient_geometry_key || {}; }

    donorName(code) { return this.donorMeta[code]?.name ?? String(code); }
    recipientName(iso) { return this.recipientMeta[iso]?.name ?? String(iso); }
    sectorName(code) { return this.sectorMeta[String(code)] ?? String(code); }

    /* --- blobs ------------------------------------------------------------- */

    entry(name) {
      const entry = this.manifest.blobs[name];
      if (!entry) throw new ODAPayloadError(`No blob named "${name}" in the manifest.`);
      return entry;
    }

    /** Load, inflate and verify one blob. Cached. Concurrent callers share one
     *  in-flight request. */
    async blob(name) {
      if (this._blobs.has(name)) return this._blobs.get(name);
      if (this._pending.has(name)) return this._pending.get(name);

      const entry = this.entry(name);
      const promise = (async () => {
        const url = this.root + entry.file;
        let response;
        try {
          response = await fetch(url, { cache: 'no-cache' });
        } catch (cause) {
          throw new ODAPayloadError(`Could not fetch ${entry.file}.`, { cause: String(cause) });
        }
        if (!response.ok) {
          throw new ODAPayloadError(`${entry.file} returned HTTP ${response.status}.`,
            { status: response.status });
        }

        const raw = await inflate(response);

        if (raw.byteLength !== entry.raw_bytes) {
          throw new ODAPayloadError(
            `${name} is ${raw.byteLength} bytes; the manifest declares ${entry.raw_bytes}.`,
            { blob: name });
        }
        const digest = await sha256Hex(raw);
        if (digest !== entry.sha256_raw) {
          throw new ODAPayloadError(
            `${name} failed its integrity check; the payload may be corrupt or stale.`,
            { blob: name, expected: entry.sha256_raw, actual: digest });
        }

        const Ctor = DTYPES[entry.dtype];
        if (!Ctor) throw new ODAPayloadError(`${name} has unsupported dtype "${entry.dtype}".`);
        const array = new Ctor(raw);
        if (array.length !== entry.count) {
          throw new ODAPayloadError(
            `${name} holds ${array.length} elements; the manifest declares ${entry.count}.`,
            { blob: name });
        }

        this._blobs.set(name, array);
        this._pending.delete(name);
        return array;
      })();

      this._pending.set(name, promise);
      promise.catch(() => this._pending.delete(name));
      return promise;
    }

    /** Load several blobs together. */
    async blobs(names) {
      const arrays = await Promise.all(names.map(n => this.blob(n)));
      return Object.fromEntries(names.map((n, i) => [n, arrays[i]]));
    }

    /** Row-major read from a blob whose dims are known from the manifest.
     *  coords is an object keyed by dim name, e.g. {recipient:'KEN', year:2028}.
     *  Values are axis values, not indices. */
    at(name, coords) {
      const array = this._blobs.get(name);
      if (!array) throw new ODAPayloadError(`${name} has not been loaded yet.`);
      const { dims, shape } = this.entry(name);
      let offset = 0;
      for (let d = 0; d < dims.length; d += 1) {
        const dim = dims[d];
        const raw = coords[dim];
        if (raw === undefined) {
          throw new ODAPayloadError(`${name} needs a "${dim}" coordinate.`);
        }
        const i = typeof raw === 'number' && !this._index[dim] ? raw : this.indexOf(dim, raw);
        if (i < 0 || i >= shape[d]) {
          throw new ODAPayloadError(`${dim} index ${i} is outside ${name}.`);
        }
        offset = offset * shape[d] + i;
      }
      return array[offset];
    }

    /* --- the sparse cube --------------------------------------------------- */

    /** Verify a cube support index against its declared support_sha256 before any
     *  cube value is read. A float array gives no sign of a misalignment, so this
     *  is the only thing standing between a bug and a plausible wrong number. */
    async verifySupport(which = 'cube') {
      if (this._supportVerified[which]) return true;
      const spec = this.manifest[which];
      if (!spec) throw new ODAPayloadError(`The manifest has no "${which}" section.`);

      const axes = which === 'cube'
        ? ['donor', 'recipient', 'sector', 'year']
        : ['donor', 'recipient', 'sector'];
      const prefix = which === 'cube' ? 'cube/support__' : 'cube/support2024__';

      const arrays = [];
      for (const axis of axes) arrays.push(await this.blob(`${prefix}${axis}_index`));

      const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
      const joined = new Uint8Array(total);
      let at = 0;
      for (const a of arrays) {
        joined.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), at);
        at += a.byteLength;
      }
      const digest = await sha256Hex(joined);
      if (digest !== spec.support_sha256) {
        throw new ODAPayloadError(
          `The ${which} support index failed its integrity check; cube reads are unsafe.`,
          { expected: spec.support_sha256, actual: digest });
      }
      this._supportVerified[which] = true;
      return true;
    }
  }

  /* ---------------------------------------------------------------- loading */

  /**
   * Load and verify the payload. Resolves to a Payload, or rejects with an
   * ODAPayloadError. There is no partial success: a caller that gets a Payload
   * may index it, and a caller that does not must render a fail state.
   *
   * @param {object} [options]
   * @param {string} [options.root]  payload root, default `data/<RELEASE>/`
   * @param {string[]} [options.axes] axes to verify; default all in the manifest
   */
  async function load(options = {}) {
    const root = options.root || DEFAULT_ROOT;

    /* An interrupted promotion leaves a payload directory with no manifest, by
       design (SCOPE.md F07). fetchJson turns that into a refusal. */
    const manifest = await fetchJson(root + 'manifest.json');

    for (const key of ['schema_version', 'axes', 'blobs', 'scenarios']) {
      if (!(key in manifest)) {
        throw new ODAPayloadError(`The manifest is missing "${key}".`);
      }
    }
    const major = Number(String(manifest.schema_version).split('.')[0]);
    if (major !== SCHEMA_MAJOR) {
      throw new ODAPayloadError(
        `This client speaks payload schema ${SCHEMA_MAJOR}.x; the payload declares ` +
        `${manifest.schema_version}.`, { schema: manifest.schema_version });
    }

    const wanted = options.axes || Object.keys(manifest.axes);
    for (const name of wanted) {
      const axis = manifest.axes[name];
      if (!axis) throw new ODAPayloadError(`The manifest has no "${name}" axis.`);
      if (axis.values.length !== axis.length) {
        throw new ODAPayloadError(
          `Axis "${name}" lists ${axis.values.length} values but declares length ${axis.length}.`);
      }
      const digest = await axisHash(axis.values);
      if (digest !== axis.sha256) {
        throw new ODAPayloadError(
          `Axis "${name}" failed its hash check. Refusing to index rather than guess.`,
          { axis: name, expected: axis.sha256, actual: digest });
      }
    }

    return new Payload(root, manifest);
  }

  /* ---------------------------------------------------------------- fail state */

  /**
   * Render a visible, non-misleading failure into a container. Used whenever
   * load() or blob() rejects: an empty chart would imply "no data", which is a
   * different and wrong claim.
   */
  function renderFailState(container, error, options = {}) {
    const node = typeof container === 'string'
      ? document.querySelector(container) : container;
    if (!node) return;
    node.replaceChildren();

    const box = document.createElement('div');
    box.className = 'oda-failstate';
    box.setAttribute('role', 'alert');

    const heading = document.createElement('p');
    heading.className = 'oda-failstate__title';
    heading.textContent = options.title || 'This figure could not load its data.';

    const detail = document.createElement('p');
    detail.className = 'oda-failstate__detail';
    detail.textContent = error instanceof Error ? error.message : String(error);

    const help = document.createElement('p');
    help.className = 'oda-failstate__detail';
    help.textContent = 'The figure refuses to draw rather than show numbers it ' +
      'cannot verify. Please report this with the message above.';

    box.append(heading, detail, help);
    node.append(box);

    if (error && error.detail) console.error('[ODAPayload]', error.message, error.detail);
    else console.error('[ODAPayload]', error);
  }

  window.ODAPayload = { RELEASE, DEFAULT_ROOT, load, renderFailState, ODAPayloadError, axisHash };
})();
