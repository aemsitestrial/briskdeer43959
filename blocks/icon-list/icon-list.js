export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  [...block.children].forEach((row) => {
    const modelName = row.dataset.aueModel || row.dataset.model || '';
    const isHeaderRow = modelName === 'icon-list'
      || (!modelName && row.children.length <= 2 && !row.querySelector('[data-aue-prop="defaultCardColor"]'));

    if (isHeaderRow) {
      const titleEl = row.querySelector('[data-aue-prop="title"], [data-name="title"]') || row.children[0];
      const descEl = row.querySelector('[data-aue-prop="description"], [data-name="description"]') || row.children[1];

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

    // Individual Card Item Setup
    const card = document.createElement('div');
    card.classList.add('icon-card');
    [...row.attributes].forEach((attr) => card.setAttribute(attr.name, attr.value));

    // Helper to safely extract property text
    const getVal = (name) => {
      const field = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return '';
    };

    // Helper to search all nested images inside a property container
    const getImg = (name) => {
      const propContainer = row.querySelector(`[data-aue-prop="${name}"], [data-name="${name}"]`);
      if (propContainer) {
        return propContainer.querySelector('img');
      }
      return null;
    };

    // Parse author selection for Card Color
    const authoredColor = getVal('defaultCardColor').toLowerCase();
    let cardColorClass = 'grey'; // fallback only if author left it empty

    if (authoredColor.includes('blue')) {
      cardColorClass = 'blue';
    } else if (authoredColor.includes('black')) {
      cardColorClass = 'black';
    } else if (authoredColor.includes('grey')) {
      cardColorClass = 'grey';
    } else {
      // Direct raw text check across row children if data-aue-prop attribute is absent
      const rawText = row.textContent.toLowerCase();
      if (rawText.includes('blue')) {
        cardColorClass = 'blue';
      } else if (rawText.includes('black')) {
        cardColorClass = 'black';
      }
    }
    card.classList.add(`card-color-${cardColorClass}`);

    // Motion Type
    const motionVal = getVal('motionType').toLowerCase();
    if (motionVal && motionVal !== 'none') {
      card.classList.add(`motion-${motionVal}`);
    }

    // Toggles
    const showIcon = getVal('showIcon') !== 'false';
    const showTitle = getVal('showTitle') !== 'false';
    const showDesc = getVal('showDesc') !== 'false';

    const eyebrow = getVal('eyebrow');
    const title = getVal('title');
    const desc = getVal('description');

    // Image Extractions
    const iconImg = getImg('icon') || row.querySelector('img:not([data-aue-prop="cardBgImage"] img)');
    const bgImg = getImg('cardBgImage');

    // Set Card Background Image if authored
    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    // Render Icon Top
    if (showIcon && iconImg) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');

      // Preserve original picture/img structure for Universal Editor
      const pictureParent = iconImg.closest('picture');
      if (pictureParent) {
        iconWrap.appendChild(pictureParent.cloneNode(true));
      } else {
        iconWrap.appendChild(iconImg.cloneNode(true));
      }
      card.appendChild(iconWrap);
    }

    // Content Wrapper
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

  block.replaceChildren(headerWrapper, cardsGrid);
}
