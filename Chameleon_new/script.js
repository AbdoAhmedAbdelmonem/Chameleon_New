document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation functionality (existing code)
    const navOpenBtn = document.querySelector('[data-nav-open-btn]');
    const navCloseBtn = document.querySelector('[data-nav-close-btn]');
    const navbar = document.querySelector('[data-navbar]');
    const overlay = document.querySelector('[data-overlay]');
    const goTopBtn = document.querySelector('[data-go-top]');

    const toggleNavbar = () => {
        navbar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('active'); // Prevents scroll on body when nav is open
    };

    navOpenBtn?.addEventListener('click', toggleNavbar);
    navCloseBtn?.addEventListener('click', toggleNavbar);
    overlay?.addEventListener('click', toggleNavbar);

    // Close navbar when a nav link is clicked
    document.querySelectorAll('.navbar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                toggleNavbar();
            }
        });
    });

    // Go-to-top button visibility (existing code)
    window.addEventListener('scroll', () => {
        if (window.scrollY >= 200) {
            goTopBtn?.classList.add('active');
        } else {
            goTopBtn?.classList.remove('active');
        }
    });

    // --- New Creative Gallery Logic ---
    const galleryTrack = document.querySelector('[data-gallery-track]');
    const prevArrow = document.querySelector('[data-arrow-prev]');
    const nextArrow = document.querySelector('[data-arrow-next]');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (galleryTrack && prevArrow && nextArrow && galleryCards.length > 0) {
        const cardWidth = galleryCards[0].offsetWidth + 30; // Card width + gap

        // Variables for dragging functionality
        let isDragging = false;
        let startX;
        let scrollLeft;

        // Function to update the active-middle class
        const updateActiveCard = () => {
            const trackRect = galleryTrack.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;

            galleryCards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;

                // Calculate distance from the card's center to the track's center
                const distance = Math.abs(trackCenter - cardCenter);

                // Define a threshold for "middle" - e.g., within half a card's width of the center
                const threshold = cardRect.width * 0.5;

                if (distance < threshold) {
                    // This card is close enough to the center
                    if (!card.classList.contains('active-middle')) {
                        card.classList.add('active-middle');
                    }
                } else {
                    // This card is not in the middle
                    if (card.classList.contains('active-middle')) {
                        card.classList.remove('active-middle');
                    }
                }
            });
        };

        // Initialize active card on load and when images are loaded
        const initializeGallery = () => {
            updateActiveCard(); // Initial check
            // You might want to scroll to a specific card initially, e.g., the first one
            // galleryTrack.scrollLeft = 0;
        };

        // Ensure images are loaded before calculating card positions (optional, but good practice)
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
                imagesLoadedCount++; // Count cards without images as loaded
            }
        });
        if (imagesLoadedCount === galleryCards.length) {
            initializeGallery();
        }


        // Click handlers for navigation arrows
        nextArrow.addEventListener('click', () => {
            // Find the currently active card index
            let activeCardIndex = -1;
            galleryCards.forEach((card, index) => {
                if (card.classList.contains('active-middle')) {
                    activeCardIndex = index;
                }
            });

            // If an active card is found and it's not the last one, scroll to the next
            if (activeCardIndex !== -1 && activeCardIndex < galleryCards.length - 1) {
                const nextCard = galleryCards[activeCardIndex + 1];
                const scrollOffset = nextCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (nextCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            } else if (activeCardIndex === -1 && galleryCards.length > 0) {
                // If no active card (e.g., first load), scroll to the first card
                const firstCard = galleryCards[0];
                const scrollOffset = firstCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (firstCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            }
        });

        prevArrow.addEventListener('click', () => {
            // Find the currently active card index
            let activeCardIndex = -1;
            galleryCards.forEach((card, index) => {
                if (card.classList.contains('active-middle')) {
                    activeCardIndex = index;
                }
            });

            // If an active card is found and it's not the first one, scroll to the previous
            if (activeCardIndex > 0) {
                const prevCard = galleryCards[activeCardIndex - 1];
                const scrollOffset = prevCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (prevCard.offsetWidth / 2);
                galleryTrack.scrollTo({
                    left: scrollOffset,
                    behavior: 'smooth'
                });
            } else if (activeCardIndex === -1 && galleryCards.length > 0) {
                 // If no active card (e.g., first load), scroll to the last card
                 const lastCard = galleryCards[galleryCards.length - 1];
                 const scrollOffset = lastCard.offsetLeft - (galleryTrack.offsetWidth / 2) + (lastCard.offsetWidth / 2);
                 galleryTrack.scrollTo({
                     left: scrollOffset,
                     behavior: 'smooth'
                 });
            }
        });


        // Dragging event listeners
        galleryTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            galleryTrack.classList.add('active-dragging'); // Add class for cursor change
            startX = e.pageX - galleryTrack.offsetLeft;
            scrollLeft = galleryTrack.scrollLeft;
            e.preventDefault(); // Prevent default browser drag behavior
        });

        galleryTrack.addEventListener('mouseleave', () => {
            isDragging = false;
            galleryTrack.classList.remove('active-dragging');
        });

        galleryTrack.addEventListener('mouseup', () => {
            isDragging = false;
            galleryTrack.classList.remove('active-dragging');
            // After drag, update active card to snap to the new central one
            updateActiveCard();
        });

        galleryTrack.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - galleryTrack.offsetLeft;
            const walk = (x - startX) * 2; // Multiplier for faster scroll
            galleryTrack.scrollLeft = scrollLeft - walk;
        });

        // Update active card on scroll end (debounced)
        let scrollTimeout;
        galleryTrack.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                updateActiveCard();
            }, 100); // Debounce time in ms
        });

        // Adjust active card on window resize
        window.addEventListener('resize', () => {
            updateActiveCard(); // Re-evaluate active card position
        });
    }

    // Intersection Observer for section animations (if existing)
    const sections = document.querySelectorAll('.section-title, .about-banner, .about-content, .gears-card, .footer-top');

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Unobserve once animated
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});


      new Swiper(".wrapper", {
        loop: true,
        spaceBetween: 30,
        // Autoplay
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        // Pagination bullets
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          dynamicBullets: true,
        },
        // Navigation arrows
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        // Responsive breakpoints
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