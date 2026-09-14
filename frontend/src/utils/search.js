export const norm = (v) => (v ?? "").toString().toLowerCase().trim();
export const includesQ = (text, q) => norm(text).includes(norm(q));