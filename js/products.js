// ─────────────────────────────────────────────────────────────
//  YOUR RANGE — add, remove or edit products here.
//
//  id        unique, lowercase, no spaces
//  brand     shown above the name
//  name      product name
//  family    used for the filter buttons (Fresh, Sweet, Woody, …)
//  vibe      one short line under the name (optional)
//  notes     main scent notes
//  sizes     every option the customer can pick, each with its price
//  inStock   set to false to show "Sold out"
//  badge     optional label on the card, e.g. "Best seller", "New", "Low stock"
//
//  Look of the bottle illustration (ignored if you set `image`):
//  color     liquid colour      capColor  cap colour
//  shape     classic | tall | round | square
//  mono      short text on the label (defaults to the brand, or its initials)
//
//  image     optional path to a real photo, e.g. "images/sauvage.jpg"
// ─────────────────────────────────────────────────────────────
window.PRODUCTS = [
  {
    id: "dior-sauvage-edt",
    brand: "Dior",
    name: "Sauvage EDT",
    family: "Fresh",
    vibe: "The everyday crowd-pleaser",
    notes: ["Bergamot", "Pepper", "Ambroxan"],
    sizes: [
      { label: "5ml", price: 12 },
      { label: "10ml", price: 20 },
    ],
    badge: "Best seller",
    color: "#35577c",
    capColor: "#1b1b1d",
    shape: "square",
    inStock: true,
  },
  {
    id: "chanel-bleu-edp",
    brand: "Chanel",
    name: "Bleu de Chanel EDP",
    family: "Woody",
    vibe: "Clean and classy, works anywhere",
    notes: ["Grapefruit", "Incense", "Sandalwood"],
    sizes: [
      { label: "5ml", price: 14 },
      { label: "10ml", price: 24 },
    ],
    color: "#1f2d4d",
    capColor: "#141416",
    shape: "classic",
    inStock: true,
  },
  {
    id: "jpg-le-male-elixir",
    brand: "Jean Paul Gaultier",
    name: "Le Male Elixir",
    family: "Sweet",
    vibe: "Loud, sweet, built for nights out",
    notes: ["Lavender", "Honey", "Tobacco"],
    sizes: [
      { label: "5ml", price: 14 },
      { label: "10ml", price: 24 },
    ],
    badge: "Hot",
    color: "#c8932c",
    capColor: "#2a2a2a",
    shape: "round",
    inStock: true,
  },
  {
    id: "ysl-y-edp",
    brand: "YSL",
    name: "Y EDP",
    family: "Fresh",
    vibe: "Fresh with a sweet edge",
    notes: ["Apple", "Sage", "Tonka"],
    sizes: [
      { label: "5ml", price: 12 },
      { label: "10ml", price: 20 },
    ],
    color: "#272c38",
    capColor: "#b9b9bd",
    shape: "tall",
    inStock: true,
  },
  {
    id: "versace-eros-edt",
    brand: "Versace",
    name: "Eros EDT",
    family: "Sweet",
    vibe: "Party-ready and long-lasting",
    notes: ["Mint", "Green apple", "Vanilla"],
    sizes: [
      { label: "5ml", price: 10 },
      { label: "10ml", price: 18 },
    ],
    color: "#2a8a86",
    capColor: "#c9a54e",
    shape: "tall",
    inStock: true,
  },
  {
    id: "armani-adg-profondo",
    brand: "Giorgio Armani",
    name: "Acqua di Giò Profondo",
    family: "Aquatic",
    vibe: "Cool, blue, made for summer",
    notes: ["Sea notes", "Bergamot", "Patchouli"],
    sizes: [
      { label: "5ml", price: 12 },
      { label: "10ml", price: 20 },
    ],
    color: "#2c6f9f",
    capColor: "#1d2833",
    shape: "classic",
    inStock: true,
  },
  {
    id: "valentino-bir-intense",
    brand: "Valentino",
    name: "Born in Roma Intense",
    family: "Sweet",
    vibe: "Smooth vanilla, big compliments",
    notes: ["Vanilla", "Lavender", "Vetiver"],
    sizes: [
      { label: "5ml", price: 14 },
      { label: "10ml", price: 24 },
    ],
    badge: "New",
    color: "#2d2645",
    capColor: "#8c7a52",
    shape: "classic",
    inStock: true,
  },
  {
    id: "azzaro-most-wanted",
    brand: "Azzaro",
    name: "The Most Wanted Intense",
    family: "Spicy",
    vibe: "Warm and addictive for cold days",
    notes: ["Cardamom", "Toffee", "Amberwood"],
    sizes: [
      { label: "5ml", price: 10 },
      { label: "10ml", price: 18 },
    ],
    color: "#7c2222",
    capColor: "#1a1a1a",
    shape: "square",
    inStock: true,
  },
  {
    id: "prada-luna-rossa-carbon",
    brand: "Prada",
    name: "Luna Rossa Carbon",
    family: "Fresh",
    vibe: "Sleek, clean, easy to wear",
    notes: ["Bergamot", "Lavender", "Ambroxan"],
    sizes: [
      { label: "5ml", price: 10 },
      { label: "10ml", price: 18 },
    ],
    color: "#3b3e44",
    capColor: "#c7372f",
    shape: "tall",
    inStock: true,
  },
  {
    id: "creed-aventus",
    brand: "Creed",
    name: "Aventus",
    family: "Woody",
    vibe: "The legend. Premium pick.",
    notes: ["Pineapple", "Birch", "Musk"],
    sizes: [
      { label: "5ml", price: 25 },
      { label: "10ml", price: 45 },
    ],
    badge: "Premium",
    color: "#2b2b2d",
    capColor: "#c3c3c6",
    shape: "classic",
    inStock: true,
  },
  {
    id: "dior-homme-intense",
    brand: "Dior",
    name: "Homme Intense",
    family: "Woody",
    vibe: "Powdery and refined, for formal nights",
    notes: ["Iris", "Ambrette", "Cedar"],
    sizes: [
      { label: "5ml", price: 14 },
      { label: "10ml", price: 24 },
    ],
    color: "#6b5e57",
    capColor: "#1b1b1d",
    shape: "tall",
    inStock: true,
  },
  {
    id: "vr-spicebomb-extreme",
    brand: "Viktor&Rolf",
    name: "Spicebomb Extreme",
    family: "Spicy",
    vibe: "Cosy tobacco and spice",
    notes: ["Tobacco", "Cinnamon", "Vanilla"],
    sizes: [
      { label: "5ml", price: 12 },
      { label: "10ml", price: 20 },
    ],
    color: "#1e1e20",
    capColor: "#a0282a",
    shape: "round",
    mono: "V&R",
    inStock: false,
  },
];
