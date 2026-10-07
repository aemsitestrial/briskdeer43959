export default function decorate(block) {
  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  [...block.children].forEach((row) => {
    const rowAttributes = [...row.attributes];

    const getVal = (name) => {
      const field = row.querySelector(`[data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return '';
    };

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

    const card = document.createElement('div');
    card.classList.add('icon-card');
    rowAttributes.forEach((attr) => card.setAttribute(attr.name, attr.value));

    const color = getVal('defaultCardColor').toLowerCase() || 'grey';
    const motion = getVal('motionType').toLowerCase() || 'none';
    const displayComp = getVal('displayComponents').toLowerCase() || 'icon,title,desc';
    const eyebrow = getVal('eyebrow');
    const title = getVal('title');
    const desc = getVal('description');

    const iconImg = row.querySelector('[data-name="icon"] img');
    const bgImg = row.querySelector('[data-name="cardBgImage"] img');

    // Color logic
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

    // Set background image only if explicitly set
    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    // Render Icon if toggled ON in displayComponents
    if (iconImg && displayComp.includes('icon')) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');
      const clonedIcon = iconImg.cloneNode(true);
      clonedIcon.removeAttribute('data-aue-prop');
      iconWrap.appendChild(clonedIcon);
      card.appendChild(iconWrap);
    }

    // Render Content Block
    const content = document.createElement('div');
    content.classList.add('icon-card-content');

    if (eyebrow) {
      const eb = document.createElement('span');
      eb.classList.add('icon-card-eyebrow');
      eb.textContent = eyebrow;
      content.appendChild(eb);
    }

    if (title && displayComp.includes('title')) {
      const t = document.createElement('div');
      t.classList.add('icon-card-title');
      t.textContent = title;
      content.appendChild(t);
    }

    if (desc && displayComp.includes('desc')) {
      const d = document.createElement('p');
      d.classList.add('icon-card-desc');
      d.textContent = desc;
      content.appendChild(d);
    }

    card.appendChild(content);
    cardsGrid.appendChild(card);
  });

  block.textContent = '';
  if (headerWrapper.children.length > 0) {
    block.appendChild(headerWrapper);
  }
  block.appendChild(cardsGrid);
}
