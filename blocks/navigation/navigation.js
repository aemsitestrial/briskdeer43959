/**
 * SVG Chevron Icon Helper
 */
const getChevronSvg = () => `
  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

/**
 * SVG Back Arrow Icon Helper
 */
const getBackArrowSvg = () => `
  <svg class="back-arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
`;

/**
 * Resolves content paths for AEM authoring/publishing environments
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

  const floatingNav = document.createElement('div');
  floatingNav.className = 'navigation-floating-bar';

  const searchRow = document.createElement('div');
  searchRow.className = 'nav-search-row';

  const navPillsRow = document.createElement('div');
  navPillsRow.className = 'nav-pills-row hidden';

  const subMenuPanel = document.createElement('div');
  subMenuPanel.className = 'nav-submenu-panel hidden';

  let hamburgerWrapperNode = null;
  let hamburgerBtnNode = null;
  let searchBoxWrapperNode = null;
  let inputEl = null;

  let isNavOpen = false;
  let navTreeData = null;
  let currentViewLevel = 'L1';
  let searchQueryVariable = '';

  const getModelType = (row, index) => {
    const explicitModel = row.getAttribute('data-aue-model') || row.dataset?.aueModel;
    if (explicitModel) return explicitModel;

    const text = row.textContent.trim().toLowerCase();
    if (text.includes('both') || text.includes('text-only') || text.includes('voice-only') || text.includes('ask tcs') || text.includes('ask canvas')) {
      return 'nav-search';
    }

    if (index === 0) return 'nav-hamburger';
    return 'nav-search';
  };

  // Process Authored Rows
  blockRows.forEach((row, index) => {
    const model = getModelType(row, index);
    const cells = [...row.children];

    if (model === 'nav-hamburger' && !hamburgerWrapperNode) {
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

      row.className = 'nav-hamburger-wrapper';
      row.innerHTML = `
        <button class="nav-hamburger" aria-label="${ariaLabel}" aria-expanded="false">
          <span class="icon-hamburger">${hamburgerIconContent}</span>
          <span class="icon-close hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>
      `;
      hamburgerWrapperNode = row;
      hamburgerBtnNode = row.querySelector('.nav-hamburger');
    } else if (model === 'nav-search' && !searchBoxWrapperNode) {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask TCS...';

      row.className = `nav-search-box mode-${variation}`;
      searchBoxWrapperNode = row;

      const formEl = document.createElement('form');
      formEl.className = 'nav-search-form';
      formEl.action = '#';

      let contentHtml = '';

      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" class="nav-search-input" placeholder="${placeholder}" aria-label="${placeholder}">`;
      }

      contentHtml += '<div class="nav-search-actions">';

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

      inputEl = formEl.querySelector('.nav-search-input');
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
    }
  });

  // Assemble Main Floating Bar DOM
  if (subMenuPanel) floatingNav.append(subMenuPanel);
  if (hamburgerWrapperNode) searchRow.append(hamburgerWrapperNode);
  if (searchBoxWrapperNode) searchRow.append(searchBoxWrapperNode);
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navPillsRow);

  block.textContent = '';
  block.append(floatingNav);

  const renderSubmenuCard = (items) => {
    if (!items || items.length === 0) {
      subMenuPanel.classList.add('hidden');
      return;
    }

    subMenuPanel.innerHTML = `
      <div class="nav-submenu-grid">
        ${items
    .map(
      (item) => `
          <a href="${item.path}" class="nav-submenu-item">
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

  const updateButtonState = (level) => {
    currentViewLevel = level;
    if (!hamburgerBtnNode) return;

    const hamburgerIcon = hamburgerBtnNode.querySelector('.icon-hamburger');
    const closeIcon = hamburgerBtnNode.querySelector('.icon-close');

    if (level === 'L1') {
      if (hamburgerIcon) hamburgerIcon.classList.add('hidden');
      if (closeIcon) closeIcon.classList.remove('hidden');
    } else {
      if (hamburgerIcon) hamburgerIcon.classList.remove('hidden');
      if (closeIcon) closeIcon.classList.add('hidden');
    }
  };

  let renderL2SubNavigation;
  let renderL1ParentNavigation;

  /**
   * Render L3 Suggestions View
   */
  const renderL3SuggestionsView = (previousL2, parentL1) => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonState('L3');

    const l3Group = document.createElement('div');
    l3Group.className = 'nav-l3-pills-group';

    // Back Arrow Button Pill
    const backPill = document.createElement('button');
    backPill.className = 'nav-back-pill';
    backPill.setAttribute('aria-label', 'Go Back');
    backPill.innerHTML = getBackArrowSvg();
    backPill.addEventListener('click', () => {
      if (previousL2 && parentL1) {
        renderL2SubNavigation(parentL1);
      } else {
        renderL1ParentNavigation();
      }
    });

    l3Group.append(backPill);

    const defaultSuggestions = [
      'What customers have solved similar challenges?',
      'Find customers in my industry',
    ];

    defaultSuggestions.forEach((promptText) => {
      const promptPill = document.createElement('button');
      promptPill.className = 'nav-pill prompt-pill';
      promptPill.textContent = `"${promptText}"`;

      promptPill.addEventListener('click', () => {
        if (inputEl) {
          inputEl.value = promptText;
          searchQueryVariable = promptText;
          inputEl.focus();
        }
      });

      l3Group.append(promptPill);
    });

    navPillsRow.append(l3Group);
    navPillsRow.classList.remove('hidden');
  };

  /**
   * Render L2 Level Navigation
   */
  renderL2SubNavigation = (l1Data) => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonState('L2');

    const l2Group = document.createElement('div');
    l2Group.className = 'nav-l2-pills-group';

    l1Data.children.forEach((l2) => {
      const l2Pill = document.createElement('div');
      l2Pill.className = 'nav-pill l2-pill';
      const hasL3 = l2.children && l2.children.length > 0;

      l2Pill.innerHTML = `
        <a href="${l2.path}" class="pill-link">${l2.title}</a>
        ${hasL3 ? `<button class="chevron-btn" aria-label="Expand subpages">${getChevronSvg()}</button>` : ''}
      `;

      l2Pill.addEventListener('mouseenter', () => {
        l2Group.querySelectorAll('.nav-pill').forEach((p) => p.classList.remove('active'));
        l2Pill.classList.add('active');

        if (hasL3) {
          renderSubmenuCard(l2.children);
        } else {
          subMenuPanel.classList.add('hidden');
        }
      });

      const chevronBtn = l2Pill.querySelector('.chevron-btn');
      if (chevronBtn) {
        chevronBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          renderL3SuggestionsView(l2, l1Data);
        });
      }

      l2Group.append(l2Pill);
    });

    navPillsRow.append(l2Group);
    navPillsRow.classList.remove('hidden');
  };

  /**
   * Render L1 Parent Navigation
   */
  renderL1ParentNavigation = async () => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonState('L1');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    navTreeData.forEach((l1) => {
      const l1Pill = document.createElement('div');
      l1Pill.className = 'nav-pill l1-pill';

      l1Pill.innerHTML = `<a href="${l1.path}" class="pill-link">${l1.title}</a>`;

      l1Pill.addEventListener('click', () => {
        navPillsRow.querySelectorAll('.nav-pill').forEach((p) => p.classList.remove('active'));
        l1Pill.classList.add('active');

        if (l1.children && l1.children.length > 0) {
          renderL2SubNavigation(l1);
        } else {
          renderL3SuggestionsView(null, l1);
        }

        // Navigate directly to the L1 page
        if (l1.path && l1.path !== '#') {
          window.location.href = l1.path;
        }
      });

      navPillsRow.append(l1Pill);
    });

    navPillsRow.classList.remove('hidden');
  };

  const closeAllNavigation = () => {
    isNavOpen = false;
    currentViewLevel = 'L1';

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
      if (currentViewLevel === 'L2' || currentViewLevel === 'L3') {
        await renderL1ParentNavigation();
        return;
      }

      if (!isNavOpen) {
        isNavOpen = true;
        hamburgerBtnNode.setAttribute('aria-expanded', 'true');
        await renderL1ParentNavigation();
      } else {
        closeAllNavigation();
      }
    });
  }

  floatingNav.addEventListener('mouseleave', () => {
    subMenuPanel.classList.add('hidden');
    navPillsRow.querySelectorAll('.nav-pill').forEach((p) => p.classList.remove('active'));
  });
}
