export default function decorate(block) {
  // Main section containers
  const container = document.createElement('div');
  container.classList.add('icon-list-container');

  const headerWrapper = document.createElement('div');
  headerWrapper.classList.add('icon-list-header');

  const cardsGrid = document.createElement('div');
  cardsGrid.classList.add('icon-list-cards-grid');

  const rows = [...block.children];

  rows.forEach((row, index) => {
    // Process top-level block title & description if first row contains list metadata
    const isCard = row.classList.contains('icon-cards') || row.querySelector('[data-name="title"]') || row.children.length > 2;

    if (index === 0 && !isCard) {
      const titleElem = row.children[0];
      if (titleElem && titleElem.textContent.trim()) {
        const title = document.createElement('h2');
        title.classList.add('icon-list-title');
        title.innerHTML = titleElem.innerHTML;
        headerWrapper.appendChild(title);
      }

      const descElem = row.children[1];
      if (descElem && descElem.textContent.trim()) {
        const desc = document.createElement('p');
        desc.classList.add('icon-list-description');
        desc.innerHTML = descElem.innerHTML;
        headerWrapper.appendChild(desc);
      }
      return;
    }

    // Process individual Card (`icon-cards`)
    const card = document.createElement('div');
    card.classList.add('icon-card');

    // Extract fields or fallback defaults
    const colorVal = row.dataset.defaultCardColor || (index === (headerWrapper.children.length ? 1 : 0) ? 'blue' : 'grey');
    card.classList.add(`card-color-${colorVal}`);

    const { motionType } = row.dataset;
    if (motionType && motionType !== 'none') {
      card.classList.add(`motion-${motionType}`);
    }

    // Background Image
    const bgImg = row.querySelector('[data-name="cardBgImage"] img, img.card-bg-img');
    if (bgImg) {
      card.style.backgroundImage = `url('${bgImg.src}')`;
      card.classList.add('has-bg-img');
    }

    // Top Icon
    const iconImg = row.querySelector('[data-name="icon"] img, img:not(.card-bg-img)');
    if (iconImg) {
      const iconWrapper = document.createElement('div');
      iconWrapper.classList.add('icon-card-icon');
      iconWrapper.appendChild(iconImg.cloneNode(true));
      card.appendChild(iconWrapper);
    }

    // Text & Content Container
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('icon-card-content');

    // Eyebrow
    const eyebrowText = row.querySelector('[data-name="eyebrow"]')?.textContent?.trim();
    if (eyebrowText) {
      const eyebrow = document.createElement('span');
      eyebrow.classList.add('icon-card-eyebrow');
      eyebrow.textContent = eyebrowText;
      contentWrapper.appendChild(eyebrow);
    }

    // Title / Statistic (e.g. "89%", "$340BN")
    const titleVal = row.querySelector('[data-name="title"]')?.innerHTML || row.querySelector('h3, h4')?.innerHTML || row.children[0]?.innerHTML;
    if (titleVal) {
      const cardTitle = document.createElement('div');
      cardTitle.classList.add('icon-card-title');
      cardTitle.innerHTML = titleVal;
      contentWrapper.appendChild(cardTitle);
    }

    // Card Description
    const descVal = row.querySelector('[data-name="description"]')?.innerHTML || row.querySelector('p:not(.icon-card-eyebrow)')?.innerHTML || row.children[1]?.innerHTML;
    if (descVal) {
      const cardDesc = document.createElement('p');
      cardDesc.classList.add('icon-card-desc');
      cardDesc.innerHTML = descVal;
      contentWrapper.appendChild(cardDesc);
    }

    card.appendChild(contentWrapper);
    cardsGrid.appendChild(card);
  });

  // Re-assemble Block Output
  block.textContent = '';
  if (headerWrapper.children.length > 0) {
    block.appendChild(headerWrapper);
  }
  block.appendChild(cardsGrid);
}
