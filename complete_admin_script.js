// Admin Website Editor - Security & Functionality
// This system requires server-side implementation for full security

// Configuration
const CONFIG = {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    maudeEmail: 'maude@example.com' // Update with Maude's actual email
};

// Security State Management
let securityState = {
    isAuthenticated: false,
    currentUser: null,
    loginAttempts: 0,
    lockoutUntil: null,
    sessionStart: null,
    lastActivity: null,
    accessRequests: [] // In production, this would be server-side
};

// Simulated user database (In production, this would be server-side)
let authorizedUsers = {
    // Demo user for testing - remove in production
    'maude': { 
        password: 'secure123', // In production, this would be hashed
        totpSecret: 'JBSWY3DPEHPK3PXP', // Demo secret
        approved: true,
        role: 'admin'
    }
};

// Content storage (in production, this would be server-side)
let websiteContent = {
    artistName: 'MAUDE',
    artistSubtitle: 'Abstract Expressionist',
    aboutParagraph1: 'Through the interplay of light and shadow, Maude explores the boundaries between consciousness and void. Her abstract expressionist works emerge from a dialogue with emptiness, where charcoal becomes whisper, silver becomes breath, and white becomes the space between thoughts.',
    aboutParagraph2: 'Each piece is a meditation on the essential—stripping away the unnecessary to reveal the profound truths that exist in the spaces we often overlook. Her work invites contemplation, demanding nothing but offering everything to those willing to listen with their eyes.',
    artworks: [
        { title: 'Convergence I', image: 'convergence-i.jpg' },
        { title: 'Elemental', image: 'elemental.jpg' },
        { title: 'Void Whispers', image: 'void-whispers.jpg' },
        { title: 'Monochrome Dreams', image: 'monochrome-dreams.jpg' },
        { title: 'Silent Storms', image: 'silent-storms.jpg' },
        { title: 'Between Lines', image: 'between-lines.jpg' }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    clearSession();
    setupEventListeners();
    setupActivityMonitoring();
    setInterval(checkSessionTimeout, 60000); // Check every minute
    showSignup(); // Start with signup form
    loadSavedContent();
}

function setupEventListeners() {
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupRequest);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Auto-save content changes
    setupAutoSave();
}

function setupAutoSave() {
    const inputs = document.querySelectorAll('#editorContainer input, #editorContainer textarea');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(saveContent, 2000));
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupActivityMonitoring() {
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('click', updateActivity);
}

function updateActivity() {
    if (securityState.isAuthenticated) {
        securityState.lastActivity = Date.now();
    }
}

// Access Request System
function handleSignupRequest(e) {
    e.preventDefault();
    
    const name = document.getElementById('requestName').value.trim();
    const email = document.getElementById('requestEmail').value.trim();
    const reason = document.getElementById('requestReason').value.trim();
    
    if (!name || !email || !reason) {
        showMessage('signupMessage', 'Please fill in all fields.', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        showMessage('signupMessage', 'Please enter a valid email address.', 'error');
        return;
    }
    
    // Create access request
    const request = {
        id: Date.now(),
        name: name,
        email: email,
        reason: reason,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Store request (in production, send to server)
    securityState.accessRequests.push(request);
    
    // Send email to Maude (simulated)
    sendAccessRequestEmail(request);
    
    // Show success message
    showMessage('signupMessage', 
        `Access request sent successfully! Maude will review your request and contact you at ${email} if approved.`, 
        'success'
    );
    
    // Clear form
    document.getElementById('signupForm').reset();
}

function sendAccessRequestEmail(request) {
    // In production, this would be a server-side email service
    const emailContent = `
        New Website Editor Access Request
        
        Name: ${request.name}
        Email: ${request.email}
        Reason: ${request.reason}
        Time: ${new Date(request.timestamp).toLocaleString()}
        
        To approve this request:
        1. Generate a Google Authenticator secret for ${request.name}
        2. Create login credentials
        3. Send approval email with setup instructions
        
        Request ID: ${request.id}
    `;
    
    // Simulate email sending
    console.log('Email sent to Maude:', emailContent);
}

// Authentication System
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const authCode = document.getElementById('authCode').value.trim();
    
    // Check if account is locked
    if (securityState.lockoutUntil && Date.now() < securityState.lockoutUntil) {
        const remainingTime = Math.ceil((securityState.lockoutUntil - Date.now()) / 60000);
        showMessage('loginMessage', `Account locked. Try again in ${remainingTime} minutes.`, 'error');
        return;
    }
    
    // Validate input
    if (!username || !password || !authCode) {
        showMessage('loginMessage', 'Please fill in all fields.', 'error');
        return;
    }
    
    if (authCode.length !== 6 || !/^\d{6}$/.test(authCode)) {
        showMessage('loginMessage', 'Google Authenticator code must be 6 digits.', 'error');
        return;
    }
    
    // Check credentials
    if (!authorizedUsers[username]) {
        recordFailedLogin();
        showMessage('loginMessage', 'Invalid credentials.', 'error');
        return;
    }
    
    const user = authorizedUsers[username];
    
    // Verify password (in production, compare with hash)
    if (user.password !== password) {
        recordFailedLogin();
        showMessage('loginMessage', 'Invalid credentials.', 'error');
        return;
    }
    
    // Simulate TOTP verification (in production, verify actual TOTP)
    if (!verifyTOTP(user.totpSecret, authCode)) {
        recordFailedLogin();
        showMessage('loginMessage', 'Invalid authenticator code.', 'error');
        return;
    }
    
    // Successful login
    authenticateUser(username, user);
}

function verifyTOTP(secret, token) {
    // Simplified TOTP verification for demo
    // In production, use proper TOTP library
    const validCodes = ['123456', '654321', '111111']; // Demo codes
    return validCodes.includes(token);
}

function recordFailedLogin() {
    securityState.loginAttempts++;
    
    if (securityState.loginAttempts >= CONFIG.maxLoginAttempts) {
        securityState.lockoutUntil = Date.now() + CONFIG.lockoutTime;
        showMessage('loginMessage', 
            `Too many failed attempts. Account locked for ${CONFIG.lockoutTime / 60000} minutes.`, 
            'error'
        );
    }
}

function authenticateUser(username, user) {
    securityState.isAuthenticated = true;
    securityState.currentUser = username;
    securityState.sessionStart = Date.now();
    securityState.lastActivity = Date.now();
    securityState.loginAttempts = 0; // Reset failed attempts
    securityState.lockoutUntil = null;
    
    showEditor();
    updateSessionInfo();
    loadContentToEditor();
    
    showMessage('loginMessage', 'Login successful! Redirecting...', 'success');
    setTimeout(() => {
        document.getElementById('loginMessage').style.display = 'none';
    }, 2000);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
        clearSession();
        showSignup();
    }
}

function clearSession() {
    securityState.isAuthenticated = false;
    securityState.currentUser = null;
    securityState.sessionStart = null;
    securityState.lastActivity = null;
}

function checkSessionTimeout() {
    if (!securityState.isAuthenticated) return;
    
    const now = Date.now();
    const timeSinceActivity = now - securityState.lastActivity;
    
    if (timeSinceActivity > CONFIG.sessionTimeout) {
        alert('Session expired due to inactivity. Please login again.');
        clearSession();
        showSignup();
    }
}

function updateSessionInfo() {
    const sessionInfo = document.getElementById('sessionInfo');
    if (sessionInfo && securityState.isAuthenticated) {
        const sessionDuration = Math.floor((Date.now() - securityState.sessionStart) / 60000);
        sessionInfo.textContent = `Logged in as: ${securityState.currentUser} (${sessionDuration}m)`;
    }
}

// UI Navigation Functions
function showSignup() {
    document.getElementById('signupContainer').style.display = 'flex';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('editorContainer').style.display = 'none';
}

function showLogin() {
    document.getElementById('signupContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('editorContainer').style.display = 'none';
}

function showEditor() {
    document.getElementById('signupContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('editorContainer').style.display = 'block';
}

// Content Management Functions
function loadSavedContent() {
    // Load from localStorage (in production, load from server)
    const saved = localStorage.getItem('maudeWebsiteContent');
    if (saved) {
        websiteContent = JSON.parse(saved);
    }
}

function saveContent() {
    if (!securityState.isAuthenticated) return;
    
    // Save to localStorage (in production, save to server)
    localStorage.setItem('maudeWebsiteContent', JSON.stringify(websiteContent));
    
    // Show save indicator
    showSaveIndicator();
}

function showSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.textContent = '✓ Saved';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 2000);
}

function loadContentToEditor() {
    // Load content into form fields
    document.getElementById('artist-name').value = websiteContent.artistName;
    document.getElementById('artist-subtitle').value = websiteContent.artistSubtitle;
    document.getElementById('about-paragraph1').value = websiteContent.aboutParagraph1;
    document.getElementById('about-paragraph2').value = websiteContent.aboutParagraph2;
    
    // Load artworks
    const galleryItems = document.getElementById('gallery-items');
    galleryItems.innerHTML = '';
    
    websiteContent.artworks.forEach((artwork, index) => {
        addArtworkToGallery(artwork.title, artwork.image, index + 1);
    });
}

function addArtworkToGallery(title = '', image = '', number = null) {
    const galleryItems = document.getElementById('gallery-items');
    const artworkNumber = number || (galleryItems.children.length + 1);
    
    const newItem = document.createElement('div');
    newItem.className = 'gallery-item';
    newItem.innerHTML = `
        <h4>Artwork ${artworkNumber}</h4>
        <div class="two-column">
            <div class="form-group">
                <label>Artwork Title:</label>
                <input type="text" class="artwork-title" value="${title}" placeholder="Enter artwork title">
            </div>
            <div class="form-group">
                <label>Image Filename:</label>
                <input type="text" class="artwork-image" value="${image}" placeholder="e.g., artwork${artworkNumber}.jpg">
            </div>
        </div>
        <button class="btn btn-danger" onclick="removeArtwork(this)" style="margin-top: 10px;">Remove This Artwork</button>
    `;
    
    galleryItems.appendChild(newItem);
    
    // Add event listeners for auto-save
    const inputs = newItem.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(updateContentFromEditor, 1000));
    });
}

function updateContentFromEditor() {
    if (!securityState.isAuthenticated) return;
    
    // Update content object from form fields
    websiteContent.artistName = document.getElementById('artist-name').value;
    websiteContent.artistSubtitle = document.getElementById('artist-subtitle').value;
    websiteContent.aboutParagraph1 = document.getElementById('about-paragraph1').value;
    websiteContent.aboutParagraph2 = document.getElementById('about-paragraph2').value;
    
    // Update artworks
    const titles = Array.from(document.querySelectorAll('.artwork-title')).map(input => input.value);
    const images = Array.from(document.querySelectorAll('.artwork-image')).map(input => input.value);
    
    websiteContent.artworks = titles.map((title, index) => ({
        title: title,
        image: images[index]
    })).filter(artwork => artwork.title && artwork.image);
    
    saveContent();
}

// Gallery Management Functions
function addArtwork() {
    if (!securityState.isAuthenticated) {
        alert('Please login to make changes.');
        return;
    }
    
    addArtworkToGallery();
    updateContentFromEditor();
}

function removeArtwork(button) {
    if (!securityState.isAuthenticated) {
        alert('Please login to make changes.');
        return;
    }
    
    if (confirm('Are you sure you want to remove this artwork?')) {
        button.parentElement.remove();
        updateContentFromEditor();
    }
}

// Code Generation Function
function generateCode() {
    if (!securityState.isAuthenticated) {
        alert('Please login to generate code.');
        return;
    }
    
    updateContentFromEditor(); // Ensure content is up to date
    
    const artistName = websiteContent.artistName;
    const artistSubtitle = websiteContent.artistSubtitle;
    const aboutP1 = websiteContent.aboutParagraph1;
    const aboutP2 = websiteContent.aboutParagraph2;
    
    let galleryHTML = '';
    websiteContent.artworks.forEach(artwork => {
        if (artwork.title && artwork.image) {
            galleryHTML += `                    <div class="artwork" style="background-image: url('images/${artwork.image}');">
                        <div class="artwork-title">${artwork.title}</div>
                    </div>
`;
        }
    });
    
    const htmlCode = generateWebsiteHTML(artistName, artistSubtitle, aboutP1, aboutP2, galleryHTML);
    
    const codeOutput = document.getElementById('code-output');
    codeOutput.textContent = htmlCode;
    codeOutput.style.display = 'block';
    
    // Add copy button
    addCopyButton(codeOutput, htmlCode);
    
    // Scroll to the code output
    codeOutput.scrollIntoView({ behavior: 'smooth' });
    
    // Show success message
    showMessage('generate-success', 'HTML code generated successfully! Copy the code below.', 'success');
}

function generateWebsiteHTML(artistName, artistSubtitle, aboutP1, aboutP2, galleryHTML) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${artistName} - ${artistSubtitle}</title>
    <link href="https://fonts.googleapis.com/css2?family=Electrolize:wght@400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="stylesheet.css">
</head>
<body>
    <div class="grain-overlay"></div>
    
    <header>
        <nav class="container">
            <div class="logo">${artistName}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <div class="mobile-menu">☰</div>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h1>${artistName}</h1>
                <p>${artistSubtitle}</p>
            </div>
        </section>

        <section id="gallery" class="section">
            <div class="container">
                <h2 class="section-title">GALLERY</h2>
                <div class="gallery">
${galleryHTML}                </div>
            </div>
        </section>

        <section id="about" class="section">
            <div class="container">
                <h2 class="section-title">ABOUT</h2>
                <div class="about-content">
                    <p>${aboutP1}</p>
                    <br>
                    <p>${aboutP2}</p>
                </div>
            </div>
        </section>

        <section id="contact" class="section">
            <div class="container">
                <h2 class="section-title">CONTACT</h2>
                <form class="contact-form">
                    <div class="form-group">
                        <input type="text" placeholder="Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <textarea placeholder="Message" required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Send Message</button>
                </form>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2025 ${artistName}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation links
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

        // Interactive cursor effect
        document.addEventListener('mousemove', (e) => {
            const cursor = document.querySelector('body');
            if (Math.random() < 0.02) {
                cursor.style.filter = \`hue-rotate(\${Math.random() * 360}deg)\`;
                setTimeout(() => {
                    cursor.style.filter = 'none';
                }, 100);
            }
        });

        // Form submission handler
        document.querySelector('.contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const button = this.querySelector('.submit-btn');
            const originalText = button.textContent;
            button.textContent = 'Sending...';
            button.style.background = '#404040';
            button.style.color = '#ffffff';
            
            setTimeout(() => {
                button.textContent = 'Message Sent';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = 'transparent';
                    button.style.color = '#404040';
                    this.reset();
                }, 2000);
            }, 1000);
        });

        // Mobile menu toggle
        document.querySelector('.mobile-menu').addEventListener('click', function() {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'rgba(255, 255, 255, 0.95)';
                navLinks.style.padding = '20px';
            }
        });

        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.artwork, .about-content, .contact-form').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            el.style.transition = 'all 0.8s ease-out';
            observer.observe(el);
        });
    </script>
</body>
</html>`;
}

function addCopyButton(codeOutput, htmlCode) {
    // Remove existing copy button if any
    const existingButton = document.querySelector('#copyCodeButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    const copyButton = document.createElement('button');
    copyButton.id = 'copyCodeButton';
    copyButton.textContent = '📋 Copy to Clipboard';
    copyButton.className = 'btn btn-success';
    copyButton.style.marginTop = '10px';
    copyButton.style.marginBottom = '20px';
    
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(htmlCode).then(() => {
            copyButton.textContent = '✅ Copied!';
            copyButton.style.background = '#27ae60';
            setTimeout(() => {
                copyButton.textContent = '📋 Copy to Clipboard';
                copyButton.style.background = '';
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = htmlCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            copyButton.textContent = '✅ Copied!';
            setTimeout(() => {
                copyButton.textContent = '📋 Copy to Clipboard';
            }, 2000);
        });
    });
    
    codeOutput.parentNode.insertBefore(copyButton, codeOutput.nextSibling);
}

// Utility Functions
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Session management updates
setInterval(() => {
    if (securityState.isAuthenticated) {
        updateSessionInfo();
    }
}, 30000); // Update every 30 seconds

// Add CSS animation for save indicator
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);