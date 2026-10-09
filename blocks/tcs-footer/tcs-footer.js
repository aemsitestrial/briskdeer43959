import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockRows = [...block.children];

  // 1. Heading Title (First row in block model)
  const mainTitleRow = blockRows.shift();
  const titleText = mainTitleRow?.textContent.trim() || "Let's build the future together";

  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  const heading = document.createElement('h2');
  heading.className = 'tcs-footer-heading';
  heading.textContent = titleText;
  footerContainer.append(heading);

  const floatingNav = document.createElement('div');
  floatingNav.className = 'tcs-footer-floating-nav';

  const searchRow = document.createElement('div');
  searchRow.className = 'tcs-footer-search-row';

  const ctaRow = document.createElement('div');
  ctaRow.className = 'tcs-footer-cta-row';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const legalNav = document.createElement('div');
  legalNav.className = 'tcs-footer-legal-nav';

  // Helper to reliably identify child model in Universal Editor
  const getModelType = (row) => {
    const model = row.getAttribute('data-aue-model') || row.dataset.aueModel;
    if (model) return model;

    // Direct field length matching fallbacks
    const cells = row.children.length;
    if (cells === 1) {
      if (row.textContent.includes('©') || row.querySelector('p')) return 'tcs-footer-copyright';
      return 'tcs-footer-hamburger';
    }
    if (cells === 2) {
      const val = row.textContent.toLowerCase();
      if (val.includes('both') || val.includes('text-only') || val.includes('voice-only')) {
        return 'tcs-footer-search';
      }
      return 'tcs-footer-legal-item';
    }
    if (cells >= 3) return 'tcs-footer-cta';
    return null;
  };

  // 2. Decorate authored child rows while preserving Universal Editor DOM bindings
  blockRows.forEach((row) => {
    const model = getModelType(row);
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger') {
      const ariaLabel = cells[0]?.textContent.trim() || 'Open navigation menu';
      row.className = 'tcs-footer-hamburger-wrapper';
      row.innerHTML = `
        <button class="tcs-footer-hamburger" aria-label="${ariaLabel}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      `;
      searchRow.append(row);
    } else if (model === 'tcs-footer-search') {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask us a question';

      row.className = `tcs-footer-search-box mode-${variation}`;
      let contentHtml = '';

      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" placeholder="${placeholder}" aria-label="Search">`;
      }

      contentHtml += '<div class="tcs-footer-search-actions">';

      if (variation === 'both' || variation === 'voice-only') {
        contentHtml += `
          <button class="mic-btn" aria-label="Voice Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>`;
      }

      contentHtml += `
        <button class="submit-btn" aria-label="Submit Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button></div>`;

      row.innerHTML = contentHtml;
      searchRow.append(row);
    } else if (model === 'tcs-footer-cta') {
      const label = cells[0]?.textContent.trim() || 'Click here';
      const link = cells[1]?.querySelector('a')?.href || '#';
      const target = cells[2]?.textContent.trim() || '_self';

      row.className = 'tcs-footer-cta-item';

      const ctaBtn = document.createElement('a');
      ctaBtn.className = 'tcs-footer-cta-btn';
      ctaBtn.href = link;
      ctaBtn.target = target;
      ctaBtn.innerHTML = `<span>${label}</span><span class="arrow">→</span>`;

      moveInstrumentation(cells[0], ctaBtn);
      row.innerHTML = '';
      row.append(ctaBtn);
      ctaRow.append(row);
    } else if (model === 'tcs-footer-copyright') {
      row.className = 'tcs-footer-copyright';
      const textHtml = cells[0]?.innerHTML || '©TATA Consultancy Services';
      row.innerHTML = textHtml;
      bottomRow.prepend(row);
    } else if (model === 'tcs-footer-legal-item') {
      const label = cells[0]?.textContent.trim() || 'Privacy & Terms';
      const link = cells[1]?.querySelector('a')?.href || '#';

      row.className = 'tcs-footer-legal-item-wrapper';

      const legalLink = document.createElement('a');
      legalLink.className = 'tcs-footer-legal-link';
      legalLink.href = link;
      legalLink.textContent = label;

      moveInstrumentation(cells[0], legalLink);
      row.innerHTML = '';
      row.append(legalLink);
      legalNav.append(row);
    }
  });

  // Assemble floating & bottom regions
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  if (ctaRow.children.length > 0) floatingNav.append(ctaRow);
  if (floatingNav.children.length > 0) footerContainer.append(floatingNav);

  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);

  // Floating behavior algorithm
  const handleScroll = () => {
    const footerRect = block.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (footerRect.top < windowHeight - 140) {
      floatingNav.classList.remove('is-fixed');
    } else {
      floatingNav.classList.add('is-fixed');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();
}
