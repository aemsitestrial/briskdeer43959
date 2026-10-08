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
  const colorVal = block.dataset.defaultCardColor || 'light';
  const motionVal = block.dataset.motionType || 'none';
  const cardImageTop = block.dataset.cardImageTop !== 'false';

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

  // Build Grid for Items
  const grid = document.createElement('div');
  grid.className = 'icon-list-grid';

  [...block.children].forEach((row) => {
    // Skip header row if it contains block properties
    if (row.querySelector('[data-aue-prop="eyebrow"], [data-aue-prop="title"]')) return;

    const cells = getCells(row);
    if (!cells.length) return;

    const card = document.createElement('div');
    card.className = `icon-list-item card-color-${colorVal}`;
    if (cardImageTop) card.classList.add('image-top');

    const iconCell = cells[0];
    const titleCell = cells[1];
    const descCell = cells[2];
    const bgImgCell = cells[3];

    // Icon Rendering
    const iconImg = iconCell?.querySelector('img')?.cloneNode(true) || null;
    if (iconImg) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'icon-list-icon';
      iconWrapper.appendChild(iconImg);
      card.appendChild(iconWrapper);
    }

    // Text Container
    const cardBody = document.createElement('div');
    cardBody.className = 'icon-list-body';

    const cardTitle = getCellValue(titleCell);
    if (cardTitle) {
      const h3 = document.createElement('h3');
      h3.className = 'icon-list-item-title';
      h3.textContent = cardTitle;
      cardBody.appendChild(h3);
    }

    const cardDesc = descCell?.innerHTML || getCellValue(descCell);
    if (cardDesc) {
      const p = document.createElement('div');
      p.className = 'icon-list-item-desc';
      p.innerHTML = cardDesc;
      cardBody.appendChild(p);
    }

    card.appendChild(cardBody);

    // Background Image / Pattern
    const bgImgSrc = bgImgCell?.querySelector('img')?.src || getCellValue(bgImgCell);
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
  if (motionVal !== 'none') block.classList.add(`motion-${motionVal}`);

  block.replaceChildren(container);
}
