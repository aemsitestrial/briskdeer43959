export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  [...block.children].forEach((row) => {
    // Preserve Universal Editor data attributes from the container row
    const card = document.createElement('div');
    card.classList.add('icon-card');
    [...row.attributes].forEach((attr) => card.setAttribute(attr.name, attr.value));

    // Helper function to extract inner text or attributes safely
    const getVal = (name) => {
      const el = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (el) return el.textContent.trim();
      return '';
    };

    // Extract fields
    const color = getVal('defaultCardColor').toLowerCase() || 'grey';
    const motion = getVal('motionType').toLowerCase() || 'none';
    const displayComp = getVal('displayComponents').toLowerCase() || 'icon,title,desc';
    const eyebrow = getVal('eyebrow');
    const title = getVal('title');
    const desc = getVal('description');

    const iconImg = row.querySelector('[data-aue-prop="icon"] img, [data-name="icon"] img, img:not([data-aue-prop="cardBgImage"] img)');
    const bgImg = row.querySelector('[data-aue-prop="cardBgImage"] img, [data-name="cardBgImage"] img');

    // Color assignment
    let cardColorClass = 'grey';
    if (color.includes('blue')) {
      cardColorClass = 'blue';
    } else if (color.includes('black')) {
      cardColorClass = 'black';
    }
    card.classList.add(`card-color-${cardColorClass}`);

    if (motion && motion !== 'none') {
      card.classList.add(`motion-${motion}`);
    }

    // Apply card background image if uploaded
    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    // Top Icon (Only renders if toggled in Display Components)
    if (iconImg && (displayComp.includes('icon') || displayComp === '')) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');
      const clonedIcon = iconImg.cloneNode(true);
      iconWrap.appendChild(clonedIcon);
      card.appendChild(iconWrap);
    }

    // Text Content Wrapper
    const content = document.createElement('div');
    content.classList.add('icon-card-content');

    if (eyebrow) {
      const eb = document.createElement('span');
      eb.classList.add('icon-card-eyebrow');
      eb.textContent = eyebrow;
      content.appendChild(eb);
    }

    if (title && (displayComp.includes('title') || displayComp === '')) {
      const t = document.createElement('div');
      t.classList.add('icon-card-title');
      t.textContent = title;
      content.appendChild(t);
    }

    if (desc && (displayComp.includes('desc') || displayComp === '')) {
      const d = document.createElement('p');
      d.classList.add('icon-card-desc');
      d.textContent = desc;
      content.appendChild(d);
    }

    card.appendChild(content);
    cardsGrid.appendChild(card);
  });

  // Re-build DOM without dropping UE tracking wrappers
  block.replaceChildren(headerWrapper, cardsGrid);
}
