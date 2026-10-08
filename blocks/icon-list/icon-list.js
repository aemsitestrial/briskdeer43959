import { moveInstrumentation } from '../../scripts/scripts.js';

function getPropValue(row, propName, fallbackCell) {
  // 1. Check direct Universal Editor property node
  const propNode = row.querySelector(`[data-aue-prop="${propName}"]`);
  if (propNode) {
    return propNode.dataset.value || propNode.getAttribute('data-value') || propNode.textContent?.trim() || '';
  }

  // 2. Check row dataset/attribute
  if (row.dataset[propName] || row.getAttribute(`data-${propName}`)) {
    return row.dataset[propName] || row.getAttribute(`data-${propName}`);
  }

  // 3. Fallback to provided cell text/content
  if (fallbackCell) {
    const linkHref = fallbackCell.querySelector('a')?.getAttribute('href');
    const valueNode = fallbackCell.matches('[data-value]') ? fallbackCell : fallbackCell.querySelector('[data-value]');
    return linkHref || valueNode?.dataset?.value || fallbackCell.textContent?.trim() || '';
  }

  return '';
}

export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'icon-list-content';

  // Extract block-level properties
  const eyebrowVal = block.querySelector('[data-aue-prop="eyebrow"]')?.textContent?.trim() || '';
  const titleVal = block.querySelector('[data-aue-prop="title"]')?.textContent?.trim() || '';
  const descVal = block.querySelector('[data-aue-prop="description"]')?.innerHTML || '';

  const cardsPerRowProp = block.dataset.cardsPerRow || block.getAttribute('data-cards-per-row') || '3';
  const cardsPerRow = ['1', '2', '3', '4'].includes(cardsPerRowProp) ? cardsPerRowProp : '3';

  // Build Block Header
  const header = document.createElement('div');
  header.className = 'icon-list-header';

  if (eyebrowVal) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'icon-list-eyebrow';
    eyebrow.textContent = eyebrowVal;
    header.appendChild(eyebrow);
  }

  if (titleVal) {
    const title = document.createElement('h2');
    title.className = 'icon-list-title';
    title.textContent = titleVal;
    header.appendChild(title);
  }

  if (descVal) {
    const desc = document.createElement('div');
    desc.className = 'icon-list-description';
    desc.innerHTML = descVal;
    header.appendChild(desc);
  }

  // Build Grid Container
  const grid = document.createElement('div');
  grid.className = `icon-list-grid grid-cols-${cardsPerRow}`;

  [...block.children].forEach((row) => {
    // Skip row if it contains main block properties
    if (row.querySelector('[data-aue-prop="eyebrow"], [data-aue-prop="title"]')) return;

    // Extract item properties by property name
    const cardColor = getPropValue(row, 'cardColor') || 'light';
    const motionType = getPropValue(row, 'motionType') || 'none';
    const cardImageTopVal = getPropValue(row, 'cardImageTop');
    const cardImageTop = cardImageTopVal !== 'false' && cardImageTopVal !== 'none';

    const displayElementsVal = getPropValue(row, 'displayElements') || 'icon,title,description';
    const displayElements = displayElementsVal.toLowerCase();

    // Content extraction by explicit UE property name or element selectors
    const iconNode = row.querySelector('[data-aue-prop="icon"]') || row.querySelector('img')?.closest('td, div') || row.querySelector('img');
    const iconImg = iconNode?.tagName === 'IMG' ? iconNode.cloneNode(true) : iconNode?.querySelector('img')?.cloneNode(true);
    const iconSrc = iconImg?.src || getPropValue(row, 'icon');

    const titleNode = row.querySelector('[data-aue-prop="listTitle"]');
    const cardTitle = titleNode?.textContent?.trim() || getPropValue(row, 'listTitle');

    const descNode = row.querySelector('[data-aue-prop="listDescription"]');
    const cardDesc = descNode?.innerHTML?.trim() || getPropValue(row, 'listDescription');

    // Only render valid items that have actual title, desc, or icon content
    const hasContent = cardTitle || cardDesc || iconImg || (iconSrc && iconSrc.match(/\.(png|jpg|jpeg|svg|webp)/i));
    if (!hasContent) return;

    const card = document.createElement('div');
    card.className = `icon-list-item card-color-${cardColor}`;
    if (cardImageTop) card.classList.add('image-top');
    if (motionType !== 'none') card.classList.add(`motion-${motionType}`);

    // 1. Icon Element
    if (displayElements.includes('icon') && (iconImg || (iconSrc && iconSrc.match(/\.(png|jpg|jpeg|svg|webp)/i)))) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'icon-list-icon';
      const imgNode = iconImg || document.createElement('img');
      if (!imgNode.src) imgNode.src = iconSrc;
      imgNode.alt = '';
      iconWrapper.appendChild(imgNode);
      card.appendChild(iconWrapper);
    }

    // 2. Card Body Container (Title & Description)
    const cardBody = document.createElement('div');
    cardBody.className = 'icon-list-body';

    // List Title Element
    if (displayElements.includes('title') && cardTitle) {
      const h3 = document.createElement('h3');
      h3.className = 'icon-list-item-title';
      h3.textContent = cardTitle;
      cardBody.appendChild(h3);
    }

    // List Description Element
    if (displayElements.includes('description') && cardDesc) {
      const p = document.createElement('div');
      p.className = 'icon-list-item-desc';
      p.innerHTML = cardDesc;
      cardBody.appendChild(p);
    }

    if (cardBody.children.length) {
      card.appendChild(cardBody);
    }

    moveInstrumentation(row, card);
    grid.appendChild(card);
  });

  if (header.children.length) container.appendChild(header);
  if (grid.children.length) container.appendChild(grid);

  block.classList.add('icon-list-wrapper');
  block.replaceChildren(container);
}
