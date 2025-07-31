// identityManager.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, setPersistence, browserLocalPersistence, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase app and auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set session persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting persistence:", error.message);
});

/**
 * Sets up a listener to detect login/logout events.
 * Ensures it is called after Firebase processes the redirect result.
 */
export function setupAuthListener(onLogin, onLogout) {
    console.log("Setting up auth state listener...");
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Auth state changed: User is authenticated:", user);
            onLogin(user);
        } else {
            console.log("Auth state changed: No authenticated user found.");
            onLogout();
        }
    });
}

/**
 * Initiates a Google login redirect.
 */
export async function login() {
    try {
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Login redirect failed:", error.message);
    }
}

/**
 * Handles the redirect result after returning from the Google-managed page.
 * Resolves the user if the redirect result is valid.
 */
export async function handleRedirectResult() {
    try {
        console.log("Handling redirect result...");
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            console.log("Redirect login successful:", result.user);
            return result.user; // Return the authenticated user
        } else {
            console.log("No user found in redirect result.");
        }
    } catch (error) {
        console.error("Error handling redirect result:", error.message);
    }
    return null; // No user found
}

/**
 * Signs out the currently logged-in user.
 */
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

/**
 * Returns the currently authenticated user (or null).
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Displays a login button for Google authentication.
 */
export function showLogin() {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'login-container';

    const btn = document.createElement('button');
    btn.textContent = 'Login with Google';
    btn.className = 'google-login-btn';
    btn.addEventListener('click', async () => {
        await signInWithPopup(auth, provider);
        window.location.reload();
    });

    container.appendChild(btn);
    document.body.appendChild(container);
}