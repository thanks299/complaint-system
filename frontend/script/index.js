function togglePassword() {  
  let password = document.getElementById("password");
  if (password.type === "password") {
    password.type = "text";   
  } else {
    password.type = "password"; 
  }
}

// SweetAlert success popup and login logic
function loginSuccess() {
  // Get username and password from form
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('password').value;

  // Validate input
  if (!username || !password) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      text: "Please enter both username and password"
    });
    return;
  }

  // Show loading
  Swal.fire({
    title: "Logging in...",
    text: "Please wait while we verify your credentials",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Make API call using config
  fetch(getApiUrl('LOGIN'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Login response:', data); // Debug log

    if (data.success) {
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: data.role === 'admin' ? "Redirecting to Admin Dashboard..." : "Redirecting to your Complaint Form...",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        if (data.role === 'admin') {
          window.location.href = "admindashboard.html";
        } else {
          window.location.href = "complaintform.html";
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Login Failed",
        text: "Invalid username or password. Please check your credentials and try again.",
        showConfirmButton: true
      });
    }
  })
  .catch(error => {
    console.error('Login error:', error); // Debug log
    Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "Could not connect to server. Please check your internet connection and try again."
    });
  });
}

// Handle login form submit
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      loginSuccess();
    });
  }
});