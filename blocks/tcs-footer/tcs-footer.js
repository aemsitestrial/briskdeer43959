import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Parses query-index.json into localized L1 -> L2 -> L3 tree structure
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

      // Support optional locale prefix (e.g., /en/what-we-do/services/cloud)
      let locale = '';
      if (segments[0] && segments[0].length === 2) {
        locale = segments.shift();
      }

      if (segments.length === 0) return;

      const l1Key = segments[0];
      if (!navTree[l1Key]) {
        navTree[l1Key] = {
          title: item.title && segments.length === 1 ? item.title : l1Key.replace(/-/g, ' '),
          path: `/${locale ? `${locale}/` : ''}${l1Key}`,
          l2Map: {},
        };
      }

      if (segments.length >= 2) {
        const l2Key = segments[1];
        if (!navTree[l1Key].l2Map[l2Key]) {
          navTree[l1Key].l2Map[l2Key] = {
            title: item.title && segments.length === 2 ? item.title : l2Key.replace(/-/g, ' '),
            path: `/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}`,
            l3List: [],
          };
        }

        if (segments.length >= 3) {
          const l3Key = segments[2];
          navTree[l1Key].l2Map[l2Key].l3List.push({
            title: item.title || l3Key.replace(/-/g, ' '),
            path: `/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}/${l3Key}`,
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

  // 1. Process Main Block Title
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

  // Navigation Panel Containers (L1, L2, L3)
  const navContainer = document.createElement('nav');
  navContainer.className = 'tcs-footer-nav-container hidden';
  navContainer.setAttribute('aria-label', 'Footer Hierarchical Navigation');

  const l1List = document.createElement('ul');
  l1List.className = 'tcs-l1-list';

  const l2List = document.createElement('ul');
  l2List.className = 'tcs-l2-list hidden';

  const l3Panel = document.createElement('div');
  l3Panel.className = 'tcs-l3-panel hidden';

  navContainer.append(l1List);
  navContainer.append(l2List);

  const ctaRow = document.createElement('div');
  ctaRow.className = 'tcs-footer-cta-row';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'tcs-footer-bottom-row';

  const legalNav = document.createElement('div');
  legalNav.className = 'tcs-footer-legal-nav';

  let hamburgerBtn = null;
  let activeL2Title = null;
  let isNavOpen = false;

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
          <span class="icon-hamburger" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </span>
          <span class="icon-close hidden" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
          <span class="active-l2-label hidden"></span>
        </button>
      `;
      hamburgerBtn = row.querySelector('.tcs-footer-hamburger');
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
      row.innerHTML = cells[0]?.innerHTML || '©TATA Consultancy Services';
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

  // Assemble floating and bottom structures
  if (searchRow.children.length > 0) floatingNav.append(searchRow);
  floatingNav.append(navContainer);
  if (ctaRow.children.length > 0) floatingNav.append(ctaRow);

  if (floatingNav.children.length > 0) {
    footerContainer.append(l3Panel);
    footerContainer.append(floatingNav);
  }

  if (legalNav.children.length > 0) bottomRow.append(legalNav);
  if (bottomRow.children.length > 0) footerContainer.append(bottomRow);

  block.textContent = '';
  block.append(footerContainer);

  // Helper Functions for State Management
  const resetNavState = () => {
    isNavOpen = false;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.querySelector('.icon-hamburger').classList.remove('hidden');
    hamburgerBtn.querySelector('.icon-close').classList.add('hidden');

    if (activeL2Title) {
      const label = hamburgerBtn.querySelector('.active-l2-label');
      label.textContent = activeL2Title;
      label.classList.remove('hidden');
      hamburgerBtn.classList.add('has-active-l2');
    } else {
      hamburgerBtn.querySelector('.active-l2-label').classList.add('hidden');
      hamburgerBtn.classList.remove('has-active-l2');
    }

    navContainer.classList.add('hidden');
    l2List.classList.add('hidden');
    l3Panel.classList.add('hidden');
  };

  const openL1Nav = async () => {
    isNavOpen = true;
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.querySelector('.icon-hamburger').classList.add('hidden');
    hamburgerBtn.querySelector('.icon-close').classList.remove('hidden');
    hamburgerBtn.querySelector('.active-l2-label').classList.add('hidden');
    hamburgerBtn.classList.remove('has-active-l2');

    navContainer.classList.remove('hidden');

    if (!l1List.hasChildNodes()) {
      const navData = await fetchHierarchicalNavData();

      navData.forEach((l1) => {
        const l1Li = document.createElement('li');
        l1Li.className = 'tcs-l1-item';
        l1Li.setAttribute('tabindex', '0');
        l1Li.innerHTML = `<span>${l1.title}</span>`;

        // Hover L1 -> Show L2
        l1Li.addEventListener('mouseenter', () => {
          l1List.querySelectorAll('.tcs-l1-item').forEach((item) => item.classList.remove('active'));
          l1Li.classList.add('active');

          l2List.innerHTML = '';
          if (l1.l2List && l1.l2List.length > 0) {
            l1.l2List.forEach((l2) => {
              const l2Li = document.createElement('li');
              l2Li.className = 'tcs-l2-item';
              l2Li.setAttribute('tabindex', '0');
              l2Li.innerHTML = `<span>${l2.title}</span>`;

              // Click L2 -> Become active L2
              l2Li.addEventListener('click', (e) => {
                e.stopPropagation();
                activeL2Title = l2.title;
                resetNavState();
              });

              // Hover L2 -> Show L3
              l2Li.addEventListener('mouseenter', () => {
                l2List.querySelectorAll('.tcs-l2-item').forEach((item) => item.classList.remove('active'));
                l2Li.classList.add('active');

                if (l2.l3List && l2.l3List.length > 0) {
                  l3Panel.innerHTML = `
                    <div class="tcs-l3-grid">
                      ${l2.l3List
    .map(
      (l3) => `
                        <a href="${l3.path}" class="tcs-l3-link">
                          <span>${l3.title}</span>
                          <span class="arrow">→</span>
                        </a>
                      `,
    )
    .join('')}
                    </div>
                  `;
                  l3Panel.classList.remove('hidden');
                } else {
                  l3Panel.classList.add('hidden');
                }
              });

              l2List.append(l2Li);
            });

            l2List.classList.remove('hidden');
          } else {
            l2List.classList.add('hidden');
            l3Panel.classList.add('hidden');
          }
        });

        l1List.append(l1Li);
      });
    }
  };

  // 3. Hamburger Click Event Listener
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (isNavOpen) {
        resetNavState();
      } else {
        openL1Nav();
      }
    });

    // Hover Active L2 -> Show L3 directly
    hamburgerBtn.addEventListener('mouseenter', () => {
      if (!isNavOpen && activeL2Title && l3Panel.hasChildNodes()) {
        l3Panel.classList.remove('hidden');
      }
    });
  }

  // Hide L3 when mouse leaves navigation zone
  footerContainer.addEventListener('mouseleave', () => {
    if (!isNavOpen) {
      l3Panel.classList.add('hidden');
    }
  });

  // 4. Scroll Behavior Algorithm
  const handleScroll = () => {
    const footerRect = block.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (footerRect.top < windowHeight - 140) {
      floatingNav.classList.remove('is-fixed');
      l3Panel.classList.remove('is-fixed');
    } else {
      floatingNav.classList.add('is-fixed');
      l3Panel.classList.add('is-fixed');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();
}
