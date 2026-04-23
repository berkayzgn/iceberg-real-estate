import { p as pinia_prod, c as useRuntimeConfig } from '../build/server.mjs';
import { v as vueExports } from '../nitro/nitro.mjs';
import { r as require$$0 } from '../routes/renderer.mjs';

const STAGE_LABELS = {
  agreement: "Anla\u015Fma",
  earnest_money: "Kapora",
  title_deed: "Tapu",
  completed: "Tamamland\u0131"
};
const STAGE_ORDER = ["agreement", "earnest_money", "title_deed", "completed"];
const STAGE_COLORS = {
  agreement: { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  earnest_money: { bg: "#FEF3C7", text: "#B45309", dot: "#D97706" },
  title_deed: { bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" }
};
function getNextStage(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}
function calculateCommission(transaction) {
  const total = transaction.transactionValue;
  const company = total * 0.5;
  const agentTotal = total * 0.5;
  const isSameAgent = transaction.listingAgentId === transaction.sellingAgentId;
  return {
    total,
    company,
    agentTotal,
    listingAgent: isSameAgent ? agentTotal : agentTotal * 0.5,
    sellingAgent: isSameAgent ? 0 : agentTotal * 0.5,
    isSameAgent
  };
}
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function timeAgo(dateStr) {
  const now = /* @__PURE__ */ new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1e3);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}
function getAgentStats(agentId, transactions) {
  const agentTxns = transactions.filter(
    (t) => t.listingAgentId === agentId || t.sellingAgentId === agentId
  );
  let totalEarnings = 0;
  agentTxns.forEach((t) => {
    const comm = calculateCommission(t);
    if (t.listingAgentId === agentId) totalEarnings += comm.listingAgent;
    if (t.sellingAgentId === agentId && !comm.isSameAgent) totalEarnings += comm.sellingAgent;
  });
  const completedTxns = agentTxns.filter((t) => t.stage === "completed");
  const listingCount = transactions.filter((t) => t.listingAgentId === agentId).length;
  const sellingCount = transactions.filter((t) => t.sellingAgentId === agentId && t.sellingAgentId !== t.listingAgentId).length;
  return { totalTransactions: agentTxns.length, totalEarnings, completedTransactions: completedTxns.length, listingCount, sellingCount };
}
function mapAgentId(input) {
  var _a;
  if (typeof input === "string") return input;
  return String((_a = input == null ? void 0 : input._id) != null ? _a : "");
}
function mapActivityLog(tx) {
  var _a, _b, _c, _d;
  const stageEntries = (_b = (_a = tx.stageHistory) == null ? void 0 : _a.map((entry, index) => ({
    id: `al-${tx._id}-${index + 1}`,
    timestamp: entry.changedAt,
    type: "stage_change",
    description: entry.note || (entry.fromStage === entry.toStage ? "Agreement signed. Transaction created." : `A\u015Fama g\xFCncellendi: ${STAGE_LABELS[entry.fromStage]} -> ${STAGE_LABELS[entry.toStage]}`),
    fromStage: entry.fromStage,
    toStage: entry.toStage
  }))) != null ? _b : [];
  if (tx.commissionBreakdown) {
    stageEntries.push({
      id: `al-${tx._id}-financial`,
      timestamp: (_d = (_c = tx.completedAt) != null ? _c : tx.createdAt) != null ? _d : (/* @__PURE__ */ new Date()).toISOString(),
      type: "financial",
      description: tx.commissionBreakdown.reason
    });
  }
  return stageEntries.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
function mapTransaction(tx) {
  var _a;
  return {
    id: String(tx._id),
    propertyAddress: tx.propertyAddress,
    propertyType: tx.propertyType,
    transactionValue: tx.transactionValue,
    stage: tx.stage,
    listingAgentId: mapAgentId(tx.listingAgent),
    sellingAgentId: mapAgentId(tx.sellingAgent),
    date: ((_a = tx.createdAt) != null ? _a : (/* @__PURE__ */ new Date()).toISOString()).slice(0, 10),
    activityLog: mapActivityLog(tx)
  };
}
const useTransactionsStore = pinia_prod.defineStore("transactions", () => {
  const transactions = vueExports.ref([]);
  const loading = vueExports.ref(false);
  const loaded = vueExports.ref(false);
  const apiBase = () => useRuntimeConfig().public.apiBase;
  function findById(id) {
    return transactions.value.find((t) => t.id === id);
  }
  function upsertTransaction(mapped) {
    const idx = transactions.value.findIndex((t) => t.id === mapped.id);
    if (idx === -1) {
      transactions.value.unshift(mapped);
      return mapped;
    }
    transactions.value[idx] = mapped;
    return mapped;
  }
  async function fetchAll(force = false) {
    if (loading.value) return;
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const list = await $fetch(`${apiBase()}/transactions`);
      transactions.value = list.map(mapTransaction);
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }
  async function fetchById(id) {
    const tx = await $fetch(`${apiBase()}/transactions/${id}`);
    return upsertTransaction(mapTransaction(tx));
  }
  async function addTransaction(input) {
    const created = await $fetch(`${apiBase()}/transactions`, {
      method: "POST",
      body: {
        propertyAddress: input.propertyAddress,
        propertyType: input.propertyType,
        transactionValue: input.transactionValue,
        listingAgent: input.listingAgentId,
        sellingAgent: input.sellingAgentId
      }
    });
    loaded.value = true;
    return upsertTransaction(mapTransaction(created));
  }
  async function advanceStage(id) {
    const t = findById(id);
    if (!t) return null;
    const next = getNextStage(t.stage);
    if (!next) return null;
    const updated = await $fetch(`${apiBase()}/transactions/${id}/stage`, {
      method: "PATCH",
      body: { stage: next }
    });
    return upsertTransaction(mapTransaction(updated));
  }
  async function setStage(id, stage) {
    const t = findById(id);
    if (!t) return null;
    if (t.stage === stage) return t;
    const updated = await $fetch(`${apiBase()}/transactions/${id}/stage`, {
      method: "PATCH",
      body: { stage, note: "Stage updated via board drag and drop." }
    });
    return upsertTransaction(mapTransaction(updated));
  }
  async function removeTransaction(id) {
    await $fetch(`${apiBase()}/transactions/${id}`, { method: "DELETE" });
    transactions.value = transactions.value.filter((t) => t.id !== id);
  }
  function clear() {
    transactions.value = [];
    loaded.value = false;
    loading.value = false;
  }
  return {
    transactions,
    loading,
    loaded,
    findById,
    fetchAll,
    fetchById,
    addTransaction,
    advanceStage,
    setStage,
    removeTransaction,
    clear
  };
});
const useToastStore = pinia_prod.defineStore("toast", () => {
  const toasts = vueExports.ref([]);
  function push(item, ttlMs = 2600) {
    var _a;
    const id = (_a = item.id) != null ? _a : `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    toasts.value.unshift({ ...item, id });
    setTimeout(() => dismiss(id), ttlMs);
    return id;
  }
  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }
  function success(message, title) {
    return push({ kind: "success", message, title });
  }
  function error(message, title) {
    return push({ kind: "error", message, title });
  }
  function info(message, title) {
    return push({ kind: "info", message, title });
  }
  return { toasts, push, dismiss, success, error, info };
});
const AVATAR_COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];
function makeInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "NA";
  return parts.map((p) => {
    var _a, _b;
    return (_b = (_a = p[0]) == null ? void 0 : _a.toUpperCase()) != null ? _b : "";
  }).join("");
}
function splitName(name) {
  var _a, _b;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: (_a = parts[0]) != null ? _a : name.trim(), lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: (_b = parts[parts.length - 1]) != null ? _b : ""
  };
}
function colorFromId(id) {
  var _a;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return (_a = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]) != null ? _a : "#64748B";
}
function mapApiAgent(agent) {
  var _a;
  const fullName = ((_a = agent.fullName) == null ? void 0 : _a.trim()) || `${agent.firstName} ${agent.lastName}`.trim();
  return {
    id: String(agent._id),
    name: fullName,
    initials: makeInitials(fullName),
    avatarColor: colorFromId(String(agent._id)),
    title: agent.title,
    email: agent.email,
    phone: agent.phone,
    joinDate: agent.createdAt ? new Date(agent.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) : "",
    specialization: agent.specialization
  };
}
const useAgentsStore = pinia_prod.defineStore("agents", () => {
  const agents = vueExports.ref([]);
  const loading = vueExports.ref(false);
  const loaded = vueExports.ref(false);
  const apiBase = () => useRuntimeConfig().public.apiBase;
  function findById(id) {
    return agents.value.find((a) => a.id === id);
  }
  async function fetchAll(force = false) {
    if (loading.value) return;
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const data = await $fetch(`${apiBase()}/agents`);
      agents.value = data.map(mapApiAgent);
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }
  async function addAgent(input) {
    const { firstName, lastName } = splitName(input.name);
    const created = await $fetch(`${apiBase()}/agents`, {
      method: "POST",
      body: {
        firstName,
        lastName: lastName || "Agent",
        title: input.title.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        specialization: input.specialization.trim()
      }
    });
    const mapped = mapApiAgent(created);
    agents.value.unshift(mapped);
    loaded.value = true;
    return mapped;
  }
  async function removeAgent(id) {
    await $fetch(`${apiBase()}/agents/${id}`, { method: "DELETE" });
    agents.value = agents.value.filter((a) => a.id !== id);
  }
  function clear() {
    agents.value = [];
    loaded.value = false;
    loading.value = false;
  }
  return {
    agents,
    loading,
    loaded,
    findById,
    fetchAll,
    addAgent,
    removeAgent,
    clear
  };
});

/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

var vue = require$$0;

const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

const isEmptyString = (value) => value === "";

const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

const toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);

const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

const Icon = ({
  name,
  iconNode,
  absoluteStrokeWidth,
  "absolute-stroke-width": absoluteStrokeWidthKebabCase,
  strokeWidth,
  "stroke-width": strokeWidthKebabCase,
  size = defaultAttributes.width,
  color = defaultAttributes.stroke,
  ...props
}, { slots }) => {
  return vue.h(
    "svg",
    {
      ...defaultAttributes,
      ...props,
      width: size,
      height: size,
      stroke: color,
      "stroke-width": isEmptyString(absoluteStrokeWidth) || isEmptyString(absoluteStrokeWidthKebabCase) || absoluteStrokeWidth === true || absoluteStrokeWidthKebabCase === true ? Number(strokeWidth || strokeWidthKebabCase || defaultAttributes["stroke-width"]) * 24 / Number(size) : strokeWidth || strokeWidthKebabCase || defaultAttributes["stroke-width"],
      class: mergeClasses(
        "lucide",
        props.class,
        ...name ? [`lucide-${toKebabCase(toPascalCase(name))}-icon`, `lucide-${toKebabCase(name)}`] : ["lucide-icon"]
      ),
      ...!slots.default && !hasA11yProp(props) && { "aria-hidden": "true" }
    },
    [...iconNode.map((child) => vue.h(...child)), ...slots.default ? [slots.default()] : []]
  );
};

const createLucideIcon = (iconName, iconNode) => (props, { slots, attrs }) => vue.h(
  Icon,
  {
    ...attrs,
    ...props,
    iconNode,
    name: iconName
  },
  slots
);

const ArrowLeft = createLucideIcon("arrow-left", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);

const ArrowRight = createLucideIcon("arrow-right", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
]);

const ArrowUpDown = createLucideIcon("arrow-up-down", [
  ["path", { d: "m21 16-4 4-4-4", key: "f6ql7i" }],
  ["path", { d: "M17 20V4", key: "1ejh1v" }],
  ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }],
  ["path", { d: "M7 4v16", key: "1glfcx" }]
]);

const Award = createLucideIcon("award", [
  [
    "path",
    {
      d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
      key: "1yiouv"
    }
  ],
  ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
]);

const Building2 = createLucideIcon("building-2", [
  ["path", { d: "M10 12h4", key: "a56b0p" }],
  ["path", { d: "M10 8h4", key: "1sr2af" }],
  ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3", key: "1rgiei" }],
  [
    "path",
    {
      d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
      key: "secmi2"
    }
  ],
  ["path", { d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16", key: "16ra0t" }]
]);

const Calendar = createLucideIcon("calendar", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
]);

const ChartColumn = createLucideIcon("chart-column", [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
]);

const ChevronLeft = createLucideIcon("chevron-left", [
  ["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]
]);

const ChevronRight = createLucideIcon("chevron-right", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);

const CircleAlert = createLucideIcon("circle-alert", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);

const CircleCheckBig = createLucideIcon("circle-check-big", [
  ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335", key: "yps3ct" }],
  ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
]);

const Clock = createLucideIcon("clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
]);

const DollarSign = createLucideIcon("dollar-sign", [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
  ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
]);

const Download = createLucideIcon("download", [
  ["path", { d: "M12 15V3", key: "m9g1x1" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
]);

const FileText = createLucideIcon("file-text", [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
]);

const FileX = createLucideIcon("file-x", [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "m14.5 12.5-5 5", key: "b62r18" }],
  ["path", { d: "m9.5 12.5 5 5", key: "1rk7el" }]
]);

const Funnel = createLucideIcon("funnel", [
  [
    "path",
    {
      d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
      key: "sc7q7i"
    }
  ]
]);

const House = createLucideIcon("house", [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "r6nss1"
    }
  ]
]);

const Languages = createLucideIcon("languages", [
  ["path", { d: "m5 8 6 6", key: "1wu5hv" }],
  ["path", { d: "m4 14 6-6 2-3", key: "1k1g8d" }],
  ["path", { d: "M2 5h12", key: "or177f" }],
  ["path", { d: "M7 2h1", key: "1t2jsx" }],
  ["path", { d: "m22 22-5-10-5 10", key: "don7ne" }],
  ["path", { d: "M14 18h6", key: "1m8k6r" }]
]);

const LayoutDashboard = createLucideIcon("layout-dashboard", [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
]);

const Mail = createLucideIcon("mail", [
  ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
  ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }]
]);

const Phone = createLucideIcon("phone", [
  [
    "path",
    {
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
      key: "9njp5v"
    }
  ]
]);

const Plus = createLucideIcon("plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);

const Search = createLucideIcon("search", [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
]);

const SlidersHorizontal = createLucideIcon("sliders-horizontal", [
  ["path", { d: "M10 5H3", key: "1qgfaw" }],
  ["path", { d: "M12 19H3", key: "yhmn1j" }],
  ["path", { d: "M14 3v4", key: "1sua03" }],
  ["path", { d: "M16 17v4", key: "1q0r14" }],
  ["path", { d: "M21 12h-9", key: "1o4lsq" }],
  ["path", { d: "M21 19h-5", key: "1rlt1p" }],
  ["path", { d: "M21 5h-7", key: "1oszz2" }],
  ["path", { d: "M8 10v4", key: "tgpxqk" }],
  ["path", { d: "M8 12H3", key: "a7s4jb" }]
]);

const Trash2 = createLucideIcon("trash-2", [
  ["path", { d: "M10 11v6", key: "nco0om" }],
  ["path", { d: "M14 11v6", key: "outv1u" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
]);

const TrendingUp = createLucideIcon("trending-up", [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
]);

const Users = createLucideIcon("users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
]);

const X = createLucideIcon("x", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
var AlertCircle = CircleAlert;
var ArrowLeft_1 = ArrowLeft;
var ArrowRight_1 = ArrowRight;
var ArrowUpDown_1 = ArrowUpDown;
var Award_1 = Award;
var BarChart3 = ChartColumn;
var Building2_1 = Building2;
var Calendar_1 = Calendar;
var CheckCircle = CircleCheckBig;
var ChevronLeft_1 = ChevronLeft;
var ChevronRight_1 = ChevronRight;
var Clock_1 = Clock;
var DollarSign_1 = DollarSign;
var Download_1 = Download;
var FileText_1 = FileText;
var FileX_1 = FileX;
var Filter = Funnel;
var Home = House;
var Languages_1 = Languages;
var LayoutDashboard_1 = LayoutDashboard;
var Mail_1 = Mail;
var Phone_1 = Phone;
var Plus_1 = Plus;
var Search_1 = Search;
var SlidersHorizontal_1 = SlidersHorizontal;
var Trash2_1 = Trash2;
var TrendingUp_1 = TrendingUp;
var Users_1 = Users;
var X_1 = X;

export { ArrowRight_1 as A, Building2_1 as B, Clock_1 as C, Download_1 as D, DollarSign_1 as E, Filter as F, Languages_1 as G, Home as H, LayoutDashboard_1 as L, Mail_1 as M, Plus_1 as P, STAGE_ORDER as S, TrendingUp_1 as T, Users_1 as U, X_1 as X, useToastStore as a, useAgentsStore as b, calculateCommission as c, STAGE_COLORS as d, ArrowLeft_1 as e, formatCurrency as f, getAgentStats as g, Phone_1 as h, Award_1 as i, ChevronRight_1 as j, getNextStage as k, Calendar_1 as l, Trash2_1 as m, CheckCircle as n, AlertCircle as o, Search_1 as p, SlidersHorizontal_1 as q, FileX_1 as r, ArrowUpDown_1 as s, timeAgo as t, useTransactionsStore as u, formatDate as v, STAGE_LABELS as w, FileText_1 as x, BarChart3 as y, ChevronLeft_1 as z };
//# sourceMappingURL=lucide-vue-next.mjs.map
