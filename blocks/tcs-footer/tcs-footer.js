import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Resolves content paths for AEM authoring/publishing environments
 * E.g., /praneeth/dummy-1 -> /content/2026/39/briskdeer43959/praneeth/dummy-1.html
 */
function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';

  let resolvedPath = path;

  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `/content/2026/39/briskdeer43959${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
  }

  return resolvedPath.endsWith('.html') ? resolvedPath : `${resolvedPath}.html`;
}

/**
 * Fetches site hierarchy from /query-index.json into an L1 -> L2 -> L3 tree structure
 */
async function fetchHierarchicalNavData() {
  try {
    const response = await fetch('/query-index.json');
    if (!response.ok) return [];
    const json = await response.json();
    const data = json.data || json;

    const navTree = {};

    data.forEach((item) => {
      const path = item.path || '';
      const segments = path.split('/').filter(Boolean);

      let locale = '';
      if (segments[0] && segments[0].length === 2) {
        locale = segments.shift();
      }

      if (segments.length === 0) return;

      const l1Key = segments[0];
      if (!navTree[l1Key]) {
        navTree[l1Key] = {
          title: item.title && segments.length === 1 ? item.title : l1Key.replace(/-/g, ' '),
          path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}`),
          l2Map: {},
        };
      }

      if (segments.length >= 2) {
        const l2Key = segments[1];
        if (!navTree[l1Key].l2Map[l2Key]) {
          navTree[l1Key].l2Map[l2Key] = {
            title: item.title && segments.length === 2 ? item.title : l2Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}`),
            l3List: [],
          };
        }

        if (segments.length >= 3) {
          const l3Key = segments[2];
          navTree[l1Key].l2Map[l2Key].l3List.push({
            title: item.title || l3Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}/${l3Key}`),
          });
        }
      }
    });

    return Object.values(navTree).map((l1) => ({
      ...l1,
      l2List: Object.values(l1.l2Map),
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load navigation index:', error);
    return [];
  }
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

  // Floating Bar Containers
  const floatingNav = document.createElement('div');
  floatingNav.className = 'tcs-footer-floating-nav';

  const searchRow = document.createElement('div');
  searchRow.className = 'tcs-footer-search-row';

  // Horizontal Navigation Pill Bar
  const navPillsRow = document.createElement('div');
  navPillsRow.className = 'tcs-footer-nav-pills-row hidden';

  // Floating Glassmorphism Submenu Grid Panel
  const subMenuPanel = document.createElement('div');
  subMenuPanel.className = 'tcs-footer-submenu-panel hidden';

  const ctaRow = document.createElement('div');
  ctaRow.className = 'tcs-footer-cta-row';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const legalNav = document.createElement('div');
  legalNav.className = 'tcs-footer-legal-nav';

  let hamburgerBtnNode = null;
  let isL1NavOpen = false;
  let isSubNavActive = false;
  let navTreeData = null;

  const getModelType = (row) => {
    const model = row.getAttribute('data-aue-model') || row.dataset.aueModel;
    if (model) return model;

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

  // 2. Process Authored Items
  blockRows.forEach((row) => {
    const model = getModelType(row);
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger') {
      const ariaLabel = cells[0]?.textContent.trim() || 'Open navigation menu';
      row.className = 'tcs-footer-hamburger-wrapper';
      row.innerHTML = `
        <button class="tcs-footer-hamburger" aria-label="${ariaLabel}" aria-expanded="false">
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
      hamburgerBtnNode = row.querySelector('.tcs-footer-hamburger');
      searchRow.append(row);
    } else if (model === 'tcs-footer-search') {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask Canvas Search';

      row.className = `tcs-footer-search-box mode-${variation}`;
      let contentHtml = '';

      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" placeholder="${placeholder}" aria-label="Ask Canvas Search">`;
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
      row.innerHTML = cells[0]?.innerHTML || '©TATA Consultancy Services';
      bottomRow.prepend(row);
    } else if (model === 'tcs-footer-legal-item') {
      const label = cells[0]?.textContent.trim() || 'Privacy & Terms';
      const link = formatHtmlPath(cells[1]?.querySelector('a')?.href || '#');

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

  // Assemble floating structure
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navPillsRow);
  if (ctaRow.children.length > 0) floatingNav.append(ctaRow);

  if (floatingNav.children.length > 0) {
    footerContainer.append(subMenuPanel);
    footerContainer.append(floatingNav);
  }

  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);

  // Render Glassmorphism Submenu Grid Panel for Sub-pages (L2/L3)
  const renderSubmenuCard = (items) => {
    if (!items || items.length === 0) {
      subMenuPanel.classList.add('hidden');
      return;
    }

    subMenuPanel.innerHTML = `
      <div class="tcs-submenu-grid">
        ${items
    .map(
      (item) => `
          <a href="${item.path}" class="tcs-submenu-item">
            <span>${item.title}</span>
            <span class="arrow">→</span>
          </a>
        `,
    )
    .join('')}
      </div>
    `;
    subMenuPanel.classList.remove('hidden');
  };

  // Render Primary Parent (L1) Navigation Bar
  const renderL1ParentNavigation = async () => {
    navPillsRow.innerHTML = '';
    isSubNavActive = false;
    subMenuPanel.classList.add('hidden');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    navTreeData.forEach((l1) => {
      const l1Pill = document.createElement('button');
      l1Pill.className = 'tcs-nav-pill';
      const hasL2 = l1.l2List && l1.l2List.length > 0;

      l1Pill.innerHTML = `
        <span>${l1.title}</span>
        ${hasL2 ? '<span class="chevron">∨</span>' : ''}
      `;

      // Hovering or Clicking L1 enters Subpage Navigation state
      const enterSubPageNav = () => {
        isSubNavActive = true;

        // Ensure button icon stays as Hamburger (☰) during subpage view
        hamburgerBtnNode.querySelector('.icon-hamburger').classList.remove('hidden');
        hamburgerBtnNode.querySelector('.icon-close').classList.add('hidden');

        // Highlight selected parent pill and render L2 items in glass card
        navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
        l1Pill.classList.add('active');

        if (hasL2) {
          renderSubmenuCard(l1.l2List);
        } else {
          subMenuPanel.classList.add('hidden');
        }
      };

      l1Pill.addEventListener('mouseenter', enterSubPageNav);
      l1Pill.addEventListener('click', enterSubPageNav);

      navPillsRow.append(l1Pill);
    });

    navPillsRow.classList.remove('hidden');
  };

  // Close all navigation and reset to default initial state
  const closeAllNavigation = () => {
    isL1NavOpen = false;
    isSubNavActive = false;

    hamburgerBtnNode.setAttribute('aria-expanded', 'false');
    hamburgerBtnNode.querySelector('.icon-hamburger').classList.remove('hidden');
    hamburgerBtnNode.querySelector('.icon-close').classList.add('hidden');

    navPillsRow.classList.add('hidden');
    subMenuPanel.classList.add('hidden');
  };

  // 3. Hamburger Click Handling
  if (hamburgerBtnNode) {
    hamburgerBtnNode.addEventListener('click', async () => {
      // RULE: If in sub-pages or L2/L3 view, clicking Hamburger returns to parent L1 navigation
      if (isSubNavActive) {
        await renderL1ParentNavigation();
        hamburgerBtnNode.querySelector('.icon-hamburger').classList.add('hidden');
        hamburgerBtnNode.querySelector('.icon-close').classList.remove('hidden');
        return;
      }

      // Toggle main L1 parent navigation open/close
      if (!isL1NavOpen) {
        isL1NavOpen = true;
        hamburgerBtnNode.setAttribute('aria-expanded', 'true');
        hamburgerBtnNode.querySelector('.icon-hamburger').classList.add('hidden');
        hamburgerBtnNode.querySelector('.icon-close').classList.remove('hidden');

        await renderL1ParentNavigation();
      } else {
        closeAllNavigation();
      }
    });
  }

  // Hide submenus when mouse leaves footer area
  footerContainer.addEventListener('mouseleave', () => {
    subMenuPanel.classList.add('hidden');
    navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
  });

  // Floating behavior on page scroll
  const handleScroll = () => {
    const footerRect = block.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (footerRect.top < windowHeight - 140) {
      floatingNav.classList.remove('is-fixed');
      subMenuPanel.classList.remove('is-fixed');
    } else {
      floatingNav.classList.add('is-fixed');
      subMenuPanel.classList.add('is-fixed');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();
}
