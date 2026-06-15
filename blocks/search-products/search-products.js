// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "Men's Nano Puff Jacket",
    "description": "Weather-resistant, lightweight packable synthetic insulation jacket that stays warm when wet.",
    "image_url": "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw8079c0d9/images/hi-res/84213_BLSG.jpg",
    "price": "£170",
    "category": "Insulated Jackets"
  },
  {
    "name": "Men's Houdini Windbreaker Jacket",
    "description": "Packable featherweight windproof shell made from 100% recycled nylon for high-output activities.",
    "image_url": "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwa687f184/images/hi-res/24142_AQST.jpg",
    "price": "£100",
    "category": "Windbreakers"
  },
  {
    "name": "Women's Storm Shift Ski/Snowboard Jacket",
    "description": "Waterproof/windproof GORE-TEX ePE jacket with recycled polyester for all-condition ski protection.",
    "image_url": "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwb68e02a8/images/hi-res/31750_BNLB.jpg",
    "price": "£315",
    "category": "Ski & Snowboard"
  },
  {
    "name": "Men's Lightweight All-Wear Unlined Jacket",
    "description": "Soft, airy jacket made from organic cotton and hemp blend with stretch for everyday wear.",
    "image_url": "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw1ad62edb/images/hi-res/20465_WSTO.jpg",
    "price": "£140",
    "category": "Casual Jackets"
  },
  {
    "name": "Women's Downdrift Insulated Parka",
    "description": "Heritage-inspired insulated parka with recycled down providing warmth, durability and timeless style.",
    "image_url": "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwe053e017/images/hi-res/20605_BSNG.jpg",
    "price": "£252",
    "category": "Parkas"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = [];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  let [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r)||isNaN(g)||isNaN(b))return null;
  const lum=(c)=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  const relLum=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(relLum(r,g,b)<=0.12)return{bg:`#${hex}`,fg:'#ffffff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;if(relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12)hi=m;else lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#ffffff'};
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);

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

function renderCarousel(block, items, bridge) {
  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';
  
  const carousel = document.createElement('div');
  carousel.className = 'carousel';
  
  items.slice(0, 5).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';
    
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    
    const cta = document.createElement('button');
    cta.className = 'card-cta';
    cta.textContent = 'View Details';
    cta.setAttribute('aria-label', `View details for ${item.name || 'product'}`);
    if (bridge && item.url) {
      cta.addEventListener('click', () => {
        bridge.openLink(item.url);
      });
    } else if (bridge) {
      cta.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(cta);
    
    card.appendChild(imageContainer);
    
    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
    
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name || '';
    content.appendChild(name);
    
    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'card-description';
      desc.textContent = item.description;
      content.appendChild(desc);
    }
    
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    
    if (item.price) {
      const price = document.createElement('span');
      price.className = 'card-price';
      price.textContent = item.price;
      meta.appendChild(price);
    }
    
    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = item.category;
      meta.appendChild(badge);
    }
    
    content.appendChild(meta);
    card.appendChild(content);
    carousel.appendChild(card);
  });
  
  wrapper.appendChild(carousel);
  
  const leftBtn = document.createElement('button');
  leftBtn.className = 'carousel-arrow carousel-arrow-left';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  leftBtn.style.display = 'none';
  
  const rightBtn = document.createElement('button');
  rightBtn.className = 'carousel-arrow carousel-arrow-right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';
  
  const updateArrows = () => {
    const scrollLeft = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    leftBtn.style.display = scrollLeft > 10 ? 'flex' : 'none';
    rightBtn.style.display = scrollLeft < maxScroll - 10 ? 'flex' : 'none';
  };
  
  const scrollBy = (direction) => {
    const cardWidth = 220 + 16;
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };
  
  leftBtn.addEventListener('click', () => scrollBy(-1));
  rightBtn.addEventListener('click', () => scrollBy(1));
  leftBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollBy(-1);
    }
  });
  rightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollBy(1);
    }
  });
  
  carousel.addEventListener('scroll', updateArrows);
  updateArrows();
  
  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  
  const fade = document.createElement('div');
  fade.className = 'carousel-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);
  
  block.appendChild(wrapper);
}