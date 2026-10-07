export default function decorate(block) {
  const container = document.createElement('div');
  container.classList.add('icon-list-container');

  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  [...block.children].forEach((row, index) => {
    // Helper to safely extract field values from UE markup or child elements
    const getVal = (name, colIndex) => {
      const field = row.querySelector(`[data-name="${name}"]`);
      if (field) return field.textContent.trim();
      return row.children[colIndex]?.textContent.trim() || '';
    };

    const getImg = (name) => row.querySelector(`[data-name="${name}"] img, img`);

    // Check if current row represents a Card or Header Title
    const isCard = row.children.length > 2 || row.querySelector('[data-name="title"]');

    if (index === 0 && !isCard) {
      // Header Section Title / Description
      const titleText = getVal('title', 0);
      const descText = getVal('description', 1);

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

    // Individual Card Component
    const card = document.createElement('div');
    card.classList.add('icon-card');

    // Extract fields
    const color = getVal('defaultCardColor', 2).toLowerCase() || 'grey';
    const motion = getVal('motionType', 6).toLowerCase() || 'none';
    const eyebrow = getVal('eyebrow', 0);
    const title = getVal('title', 7);
    const desc = getVal('description', 8);

    const iconImg = getImg('icon');
    const bgImg = getImg('cardBgImage');

    // Apply color class (blue, grey, black)
    let colorClass = 'grey';
    if (color.includes('blue')) colorClass = 'blue';
    else if (color.includes('black')) colorClass = 'black';
    card.classList.add(`card-color-${colorClass}`);

    if (motion && motion !== 'none') {
      card.classList.add(`motion-${motion}`);
    }

    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-image');
    }

    // Add Icon Top
    if (iconImg) {
      const iconWrap = document.createElement('div');
      iconWrap.classList.add('icon-card-icon');
      iconWrap.appendChild(iconImg.cloneNode(true));
      card.appendChild(iconWrap);
    }

    // Content Block
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

  // Re-render block
  block.textContent = '';
  if (headerWrapper.children.length > 0) {
    block.appendChild(headerWrapper);
  }
  block.appendChild(cardsGrid);
}
