function userRegisteration() {
  const firstname = document.getElementById('firstname').value;
  const lastname = document.getElementById('lastname').value;
  const regno = document.getElementById('regno').value;
  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!firstname || !lastname || !regno || !email || !username || !password) {
    swal("Error", "Please fill in all fields", "error");
    return;
  }

  // Show loading
  swal("Registering...", {
    buttons: false,
    timer: 2000,
  });

  // Make API call to Render backend
  fetch(getApiUrl('REGISTER'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firstname, lastname, regno, email, username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message && data.message.includes('successfully')) {
      swal("Success!", "Registration successful! Please login.", "success").then(() => {
        window.location.href = 'index.html';
      });
    } else {
      swal("Error", data.error || "Registration failed", "error");
    }
  })
  .catch(error => {
    console.error('Registration error:', error);
    swal("Error", "Could not connect to server. Please try again.", "error");
  });
}

function togglePassword() {
  const passwordField = document.getElementById('password');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
  } else {
    passwordField.type = 'password';
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      userRegisteration();
    });
  }
});