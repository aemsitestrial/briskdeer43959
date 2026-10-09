import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockChildren = [...block.children];

  // 1. Process Header Fields (First 4 rows of the block model)
  // Row 0: Columns, Row 1: Eyebrow, Row 2: Title, Row 3: Description
  let columnCount = 3;
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'icon-list-header';

  const fields = ['eyebrow', 'title', 'description'];

  // Identify item rows vs main block field rows
  const itemRows = [];

  blockChildren.forEach((row) => {
    // Check if the row is an authored item component
    const isItem = row.getAttribute('data-aue-model') === 'icon-list-item'
      || row.dataset.aueModel === 'icon-list-item'
      || row.children.length >= 8; // Card items have 10 columns

    if (isItem) {
      itemRows.push(row);
    } else {
      // Process main block fields
      const cellText = row.textContent.trim();

      // If it's the column configuration row
      if ([2, 3, 4, 5].includes(Number(cellText))) {
        columnCount = Number(cellText);
      } else if (cellText || row.querySelector('img')) {
        const classSuffix = fields.shift() || 'extra';
        row.className = `icon-list-header-${classSuffix}`;
        headerWrapper.append(row);
      } else {
        row.remove();
      }
    }
  });

  // Apply column layout class
  block.classList.add(`col-${columnCount}`);

  if (headerWrapper.children.length > 0) {
    block.append(headerWrapper);
  }

  // 2. Process ONLY Authored Item Rows
  const ul = document.createElement('ul');
  ul.className = 'icon-list-items';

  itemRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const rowCells = [...row.children];

    // Read toggles & config
    const viewCardImageTop = rowCells[0]?.textContent.trim().toLowerCase() === 'true';
    const cardColor = rowCells[1]?.textContent.trim().toLowerCase() || 'light';
    const displayIcon = rowCells[2]?.textContent.trim().toLowerCase() !== 'false';
    const displayTitle = rowCells[3]?.textContent.trim().toLowerCase() !== 'false';
    const displayDesc = rowCells[4]?.textContent.trim().toLowerCase() !== 'false';

    // Content fields
    const iconCell = rowCells[5];
    const bgImageCell = rowCells[6];
    const motionType = rowCells[7]?.textContent.trim().toLowerCase() || 'none';
    const titleCell = rowCells[8];
    const descCell = rowCells[9];

    // Apply configuration classes
    li.classList.add(`card-color-${cardColor}`);
    if (viewCardImageTop) li.classList.add('card-img-top');
    if (motionType !== 'none') li.classList.add(`motion-${motionType}`);

    // Card BG Image
    if (bgImageCell && bgImageCell.querySelector('a, img')) {
      const bgDiv = document.createElement('div');
      bgDiv.className = 'icon-list-item-bg';
      const bgLink = bgImageCell.querySelector('a');
      const imgSrc = bgLink ? bgLink.href : bgImageCell.querySelector('img')?.src;
      if (imgSrc) {
        const bgPic = createOptimizedPicture(imgSrc, 'Background', false, [{ width: '750' }]);
        bgDiv.append(bgPic);
        li.append(bgDiv);
      }
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'icon-list-item-content';

    // Icon (if toggle enabled)
    if (displayIcon && iconCell) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'icon-list-item-icon';
      const iconLink = iconCell.querySelector('a');
      const iconSrc = iconLink ? iconLink.href : iconCell.querySelector('img')?.src;

      if (iconSrc) {
        const iconPic = createOptimizedPicture(iconSrc, 'Icon', false, [{ width: '120' }]);
        iconWrapper.append(iconPic);
        contentDiv.append(iconWrapper);
      }
    }

    // Title (if toggle enabled)
    if (displayTitle && titleCell && titleCell.textContent.trim()) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'icon-list-item-title';
      titleDiv.innerHTML = `<h3>${titleCell.textContent.trim()}</h3>`;
      contentDiv.append(titleDiv);
    }

    // Description (if toggle enabled)
    if (displayDesc && descCell && descCell.textContent.trim()) {
      const descDiv = document.createElement('div');
      descDiv.className = 'icon-list-item-desc';
      descDiv.innerHTML = descCell.innerHTML;
      contentDiv.append(descDiv);
    }

    li.append(contentDiv);
    ul.append(li);
    row.remove();
  });

  if (ul.children.length > 0) {
    block.append(ul);
  }
}
