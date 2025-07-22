// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Content Loaded
$(document).ready(function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupNavigation();
    setupScrollAnimations();
    setupLoginForms();
    loadDynamicContent();
    setupContactForm();
    setupAnnouncementRotation();
}

// Navigation Setup
function setupNavigation() {
    // Navbar scroll effect
    $(window).scroll(function() {
        if ($(window).scrollTop() > 100) {
            $('.custom-navbar').addClass('scrolled');
        } else {
            $('.custom-navbar').removeClass('scrolled');
        }
    });

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 100
            }, 1000);
        }
    });

    // Active nav link highlighting
    $(window).scroll(function() {
        let current = '';
        $('section').each(function() {
            const sectionTop = $(this).offset().top;
            const sectionHeight = $(this).height();
            if ($(window).scrollTop() >= (sectionTop - 200)) {
                current = $(this).attr('id');
            }
        });

        $('.navbar-nav .nav-link').removeClass('active');
        $('.navbar-nav .nav-link[href="#' + current + '"]').addClass('active');
    });
}

// Scroll Animations
function setupScrollAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-item, .facility-card, .news-card, .achievement-card, .management-card, .academic-card, .affiliation-card').forEach(function(el) {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Login Forms Setup
function setupLoginForms() {
    // Student Login
    $('#studentLoginForm').on('submit', function(e) {
        e.preventDefault();
        const studentId = $('#studentId').val();
        const password = $('#studentPassword').val();
        
        login('student', { studentId, password });
    });

    // Teacher Login
    $('#teacherLoginForm').on('submit', function(e) {
        e.preventDefault();
        const teacherId = $('#teacherId').val();
        const password = $('#teacherPassword').val();
        
        login('teacher', { teacherId, password });
    });

    // Admin Login
    $('#adminLoginForm').on('submit', function(e) {
        e.preventDefault();
        const adminId = $('#adminId').val();
        const password = $('#adminPassword').val();
        
        login('admin', { adminId, password });
    });
}

// Login Function
async function login(userType, credentials) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userType,
                ...credentials
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', userType);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Close modal
            $(`#${userType}LoginModal`).modal('hide');

            // Redirect to dashboard
            redirectToDashboard(userType);
            
            showAlert('success', 'Login successful!');
        } else {
            showAlert('error', data.message || 'Login failed');
        }
    } catch (error) {
        hideLoading();
        showAlert('error', 'Network error. Please try again.');
        console.error('Login error:', error);
    }
}

// Google Login
function loginWithGoogle(userType) {
    // This would integrate with Google OAuth
    showAlert('info', 'Google login integration coming soon!');
}

// Dashboard Redirect
function redirectToDashboard(userType) {
    const dashboardUrls = {
        student: 'student-dashboard.html',
        teacher: 'teacher-dashboard.html',
        admin: 'admin-dashboard.html'
    };
    
    setTimeout(() => {
        window.location.href = dashboardUrls[userType];
    }, 1500);
}

// Load Dynamic Content
async function loadDynamicContent() {
    await Promise.all([
        loadNews(),
        loadAchievements(),
        loadAnnouncements()
    ]);
}

// Load News
async function loadNews() {
    try {
        const response = await fetch(`${API_BASE_URL}/news`);
        if (response.ok) {
            const news = await response.json();
            renderNews(news.data || news);
        } else {
            // Fallback to static news
            renderNews(getStaticNews());
        }
    } catch (error) {
        console.error('Error loading news:', error);
        renderNews(getStaticNews());
    }
}

// Render News
function renderNews(newsItems) {
    const container = $('#news-container');
    container.empty();

    newsItems.slice(0, 6).forEach(item => {
        const newsCard = `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="news-card">
                    <img src="${item.image}" alt="${item.title}" class="img-fluid">
                    <div class="card-body">
                        <span class="news-date">${formatDate(item.date)}</span>
                        <h5>${item.title}</h5>
                        <p class="text-muted">${item.excerpt}</p>
                        <a href="#" class="btn btn-outline-primary btn-sm">Read More</a>
                    </div>
                </div>
            </div>
        `;
        container.append(newsCard);
    });
}

// Load Achievements
async function loadAchievements() {
    try {
        const response = await fetch(`${API_BASE_URL}/achievements`);
        if (response.ok) {
            const achievements = await response.json();
            renderAchievements(achievements.data || achievements);
        } else {
            renderAchievements(getStaticAchievements());
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
        renderAchievements(getStaticAchievements());
    }
}

// Render Achievements
function renderAchievements(achievements) {
    const container = $('#achievements-container');
    container.empty();

    achievements.slice(0, 6).forEach(item => {
        const achievementCard = `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="achievement-card">
                    <img src="${item.image}" alt="${item.title}" class="img-fluid">
                    <div class="card-body">
                        <h5>${item.title}</h5>
                        <p class="text-muted">${item.description}</p>
                        <div class="achievement-meta">
                            <small class="text-primary">${item.category} • ${formatDate(item.date)}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(achievementCard);
    });
}

// Load Announcements
async function loadAnnouncements() {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements`);
        if (response.ok) {
            const announcements = await response.json();
            window.announcements = announcements.data || announcements;
        } else {
            window.announcements = getStaticAnnouncements();
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        window.announcements = getStaticAnnouncements();
    }
}

// Announcement Rotation
function setupAnnouncementRotation() {
    let currentIndex = 0;
    
    setInterval(() => {
        if (window.announcements && window.announcements.length > 0) {
            const announcement = window.announcements[currentIndex];
            $('#announcement-text').fadeOut(300, function() {
                $(this).text(announcement.text).fadeIn(300);
            });
            currentIndex = (currentIndex + 1) % window.announcements.length;
        }
    }, 5000);
}

// Contact Form Setup
function setupContactForm() {
    $('.contact-form').on('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: $(this).find('input[placeholder="Your Name"]').val(),
            email: $(this).find('input[placeholder="Your Email"]').val(),
            subject: $(this).find('input[placeholder="Subject"]').val(),
            message: $(this).find('textarea').val()
        };

        try {
            showLoading();
            
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            hideLoading();

            if (response.ok) {
                showAlert('success', 'Message sent successfully! We will get back to you soon.');
                $(this)[0].reset();
            } else {
                showAlert('error', 'Failed to send message. Please try again.');
            }
        } catch (error) {
            hideLoading();
            showAlert('error', 'Network error. Please try again.');
            console.error('Contact form error:', error);
        }
    });
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading() {
    // Create loading overlay if it doesn't exist
    if (!$('#loadingOverlay').length) {
        $('body').append(`
            <div id="loadingOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            ">
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `);
    }
    $('#loadingOverlay').show();
}

function hideLoading() {
    $('#loadingOverlay').hide();
}

function showAlert(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-danger' : 
                     type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const alert = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 100px; right: 20px; z-index: 9999; min-width: 300px;">
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('body').append(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        $('.alert').fadeOut();
    }, 5000);
}

// Static Data (fallback when API is not available)
function getStaticNews() {
    return [
        {
            title: "EMRS Entrance Exam 2024 Applications Open",
            excerpt: "Applications for EMRS entrance examination are now open. Last date for submission is December 31st, 2024.",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-12-01"
        },
        {
            title: "Annual Sports Day Celebration",
            excerpt: "Students showcased their athletic talents in various sports competitions held at our school grounds.",
            image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-11-15"
        },
        {
            title: "Science Exhibition Winners",
            excerpt: "Our students won multiple awards at the district level science exhibition with innovative projects.",
            image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-11-10"
        },
        {
            title: "New Computer Lab Inauguration",
            excerpt: "State-of-the-art computer laboratory with latest equipment inaugurated for enhanced digital learning.",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-10-25"
        },
        {
            title: "Cultural Festival Highlights",
            excerpt: "Students performed traditional dances and cultural programs celebrating diversity and heritage.",
            image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-10-15"
        },
        {
            title: "Parent-Teacher Meeting",
            excerpt: "Successful parent-teacher interaction session focusing on student progress and development.",
            image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            date: "2024-10-01"
        }
    ];
}

function getStaticAchievements() {
    return [
        {
            title: "State Level Academic Excellence Award",
            description: "EMRS Dornala received the State Level Academic Excellence Award for outstanding performance in CBSE board examinations.",
            image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Academic",
            date: "2024-11-20"
        },
        {
            title: "District Sports Championship",
            description: "Our athletics team won the overall championship at the district level sports meet.",
            image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Sports",
            date: "2024-11-05"
        },
        {
            title: "Best EMRS School Award",
            description: "Recognized as the best performing Eklavya Model Residential School in the region.",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Recognition",
            date: "2024-10-30"
        },
        {
            title: "Science Innovation Award",
            description: "Students won first prize in the state level science innovation competition.",
            image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Science",
            date: "2024-10-20"
        },
        {
            title: "Cultural Heritage Preservation",
            description: "Awarded for outstanding work in preserving and promoting tribal cultural heritage.",
            image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Cultural",
            date: "2024-10-10"
        },
        {
            title: "100% Board Pass Rate",
            description: "Achieved 100% pass rate in CBSE Class X and XII board examinations.",
            image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            category: "Academic",
            date: "2024-09-15"
        }
    ];
}

function getStaticAnnouncements() {
    return [
        {
            text: "Latest: EMRS Entrance Exam 2024 applications now open! Apply before December 31st."
        },
        {
            text: "Annual Sports Day scheduled for December 15th, 2024. All students participation mandatory."
        },
        {
            text: "Winter vacation starts from December 20th to January 5th, 2025."
        },
        {
            text: "New batch of Class VI admissions open. Limited seats available."
        },
        {
            text: "Parent-Teacher meeting scheduled for December 10th, 2024."
        }
    ];
}

// Check Authentication Status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (token && userType) {
        // Update UI for logged in user
        updateUIForLoggedInUser(userType);
    }
}

function updateUIForLoggedInUser(userType) {
    // Update navbar to show user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const loginDropdown = $('.navbar-nav .dropdown:last-child');
    
    loginDropdown.html(`
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
            Welcome, ${user.name || userType}
        </a>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="${userType}-dashboard.html">Dashboard</a></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
        </ul>
    `);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    
    showAlert('success', 'Logged out successfully!');
    
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Initialize on page load
checkAuthStatus();