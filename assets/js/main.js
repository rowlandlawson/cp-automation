document.addEventListener('DOMContentLoaded', function() {
    // Set current year
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Projects pagination
    let currentPage = 1;
    const totalPages = 2;
    const prevBtn = document.getElementById('projectsPrev');
    const nextBtn = document.getElementById('projectsNext');
    const pageInfo = document.getElementById('projectsPageInfo');

    function showPage(pageNumber) {
        // Hide all pages
        document.querySelectorAll('.project-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show current page
        document.getElementById('page' + pageNumber).classList.add('active');
        
        // Update page info
        pageInfo.textContent = `Page ${pageNumber} of ${totalPages}`;
        
        // Update button states
        prevBtn.disabled = pageNumber === 1;
        nextBtn.disabled = pageNumber === totalPages;
    }

    if (prevBtn && nextBtn && pageInfo) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
            }
        });

        // Initialize
        showPage(currentPage);
    }

    // Scroll animations
    function checkScroll() {
        const elements = document.querySelectorAll('.scroll-animate');
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    }

    // Initial check
    checkScroll();
    // Ensure elements with scroll-animate are visible on load in environments
    // where the initial scroll check doesn't trigger (fix for hidden sections).
    // Skip elements inside #home (hero) and #testimonials per request.
    document.querySelectorAll('.scroll-animate').forEach(el => {
        if (!el.closest('#home') && !el.closest('#testimonials')) {
            el.classList.add('animated');
        }
    });
    
    // Check on scroll
    window.addEventListener('scroll', checkScroll);

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Collapse navbar on link click (mobile) and when clicking outside the open navbar
    (function handleNavbarCollapse() {
        const navbarCollapseEl = document.getElementById('navbarSupportedContent');
        if (!navbarCollapseEl) return;

        const bsCollapse = new bootstrap.Collapse(navbarCollapseEl, { toggle: false });

        // Close when any in-page nav link is clicked
        document.querySelectorAll('.navbar-nav a.nav-link, .navbar-nav .nav-item a').forEach(link => {
            link.addEventListener('click', () => {
                // Only hide if navbar is currently shown (mobile)
                if (navbarCollapseEl.classList.contains('show')) {
                    bsCollapse.hide();
                }
            });
        });

        // Close when clicking outside the navbar on small screens
        document.addEventListener('click', (e) => {
            // If navbar isn't open, nothing to do
            if (!navbarCollapseEl.classList.contains('show')) return;

            // Clicked element is inside navbar or on the toggler -> do nothing
            const toggler = document.querySelector('.navbar-toggler');
            if (navbarCollapseEl.contains(e.target) || (toggler && toggler.contains(e.target))) return;

            // Otherwise hide navbar
            bsCollapse.hide();
        }, { passive: true });
    })();

    // Counter animation
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 40);
    });

    // Initialize carousel
    const testimonialCarousel = document.getElementById('testimonialsCarousel');
    if (testimonialCarousel) {
        const carousel = new bootstrap.Carousel(testimonialCarousel, {
            interval: 5000, // Auto-rotate every 5 seconds
            wrap: true
        });
    }
});