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
  // Get username and password from backend
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('password').value;
  fetch("http://localhost:3001/api/login", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
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
        title: "Not Registered",
        text: "You are not registered. Please register first.",
        showConfirmButton: true
      }).then(() => {
        window.location.href = "registeration.html";
      });
    }
  })
  .catch(() => {
    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: "Could not connect to server. Try again."
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