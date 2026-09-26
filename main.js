document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav a');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Once it's revealed, we don't need to observe it anymore
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    revealElements.forEach(el => observer.observe(el));

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - (navHeight - 20);

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Handle specific booking button clicks (pre-fill message and scroll)
    document.querySelectorAll('.booking-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            const subjectData = btn.getAttribute('data-subject');
            const messageField = document.querySelector('textarea[name="message"]');
            const hiddenSubject = document.querySelector('input[name="_subject"]');

            if (targetSection) {
                // Smooth scroll
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetSection.offsetTop - (navHeight - 20);

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update form fields
                if (hiddenSubject && subjectData) {
                    hiddenSubject.value = subjectData;
                }

                if (messageField) {
                    messageField.focus();
                    // Pre-fill message if empty to guide user
                    if (subjectData && messageField.value.trim() === '') {
                        const serviceName = subjectData.replace('Bokning: ', '');
                        messageField.value = `Hej! Jag är intresserad av att boka ${serviceName}.\n\n`;
                    }
                }
            }
        });
    });
    // Contact Form → Cloudflare Worker → Telegram
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : 'Skicka förfrågan';

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Skickar…';
            }

            const data = {
                name: contactForm.querySelector('[name="name"]').value.trim(),
                email: contactForm.querySelector('[name="email"]').value.trim(),
                phone: (contactForm.querySelector('[name="phone"]')?.value || '').trim(),
                message: contactForm.querySelector('[name="message"]').value.trim(),
            };

            // Remove any previous status message
            contactForm.querySelector('.form-status')?.remove();

            try {
                const res = await fetch(
                    'https://kishori-contact-worker.simonsaysautomate.workers.dev',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    }
                );

                if (res.ok) {
                    contactForm.reset();
                    Array.from(contactForm.children).forEach(child => {
                        if (child.style) child.style.display = 'none';
                    });

                    const statusEl = document.createElement('div');
                    statusEl.className = 'form-status';
                    statusEl.innerHTML = `
                        <div style="text-align: center; padding: 2rem 0;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
                            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 2rem; margin-bottom: 1rem; color: var(--text-color);">Tack för ditt meddelande!</h3>
                            <p style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem;">Vi återkommer till dig så snart vi kan.</p>
                            <button type="button" class="btn-primary reset-form-btn">Skicka ett till meddelande</button>
                        </div>
                    `;
                    contactForm.appendChild(statusEl);

                    statusEl.querySelector('.reset-form-btn').addEventListener('click', () => {
                        statusEl.remove();
                        Array.from(contactForm.children).forEach(child => {
                            if (child.style) child.style.display = '';
                        });
                    });
                } else {
                    const statusEl = document.createElement('p');
                    statusEl.className = 'form-status';
                    statusEl.textContent = '❌ Något gick fel. Försök igen eller kontakta oss via e-post.';
                    statusEl.style.color = '#f87171';
                    submitBtn.insertAdjacentElement('afterend', statusEl);
                }
            } catch {
                const statusEl = document.createElement('p');
                statusEl.className = 'form-status';
                statusEl.textContent = '❌ Nätverksfel. Kontrollera din anslutning och försök igen.';
                statusEl.style.color = '#f87171';
                submitBtn.insertAdjacentElement('afterend', statusEl);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }
});
