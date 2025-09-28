// Error message constants
const ERROR_MESSAGES = {
  MISSING_FIELDS: "Please enter both username/email and password",
  INVALID_CREDENTIALS: "Invalid username/email or password. Register first",
  TOO_MANY_ATTEMPTS: "Too many login attempts. Please try again later.",
  SERVER_ERROR: "Server error. Please try again later.",
  CONNECTION_ERROR: "Could not connect to server. Please check your internet connection and try again."
};

function togglePassword() {  
  let password = document.getElementById("password");
  if (password.type === "password") {
    password.type = "text";   
  } else {
    password.type = "password"; 
  }
}

// Enhanced error handling wrapper
function withErrorHandling(asyncFunction) {
  return async function(...args) {
    try {
      return await asyncFunction.apply(this, args);
    } catch (error) {
      console.error('Error in', asyncFunction.name, ':', error);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Something went wrong. Please refresh the page and try again."
      });
    }
  };
}

// SweetAlert success popup and login logic
async function loginSuccess() {
  // Get username/email and password from form
  const usernameOrEmail = document.getElementById('login-username').value.trim();
  const password = document.getElementById('password').value;

  // Validate input
  if (!usernameOrEmail || !password) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      text: ERROR_MESSAGES.MISSING_FIELDS
    }).then(() => {
      // Redirect to registration page after alert is closed
      window.location.href = "register.html";
    });
    return;
  }

  // Show loading with better UX
  const loadingSwal = Swal.fire({
    title: "Signing you in...",
    text: "Please wait while we verify your credentials",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // ✅ FIXED: Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
  
    const loginData = {
    [isEmail ? 'email' : 'username']: usernameOrEmail, // Send only the relevant field
    password: password
  };
  
  console.log('Sending login data:', { 
    ...loginData, 
    password: '[HIDDEN]',
    loginType: isEmail ? 'email' : 'username'
  });

  // Make API call using the new api service
  const response = await api.loginUser(loginData);
    
  console.log('Login response:', response); // Debug log

    // Enhanced response checking
    const isSuccess = response.success || 
                     response.message === 'Login successful' ||
                     response.status === 'success' ||
                     (response.user && response.token);

    if (isSuccess) {
      // Store user info in localStorage with better data handling
      const userRole = response.role || response.user?.role || 'student';
      const username = response.username || response.user?.username || usernameOrEmail;
      const userId = response.userId || response.user?.id;

      localStorage.setItem('role', userRole);
      localStorage.setItem('username', username);
      
      if (userId) localStorage.setItem('userId', userId);
      if (response.token) localStorage.setItem('authToken', response.token);

      // Close loading and show success
      loadingSwal.close();
      
      Swal.fire({
        icon: "success",
        title: "Welcome back!",
        text: userRole === 'admin' ? "Redirecting to Admin Dashboard..." : "Redirecting to Complaint Form...",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      }).then(() => {
        // Clear form
        clearLoginForm();
        
        // Redirect based on role
        const redirectPage = userRole === 'admin' ? "admindashboard.html" : "complaintform.html";
        window.location.href = redirectPage;
      });
    } else {
      loadingSwal.close();
      Swal.fire({
        icon: "warning",
        title: "Login Failed",
        text: response.error || response.message || ERROR_MESSAGES.INVALID_CREDENTIALS,
        showConfirmButton: true
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    loadingSwal.close();
    
    let errorMessage = ERROR_MESSAGES.CONNECTION_ERROR;
    
    // Handle specific error messages
    if (error.message.includes('401')) {
      errorMessage = ERROR_MESSAGES.INVALID_CREDENTIALS;
    } else if (error.message.includes('429')) {
      errorMessage = ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
    } else if (error.message.includes('500')) {
      errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    }
    
    Swal.fire({
      icon: "error",
      title: "Login Error",
      text: errorMessage
    });
  }
}

// Utility function to clear login form
function clearLoginForm() {
  const usernameField = document.getElementById('login-username');
  const passwordField = document.getElementById('password');
  
  if (usernameField) usernameField.value = '';
  if (passwordField) passwordField.value = '';
}

// Enhanced login form handling
function setupLoginForm() {
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      loginSuccess();
    });
  }

  // Add Enter key support for better UX
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.id === 'login-username' || activeElement.id === 'password')) {
        e.preventDefault();
        loginSuccess();
      }
    }
  });
}

// Enhanced login status check
function checkLoginStatus() {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  
  if (role && username) {
    // User is already logged in, show confirmation before redirect
    Swal.fire({
      title: 'Already Logged In',
      text: `You're already logged in as ${username}. Redirect to your dashboard?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, go to dashboard',
      cancelButtonText: 'Stay here'
    }).then((result) => {
      if (result.isConfirmed) {
        const redirectPage = role === 'admin' ? 'admindashboard.html' : 'complaintform.html';
        window.location.href = redirectPage;
      }
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupLoginForm();
  
  // Only check login status if user wants auto-redirect
  // checkLoginStatus(); // Uncomment if you want auto-redirect behavior
});

// Enhanced logout function
function logout() {
  Swal.fire({
    title: 'Logout',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, logout'
  }).then((result) => {
    if (result.isConfirmed) {
      api.logout(false);
    }
  });
}

// Export functions for use in other files if needed
window.loginHelpers = {
  clearLoginForm,
  checkLoginStatus,
  logout
};