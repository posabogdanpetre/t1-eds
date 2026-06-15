// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: "Men's Nano Puff Jacket",
    description: "Weather-resistant, lightweight packable synthetic insulation jacket that stays warm when wet.",
    image_url: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw8079c0d9/images/hi-res/84213_BLSG.jpg",
    price: "£170",
    category: "Insulated Jackets"
  },
  {
    name: "Men's Houdini Windbreaker Jacket",
    description: "Packable featherweight windproof shell made from 100% recycled nylon for high-output activities.",
    image_url: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwa687f184/images/hi-res/24142_AQST.jpg",
    price: "£100",
    category: "Windbreakers"
  },
  {
    name: "Women's Storm Shift Ski/Snowboard Jacket",
    description: "Waterproof/windproof GORE-TEX ePE jacket with recycled polyester for all-condition ski protection.",
    image_url: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwb68e02a8/images/hi-res/31750_BNLB.jpg",
    price: "£315",
    category: "Ski & Snowboard"
  },
  {
    name: "Men's Lightweight All-Wear Unlined Jacket",
    description: "Soft, airy jacket made from organic cotton and hemp blend with stretch for everyday wear.",
    image_url: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw1ad62edb/images/hi-res/20465_WSTO.jpg",
    price: "£140",
    category: "Casual Jackets"
  },
  {
    name: "Women's Downdrift Insulated Parka",
    description: "Heritage-inspired insulated parka with recycled down providing warmth, durability and timeless style.",
    image_url: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwe053e017/images/hi-res/20605_BSNG.jpg",
    price: "£252",
    category: "Parkas"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = [];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA[0];
    } else {
      // outputSchema is a single object (not array) — structuredContent IS the product
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
    }
  } else {
    product = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderProduct(block, product, bridge) {
  if (!product) {
    block.textContent = 'No product data available';
    return;
  }

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left side: Image with CTA button
  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-image-container';

  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'image-fallback';
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.className = 'product-image';
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'Shop Now';
  ctaBtn.setAttribute('aria-label', `Shop ${product.name || 'product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to purchase ${product.name}`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  // Right side: Product info with darkened palette background
  const infoContainer = document.createElement('div');
  infoContainer.className = 'product-info-container';
  infoContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product';
  infoContainer.appendChild(name);

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    infoContainer.appendChild(desc);
  }

  const metaRow = document.createElement('div');
  metaRow.className = 'product-meta';

  if (product.price) {
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = typeof product.price === 'number' ? `£${product.price}` : product.price;
    metaRow.appendChild(price);
  }

  if (product.category) {
    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;
    metaRow.appendChild(category);
  }

  infoContainer.appendChild(metaRow);

  card.appendChild(infoContainer);
  block.appendChild(card);
}