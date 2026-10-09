import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockChildren = [...block.children];

  // 1. Process Header & Column Config
  const headerRow = blockChildren.shift();
  let columnCount = 0;

  if (headerRow) {
    const headerCells = [...headerRow.children];

    // Get column count
    const colValue = Number(headerCells[0]?.textContent.trim());
    if ([2, 3, 4, 5].includes(colValue)) {
      columnCount = colValue;
    }
    headerCells.shift(); // Exclude columns cell from header rendering

    // Render Eyebrow, Title, Description
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'icon-list-header';

    const fields = ['eyebrow', 'title', 'description'];
    headerCells.forEach((child, index) => {
      if (child.textContent.trim() || child.querySelector('img')) {
        const classSuffix = fields[index] || 'extra';
        child.className = `icon-list-header-${classSuffix}`;
        headerWrapper.append(child);
      }
    });

    block.append(headerWrapper);
    headerRow.remove();
  }

  // Set block layout class
  block.classList.add(`col-${columnCount}`);

  // 2. Process List Items
  const ul = document.createElement('ul');
  ul.className = 'icon-list-items';

  blockChildren.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const rowCells = [...row.children];

    // Read toggles & config (omitted from DOM structure)
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

    // Icon (if toggle is enabled)
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

    // Title (if toggle is enabled)
    if (displayTitle && titleCell && titleCell.textContent.trim()) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'icon-list-item-title';
      titleDiv.innerHTML = `<h3>${titleCell.textContent.trim()}</h3>`;
      contentDiv.append(titleDiv);
    }

    // Description (if toggle is enabled)
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

  block.append(ul);
}
