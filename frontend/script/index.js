function togglePassword() {  
  let password = document.getElementById("password");
  if (password.type === "password") {
    password.type = "text";   
  } else {
    password.type = "password"; 
  }
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
      text: "Please enter both username/email and password"
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

  try {
    // Prepare login data
    const loginData = {
      username: usernameOrEmail,
      email: usernameOrEmail, // Support both username and email login
      password: password
    };

    // Make API call using the new api service
    const response = await api.loginUser(loginData);

    console.log('Login response:', response); // Debug log

    if (response.success || response.message === 'Login successful') {
      // Store user info in localStorage
      localStorage.setItem('role', response.role || response.user?.role);
      localStorage.setItem('username', response.username || response.user?.username);
      localStorage.setItem('userId', response.userId || response.user?.id);

      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }

      const userRole = response.role || response.user?.role;
    
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: userRole === 'admin' ? "Redirecting to Admin Dashboard..." : "Redirecting to your Complaint Form...",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        // Clear form
        document.getElementById('login-username').value = '';
        document.getElementById('password').value = '';
        
        // Redirect based on role
        if (userRole === 'admin') {
          window.location.href = "admindashboard.html";
        } else {
          window.location.href = "complaintform.html";
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Login Failed",
        text: response.error || response.message || "Invalid credentials. Please check your username/email and password.",
        showConfirmButton: true
      });
    }
  } catch (error) {
    console.error('Login error:', error); // Debug log
    
    let errorMessage = "Could not connect to server. Please check your internet connection and try again.";
    
    // Handle specific error messages
    if (error.message.includes('401')) {
      errorMessage = "Invalid username/email or password.";
    } else if (error.message.includes('429')) {
      errorMessage = "Too many login attempts. Please try again later.";
    } else if (error.message.includes('500')) {
      errorMessage = "Server error. Please try again later.";
    }

    Swal.fire({
      icon: "error",
      title: "Login Error",
      text: errorMessage
    });
  }
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

  // Add Enter key support for login
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.id === 'login-username' || activeElement.id === 'password')) {
        e.preventDefault();
        loginSuccess();
      }
    }
  });
});

// Optional: Check if user is already logged in
function checkLoginStatus() {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  
  if (role && username) {
    // User is already logged in, redirect to appropriate page
    if (role === 'admin') {
      window.location.href = 'admindashboard.html';
    } else {
      window.location.href = 'complaintform.html';
    }
  }
}

checkLoginStatus();

//   // Make API call using config
//   fetch(getApiUrl('LOGIN'), {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ username, password })
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log('Login response:', data); // Debug log

//     if (data.success) {
//       localStorage.setItem('role', data.role);
//       localStorage.setItem('username', data.username);
//       Swal.fire({
//         icon: "success",
//         title: "Login Successful",
//         text: data.role === 'admin' ? "Redirecting to Admin Dashboard..." : "Redirecting to your Complaint Form...",
//         timer: 2000,
//         showConfirmButton: false
//       }).then(() => {
//         if (data.role === 'admin') {
//           window.location.href = "admindashboard.html";
//         } else {
//           window.location.href = "complaintform.html";
//         }
//       });
//     } else {
//       Swal.fire({
//         icon: "warning",
//         title: "Login Failed",
//         text: "Invalid username or password. Please check your credentials and try again.",
//         showConfirmButton: true
//       });
//     }
//   })
//   .catch(error => {
//     console.error('Login error:', error); // Debug log
//     Swal.fire({
//       icon: "error",
//       title: "Connection Error",
//       text: "Could not connect to server. Please check your internet connection and try again."
//     });
//   });
// }

// // Handle login form submit
// document.addEventListener('DOMContentLoaded', function() {
//   const loginForm = document.querySelector('form');
//   if (loginForm) {
//     loginForm.addEventListener('submit', function(e) {
//       e.preventDefault();
//       loginSuccess();
//     });
//   }
// });