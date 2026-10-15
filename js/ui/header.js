import { throttle } from '../utils/helpers.js';

/* ============================================
   2. HEADER SCROLL EFFECT
   ============================================ */
export function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    // Prevent double initialization
    if (header.dataset.headerInitialized === 'true') return;
    header.dataset.headerInitialized = 'true';

    // Throttled scroll handler for better performance
    const handleScroll = throttle(() => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // The first real scroll event applies the scrolled state. Avoiding an eager
    // scrollY read prevents a mobile Lighthouse forced reflow on first paint.
}

/* ============================================
   3. MOBILE NAVIGATION
   ============================================ */
export function initMobileNav() {
    const toggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');

    if (!toggle || !navList) return;

    // Prevent double initialization
    if (toggle.dataset.navInitialized === 'true') return;
    toggle.dataset.navInitialized = 'true';

    const isMobileNav = () => window.matchMedia('(max-width: 992px)').matches;
    const dropdownItems = Array.from(navList.querySelectorAll('.nav__item--has-dropdown'));
    const closeDropdowns = (except = null) => {
        dropdownItems.forEach((item) => {
            if (item === except) return;
            item.classList.remove('is-active');
            item.querySelector('.nav__link--dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
    };
    const setDropdownOpen = (item, open) => {
        if (!item) return;
        closeDropdowns(open ? item : null);
        item.classList.toggle('is-active', open);
        item.querySelector('.nav__link--dropdown-toggle')?.setAttribute('aria-expanded', String(open));
    };
    const setMenuOpen = (open, focusFirstLink = false) => {
        navList.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Zavřít hlavní menu' : 'Otevřít hlavní menu');
        document.body.classList.toggle('nav-open', open);

        if (isMobileNav()) {
            navList.setAttribute('aria-hidden', String(!open));
        } else {
            navList.removeAttribute('aria-hidden');
        }

        if (!open) closeDropdowns();
        if (open && focusFirstLink) {
            navList.querySelector('a, button')?.focus({ preventScroll: true });
        }
    };
    const syncNavA11y = () => {
        if (isMobileNav()) {
            navList.setAttribute('aria-hidden', String(!navList.classList.contains('open')));
            return;
        }
        if (navList.classList.contains('open')) setMenuOpen(false);
        navList.removeAttribute('aria-hidden');
    };

    if (!navList.id) navList.id = 'primary-navigation';
    toggle.setAttribute('aria-controls', navList.id);
    syncNavA11y();

    dropdownItems.forEach((item, index) => {
        const toggleLink = item.querySelector('.nav__link--dropdown-toggle');
        const dropdown = item.querySelector('.nav__dropdown');
        if (!toggleLink || !dropdown) return;

        if (!dropdown.id) dropdown.id = `nav-dropdown-${index + 1}`;
        toggleLink.setAttribute('aria-haspopup', 'true');
        toggleLink.setAttribute('aria-expanded', 'false');
        toggleLink.setAttribute('aria-controls', dropdown.id);

        item.addEventListener('mouseenter', () => {
            if (!isMobileNav()) setDropdownOpen(item, true);
        });
        item.addEventListener('mouseleave', () => {
            if (!isMobileNav() && !item.contains(document.activeElement)) setDropdownOpen(item, false);
        });
        item.addEventListener('focusout', (event) => {
            if (isMobileNav() || item.contains(event.relatedTarget)) return;
            setDropdownOpen(item, false);
        });
    });

    // Toggle menu
    toggle.addEventListener('click', () => {
        setMenuOpen(!navList.classList.contains('open'), true);
    });

    // Dropdown buttons work the same with click, Enter and Space on every viewport.
    const dropdownToggles = navList.querySelectorAll('.nav__link--dropdown-toggle');
    dropdownToggles.forEach(toggleBtn => {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parentItem = toggleBtn.closest('.nav__item--has-dropdown');
            const isOpen = parentItem?.classList.contains('is-active');
            setDropdownOpen(parentItem, !isOpen);
        });

        toggleBtn.addEventListener('keydown', (e) => {
            if (e.key === ' ' && toggleBtn.tagName !== 'BUTTON') { e.preventDefault(); toggleBtn.click(); return; }
            if (e.key !== 'ArrowDown') return;
            e.preventDefault();
            const parentItem = toggleBtn.closest('.nav__item--has-dropdown');
            setDropdownOpen(parentItem, true);
            parentItem?.querySelector('.nav__dropdown-link')?.focus({ preventScroll: true });
        });
    });

    // Close menu on normal link click (ignore dropdown toggles)
    navList.querySelectorAll('a:not(.nav__link--dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            setMenuOpen(false);
        });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const expandedDropdown = navList.querySelector('.nav__link--dropdown-toggle[aria-expanded="true"]');
        if (isMobileNav() && navList.classList.contains('open')) {
            setMenuOpen(false);
            toggle.focus();
        } else if (expandedDropdown) {
            closeDropdowns();
            expandedDropdown.focus();
        }
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
        if (toggle.contains(e.target) || navList.contains(e.target)) return;
        closeDropdowns();
        if (navList.classList.contains('open')) setMenuOpen(false);
    });

    navList.dataset.dropdownsReady = 'true';
    window.addEventListener('resize', syncNavA11y);
}
