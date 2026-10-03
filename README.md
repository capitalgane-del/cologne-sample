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
Subject: New order #Q5WXP6 from Sam Taylor ($64.00)

Order number:        #Q5WXP6
Customer name:       Sam Taylor
Year / homeroom:     Year 11
Phone or Instagram:  @samt
Items:               2 x Dior Sauvage EDT (10ml) = $40.00
                     2 x YSL Y EDP (5ml) = $24.00
Item count:          4
Total to collect:    $64.00
Notes:               Lunch near the library
Placed at:           3 Oct 2026, 11:44 am
```

The customer sees the same order number on their confirmation screen, so you can match them up at pickup.

## 2. Add your range

Edit `js/products.js`. Each product looks like this:

```js
{
  id: "dior-sauvage-edt",          // unique, no spaces
  brand: "Dior",
  name: "Sauvage EDT",
  family: "Fresh",                 // becomes a filter button
  vibe: "The everyday crowd-pleaser",
  notes: ["Bergamot", "Pepper", "Ambroxan"],
  sizes: [
    { label: "5ml", price: 12 },
    { label: "10ml", price: 20 },
  ],
  badge: "Best seller",            // optional
  color: "#35577c",                // bottle illustration colour
  capColor: "#1b1b1d",
  shape: "square",                 // classic | tall | round | square
  inStock: true,                   // false = "Sold out"
},
```

- **Sizes** can be anything: `"5ml"`, `"10ml"`, `"Full bottle 100ml"`. Selling full bottles only? Give each product one size.
- **Real photos:** put images in an `images/` folder and add `image: "images/sauvage.jpg"` to a product. It replaces the drawn bottle.
- **Sold out:** set `inStock: false`. The item stays visible but can't be ordered.

The products already in the file are **sample data**. Replace the prices and range with what you actually stock.

## 3. Change the text

`js/config.js` controls the shop name, hero text, pickup/payment note, whether to ask for year group, and the max quantity per scent. Check the FAQ answers in `index.html` too, and only keep the "authentic" answer if it's true.

## 4. Put it online (free)

**GitHub Pages:** in this repo go to *Settings → Pages*, set *Source* to *Deploy from a branch*, pick `main` and `/ (root)`, then save. Your site will be at `https://<username>.github.io/cologne-sample/` within a minute or two.

**Netlify (alternative):** drag this folder onto https://app.netlify.com/drop.

After it's live, **place a test order yourself** to confirm the email arrives (check spam the first time).

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
