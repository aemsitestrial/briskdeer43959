import { moveInstrumentation } from '../../scripts/scripts.js';

function getCells(row) {
  let cells = [...row.children];
  while (cells.length === 1 && cells[0].children.length > 1) {
    cells = [...cells[0].children];
  }
  return cells;
}

function getCellValue(cell) {
  const linkHref = cell?.querySelector('a')?.getAttribute('href');
  const valueNode = cell?.matches('[data-value]') ? cell : cell?.querySelector('[data-value]');
  return linkHref || valueNode?.dataset?.value || cell?.textContent?.trim() || '';
}

export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'icon-list-content';

  // Extract block properties
  const eyebrowVal = block.querySelector('[data-aue-prop="eyebrow"]')?.textContent?.trim() || '';
  const titleVal = block.querySelector('[data-aue-prop="title"]')?.textContent?.trim() || '';
  const descVal = block.querySelector('[data-aue-prop="description"]')?.innerHTML || '';

  // Cards per row setting (Default to 3 as seen in screenshot)
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
    // Skip header row if it contains block level meta-data
    if (row.querySelector('[data-aue-prop="eyebrow"], [data-aue-prop="title"]')) return;

    const cells = getCells(row);
    if (!cells.length) return;

    // Extract item level properties
    const cardColor = row.dataset.cardColor || row.getAttribute('data-card-color') || 'light';
    const motionType = row.dataset.motionType || row.getAttribute('data-motion-type') || 'none';
    const cardImageTop = (row.dataset.cardImageTop || row.getAttribute('data-card-image-top')) !== 'false';
    const displayElements = (row.dataset.displayElements || row.getAttribute('data-display-elements') || 'icon,title,description').toLowerCase();

    const card = document.createElement('div');
    card.className = `icon-list-item card-color-${cardColor}`;
    if (cardImageTop) card.classList.add('image-top');
    if (motionType !== 'none') card.classList.add(`motion-${motionType}`);

    // Cell index mapping: 0 -> Icon, 1 -> List Title, 2 -> List Description
    const iconCell = cells[0];
    const titleCell = cells[1];
    const descCell = cells[2];

    // 1. Icon Element
    if (displayElements.includes('icon')) {
      const iconImg = iconCell?.querySelector('img')?.cloneNode(true);
      const iconSrc = iconImg?.src || getCellValue(iconCell);
      if (iconImg || (iconSrc && iconSrc.match(/\.(png|jpg|jpeg|svg|webp)/i))) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon-list-icon';
        const imgNode = iconImg || document.createElement('img');
        if (!imgNode.src) imgNode.src = iconSrc;
        imgNode.alt = '';
        iconWrapper.appendChild(imgNode);
        card.appendChild(iconWrapper);
      }
    }

    // 2. Card Body Container (Title & Description)
    const cardBody = document.createElement('div');
    cardBody.className = 'icon-list-body';

    // List Title Element
    if (displayElements.includes('title')) {
      const cardTitle = getCellValue(titleCell);
      if (cardTitle) {
        const h3 = document.createElement('h3');
        h3.className = 'icon-list-item-title';
        h3.textContent = cardTitle;
        cardBody.appendChild(h3);
      }
    }

    // List Description Element
    if (displayElements.includes('description')) {
      const cardDesc = descCell?.innerHTML || getCellValue(descCell);
      if (cardDesc) {
        const p = document.createElement('div');
        p.className = 'icon-list-item-desc';
        p.innerHTML = cardDesc;
        cardBody.appendChild(p);
      }
    }

    if (cardBody.children.length) {
      card.appendChild(cardBody);
    }

    moveInstrumentation(row, card);
    grid.appendChild(card);
  });

  if (header.children.length) container.appendChild(header);
  container.appendChild(grid);

  block.classList.add('icon-list-wrapper');
  block.replaceChildren(container);
}
