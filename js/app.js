(function () {
  "use strict";

  const CONFIG = Object.assign(
    {
      shopName: "Shop",
      currencySymbol: "$",
      web3formsAccessKey: "",
      pickupNote: "",
      contactLabel: "Phone or Instagram",
      maxQtyPerLine: 5,
    },
    window.SHOP_CONFIG
  );
  const PRODUCTS = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];

  const CART_KEY = "scent-shop-cart-v1";
  const WEB3FORMS_URL = "https://api.web3forms.com/submit";
  const DEMO_MODE = !/^[0-9a-f-]{20,}$/i.test(String(CONFIG.web3formsAccessKey).trim());

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const money = (n) => CONFIG.currencySymbol + Number(n).toFixed(2);
  const ARROW = '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3.5 2.5h6v6M9.5 2.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  // Opens in a new tab so the shopper keeps their bag. Only https links are rendered.
  function extLink(url, label, className = "") {
    if (!/^https:\/\//i.test(url || "")) return esc(label);
    // Keep the arrow on the same line as the last word.
    const cut = label.lastIndexOf(" ") + 1;
    const text = `${esc(label.slice(0, cut))}<span class="nowrap">${esc(label.slice(cut))}${ARROW}</span>`;
    return `<a class="${className}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
  }

  const productById = new Map(PRODUCTS.map((p) => [p.id, p]));
  const sizeOf = (p, label) => (p ? p.sizes.find((s) => s.label === label) : undefined);
  const isAvailable = (p) => Boolean(p) && p.inStock !== false;
  const minPrice = (p) => Math.min(...p.sizes.map((s) => s.price));

  // ---------- Bottle illustration ----------
  const SHAPES = {
    classic: { body: '<rect x="28" y="46" width="64" height="98" rx="10"/>', label: [40, 82, 40, 26], hl: [36, 54, 6, 82] },
    tall: { body: '<rect x="36" y="46" width="48" height="98" rx="6"/>', label: [42, 80, 36, 28], hl: [42, 52, 5, 86] },
    round: { body: '<circle cx="60" cy="100" r="44"/>', label: [40, 89, 40, 22], hl: [26, 84, 6, 32] },
    square: { body: '<rect x="24" y="46" width="72" height="96" rx="4"/>', label: [36, 80, 48, 26], hl: [31, 53, 6, 82] },
  };
  let svgSeq = 0;

  function monogram(p) {
    if (p.mono) return p.mono;
    const brand = String(p.brand || "");
    return brand.length <= 9 ? brand : brand.split(/\s+/).map((w) => w[0]).join("");
  }

  function bottleSVG(p) {
    const shape = SHAPES[p.shape] || SHAPES.classic;
    const color = p.color || "#8a7f70";
    const cap = p.capColor || "#1b1b1d";
    const gid = "liquid" + ++svgSeq;
    const mono = monogram(p).toUpperCase();
    const [lx, ly, lw, lh] = shape.label;
    const [hx, hy, hw, hh] = shape.hl;
    const fontSize = Math.min(7.5, (lw - 6) / (mono.length * 0.72));
    return `
      <svg class="bottle" viewBox="0 0 120 160" role="img" aria-label="${esc(p.brand + " " + p.name)}">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${esc(color)}" stop-opacity=".72"/>
            <stop offset="1" stop-color="${esc(color)}"/>
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="152" rx="38" ry="4" fill="rgba(0,0,0,.12)"/>
        <rect x="52" y="32" width="16" height="16" fill="#d8d2c6"/>
        <rect x="45" y="8" width="30" height="27" rx="3" fill="${esc(cap)}"/>
        <rect x="49" y="11" width="4" height="21" rx="2" fill="#fff" opacity=".18"/>
        <g fill="url(#${gid})">${shape.body}</g>
        <rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="3" fill="#fff" opacity=".28"/>
        <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="1.5" fill="#f7f4ee" opacity=".92"/>
        <text x="60" y="${ly + lh / 2 + fontSize * 0.36}" text-anchor="middle" font-family="Inter, sans-serif"
          font-weight="600" font-size="${fontSize.toFixed(2)}" letter-spacing=".6" fill="#1d1b17">${esc(mono)}</text>
      </svg>`;
  }

  // Photo if the product has one, otherwise the drawn bottle. Both sit in the
  // same square frame; mediaClass tells the frame which it is holding.
  function mediaHTML(p, eager = false) {
    if (p.image)
      return `<img src="${esc(p.image)}" alt="${esc(p.brand + " " + p.name)}" width="1000" height="1000" decoding="async"${eager ? "" : ' loading="lazy"'}>`;
    return bottleSVG(p);
  }
  const mediaClass = (p) => (p.image ? "is-photo" : "is-drawn");

  // ---------- Cart state ----------
  let cart = loadCart();

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((l) => {
          const p = productById.get(l.id);
          return isAvailable(p) && sizeOf(p, l.size) && Number.isInteger(l.qty) && l.qty > 0;
        })
        .map((l) => ({ id: l.id, size: l.size, qty: Math.min(l.qty, CONFIG.maxQtyPerLine) }));
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      // Storage blocked (private mode etc.): the bag still works for this visit.
    }
  }

  function cartLines() {
    return cart.map((l) => {
      const product = productById.get(l.id);
      const price = sizeOf(product, l.size).price;
      return { ...l, product, price, total: price * l.qty };
    });
  }
  const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = () => cartLines().reduce((n, l) => n + l.total, 0);
  const findLine = (id, size) => cart.findIndex((l) => l.id === id && l.size === size);

  function addToCart(id, size) {
    const p = productById.get(id);
    if (!isAvailable(p) || !sizeOf(p, size)) return;
    const idx = findLine(id, size);
    if (idx > -1) {
      if (cart[idx].qty >= CONFIG.maxQtyPerLine) {
        toast(`Max ${CONFIG.maxQtyPerLine} of each scent per order`);
        return;
      }
      cart[idx].qty += 1;
    } else {
      cart.push({ id, size, qty: 1 });
    }
    commitCart();
    bumpBadge();
    toast(`Added ${p.name} (${size})`, "View bag", openBag);
  }

  function setQty(id, size, qty) {
    const idx = findLine(id, size);
    if (idx === -1) return;
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = Math.min(qty, CONFIG.maxQtyPerLine);
    commitCart();
  }

  function commitCart() {
    saveCart();
    renderBag();
  }

  // ---------- Product grid ----------
  const grid = $("#product-grid");
  const filters = { family: "All", query: "", sort: "featured" };
  const chosenSize = new Map();
  const WARM = "Warmer weather";
  const SUN = '<svg class="chip-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function visibleProducts() {
    const q = filters.query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (filters.family === WARM) {
        if (!p.warmWeather) return false;
      } else if (filters.family !== "All" && p.family !== filters.family) return false;
      if (!q) return true;
      const inspo = p.inspiredBy ? [p.inspiredBy.brand, p.inspiredBy.name] : [];
      return [p.brand, p.name, p.family, ...(p.notes || []), ...inspo].join(" ").toLowerCase().includes(q);
    });
    if (filters.sort === "price-asc") list.sort((a, b) => minPrice(a) - minPrice(b));
    if (filters.sort === "price-desc") list.sort((a, b) => minPrice(b) - minPrice(a));
    if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    // Sold-out items always sit at the end.
    return list.sort((a, b) => isAvailable(b) - isAvailable(a));
  }

  const productHref = (p) => `#scent/${encodeURIComponent(p.id)}`;

  function cardHTML(p) {
    const available = isAvailable(p);
    const price = p.sizes.length > 1 ? `From ${money(minPrice(p))}` : money(minPrice(p));
    const inspo = p.inspiredBy
      ? `<p class="card-inspo">Inspired by ${extLink(p.inspiredBy.parfumo, `${p.inspiredBy.brand} ${p.inspiredBy.name}`)}</p>`
      : "";
    // The name link stretches over the whole card; the inspired-by link sits above it.
    return `
      <article class="card${available ? "" : " is-soldout"}">
        <div class="card-media ${mediaClass(p)}">${mediaHTML(p)}</div>
        <div class="card-body">
          <p class="card-brand">${esc(p.brand)}</p>
          <h3 class="card-name"><a class="card-main-link" href="${productHref(p)}">${esc(p.name)}</a></h3>
          ${inspo}
          <p class="card-price">${available ? price : "Sold out"}</p>
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = visibleProducts();
    grid.innerHTML = list.length
      ? list.map(cardHTML).join("")
      : '<p class="empty-results">No scents match that. Try a different search or filter.</p>';
    $("#result-count").textContent = `${list.length} scent${list.length === 1 ? "" : "s"}`;
  }

  function renderFilters() {
    const families = ["All", ...(PRODUCTS.some((p) => p.warmWeather) ? [WARM] : []), ...new Set(PRODUCTS.map((p) => p.family).filter(Boolean))];
    const warmCount = PRODUCTS.filter((p) => p.warmWeather).length;
    $("#family-filters").innerHTML = families
      .map((f) =>
        f === WARM
          ? `<button type="button" class="chip chip-warm" data-family="${esc(f)}" aria-pressed="${f === filters.family}">${SUN}${esc(f)}<span class="chip-count">${warmCount}</span></button>`
          : `<button type="button" class="chip" data-family="${esc(f)}" aria-pressed="${f === filters.family}">${esc(f)}</button>`
      )
      .join("");
  }

  // ---------- Product page ----------
  const homeView = $("#home-view");
  const productView = $("#product-view");
  let homeScroll = 0;

  function productPageHTML(p) {
    const available = isAvailable(p);
    const current = chosenSize.get(p.id) || p.sizes[0].label;
    const sizes = p.sizes
      .map(
        (s) =>
          `<button type="button" class="size-opt" role="radio" aria-checked="${s.label === current}" data-size="${esc(s.label)}"${available ? "" : " disabled"}>${esc(s.label)}<span>${money(s.price)}</span></button>`
      )
      .join("");
    const inspo = p.inspiredBy
      ? `<div><dt>Inspired by</dt><dd>${extLink(p.inspiredBy.parfumo, `${p.inspiredBy.brand} ${p.inspiredBy.name}`)}
           <small>A dupe made by ${esc(p.brand)} to smell similar. Not the original.</small></dd></div>`
      : "<div><dt>Type</dt><dd>Designer original</dd></div>";
    return `
      <div class="container product">
        <a class="back-link" href="#shop">&larr; All scents</a>
        <div class="product-layout">
          <div class="product-media ${mediaClass(p)}">${mediaHTML(p, true)}</div>
          <div class="product-info" data-id="${esc(p.id)}">
            <p class="card-brand">${esc(p.brand)}${p.badge && available ? ` · ${esc(p.badge)}` : ""}</p>
            <h1 tabindex="-1">${esc(p.name)}</h1>
            ${p.vibe ? `<p class="product-vibe">${esc(p.vibe)}.</p>` : ""}
            <p class="product-price" data-price>${money(sizeOf(p, current).price)}</p>
            <p class="picker-label" id="size-label">Size</p>
            <div class="size-picker" role="radiogroup" aria-labelledby="size-label">${sizes}</div>
            <button type="button" class="btn btn-dark btn-block" data-add${available ? "" : " disabled"}>${available ? "Add to bag" : "Sold out"}</button>
            <p class="fine">No payment now. Pay in person when you collect.</p>
            <dl class="facts">
              <div><dt>Scent family</dt><dd>${esc(p.family || "")}</dd></div>
              <div><dt>Main notes</dt><dd>${(p.notes || []).map(esc).join(", ")}</dd></div>
              ${inspo}
              ${p.parfumo ? `<div><dt>Reviews</dt><dd>${extLink(p.parfumo, "Read reviews on Parfumo")}</dd></div>` : ""}
            </dl>
          </div>
        </div>
      </div>`;
  }

  function showProduct(id) {
    const p = productById.get(id);
    if (!homeView.hidden) homeScroll = window.scrollY;
    homeView.hidden = true;
    productView.hidden = false;
    productView.innerHTML = p
      ? productPageHTML(p)
      : `<div class="container product"><a class="back-link" href="#shop">&larr; All scents</a>
           <h1 tabindex="-1">Scent not found</h1><p class="product-vibe">It may have sold out or been removed.</p></div>`;
    document.title = p ? `${p.brand} ${p.name} | ${CONFIG.shopName}` : `Not found | ${CONFIG.shopName}`;
    window.scrollTo({ top: 0, behavior: "instant" });
    productView.querySelector("h1").focus({ preventScroll: true });
  }

  function showHome() {
    const fromProduct = homeView.hidden;
    productView.hidden = true;
    productView.innerHTML = "";
    homeView.hidden = false;
    document.title = `${CONFIG.shopName} | ${CONFIG.heroTitle || "Fragrance"}`;
    if (!fromProduct) return;
    const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: homeScroll, behavior: "instant" });
  }

  function route() {
    const match = location.hash.match(/^#scent\/(.+)$/);
    if (match) showProduct(decodeURIComponent(match[1]));
    else showHome();
  }

  window.addEventListener("hashchange", route);

  productView.addEventListener("click", (e) => {
    const info = e.target.closest(".product-info");
    if (!info) return;
    const p = productById.get(info.dataset.id);
    const sizeBtn = e.target.closest("[data-size]");
    if (sizeBtn) {
      chosenSize.set(p.id, sizeBtn.dataset.size);
      info.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-checked", String(b === sizeBtn)));
      info.querySelector("[data-price]").textContent = money(sizeOf(p, sizeBtn.dataset.size).price);
      return;
    }
    if (e.target.closest("[data-add]")) addToCart(p.id, chosenSize.get(p.id) || p.sizes[0].label);
  });

  $("#family-filters").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-family]");
    if (!chip) return;
    filters.family = chip.dataset.family;
    renderFilters();
    renderGrid();
  });

  $("#search").addEventListener("input", (e) => {
    filters.query = e.target.value;
    renderGrid();
  });

  $("#sort").addEventListener("change", (e) => {
    filters.sort = e.target.value;
    renderGrid();
  });

  // ---------- Bag drawer ----------
  const drawer = $("#bag-drawer");
  const overlay = $("#overlay");
  const modal = $("#checkout-modal");
  const badgeEl = $("#bag-count");
  let returnFocusTo = null;

  function lineHTML(l) {
    const p = l.product;
    return `
      <li class="bag-line" data-id="${esc(l.id)}" data-size="${esc(l.size)}">
        <div class="line-media ${mediaClass(p)}">${mediaHTML(p)}</div>
        <div class="line-info">
          <p class="line-brand">${esc(p.brand)}</p>
          <p class="line-name">${esc(p.name)}</p>
          <p class="line-meta">${esc(l.size)} · ${money(l.price)}</p>
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" data-qty="-1" aria-label="Decrease quantity">&minus;</button>
            <span>${l.qty}</span>
            <button type="button" data-qty="1" aria-label="Increase quantity"${l.qty >= CONFIG.maxQtyPerLine ? " disabled" : ""}>+</button>
          </div>
        </div>
        <div class="line-end">
          <span class="line-total">${money(l.total)}</span>
          <button type="button" class="link-btn" data-remove>Remove</button>
        </div>
      </li>`;
  }

  function renderBag() {
    const lines = cartLines();
    const count = cartCount();
    badgeEl.textContent = count;
    badgeEl.hidden = count === 0;
    $("#bag-open").setAttribute("aria-label", `Open bag, ${count} item${count === 1 ? "" : "s"}`);
    $("#bag-lines").innerHTML = lines.length
      ? lines.map(lineHTML).join("")
      : `<li class="bag-empty">
           <p>Your bag is empty.</p>
           <a class="btn btn-outline" href="#shop" data-close-bag>Shop the range</a>
         </li>`;
    $("#bag-subtotal").textContent = money(cartTotal());
    $("#bag-foot").hidden = lines.length === 0;
  }

  function bumpBadge() {
    badgeEl.classList.remove("bump");
    void badgeEl.offsetWidth; // restart the animation
    badgeEl.classList.add("bump");
  }

  $("#bag-lines").addEventListener("click", (e) => {
    if (e.target.closest("[data-close-bag]")) {
      closeBag(false);
      return;
    }
    const li = e.target.closest(".bag-line");
    if (!li) return;
    const { id, size } = li.dataset;
    const line = cart[findLine(id, size)];
    if (!line) return;
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) setQty(id, size, line.qty + Number(qtyBtn.dataset.qty));
    else if (e.target.closest("[data-remove]")) setQty(id, size, 0);
  });

  // While the bag or checkout is open, freeze the page behind it so
  // scrolling and Tab stay inside the panel.
  function lockScroll(locked) {
    document.body.classList.toggle("no-scroll", locked);
    document.querySelectorAll(".site-header, main, .site-footer").forEach((el) => (el.inert = locked));
  }

  function openBag() {
    if (!drawer.inert) return;
    returnFocusTo = toastEl.contains(document.activeElement) ? $("#bag-open") : document.activeElement;
    drawer.inert = false;
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    lockScroll(true);
    $("#bag-close").focus();
  }

  function closeBag(restoreFocus = true) {
    if (drawer.inert) return;
    drawer.inert = true;
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    lockScroll(false);
    if (restoreFocus && returnFocusTo) returnFocusTo.focus();
  }

  $("#bag-open").addEventListener("click", openBag);
  $("#bag-close").addEventListener("click", () => closeBag());
  overlay.addEventListener("click", () => closeBag());

  // ---------- Checkout ----------
  const form = $("#checkout-form");
  const placeBtn = $("#place-order");
  const errorEl = $("#form-error");
  let placing = false;

  function summaryHTML(lines) {
    return lines
      .map(
        (l) => `
        <li>
          <div class="sum-media ${mediaClass(l.product)}">
            ${mediaHTML(l.product)}<span class="sum-qty">${l.qty}</span>
          </div>
          <div class="sum-info">
            <p class="line-name">${esc(l.product.brand)} ${esc(l.product.name)}</p>
            <p class="line-meta">${esc(l.size)}</p>
          </div>
          <span class="sum-price">${money(l.total)}</span>
        </li>`
      )
      .join("");
  }

  function renderCheckout() {
    const lines = cartLines();
    $("#summary-lines").innerHTML = summaryHTML(lines);
    $("#summary-total").textContent = money(cartTotal());
    placeBtn.querySelector(".btn-label").textContent = `Place order · ${money(cartTotal())}`;
  }

  function openCheckout() {
    if (!cart.length) return;
    closeBag(false);
    renderCheckout();
    errorEl.textContent = "";
    $("#checkout-view").hidden = false;
    $("#success-view").hidden = true;
    modal.inert = false;
    modal.classList.add("is-open");
    lockScroll(true);
    form.querySelector('[name="name"]').focus();
  }

  function closeCheckout() {
    if (modal.inert || placing) return;
    modal.inert = true;
    modal.classList.remove("is-open");
    lockScroll(false);
    $("#bag-open").focus();
  }

  $("#checkout-open").addEventListener("click", openCheckout);
  $("#checkout-close").addEventListener("click", closeCheckout);
  $("#success-done").addEventListener("click", closeCheckout);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeCheckout();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modal.inert) closeCheckout();
    else if (!drawer.inert) closeBag();
  });

  function makeOrderId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => chars[n % chars.length]).join("");
  }

  function buildOrder(details) {
    const lines = cartLines();
    const total = cartTotal();
    const id = makeOrderId();
    const items = lines
      .map((l) => `${l.qty} x ${l.product.brand} ${l.product.name} (${l.size}) = ${money(l.total)}${l.product.owner ? ` [${l.product.owner}'s stock]` : ""}`)
      .join("\n");

    const email = {
      subject: `New order #${id} from ${details.name} (${money(total)})`,
      from_name: `${CONFIG.shopName} website`,
      "Order number": `#${id}`,
      "Customer name": details.name,
    };
    email["Email"] = details.email;
    email.email = details.email; // lets you hit Reply in the order email
    email[CONFIG.contactLabel] = details.contact || "Not given";
    email["Items"] = items;
    email["Item count"] = String(cartCount());
    email["Total to collect"] = money(total);
    email["Notes"] = details.notes || "None";
    email["Placed at"] = new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });

    return { id, lines, total, name: details.name, email };
  }

  async function sendOrder(order) {
    if (DEMO_MODE) {
      console.info("[demo mode] This order would be emailed:", order.email);
      await new Promise((r) => setTimeout(r, 900));
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: CONFIG.web3formsAccessKey.trim(), ...order.email }),
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) throw new Error(body.message || `HTTP ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }

  function setPlacing(on) {
    placing = on;
    placeBtn.disabled = on;
    placeBtn.classList.toggle("is-loading", on);
    if (on) placeBtn.querySelector(".btn-label").textContent = "Processing…";
    else renderCheckout();
  }

  function showSuccess(order) {
    $("#success-lead").textContent = `Thanks, ${order.name}. Your order is in.`;
    $("#success-id").textContent = `#${order.id}`;
    $("#success-lines").innerHTML = summaryHTML(order.lines);
    $("#success-total").textContent = money(order.total);
    $("#checkout-view").hidden = true;
    $("#success-view").hidden = false;
    $("#success-title").focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (placing || !cart.length) return;
    const data = new FormData(form);
    if (data.get("botcheck")) return;

    const details = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      notes: String(data.get("notes") || "").trim(),
    };

    errorEl.textContent = "";
    const order = buildOrder(details);
    setPlacing(true);
    try {
      await sendOrder(order);
      cart = [];
      commitCart();
      form.reset();
      setPlacing(false);
      showSuccess(order);
    } catch (err) {
      console.error("Order failed:", err);
      setPlacing(false);
      errorEl.textContent = "We couldn't place your order. Check your connection and try again.";
    }
  });

  // ---------- Toast ----------
  const toastEl = $("#toast");
  let toastTimer;

  function toast(message, actionLabel, action) {
    toastEl.innerHTML = `<span>${esc(message)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ""}`;
    if (action) toastEl.querySelector("button").addEventListener("click", () => { hideToast(); action(); });
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3200);
  }

  function hideToast() {
    toastEl.classList.remove("is-visible");
  }

  // ---------- Hero ----------
  // Shows up to three in-stock products: photographed ones first, then badged.
  function renderHero() {
    const score = (p) => (p.image ? 2 : 0) + (p.badge ? 1 : 0);
    const picks = PRODUCTS.filter(isAvailable)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 3);
    $("#hero-visual").innerHTML = picks
      .map((p) => `<div class="hero-bottle${p.image ? " hero-photo" : ""}">${mediaHTML(p, true)}</div>`)
      .join("");
  }

  // ---------- Init ----------
  function applyConfig() {
    document.querySelectorAll("[data-shop-name]").forEach((el) => (el.textContent = CONFIG.shopName));
    const text = { "[data-hero-eyebrow]": CONFIG.heroEyebrow, "[data-hero-title]": CONFIG.heroTitle, "[data-hero-subtitle]": CONFIG.heroSubtitle, "#pickup-note": CONFIG.pickupNote, "#contact-label": CONFIG.contactLabel };
    Object.entries(text).forEach(([sel, value]) => {
      if (value) $(sel).textContent = value;
    });
    document.title = `${CONFIG.shopName} | ${CONFIG.heroTitle || "Fragrance"}`;
    $("#footer-year").textContent = new Date().getFullYear();
    $("#demo-banner").hidden = !DEMO_MODE;
  }

  applyConfig();
  renderHero();
  renderFilters();
  renderGrid();
  renderBag();
  route();
})();
