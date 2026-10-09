import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const FIELD_CLASSES = [
  'icon-list-card-image',
  'icon-list-card-category',
  'icon-list-card-heading',
  'icon-list-card-body',
  'icon-list-card-cta',
];

export default function decorate(block) {
  let columnCount = 3;

  // Read block header and column config if authored
  const configRow = block.firstElementChild;
  if (configRow) {
    const value = Number(configRow.textContent.trim());
    if ([2, 3, 4].includes(value)) {
      columnCount = value;
      configRow.remove();
    }
  }

  const cardsPerRowAttr = block.dataset.cardsPerRow || block.getAttribute('data-cards-per-row');
  if (cardsPerRowAttr && [2, 3, 4].includes(Number(cardsPerRowAttr))) {
    columnCount = Number(cardsPerRowAttr);
  }

  block.classList.add(`col-${columnCount}`);

  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // Skip row if it contains main header metadata
    if (row.querySelector('[data-aue-prop="eyebrow"], [data-aue-prop="title"]')) return;

    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cardColor = row.dataset.cardColor || row.getAttribute('data-card-color') || 'light';
    const motionType = row.dataset.motionType || row.getAttribute('data-motion-type') || 'none';
    const cardImageTopVal = row.dataset.cardImageTop || row.getAttribute('data-card-image-top');
    const cardImageTop = cardImageTopVal !== 'false' && cardImageTopVal !== 'none';

    li.classList.add(`card-color-${cardColor}`);
    if (cardImageTop) li.classList.add('image-top');
    if (motionType !== 'none') li.classList.add(`motion-${motionType}`);

    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    [...li.children].forEach((div, i) => {
      div.className = FIELD_CLASSES[i] || 'icon-list-card-body';
    });

    ul.append(li);
  });

  // Optimize background images / card images
  ul.querySelectorAll('.icon-list-card-image a[href]').forEach((link) => {
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = link.title || link.textContent.trim() || '';

    moveInstrumentation(link, img);

    const picture = document.createElement('picture');
    picture.append(img);

    (link.closest('.button-container') || link).replaceWith(picture);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [{ width: '750' }],
    );

    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
