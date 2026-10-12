import { moveInstrumentation } from '../../scripts/scripts.js';

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

  // 1. Heading Title (First row of block)
  const mainTitleRow = blockRows.shift();
  const titleText = mainTitleRow?.textContent.trim() || "Let's build the future together";

  const footerContainer = document.createElement('div');
  footerContainer.className = 'tcs-footer-container';

  const heading = document.createElement('h2');
  heading.className = 'tcs-footer-heading';
  heading.textContent = titleText;
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
  let activeL1Category = null;
  let searchQueryVariable = '';

  // Forward declarations for circular references
  let renderL2SubNavigation;
  let renderL3SuggestedPrompts;

  /**
   * Fail-Safe Model Classification Logic
   */
  function getModelType(row, index) {
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
  }

  // Process Authored Rows
  blockRows.forEach((row, index) => {
    const model = getModelType(row, index);
    const cells = [...row.children];

    if (model === 'tcs-footer-hamburger' && !hamburgerWrapperNode) {
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
      hamburgerWrapperNode = row;
      hamburgerBtnNode = row.querySelector('.tcs-footer-hamburger');
    } else if (model === 'tcs-footer-search' && !searchBoxWrapperNode) {
      const variation = cells[0]?.textContent.trim().toLowerCase() || 'both';
      const placeholder = cells[1]?.textContent.trim() || 'Ask TCS...';

      row.className = `tcs-footer-search-box mode-${variation}`;
      searchBoxWrapperNode = row;

      const formEl = document.createElement('form');
      formEl.className = 'tcs-search-form';
      formEl.action = '#';

      let contentHtml = '';

      if (variation !== 'voice-only') {
        contentHtml += `<input type="text" class="tcs-search-input" placeholder="${placeholder}" aria-label="Ask TCS Search">`;
      }

      contentHtml += '<div class="tcs-footer-search-actions">';

      contentHtml += `
        <button type="button" class="clear-btn hidden" aria-label="Clear Search Input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>`;

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
      const clearBtn = formEl.querySelector('.clear-btn');

      if (inputEl) {
        inputEl.addEventListener('input', (e) => {
          searchQueryVariable = e.target.value;
          if (clearBtn) {
            if (e.target.value.trim().length > 0) {
              clearBtn.classList.remove('hidden');
            } else {
              clearBtn.classList.add('hidden');
            }
          }
        });
      }

      if (clearBtn && inputEl) {
        clearBtn.addEventListener('click', () => {
          inputEl.value = '';
          searchQueryVariable = '';
          clearBtn.classList.add('hidden');
          inputEl.focus();
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
            if (clearBtn) clearBtn.classList.remove('hidden');
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

  // Assemble Floating Bar
  if (hamburgerWrapperNode) searchRow.append(hamburgerWrapperNode);
  if (searchBoxWrapperNode) searchRow.append(searchBoxWrapperNode);

  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navPillsRow);

  if (floatingNav.children.length > 0) {
    footerContainer.append(subMenuPanel);
    footerContainer.append(floatingNav);
  }

  // Static Bottom Items
  if (ctaRow.children.length > 0) footerContainer.append(ctaRow);
  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);

  function renderSubmenuCard(items, onSubItemClick) {
    if (!items || items.length === 0) {
      subMenuPanel.classList.add('hidden');
      return;
    }

    subMenuPanel.innerHTML = `
      <div class="tcs-submenu-grid">
        ${items
    .map(
      (item, idx) => `
            <a href="${item.path}" class="tcs-submenu-item" data-index="${idx}">
              <span>${item.title}</span>
              <span class="arrow">→</span>
            </a>
          `,
    )
    .join('')}
      </div>
    `;

    if (onSubItemClick) {
      subMenuPanel.querySelectorAll('.tcs-submenu-item').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const index = el.getAttribute('data-index');
          onSubItemClick(items[index]);
        });
      });
    }

    subMenuPanel.classList.remove('hidden');
  }

  function updateButtonStateAndPosition(level) {
    currentViewLevel = level;
    if (!hamburgerBtnNode || !hamburgerWrapperNode) return;

    const hamburgerIcon = hamburgerBtnNode.querySelector('.icon-hamburger');
    const closeIcon = hamburgerBtnNode.querySelector('.icon-close');

    if (level === 'L1') {
      searchRow.prepend(hamburgerWrapperNode);
      if (searchBoxWrapperNode) searchBoxWrapperNode.classList.remove('hidden');
      hamburgerIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
    } else {
      navPillsRow.prepend(hamburgerWrapperNode);
      if (searchBoxWrapperNode) searchBoxWrapperNode.classList.remove('hidden');
      hamburgerIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  }

  const renderL1ParentNavigation = async function renderL1() {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateButtonStateAndPosition('L1');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    const l1Items = navTreeData.length > 0 ? navTreeData : [
      { title: 'What we do', children: [] },
      { title: 'Who we are', children: [] },
      { title: 'Insights', children: [] },
      { title: 'Careers', children: [] },
      { title: 'Media', children: [] },
      { title: 'Investors', children: [] },
    ];

    l1Items.forEach((l1) => {
      const l1Pill = document.createElement('div');
      l1Pill.className = 'tcs-nav-pill l1-pill';

      l1Pill.innerHTML = `
        <span class="tcs-pill-link">${l1.title}</span>
      `;

      l1Pill.addEventListener('click', (e) => {
        e.stopPropagation();
        renderL2SubNavigation(l1);
      });

      navPillsRow.append(l1Pill);
    });

    navPillsRow.classList.remove('hidden');
  };

  renderL2SubNavigation = function renderL2(l1Data) {
    navPillsRow.innerHTML = '';
    activeL1Category = l1Data;
    updateButtonStateAndPosition('L2');

    const l2Group = document.createElement('div');
    l2Group.className = 'tcs-l2-pills-group';

    const l2Categories = (l1Data.children && l1Data.children.length > 0)
      ? l1Data.children
      : [
        { title: 'Services', children: l1Data.children || [] },
        { title: 'Industries', children: [] },
        { title: 'Products', children: [] },
        { title: 'Customers', children: [] },
        { title: 'Partnerships', children: [] },
        { title: 'Research & innovation', children: [] },
      ];

    l2Categories.forEach((l2, index) => {
      const l2Pill = document.createElement('div');
      l2Pill.className = `tcs-nav-pill l2-pill ${index === 0 ? 'active' : ''}`;

      l2Pill.innerHTML = `
        <span class="tcs-pill-link">${l2.title}</span>
        <button class="chevron-btn" aria-label="Expand subpages">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      `;

      const onSubItemClick = (subItem) => {
        renderL3SuggestedPrompts(subItem);
      };

      const selectL2Dropdown = (e) => {
        if (e) e.stopPropagation();
        l2Group.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
        l2Pill.classList.add('active');

        if (l2.children && l2.children.length > 0) {
          renderSubmenuCard(l2.children, onSubItemClick);
        } else {
          subMenuPanel.classList.add('hidden');
        }
      };

      l2Pill.addEventListener('click', selectL2Dropdown);
      l2Group.append(l2Pill);
    });

    navPillsRow.append(l2Group);
    navPillsRow.classList.remove('hidden');

    const activeFirst = l2Categories[0];
    if (activeFirst && activeFirst.children && activeFirst.children.length > 0) {
      renderSubmenuCard(activeFirst.children, (subItem) => renderL3SuggestedPrompts(subItem));
    } else {
      subMenuPanel.classList.add('hidden');
    }
  };

  renderL3SuggestedPrompts = function renderL3(selectedSubItem) {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    currentViewLevel = 'L3';

    const l3Container = document.createElement('div');
    l3Container.className = 'tcs-l3-row';

    const backBtn = document.createElement('button');
    backBtn.className = 'tcs-l3-back-btn';
    backBtn.setAttribute('aria-label', 'Back to dropdowns');
    backBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f83ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;

    backBtn.addEventListener('click', () => {
      if (activeL1Category) {
        renderL2SubNavigation(activeL1Category);
      } else {
        renderL1ParentNavigation();
      }
    });

    const prompt1 = document.createElement('a');
    prompt1.className = 'tcs-l3-prompt-pill';
    prompt1.href = selectedSubItem?.path || '#';
    prompt1.textContent = `"What customers have solved similar challenges in ${selectedSubItem?.title || 'this domain'}?"`;

    const prompt2 = document.createElement('a');
    prompt2.className = 'tcs-l3-prompt-pill';
    prompt2.href = selectedSubItem?.path || '#';
    prompt2.textContent = `"Find customers in my industry for ${selectedSubItem?.title || 'services'}"`;

    l3Container.append(backBtn, prompt1, prompt2);
    navPillsRow.append(l3Container);
    navPillsRow.classList.remove('hidden');
  };

  function closeAllNavigation() {
    isNavOpen = false;
    currentViewLevel = 'L1';

    if (hamburgerWrapperNode) {
      searchRow.prepend(hamburgerWrapperNode);
    }
    if (searchBoxWrapperNode) searchBoxWrapperNode.classList.remove('hidden');

    if (hamburgerBtnNode) {
      hamburgerBtnNode.setAttribute('aria-expanded', 'false');
      hamburgerBtnNode.querySelector('.icon-hamburger').classList.remove('hidden');
      hamburgerBtnNode.querySelector('.icon-close').classList.add('hidden');
    }

    navPillsRow.classList.add('hidden');
    subMenuPanel.classList.add('hidden');
  }

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

  footerContainer.addEventListener('mouseleave', () => {
    if (currentViewLevel === 'L1') {
      subMenuPanel.classList.add('hidden');
      navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
    }
  });

  // Smooth Scroll Fixed Position Monitor
  let ticking = false;
  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const footerRect = block.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (footerRect.top < windowHeight - 140) {
          floatingNav.classList.remove('is-fixed');
          subMenuPanel.classList.remove('is-fixed');
        } else {
          floatingNav.classList.add('is-fixed');
          subMenuPanel.classList.add('is-fixed');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}
