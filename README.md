# Scent Society: school cologne shop

A shop website for selling fragrances at school. Customers browse the range, add scents to a bag and check out with a **Place order** button, like a normal online store. No payment happens on the site. When they place an order, **you get an email** with their name, year/homeroom, contact details, items and total. They pay you in person when they collect.

It's plain HTML/CSS/JS: no build step, no server, and free to host.

```
index.html        page layout
css/styles.css    styling
js/config.js      shop name, text, email key   ← edit this
js/products.js    your range and prices        ← edit this
js/app.js         bag, checkout, order email
```

## 1. Turn on order emails (5 minutes)

1. Go to **https://web3forms.com**, enter the email address you want orders sent to, and click *Create Access Key*.
2. Open the email they send you and copy the Access Key (it looks like `a1b2c3d4-...`).
3. Paste it into `js/config.js`:
   ```js
   web3formsAccessKey: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
   ```

Until you do this the site runs in **demo mode**: a yellow banner shows at the top, and checkout works but no email is sent. The banner disappears once a key is set.

The free plan allows 250 orders a month. Each email looks like this:

```
Subject: New order #Q5WXP6 from Sam Taylor ($34.00)

Order number:        #Q5WXP6
Customer name:       Sam Taylor
Year / homeroom:     Year 11
Phone or Instagram:  @samt
Items:               2 x Lattafa Khamrah (10ml) = $26.00
                     1 x Armaf Club de Nuit Intense Man (5ml) = $8.00
Item count:          3
Total to collect:    $34.00
Notes:               Lunch near the library
Placed at:           3 Oct 2026, 11:44 am
```

The customer sees the same order number on their confirmation screen, so you can match them up at pickup.

## 2. Add your range

Edit `js/products.js`. Each product looks like this:

```js
{
  id: "armaf-cdnim",               // unique, no spaces
  brand: "Armaf",
  name: "Club de Nuit Intense Man",
  family: "Smoky & Oud",           // becomes a filter button
  vibe: "Smoky pineapple. The famous Aventus dupe",
  notes: ["Lemon", "Pineapple", "Birch"],
  sizes: PRICE_TIERS.standard,     // price tier (see below)
  parfumo: "https://www.parfumo.com/Perfumes/Armaf/club-de-nuit-intense-man-eau-de-toilette",
  inspiredBy: {                    // dupes only, leave out for originals
    brand: "Creed",
    name: "Aventus",
    parfumo: "https://www.parfumo.com/Perfumes/Creed/aventus",
  },
  badge: "Hyped",                  // optional
  color: "#1f1f22",                // bottle illustration colour
  capColor: "#b9b9bd",
  shape: "square",                 // classic | tall | round | square
  inStock: true,                   // false = "Sold out"
},
```

- **Prices** are set by tier at the top of the file (`budget`, `standard`, `mid`, `premium`). Change a tier once and every scent in it updates. A product can also have its own list: `sizes: [{ label: "5ml", price: 9 }, { label: "10ml", price: 15 }]`.
- **Parfumo links:** search the scent on parfumo.com and copy the page address. Each card shows "Reviews on Parfumo", and dupes also show "Inspired by …" linking to the original. Both open in a new tab, so shoppers don't lose their bag.
- **Search** also matches the original's name, so typing "Aventus" finds Club de Nuit.
- **Real photos:** put images in an `images/` folder and add `image: "images/khamrah.jpg"` to a product. It replaces the drawn bottle.
- **Sold out:** set `inStock: false`. The item stays visible but can't be ordered.

The current prices are starting estimates based on what a bottle costs per ml. Check them against what you actually paid.

## 3. Change the text

`js/config.js` controls the shop name, hero text, pickup/payment note, whether to ask for year group, and the max quantity per scent. Check the FAQ answers in `index.html` too, and only keep the "authentic" answer if it's true. Never call a dupe by the original's name: "inspired by Aventus" is fine, "Aventus" is not.

## 4. Put it online (free)

**GitHub Pages:** in this repo go to *Settings → Pages*, set *Source* to *Deploy from a branch*, pick `main` and `/ (root)`, then save. Your site will be at `https://<username>.github.io/cologne-sample/` within a minute or two.

**Netlify (alternative):** drag this folder onto https://app.netlify.com/drop.

After it's live, **place a test order yourself** to confirm the email arrives (check spam the first time).

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
