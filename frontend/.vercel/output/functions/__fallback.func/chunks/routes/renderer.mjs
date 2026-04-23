import { w as withLeadingSlash, v as vueExports, g as getDefaultExportFromNamespaceIfNotNamed, V as Vue$1, c as compilerDom_cjs_prod, s as shared_cjs_prod, a as appRootTag, b as appRootAttrs, u as useRuntimeConfig, d as buildAssetsURL, e as getResponseStatusText, f as getResponseStatus, h as stringify, i as uneval, j as appId, k as defineRenderHandler, p as publicAssetsURL, l as appTeleportTag, m as getQuery, n as createError, o as appHead, q as getRouteRules, r as joinURL, t as appTeleportAttrs, x as useNitroApp } from '../nitro/nitro.mjs';
import * as node_stream from 'node:stream';

function createRendererContext({ manifest, precomputed, buildAssetsURL }) {
  if (!manifest && !precomputed) {
    throw new Error("Either manifest or precomputed data must be provided");
  }
  const ctx = {
    // Options
    buildAssetsURL: buildAssetsURL || withLeadingSlash,
    manifest,
    precomputed,
    updateManifest,
    // Internal cache
    _dependencies: {},
    _dependencySets: {},
    _entrypoints: []
  };
  function updateManifest(manifest2) {
    const manifestEntries = Object.entries(manifest2);
    ctx.manifest = manifest2;
    ctx._dependencies = {};
    ctx._dependencySets = {};
    ctx._entrypoints = manifestEntries.filter((e) => e[1].isEntry).map(([module]) => module);
  }
  if (precomputed) {
    ctx._dependencies = precomputed.dependencies;
    ctx._entrypoints = precomputed.entrypoints;
  } else if (manifest) {
    updateManifest(manifest);
  }
  return ctx;
}
function getModuleDependencies(id, rendererContext) {
  if (rendererContext._dependencies[id]) {
    return rendererContext._dependencies[id];
  }
  const dependencies = rendererContext._dependencies[id] = {
    scripts: {},
    styles: {},
    preload: {},
    prefetch: {}
  };
  if (!rendererContext.manifest) {
    return dependencies;
  }
  const meta = rendererContext.manifest[id];
  if (!meta) {
    return dependencies;
  }
  if (meta.file) {
    dependencies.preload[id] = meta;
    if (meta.isEntry || meta.sideEffects) {
      dependencies.scripts[id] = meta;
    }
  }
  for (const css of meta.css || []) {
    dependencies.styles[css] = dependencies.preload[css] = dependencies.prefetch[css] = rendererContext.manifest[css];
  }
  for (const asset of meta.assets || []) {
    dependencies.preload[asset] = dependencies.prefetch[asset] = rendererContext.manifest[asset];
  }
  for (const depId of meta.imports || []) {
    const depDeps = getModuleDependencies(depId, rendererContext);
    for (const key in depDeps.styles) {
      dependencies.styles[key] = depDeps.styles[key];
    }
    for (const key in depDeps.preload) {
      dependencies.preload[key] = depDeps.preload[key];
    }
    for (const key in depDeps.prefetch) {
      dependencies.prefetch[key] = depDeps.prefetch[key];
    }
  }
  const filteredPreload = {};
  for (const id2 in dependencies.preload) {
    const dep = dependencies.preload[id2];
    if (dep.preload) {
      filteredPreload[id2] = dep;
    }
  }
  dependencies.preload = filteredPreload;
  return dependencies;
}
function getAllDependencies(ids, rendererContext) {
  let cacheKey = "";
  const sortedIds = [...ids].sort();
  for (let i = 0; i < sortedIds.length; i++) {
    if (i > 0) cacheKey += ",";
    cacheKey += sortedIds[i];
  }
  if (rendererContext._dependencySets[cacheKey]) {
    return rendererContext._dependencySets[cacheKey];
  }
  const allDeps = {
    scripts: {},
    styles: {},
    preload: {},
    prefetch: {}
  };
  for (const id of ids) {
    const deps = getModuleDependencies(id, rendererContext);
    for (const key in deps.scripts) {
      allDeps.scripts[key] = deps.scripts[key];
    }
    for (const key in deps.styles) {
      allDeps.styles[key] = deps.styles[key];
    }
    for (const key in deps.preload) {
      allDeps.preload[key] = deps.preload[key];
    }
    for (const key in deps.prefetch) {
      allDeps.prefetch[key] = deps.prefetch[key];
    }
    for (const dynamicDepId of rendererContext.manifest?.[id]?.dynamicImports || []) {
      const dynamicDeps = getModuleDependencies(dynamicDepId, rendererContext);
      for (const key in dynamicDeps.scripts) {
        allDeps.prefetch[key] = dynamicDeps.scripts[key];
      }
      for (const key in dynamicDeps.styles) {
        allDeps.prefetch[key] = dynamicDeps.styles[key];
      }
      for (const key in dynamicDeps.preload) {
        allDeps.prefetch[key] = dynamicDeps.preload[key];
      }
    }
  }
  const filteredPrefetch = {};
  for (const id in allDeps.prefetch) {
    const dep = allDeps.prefetch[id];
    if (dep.prefetch) {
      filteredPrefetch[id] = dep;
    }
  }
  allDeps.prefetch = filteredPrefetch;
  for (const id in allDeps.preload) {
    delete allDeps.prefetch[id];
  }
  for (const style in allDeps.styles) {
    delete allDeps.preload[style];
    delete allDeps.prefetch[style];
  }
  rendererContext._dependencySets[cacheKey] = allDeps;
  return allDeps;
}
function getRequestDependencies(ssrContext, rendererContext) {
  if (ssrContext._requestDependencies) {
    return ssrContext._requestDependencies;
  }
  const ids = new Set(Array.from([
    ...rendererContext._entrypoints,
    ...ssrContext.modules || ssrContext._registeredComponents || []
  ]));
  const deps = getAllDependencies(ids, rendererContext);
  ssrContext._requestDependencies = deps;
  return deps;
}
function renderStyles(ssrContext, rendererContext) {
  const { styles } = getRequestDependencies(ssrContext, rendererContext);
  let result = "";
  for (const key in styles) {
    const resource = styles[key];
    result += `<link rel="stylesheet" href="${rendererContext.buildAssetsURL(resource.file)}" crossorigin>`;
  }
  return result;
}
function renderResourceHints(ssrContext, rendererContext) {
  const { preload, prefetch } = getRequestDependencies(ssrContext, rendererContext);
  let result = "";
  for (const key in preload) {
    const resource = preload[key];
    const href = rendererContext.buildAssetsURL(resource.file);
    const rel = resource.module ? "modulepreload" : "preload";
    const crossorigin = resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? " crossorigin" : "";
    if (resource.resourceType && resource.mimeType) {
      result += `<link rel="${rel}" as="${resource.resourceType}" type="${resource.mimeType}"${crossorigin} href="${href}">`;
    } else if (resource.resourceType) {
      result += `<link rel="${rel}" as="${resource.resourceType}"${crossorigin} href="${href}">`;
    } else {
      result += `<link rel="${rel}"${crossorigin} href="${href}">`;
    }
  }
  for (const key in prefetch) {
    const resource = prefetch[key];
    const href = rendererContext.buildAssetsURL(resource.file);
    const crossorigin = resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? " crossorigin" : "";
    if (resource.resourceType && resource.mimeType) {
      result += `<link rel="prefetch" as="${resource.resourceType}" type="${resource.mimeType}"${crossorigin} href="${href}">`;
    } else if (resource.resourceType) {
      result += `<link rel="prefetch" as="${resource.resourceType}"${crossorigin} href="${href}">`;
    } else {
      result += `<link rel="prefetch"${crossorigin} href="${href}">`;
    }
  }
  return result;
}
function renderResourceHeaders(ssrContext, rendererContext) {
  const { preload, prefetch } = getRequestDependencies(ssrContext, rendererContext);
  const links = [];
  for (const key in preload) {
    const resource = preload[key];
    const href = rendererContext.buildAssetsURL(resource.file);
    const rel = resource.module ? "modulepreload" : "preload";
    let header = `<${href}>; rel="${rel}"`;
    if (resource.resourceType) {
      header += `; as="${resource.resourceType}"`;
    }
    if (resource.mimeType) {
      header += `; type="${resource.mimeType}"`;
    }
    if (resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module) {
      header += "; crossorigin";
    }
    links.push(header);
  }
  for (const key in prefetch) {
    const resource = prefetch[key];
    const href = rendererContext.buildAssetsURL(resource.file);
    let header = `<${href}>; rel="prefetch"`;
    if (resource.resourceType) {
      header += `; as="${resource.resourceType}"`;
    }
    if (resource.mimeType) {
      header += `; type="${resource.mimeType}"`;
    }
    if (resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module) {
      header += "; crossorigin";
    }
    links.push(header);
  }
  return {
    link: links.join(", ")
  };
}
function getPreloadLinks(ssrContext, rendererContext) {
  const { preload } = getRequestDependencies(ssrContext, rendererContext);
  const result = [];
  for (const key in preload) {
    const resource = preload[key];
    result.push({
      rel: resource.module ? "modulepreload" : "preload",
      as: resource.resourceType,
      type: resource.mimeType ?? null,
      crossorigin: resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? "" : null,
      href: rendererContext.buildAssetsURL(resource.file)
    });
  }
  return result;
}
function getPrefetchLinks(ssrContext, rendererContext) {
  const { prefetch } = getRequestDependencies(ssrContext, rendererContext);
  const result = [];
  for (const key in prefetch) {
    const resource = prefetch[key];
    result.push({
      rel: "prefetch",
      as: resource.resourceType,
      type: resource.mimeType ?? null,
      crossorigin: resource.resourceType === "style" || resource.resourceType === "font" || resource.resourceType === "script" || resource.module ? "" : null,
      href: rendererContext.buildAssetsURL(resource.file)
    });
  }
  return result;
}
function renderScripts(ssrContext, rendererContext) {
  const { scripts } = getRequestDependencies(ssrContext, rendererContext);
  let result = "";
  for (const key in scripts) {
    const resource = scripts[key];
    if (resource.module) {
      result += `<script type="module" src="${rendererContext.buildAssetsURL(resource.file)}" crossorigin><\/script>`;
    } else {
      result += `<script src="${rendererContext.buildAssetsURL(resource.file)}" defer crossorigin><\/script>`;
    }
  }
  return result;
}
function createRenderer(createApp, renderOptions) {
  const rendererContext = createRendererContext(renderOptions);
  return {
    rendererContext,
    async renderToString(ssrContext) {
      ssrContext._registeredComponents = ssrContext._registeredComponents || /* @__PURE__ */ new Set();
      const _createApp = await Promise.resolve(createApp).then((r) => "default" in r ? r.default : r);
      const app = await _createApp(ssrContext);
      const html = await renderOptions.renderToString(app, ssrContext);
      const wrap = (fn) => () => fn(ssrContext, rendererContext);
      return {
        html,
        renderResourceHeaders: wrap(renderResourceHeaders),
        renderResourceHints: wrap(renderResourceHints),
        renderStyles: wrap(renderStyles),
        renderScripts: wrap(renderScripts)
      };
    }
  };
}

function flatHooks(configHooks, hooks = {}, parentName) {
	for (const key in configHooks) {
		const subHook = configHooks[key];
		const name = parentName ? `${parentName}:${key}` : key;
		if (typeof subHook === "object" && subHook !== null) flatHooks(subHook, hooks, name);
		else if (typeof subHook === "function") hooks[name] = subHook;
	}
	return hooks;
}
const createTask = /* @__PURE__ */ (() => {
	if (console.createTask) return console.createTask;
	const defaultTask = { run: (fn) => fn() };
	return () => defaultTask;
})();
function callHooks(hooks, args, startIndex, task) {
	for (let i = startIndex; i < hooks.length; i += 1) try {
		const result = task ? task.run(() => hooks[i](...args)) : hooks[i](...args);
		if (result && typeof result.then === "function") return Promise.resolve(result).then(() => callHooks(hooks, args, i + 1, task));
	} catch (error) {
		return Promise.reject(error);
	}
}
function serialTaskCaller(hooks, args, name) {
	if (hooks.length > 0) return callHooks(hooks, args, 0, createTask(name));
}
function parallelTaskCaller(hooks, args, name) {
	if (hooks.length > 0) {
		const task = createTask(name);
		return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
	}
}
function callEachWith(callbacks, arg0) {
	for (const callback of [...callbacks]) callback(arg0);
}
var Hookable = class {
	_hooks;
	_before;
	_after;
	_deprecatedHooks;
	_deprecatedMessages;
	constructor() {
		this._hooks = {};
		this._before = void 0;
		this._after = void 0;
		this._deprecatedMessages = void 0;
		this._deprecatedHooks = {};
		this.hook = this.hook.bind(this);
		this.callHook = this.callHook.bind(this);
		this.callHookWith = this.callHookWith.bind(this);
	}
	hook(name, function_, options = {}) {
		if (!name || typeof function_ !== "function") return () => {};
		const originalName = name;
		let dep;
		while (this._deprecatedHooks[name]) {
			dep = this._deprecatedHooks[name];
			name = dep.to;
		}
		if (dep && !options.allowDeprecated) {
			let message = dep.message;
			if (!message) message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
			if (!this._deprecatedMessages) this._deprecatedMessages = /* @__PURE__ */ new Set();
			if (!this._deprecatedMessages.has(message)) {
				console.warn(message);
				this._deprecatedMessages.add(message);
			}
		}
		if (!function_.name) try {
			Object.defineProperty(function_, "name", {
				get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
				configurable: true
			});
		} catch {}
		this._hooks[name] = this._hooks[name] || [];
		this._hooks[name].push(function_);
		return () => {
			if (function_) {
				this.removeHook(name, function_);
				function_ = void 0;
			}
		};
	}
	hookOnce(name, function_) {
		let _unreg;
		let _function = (...arguments_) => {
			if (typeof _unreg === "function") _unreg();
			_unreg = void 0;
			_function = void 0;
			return function_(...arguments_);
		};
		_unreg = this.hook(name, _function);
		return _unreg;
	}
	removeHook(name, function_) {
		const hooks = this._hooks[name];
		if (hooks) {
			const index = hooks.indexOf(function_);
			if (index !== -1) hooks.splice(index, 1);
			if (hooks.length === 0) this._hooks[name] = void 0;
		}
	}
	clearHook(name) {
		this._hooks[name] = void 0;
	}
	deprecateHook(name, deprecated) {
		this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
		const _hooks = this._hooks[name] || [];
		this._hooks[name] = void 0;
		for (const hook of _hooks) this.hook(name, hook);
	}
	deprecateHooks(deprecatedHooks) {
		for (const name in deprecatedHooks) this.deprecateHook(name, deprecatedHooks[name]);
	}
	addHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
		return () => {
			for (const unreg of removeFns) unreg();
			removeFns.length = 0;
		};
	}
	removeHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		for (const key in hooks) this.removeHook(key, hooks[key]);
	}
	removeAllHooks() {
		this._hooks = {};
	}
	callHook(name, ...args) {
		return this.callHookWith(serialTaskCaller, name, args);
	}
	callHookParallel(name, ...args) {
		return this.callHookWith(parallelTaskCaller, name, args);
	}
	callHookWith(caller, name, args) {
		const event = this._before || this._after ? {
			name,
			args,
			context: {}
		} : void 0;
		if (this._before) callEachWith(this._before, event);
		const result = caller(this._hooks[name] ? [...this._hooks[name]] : [], args, name);
		if (result instanceof Promise) return result.finally(() => {
			if (this._after && event) callEachWith(this._after, event);
		});
		if (this._after && event) callEachWith(this._after, event);
		return result;
	}
	beforeEach(function_) {
		this._before = this._before || [];
		this._before.push(function_);
		return () => {
			if (this._before !== void 0) {
				const index = this._before.indexOf(function_);
				if (index !== -1) this._before.splice(index, 1);
			}
		};
	}
	afterEach(function_) {
		this._after = this._after || [];
		this._after.push(function_);
		return () => {
			if (this._after !== void 0) {
				const index = this._after.indexOf(function_);
				if (index !== -1) this._after.splice(index, 1);
			}
		};
	}
};
function createHooks() {
	return new Hookable();
}

const SelfClosingTags = /* @__PURE__ */ new Set(["meta", "link", "base"]);
const DupeableTags = /* @__PURE__ */ new Set(["link", "style", "script", "noscript"]);
const TagsWithInnerContent = /* @__PURE__ */ new Set(["title", "titleTemplate", "script", "style", "noscript"]);
const HasElementTags = /* @__PURE__ */ new Set([
  "base",
  "meta",
  "link",
  "style",
  "script",
  "noscript"
]);
const ValidHeadTags = /* @__PURE__ */ new Set([
  "title",
  "base",
  "htmlAttrs",
  "bodyAttrs",
  "meta",
  "link",
  "style",
  "script",
  "noscript"
]);
const UniqueTags = /* @__PURE__ */ new Set(["base", "title", "titleTemplate", "bodyAttrs", "htmlAttrs", "templateParams"]);
const TagConfigKeys = /* @__PURE__ */ new Set(["key", "tagPosition", "tagPriority", "tagDuplicateStrategy", "innerHTML", "textContent", "processTemplateParams"]);
const UsesMergeStrategy = /* @__PURE__ */ new Set(["templateParams", "htmlAttrs", "bodyAttrs"]);
const MetaTagsArrayable = /* @__PURE__ */ new Set([
  "theme-color",
  "google-site-verification",
  "og",
  "article",
  "book",
  "profile",
  "twitter",
  "author"
]);

const allowedMetaProperties = ["name", "property", "http-equiv"];
const StandardSingleMetaTags = /* @__PURE__ */ new Set([
  "viewport",
  "description",
  "keywords",
  "robots"
]);
function isMetaArrayDupeKey(v) {
  const parts = v.split(":");
  if (!parts.length)
    return false;
  return MetaTagsArrayable.has(parts[1]);
}
function dedupeKey(tag) {
  const { props, tag: name } = tag;
  if (UniqueTags.has(name))
    return name;
  if (name === "link" && props.rel === "canonical")
    return "canonical";
  if (name === "link" && props.rel === "alternate") {
    const altKey = props.hreflang || props.type;
    if (altKey) {
      return `alternate:${altKey}`;
    }
  }
  if (props.charset)
    return "charset";
  if (tag.tag === "meta") {
    for (const n of allowedMetaProperties) {
      if (props[n] !== void 0) {
        const propValue = props[n];
        const isStructured = propValue && typeof propValue === "string" && propValue.includes(":");
        const isStandardSingle = propValue && StandardSingleMetaTags.has(propValue);
        const shouldAlwaysDedupe = isStructured || isStandardSingle;
        const keyPart = !shouldAlwaysDedupe && tag.key ? `:key:${tag.key}` : "";
        return `${name}:${propValue}${keyPart}`;
      }
    }
  }
  if (tag.key) {
    return `${name}:key:${tag.key}`;
  }
  if (props.id) {
    return `${name}:id:${props.id}`;
  }
  if (name === "link" && props.rel === "alternate") {
    return `alternate:${props.href || ""}`;
  }
  if (TagsWithInnerContent.has(name)) {
    const v = tag.textContent || tag.innerHTML;
    if (v) {
      return `${name}:content:${v}`;
    }
  }
}
function hashTag(tag) {
  const dedupe = tag._h || tag._d;
  if (dedupe)
    return dedupe;
  const inner = tag.textContent || tag.innerHTML;
  if (inner)
    return inner;
  return `${tag.tag}:${Object.entries(tag.props).map(([k, v]) => `${k}:${String(v)}`).join(",")}`;
}

function walkResolver(val, resolve, key) {
  const type = typeof val;
  if (type === "function") {
    if (!key || key !== "titleTemplate" && !(key[0] === "o" && key[1] === "n")) {
      val = val();
    }
  }
  const v = resolve ? resolve(key, val) : val;
  if (Array.isArray(v)) {
    return v.map((r) => walkResolver(r, resolve));
  }
  if (v?.constructor === Object) {
    const next = {};
    for (const k of Object.keys(v)) {
      next[k] = walkResolver(v[k], resolve, k);
    }
    return next;
  }
  return v;
}

function normalizeStyleClassProps(key, value) {
  const store = key === "style" ? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Set();
  function processValue(rawValue) {
    if (rawValue == null || rawValue === void 0)
      return;
    const value2 = String(rawValue).trim();
    if (!value2)
      return;
    if (key === "style") {
      const [k, ...v] = value2.split(":").map((s) => s ? s.trim() : "");
      if (k && v.length)
        store.set(k, v.join(":"));
    } else {
      value2.split(" ").filter(Boolean).forEach((c) => store.add(c));
    }
  }
  if (typeof value === "string") {
    key === "style" ? value.split(";").forEach(processValue) : processValue(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => processValue(item));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      if (v && v !== "false") {
        key === "style" ? store.set(String(k).trim(), String(v)) : processValue(k);
      }
    });
  }
  return store;
}
function normalizeProps(tag, input) {
  tag.props = tag.props || {};
  if (!input) {
    return tag;
  }
  if (tag.tag === "templateParams") {
    tag.props = input;
    return tag;
  }
  const isHtmlTag = HasElementTags.has(tag.tag) || tag.tag === "htmlAttrs" || tag.tag === "bodyAttrs";
  Object.entries(input).forEach(([prop, value]) => {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype")
      return;
    if (value === null) {
      tag.props[prop] = null;
      return;
    }
    if (prop === "class" || prop === "style") {
      tag.props[prop] = normalizeStyleClassProps(prop, value);
      return;
    }
    if (TagConfigKeys.has(prop)) {
      if ((prop === "textContent" || prop === "innerHTML") && typeof value === "object") {
        let type = input.type;
        if (!input.type) {
          type = "application/json";
        }
        if (!type?.endsWith("json") && type !== "speculationrules") {
          return;
        }
        input.type = type;
        tag.props.type = type;
        tag[prop] = JSON.stringify(value);
      } else {
        tag[prop] = value;
      }
      return;
    }
    const isDataKey = prop.startsWith("data-");
    const key = isHtmlTag && !isDataKey ? prop.toLowerCase() : prop;
    const strValue = String(value);
    const isMetaContentKey = tag.tag === "meta" && key === "content";
    if (strValue === "true" || strValue === "") {
      tag.props[key] = isDataKey || isMetaContentKey ? strValue : true;
    } else if (!value && isDataKey && strValue === "false") {
      tag.props[key] = "false";
    } else if (value !== void 0) {
      tag.props[key] = value;
    }
  });
  return tag;
}
function normalizeTag(tagName, _input) {
  const input = typeof _input === "object" && typeof _input !== "function" ? _input : { [tagName === "script" || tagName === "noscript" || tagName === "style" ? "innerHTML" : "textContent"]: _input };
  const tag = normalizeProps({ tag: tagName, props: {} }, input);
  if (tag.key && DupeableTags.has(tag.tag)) {
    tag.props["data-hid"] = tag._h = tag.key;
  }
  if (tag.tag === "script" && typeof tag.innerHTML === "object") {
    tag.innerHTML = JSON.stringify(tag.innerHTML);
    tag.props.type = tag.props.type || "application/json";
  }
  return Array.isArray(tag.props.content) ? tag.props.content.map((v) => ({ ...tag, props: { ...tag.props, content: v } })) : tag;
}
function normalizeEntryToTags(input, propResolvers) {
  if (!input) {
    return [];
  }
  if (typeof input === "function") {
    input = input();
  }
  const resolvers = (key, val) => {
    for (let i = 0; i < propResolvers.length; i++) {
      val = propResolvers[i](key, val);
    }
    return val;
  };
  input = resolvers(void 0, input);
  const tags = [];
  input = walkResolver(input, resolvers);
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value === void 0)
      return;
    for (const v of Array.isArray(value) ? value : [value])
      tags.push(normalizeTag(key, v));
  });
  return tags.flat();
}

const sortTags = (a, b) => a._w === b._w ? a._p - b._p : a._w - b._w;
const TAG_WEIGHTS = {
  base: -10,
  title: 10
};
const TAG_ALIASES = {
  critical: -8,
  high: -1,
  low: 2
};
const WEIGHT_MAP = {
  meta: {
    "content-security-policy": -30,
    "charset": -20,
    "viewport": -15
  },
  link: {
    "preconnect": 20,
    "stylesheet": 60,
    "preload": 70,
    "modulepreload": 70,
    "prefetch": 90,
    "dns-prefetch": 90,
    "prerender": 90
  },
  script: {
    async: 30,
    defer: 80,
    sync: 50
  },
  style: {
    imported: 40,
    sync: 60
  }
};
const ImportStyleRe = /@import/;
const isTruthy = (val) => val === "" || val === true;
function tagWeight(head, tag) {
  if (typeof tag.tagPriority === "number")
    return tag.tagPriority;
  let weight = 100;
  const offset = TAG_ALIASES[tag.tagPriority] || 0;
  const weightMap = head.resolvedOptions.disableCapoSorting ? {
    link: {},
    script: {},
    style: {}
  } : WEIGHT_MAP;
  if (tag.tag in TAG_WEIGHTS) {
    weight = TAG_WEIGHTS[tag.tag];
  } else if (tag.tag === "meta") {
    const metaType = tag.props["http-equiv"] === "content-security-policy" ? "content-security-policy" : tag.props.charset ? "charset" : tag.props.name === "viewport" ? "viewport" : null;
    if (metaType)
      weight = WEIGHT_MAP.meta[metaType];
  } else if (tag.tag === "link" && tag.props.rel) {
    weight = weightMap.link[tag.props.rel];
  } else if (tag.tag === "script") {
    const type = String(tag.props.type);
    if (isTruthy(tag.props.async)) {
      weight = weightMap.script.async;
    } else if (tag.props.src && !isTruthy(tag.props.defer) && !isTruthy(tag.props.async) && type !== "module" && !type.endsWith("json") || tag.innerHTML && !type.endsWith("json")) {
      weight = weightMap.script.sync;
    } else if (isTruthy(tag.props.defer) && tag.props.src && !isTruthy(tag.props.async) || type === "module") {
      weight = weightMap.script.defer;
    }
  } else if (tag.tag === "style") {
    weight = tag.innerHTML && ImportStyleRe.test(tag.innerHTML) ? weightMap.style.imported : weightMap.style.sync;
  }
  return (weight || 100) + offset;
}

function registerPlugin(head, p) {
  const plugin = typeof p === "function" ? p(head) : p;
  const key = plugin.key || String(head.plugins.size + 1);
  const exists = head.plugins.get(key);
  if (!exists) {
    head.plugins.set(key, plugin);
    head.hooks.addHooks(plugin.hooks || {});
  }
}
// @__NO_SIDE_EFFECTS__
function createUnhead(resolvedOptions = {}) {
  const hooks = createHooks();
  hooks.addHooks(resolvedOptions.hooks || {});
  const ssr = !resolvedOptions.document;
  const entries = /* @__PURE__ */ new Map();
  const plugins = /* @__PURE__ */ new Map();
  const normalizeQueue = /* @__PURE__ */ new Set();
  const head = {
    _entryCount: 1,
    // 0 is reserved for internal use
    plugins,
    dirty: false,
    resolvedOptions,
    hooks,
    ssr,
    entries,
    headEntries() {
      return [...entries.values()];
    },
    use: (p) => registerPlugin(head, p),
    push(input, _options) {
      const options = { ..._options || {} };
      delete options.head;
      const _i = options._index ?? head._entryCount++;
      const inst = { _i, input, options };
      const _ = {
        _poll(rm = false) {
          head.dirty = true;
          !rm && normalizeQueue.add(_i);
          hooks.callHook("entries:updated", head);
        },
        dispose() {
          if (entries.delete(_i)) {
            head.invalidate();
          }
        },
        // a patch is the same as creating a new entry, just a nice DX
        patch(input2) {
          if (!options.mode || options.mode === "server" && ssr || options.mode === "client" && !ssr) {
            inst.input = input2;
            entries.set(_i, inst);
            _._poll();
          }
        }
      };
      _.patch(input);
      return _;
    },
    async resolveTags() {
      const ctx = {
        tagMap: /* @__PURE__ */ new Map(),
        tags: [],
        entries: [...head.entries.values()]
      };
      await hooks.callHook("entries:resolve", ctx);
      while (normalizeQueue.size) {
        const i = normalizeQueue.values().next().value;
        normalizeQueue.delete(i);
        const e = entries.get(i);
        if (e) {
          const normalizeCtx = {
            tags: normalizeEntryToTags(e.input, resolvedOptions.propResolvers || []).map((t) => Object.assign(t, e.options)),
            entry: e
          };
          await hooks.callHook("entries:normalize", normalizeCtx);
          e._tags = normalizeCtx.tags.map((t, i2) => {
            t._w = tagWeight(head, t);
            t._p = (e._i << 10) + i2;
            t._d = dedupeKey(t);
            if (!t._d)
              t._h = hashTag(t);
            return t;
          });
        }
      }
      let hasFlatMeta = false;
      ctx.entries.flatMap((e) => (e._tags || []).map((t) => ({ ...t, props: { ...t.props } }))).sort(sortTags).reduce((acc, next) => {
        const k = next._d || next._h;
        if (!acc.has(k))
          return acc.set(k, next);
        const prev = acc.get(k);
        const strategy = next?.tagDuplicateStrategy || (UsesMergeStrategy.has(next.tag) ? "merge" : null) || (next.key && next.key === prev.key ? "merge" : null);
        if (strategy === "merge") {
          const newProps = { ...prev.props };
          Object.entries(next.props).forEach(([p, v]) => (
            // @ts-expect-error untyped
            newProps[p] = p === "style" ? new Map([...prev.props.style || /* @__PURE__ */ new Map(), ...v]) : p === "class" ? /* @__PURE__ */ new Set([...prev.props.class || /* @__PURE__ */ new Set(), ...v]) : v
          ));
          acc.set(k, { ...next, props: newProps });
        } else if (next._p >> 10 === prev._p >> 10 && next.tag === "meta" && isMetaArrayDupeKey(k)) {
          acc.set(k, Object.assign([...Array.isArray(prev) ? prev : [prev], next], next));
          hasFlatMeta = true;
        } else if (next._w === prev._w ? next._p > prev._p : next?._w < prev?._w) {
          acc.set(k, next);
        }
        return acc;
      }, ctx.tagMap);
      const title = ctx.tagMap.get("title");
      const titleTemplate = ctx.tagMap.get("titleTemplate");
      head._title = title?.textContent;
      if (titleTemplate) {
        const titleTemplateFn = titleTemplate?.textContent;
        head._titleTemplate = titleTemplateFn;
        if (titleTemplateFn) {
          let newTitle = typeof titleTemplateFn === "function" ? titleTemplateFn(title?.textContent) : titleTemplateFn;
          if (typeof newTitle === "string" && !head.plugins.has("template-params")) {
            newTitle = newTitle.replace("%s", title?.textContent || "");
          }
          if (title) {
            newTitle === null ? ctx.tagMap.delete("title") : ctx.tagMap.set("title", { ...title, textContent: newTitle });
          } else {
            titleTemplate.tag = "title";
            titleTemplate.textContent = newTitle;
          }
        }
      }
      ctx.tags = Array.from(ctx.tagMap.values());
      if (hasFlatMeta) {
        ctx.tags = ctx.tags.flat().sort(sortTags);
      }
      await hooks.callHook("tags:beforeResolve", ctx);
      await hooks.callHook("tags:resolve", ctx);
      await hooks.callHook("tags:afterResolve", ctx);
      const finalTags = [];
      for (const t of ctx.tags) {
        const { innerHTML, tag, props } = t;
        if (!ValidHeadTags.has(tag)) {
          continue;
        }
        if (Object.keys(props).length === 0 && !t.innerHTML && !t.textContent) {
          continue;
        }
        if (tag === "meta" && !props.content && !props["http-equiv"] && !props.charset) {
          continue;
        }
        if (tag === "script" && innerHTML) {
          if (String(props.type).endsWith("json")) {
            const v = typeof innerHTML === "string" ? innerHTML : JSON.stringify(innerHTML);
            t.innerHTML = v.replace(/</g, "\\u003C");
          } else if (typeof innerHTML === "string") {
            t.innerHTML = innerHTML.replace(new RegExp(`</${tag}`, "g"), `<\\/${tag}`);
          }
          t._d = dedupeKey(t);
        }
        finalTags.push(t);
      }
      return finalTags;
    },
    invalidate() {
      for (const entry of entries.values()) {
        normalizeQueue.add(entry._i);
      }
      head.dirty = true;
      hooks.callHook("entries:updated", head);
    }
  };
  (resolvedOptions?.plugins || []).forEach((p) => registerPlugin(head, p));
  head.hooks.callHook("init", head);
  resolvedOptions.init?.forEach((e) => e && head.push(e));
  return head;
}

// @__NO_SIDE_EFFECTS__
function createHead$1(options = {}) {
  const unhead = createUnhead({
    ...options,
    // @ts-expect-error untyped
    document: false,
    propResolvers: [
      ...options.propResolvers || [],
      (k, v) => {
        if (k && k.startsWith("on") && typeof v === "function") {
          return `this.dataset.${k}fired = true`;
        }
        return v;
      }
    ],
    init: [
      options.disableDefaults ? void 0 : {
        htmlAttrs: {
          lang: "en"
        },
        meta: [
          {
            charset: "utf-8"
          },
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1"
          }
        ]
      },
      ...options.init || []
    ]
  });
  unhead._ssrPayload = {};
  unhead.use({
    key: "server",
    hooks: {
      "tags:resolve": function(ctx) {
        const title = ctx.tagMap.get("title");
        const titleTemplate = ctx.tagMap.get("titleTemplate");
        let payload = {
          title: title?.mode === "server" ? unhead._title : void 0,
          titleTemplate: titleTemplate?.mode === "server" ? unhead._titleTemplate : void 0
        };
        if (Object.keys(unhead._ssrPayload || {}).length > 0) {
          payload = {
            ...unhead._ssrPayload,
            ...payload
          };
        }
        if (Object.values(payload).some(Boolean)) {
          ctx.tags.push({
            tag: "script",
            innerHTML: JSON.stringify(payload),
            props: { id: "unhead:payload", type: "application/json" }
          });
        }
      }
    }
  });
  return unhead;
}

function encodeAttribute(value) {
  return String(value).replace(/"/g, "&quot;");
}
function propsToString(props) {
  let attrs = "";
  for (const key in props) {
    if (!Object.hasOwn(props, key))
      continue;
    let value = props[key];
    if ((key === "class" || key === "style") && typeof value !== "string") {
      value = key === "class" ? Array.from(value).join(" ") : Array.from(value).map(([k, v]) => `${k}:${v}`).join(";");
    }
    if (value !== false && value !== null) {
      attrs += value === true ? ` ${key}` : ` ${key}="${encodeAttribute(value)}"`;
    }
  }
  return attrs;
}

function escapeHtml(str) {
  return str.replace(/[&<>"'/]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      case "/":
        return "&#x2F;";
      default:
        return char;
    }
  });
}
function tagToString(tag) {
  const attrs = propsToString(tag.props);
  const openTag = `<${tag.tag}${attrs}>`;
  if (!TagsWithInnerContent.has(tag.tag))
    return SelfClosingTags.has(tag.tag) ? openTag : `${openTag}</${tag.tag}>`;
  let content = String(tag.textContent || tag.innerHTML || "");
  content = tag.tag === "title" ? escapeHtml(content) : content.replace(new RegExp(`</${tag.tag}`, "gi"), `<\\/${tag.tag}`);
  return SelfClosingTags.has(tag.tag) ? openTag : `${openTag}${content}</${tag.tag}>`;
}

function ssrRenderTags(tags, options) {
  const schema = { htmlAttrs: {}, bodyAttrs: {}, tags: { head: "", bodyClose: "", bodyOpen: "" } };
  const lineBreaks = "\n" ;
  for (const tag of tags) {
    if (tag.tag === "htmlAttrs" || tag.tag === "bodyAttrs") {
      Object.assign(schema[tag.tag], tag.props);
      continue;
    }
    const s = tagToString(tag);
    const tagPosition = tag.tagPosition || "head";
    schema.tags[tagPosition] += schema.tags[tagPosition] ? `${lineBreaks}${s}` : s;
  }
  return {
    headTags: schema.tags.head,
    bodyTags: schema.tags.bodyClose,
    bodyTagsOpen: schema.tags.bodyOpen,
    htmlAttrs: propsToString(schema.htmlAttrs),
    bodyAttrs: propsToString(schema.bodyAttrs)
  };
}

// @__NO_SIDE_EFFECTS__
async function renderSSRHead(head, options) {
  const beforeRenderCtx = { shouldRender: true };
  await head.hooks.callHook("ssr:beforeRender", beforeRenderCtx);
  if (!beforeRenderCtx.shouldRender) {
    return {
      headTags: "",
      bodyTags: "",
      bodyTagsOpen: "",
      htmlAttrs: "",
      bodyAttrs: ""
    };
  }
  const ctx = { tags: options?.resolvedTags || await head.resolveTags() };
  await head.hooks.callHook("ssr:render", ctx);
  const html = ssrRenderTags(ctx.tags);
  const renderCtx = { tags: ctx.tags, html };
  await head.hooks.callHook("ssr:rendered", renderCtx);
  return renderCtx.html;
}

function defineHeadPlugin(plugin) {
  return plugin;
}

const SepSub = "%separator";
function sub(p, token, isJson = false) {
  let val;
  if (token === "s" || token === "pageTitle") {
    val = p.pageTitle;
  } else if (token.includes(".")) {
    const dotIndex = token.indexOf(".");
    val = p[token.substring(0, dotIndex)]?.[token.substring(dotIndex + 1)];
  } else {
    val = p[token];
  }
  if (val !== void 0) {
    return isJson ? (val || "").replace(/\\/g, "\\\\").replace(/</g, "\\u003C").replace(/"/g, '\\"') : val || "";
  }
  return void 0;
}
function processTemplateParams(s, p, sep, isJson = false) {
  if (typeof s !== "string" || !s.includes("%"))
    return s;
  let decoded = s;
  try {
    decoded = decodeURI(s);
  } catch {
  }
  const tokens = decoded.match(/%\w+(?:\.\w+)?/g);
  if (!tokens) {
    return s;
  }
  const hasSepSub = s.includes(SepSub);
  s = s.replace(/%\w+(?:\.\w+)?/g, (token) => {
    if (token === SepSub || !tokens.includes(token)) {
      return token;
    }
    const re = sub(p, token.slice(1), isJson);
    return re !== void 0 ? re : token;
  }).trim();
  if (hasSepSub) {
    s = s.split(SepSub).map((part) => part.trim()).filter((part) => part !== "").join(sep ? ` ${sep} ` : " ");
  }
  return s;
}

const formatKey = (k) => !k.includes(":key") ? k.split(":").join(":key:") : k;
const AliasSortingPlugin = defineHeadPlugin({
  key: "aliasSorting",
  hooks: {
    "tags:resolve": (ctx) => {
      let m = false;
      for (const t of ctx.tags) {
        const p = t.tagPriority;
        if (!p)
          continue;
        const s = String(p);
        if (s.startsWith("before:")) {
          const k = formatKey(s.slice(7));
          const l = ctx.tagMap.get(k);
          if (l) {
            if (typeof l.tagPriority === "number")
              t.tagPriority = l.tagPriority;
            t._p = l._p - 1;
            m = true;
          }
        } else if (s.startsWith("after:")) {
          const k = formatKey(s.slice(6));
          const l = ctx.tagMap.get(k);
          if (l) {
            if (typeof l.tagPriority === "number")
              t.tagPriority = l.tagPriority;
            t._p = l._p + 1;
            m = true;
          }
        }
      }
      if (m)
        ctx.tags = ctx.tags.sort(sortTags);
    }
  }
});

const DeprecationsPlugin = /* @__PURE__ */ defineHeadPlugin({
  key: "deprecations",
  hooks: {
    "entries:normalize": ({ tags }) => {
      for (const tag of tags) {
        if (tag.props.children) {
          tag.innerHTML = tag.props.children;
          delete tag.props.children;
        }
        if (tag.props.hid) {
          tag.key = tag.props.hid;
          delete tag.props.hid;
        }
        if (tag.props.vmid) {
          tag.key = tag.props.vmid;
          delete tag.props.vmid;
        }
        if (tag.props.body) {
          tag.tagPosition = "bodyClose";
          delete tag.props.body;
        }
      }
    }
  }
});

async function walkPromises(v) {
  const type = typeof v;
  if (type === "function") {
    return v;
  }
  if (v instanceof Promise) {
    return await v;
  }
  if (Array.isArray(v)) {
    return await Promise.all(v.map((r) => walkPromises(r)));
  }
  if (v?.constructor === Object) {
    const next = {};
    for (const key of Object.keys(v)) {
      next[key] = await walkPromises(v[key]);
    }
    return next;
  }
  return v;
}
const PromisesPlugin = /* @__PURE__ */ defineHeadPlugin({
  key: "promises",
  hooks: {
    "entries:resolve": async (ctx) => {
      const promises = [];
      for (const k in ctx.entries) {
        if (!ctx.entries[k]._promisesProcessed) {
          promises.push(
            walkPromises(ctx.entries[k].input).then((val) => {
              ctx.entries[k].input = val;
              ctx.entries[k]._promisesProcessed = true;
            })
          );
        }
      }
      await Promise.all(promises);
    }
  }
});

const SupportedAttrs = {
  meta: "content",
  link: "href",
  htmlAttrs: "lang"
};
const contentAttrs = ["innerHTML", "textContent"];
const TemplateParamsPlugin = /* @__PURE__ */ defineHeadPlugin((head) => {
  return {
    key: "template-params",
    hooks: {
      "entries:normalize": (ctx) => {
        const params = ctx.tags.filter((t) => t.tag === "templateParams" && t.mode === "server")?.[0]?.props || {};
        if (Object.keys(params).length) {
          head._ssrPayload = {
            templateParams: {
              ...head._ssrPayload?.templateParams || {},
              ...params
            }
          };
        }
      },
      "tags:resolve": ({ tagMap, tags }) => {
        const params = tagMap.get("templateParams")?.props || {};
        const sep = params.separator || "|";
        delete params.separator;
        params.pageTitle = processTemplateParams(
          // find templateParams
          params.pageTitle || head._title || "",
          params,
          sep
        );
        for (const tag of tags) {
          if (tag.processTemplateParams === false) {
            continue;
          }
          const v = SupportedAttrs[tag.tag];
          if (v && typeof tag.props[v] === "string") {
            tag.props[v] = processTemplateParams(tag.props[v], params, sep);
          } else if (tag.processTemplateParams || tag.tag === "titleTemplate" || tag.tag === "title") {
            for (const p of contentAttrs) {
              if (typeof tag[p] === "string")
                tag[p] = processTemplateParams(tag[p], params, sep, tag.tag === "script" && tag.props.type.endsWith("json"));
            }
          }
        }
        head._templateParams = params;
        head._separator = sep;
      },
      "tags:afterResolve": ({ tagMap }) => {
        const title = tagMap.get("title");
        if (title?.textContent && title.processTemplateParams !== false) {
          title.textContent = processTemplateParams(title.textContent, head._templateParams, head._separator);
        }
      }
    }
  };
});

const VueResolver = (_, value) => {
  return vueExports.isRef(value) ? vueExports.toValue(value) : value;
};

const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

// @__NO_SIDE_EFFECTS__
function injectHead() {
  if (vueExports.hasInjectionContext()) {
    const instance = vueExports.inject(headSymbol);
    if (instance) {
      return instance;
    }
  }
  throw new Error("useHead() was called without provide context, ensure you call it through the setup() function.");
}
function useHead(input, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  return head.ssr ? head.push(input || {}, options) : clientUseHead(head, input, options);
}
function clientUseHead(head, input, options = {}) {
  const deactivated = vueExports.ref(false);
  let entry;
  vueExports.watchEffect(() => {
    const i = deactivated.value ? {} : walkResolver(input, VueResolver);
    if (entry) {
      entry.patch(i);
    } else {
      entry = head.push(i, options);
    }
  });
  const vm = vueExports.getCurrentInstance();
  if (vm) {
    vueExports.onBeforeUnmount(() => {
      entry.dispose();
    });
    vueExports.onDeactivated(() => {
      deactivated.value = true;
    });
    vueExports.onActivated(() => {
      deactivated.value = false;
    });
  }
  return entry;
}

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

var serverRenderer_cjs_prod = {};

const require$$0 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(Vue$1);

var compilerSsr_cjs = {};

/**
* @vue/compiler-ssr v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/

Object.defineProperty(compilerSsr_cjs, '__esModule', { value: true });

var compilerDom = compilerDom_cjs_prod;
var shared$1 = shared_cjs_prod;

const SSR_INTERPOLATE = /* @__PURE__ */ Symbol(`ssrInterpolate`);
const SSR_RENDER_VNODE = /* @__PURE__ */ Symbol(`ssrRenderVNode`);
const SSR_RENDER_COMPONENT = /* @__PURE__ */ Symbol(`ssrRenderComponent`);
const SSR_RENDER_SLOT = /* @__PURE__ */ Symbol(`ssrRenderSlot`);
const SSR_RENDER_SLOT_INNER = /* @__PURE__ */ Symbol(`ssrRenderSlotInner`);
const SSR_RENDER_CLASS = /* @__PURE__ */ Symbol(`ssrRenderClass`);
const SSR_RENDER_STYLE = /* @__PURE__ */ Symbol(`ssrRenderStyle`);
const SSR_RENDER_ATTRS = /* @__PURE__ */ Symbol(`ssrRenderAttrs`);
const SSR_RENDER_ATTR = /* @__PURE__ */ Symbol(`ssrRenderAttr`);
const SSR_RENDER_DYNAMIC_ATTR = /* @__PURE__ */ Symbol(`ssrRenderDynamicAttr`);
const SSR_RENDER_LIST = /* @__PURE__ */ Symbol(`ssrRenderList`);
const SSR_INCLUDE_BOOLEAN_ATTR = /* @__PURE__ */ Symbol(
  `ssrIncludeBooleanAttr`
);
const SSR_LOOSE_EQUAL = /* @__PURE__ */ Symbol(`ssrLooseEqual`);
const SSR_LOOSE_CONTAIN = /* @__PURE__ */ Symbol(`ssrLooseContain`);
const SSR_RENDER_DYNAMIC_MODEL = /* @__PURE__ */ Symbol(
  `ssrRenderDynamicModel`
);
const SSR_GET_DYNAMIC_MODEL_PROPS = /* @__PURE__ */ Symbol(
  `ssrGetDynamicModelProps`
);
const SSR_RENDER_TELEPORT = /* @__PURE__ */ Symbol(`ssrRenderTeleport`);
const SSR_RENDER_SUSPENSE = /* @__PURE__ */ Symbol(`ssrRenderSuspense`);
const SSR_GET_DIRECTIVE_PROPS = /* @__PURE__ */ Symbol(`ssrGetDirectiveProps`);
const ssrHelpers = {
  [SSR_INTERPOLATE]: `ssrInterpolate`,
  [SSR_RENDER_VNODE]: `ssrRenderVNode`,
  [SSR_RENDER_COMPONENT]: `ssrRenderComponent`,
  [SSR_RENDER_SLOT]: `ssrRenderSlot`,
  [SSR_RENDER_SLOT_INNER]: `ssrRenderSlotInner`,
  [SSR_RENDER_CLASS]: `ssrRenderClass`,
  [SSR_RENDER_STYLE]: `ssrRenderStyle`,
  [SSR_RENDER_ATTRS]: `ssrRenderAttrs`,
  [SSR_RENDER_ATTR]: `ssrRenderAttr`,
  [SSR_RENDER_DYNAMIC_ATTR]: `ssrRenderDynamicAttr`,
  [SSR_RENDER_LIST]: `ssrRenderList`,
  [SSR_INCLUDE_BOOLEAN_ATTR]: `ssrIncludeBooleanAttr`,
  [SSR_LOOSE_EQUAL]: `ssrLooseEqual`,
  [SSR_LOOSE_CONTAIN]: `ssrLooseContain`,
  [SSR_RENDER_DYNAMIC_MODEL]: `ssrRenderDynamicModel`,
  [SSR_GET_DYNAMIC_MODEL_PROPS]: `ssrGetDynamicModelProps`,
  [SSR_RENDER_TELEPORT]: `ssrRenderTeleport`,
  [SSR_RENDER_SUSPENSE]: `ssrRenderSuspense`,
  [SSR_GET_DIRECTIVE_PROPS]: `ssrGetDirectiveProps`
};
compilerDom.registerRuntimeHelpers(ssrHelpers);

const ssrTransformIf = compilerDom.createStructuralDirectiveTransform(
  /^(?:if|else|else-if)$/,
  compilerDom.processIf
);
function ssrProcessIf(node, context, disableNestedFragments = false, disableComment = false) {
  const [rootBranch] = node.branches;
  const ifStatement = compilerDom.createIfStatement(
    rootBranch.condition,
    processIfBranch(rootBranch, context, disableNestedFragments)
  );
  context.pushStatement(ifStatement);
  let currentIf = ifStatement;
  for (let i = 1; i < node.branches.length; i++) {
    const branch = node.branches[i];
    const branchBlockStatement = processIfBranch(
      branch,
      context,
      disableNestedFragments
    );
    if (branch.condition) {
      currentIf = currentIf.alternate = compilerDom.createIfStatement(
        branch.condition,
        branchBlockStatement
      );
    } else {
      currentIf.alternate = branchBlockStatement;
    }
  }
  if (!currentIf.alternate && !disableComment) {
    currentIf.alternate = compilerDom.createBlockStatement([
      compilerDom.createCallExpression(`_push`, ["`<!---->`"])
    ]);
  }
}
function processIfBranch(branch, context, disableNestedFragments = false) {
  const { children } = branch;
  const needFragmentWrapper = !disableNestedFragments && (children.length !== 1 || children[0].type !== 1) && // optimize away nested fragments when the only child is a ForNode
  !(children.length === 1 && children[0].type === 11);
  return processChildrenAsStatement(branch, context, needFragmentWrapper);
}

const ssrTransformFor = compilerDom.createStructuralDirectiveTransform("for", compilerDom.processFor);
function ssrProcessFor(node, context, disableNestedFragments = false) {
  const needFragmentWrapper = !disableNestedFragments && (node.children.length !== 1 || node.children[0].type !== 1);
  const renderLoop = compilerDom.createFunctionExpression(
    compilerDom.createForLoopParams(node.parseResult)
  );
  renderLoop.body = processChildrenAsStatement(
    node,
    context,
    needFragmentWrapper
  );
  if (!disableNestedFragments) {
    context.pushStringPart(`<!--[-->`);
  }
  context.pushStatement(
    compilerDom.createCallExpression(context.helper(SSR_RENDER_LIST), [
      node.source,
      renderLoop
    ])
  );
  if (!disableNestedFragments) {
    context.pushStringPart(`<!--]-->`);
  }
}

const ssrTransformSlotOutlet = (node, context) => {
  if (compilerDom.isSlotOutlet(node)) {
    const { slotName, slotProps } = compilerDom.processSlotOutlet(node, context);
    const args = [
      `_ctx.$slots`,
      slotName,
      slotProps || `{}`,
      // fallback content placeholder. will be replaced in the process phase
      `null`,
      `_push`,
      `_parent`
    ];
    if (context.scopeId && context.slotted !== false) {
      args.push(`"${context.scopeId}-s"`);
    }
    let method = SSR_RENDER_SLOT;
    let parent = context.parent;
    if (parent) {
      const children = parent.children;
      if (parent.type === 10) {
        parent = context.grandParent;
      }
      let componentType;
      if (parent.type === 1 && parent.tagType === 1 && ((componentType = compilerDom.resolveComponentType(parent, context, true)) === compilerDom.TRANSITION || componentType === compilerDom.TRANSITION_GROUP) && children.filter((c) => c.type === 1).length === 1) {
        method = SSR_RENDER_SLOT_INNER;
        if (!(context.scopeId && context.slotted !== false)) {
          args.push("null");
        }
        args.push("true");
      }
    }
    node.ssrCodegenNode = compilerDom.createCallExpression(context.helper(method), args);
  }
};
function ssrProcessSlotOutlet(node, context) {
  const renderCall = node.ssrCodegenNode;
  if (node.children.length) {
    const fallbackRenderFn = compilerDom.createFunctionExpression([]);
    fallbackRenderFn.body = processChildrenAsStatement(node, context);
    renderCall.arguments[3] = fallbackRenderFn;
  }
  if (context.withSlotScopeId) {
    const slotScopeId = renderCall.arguments[6];
    renderCall.arguments[6] = slotScopeId ? `${slotScopeId} + _scopeId` : `_scopeId`;
  }
  context.pushStatement(node.ssrCodegenNode);
}

function createSSRCompilerError(code, loc) {
  return compilerDom.createCompilerError(code, loc, SSRErrorMessages);
}
const SSRErrorMessages = {
  [65]: `Unsafe attribute name for SSR.`,
  [66]: `Missing the 'to' prop on teleport element.`,
  [67]: `Invalid AST node during SSR transform.`
};

function ssrProcessTeleport(node, context) {
  const targetProp = compilerDom.findProp(node, "to");
  if (!targetProp) {
    context.onError(
      createSSRCompilerError(66, node.loc)
    );
    return;
  }
  let target;
  if (targetProp.type === 6) {
    target = targetProp.value && compilerDom.createSimpleExpression(targetProp.value.content, true);
  } else {
    target = targetProp.exp;
  }
  if (!target) {
    context.onError(
      createSSRCompilerError(
        66,
        targetProp.loc
      )
    );
    return;
  }
  const disabledProp = compilerDom.findProp(
    node,
    "disabled",
    false,
    true
    /* allow empty */
  );
  const disabled = disabledProp ? disabledProp.type === 6 ? `true` : disabledProp.exp || `false` : `false`;
  const contentRenderFn = compilerDom.createFunctionExpression(
    [`_push`],
    void 0,
    // Body is added later
    true,
    // newline
    false,
    // isSlot
    node.loc
  );
  contentRenderFn.body = processChildrenAsStatement(node, context);
  context.pushStatement(
    compilerDom.createCallExpression(context.helper(SSR_RENDER_TELEPORT), [
      `_push`,
      contentRenderFn,
      target,
      disabled,
      `_parent`
    ])
  );
}

const wipMap$3 = /* @__PURE__ */ new WeakMap();
function ssrTransformSuspense(node, context) {
  return () => {
    if (node.children.length) {
      const wipEntry = {
        slotsExp: null,
        // to be immediately set
        wipSlots: []
      };
      wipMap$3.set(node, wipEntry);
      wipEntry.slotsExp = compilerDom.buildSlots(
        node,
        context,
        (_props, _vForExp, children, loc) => {
          const fn = compilerDom.createFunctionExpression(
            [],
            void 0,
            // no return, assign body later
            true,
            // newline
            false,
            // suspense slots are not treated as normal slots
            loc
          );
          wipEntry.wipSlots.push({
            fn,
            children
          });
          return fn;
        }
      ).slots;
    }
  };
}
function ssrProcessSuspense(node, context) {
  const wipEntry = wipMap$3.get(node);
  if (!wipEntry) {
    return;
  }
  const { slotsExp, wipSlots } = wipEntry;
  for (let i = 0; i < wipSlots.length; i++) {
    const slot = wipSlots[i];
    slot.fn.body = processChildrenAsStatement(slot, context);
  }
  context.pushStatement(
    compilerDom.createCallExpression(context.helper(SSR_RENDER_SUSPENSE), [
      `_push`,
      slotsExp
    ])
  );
}

const rawChildrenMap = /* @__PURE__ */ new WeakMap();
const ssrTransformElement = (node, context) => {
  if (node.type !== 1 || node.tagType !== 0) {
    return;
  }
  return function ssrPostTransformElement() {
    const openTag = [`<${node.tag}`];
    const needTagForRuntime = node.tag === "textarea" || node.tag.indexOf("-") > 0;
    const hasDynamicVBind = compilerDom.hasDynamicKeyVBind(node);
    const hasCustomDir = node.props.some(
      (p) => p.type === 7 && !shared$1.isBuiltInDirective(p.name)
    );
    const vShowPropIndex = node.props.findIndex(
      (i) => i.type === 7 && i.name === "show"
    );
    if (vShowPropIndex !== -1) {
      const vShowProp = node.props[vShowPropIndex];
      node.props.splice(vShowPropIndex, 1);
      node.props.push(vShowProp);
    }
    const needMergeProps = hasDynamicVBind || hasCustomDir;
    if (needMergeProps) {
      const { props, directives } = compilerDom.buildProps(
        node,
        context,
        node.props,
        false,
        false,
        true
      );
      if (props || directives.length) {
        const mergedProps = buildSSRProps(props, directives, context);
        const propsExp = compilerDom.createCallExpression(
          context.helper(SSR_RENDER_ATTRS),
          [mergedProps]
        );
        if (node.tag === "textarea") {
          const existingText = node.children[0];
          if (!hasContentOverrideDirective(node) && (!existingText || existingText.type !== 5)) {
            const tempId = `_temp${context.temps++}`;
            propsExp.arguments = [
              compilerDom.createAssignmentExpression(
                compilerDom.createSimpleExpression(tempId, false),
                mergedProps
              )
            ];
            rawChildrenMap.set(
              node,
              compilerDom.createCallExpression(context.helper(SSR_INTERPOLATE), [
                compilerDom.createConditionalExpression(
                  compilerDom.createSimpleExpression(`"value" in ${tempId}`, false),
                  compilerDom.createSimpleExpression(`${tempId}.value`, false),
                  compilerDom.createSimpleExpression(
                    existingText ? existingText.content : ``,
                    true
                  ),
                  false
                )
              ])
            );
          }
        } else if (node.tag === "input") {
          const vModel = findVModel(node);
          if (vModel) {
            const tempId = `_temp${context.temps++}`;
            const tempExp = compilerDom.createSimpleExpression(tempId, false);
            propsExp.arguments = [
              compilerDom.createSequenceExpression([
                compilerDom.createAssignmentExpression(tempExp, mergedProps),
                compilerDom.createCallExpression(context.helper(compilerDom.MERGE_PROPS), [
                  tempExp,
                  compilerDom.createCallExpression(
                    context.helper(SSR_GET_DYNAMIC_MODEL_PROPS),
                    [
                      tempExp,
                      // existing props
                      vModel.exp
                      // model
                    ]
                  )
                ])
              ])
            ];
          }
        } else if (directives.length && !node.children.length) {
          if (!hasContentOverrideDirective(node)) {
            const tempId = `_temp${context.temps++}`;
            propsExp.arguments = [
              compilerDom.createAssignmentExpression(
                compilerDom.createSimpleExpression(tempId, false),
                mergedProps
              )
            ];
            rawChildrenMap.set(
              node,
              compilerDom.createConditionalExpression(
                compilerDom.createSimpleExpression(`"textContent" in ${tempId}`, false),
                compilerDom.createCallExpression(context.helper(SSR_INTERPOLATE), [
                  compilerDom.createSimpleExpression(`${tempId}.textContent`, false)
                ]),
                compilerDom.createSimpleExpression(`${tempId}.innerHTML ?? ''`, false),
                false
              )
            );
          }
        }
        if (needTagForRuntime) {
          propsExp.arguments.push(`"${node.tag}"`);
        }
        openTag.push(propsExp);
      }
    }
    let dynamicClassBinding = void 0;
    let staticClassBinding = void 0;
    let dynamicStyleBinding = void 0;
    for (let i = 0; i < node.props.length; i++) {
      const prop = node.props[i];
      if (node.tag === "input" && isTrueFalseValue(prop)) {
        continue;
      }
      if (prop.type === 7) {
        if (prop.name === "html" && prop.exp) {
          rawChildrenMap.set(
            node,
            compilerDom.createCompoundExpression([`(`, prop.exp, `) ?? ''`])
          );
        } else if (prop.name === "text" && prop.exp) {
          node.children = [compilerDom.createInterpolation(prop.exp, prop.loc)];
        } else if (prop.name === "slot") {
          context.onError(
            compilerDom.createCompilerError(40, prop.loc)
          );
        } else if (isTextareaWithValue(node, prop) && prop.exp) {
          if (!needMergeProps) {
            node.children = [compilerDom.createInterpolation(prop.exp, prop.loc)];
          }
        } else if (!needMergeProps && prop.name !== "on") {
          const directiveTransform = context.directiveTransforms[prop.name];
          if (directiveTransform) {
            const { props, ssrTagParts } = directiveTransform(
              prop,
              node,
              context
            );
            if (ssrTagParts) {
              openTag.push(...ssrTagParts);
            }
            for (let j = 0; j < props.length; j++) {
              const { key, value } = props[j];
              if (compilerDom.isStaticExp(key)) {
                let attrName = key.content;
                if (attrName === "key" || attrName === "ref") {
                  continue;
                }
                if (attrName === "class") {
                  openTag.push(
                    ` class="`,
                    dynamicClassBinding = compilerDom.createCallExpression(
                      context.helper(SSR_RENDER_CLASS),
                      [value]
                    ),
                    `"`
                  );
                } else if (attrName === "style") {
                  if (dynamicStyleBinding) {
                    mergeCall(dynamicStyleBinding, value);
                  } else {
                    openTag.push(
                      ` style="`,
                      dynamicStyleBinding = compilerDom.createCallExpression(
                        context.helper(SSR_RENDER_STYLE),
                        [value]
                      ),
                      `"`
                    );
                  }
                } else {
                  attrName = node.tag.indexOf("-") > 0 ? attrName : shared$1.propsToAttrMap[attrName] || attrName.toLowerCase();
                  if (shared$1.isBooleanAttr(attrName)) {
                    openTag.push(
                      compilerDom.createConditionalExpression(
                        compilerDom.createCallExpression(
                          context.helper(SSR_INCLUDE_BOOLEAN_ATTR),
                          [value]
                        ),
                        compilerDom.createSimpleExpression(" " + attrName, true),
                        compilerDom.createSimpleExpression("", true),
                        false
                      )
                    );
                  } else if (shared$1.isSSRSafeAttrName(attrName)) {
                    openTag.push(
                      compilerDom.createCallExpression(context.helper(SSR_RENDER_ATTR), [
                        key,
                        value
                      ])
                    );
                  } else {
                    context.onError(
                      createSSRCompilerError(
                        65,
                        key.loc
                      )
                    );
                  }
                }
              } else {
                const args = [key, value];
                if (needTagForRuntime) {
                  args.push(`"${node.tag}"`);
                }
                openTag.push(
                  compilerDom.createCallExpression(
                    context.helper(SSR_RENDER_DYNAMIC_ATTR),
                    args
                  )
                );
              }
            }
          }
        }
      } else {
        const name = prop.name;
        if (node.tag === "textarea" && name === "value" && prop.value) {
          rawChildrenMap.set(node, shared$1.escapeHtml(prop.value.content));
        } else if (!needMergeProps) {
          if (name === "key" || name === "ref") {
            continue;
          }
          if (name === "class" && prop.value) {
            staticClassBinding = JSON.stringify(prop.value.content);
          }
          openTag.push(
            ` ${prop.name}` + (prop.value ? `="${shared$1.escapeHtml(prop.value.content)}"` : ``)
          );
        }
      }
    }
    if (dynamicClassBinding && staticClassBinding) {
      mergeCall(dynamicClassBinding, staticClassBinding);
      removeStaticBinding(openTag, "class");
    }
    if (context.scopeId) {
      openTag.push(` ${context.scopeId}`);
    }
    node.ssrCodegenNode = compilerDom.createTemplateLiteral(openTag);
  };
};
function buildSSRProps(props, directives, context) {
  let mergePropsArgs = [];
  if (props) {
    if (props.type === 14) {
      mergePropsArgs = props.arguments;
    } else {
      mergePropsArgs.push(props);
    }
  }
  if (directives.length) {
    for (const dir of directives) {
      mergePropsArgs.push(
        compilerDom.createCallExpression(context.helper(SSR_GET_DIRECTIVE_PROPS), [
          `_ctx`,
          ...compilerDom.buildDirectiveArgs(dir, context).elements
        ])
      );
    }
  }
  return mergePropsArgs.length > 1 ? compilerDom.createCallExpression(context.helper(compilerDom.MERGE_PROPS), mergePropsArgs) : mergePropsArgs[0];
}
function isTrueFalseValue(prop) {
  if (prop.type === 7) {
    return prop.name === "bind" && prop.arg && compilerDom.isStaticExp(prop.arg) && (prop.arg.content === "true-value" || prop.arg.content === "false-value");
  } else {
    return prop.name === "true-value" || prop.name === "false-value";
  }
}
function isTextareaWithValue(node, prop) {
  return !!(node.tag === "textarea" && prop.name === "bind" && compilerDom.isStaticArgOf(prop.arg, "value"));
}
function mergeCall(call, arg) {
  const existing = call.arguments[0];
  if (existing.type === 17) {
    existing.elements.push(arg);
  } else {
    call.arguments[0] = compilerDom.createArrayExpression([existing, arg]);
  }
}
function removeStaticBinding(tag, binding) {
  const regExp = new RegExp(`^ ${binding}=".+"$`);
  const i = tag.findIndex((e) => typeof e === "string" && regExp.test(e));
  if (i > -1) {
    tag.splice(i, 1);
  }
}
function findVModel(node) {
  return node.props.find(
    (p) => p.type === 7 && p.name === "model" && p.exp
  );
}
function hasContentOverrideDirective(node) {
  return !!compilerDom.findDir(node, "text") || !!compilerDom.findDir(node, "html");
}
function ssrProcessElement(node, context) {
  const isVoidTag = context.options.isVoidTag || shared$1.NO;
  const elementsToAdd = node.ssrCodegenNode.elements;
  for (let j = 0; j < elementsToAdd.length; j++) {
    context.pushStringPart(elementsToAdd[j]);
  }
  if (context.withSlotScopeId) {
    context.pushStringPart(compilerDom.createSimpleExpression(`_scopeId`, false));
  }
  context.pushStringPart(`>`);
  const rawChildren = rawChildrenMap.get(node);
  if (rawChildren) {
    context.pushStringPart(rawChildren);
  } else if (node.children.length) {
    processChildren(node, context);
  }
  if (!isVoidTag(node.tag)) {
    context.pushStringPart(`</${node.tag}>`);
  }
}

const wipMap$2 = /* @__PURE__ */ new WeakMap();
function ssrTransformTransitionGroup(node, context) {
  return () => {
    const tag = compilerDom.findProp(node, "tag");
    if (tag) {
      const otherProps = node.props.filter((p) => p !== tag);
      const { props, directives } = compilerDom.buildProps(
        node,
        context,
        otherProps,
        true,
        false,
        true
      );
      let propsExp = null;
      if (props || directives.length) {
        propsExp = compilerDom.createCallExpression(context.helper(SSR_RENDER_ATTRS), [
          buildSSRProps(props, directives, context)
        ]);
      }
      wipMap$2.set(node, {
        tag,
        propsExp,
        scopeId: context.scopeId || null
      });
    }
  };
}
function ssrProcessTransitionGroup(node, context) {
  const entry = wipMap$2.get(node);
  if (entry) {
    const { tag, propsExp, scopeId } = entry;
    if (tag.type === 7) {
      context.pushStringPart(`<`);
      context.pushStringPart(tag.exp);
      if (propsExp) {
        context.pushStringPart(propsExp);
      }
      if (scopeId) {
        context.pushStringPart(` ${scopeId}`);
      }
      context.pushStringPart(`>`);
      processChildren(
        node,
        context,
        false,
        /**
         * TransitionGroup has the special runtime behavior of flattening and
         * concatenating all children into a single fragment (in order for them to
         * be patched using the same key map) so we need to account for that here
         * by disabling nested fragment wrappers from being generated.
         */
        true,
        /**
         * TransitionGroup filters out comment children at runtime and thus
         * doesn't expect comments to be present during hydration. We need to
         * account for that by disabling the empty comment that is otherwise
         * rendered for a falsy v-if that has no v-else specified. (#6715)
         */
        true
      );
      context.pushStringPart(`</`);
      context.pushStringPart(tag.exp);
      context.pushStringPart(`>`);
    } else {
      context.pushStringPart(`<${tag.value.content}`);
      if (propsExp) {
        context.pushStringPart(propsExp);
      }
      if (scopeId) {
        context.pushStringPart(` ${scopeId}`);
      }
      context.pushStringPart(`>`);
      processChildren(node, context, false, true, true);
      context.pushStringPart(`</${tag.value.content}>`);
    }
  } else {
    processChildren(node, context, true, true, true);
  }
}

const wipMap$1 = /* @__PURE__ */ new WeakMap();
function ssrTransformTransition(node, context) {
  return () => {
    const appear = compilerDom.findProp(node, "appear", false, true);
    wipMap$1.set(node, !!appear);
  };
}
function ssrProcessTransition(node, context) {
  node.children = node.children.filter((c) => c.type !== 3);
  const appear = wipMap$1.get(node);
  if (appear) {
    context.pushStringPart(`<template>`);
    processChildren(node, context, false, true);
    context.pushStringPart(`</template>`);
  } else {
    processChildren(node, context, false, true);
  }
}

const wipMap = /* @__PURE__ */ new WeakMap();
const WIP_SLOT = /* @__PURE__ */ Symbol();
const componentTypeMap = /* @__PURE__ */ new WeakMap();
const ssrTransformComponent = (node, context) => {
  if (node.type !== 1 || node.tagType !== 1) {
    return;
  }
  const component = compilerDom.resolveComponentType(
    node,
    context,
    true
    /* ssr */
  );
  const isDynamicComponent = shared$1.isObject(component) && component.callee === compilerDom.RESOLVE_DYNAMIC_COMPONENT;
  componentTypeMap.set(node, component);
  if (shared$1.isSymbol(component)) {
    if (component === compilerDom.SUSPENSE) {
      return ssrTransformSuspense(node, context);
    } else if (component === compilerDom.TRANSITION_GROUP) {
      return ssrTransformTransitionGroup(node, context);
    } else if (component === compilerDom.TRANSITION) {
      return ssrTransformTransition(node);
    }
    return;
  }
  const vnodeBranches = [];
  const clonedNode = clone(node);
  return function ssrPostTransformComponent() {
    if (clonedNode.children.length) {
      compilerDom.buildSlots(clonedNode, context, (props, vFor, children) => {
        vnodeBranches.push(
          createVNodeSlotBranch(props, vFor, children, context)
        );
        return compilerDom.createFunctionExpression(void 0);
      });
    }
    let propsExp = `null`;
    if (node.props.length) {
      const { props, directives } = compilerDom.buildProps(
        node,
        context,
        void 0,
        true,
        isDynamicComponent
      );
      if (props || directives.length) {
        propsExp = buildSSRProps(props, directives, context);
      }
    }
    const wipEntries = [];
    wipMap.set(node, wipEntries);
    const buildSSRSlotFn = (props, _vForExp, children, loc) => {
      const param0 = props && compilerDom.stringifyExpression(props) || `_`;
      const fn = compilerDom.createFunctionExpression(
        [param0, `_push`, `_parent`, `_scopeId`],
        void 0,
        // no return, assign body later
        true,
        // newline
        true,
        // isSlot
        loc
      );
      wipEntries.push({
        type: WIP_SLOT,
        fn,
        children,
        // also collect the corresponding vnode branch built earlier
        vnodeBranch: vnodeBranches[wipEntries.length]
      });
      return fn;
    };
    const slots = node.children.length ? compilerDom.buildSlots(node, context, buildSSRSlotFn).slots : `null`;
    if (typeof component !== "string") {
      node.ssrCodegenNode = compilerDom.createCallExpression(
        context.helper(SSR_RENDER_VNODE),
        [
          `_push`,
          compilerDom.createCallExpression(context.helper(compilerDom.CREATE_VNODE), [
            component,
            propsExp,
            slots
          ]),
          `_parent`
        ]
      );
    } else {
      node.ssrCodegenNode = compilerDom.createCallExpression(
        context.helper(SSR_RENDER_COMPONENT),
        [component, propsExp, slots, `_parent`]
      );
    }
  };
};
function ssrProcessComponent(node, context, parent) {
  const component = componentTypeMap.get(node);
  if (!node.ssrCodegenNode) {
    if (component === compilerDom.TELEPORT) {
      return ssrProcessTeleport(node, context);
    } else if (component === compilerDom.SUSPENSE) {
      return ssrProcessSuspense(node, context);
    } else if (component === compilerDom.TRANSITION_GROUP) {
      return ssrProcessTransitionGroup(node, context);
    } else {
      if (parent.type === WIP_SLOT) {
        context.pushStringPart(``);
      }
      if (component === compilerDom.TRANSITION) {
        return ssrProcessTransition(node, context);
      }
      processChildren(node, context);
    }
  } else {
    const wipEntries = wipMap.get(node) || [];
    for (let i = 0; i < wipEntries.length; i++) {
      const { fn, vnodeBranch } = wipEntries[i];
      fn.body = compilerDom.createIfStatement(
        compilerDom.createSimpleExpression(`_push`, false),
        processChildrenAsStatement(
          wipEntries[i],
          context,
          false,
          true
        ),
        vnodeBranch
      );
    }
    if (context.withSlotScopeId) {
      node.ssrCodegenNode.arguments.push(`_scopeId`);
    }
    if (typeof component === "string") {
      context.pushStatement(
        compilerDom.createCallExpression(`_push`, [node.ssrCodegenNode])
      );
    } else {
      context.pushStatement(node.ssrCodegenNode);
    }
  }
}
const rawOptionsMap = /* @__PURE__ */ new WeakMap();
const [baseNodeTransforms, baseDirectiveTransforms] = compilerDom.getBaseTransformPreset(true);
const vnodeNodeTransforms = [...baseNodeTransforms, ...compilerDom.DOMNodeTransforms];
const vnodeDirectiveTransforms = {
  ...baseDirectiveTransforms,
  ...compilerDom.DOMDirectiveTransforms
};
function createVNodeSlotBranch(slotProps, vFor, children, parentContext) {
  const rawOptions = rawOptionsMap.get(parentContext.root);
  const subOptions = {
    ...rawOptions,
    // overwrite with vnode-based transforms
    nodeTransforms: [
      ...vnodeNodeTransforms,
      ...rawOptions.nodeTransforms || []
    ],
    directiveTransforms: {
      ...vnodeDirectiveTransforms,
      ...rawOptions.directiveTransforms || {}
    }
  };
  const wrapperProps = [];
  if (slotProps) {
    wrapperProps.push({
      type: 7,
      name: "slot",
      exp: slotProps,
      arg: void 0,
      modifiers: [],
      loc: compilerDom.locStub
    });
  }
  if (vFor) {
    wrapperProps.push(shared$1.extend({}, vFor));
  }
  const wrapperNode = {
    type: 1,
    ns: 0,
    tag: "template",
    tagType: 3,
    props: wrapperProps,
    children,
    loc: compilerDom.locStub,
    codegenNode: void 0
  };
  subTransform(wrapperNode, subOptions, parentContext);
  return compilerDom.createReturnStatement(children);
}
function subTransform(node, options, parentContext) {
  const childRoot = compilerDom.createRoot([node]);
  const childContext = compilerDom.createTransformContext(childRoot, options);
  childContext.ssr = false;
  childContext.scopes = { ...parentContext.scopes };
  childContext.identifiers = { ...parentContext.identifiers };
  childContext.imports = parentContext.imports;
  compilerDom.traverseNode(childRoot, childContext);
  ["helpers", "components", "directives"].forEach((key) => {
    childContext[key].forEach((value, helperKey) => {
      if (key === "helpers") {
        const parentCount = parentContext.helpers.get(helperKey);
        if (parentCount === void 0) {
          parentContext.helpers.set(helperKey, value);
        } else {
          parentContext.helpers.set(helperKey, value + parentCount);
        }
      } else {
        parentContext[key].add(value);
      }
    });
  });
}
function clone(v) {
  if (shared$1.isArray(v)) {
    return v.map(clone);
  } else if (shared$1.isPlainObject(v)) {
    const res = {};
    for (const key in v) {
      res[key] = clone(v[key]);
    }
    return res;
  } else {
    return v;
  }
}

function ssrCodegenTransform(ast, options) {
  const context = createSSRTransformContext(ast, options);
  if (options.ssrCssVars) {
    const cssContext = compilerDom.createTransformContext(compilerDom.createRoot([]), options);
    const varsExp = compilerDom.processExpression(
      compilerDom.createSimpleExpression(options.ssrCssVars, false),
      cssContext
    );
    context.body.push(
      compilerDom.createCompoundExpression([`const _cssVars = { style: `, varsExp, `}`])
    );
    Array.from(cssContext.helpers.keys()).forEach((helper) => {
      ast.helpers.add(helper);
    });
  }
  const isFragment = ast.children.length > 1 && ast.children.some((c) => !compilerDom.isText(c));
  processChildren(ast, context, isFragment);
  ast.codegenNode = compilerDom.createBlockStatement(context.body);
  ast.ssrHelpers = Array.from(
    /* @__PURE__ */ new Set([
      ...Array.from(ast.helpers).filter((h) => h in ssrHelpers),
      ...context.helpers
    ])
  );
  ast.helpers = new Set(Array.from(ast.helpers).filter((h) => !(h in ssrHelpers)));
}
function createSSRTransformContext(root, options, helpers = /* @__PURE__ */ new Set(), withSlotScopeId = false) {
  const body = [];
  let currentString = null;
  return {
    root,
    options,
    body,
    helpers,
    withSlotScopeId,
    onError: options.onError || ((e) => {
      throw e;
    }),
    helper(name) {
      helpers.add(name);
      return name;
    },
    pushStringPart(part) {
      if (!currentString) {
        const currentCall = compilerDom.createCallExpression(`_push`);
        body.push(currentCall);
        currentString = compilerDom.createTemplateLiteral([]);
        currentCall.arguments.push(currentString);
      }
      const bufferedElements = currentString.elements;
      const lastItem = bufferedElements[bufferedElements.length - 1];
      if (shared$1.isString(part) && shared$1.isString(lastItem)) {
        bufferedElements[bufferedElements.length - 1] += part;
      } else {
        bufferedElements.push(part);
      }
    },
    pushStatement(statement) {
      currentString = null;
      body.push(statement);
    }
  };
}
function createChildContext(parent, withSlotScopeId = parent.withSlotScopeId) {
  return createSSRTransformContext(
    parent.root,
    parent.options,
    parent.helpers,
    withSlotScopeId
  );
}
function processChildren(parent, context, asFragment = false, disableNestedFragments = false, disableComment = false) {
  if (asFragment) {
    context.pushStringPart(`<!--[-->`);
  }
  const { children } = parent;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    switch (child.type) {
      case 1:
        switch (child.tagType) {
          case 0:
            ssrProcessElement(child, context);
            break;
          case 1:
            ssrProcessComponent(child, context, parent);
            break;
          case 2:
            ssrProcessSlotOutlet(child, context);
            break;
          case 3:
            break;
          default:
            context.onError(
              createSSRCompilerError(
                67,
                child.loc
              )
            );
            const exhaustiveCheck2 = child;
            return exhaustiveCheck2;
        }
        break;
      case 2:
        context.pushStringPart(shared$1.escapeHtml(child.content));
        break;
      case 3:
        if (!disableComment) {
          context.pushStringPart(`<!--${child.content}-->`);
        }
        break;
      case 5:
        context.pushStringPart(
          compilerDom.createCallExpression(context.helper(SSR_INTERPOLATE), [
            child.content
          ])
        );
        break;
      case 9:
        ssrProcessIf(child, context, disableNestedFragments, disableComment);
        break;
      case 11:
        ssrProcessFor(child, context, disableNestedFragments);
        break;
      case 10:
        break;
      case 12:
      case 8:
        break;
      default:
        context.onError(
          createSSRCompilerError(
            67,
            child.loc
          )
        );
        const exhaustiveCheck = child;
        return exhaustiveCheck;
    }
  }
  if (asFragment) {
    context.pushStringPart(`<!--]-->`);
  }
}
function processChildrenAsStatement(parent, parentContext, asFragment = false, withSlotScopeId = parentContext.withSlotScopeId) {
  const childContext = createChildContext(parentContext, withSlotScopeId);
  processChildren(parent, childContext, asFragment);
  return compilerDom.createBlockStatement(childContext.body);
}

const ssrTransformModel = (dir, node, context) => {
  const model = dir.exp;
  function checkDuplicatedValue() {
    const value = compilerDom.findProp(node, "value");
    if (value) {
      context.onError(
        compilerDom.createDOMCompilerError(
          61,
          value.loc
        )
      );
    }
  }
  const processSelectChildren = (children) => {
    children.forEach((child) => {
      if (child.type === 1) {
        processOption(child);
      } else if (child.type === 11) {
        processSelectChildren(child.children);
      } else if (child.type === 9) {
        child.branches.forEach((b) => processSelectChildren(b.children));
      }
    });
  };
  function processOption(plainNode) {
    if (plainNode.tag === "option") {
      if (plainNode.props.findIndex((p) => p.name === "selected") === -1) {
        const value = findValueBinding(plainNode);
        plainNode.ssrCodegenNode.elements.push(
          compilerDom.createConditionalExpression(
            compilerDom.createCallExpression(context.helper(SSR_INCLUDE_BOOLEAN_ATTR), [
              compilerDom.createConditionalExpression(
                compilerDom.createCallExpression(`Array.isArray`, [model]),
                compilerDom.createCallExpression(context.helper(SSR_LOOSE_CONTAIN), [
                  model,
                  value
                ]),
                compilerDom.createCallExpression(context.helper(SSR_LOOSE_EQUAL), [
                  model,
                  value
                ])
              )
            ]),
            compilerDom.createSimpleExpression(" selected", true),
            compilerDom.createSimpleExpression("", true),
            false
          )
        );
      }
    } else if (plainNode.tag === "optgroup") {
      processSelectChildren(plainNode.children);
    }
  }
  if (node.tagType === 0) {
    const res = { props: [] };
    if (node.tag === "input") {
      const defaultProps = [
        // default value binding for text type inputs
        compilerDom.createObjectProperty(`value`, model)
      ];
      const type = compilerDom.findProp(node, "type");
      if (type) {
        const value = findValueBinding(node);
        if (type.type === 7) {
          res.ssrTagParts = [
            compilerDom.createCallExpression(context.helper(SSR_RENDER_DYNAMIC_MODEL), [
              type.exp,
              model,
              value
            ])
          ];
        } else if (type.value) {
          switch (type.value.content) {
            case "radio":
              res.props = [
                compilerDom.createObjectProperty(
                  `checked`,
                  compilerDom.createCallExpression(context.helper(SSR_LOOSE_EQUAL), [
                    model,
                    value
                  ])
                )
              ];
              break;
            case "checkbox":
              const trueValueBinding = compilerDom.findProp(node, "true-value");
              if (trueValueBinding) {
                const trueValue = trueValueBinding.type === 6 ? JSON.stringify(trueValueBinding.value.content) : trueValueBinding.exp;
                res.props = [
                  compilerDom.createObjectProperty(
                    `checked`,
                    compilerDom.createCallExpression(context.helper(SSR_LOOSE_EQUAL), [
                      model,
                      trueValue
                    ])
                  )
                ];
              } else {
                res.props = [
                  compilerDom.createObjectProperty(
                    `checked`,
                    compilerDom.createConditionalExpression(
                      compilerDom.createCallExpression(`Array.isArray`, [model]),
                      compilerDom.createCallExpression(context.helper(SSR_LOOSE_CONTAIN), [
                        model,
                        value
                      ]),
                      model
                    )
                  )
                ];
              }
              break;
            case "file":
              context.onError(
                compilerDom.createDOMCompilerError(
                  60,
                  dir.loc
                )
              );
              break;
            default:
              checkDuplicatedValue();
              res.props = defaultProps;
              break;
          }
        }
      } else if (compilerDom.hasDynamicKeyVBind(node)) ; else {
        checkDuplicatedValue();
        res.props = defaultProps;
      }
    } else if (node.tag === "textarea") {
      checkDuplicatedValue();
      node.children = [compilerDom.createInterpolation(model, model.loc)];
    } else if (node.tag === "select") {
      processSelectChildren(node.children);
    } else {
      context.onError(
        compilerDom.createDOMCompilerError(
          58,
          dir.loc
        )
      );
    }
    return res;
  } else {
    return compilerDom.transformModel(dir, node, context);
  }
};
function findValueBinding(node) {
  const valueBinding = compilerDom.findProp(node, "value");
  return valueBinding ? valueBinding.type === 7 ? valueBinding.exp : compilerDom.createSimpleExpression(valueBinding.value.content, true) : compilerDom.createSimpleExpression(`null`, false);
}

const ssrTransformShow = (dir, node, context) => {
  if (!dir.exp) {
    context.onError(
      compilerDom.createDOMCompilerError(62)
    );
  }
  return {
    props: [
      compilerDom.createObjectProperty(
        `style`,
        compilerDom.createConditionalExpression(
          dir.exp,
          compilerDom.createSimpleExpression(`null`, false),
          compilerDom.createObjectExpression([
            compilerDom.createObjectProperty(
              `display`,
              compilerDom.createSimpleExpression(`none`, true)
            )
          ]),
          false
        )
      )
    ]
  };
};

const filterChild = (node) => node.children.filter((n) => !compilerDom.isCommentOrWhitespace(n));
const hasSingleChild = (node) => filterChild(node).length === 1;
const ssrInjectFallthroughAttrs = (node, context) => {
  if (node.type === 0) {
    context.identifiers._attrs = 1;
  }
  if (node.type === 1 && node.tagType === 1 && (node.tag === "transition" || node.tag === "Transition" || node.tag === "KeepAlive" || node.tag === "keep-alive")) {
    const rootChildren = filterChild(context.root);
    if (rootChildren.length === 1 && rootChildren[0] === node) {
      if (hasSingleChild(node)) {
        injectFallthroughAttrs(node.children[0]);
      }
      return;
    }
  }
  const parent = context.parent;
  if (!parent || parent.type !== 0) {
    return;
  }
  if (node.type === 10 && hasSingleChild(node)) {
    let hasEncounteredIf = false;
    for (const c of filterChild(parent)) {
      if (c.type === 9 || c.type === 1 && compilerDom.findDir(c, "if")) {
        if (hasEncounteredIf) return;
        hasEncounteredIf = true;
      } else if (
        // node before v-if
        !hasEncounteredIf || // non else nodes
        !(c.type === 1 && compilerDom.findDir(c, /else/, true))
      ) {
        return;
      }
    }
    injectFallthroughAttrs(node.children[0]);
  } else if (hasSingleChild(parent)) {
    injectFallthroughAttrs(node);
  }
};
function injectFallthroughAttrs(node) {
  if (node.type === 1 && (node.tagType === 0 || node.tagType === 1) && !compilerDom.findDir(node, "for")) {
    node.props.push({
      type: 7,
      name: "bind",
      arg: void 0,
      exp: compilerDom.createSimpleExpression(`_attrs`, false),
      modifiers: [],
      loc: compilerDom.locStub
    });
  }
}

const ssrInjectCssVars = (node, context) => {
  if (!context.ssrCssVars) {
    return;
  }
  if (node.type === 0) {
    context.identifiers._cssVars = 1;
  }
  const parent = context.parent;
  if (!parent || parent.type !== 0) {
    return;
  }
  if (node.type === 10) {
    for (const child of node.children) {
      injectCssVars(child);
    }
  } else {
    injectCssVars(node);
  }
};
function injectCssVars(node) {
  if (node.type === 1 && (node.tagType === 0 || node.tagType === 1) && !compilerDom.findDir(node, "for")) {
    if (node.tag === "suspense" || node.tag === "Suspense") {
      for (const child of node.children) {
        if (child.type === 1 && child.tagType === 3) {
          child.children.forEach(injectCssVars);
        } else {
          injectCssVars(child);
        }
      }
    } else {
      node.props.push({
        type: 7,
        name: "bind",
        arg: void 0,
        exp: compilerDom.createSimpleExpression(`_cssVars`, false),
        modifiers: [],
        loc: compilerDom.locStub
      });
    }
  }
}

function compile(source, options = {}) {
  options = {
    ...options,
    ...compilerDom.parserOptions,
    ssr: true,
    inSSR: true,
    scopeId: options.mode === "function" ? null : options.scopeId,
    // always prefix since compiler-ssr doesn't have size concern
    prefixIdentifiers: true,
    // disable optimizations that are unnecessary for ssr
    cacheHandlers: false,
    hoistStatic: false
  };
  const ast = typeof source === "string" ? compilerDom.baseParse(source, options) : source;
  rawOptionsMap.set(ast, options);
  compilerDom.transform(ast, {
    ...options,
    hoistStatic: false,
    nodeTransforms: [
      compilerDom.transformVBindShorthand,
      ssrTransformIf,
      ssrTransformFor,
      compilerDom.trackVForSlotScopes,
      compilerDom.transformExpression,
      ssrTransformSlotOutlet,
      ssrInjectFallthroughAttrs,
      ssrInjectCssVars,
      ssrTransformElement,
      ssrTransformComponent,
      compilerDom.trackSlotScopes,
      compilerDom.transformStyle,
      ...options.nodeTransforms || []
      // user transforms
    ],
    directiveTransforms: {
      // reusing core v-bind
      bind: compilerDom.transformBind,
      on: compilerDom.transformOn,
      // model and show have dedicated SSR handling
      model: ssrTransformModel,
      show: ssrTransformShow,
      // the following are ignored during SSR
      // on: noopDirectiveTransform,
      cloak: compilerDom.noopDirectiveTransform,
      once: compilerDom.noopDirectiveTransform,
      memo: compilerDom.noopDirectiveTransform,
      ...options.directiveTransforms || {}
      // user transforms
    }
  });
  ssrCodegenTransform(ast, options);
  return compilerDom.generate(ast, options);
}

compilerSsr_cjs.compile = compile;

const require$$3 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(node_stream);

/**
* @vue/server-renderer v3.5.32
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/

Object.defineProperty(serverRenderer_cjs_prod, '__esModule', { value: true });

var Vue = require$$0;
var shared = shared_cjs_prod;
var compilerSsr = compilerSsr_cjs;

function _interopNamespaceDefault$1(e) {
  var n = Object.create(null);
  if (e) {
    for (var k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return Object.freeze(n);
}

var Vue__namespace = /*#__PURE__*/_interopNamespaceDefault$1(Vue);

const shouldIgnoreProp = /* @__PURE__ */ shared.makeMap(
  `,key,ref,innerHTML,textContent,ref_key,ref_for`
);
function ssrRenderAttrs(props, tag) {
  let ret = "";
  for (let key in props) {
    if (shouldIgnoreProp(key) || shared.isOn(key) || tag === "textarea" && key === "value" || // force as property (not rendered in SSR)
    key.startsWith(".")) {
      continue;
    }
    const value = props[key];
    if (key.startsWith("^")) key = key.slice(1);
    if (key === "class") {
      ret += ` class="${ssrRenderClass(value)}"`;
    } else if (key === "style") {
      ret += ` style="${ssrRenderStyle(value)}"`;
    } else if (key === "className") {
      if (value != null) {
        ret += ` class="${shared.escapeHtml(String(value))}"`;
      }
    } else {
      ret += ssrRenderDynamicAttr(key, value, tag);
    }
  }
  return ret;
}
function ssrRenderDynamicAttr(key, value, tag) {
  if (!shared.isRenderableAttrValue(value)) {
    return ``;
  }
  const attrKey = tag && (tag.indexOf("-") > 0 || shared.isSVGTag(tag)) ? key : shared.propsToAttrMap[key] || key.toLowerCase();
  if (shared.isBooleanAttr(attrKey)) {
    return shared.includeBooleanAttr(value) ? ` ${attrKey}` : ``;
  } else if (shared.isSSRSafeAttrName(attrKey)) {
    return value === "" ? ` ${attrKey}` : ` ${attrKey}="${shared.escapeHtml(value)}"`;
  } else {
    console.warn(
      `[@vue/server-renderer] Skipped rendering unsafe attribute name: ${attrKey}`
    );
    return ``;
  }
}
function ssrRenderAttr(key, value) {
  if (!shared.isRenderableAttrValue(value)) {
    return ``;
  }
  return ` ${key}="${shared.escapeHtml(value)}"`;
}
function ssrRenderClass(raw) {
  return shared.escapeHtml(shared.normalizeClass(raw));
}
function ssrRenderStyle(raw) {
  if (!raw) {
    return "";
  }
  if (shared.isString(raw)) {
    return shared.escapeHtml(raw);
  }
  const styles = shared.normalizeStyle(ssrResetCssVars(raw));
  return shared.escapeHtml(shared.stringifyStyle(styles));
}
function ssrResetCssVars(raw) {
  if (!shared.isArray(raw) && shared.isObject(raw)) {
    const res = {};
    for (const key in raw) {
      if (key.startsWith(":--")) {
        res[key.slice(1)] = shared.normalizeCssVarValue(raw[key]);
      } else {
        res[key] = raw[key];
      }
    }
    return res;
  }
  return raw;
}

function ssrRenderComponent(comp, props = null, children = null, parentComponent = null, slotScopeId) {
  return renderComponentVNode(
    Vue.createVNode(comp, props, children),
    parentComponent,
    slotScopeId
  );
}

const { ensureValidVNode } = Vue.ssrUtils;
function ssrRenderSlot(slots, slotName, slotProps, fallbackRenderFn, push, parentComponent, slotScopeId) {
  push(`<!--[-->`);
  ssrRenderSlotInner(
    slots,
    slotName,
    slotProps,
    fallbackRenderFn,
    push,
    parentComponent,
    slotScopeId
  );
  push(`<!--]-->`);
}
function ssrRenderSlotInner(slots, slotName, slotProps, fallbackRenderFn, push, parentComponent, slotScopeId, transition) {
  const slotFn = slots[slotName];
  if (slotFn) {
    const slotBuffer = [];
    const bufferedPush = (item) => {
      slotBuffer.push(item);
    };
    const ret = slotFn(
      slotProps,
      bufferedPush,
      parentComponent,
      slotScopeId ? " " + slotScopeId : ""
    );
    if (shared.isArray(ret)) {
      const validSlotContent = ensureValidVNode(ret);
      if (validSlotContent) {
        renderVNodeChildren(
          push,
          validSlotContent,
          parentComponent,
          slotScopeId
        );
      } else if (fallbackRenderFn) {
        fallbackRenderFn();
      } else if (transition) {
        push(`<!---->`);
      }
    } else {
      let isEmptySlot = true;
      if (transition) {
        isEmptySlot = false;
      } else {
        for (let i = 0; i < slotBuffer.length; i++) {
          if (!isComment(slotBuffer[i])) {
            isEmptySlot = false;
            break;
          }
        }
      }
      if (isEmptySlot) {
        if (fallbackRenderFn) {
          fallbackRenderFn();
        }
      } else {
        let start = 0;
        let end = slotBuffer.length;
        if (transition && slotBuffer[0] === "<!--[-->" && slotBuffer[end - 1] === "<!--]-->") {
          start++;
          end--;
        }
        if (start < end) {
          for (let i = start; i < end; i++) {
            push(slotBuffer[i]);
          }
        } else if (transition) {
          push(`<!---->`);
        }
      }
    }
  } else if (fallbackRenderFn) {
    fallbackRenderFn();
  } else if (transition) {
    push(`<!---->`);
  }
}
const commentTestRE = /^<!--[\s\S]*-->$/;
const commentRE = /<!--[^]*?-->/gm;
function isComment(item) {
  if (typeof item !== "string" || !commentTestRE.test(item)) return false;
  if (item.length <= 8) return true;
  return !item.replace(commentRE, "").trim();
}

function ssrRenderTeleport(parentPush, contentRenderFn, target, disabled, parentComponent) {
  parentPush("<!--teleport start-->");
  const context = parentComponent.appContext.provides[Vue.ssrContextKey];
  const teleportBuffers = context.__teleportBuffers || (context.__teleportBuffers = {});
  const targetBuffer = teleportBuffers[target] || (teleportBuffers[target] = []);
  const bufferIndex = targetBuffer.length;
  let teleportContent;
  if (disabled) {
    contentRenderFn(parentPush);
    teleportContent = `<!--teleport start anchor--><!--teleport anchor-->`;
  } else {
    const { getBuffer, push } = createBuffer();
    push(`<!--teleport start anchor-->`);
    contentRenderFn(push);
    push(`<!--teleport anchor-->`);
    teleportContent = getBuffer();
  }
  targetBuffer.splice(bufferIndex, 0, teleportContent);
  parentPush("<!--teleport end-->");
}

function ssrInterpolate(value) {
  return shared.escapeHtml(shared.toDisplayString(value));
}

function ssrRenderList(source, renderItem) {
  if (shared.isArray(source) || shared.isString(source)) {
    for (let i = 0, l = source.length; i < l; i++) {
      renderItem(source[i], i);
    }
  } else if (typeof source === "number") {
    for (let i = 0; i < source; i++) {
      renderItem(i + 1, i);
    }
  } else if (shared.isObject(source)) {
    if (source[Symbol.iterator]) {
      const arr = Array.from(source);
      for (let i = 0, l = arr.length; i < l; i++) {
        renderItem(arr[i], i);
      }
    } else {
      const keys = Object.keys(source);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        renderItem(source[key], key, i);
      }
    }
  }
}

async function ssrRenderSuspense(push, { default: renderContent }) {
  if (renderContent) {
    renderContent();
  } else {
    push(`<!---->`);
  }
}

function ssrGetDirectiveProps(instance, dir, value, arg, modifiers = {}) {
  if (typeof dir !== "function" && dir.getSSRProps) {
    return dir.getSSRProps(
      {
        dir,
        instance: Vue.ssrUtils.getComponentPublicInstance(instance.$),
        value,
        oldValue: void 0,
        arg,
        modifiers
      },
      null
    ) || {};
  }
  return {};
}

const ssrLooseEqual = shared.looseEqual;
function ssrLooseContain(arr, value) {
  return shared.looseIndexOf(arr, value) > -1;
}
function ssrRenderDynamicModel(type, model, value) {
  switch (type) {
    case "radio":
      return shared.looseEqual(model, value) ? " checked" : "";
    case "checkbox":
      return (shared.isArray(model) ? ssrLooseContain(model, value) : model) ? " checked" : "";
    default:
      return ssrRenderAttr("value", model);
  }
}
function ssrGetDynamicModelProps(existingProps = {}, model) {
  const { type, value } = existingProps;
  switch (type) {
    case "radio":
      return shared.looseEqual(model, value) ? { checked: true } : null;
    case "checkbox":
      return (shared.isArray(model) ? ssrLooseContain(model, value) : model) ? { checked: true } : null;
    default:
      return { value: model };
  }
}

var helpers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ssrGetDirectiveProps: ssrGetDirectiveProps,
  ssrGetDynamicModelProps: ssrGetDynamicModelProps,
  ssrIncludeBooleanAttr: shared.includeBooleanAttr,
  ssrInterpolate: ssrInterpolate,
  ssrLooseContain: ssrLooseContain,
  ssrLooseEqual: ssrLooseEqual,
  ssrRenderAttr: ssrRenderAttr,
  ssrRenderAttrs: ssrRenderAttrs,
  ssrRenderClass: ssrRenderClass,
  ssrRenderComponent: ssrRenderComponent,
  ssrRenderDynamicAttr: ssrRenderDynamicAttr,
  ssrRenderDynamicModel: ssrRenderDynamicModel,
  ssrRenderList: ssrRenderList,
  ssrRenderSlot: ssrRenderSlot,
  ssrRenderSlotInner: ssrRenderSlotInner,
  ssrRenderStyle: ssrRenderStyle,
  ssrRenderSuspense: ssrRenderSuspense,
  ssrRenderTeleport: ssrRenderTeleport,
  ssrRenderVNode: renderVNode
});

const compileCache = /* @__PURE__ */ Object.create(null);
function ssrCompile(template, instance) {
  const Component = instance.type;
  const { isCustomElement, compilerOptions } = instance.appContext.config;
  const { delimiters, compilerOptions: componentCompilerOptions } = Component;
  const finalCompilerOptions = shared.extend(
    shared.extend(
      {
        isCustomElement,
        delimiters
      },
      compilerOptions
    ),
    componentCompilerOptions
  );
  finalCompilerOptions.isCustomElement = finalCompilerOptions.isCustomElement || shared.NO;
  finalCompilerOptions.isNativeTag = finalCompilerOptions.isNativeTag || shared.NO;
  const cacheKey = JSON.stringify(
    {
      template,
      compilerOptions: finalCompilerOptions
    },
    (key, value) => {
      return shared.isFunction(value) ? value.toString() : value;
    }
  );
  const cached = compileCache[cacheKey];
  if (cached) {
    return cached;
  }
  finalCompilerOptions.onError = (err) => {
    {
      throw err;
    }
  };
  const { code } = compilerSsr.compile(template, finalCompilerOptions);
  const requireMap = {
    vue: Vue__namespace,
    "vue/server-renderer": helpers
  };
  const fakeRequire = (id) => requireMap[id];
  return compileCache[cacheKey] = Function("require", code)(fakeRequire);
}

const {
  createComponentInstance,
  setCurrentRenderingInstance,
  setupComponent,
  renderComponentRoot,
  normalizeVNode,
  pushWarningContext,
  popWarningContext
} = Vue.ssrUtils;
function createBuffer() {
  let appendable = false;
  const buffer = [];
  return {
    getBuffer() {
      return buffer;
    },
    push(item) {
      const isStringItem = shared.isString(item);
      if (appendable && isStringItem) {
        buffer[buffer.length - 1] += item;
        return;
      }
      buffer.push(item);
      appendable = isStringItem;
      if (shared.isPromise(item) || shared.isArray(item) && item.hasAsync) {
        buffer.hasAsync = true;
      }
    }
  };
}
function renderComponentVNode(vnode, parentComponent = null, slotScopeId) {
  const instance = vnode.component = createComponentInstance(
    vnode,
    parentComponent,
    null
  );
  const res = setupComponent(
    instance,
    true
    /* isSSR */
  );
  const hasAsyncSetup = shared.isPromise(res);
  let prefetches = instance.sp;
  if (hasAsyncSetup || prefetches) {
    const p = Promise.resolve(res).then(() => {
      if (hasAsyncSetup) prefetches = instance.sp;
      if (prefetches) {
        return Promise.all(
          prefetches.map((prefetch) => prefetch.call(instance.proxy))
        );
      }
    }).catch(shared.NOOP);
    return p.then(() => renderComponentSubTree(instance, slotScopeId));
  } else {
    return renderComponentSubTree(instance, slotScopeId);
  }
}
function renderComponentSubTree(instance, slotScopeId) {
  const comp = instance.type;
  const { getBuffer, push } = createBuffer();
  if (shared.isFunction(comp)) {
    let root = renderComponentRoot(instance);
    if (!comp.props) {
      for (const key in instance.attrs) {
        if (key.startsWith(`data-v-`)) {
          (root.props || (root.props = {}))[key] = ``;
        }
      }
    }
    renderVNode(push, instance.subTree = root, instance, slotScopeId);
  } else {
    if ((!instance.render || instance.render === shared.NOOP) && !instance.ssrRender && !comp.ssrRender && shared.isString(comp.template)) {
      comp.ssrRender = ssrCompile(comp.template, instance);
    }
    const ssrRender = instance.ssrRender || comp.ssrRender;
    if (ssrRender) {
      let attrs = instance.inheritAttrs !== false ? instance.attrs : void 0;
      let hasCloned = false;
      let cur = instance;
      while (true) {
        const scopeId = cur.vnode.scopeId;
        if (scopeId) {
          if (!hasCloned) {
            attrs = { ...attrs };
            hasCloned = true;
          }
          attrs[scopeId] = "";
        }
        const parent = cur.parent;
        if (parent && parent.subTree && parent.subTree === cur.vnode) {
          cur = parent;
        } else {
          break;
        }
      }
      if (slotScopeId) {
        if (!hasCloned) attrs = { ...attrs };
        const slotScopeIdList = slotScopeId.trim().split(" ");
        for (let i = 0; i < slotScopeIdList.length; i++) {
          attrs[slotScopeIdList[i]] = "";
        }
      }
      const prev = setCurrentRenderingInstance(instance);
      try {
        ssrRender(
          instance.proxy,
          push,
          instance,
          attrs,
          // compiler-optimized bindings
          instance.props,
          instance.setupState,
          instance.data,
          instance.ctx
        );
      } finally {
        setCurrentRenderingInstance(prev);
      }
    } else if (instance.render && instance.render !== shared.NOOP) {
      renderVNode(
        push,
        instance.subTree = renderComponentRoot(instance),
        instance,
        slotScopeId
      );
    } else {
      const componentName = comp.name || comp.__file || `<Anonymous>`;
      Vue.warn(`Component ${componentName} is missing template or render function.`);
      push(`<!---->`);
    }
  }
  return getBuffer();
}
function renderVNode(push, vnode, parentComponent, slotScopeId) {
  const { type, shapeFlag, children, dirs, props } = vnode;
  if (dirs) {
    vnode.props = applySSRDirectives(vnode, props, dirs);
  }
  switch (type) {
    case Vue.Text:
      push(shared.escapeHtml(children));
      break;
    case Vue.Comment:
      push(
        children ? `<!--${shared.escapeHtmlComment(children)}-->` : `<!---->`
      );
      break;
    case Vue.Static:
      push(children);
      break;
    case Vue.Fragment:
      if (vnode.slotScopeIds) {
        slotScopeId = (slotScopeId ? slotScopeId + " " : "") + vnode.slotScopeIds.join(" ");
      }
      push(`<!--[-->`);
      renderVNodeChildren(
        push,
        children,
        parentComponent,
        slotScopeId
      );
      push(`<!--]-->`);
      break;
    default:
      if (shapeFlag & 1) {
        renderElementVNode(push, vnode, parentComponent, slotScopeId);
      } else if (shapeFlag & 6) {
        push(renderComponentVNode(vnode, parentComponent, slotScopeId));
      } else if (shapeFlag & 64) {
        renderTeleportVNode(push, vnode, parentComponent, slotScopeId);
      } else if (shapeFlag & 128) {
        renderVNode(push, vnode.ssContent, parentComponent, slotScopeId);
      } else {
        Vue.warn(
          "[@vue/server-renderer] Invalid VNode type:",
          type,
          `(${typeof type})`
        );
      }
  }
}
function renderVNodeChildren(push, children, parentComponent, slotScopeId) {
  for (let i = 0; i < children.length; i++) {
    renderVNode(push, normalizeVNode(children[i]), parentComponent, slotScopeId);
  }
}
function renderElementVNode(push, vnode, parentComponent, slotScopeId) {
  const tag = vnode.type;
  let { props, children, shapeFlag, scopeId } = vnode;
  let openTag = `<${tag}`;
  if (props) {
    openTag += ssrRenderAttrs(props, tag);
  }
  if (scopeId) {
    openTag += ` ${scopeId}`;
  }
  let curParent = parentComponent;
  let curVnode = vnode;
  while (curParent && curVnode === curParent.subTree) {
    curVnode = curParent.vnode;
    if (curVnode.scopeId) {
      openTag += ` ${curVnode.scopeId}`;
    }
    curParent = curParent.parent;
  }
  if (slotScopeId) {
    openTag += ` ${slotScopeId}`;
  }
  push(openTag + `>`);
  if (!shared.isVoidTag(tag)) {
    let hasChildrenOverride = false;
    if (props) {
      if (props.innerHTML) {
        hasChildrenOverride = true;
        push(props.innerHTML);
      } else if (props.textContent) {
        hasChildrenOverride = true;
        push(shared.escapeHtml(props.textContent));
      } else if (tag === "textarea" && props.value) {
        hasChildrenOverride = true;
        push(shared.escapeHtml(props.value));
      }
    }
    if (!hasChildrenOverride) {
      if (shapeFlag & 8) {
        push(shared.escapeHtml(children));
      } else if (shapeFlag & 16) {
        renderVNodeChildren(
          push,
          children,
          parentComponent,
          slotScopeId
        );
      }
    }
    push(`</${tag}>`);
  }
}
function applySSRDirectives(vnode, rawProps, dirs) {
  const toMerge = [];
  for (let i = 0; i < dirs.length; i++) {
    const binding = dirs[i];
    const {
      dir: { getSSRProps }
    } = binding;
    if (getSSRProps) {
      const props = getSSRProps(binding, vnode);
      if (props) toMerge.push(props);
    }
  }
  return Vue.mergeProps(rawProps || {}, ...toMerge);
}
function renderTeleportVNode(push, vnode, parentComponent, slotScopeId) {
  const target = vnode.props && vnode.props.to;
  const disabled = vnode.props && vnode.props.disabled;
  if (!target) {
    if (!disabled) {
      Vue.warn(`[@vue/server-renderer] Teleport is missing target prop.`);
    }
    return [];
  }
  if (!shared.isString(target)) {
    Vue.warn(
      `[@vue/server-renderer] Teleport target must be a query selector string.`
    );
    return [];
  }
  ssrRenderTeleport(
    push,
    (push2) => {
      renderVNodeChildren(
        push2,
        vnode.children,
        parentComponent,
        slotScopeId
      );
    },
    target,
    disabled || disabled === "",
    parentComponent
  );
}

const { isVNode: isVNode$1 } = Vue.ssrUtils;
function nestedUnrollBuffer(buffer, parentRet, startIndex) {
  if (!buffer.hasAsync) {
    return parentRet + unrollBufferSync$1(buffer);
  }
  let ret = parentRet;
  for (let i = startIndex; i < buffer.length; i += 1) {
    const item = buffer[i];
    if (shared.isString(item)) {
      ret += item;
      continue;
    }
    if (shared.isPromise(item)) {
      return item.then((nestedItem) => {
        buffer[i] = nestedItem;
        return nestedUnrollBuffer(buffer, ret, i);
      });
    }
    const result = nestedUnrollBuffer(item, ret, 0);
    if (shared.isPromise(result)) {
      return result.then((nestedItem) => {
        buffer[i] = nestedItem;
        return nestedUnrollBuffer(buffer, "", i);
      });
    }
    ret = result;
  }
  return ret;
}
function unrollBuffer$1(buffer) {
  return nestedUnrollBuffer(buffer, "", 0);
}
function unrollBufferSync$1(buffer) {
  let ret = "";
  for (let i = 0; i < buffer.length; i++) {
    let item = buffer[i];
    if (shared.isString(item)) {
      ret += item;
    } else {
      ret += unrollBufferSync$1(item);
    }
  }
  return ret;
}
async function renderToString(input, context = {}) {
  if (isVNode$1(input)) {
    return renderToString(Vue.createApp({ render: () => input }), context);
  }
  const vnode = Vue.createVNode(input._component, input._props);
  vnode.appContext = input._context;
  input.provide(Vue.ssrContextKey, context);
  const buffer = await renderComponentVNode(vnode);
  const result = await unrollBuffer$1(buffer);
  await resolveTeleports(context);
  if (context.__watcherHandles) {
    for (const unwatch of context.__watcherHandles) {
      unwatch();
    }
  }
  return result;
}
async function resolveTeleports(context) {
  if (context.__teleportBuffers) {
    context.teleports = context.teleports || {};
    for (const key in context.__teleportBuffers) {
      context.teleports[key] = await unrollBuffer$1(
        await Promise.all([context.__teleportBuffers[key]])
      );
    }
  }
}

const { isVNode } = Vue.ssrUtils;
async function unrollBuffer(buffer, stream) {
  if (buffer.hasAsync) {
    for (let i = 0; i < buffer.length; i++) {
      let item = buffer[i];
      if (shared.isPromise(item)) {
        item = await item;
      }
      if (shared.isString(item)) {
        stream.push(item);
      } else {
        await unrollBuffer(item, stream);
      }
    }
  } else {
    unrollBufferSync(buffer, stream);
  }
}
function unrollBufferSync(buffer, stream) {
  for (let i = 0; i < buffer.length; i++) {
    let item = buffer[i];
    if (shared.isString(item)) {
      stream.push(item);
    } else {
      unrollBufferSync(item, stream);
    }
  }
}
function renderToSimpleStream(input, context, stream) {
  if (isVNode(input)) {
    return renderToSimpleStream(
      Vue.createApp({ render: () => input }),
      context,
      stream
    );
  }
  const vnode = Vue.createVNode(input._component, input._props);
  vnode.appContext = input._context;
  input.provide(Vue.ssrContextKey, context);
  Promise.resolve(renderComponentVNode(vnode)).then((buffer) => unrollBuffer(buffer, stream)).then(() => resolveTeleports(context)).then(() => {
    if (context.__watcherHandles) {
      for (const unwatch of context.__watcherHandles) {
        unwatch();
      }
    }
  }).then(() => stream.push(null)).catch((error) => {
    stream.destroy(error);
  });
  return stream;
}
function renderToStream(input, context = {}) {
  console.warn(
    `[@vue/server-renderer] renderToStream is deprecated - use renderToNodeStream instead.`
  );
  return renderToNodeStream(input, context);
}
function renderToNodeStream(input, context = {}) {
  const stream = new (require$$3).Readable({ read() {
  } }) ;
  if (!stream) {
    throw new Error(
      `ESM build of renderToStream() does not support renderToNodeStream(). Use pipeToNodeWritable() with an existing Node.js Writable stream instance instead.`
    );
  }
  return renderToSimpleStream(input, context, stream);
}
function pipeToNodeWritable(input, context = {}, writable) {
  renderToSimpleStream(input, context, {
    push(content) {
      if (content != null) {
        writable.write(content);
      } else {
        writable.end();
      }
    },
    destroy(err) {
      writable.destroy(err);
    }
  });
}
function renderToWebStream(input, context = {}) {
  if (typeof ReadableStream !== "function") {
    throw new Error(
      `ReadableStream constructor is not available in the global scope. If the target environment does support web streams, consider using pipeToWebWritable() with an existing WritableStream instance instead.`
    );
  }
  const encoder = new TextEncoder();
  let cancelled = false;
  return new ReadableStream({
    start(controller) {
      renderToSimpleStream(input, context, {
        push(content) {
          if (cancelled) return;
          if (content != null) {
            controller.enqueue(encoder.encode(content));
          } else {
            controller.close();
          }
        },
        destroy(err) {
          controller.error(err);
        }
      });
    },
    cancel() {
      cancelled = true;
    }
  });
}
function pipeToWebWritable(input, context = {}, writable) {
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let hasReady = false;
  try {
    hasReady = shared.isPromise(writer.ready);
  } catch (e) {
  }
  renderToSimpleStream(input, context, {
    async push(content) {
      if (hasReady) {
        await writer.ready;
      }
      if (content != null) {
        return writer.write(encoder.encode(content));
      } else {
        return writer.close();
      }
    },
    destroy(err) {
      console.log(err);
      writer.close();
    }
  });
}

Vue.initDirectivesForSSR();

var ssrIncludeBooleanAttr = serverRenderer_cjs_prod.ssrIncludeBooleanAttr = shared.includeBooleanAttr;
serverRenderer_cjs_prod.pipeToNodeWritable = pipeToNodeWritable;
serverRenderer_cjs_prod.pipeToWebWritable = pipeToWebWritable;
serverRenderer_cjs_prod.renderToNodeStream = renderToNodeStream;
serverRenderer_cjs_prod.renderToSimpleStream = renderToSimpleStream;
serverRenderer_cjs_prod.renderToStream = renderToStream;
var renderToString_1 = serverRenderer_cjs_prod.renderToString = renderToString;
serverRenderer_cjs_prod.renderToWebStream = renderToWebStream;
serverRenderer_cjs_prod.ssrGetDirectiveProps = ssrGetDirectiveProps;
serverRenderer_cjs_prod.ssrGetDynamicModelProps = ssrGetDynamicModelProps;
var ssrInterpolate_1 = serverRenderer_cjs_prod.ssrInterpolate = ssrInterpolate;
var ssrLooseContain_1 = serverRenderer_cjs_prod.ssrLooseContain = ssrLooseContain;
var ssrLooseEqual_1 = serverRenderer_cjs_prod.ssrLooseEqual = ssrLooseEqual;
var ssrRenderAttr_1 = serverRenderer_cjs_prod.ssrRenderAttr = ssrRenderAttr;
var ssrRenderAttrs_1 = serverRenderer_cjs_prod.ssrRenderAttrs = ssrRenderAttrs;
var ssrRenderClass_1 = serverRenderer_cjs_prod.ssrRenderClass = ssrRenderClass;
var ssrRenderComponent_1 = serverRenderer_cjs_prod.ssrRenderComponent = ssrRenderComponent;
serverRenderer_cjs_prod.ssrRenderDynamicAttr = ssrRenderDynamicAttr;
serverRenderer_cjs_prod.ssrRenderDynamicModel = ssrRenderDynamicModel;
var ssrRenderList_1 = serverRenderer_cjs_prod.ssrRenderList = ssrRenderList;
var ssrRenderSlot_1 = serverRenderer_cjs_prod.ssrRenderSlot = ssrRenderSlot;
serverRenderer_cjs_prod.ssrRenderSlotInner = ssrRenderSlotInner;
var ssrRenderStyle_1 = serverRenderer_cjs_prod.ssrRenderStyle = ssrRenderStyle;
var ssrRenderSuspense_1 = serverRenderer_cjs_prod.ssrRenderSuspense = ssrRenderSuspense;
serverRenderer_cjs_prod.ssrRenderTeleport = ssrRenderTeleport;
var ssrRenderVNode = serverRenderer_cjs_prod.ssrRenderVNode = renderVNode;

const NUXT_RUNTIME_PAYLOAD_EXTRACTION = false;

const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
// @ts-expect-error file will be produced after app build
const getServerEntry = () => import('../build/server.mjs').then(function (n) { return n.s; }).then((r) => r.default || r);
// @ts-expect-error file will be produced after app build
const getPrecomputedDependencies = () => import('../build/client.precomputed.mjs').then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
// -- SSR Renderer --
const getSSRRenderer = lazyCachedFunction(async () => {
	// Load server bundle
	const createSSRApp = await getServerEntry();
	if (!createSSRApp) {
		throw new Error("Server bundle is not available");
	}
	// Load precomputed dependencies
	const precomputed = await getPrecomputedDependencies();
	// Create renderer
	const renderer = createRenderer(createSSRApp, {
		precomputed,
		manifest: undefined,
		renderToString,
		buildAssetsURL
	});
	async function renderToString(input, context) {
		const html = await renderToString_1(input, context);
		return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
	}
	return renderer;
});
// -- SPA Renderer --
const getSPARenderer = lazyCachedFunction(async () => {
	const precomputed = await getPrecomputedDependencies();
	// @ts-expect-error virtual file
	const spaTemplate = await import('../virtual/_virtual_spa-template.mjs').then((r) => r.template).catch(() => "").then((r) => {
		{
			return APP_ROOT_OPEN_TAG + r + APP_ROOT_CLOSE_TAG;
		}
	});
	// Create SPA renderer and cache the result for all requests
	const renderer = createRenderer(() => () => {}, {
		precomputed,
		manifest: undefined,
		renderToString: () => spaTemplate,
		buildAssetsURL
	});
	const result = await renderer.renderToString({});
	const renderToString = (ssrContext) => {
		const config = useRuntimeConfig(ssrContext.event);
		ssrContext.modules ||= new Set();
		ssrContext.payload.serverRendered = false;
		ssrContext.config = {
			public: config.public,
			app: config.app
		};
		return Promise.resolve(result);
	};
	return {
		rendererContext: renderer.rendererContext,
		renderToString
	};
});
function lazyCachedFunction(fn) {
	let res = null;
	return () => {
		if (res === null) {
			res = fn().catch((err) => {
				res = null;
				throw err;
			});
		}
		return res;
	};
}
function getRenderer(ssrContext) {
	return ssrContext.noSSR ? getSPARenderer() : getSSRRenderer();
}
// @ts-expect-error file will be produced after app build
const getSSRStyles = lazyCachedFunction(() => import('../build/styles.mjs').then((r) => r.default || r));

function renderPayloadResponse(ssrContext) {
	return {
		body: encodeForwardSlashes(stringify(splitPayload(ssrContext).payload, ssrContext["~payloadReducers"])) ,
		statusCode: getResponseStatus(ssrContext.event),
		statusMessage: getResponseStatusText(ssrContext.event),
		headers: {
			"content-type": "application/json;charset=utf-8" ,
			"x-powered-by": "Nuxt"
		}
	};
}
function renderPayloadJsonScript(opts) {
	const contents = opts.data ? encodeForwardSlashes(stringify(opts.data, opts.ssrContext["~payloadReducers"])) : "";
	const payload = {
		"type": "application/json",
		"innerHTML": contents,
		"data-nuxt-data": appId,
		"data-ssr": !(opts.ssrContext.noSSR)
	};
	{
		payload.id = "__NUXT_DATA__";
	}
	if (opts.src) {
		payload["data-src"] = opts.src;
	}
	const config = uneval(opts.ssrContext.config);
	return [payload, { innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}` }];
}
/**
* Encode forward slashes as unicode escape sequences to prevent
* Google from treating them as internal links and trying to crawl them.
* @see https://github.com/nuxt/nuxt/issues/24175
*/
function encodeForwardSlashes(str) {
	return str.replaceAll("/", "\\u002F");
}
function splitPayload(ssrContext) {
	const { data, prerenderedAt, ...initial } = ssrContext.payload;
	return {
		initial: {
			...initial,
			prerenderedAt
		},
		payload: {
			data,
			prerenderedAt
		}
	};
}

const unheadOptions = {
  disableDefaults: true,
  disableCapoSorting: false,
  plugins: [DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin],
};

function createSSRContext(event) {
	const ssrContext = {
		url: event.path,
		event,
		runtimeConfig: useRuntimeConfig(event),
		noSSR: event.context.nuxt?.noSSR || (false),
		head: createHead(unheadOptions),
		error: false,
		nuxt: undefined,
		payload: {},
		["~payloadReducers"]: Object.create(null),
		modules: new Set()
	};
	return ssrContext;
}
function setSSRError(ssrContext, error) {
	ssrContext.error = true;
	ssrContext.payload = { error };
	ssrContext.url = error.url;
}

async function renderInlineStyles(usedModules) {
	const styleMap = await getSSRStyles();
	const inlinedStyles = new Set();
	for (const mod of usedModules) {
		if (mod in styleMap && styleMap[mod]) {
			for (const style of await styleMap[mod]()) {
				inlinedStyles.add(style);
			}
		}
	}
	return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}

const renderSSRHeadOptions = {};

const entryIds = ["node_modules/nuxt/dist/app/entry.js"];

// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__buildAssetsURL = buildAssetsURL;
// @ts-expect-error private property consumed by vite-generated url helpers
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const PAYLOAD_URL_RE = /^[^?]*\/_payload.json(?:\?.*)?$/ ;
const PAYLOAD_FILENAME = "_payload.json" ;
const handler = defineRenderHandler(async (event) => {
	const nitroApp = useNitroApp();
	// Whether we're rendering an error page
	const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery(event) : null;
	if (ssrError && !("__unenv__" in event.node.req)) {
		throw createError({
			status: 404,
			statusText: "Page Not Found: /__nuxt_error",
			message: "Page Not Found: /__nuxt_error"
		});
	}
	// Initialize ssr context
	const ssrContext = createSSRContext(event);
	// needed for hash hydration plugin to work
	const headEntryOptions = { mode: "server" };
	ssrContext.head.push(appHead, headEntryOptions);
	if (ssrError) {
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		const status = ssrError.status || ssrError.statusCode;
		if (status) {
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			ssrError.status = ssrError.statusCode = Number.parseInt(status);
		}
		setSSRError(ssrContext, ssrError);
	}
	// Get route options (for `ssr: false`, `isr`, `cache` and `noScripts`)
	const routeOptions = getRouteRules(event);
	// Whether we are prerendering route or using ISR/SWR caching
	const _PAYLOAD_EXTRACTION = !ssrContext.noSSR && (NUXT_RUNTIME_PAYLOAD_EXTRACTION);
	const isRenderingPayload = (_PAYLOAD_EXTRACTION || false) && PAYLOAD_URL_RE.test(ssrContext.url);
	if (isRenderingPayload) {
		const url = ssrContext.url.substring(0, ssrContext.url.lastIndexOf("/")) || "/";
		ssrContext.url = url;
		event._path = event.node.req.url = url;
	}
	if (routeOptions.ssr === false) {
		ssrContext.noSSR = true;
	}
	const payloadURL = _PAYLOAD_EXTRACTION ? joinURL(ssrContext.runtimeConfig.app.cdnURL || ssrContext.runtimeConfig.app.baseURL, ssrContext.url.replace(/\?.*$/, ""), PAYLOAD_FILENAME) + "?" + ssrContext.runtimeConfig.app.buildId : undefined;
	// Render app
	const renderer = await getRenderer(ssrContext);
	{
		for (const id of entryIds) {
			ssrContext.modules.add(id);
		}
	}
	const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
		// We use error to bypass full render if we have an early response we can make
		// TODO: remove _renderResponse in nuxt v5
		if ((ssrContext["~renderResponse"] || ssrContext._renderResponse) && error.message === "skipping render") {
			return {};
		}
		// Use explicitly thrown error in preference to subsequent rendering errors
		const _err = !ssrError && ssrContext.payload?.error || error;
		await ssrContext.nuxt?.hooks.callHook("app:error", _err);
		throw _err;
	});
	// Render inline styles
	// TODO: remove _renderResponse in nuxt v5
	const inlinedStyles = !ssrContext["~renderResponse"] && !ssrContext._renderResponse && !isRenderingPayload ? await renderInlineStyles(ssrContext.modules ?? []) : [];
	await ssrContext.nuxt?.hooks.callHook("app:rendered", {
		ssrContext,
		renderResult: _rendered
	});
	if (ssrContext["~renderResponse"] || ssrContext._renderResponse) {
		// TODO: remove _renderResponse in nuxt v5
		return ssrContext["~renderResponse"] || ssrContext._renderResponse;
	}
	// Handle errors
	if (ssrContext.payload?.error && !ssrError) {
		throw ssrContext.payload.error;
	}
	// Directly render payload routes
	if (isRenderingPayload) {
		const response = renderPayloadResponse(ssrContext);
		return response;
	}
	const NO_SCRIPTS = routeOptions.noScripts;
	// Setup head
	const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
	// 1. Preload payloads and app manifest
	if (_PAYLOAD_EXTRACTION && !NO_SCRIPTS) {
		ssrContext.head.push({ link: [{
			rel: "preload",
			as: "fetch",
			crossorigin: "anonymous",
			href: payloadURL
		} ] }, headEntryOptions);
	}
	if (ssrContext["~preloadManifest"] && !NO_SCRIPTS) {
		ssrContext.head.push({ link: [{
			rel: "preload",
			as: "fetch",
			fetchpriority: "low",
			crossorigin: "anonymous",
			href: buildAssetsURL(`builds/meta/${ssrContext.runtimeConfig.app.buildId}.json`)
		}] }, {
			...headEntryOptions,
			tagPriority: "low"
		});
	}
	// 2. Styles
	if (inlinedStyles.length) {
		ssrContext.head.push({ style: inlinedStyles });
	}
	const link = [];
	for (const resource of Object.values(styles)) {
		// Add CSS links in <head> for CSS files
		// - in production
		// - in dev mode when not rendering an island
		link.push({
			rel: "stylesheet",
			href: renderer.rendererContext.buildAssetsURL(resource.file),
			crossorigin: ""
		});
	}
	if (link.length) {
		ssrContext.head.push({ link }, headEntryOptions);
	}
	if (!NO_SCRIPTS) {
		// 4. Resource Hints
		// Remove lazy hydrated modules from ssrContext.modules so they don't get preloaded
		// (CSS links are already added above, this only affects JS preloads)
		if (ssrContext["~lazyHydratedModules"]) {
			for (const id of ssrContext["~lazyHydratedModules"]) {
				ssrContext.modules?.delete(id);
			}
		}
		// TODO: add priorities based on Capo
		ssrContext.head.push({ link: getPreloadLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		ssrContext.head.push({ link: getPrefetchLinks(ssrContext, renderer.rendererContext) }, headEntryOptions);
		// 5. Payloads
		ssrContext.head.push({ script: _PAYLOAD_EXTRACTION ? renderPayloadJsonScript({
			ssrContext,
			data: splitPayload(ssrContext).initial,
			src: payloadURL
		})  : renderPayloadJsonScript({
			ssrContext,
			data: ssrContext.payload
		})  }, {
			...headEntryOptions,
			tagPosition: "bodyClose",
			tagPriority: "high"
		});
	}
	// 6. Scripts
	if (!routeOptions.noScripts) {
		const tagPosition = "head";
		ssrContext.head.push({ script: Object.values(scripts).map((resource) => ({
			type: resource.module ? "module" : null,
			src: renderer.rendererContext.buildAssetsURL(resource.file),
			defer: resource.module ? null : true,
			tagPosition,
			crossorigin: ""
		})) }, headEntryOptions);
	}
	const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
	// Create render context
	const htmlContext = {
		htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
		head: normalizeChunks([headTags]),
		bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
		bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
		body: [_rendered.html, APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG],
		bodyAppend: [bodyTags]
	};
	// Allow hooking into the rendered result
	await nitroApp.hooks.callHook("render:html", htmlContext, { event });
	// Construct HTML response
	return {
		body: renderHTMLDocument(htmlContext),
		statusCode: getResponseStatus(event),
		statusMessage: getResponseStatusText(event),
		headers: {
			"content-type": "text/html;charset=utf-8",
			"x-powered-by": "Nuxt"
		}
	};
});
function normalizeChunks(chunks) {
	const result = [];
	for (const _chunk of chunks) {
		const chunk = _chunk?.trim();
		if (chunk) {
			result.push(chunk);
		}
	}
	return result;
}
function joinTags(tags) {
	return tags.join("");
}
function joinAttrs(chunks) {
	if (chunks.length === 0) {
		return "";
	}
	return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
	return "<!DOCTYPE html>" + `<html${joinAttrs(html.htmlAttrs)}>` + `<head>${joinTags(html.head)}</head>` + `<body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body>` + "</html>";
}

const renderer = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: handler
}, Symbol.toStringTag, { value: 'Module' }));

export { ssrRenderComponent_1 as a, ssrRenderVNode as b, ssrRenderAttrs_1 as c, ssrRenderStyle_1 as d, ssrInterpolate_1 as e, ssrRenderList_1 as f, ssrRenderClass_1 as g, headSymbol as h, ssrIncludeBooleanAttr as i, ssrLooseContain_1 as j, ssrLooseEqual_1 as k, ssrRenderAttr_1 as l, ssrRenderSlot_1 as m, renderer as n, require$$0 as r, ssrRenderSuspense_1 as s, useHead as u };
//# sourceMappingURL=renderer.mjs.map
