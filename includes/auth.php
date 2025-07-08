<?php
// includes/auth.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is authenticated
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: auth/login.php');
        exit;
    }
}

// Get current user ID
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Get current username
function getCurrentUsername() {
    return $_SESSION['username'] ?? null;
}

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Logout function
function logout() {
    session_destroy();
    header('Location: auth/login.php');
    exit;
}
?> 