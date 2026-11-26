// k6 load test (T6.2): shoppers browsing, searching and opening products
// (with live stock data) through Caddy, as on the server, ramping to 50
// virtual users. Pass marks are the agreed targets: p95 under 3 s for every
// request (NFR) and under 1% errors (LLD 19). Overselling on launch day is
// covered by the 5,000-buyer integration test in the backend.
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8080";
const API = `${BASE}/api/v1`;

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
    "http_req_duration{kind:api}": ["p(95)<3000"],
    "http_req_duration{kind:page}": ["p(95)<3000"],
  },
};

const terms = ["phone", "power bank", "laptop", "watch", "speaker", "tv", "earbuds"];

export function setup() {
  const res = http.get(`${API}/products?inStock=true`);
  return { products: res.json("items").map((p) => ({ slug: p.slug, id: p.id })) };
}

export default function shopper({ products }) {
  group("home", () => {
    check(http.get(`${BASE}/`, { tags: { kind: "page" } }), { "home 200": (r) => r.status === 200 });
    http.get(`${API}/categories`, { tags: { kind: "api" } });
  });
  group("search", () => {
    const q = encodeURIComponent(terms[Math.floor(Math.random() * terms.length)]);
    check(http.get(`${API}/products?q=${q}`, { tags: { kind: "api" } }), { "search 200": (r) => r.status === 200 });
  });
  if (products.length) {
    group("product", () => {
      const p = products[Math.floor(Math.random() * products.length)];
      check(http.get(`${BASE}/p/${p.slug}`, { tags: { kind: "page" } }), {
        "product page 200": (r) => r.status === 200,
      });
      check(http.get(`${API}/products/${p.id}/live`, { tags: { kind: "api" } }), {
        "live data 200": (r) => r.status === 200,
      });
    });
  }
  sleep(1);
}
