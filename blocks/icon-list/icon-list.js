import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockRows = [...block.children];

  // 1. Process Header Row (Columns + Eyebrow + Block Title + Block Desc)
  const headerRow = blockRows.shift();
  let columnCount = 3;
  let headerWrapper = null;

  if (headerRow) {
    const headerCells = [...headerRow.children];

    // Read column setting from first cell
    const colValue = Number(headerCells[0]?.textContent.trim());
    if ([2, 3, 4, 5].includes(colValue)) {
      columnCount = colValue;
    }
    headerCells.shift(); // Remove column configuration cell from header rendering

    // Construct Header block if content exists
    headerWrapper = document.createElement('div');
    headerWrapper.className = 'icon-list-header';

    const fields = ['eyebrow', 'title', 'description'];
    headerCells.forEach((child, index) => {
      if (child.textContent.trim() || child.querySelector('img')) {
        const classSuffix = fields[index] || 'extra';
        child.className = `icon-list-header-${classSuffix}`;
        headerWrapper.append(child);
      }
    });
  }

  // 2. Process Only Valid Card Item Rows
  const ul = document.createElement('ul');
  ul.className = 'icon-list-items';

  blockRows.forEach((row) => {
    const rowCells = [...row.children];

    // Content fields (indices match model definition)
    const iconCell = rowCells[5];
    const bgImageCell = rowCells[6];
    const titleCell = rowCells[8];
    const descCell = rowCells[9];

    // Verification check: Only create a card if title, desc, icon, or bgImage exist
    const hasContent = titleCell?.textContent.trim()
      || descCell?.textContent.trim()
      || iconCell?.querySelector('a, img')
      || bgImageCell?.querySelector('a, img');

    if (!hasContent) return; // Skip empty/placeholder rows

    const li = document.createElement('li');
    moveInstrumentation(row, li);

    // Read functional toggles
    const viewCardImageTop = rowCells[0]?.textContent.trim().toLowerCase() === 'true';
    const cardColor = rowCells[1]?.textContent.trim().toLowerCase() || 'light';
    const displayIcon = rowCells[2]?.textContent.trim().toLowerCase() !== 'false';
    const displayTitle = rowCells[3]?.textContent.trim().toLowerCase() !== 'false';
    const displayDesc = rowCells[4]?.textContent.trim().toLowerCase() !== 'false';
    const motionType = rowCells[7]?.textContent.trim().toLowerCase() || 'none';

    // Apply item configuration classes
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

    // Render Icon
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

    // Render Title
    if (displayTitle && titleCell && titleCell.textContent.trim()) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'icon-list-item-title';
      titleDiv.innerHTML = `<h3>${titleCell.textContent.trim()}</h3>`;
      contentDiv.append(titleDiv);
    }

    // Render Description
    if (displayDesc && descCell && descCell.textContent.trim()) {
      const descDiv = document.createElement('div');
      descDiv.className = 'icon-list-item-desc';
      descDiv.innerHTML = descCell.innerHTML;
      contentDiv.append(descDiv);
    }

    li.append(contentDiv);
    ul.append(li);
  });

  // 3. Clear existing DOM contents completely before attaching generated tree
  block.textContent = '';
  block.classList.add(`col-${columnCount}`);

  if (headerWrapper && headerWrapper.children.length > 0) {
    block.append(headerWrapper);
  }

  // Only append UL if items were authored
  if (ul.children.length > 0) {
    block.append(ul);
  }
}
