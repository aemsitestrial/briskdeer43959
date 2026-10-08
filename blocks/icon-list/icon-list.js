export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  let cardsPerRow = '4';
  let maxCardsAllowed = 0;
  let renderedCardsCount = 0;

  [...block.children].forEach((row) => {
    const modelName = row.dataset.aueModel || row.dataset.model || '';
    const isHeaderRow = modelName === 'icon-list'
      || (!modelName && row.children.length <= 2 && !row.querySelector('[data-aue-prop="defaultCardColor"]'));

    const getVal = (name) => {
      const field = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return '';
    };

    if (isHeaderRow) {
      const titleEl = row.querySelector('[data-aue-prop="title"], [data-name="title"]') || row.children[0];
      const descEl = row.querySelector('[data-aue-prop="description"], [data-name="description"]') || row.children[1];

      const cprVal = getVal('cardsPerRow');
      if (cprVal) cardsPerRow = cprVal;

      const maxVal = getVal('maxCardsAllowed');
      if (maxVal) maxCardsAllowed = parseInt(maxVal, 10);

      if (titleEl && titleEl.textContent.trim()) {
        const h2 = document.createElement('h2');
        h2.classList.add('icon-list-title');
        h2.innerHTML = titleEl.innerHTML;
        [...titleEl.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
        headerWrapper.appendChild(h2);
      }

      if (descEl && descEl.textContent.trim()) {
        const p = document.createElement('p');
        p.classList.add('icon-list-description');
        p.innerHTML = descEl.innerHTML;
        [...descEl.attributes].forEach((attr) => p.setAttribute(attr.name, attr.value));
        headerWrapper.appendChild(p);
      }
      return;
    }

    // Enforce Max Cards Display Limit
    if (maxCardsAllowed > 0 && renderedCardsCount >= maxCardsAllowed) {
      return;
    }

    // Build Card Item
    const card = document.createElement('div');
    card.classList.add('icon-card');
    [...row.attributes].forEach((attr) => card.setAttribute(attr.name, attr.value));

    const getImg = (name) => {
      const propContainer = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (propContainer) {
        return propContainer.querySelector('img');
      }
      return null;
    };

    const colorVal = getVal('defaultCardColor').toLowerCase();
    const motionVal = getVal('motionType').toLowerCase();
    const showIcon = getVal('showIcon') !== 'false';
    const showTitle = getVal('showTitle') !== 'false';
    const showDesc = getVal('showDesc') !== 'false';

    const eyebrow = getVal('eyebrow');
    const title = getVal('title');
    const desc = getVal('description');

    let cardColorClass = 'grey';
    if (colorVal.includes('blue')) {
      cardColorClass = 'blue';
    } else if (colorVal.includes('black')) {
      cardColorClass = 'black';
    } else {
      const rawText = row.textContent.toLowerCase();
      if (rawText.includes('blue')) {
        cardColorClass = 'blue';
      } else if (rawText.includes('black')) {
        cardColorClass = 'black';
      }
    }
    card.classList.add(`card-color-${cardColorClass}`);

    if (motionVal && motionVal !== 'none') {
      card.classList.add(`motion-${motionVal}`);
    }

    const bgImg = getImg('cardBgImage');
    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    const iconImg = getImg('icon') || row.querySelector('img:not([data-aue-prop="cardBgImage"] img)');
    if (showIcon && iconImg) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');
      const pictureParent = iconImg.closest('picture');
      if (pictureParent) {
        iconWrap.appendChild(pictureParent.cloneNode(true));
      } else {
        iconWrap.appendChild(iconImg.cloneNode(true));
      }
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

    if (showTitle && title) {
      const t = document.createElement('div');
      t.classList.add('icon-card-title');
      t.textContent = title;
      content.appendChild(t);
    }

    if (showDesc && desc) {
      const d = document.createElement('p');
      d.classList.add('icon-card-desc');
      d.textContent = desc;
      content.appendChild(d);
    }

    card.appendChild(content);
    cardsGrid.appendChild(card);
    renderedCardsCount += 1;
  });

  // Apply grid column layout class based on author selection
  cardsGrid.classList.add(`grid-cols-${cardsPerRow}`);

  block.replaceChildren(headerWrapper, cardsGrid);
}
