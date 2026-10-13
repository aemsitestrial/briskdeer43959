const DEFAULTS = {
  textcta: '',
  ctaLink: '',
  icon: null,
  iconPosition: 'before',
  iconSize: '24',
  linkTarget: 'default',
  ctaView: 'default',
  shape: 'rectangle',
  backgroundColor: '',
  hoverBackgroundColor: '',
  textColor: '',
  borderColor: '',
  borderWidth: '1',
  borderRadius: '9999',
  backdropBlur: '8',
  hoverTextColor: '',
  ctaWidth: 'auto',
  alignment: 'left',
  arrowColor: 'black',
  contentLayout: 'normal',
  buttonSize: 'default',
  fontWeight: '500',
  typographyStyle: '500',
  state: 'default',
};

const ALLOWED_SHAPES = [
  'rectangle',
  'rounded',
  'pill',
];

function getFieldValue(block, index, fallback = '') {
  const field = block.children[index];

  if (!field) {
    return fallback;
  }

  return field.textContent.trim() || fallback;
}

function normalizeShape(value) {
  if (ALLOWED_SHAPES.includes(value)) {
    return value;
  }

  return DEFAULTS.shape;
}

function createIcon(icon, size, arrowColor) {
  if (!icon) {
    return null;
  }

  const image = icon.cloneNode(true);

  image.classList.add(
    'cta-icon',
    `cta-icon-${arrowColor}`,
  );

  image.style.width = `${size}px`;
  image.style.height = `${size}px`;

  return image;
}

function readBlockContent(block) {
  return {
    textcta: getFieldValue(block, 0, ''),
    ctaLink: getFieldValue(block, 1, ''),
    icon: block.children[2]?.querySelector('img'),
    iconPosition: getFieldValue(block, 3, 'before'),
    iconSize: getFieldValue(block, 4, '24'),
    linkTarget: getFieldValue(block, 5, 'default'),
    ctaView: getFieldValue(block, 6, 'default'),
    shape: normalizeShape(
      getFieldValue(block, 7, 'rectangle'),
    ),
    backgroundColor: getFieldValue(block, 8, ''),
    hoverBackgroundColor: getFieldValue(block, 9, ''),
    textColor: getFieldValue(block, 10, ''),
    borderColor: getFieldValue(block, 11, ''),
    borderWidth: getFieldValue(block, 12, '1'),
    borderRadius: getFieldValue(block, 13, '9999'),
    backdropBlur: getFieldValue(block, 14, '8'),
    hoverTextColor: getFieldValue(block, 15, ''),
    ctaWidth: getFieldValue(block, 16, 'auto'),
    alignment: getFieldValue(block, 17, 'left'),
    arrowColor: getFieldValue(block, 18, 'black'),
    contentLayout: getFieldValue(block, 19, 'normal'),
    buttonSize: getFieldValue(block, 20, 'default'),
    fontWeight: getFieldValue(block, 21, '500'),
    typographyStyle: getFieldValue(block, 22, '500'),
    state: getFieldValue(block, 23, 'default'),
  };
}

function createCta(data) {
  if (!data.textcta || !data.ctaLink) {
    return null;
  }

  const link = document.createElement('a');

  link.className = [
    'cta-link',
    `cta-link-${data.shape}`,
    `cta-view-${data.ctaView}`,
    `cta-layout-${data.contentLayout}`,
    `cta-size-${data.buttonSize}`,
    `cta-state-${data.state}`,
    `cta-typography-${data.typographyStyle}`,
  ].join(' ');

  link.href = data.ctaLink;

  link.setAttribute(
    'aria-label',
    data.textcta,
  );

  if (
    data.state === 'disabled'
    || data.state === 'loading'
  ) {
    link.setAttribute(
      'aria-disabled',
      'true',
    );

    link.tabIndex = -1;

    link.addEventListener(
      'click',
      (event) => event.preventDefault(),
    );
  }

  if (data.state === 'loading') {
    link.setAttribute(
      'aria-busy',
      'true',
    );
  }

  if (data.linkTarget === 'new-window') {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  if (data.backgroundColor) {
    link.style.backgroundColor = data.backgroundColor;
  }

  if (data.textColor) {
    link.style.color = data.textColor;
  }

  if (data.borderColor) {
    link.style.borderColor = data.borderColor;
  }

  link.style.borderWidth = `${data.borderWidth}px`;

  link.style.borderRadius = `${data.borderRadius}px`;

  link.style.backdropFilter = `blur(${data.backdropBlur}px)`;

  link.style.setProperty(
    '--cta-font-weight',
    data.typographyStyle || data.fontWeight,
  );

  if (data.hoverBackgroundColor) {
    link.style.setProperty(
      '--cta-hover-bg',
      data.hoverBackgroundColor,
    );
  }

  if (data.hoverTextColor) {
    link.style.setProperty(
      '--cta-hover-text',
      data.hoverTextColor,
    );
  }

  if (
    data.icon
    && data.iconPosition === 'before'
  ) {
    const icon = createIcon(
      data.icon,
      data.iconSize,
      data.arrowColor,
    );

    if (icon) {
      link.append(icon);
    }
  }

  const text = document.createElement('span');

  text.className = 'cta-text';
  text.textContent = data.textcta;

  link.append(text);

  if (
    data.icon
    && data.iconPosition === 'after'
  ) {
    const icon = createIcon(
      data.icon,
      data.iconSize,
      data.arrowColor,
    );

    if (icon) {
      link.append(icon);
    }
  }

  return link;
}

export default function decorate(block) {
  const data = readBlockContent(block);

  const cta = createCta(data);

  block.replaceChildren();

  block.classList.add(
    `cta-align-${data.alignment}`,
  );

  if (!cta) {
    return;
  }

  switch (data.ctaWidth) {
    case 'half':
      cta.classList.add(
        'cta-width-half-link',
      );
      break;

    case 'full':
      cta.classList.add(
        'cta-width-full-link',
      );
      break;

    default:
      break;
  }

  block.append(cta);
}
