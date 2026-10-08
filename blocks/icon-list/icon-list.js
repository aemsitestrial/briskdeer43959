export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  // Extract Cards Per Row setting from block dataset, attributes, or inner element
  let cardsPerRow = '4';
  const cprAttr = block.dataset.cardsPerRow || block.getAttribute('data-cards-per-row');

  if (cprAttr) {
    const matched = cprAttr.match(/\d+/);
    if (matched) [cardsPerRow] = matched;
  } else {
    const cprEl = block.querySelector('[data-aue-prop="cardsPerRow"], [data-name="cardsPerRow"]');
    if (cprEl) {
      const matched = cprEl.textContent.trim().match(/\d+/);
      if (matched) [cardsPerRow] = matched;
    }
  }

  [...block.children].forEach((row) => {
    // Ignore setting rows
    if (row.querySelector('[data-aue-prop="cardsPerRow"], [data-name="cardsPerRow"]')) {
      return;
    }

    const modelName = row.dataset.aueModel || row.dataset.model || '';
    const isHeaderRow = modelName === 'icon-list'
      || (!modelName && row.children.length <= 2 && !row.querySelector('[data-aue-prop="defaultCardColor"]'));

    if (isHeaderRow) {
      const titleEl = row.querySelector('[data-aue-prop="title"], [data-name="title"]');
      const descEl = row.querySelector('[data-aue-prop="description"], [data-name="description"]');

      // ESLint-compliant title fallback extraction
      let rawTitle = '';
      if (titleEl) {
        rawTitle = titleEl.textContent.trim();
      } else if (row.children[0]) {
        rawTitle = row.children[0].textContent.trim();
      }

      // ESLint-compliant description fallback extraction
      let rawDesc = '';
      if (descEl) {
        rawDesc = descEl.textContent.trim();
      } else if (row.children[1]) {
        rawDesc = row.children[1].textContent.trim();
      }

      if (rawTitle && !/^\d+$/.test(rawTitle)) {
        const h2 = document.createElement('h2');
        h2.classList.add('icon-list-title');
        h2.textContent = rawTitle;
        if (titleEl) {
          [...titleEl.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
        }
        headerWrapper.appendChild(h2);
      }

      if (rawDesc && !/^\d+$/.test(rawDesc)) {
        const p = document.createElement('p');
        p.classList.add('icon-list-description');
        p.textContent = rawDesc;
        if (descEl) {
          [...descEl.attributes].forEach((attr) => p.setAttribute(attr.name, attr.value));
        }
        headerWrapper.appendChild(p);
      }
      return;
    }

    // Individual Card Item Setup
    const card = document.createElement('div');
    card.classList.add('icon-card');
    [...row.attributes].forEach((attr) => card.setAttribute(attr.name, attr.value));

    const getVal = (name) => {
      const field = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return '';
    };

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
  });

  // Apply layout modifier class to both grid and block wrapper
  const gridClass = `grid-cols-${cardsPerRow}`;
  cardsGrid.classList.add(gridClass);
  block.classList.add(gridClass);

  const childrenToRender = [];
  if (headerWrapper.children.length > 0) {
    childrenToRender.push(headerWrapper);
  }
  childrenToRender.push(cardsGrid);

  block.replaceChildren(...childrenToRender);
}
