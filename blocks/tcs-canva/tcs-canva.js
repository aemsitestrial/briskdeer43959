import { moveInstrumentation } from '../../scripts/scripts.js';

function isCtaItem(element) {
  return element.classList.contains('tcs-canva-cta')
    || element.dataset.aueModel === 'tcs-canva-cta';
}

function getFieldCell(item, fieldName, index) {
  const instrumentedField = item.querySelector(`[data-aue-prop="${fieldName}"]`);
  if (instrumentedField) return instrumentedField;

  const keyedRow = [...item.children].find((row) => {
    const key = row.firstElementChild?.textContent.trim().toLowerCase();
    return key === fieldName;
  });
  if (keyedRow?.children[1]) return keyedRow.children[1];

  return item.children[index] || null;
}

function getFieldValue(cell, preferHref = false) {
  if (!cell) return '';
  const link = cell.matches('a[href]') ? cell : cell.querySelector('a[href]');
  if (preferHref && link) return link.getAttribute('href') || link.href;
  return cell.textContent.trim();
}

function decorateCtaItem(item) {
  if (item.dataset.tcsCanvaDecorated === 'true') return item;

  const labelCell = getFieldCell(item, 'label', 0);
  const linkCell = getFieldCell(item, 'link', 1);
  const targetCell = getFieldCell(item, 'target', 2);
  const label = getFieldValue(labelCell);
  if (!label) return null;

  const href = getFieldValue(linkCell, true);
  const requestedTarget = getFieldValue(targetCell);
  const target = ['_blank', '_self'].includes(requestedTarget) ? requestedTarget : '_self';
  const sourceFields = document.createElement('div');
  sourceFields.className = 'tcs-canva-cta-fields';
  sourceFields.setAttribute('aria-hidden', 'true');
  [...item.childNodes].forEach((node) => sourceFields.append(node));
  sourceFields.querySelectorAll('a, button, input, select, textarea, [tabindex]')
    .forEach((element) => element.setAttribute('tabindex', '-1'));
  item.append(sourceFields);

  let cta;
  if (href) {
    cta = document.createElement('a');
    cta.href = href;
    cta.target = target;
    if (target === '_blank') cta.rel = 'noopener noreferrer';
  } else {
    cta = document.createElement('span');
  }
  cta.className = 'tcs-canva-cta-pill';
  cta.textContent = label;
  item.append(cta);
  item.classList.add('tcs-canva-cta-item');
  item.dataset.tcsCanvaDecorated = 'true';
  return item;
}

export default function decorate(block) {
  const authoredItems = [...block.children].filter(isCtaItem);
  const fieldRows = [...block.children].filter((row) => !authoredItems.includes(row));

  const container = document.createElement('div');
  container.className = 'tcs-canva-container';

  const content = document.createElement('div');
  content.className = 'tcs-canva-content';

  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'tcs-canva-cta-container';

  const titleCell = fieldRows[0]?.querySelector(':scope > div') || fieldRows[0];
  const descriptionCell = fieldRows[1]?.querySelector(':scope > div') || fieldRows[1];
  const title = titleCell?.textContent?.trim() || 'How can TCS help you?';

  const heading = document.createElement('h2');
  heading.className = 'tcs-canva-title';
  heading.textContent = title;
  if (fieldRows[0]) moveInstrumentation(fieldRows[0], heading);
  if (titleCell && titleCell !== fieldRows[0]) moveInstrumentation(titleCell, heading);

  const description = document.createElement('div');
  description.className = 'tcs-canva-description';
  if (descriptionCell?.textContent.trim()) {
    description.append(...[...descriptionCell.childNodes]);
  } else {
    description.textContent = 'Describe or select a challenge, opportunity or ambition';
  }
  if (fieldRows[1]) moveInstrumentation(fieldRows[1], description);
  if (descriptionCell && descriptionCell !== fieldRows[1]) {
    moveInstrumentation(descriptionCell, description);
  }

  const placeholder = document.createElement('div');
  placeholder.className = 'tcs-canva-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');

  content.append(heading, description, placeholder);
  authoredItems.forEach((item) => {
    const ctaItem = decorateCtaItem(item);
    if (ctaItem) ctaContainer.append(ctaItem);
  });

  content.append(ctaContainer);
  container.append(content);

  fieldRows.slice(0, 2).forEach((row) => row.remove());
  block.append(container);
}
