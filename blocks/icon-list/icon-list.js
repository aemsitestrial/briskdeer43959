export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  [...block.children].forEach((row) => {
    // Retain AEM Universal Editor attributes on the row
    const rowAttributes = [...row.attributes];

    const getVal = (name) => {
      const field = row.querySelector(`[data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return '';
    };

    const getImg = (name) => row.querySelector(`[data-name="${name}"] img, img`);

    const isCard = row.children.length > 2
      || row.querySelector('[data-name="title"]')
      || row.querySelector('[data-name="defaultCardColor"]');

    if (!isCard) {
      const titleText = getVal('title');
      const descText = getVal('description');

      if (titleText) {
        const h2 = document.createElement('h2');
        h2.classList.add('icon-list-title');
        h2.textContent = titleText;
        headerWrapper.appendChild(h2);
      }
      if (descText) {
        const p = document.createElement('p');
        p.classList.add('icon-list-description');
        p.textContent = descText;
        headerWrapper.appendChild(p);
      }
      return;
    }

    // Build Card Item and copy instrumentation
    const card = document.createElement('div');
    card.classList.add('icon-card');
    rowAttributes.forEach((attr) => card.setAttribute(attr.name, attr.value));

    const color = getVal('defaultCardColor').toLowerCase() || 'grey';
    const motion = getVal('motionType').toLowerCase() || 'none';
    const eyebrow = getVal('eyebrow');
    const title = getVal('title');
    const desc = getVal('description');

    const iconImg = getImg('icon');
    const bgImg = getImg('cardBgImage');

    // ESLint-compliant color assignment (replaces nested ternary)
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

    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    if (iconImg) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');
      iconWrap.appendChild(iconImg.cloneNode(true));
      card.appendChild(iconWrap);
    }

    const content = document.createElement('div');
    content.classList.add('icon-card-content');

    if (eyebrow) {
      const eb = document.createElement('span');
      eb.classList.add('icon-card-eyebrow');
      eb.textContent = eyebrow;
      content.appendChild(eb);
    }

    if (title) {
      const t = document.createElement('div');
      t.classList.add('icon-card-title');
      t.textContent = title;
      content.appendChild(t);
    }

    if (desc) {
      const d = document.createElement('p');
      d.classList.add('icon-card-desc');
      d.textContent = desc;
      content.appendChild(d);
    }

    card.appendChild(content);
    cardsGrid.appendChild(card);
  });

  // Re-build DOM content
  block.textContent = '';
  if (headerWrapper.children.length > 0) {
    block.appendChild(headerWrapper);
  }
  block.appendChild(cardsGrid);
}
