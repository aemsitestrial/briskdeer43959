import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Resolves content paths for AEM authoring/publishing environments
 * E.g., /praneeth/dummy-1 -> /content/2026/39/briskdeer43959/praneeth/dummy-1.html
 */
function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';

  let resolvedPath = path;

  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `/content/2026/39/briskdeer43959${
      resolvedPath.startsWith('/') ? '' : '/'
    }${resolvedPath}`;
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

  // Floating Control Bar
  const floatingNav = document.createElement('div');
  floatingNav.className = 'tcs-footer-floating-nav';

  const searchRow = document.createElement('div');
  searchRow.className = 'tcs-footer-search-row';

  // Navigation Pill Row (L1 / L2 horizontal bar)
  const navPillsRow = document.createElement('div');
  navPillsRow.className = 'tcs-footer-nav-pills-row hidden';

  // Floating Submenu Panel (L3 / Child Items Grid Card)
  const subMenuPanel = document.createElement('div');
  subMenuPanel.className = 'tcs-footer-submenu-panel hidden';

  const ctaRow = document.createElement('div');
  ctaRow.className = 'tcs-footer-cta-row';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const legalNav = document.createElement('div');
  legalNav.className = 'tcs-footer-legal-nav';

  let hamburgerBtnNode = null;
  let isNavOpen = false;
  let navTreeData = null;

  // State Tracking for Navigation Levels
  let currentNavLevel = 'L1'; // 'L1', 'L2', 'L3'

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
          <span class="active-l2-label hidden"></span>
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

  // Render Submenu Panel for Sub-pages
  const renderSubmenuCard = (itemList) => {
    if (!itemList || itemList.length === 0) {
      subMenuPanel.classList.add('hidden');
      return;
    }

    subMenuPanel.innerHTML = `
      <div class="tcs-submenu-grid">
        ${itemList
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

  // Helper to Update Button Icon State
  const updateButtonIconState = (level, labelText = '') => {
    currentNavLevel = level;
    const hamburgerIcon = hamburgerBtnNode.querySelector('.icon-hamburger');
    const closeIcon = hamburgerBtnNode.querySelector('.icon-close');
    const labelSpan = hamburgerBtnNode.querySelector('.active-l2-label');

    if (level === 'L1') {
      hamburgerIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
      labelSpan.classList.add('hidden');
      hamburgerBtnNode.classList.remove('has-active-l2');
    } else {
      hamburgerIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
      if (labelText) {
        labelSpan.textContent = `${labelText} ∧`;
        labelSpan.classList.remove('hidden');
        hamburgerBtnNode.classList.add('has-active-l2');
      }
    }
  };

  // Render Level 2 Sub-Navigation Bar
  const renderL2SubNavigation = (l1Data) => {
    navPillsRow.innerHTML = '';
    const l2Group = document.createElement('div');
    l2Group.className = 'tcs-l2-pills-group';

    l1Data.l2List.forEach((l2) => {
      const l2Pill = document.createElement('div');
      l2Pill.className = 'tcs-nav-pill l2-pill';
      const hasL3 = l2.l3List && l2.l3List.length > 0;

      l2Pill.innerHTML = `
        <a href="${l2.path}" class="tcs-pill-link">${l2.title}</a>
        ${hasL3 ? '<button class="chevron-btn" aria-label="Expand subpages">∨</button>' : ''}
      `;

      l2Pill.addEventListener('mouseenter', () => {
        if (hasL3) renderSubmenuCard(l2.l3List);
      });

      const chevronBtn = l2Pill.querySelector('.chevron-btn');
      if (chevronBtn) {
        chevronBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateButtonIconState('L3', l2.title);
          if (hasL3) renderSubmenuCard(l2.l3List);
        });
      }

      l2Group.append(l2Pill);
    });

    navPillsRow.append(l2Group);
    navPillsRow.classList.remove('hidden');
  };

  // Render Top-Level L1 Parent Navigation
  const renderL1ParentNavigation = async () => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonIconState('L1');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    navTreeData.forEach((l1) => {
      const l1Pill = document.createElement('div');
      l1Pill.className = 'tcs-nav-pill';
      const hasL2 = l1.l2List && l1.l2List.length > 0;

      l1Pill.innerHTML = `
        <a href="${l1.path}" class="tcs-pill-link">${l1.title}</a>
        ${hasL2 ? '<button class="chevron-btn" aria-label="Expand subpages">∨</button>' : ''}
      `;

      const enterL2SubNav = (e) => {
        if (e) e.stopPropagation();
        if (!hasL2) return;

        updateButtonIconState('L2', l1.title);
        renderL2SubNavigation(l1);
      };

      l1Pill.addEventListener('mouseenter', () => {
        if (hasL2) renderSubmenuCard(l1.l2List);
      });

      const chevronBtn = l1Pill.querySelector('.chevron-btn');
      if (chevronBtn) {
        chevronBtn.addEventListener('click', enterL2SubNav);
      }

      navPillsRow.append(l1Pill);
    });

    navPillsRow.classList.remove('hidden');
  };

  // Close Navigation Completely
  const closeAllNavigation = () => {
    isNavOpen = false;
    currentNavLevel = 'L1';

    hamburgerBtnNode.setAttribute('aria-expanded', 'false');
    hamburgerBtnNode.querySelector('.icon-hamburger').classList.remove('hidden');
    hamburgerBtnNode.querySelector('.icon-close').classList.add('hidden');
    hamburgerBtnNode.querySelector('.active-l2-label').classList.add('hidden');
    hamburgerBtnNode.classList.remove('has-active-l2');

    navPillsRow.classList.add('hidden');
    subMenuPanel.classList.add('hidden');
  };

  // 4. Hamburger Button Click Handling (State Switcher)
  if (hamburgerBtnNode) {
    hamburgerBtnNode.addEventListener('click', async () => {
      // RULE: If inside subpages (L2 or L3), click goes back to L1 Parent Navigation
      if (currentNavLevel === 'L2' || currentNavLevel === 'L3') {
        await renderL1ParentNavigation();
        return;
      }

      // If at L1 level, toggle menu open or closed
      if (!isNavOpen) {
        isNavOpen = true;
        hamburgerBtnNode.setAttribute('aria-expanded', 'true');
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
