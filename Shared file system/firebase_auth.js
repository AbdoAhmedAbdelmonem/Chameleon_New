// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCoObLpySHlwI8s65VZhVtA-yKrBp9okj0",
    authDomain: "chameleon-51d0f.firebaseapp.com",
    projectId: "chameleon-51d0f",
    storageBucket: "chameleon-51d0f.appspot.com",
    messagingSenderId: "973630054645",
    appId: "1:973630054645:web:50befbdd13bc1da6c525bc",
    measurementId: "G-MF62V2Y5XN",
    databaseURL: "https://chameleon-51d0f-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global authentication state
let GlobalIsLogined = false;
let GlobTime = 3000; // Default redirect delay

// Set persistence to LOCAL
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

// DOM elements
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const userDashboard = document.getElementById("user-dashboard");
const authNavLink = document.getElementById("auth-nav-link");
const loginStatusText = document.getElementById("login-status-text");
const userStatue = document.getElementById("user-status-text");
const themeToggle = document.getElementById("themeToggle");

// ================= AUTHENTICATION FUNCTIONS ================= //

// Initialize Google Auth
function initializeGoogleAuth() {
    if (!window.google?.accounts?.id) {
        console.warn("Google Identity Services library not loaded.");
        return;
    }

    google.accounts.id.initialize({
        client_id: "81255175502-g2qmbk0298vd7ckh8foa9bp2qdsgh16k.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        ux_mode: "popup",
    });

    const signinButton = document.getElementById("signin-button");
    const signupSigninButton = document.getElementById("signup-signin-button");

    if (signinButton) {
        google.accounts.id.renderButton(signinButton, {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            shape: "pill",
            text: "continue_with",
            logo_alignment: "center",
        });
    }

    if (signupSigninButton) {
        google.accounts.id.renderButton(signupSigninButton, {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            shape: "pill",
            text: "continue_with",
            logo_alignment: "center",
        });
    }
}

// Handle Google auth response
function handleGoogleCredentialResponse(response) {
    if (document.getElementById("login-button")) showLoading("login");
    if (document.getElementById("signup-button")) showLoading("signup");

    const idToken = response.credential;
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);

    auth.signInWithCredential(credential)
        .then((userCredential) => {
            GlobalIsLogined = true;
            logLoginActivity(userCredential.user.uid, "google");
            GlobTime = 1000;
            redirectAfterLogin();
        })
        .catch((error) => {
            GlobalIsLogined = false;
            if (document.getElementById("login-button")) hideLoading("login");
            if (document.getElementById("signup-button")) hideLoading("signup");
            console.error("Google sign-in error:", error);
            displayAuthError(error);
        });
}

// Email/password login (with email verification check)
let loginAttempts = 0;
let lastLoginAttempt = 0;

function login() {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        displayMessage("login-message", "Please fill in all fields", true);
        return;
    }

    // Domain whitelisting (optional)
    const allowedDomains = ["yourdomain.com"]; // Replace with your allowed domains
    const emailDomain = email.split('@')[1];
    if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
        displayMessage("login-message", "Only emails from specific domains are allowed.", true);
        return;
    }

    const now = Date.now();
    if (now - lastLoginAttempt < 2000) {
        displayMessage("login-message", "Please wait before trying again", true);
        return;
    }

    lastLoginAttempt = now;
    loginAttempts++;

    if (loginAttempts > 5) {
        displayMessage("login-message", "Too many attempts. Try again later or use Google Sign-In.", true);
        return;
    }

    showLoading("login");

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                auth.signOut(); // Force logout if not verified
                displayMessage("login-message", "Email not verified. Please check your inbox.", true);
                return;
            }

            GlobalIsLogined = true;
            logLoginActivity(user.uid, "email");
            loginAttempts = 0;
            GlobTime = 1000;
            redirectAfterLogin();
        })
        .catch((error) => {
            GlobalIsLogined = false;
            hideLoading("login");
            displayAuthError(error);
        });
}

// Email/password signup (with email verification)
function signup() {
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!name || !email || !password) {
        displayMessage("signup-message", "Please fill in all fields", true);
        return;
    }

    // Domain whitelisting (optional)
    const allowedDomains = ["yourdomain.com"]; // Replace with your allowed domains
    const emailDomain = email.split('@')[1];
    if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
        displayMessage("signup-message", "Only emails from specific domains are allowed.", true);
        return;
    }

    // Password strength check
    const strengthMeter = document.getElementById("password-strength-meter");
    if (strengthMeter && (strengthMeter.classList.contains("strength-weak") || password.length < 8)) {
        displayMessage("signup-message", "Password too weak (min 8 chars with letters, numbers, symbols).", true);
        return;
    }

    showLoading("signup");

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update profile and send verification email
            return userCredential.user.updateProfile({
                displayName: name,
            }).then(() => {
                return userCredential.user.sendEmailVerification();
            }).then(() => {
                // Save user data to Firebase
                return database.ref("users/" + userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastLogin: firebase.database.ServerValue.TIMESTAMP,
                    emailVerified: false,
                });
            });
        })
        .then(() => {
            // Log user out until they verify
            return auth.signOut();
        })
        .then(() => {
            displayMessage(
                "signup-message",
                "Verification email sent! Please check your inbox and verify before logging in.",
                false
            );
        })
        .catch((error) => {
            GlobalIsLogined = false;
            hideLoading("signup");
            displayAuthError(error, "signup-message");
        });
}

// Logout function
function logout() {
    if (document.getElementById("logout-button")) showLoading("logout");

    auth.signOut()
        .then(() => {
            GlobalIsLogined = false;
            if (window.google?.accounts?.id) {
                google.accounts.id.disableAutoSelect();
            }
            window.location.href = "../Shared file system/signin_firebase.html";
        })
        .catch((error) => {
            if (document.getElementById("logout-button")) hideLoading("logout");
            console.error("Logout error:", error);
        });
}

// ================= UI MANAGEMENT ================= //

// Update auth nav link
function updateAuthNavLink(user) {
    if (!authNavLink || !loginStatusText) return;

    if (user) {
        loginStatusText.textContent = user.displayName || user.email.split("@")[0];
        if (userStatue) userStatue.textContent = user.displayName || user.email.split("@")[0];
        authNavLink.href = "javascript:void(0)";
        authNavLink.onclick = (e) => {
            e.preventDefault();
            window.location.href = "../Shared file system/dashboard.html";
        };
    } else {
        loginStatusText.textContent = "Login";
        if (userStatue) userStatue.textContent = "";
        authNavLink.href = "../Shared file system/signin_firebase.html";
        authNavLink.onclick = null;
    }
}

// Show/hide forms (for signin_firebase.html)
function showLogin() {
    if (!loginForm) return;
    hideAllForms();
    loginForm.style.display = "block";
    setTimeout(() => loginForm.classList.add("active"), 10);
    clearMessages();
}

function showSignup() {
    if (!signupForm) return;
    hideAllForms();
    signupForm.style.display = "block";
    setTimeout(() => signupForm.classList.add("active"), 10);
    clearMessages();
}

function showDashboard(user) {
    if (!userDashboard) return;
    hideAllForms();
    userDashboard.style.display = "block";
    setTimeout(() => userDashboard.classList.add("active"), 10);

    const userNameElement = document.getElementById("user-name");
    const userEmailElement = document.getElementById("user-email");
    const lastLoginElement = document.getElementById("last-login");
    const userPicElement = document.getElementById("user-pic");

    if (userNameElement) userNameElement.textContent = user.displayName || "User";
    if (userEmailElement) userEmailElement.textContent = user.email;

    if (user.metadata?.lastSignInTime && lastLoginElement) {
        const lastLogin = new Date(user.metadata.lastSignInTime);
        lastLoginElement.textContent = lastLogin.toLocaleDateString() + ' at ' + lastLogin.toLocaleTimeString();
    }

    if (userPicElement) {
        userPicElement.src = user.photoURL || "";
        userPicElement.style.display = user.photoURL ? "block" : "none";
    }
    clearMessages();
}

function hideAllForms() {
    [loginForm, signupForm, userDashboard].forEach(form => {
        if (form) {
            form.classList.remove("active");
            form.style.display = "none";
        }
    });
}

function clearMessages() {
    const loginMsg = document.getElementById("login-message");
    const signupMsg = document.getElementById("signup-message");

    if (loginMsg) loginMsg.style.display = "none";
    if (signupMsg) signupMsg.style.display = "none";
}

// Loading states
function showLoading(context) {
    const button = document.getElementById(`${context}-button`);
    const text = document.getElementById(`${context}-text`);
    const spinner = document.getElementById(`${context}-spinner`);

    if (button && text && spinner) {
        button.disabled = true;
        text.style.display = "none";
        spinner.style.display = "block";
    }
}

function hideLoading(context) {
    const button = document.getElementById(`${context}-button`);
    const text = document.getElementById(`${context}-text`);
    const spinner = document.getElementById(`${context}-spinner`);

    if (button && text && spinner) {
        button.disabled = false;
        text.style.display = "inline";
        spinner.style.display = "none";
    }
}

// ================= UTILITY FUNCTIONS ================= //

// Redirect after login
function redirectAfterLogin() {
    setTimeout(() => {
        if (window.location.pathname.includes('signin_firebase.html')) {
            window.location.href = "../index.html";
        }
    }, GlobTime);
}

// Display auth error
function displayAuthError(error, elementId = "login-message") {
    let errorMessage;
    switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
            errorMessage = "Invalid email or password";
            break;
        case "auth/email-already-in-use":
            errorMessage = "Email already in use";
            break;
        case "auth/too-many-requests":
            errorMessage = "Too many attempts. Try again later.";
            break;
        case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters";
            break;
        default:
            errorMessage = "Authentication failed. Please try again. " + error.message;
    }
    displayMessage(elementId, errorMessage, true);
}

// Password toggle
function togglePasswordVisibility(inputId, element) {
    const input = document.getElementById(inputId);
    if (!input || !element) return;
    if (input.type === "password") {
        input.type = "text";
        element.innerHTML = '<i class="far fa-eye-slash"></i>';
    } else {
        input.type = "password";
        element.innerHTML = '<i class="far fa-eye"></i>';
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthMeter = document.getElementById("password-strength-meter");
    if (!strengthMeter) return;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    strengthMeter.className = "strength-meter";
    if (password.length === 0) {
        strengthMeter.style.width = "0";
    } else if (strength <= 2) {
        strengthMeter.classList.add("strength-weak");
    } else if (strength <= 4) {
        strengthMeter.classList.add("strength-medium");
    } else {
        strengthMeter.classList.add("strength-strong");
    }
}

// ================= DATABASE FUNCTIONS ================= //

// Track user session
function trackSession(user) {
    const sessionData = {
        uid: user.uid,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        userAgent: navigator.userAgent,
        ip: "0.0.0.0" // Placeholder
    };

    database.ref("sessions/" + user.uid).push(sessionData)
        .catch(error => console.error("Session tracking error:", error));
}

// Log login activity
function logLoginActivity(uid, method) {
    const loginData = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        method: method,
        ip: "0.0.0.0" // Placeholder
    };

    database.ref("loginActivity/" + uid).push(loginData)
        .catch(error => console.error("Login activity error:", error));
}

// Update last login time
function updateLastLogin(uid) {
    database.ref("users/" + uid + "/lastLogin")
        .set(firebase.database.ServerValue.TIMESTAMP)
        .catch(error => console.error("Error updating last login:", error));
}

// ================= AUTH STATE LISTENER ================= //

auth.onAuthStateChanged((user) => {
    GlobalIsLogined = !!user;
    updateAuthNavLink(user);

    // Block unverified users
    if (user && !user.emailVerified) {
        auth.signOut();
        if (window.location.pathname.includes('index.html')) {
            window.location.href = "signin_firebase.html";
        }
    }

    // Show dashboard on signin_firebase.html if logged in
    if (window.location.pathname.includes('signin_firebase.html')) {
        if (user) {
            showDashboard(user);
            redirectAfterLogin();
        } else {
            showLogin();
        }
    }
});

// ================= INITIALIZE APP ================= //

function initApp() {
    // Password toggles
    const toggleLoginPass = document.getElementById("toggleLoginPassword");
    const toggleSignupPass = document.getElementById("toggleSignupPassword");
    const signupPasswordInput = document.getElementById("signup-password");

    if (toggleLoginPass) {
        toggleLoginPass.addEventListener("click", function() {
            togglePasswordVisibility("login-password", this);
        });
    }
    if (toggleSignupPass) {
        toggleSignupPass.addEventListener("click", function() {
            togglePasswordVisibility("signup-password", this);
        });
    }
    if (signupPasswordInput) {
        signupPasswordInput.addEventListener("input", function() {
            checkPasswordStrength(this.value);
        });
    }

    // Initialize Google Auth
    const checkGoogleApiLoad = setInterval(() => {
        if (window.google?.accounts?.id) {
            clearInterval(checkGoogleApiLoad);
            initializeGoogleAuth();
        }
    }, 100);

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener("click", function() {
            document.body.classList.toggle("light-mode");
            const icon = this.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-moon");
                icon.classList.toggle("fa-sun");
            }
        });
    }

    // Login/Signup buttons
    if (document.getElementById("login-button")) {
        document.getElementById("login-button").addEventListener("click", login);
    }
    if (document.getElementById("signup-button")) {
        document.getElementById("signup-button").addEventListener("click", signup);
    }
    if (document.getElementById("logout-button")) {
        document.getElementById("logout-button").addEventListener("click", function() {
            const userConfirmedLogout = confirm("Are you sure you want to logout?");
            if (userConfirmedLogout) {
                logout();
            }
        });
    }

    // Switch between login/signup forms
    const switchFormToSignup = document.querySelector(".switch-form a[onclick='showSignup()']");
    const switchFormToLogin = document.querySelector(".switch-form a[onclick='showLogin()']");

    if (switchFormToSignup) {
        switchFormToSignup.onclick = showSignup;
    }
    if (switchFormToLogin) {
        switchFormToLogin.onclick = showLogin;
    }
}

// Start the app
document.addEventListener("DOMContentLoaded", initApp);