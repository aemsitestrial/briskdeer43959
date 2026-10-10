import { moveInstrumentation } from '../../scripts/scripts.js';

function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';
  let resolvedPath = path;
  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `/content/2026/39/briskdeer43959${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
  }
  return resolvedPath.endsWith('.html') ? resolvedPath : `${resolvedPath}.html`;
}

export default function decorate(block) {
  const blockRows = [...block.children];

  // 1. Heading Title
  const mainTitleRow = blockRows.shift();
  const titleText = mainTitleRow?.textContent.trim() || "Let's build the future together";

  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  const heading = document.createElement('h2');
  heading.className = 'tcs-footer-heading';
  heading.textContent = titleText;
  footerContainer.append(heading);

  // Floating Control Bar
  const floatingNav = document.createElement('div');
  floatingNav.className = 'tcs-footer-floating-nav';

  const searchRow = document.createElement('div');
  searchRow.className = 'tcs-footer-search-row';

  const navPillsRow = document.createElement('div');
  navPillsRow.className = 'tcs-footer-nav-pills-row hidden';

  const subMenuPanel = document.createElement('div');
  subMenuPanel.className = 'tcs-footer-submenu-panel hidden';

  const ctaRow = document.createElement('div');
  ctaRow.className = 'tcs-footer-cta-row';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const legalNav = document.createElement('div');
  legalNav.className = 'tcs-footer-legal-nav';

  let hamburgerWrapperNode = null;
  let searchBoxWrapperNode = null;

  // Explicit AEM Component Attribute Reader
  const getModelType = (row) => {
    // 1. Check AEM Universal Editor attributes first (highest priority)
    const aueComp = row.getAttribute('data-aue-component') 
                 || row.getAttribute('data-aue-model') 
                 || row.dataset.aueComponent 
                 || row.dataset.aueModel;

    if (aueComp) return aueComp;

    // 2. Fallback text checks for published/preview pages
    const text = row.textContent.trim().toLowerCase();
    
    if (text.includes('both') || text.includes('text-only') || text.includes('voice-only') || text.includes('ask')) {
      return 'tcs-footer-search';
    }
    if (text.includes('©') || text.includes('tata consultancy')) {
      return 'tcs-footer-copyright';
    }
    if (text.includes('privacy') || text.includes('terms') || text.includes('legal')) {
      return 'tcs-footer-legal-item';
    }
    if (row.children.length === 1 && (text.includes('menu') || text === '')) {
      return 'tcs-footer-hamburger';
    }

    return 'tcs-footer-cta';
  };

  // 2. Process Authored Rows directly to their correct containers
  blockRows.forEach((row) => {
    const model = getModelType(row);
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger') {
      if (hamburgerWrapperNode) return;
      row.className = 'tcs-footer-hamburger-wrapper';
      row.innerHTML = `
        <button class="tcs-footer-hamburger" aria-label="Open navigation menu" aria-expanded="false">
          <span class="icon-hamburger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </span>
          <span class="icon-close hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>
      `;
      hamburgerWrapperNode = row;
      searchRow.append(hamburgerWrapperNode);
    } else if (model === 'tcs-footer-search') {
      if (searchBoxWrapperNode) return;
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask Canvas Search';

      row.className = `tcs-footer-search-box mode-${variation}`;
      searchBoxWrapperNode = row;

      const formEl = document.createElement('form');
      formEl.className = 'tcs-search-form';
      formEl.action = '#';

      let contentHtml = '';
      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" class="tcs-search-input" placeholder="${placeholder}" aria-label="Search">`;
      }
      contentHtml += '<div class="tcs-footer-search-actions">';
      if (variation === 'both' || variation === 'voice-only') {
        contentHtml += `
          <button type="button" class="mic-btn" aria-label="Voice Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>`;
      }
      contentHtml += `
        <button type="submit" class="submit-btn" aria-label="Submit Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button></div>`;

      formEl.innerHTML = contentHtml;
      row.innerHTML = '';
      row.append(formEl);
      searchRow.append(searchBoxWrapperNode);
    } else if (model === 'tcs-footer-cta') {
      const label = cells[0]?.textContent.trim() || 'Click here';
      const link = formatHtmlPath(cells[1]?.querySelector('a')?.href || '#');
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
      row.innerHTML = cells[0]?.innerHTML || '©TATA Consultancy Services 2027';
      bottomRow.prepend(row);
    } else if (model === 'tcs-footer-legal-item') {
      const label = cells[0]?.textContent.trim() || 'Privacy & Terms';
      const link = formatHtmlPath(cells[1]?.querySelector('a')?.href || '#');
      const target = cells[2]?.textContent.trim() || '_self';

      row.className = 'tcs-footer-legal-item-wrapper';
      const legalLink = document.createElement('a');
      legalLink.className = 'tcs-footer-legal-link';
      legalLink.href = link;
      legalLink.target = target;
      legalLink.textContent = label;

      moveInstrumentation(cells[0], legalLink);
      row.innerHTML = '';
      row.append(legalLink);
      legalNav.append(row);
    }
  });

  // Assemble floating structure
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navPillsRow);

  if (floatingNav.children.length > 0) {
    footerContainer.append(subMenuPanel);
    footerContainer.append(floatingNav);
  }

  if (ctaRow.children.length > 0) footerContainer.append(ctaRow);
  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);
}