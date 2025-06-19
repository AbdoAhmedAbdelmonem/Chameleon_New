document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation functionality
    const navOpenBtn = document.querySelector('[data-nav-open-btn]');
    const navCloseBtn = document.querySelector('[data-nav-close-btn]');
    const navbar = document.querySelector('[data-navbar]');
    const overlay = document.querySelector('[data-overlay]');
    const goTopBtn = document.querySelector('[data-go-top]');
    const navLinks = document.querySelectorAll('.navbar-link');
    const socialLinks = document.querySelectorAll('.nav-social-list .social-link');

    // Enhanced mobile menu toggle with animations
    const openMenu = function() {
        navbar.classList.add("active");
        overlay.classList.add("active");
        document.body.classList.add("nav-active");
        
        // Animate menu items
        navLinks.forEach((link, index) => {
            link.style.animation = `menuItemFadeIn 0.5s ease forwards ${index * 0.1 + 0.3}s`;
        });
        
        // Animate social icons
        socialLinks.forEach((link, index) => {
            link.style.animation = `socialFadeIn 0.5s ease forwards ${index * 0.1 + 0.8}s`;
        });
        
        // Accessibility
        navOpenBtn.setAttribute("aria-expanded", "true");
    };

    const closeMenu = function() {
        navbar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.classList.remove("nav-active");
        
        // Reset animations
        navLinks.forEach(link => {
            link.style.animation = 'none';
            setTimeout(() => {
                link.style.animation = '';
                link.style.opacity = '0';
                link.style.transform = 'translateX(30px)';
            }, 10);
        });
        
        socialLinks.forEach(link => {
            link.style.animation = 'none';
            setTimeout(() => {
                link.style.animation = '';
                link.style.opacity = '0';
                link.style.transform = 'translateY(20px)';
            }, 10);
        });
        
        // Accessibility
        navOpenBtn.setAttribute("aria-expanded", "false");
    };

    navOpenBtn.addEventListener("click", openMenu);
    navCloseBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    // Go-to-top button visibility
    window.addEventListener('scroll', () => {
        if (window.scrollY >= 200) {
            goTopBtn?.classList.add('active');
        } else {
            goTopBtn?.classList.remove('active');
        }
    });

    // --- Gallery Logic ---
    const galleryTrack = document.querySelector('[data-gallery-track]');
    const prevArrow = document.querySelector('[data-arrow-prev]');
    const nextArrow = document.querySelector('[data-arrow-next]');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (galleryTrack && prevArrow && nextArrow && galleryCards.length > 0) {
        const cardWidth = galleryCards[0].offsetWidth + 30; // Card width + gap

        // Function to update the active-middle class
        const updateActiveCard = () => {
            const trackRect = galleryTrack.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;

            galleryCards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = Math.abs(trackCenter - cardCenter);
                const threshold = cardRect.width * 0.5;

                if (distance < threshold) {
                    card.classList.add('active-middle');
                } else {
                    card.classList.remove('active-middle');
                }
            });
        };

        // Initialize gallery
        const initializeGallery = () => {
            updateActiveCard();
        };

        // Handle image loading
        let imagesLoadedCount = 0;
        galleryCards.forEach(card => {
            const img = card.querySelector('img');
            if (img) {
                if (img.complete) {
                    imagesLoadedCount++;
                } else {
                    img.addEventListener('load', () => {
                        imagesLoadedCount++;
                        if (imagesLoadedCount === galleryCards.length) {
                            initializeGallery();
                        }
                    });
                }
            } else {
                imagesLoadedCount++;
            }
        });
        if (imagesLoadedCount === galleryCards.length) {
            initializeGallery();
        }

        // Navigation arrows
        nextArrow.addEventListener('click', () => {
            let activeCardIndex = -1;
            galleryCards.forEach((card, index) => {
                if (card.classList.contains('active-middle')) {
                    activeCardIndex = index;
                }
            });

            if (activeCardIndex !== -1 && activeCardIndex < galleryCards.length - 1) {
                const nextCard = galleryCards[activeCardIndex + 1];
                const scrollOffset = nextCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (nextCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            } else if (activeCardIndex === -1 && galleryCards.length > 0) {
                const firstCard = galleryCards[0];
                const scrollOffset = firstCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (firstCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            }
        });

        prevArrow.addEventListener('click', () => {
            let activeCardIndex = -1;
            galleryCards.forEach((card, index) => {
                if (card.classList.contains('active-middle')) {
                    activeCardIndex = index;
                }
            });

            if (activeCardIndex > 0) {
                const prevCard = galleryCards[activeCardIndex - 1];
                const scrollOffset = prevCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (prevCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            } else if (activeCardIndex === -1 && galleryCards.length > 0) {
                const lastCard = galleryCards[galleryCards.length - 1];
                const scrollOffset = lastCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (lastCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            }
        });

        // Dragging functionality
        let isDragging = false;
        let startX;
        let scrollLeft;

        galleryTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            galleryTrack.classList.add('active-dragging');
            startX = e.pageX - galleryTrack.offsetLeft;
            scrollLeft = galleryTrack.scrollLeft;
            e.preventDefault();
        });

        galleryTrack.addEventListener('mouseleave', () => {
            isDragging = false;
            galleryTrack.classList.remove('active-dragging');
        });

        galleryTrack.addEventListener('mouseup', () => {
            isDragging = false;
            galleryTrack.classList.remove('active-dragging');
            updateActiveCard();
        });

        galleryTrack.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - galleryTrack.offsetLeft;
            const walk = (x - startX) * 2;
            galleryTrack.scrollLeft = scrollLeft - walk;
        });

        // Update active card on scroll end
        let scrollTimeout;
        galleryTrack.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                updateActiveCard();
            }, 100);
        });

        window.addEventListener('resize', () => {
            updateActiveCard();
        });
    }

    // Swiper initialization
    new Swiper(".wrapper", {
        loop: true,
        spaceBetween: 30,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },
    });

    // Intersection Observer for section animations
    const sections = document.querySelectorAll('.section-title, .about-banner, .about-content, .gears-card, .footer-top');
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});
