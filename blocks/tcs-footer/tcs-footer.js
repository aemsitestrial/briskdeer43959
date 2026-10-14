import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * SVG Chevron Icon Helper
 */
const getChevronSvg = () => `
  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

/**
 * SVG Left Arrow Icon Helper
 */
const getArrowLeftSvg = () => `
  <svg class="arrow-left-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
`;

/**
 * Resolves content paths cleanly to /[pagename].html
 */
function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';

  // Ensure path starts with a single slash '/'
  let resolvedPath = path.startsWith('/') ? path : `/${path}`;

  // If the path contains AEM content prefixes, clean them up to keep only /[pagename]
  if (resolvedPath.includes('/content/')) {
    const parts = resolvedPath.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    resolvedPath = `/${lastPart}`;
  }

  // Ensure .html extension
  if (!resolvedPath.endsWith('.html')) {
    resolvedPath = `${resolvedPath}.html`;
  }

  return resolvedPath;
}

/**
 * Helper to determine current page level (L1, L2, or L3) and path segments
 */
function getCurrentPageInfo() {
  const path = window.location.pathname.replace(/\.html$/, '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] && segments[0].length === 2) {
    segments.shift(); // Remove locale segment if present
  }

  // Remove common AEM prefix segments if present
  const contentIdx = segments.indexOf('content');
  if (contentIdx !== -1) {
    segments.splice(0, contentIdx + 4);
  }

  const depth = segments.length;
  let level = 'L1';
  if (depth === 2) level = 'L2';
  if (depth >= 3) level = 'L3';

  return {
    level,
    segments,
    l1Key: segments[0] || '',
    l2Key: segments[1] || '',
    l3Key: segments[2] || '',
  };
}

/**
 * Parses query-index.json into a flexible multi-level tree structure.
 */
async function fetchHierarchicalNavData() {
  try {
    const response = await fetch('/query-index.json');
    if (!response.ok) return [];
    const json = await response.json();
    const data = json.data || json;

    if (!Array.isArray(data)) return [];

    const navTree = {};
    const excludedPages = [
      'footer',
      'header',
      'tcs-footer',
      'tcs-header',
      'blocks',
      'home',
      'home-page',
      'homepage',
      'demo',
      'nav',
      'iconlist',
      'qa',
      'test',
    ];

    data.forEach((item) => {
      const rawPath = item?.path || '';
      if (!rawPath) return;

      const segments = rawPath.split('/').filter(Boolean);

      let locale = '';
      if (segments[0] && segments[0].length === 2) {
        locale = segments.shift();
      }

      if (segments.length === 0) return;

      const lastSegment = segments[segments.length - 1].toLowerCase().replace(/\s+/g, '-');
      if (excludedPages.includes(lastSegment)) return;

      const l1Key = segments[0];
      if (excludedPages.includes(l1Key.toLowerCase())) return;

      if (!navTree[l1Key]) {
        navTree[l1Key] = {
          key: l1Key,
          title: item.title && segments.length === 1 ? item.title : l1Key.replace(/-/g, ' '),
          path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}`),
          children: {},
        };
      }

      if (segments.length >= 2) {
        const l2Key = segments[1];
        if (excludedPages.includes(l2Key.toLowerCase())) return;

        if (!navTree[l1Key].children[l2Key]) {
          navTree[l1Key].children[l2Key] = {
            key: l2Key,
            title: item.title && segments.length === 2 ? item.title : l2Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}`),
            children: [],
          };
        }

        if (segments.length >= 3) {
          const l3Key = segments[2];
          if (excludedPages.includes(l3Key.toLowerCase())) return;

          navTree[l1Key].children[l2Key].children.push({
            key: l3Key,
            title: item.title || l3Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}/${l3Key}`),
          });
        }
      }
    });

    return Object.values(navTree).map((l1) => ({
      ...l1,
      children: Object.values(l1.children).map((l2) => ({
        ...l2,
        children: l2.children || [],
      })),
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
  const rawTitle = mainTitleRow?.textContent.trim();
  const titleText = rawTitle
    ? rawTitle.replace("Let's build the future together", "Let's build the<br>future together")
    : "Let's build the<br>future together";

  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  const heading = document.createElement('h3');
  heading.className = 'tcs-footer-heading';
  heading.innerHTML = titleText;
  footerContainer.append(heading);

  // Floating Control Bar Containers
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
  let hamburgerBtnNode = null;
  let searchBoxWrapperNode = null;
  let isNavOpen = false;
  let navTreeData = null;

  let currentViewLevel = 'L1';
  let activeL1Data = null;
  let searchQueryVariable = '';

  const getModelType = (row, index) => {
    const explicitModel = row.getAttribute('data-aue-model') || row.dataset?.aueModel;
    if (explicitModel) return explicitModel;

    const text = row.textContent.trim().toLowerCase();

    if (text.includes('both') || text.includes('text-only') || text.includes('voice-only') || text.includes('ask canvas') || text.includes('ask us')) {
      return 'tcs-footer-search';
    }
    if (text.includes('©') || text.includes('tata consultancy') || text.includes('all rights reserved')) {
      return 'tcs-footer-copyright';
    }
    if (text.includes('privacy') || text.includes('terms') || text.includes('cookie') || text.includes('legal')) {
      return 'tcs-footer-legal-item';
    }

    if (index === 0) return 'tcs-footer-hamburger';
    if (index === 1) return 'tcs-footer-search';
    if (index === 2) return 'tcs-footer-cta';
    if (index === 3) return 'tcs-footer-copyright';
    if (index === 4) return 'tcs-footer-legal-item';

    return 'tcs-footer-cta';
  };

  // Process Authored Rows
  blockRows.forEach((row, index) => {
    const model = getModelType(row, index);
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger' && !hamburgerWrapperNode) {
      const authoredImg = cells[0]?.querySelector('img');
      const authoredIconSrc = authoredImg ? authoredImg.src : cells[0]?.textContent.trim();
      const ariaLabel = cells[1]?.textContent.trim() || cells[0]?.textContent.trim() || 'Open navigation menu';

      const hamburgerIconContent = authoredIconSrc && (authoredImg || authoredIconSrc.startsWith('/') || authoredIconSrc.startsWith('http'))
        ? `<img src="${authoredIconSrc}" alt="${ariaLabel}" class="custom-hamburger-icon" />`
        : `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;

      row.className = 'tcs-footer-hamburger-wrapper';
      row.innerHTML = `
        <button class="tcs-footer-hamburger" aria-label="${ariaLabel}" aria-expanded="false">
          <span class="icon-hamburger">
            ${hamburgerIconContent}
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
      hamburgerBtnNode = row.querySelector('.tcs-footer-hamburger');
    } else if (model === 'tcs-footer-search' && !searchBoxWrapperNode) {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask Canvas Search';

      row.className = `tcs-footer-search-box mode-${variation}`;
      searchBoxWrapperNode = row;

      const formEl = document.createElement('form');
      formEl.className = 'tcs-search-form';
      formEl.action = '#';

      let contentHtml = '';

      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" class="tcs-search-input" placeholder="${placeholder}" aria-label="Ask Canvas Search">`;
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

      const inputEl = formEl.querySelector('.tcs-search-input');
      const micBtn = formEl.querySelector('.mic-btn');

      if (inputEl) {
        inputEl.addEventListener('input', (e) => {
          searchQueryVariable = e.target.value;
        });
      }

      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        if (inputEl) searchQueryVariable = inputEl.value;
        // eslint-disable-next-line no-console
        console.log('Search Query Variable:', searchQueryVariable);
      });

      if (micBtn && inputEl) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;

          micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            micBtn.classList.add('listening');
            recognition.start();
          });

          const stopListening = () => micBtn.classList.remove('listening');

          recognition.onresult = (e) => {
            stopListening();
            const { transcript } = e.results[0][0];
            inputEl.value = transcript;
            searchQueryVariable = transcript;
          };

          recognition.onerror = stopListening;
          recognition.onend = stopListening;
        }
      }
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

      if (cells[0]) moveInstrumentation(cells[0], ctaBtn);
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
      const target = cells[2]?.textContent.trim() || '_self';

      row.className = 'tcs-footer-legal-item-wrapper';
      const legalLink = document.createElement('a');
      legalLink.className = 'tcs-footer-legal-link';
      legalLink.href = link;
      legalLink.target = target;
      legalLink.textContent = label;

      if (cells[0]) moveInstrumentation(cells[0], legalLink);
      row.innerHTML = '';
      row.append(legalLink);
      legalNav.append(row);
    }
  });

  if (subMenuPanel) floatingNav.append(subMenuPanel);
  if (hamburgerWrapperNode) searchRow.append(hamburgerWrapperNode);
  if (searchBoxWrapperNode) searchRow.append(searchBoxWrapperNode);

  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navPillsRow);

  if (floatingNav.children.length > 0) {
    footerContainer.append(floatingNav);
  }

  if (ctaRow.children.length > 0) footerContainer.append(ctaRow);
  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);

  const updateButtonStateAndPosition = (level) => {
    currentViewLevel = level;
    if (!hamburgerBtnNode || !hamburgerWrapperNode) return;

    const hamburgerIcon = hamburgerBtnNode.querySelector('.icon-hamburger');
    const closeIcon = hamburgerBtnNode.querySelector('.icon-close');

    if (level === 'L1') {
      searchRow.prepend(hamburgerWrapperNode);
      if (searchBoxWrapperNode) searchBoxWrapperNode.classList.remove('hidden');
      if (hamburgerIcon) hamburgerIcon.classList.add('hidden');
      if (closeIcon) closeIcon.classList.remove('hidden');
    } else {
      navPillsRow.prepend(hamburgerWrapperNode);
      if (searchBoxWrapperNode) searchBoxWrapperNode.classList.add('hidden');
      if (hamburgerIcon) hamburgerIcon.classList.remove('hidden');
      if (closeIcon) closeIcon.classList.add('hidden');
    }
  };

  // Declare functions beforehand for forward-references
  let renderL1ParentNavigation;
  let renderL2SubNavigation;

  /**
   * Requirement 3: L3 Page Behavior
   * - Display suggestions as pill-shaped buttons instead of showing a submenu.
   * - Display a left-arrow icon before the suggestion pills to return to previous navigation view.
   * - Clicking a suggestion pill inserts and displays the suggestion in the search bar.
   */
  const renderL3SuggestionsView = (suggestionsList = []) => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonStateAndPosition('L3');

    const l3Container = document.createElement('div');
    l3Container.className = 'tcs-l3-suggestions-wrapper';

    // Left arrow icon before suggestion pills
    const backBtn = document.createElement('button');
    backBtn.className = 'tcs-nav-back-btn';
    backBtn.setAttribute('aria-label', 'Return to previous navigation view');
    backBtn.innerHTML = getArrowLeftSvg();

    backBtn.addEventListener('click', () => {
      if (activeL1Data) {
        renderL2SubNavigation(activeL1Data);
      } else {
        renderL1ParentNavigation();
      }
    });

    l3Container.append(backBtn);

    const pillsGroup = document.createElement('div');
    pillsGroup.className = 'tcs-l3-pills-group';

    suggestionsList.forEach((suggestion) => {
      const sugText = suggestion.title || suggestion;
      const sugPill = document.createElement('button');
      sugPill.className = 'tcs-nav-pill l3-suggestion-pill';
      sugPill.type = 'button';
      sugPill.textContent = sugText;

      // On click: insert selected suggestion into search bar
      sugPill.addEventListener('click', () => {
        const searchInput = searchBoxWrapperNode?.querySelector('.tcs-search-input');
        if (searchInput) {
          searchInput.value = sugText;
          searchQueryVariable = sugText;
          searchInput.focus();
        }
      });

      pillsGroup.append(sugPill);
    });

    l3Container.append(pillsGroup);
    navPillsRow.append(l3Container);
    navPillsRow.classList.remove('hidden');
  };

  /**
   * Submenu Panel Renderer (Used in L2 view for showing L3 subpages)
   */
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

  /**
   * Requirement 2: L2 Page Behavior
   * - Display relevant L2 navigation options.
   * - L2 options that contain L3 pages display a chevron.
   * - Selecting chevron or L2 option opens submenu containing its L3 options.
   * - Selecting an L3 option navigates to corresponding L3 page.
   */
  renderL2SubNavigation = (l1Data) => {
    activeL1Data = l1Data;
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonStateAndPosition('L2');

    const l2Group = document.createElement('div');
    l2Group.className = 'tcs-l2-pills-group';

    l1Data.children.forEach((l2) => {
      const l2Pill = document.createElement('div');
      l2Pill.className = 'tcs-nav-pill l2-pill';
      const hasL3 = l2.children && l2.children.length > 0;

      // Render chevron ONLY if L2 option contains L3 pages
      l2Pill.innerHTML = `
        <a href="${l2.path}" class="tcs-pill-link">${l2.title}</a>
        ${hasL3 ? `<button class="chevron-btn" aria-label="Expand subpages">${getChevronSvg()}</button>` : ''}
      `;

      const openSubmenu = (e) => {
        if (hasL3) {
          e?.preventDefault();
          l2Group.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
          l2Pill.classList.add('active');
          renderSubmenuCard(l2.children);
        }
      };

      l2Pill.addEventListener('click', (e) => {
        if (hasL3 && !e.target.closest('a')) {
          openSubmenu(e);
        }
      });

      const chevronBtn = l2Pill.querySelector('.chevron-btn');
      if (chevronBtn) {
        chevronBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openSubmenu(e);
        });
      }

      l2Group.append(l2Pill);
    });

    navPillsRow.append(l2Group);
    navPillsRow.classList.remove('hidden');
  };

  /**
   * Requirement 1: L1 Page Behavior
   * - Display ONLY the available L1 navigation options.
   * - Do NOT display chevrons beside L1 options.
   * - Selecting an L1 option navigates directly to corresponding L2 page.
   * - Do NOT display a submenu panel while on an L1 page.
   */
  renderL1ParentNavigation = async () => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden'); // Never display a submenu on L1
    updateButtonStateAndPosition('L1');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    navTreeData.forEach((l1) => {
      const l1Pill = document.createElement('div');
      l1Pill.className = 'tcs-nav-pill';

      // Chevron removed completely for L1
      l1Pill.innerHTML = `<a href="${l1.path}" class="tcs-pill-link">${l1.title}</a>`;

      const linkEl = l1Pill.querySelector('.tcs-pill-link');
      if (linkEl) {
        linkEl.addEventListener('click', () => {
          // Direct navigation to corresponding page
          window.location.href = l1.path;
        });
      }

      navPillsRow.append(l1Pill);
    });

    navPillsRow.classList.remove('hidden');
  };

  /**
   * Auto-detect level based on active URL location
   */
  const renderCurrentPageNavigation = async () => {
    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    const { level, l1Key, l2Key } = getCurrentPageInfo();

    if (level === 'L3') {
      // Current page is L3: find matching parent L1 and L2 items for suggestions
      const matchedL1 = navTreeData.find((l1) => l1.key === l1Key) || navTreeData[0];
      activeL1Data = matchedL1;
      let suggestions = [];

      if (matchedL1) {
        const matchedL2 = matchedL1.children.find((l2) => l2.key === l2Key)
          || matchedL1.children[0];
        if (matchedL2 && matchedL2.children.length > 0) {
          suggestions = matchedL2.children;
        } else {
          suggestions = matchedL1.children;
        }
      }

      renderL3SuggestionsView(suggestions);
    } else if (level === 'L2') {
      // Current page is L2: render relevant L2 navigation options
      const matchedL1 = navTreeData.find((l1) => l1.key === l1Key) || navTreeData[0];
      if (matchedL1) {
        renderL2SubNavigation(matchedL1);
      } else {
        await renderL1ParentNavigation();
      }
    } else {
      // Current page is L1: render L1 options only with direct page links
      await renderL1ParentNavigation();
    }
  };

  const closeAllNavigation = () => {
    isNavOpen = false;
    currentViewLevel = 'L1';

    if (hamburgerWrapperNode) {
      searchRow.prepend(hamburgerWrapperNode);
    }
    if (searchBoxWrapperNode) searchBoxWrapperNode.classList.remove('hidden');

    if (hamburgerBtnNode) {
      hamburgerBtnNode.setAttribute('aria-expanded', 'false');
      hamburgerBtnNode.querySelector('.icon-hamburger')?.classList.remove('hidden');
      hamburgerBtnNode.querySelector('.icon-close')?.classList.add('hidden');
    }

    navPillsRow.classList.add('hidden');
    subMenuPanel.classList.add('hidden');
  };

  if (hamburgerBtnNode) {
    hamburgerBtnNode.addEventListener('click', async () => {
      if (!isNavOpen) {
        isNavOpen = true;
        hamburgerBtnNode.setAttribute('aria-expanded', 'true');
        await renderCurrentPageNavigation();
      } else {
        closeAllNavigation();
      }
    });
  }

  floatingNav.addEventListener('mouseleave', () => {
    if (currentViewLevel === 'L2') {
      subMenuPanel.classList.add('hidden');
      navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
    }
  });

  // Smooth Scroll & Docking
  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const windowHeight = window.innerHeight;

        const heroSlotEl = document.querySelector('.hero-banner-sticky');
        const canvasSlotEl = document.querySelector('.canvas-block-search-slot');
        const footerEl = block;

        const isSlotVisible = (el) => {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.top < windowHeight && rect.bottom > 80;
        };

        const isHeroDocked = isSlotVisible(heroSlotEl);
        const isCanvasDocked = !isHeroDocked && isSlotVisible(canvasSlotEl);

        const footerRect = footerEl.getBoundingClientRect();
        const isAtFooter = footerRect.top < windowHeight - 140;

        if (isHeroDocked && heroSlotEl) {
          if (floatingNav.parentElement !== heroSlotEl) {
            heroSlotEl.append(floatingNav);
          }
          floatingNav.classList.remove('is-fixed');
          floatingNav.classList.add('is-docked-slot');
        } else if (isCanvasDocked && canvasSlotEl) {
          if (floatingNav.parentElement !== canvasSlotEl) {
            canvasSlotEl.append(floatingNav);
          }
          floatingNav.classList.remove('is-fixed');
          floatingNav.classList.add('is-docked-slot');
        } else if (isAtFooter) {
          if (floatingNav.parentElement !== footerContainer) {
            footerContainer.insertBefore(floatingNav, ctaRow);
          }
          floatingNav.classList.remove('is-fixed', 'is-docked-slot');
        } else {
          if (floatingNav.parentElement !== footerContainer) {
            footerContainer.insertBefore(floatingNav, ctaRow);
          }
          floatingNav.classList.add('is-fixed');
          floatingNav.classList.remove('is-docked-slot');
        }

        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}
