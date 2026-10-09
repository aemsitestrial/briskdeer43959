import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // 1. Process Block Meta Fields
  const titleText = rows[0]?.textContent.trim() || "Let's build the future together";
  const searchPlaceholder = rows[1]?.textContent.trim() || 'Ask us a question';
  const copyrightText = rows[2]?.innerHTML || '©TATA Consultancy Services 2027';

  // Item child rows start from index 3
  const childRows = rows.slice(3);

  // 2. Separate CTAs and Legal Items
  const ctaItems = [];
  const legalItems = [];

  childRows.forEach((row) => {
    const isLegal = row.getAttribute('data-aue-model') === 'tcs-footer-legal-item' || row.dataset.aueModel === 'tcs-footer-legal-item';
    if (isLegal) {
      legalItems.push(row);
    } else {
      ctaItems.push(row);
    }
  });

  // 3. Build UI Structure
  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  // Title
  const heading = document.createElement('h2');
  heading.className = 'tcs-footer-heading';
  heading.textContent = titleText;
  footerContainer.append(heading);

  // Floating Control Bar Container (Hamburger + Search + CTAs)
  const floatingNav = document.createElement('div');
  floatingNav.className = 'tcs-footer-floating-nav';

  // Floating Search Row
  const searchRow = document.createElement('div');
  searchRow.className = 'tcs-footer-search-row';

  // Hamburger Button
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'tcs-footer-hamburger';
  hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
  hamburgerBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `;
  searchRow.append(hamburgerBtn);

  // Search Input Box
  const searchBox = document.createElement('div');
  searchBox.className = 'tcs-footer-search-box';
  searchBox.innerHTML = `
    <input type="text" placeholder="${searchPlaceholder}" aria-label="Search">
    <div class="tcs-footer-search-actions">
      <button class="mic-btn" aria-label="Voice Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </button>
      <button class="submit-btn" aria-label="Submit Search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  `;
  searchRow.append(searchBox);
  floatingNav.append(searchRow);

  // CTA Links Row
  if (ctaItems.length > 0) {
    const ctaRow = document.createElement('div');
    ctaRow.className = 'tcs-footer-cta-row';

    ctaItems.forEach((row) => {
      const cells = [...row.children];
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
      row.remove();
    });

    floatingNav.append(ctaRow);
  }

  footerContainer.append(floatingNav);

  // Bottom Row (Copyright & Legal)
  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const copyrightDiv = document.createElement('div');
  copyrightDiv.className = 'tcs-footer-copyright';
  copyrightDiv.innerHTML = copyrightText;
  bottomRow.append(copyrightDiv);

  if (legalItems.length > 0) {
    const legalNav = document.createElement('div');
    legalNav.className = 'tcs-footer-legal-nav';

    legalItems.forEach((row) => {
      const cells = [...row.children];
      const label = cells[0]?.textContent.trim();
      const link = cells[1]?.querySelector('a')?.href || '#';

      if (label) {
        const legalLink = document.createElement('a');
        legalLink.href = link;
        legalLink.textContent = label;
        moveInstrumentation(row, legalLink);
        legalNav.append(legalLink);
      }
      row.remove();
    });

    bottomRow.append(legalNav);
  }

  footerContainer.append(bottomRow);

  // Clear original DOM structure & inject custom layout
  block.textContent = '';
  block.append(footerContainer);

  // 4. Scroll floating behavior (Sticks to viewport bottom until reaching the footer)
  const handleScroll = () => {
    const footerRect = block.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // If footer is scrolled into view, let floatingNav dock inside footer
    if (footerRect.top < windowHeight - 120) {
      floatingNav.classList.remove('is-fixed');
    } else {
      floatingNav.classList.add('is-fixed');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
}
