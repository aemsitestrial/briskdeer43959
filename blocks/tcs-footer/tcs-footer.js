import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockRows = [...block.children];

  // 1. Process Main Block Title (First Row)
  const mainTitleRow = blockRows.shift();
  const titleText = mainTitleRow?.textContent.trim() || "Let's build the future together";

  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  const heading = document.createElement('h2');
  heading.className = 'tcs-footer-heading';
  heading.textContent = titleText;
  footerContainer.append(heading);

  // Containers for Floating Bar and Bottom Bar
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

  // 2. Iterate dynamically over authored child blocks
  blockRows.forEach((row) => {
    const model = row.getAttribute('data-aue-model') || row.dataset.aueModel;
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger') {
      const ariaLabel = cells[0]?.textContent.trim() || 'Open navigation menu';
      const hamburgerBtn = document.createElement('button');
      hamburgerBtn.className = 'tcs-footer-hamburger';
      hamburgerBtn.setAttribute('aria-label', ariaLabel);
      moveInstrumentation(row, hamburgerBtn);
      hamburgerBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>`;
      searchRow.append(hamburgerBtn);
    } else if (model === 'tcs-footer-search') {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask us a question';

      const searchBox = document.createElement('div');
      searchBox.className = `tcs-footer-search-box mode-${variation}`;
      moveInstrumentation(row, searchBox);

      let innerHTML = '';

      // Text Input (If both or text-only)
      if (variation !== 'voice-only') {
        innerHTML += `<input type="text" placeholder="${placeholder}" aria-label="Search">`;
      }

      innerHTML += '<div class="tcs-footer-search-actions">';

      // Voice Mic Icon (If both or voice-only)
      if (variation === 'both' || variation === 'voice-only') {
        innerHTML += `
          <button class="mic-btn" aria-label="Voice Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>`;
      }

      // Submit Button
      innerHTML += `
        <button class="submit-btn" aria-label="Submit Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button></div>`;

      searchBox.innerHTML = innerHTML;
      searchRow.append(searchBox);
    } else if (model === 'tcs-footer-cta') {
      const label = cells[0]?.textContent.trim();
      const link = cells[1]?.querySelector('a')?.href || '#';
      const target = cells[2]?.textContent.trim() || '_self';

      if (label) {
        const ctaBtn = document.createElement('a');
        ctaBtn.className = 'tcs-footer-cta-btn';
        ctaBtn.href = link;
        ctaBtn.target = target;
        moveInstrumentation(row, ctaBtn);
        ctaBtn.innerHTML = `<span>${label}</span><span class="arrow">→</span>`;
        ctaRow.append(ctaBtn);
      }
    } else if (model === 'tcs-footer-copyright') {
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'tcs-footer-copyright';
      moveInstrumentation(row, copyrightDiv);
      copyrightDiv.innerHTML = cells[0]?.innerHTML || '';
      bottomRow.prepend(copyrightDiv);
    } else if (model === 'tcs-footer-legal-item') {
      const label = cells[0]?.textContent.trim();
      const link = cells[1]?.querySelector('a')?.href || '#';

      if (label) {
        const legalLink = document.createElement('a');
        legalLink.href = link;
        legalLink.textContent = label;
        moveInstrumentation(row, legalLink);
        legalNav.append(legalLink);
      }
    }
  });

  // Assemble Floating Bar
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  if (ctaRow.children.length > 0) floatingNav.append(ctaRow);
  if (floatingNav.children.length > 0) footerContainer.append(floatingNav);

  // Assemble Bottom Bar
  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  // Clear original DOM and attach final layout
  block.textContent = '';
  block.append(footerContainer);

  // 3. Floating Scroll Handler (Floats fixed above viewport bottom until scrolled to footer)
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
