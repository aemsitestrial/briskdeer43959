import { moveInstrumentation } from '../../scripts/scripts.js';

function getPropValue(row, propName, fallbackCell) {
  const propNode = row.querySelector(`[data-aue-prop="${propName}"]`);
  if (propNode) {
    return propNode.dataset.value || propNode.getAttribute('data-value') || propNode.textContent?.trim() || '';
  }

  if (row.dataset[propName] || row.getAttribute(`data-${propName}`)) {
    return row.dataset[propName] || row.getAttribute(`data-${propName}`);
  }

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
    eyebrow.setAttribute('data-aue-prop', 'eyebrow');
    eyebrow.textContent = eyebrowVal;
    header.appendChild(eyebrow);
  }

  if (titleVal) {
    const title = document.createElement('h2');
    title.className = 'icon-list-title';
    title.setAttribute('data-aue-prop', 'title');
    title.textContent = titleVal;
    header.appendChild(title);
  }

  if (descVal) {
    const desc = document.createElement('div');
    desc.className = 'icon-list-description';
    desc.setAttribute('data-aue-prop', 'description');
    desc.innerHTML = descVal;
    header.appendChild(desc);
  }

  // Build Grid Container with UE Container Instrumentations
  const grid = document.createElement('div');
  grid.className = `icon-list-grid grid-cols-${cardsPerRow}`;
  grid.setAttribute('data-aue-type', 'container');
  grid.setAttribute('data-aue-filter', 'icon-list');

  [...block.children].forEach((row) => {
    if (row.querySelector('[data-aue-prop="eyebrow"], [data-aue-prop="title"]')) return;

    const cardColor = getPropValue(row, 'cardColor') || 'light';
    const motionType = getPropValue(row, 'motionType') || 'none';
    const cardImageTopVal = getPropValue(row, 'cardImageTop');
    const cardImageTop = cardImageTopVal !== 'false' && cardImageTopVal !== 'none';

    const displayElementsVal = getPropValue(row, 'displayElements') || 'icon,title,description';
    const displayElements = displayElementsVal.toLowerCase();

    const iconNode = row.querySelector('[data-aue-prop="icon"]') || row.querySelector('img')?.closest('td, div') || row.querySelector('img');
    const iconImg = iconNode?.tagName === 'IMG' ? iconNode.cloneNode(true) : iconNode?.querySelector('img')?.cloneNode(true);
    const iconSrc = iconImg?.src || getPropValue(row, 'icon');

    const titleNode = row.querySelector('[data-aue-prop="listTitle"]');
    const cardTitle = titleNode?.textContent?.trim() || getPropValue(row, 'listTitle');

    const descNode = row.querySelector('[data-aue-prop="listDescription"]');
    const cardDesc = descNode?.innerHTML?.trim() || getPropValue(row, 'listDescription');

    const bgImgNode = row.querySelector('[data-aue-prop="cardBgImage"]');
    const bgImgSrc = bgImgNode?.querySelector('img')?.src || getPropValue(row, 'cardBgImage');

    const card = document.createElement('div');
    card.className = `icon-list-item card-color-${cardColor}`;
    card.setAttribute('data-aue-resource', row.getAttribute('data-aue-resource') || '');
    card.setAttribute('data-aue-type', 'component');
    card.setAttribute('data-aue-label', 'Icon List Item');

    if (cardImageTop) card.classList.add('image-top');
    if (motionType !== 'none') card.classList.add(`motion-${motionType}`);

    // Icon
    if (displayElements.includes('icon') && (iconImg || (iconSrc && iconSrc.match(/\.(png|jpg|jpeg|svg|webp)/i)))) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'icon-list-icon';
      const imgNode = iconImg || document.createElement('img');
      if (!imgNode.src) imgNode.src = iconSrc;
      imgNode.alt = '';
      iconWrapper.appendChild(imgNode);
      card.appendChild(iconWrapper);
    }

    // Card Body
    const cardBody = document.createElement('div');
    cardBody.className = 'icon-list-body';

    if (displayElements.includes('title') && cardTitle) {
      const h3 = document.createElement('h3');
      h3.className = 'icon-list-item-title';
      h3.textContent = cardTitle;
      cardBody.appendChild(h3);
    }

    if (displayElements.includes('description') && cardDesc) {
      const p = document.createElement('div');
      p.className = 'icon-list-item-desc';
      p.innerHTML = cardDesc;
      cardBody.appendChild(p);
    }

    if (cardBody.children.length) {
      card.appendChild(cardBody);
    }

    // Background Image
    if (bgImgSrc && bgImgSrc.match(/\.(png|jpg|jpeg|svg|webp)/i)) {
      const bgImg = document.createElement('img');
      bgImg.className = 'icon-list-bg-image';
      bgImg.src = bgImgSrc;
      bgImg.alt = '';
      card.appendChild(bgImg);
    }

    moveInstrumentation(row, card);
    grid.appendChild(card);
  });

  if (header.children.length) container.appendChild(header);
  container.appendChild(grid);

  block.classList.add('icon-list-wrapper');
  block.replaceChildren(container);
}
