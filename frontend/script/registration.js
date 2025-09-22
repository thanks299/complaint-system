function togglePassword() {
  const passwordField = document.getElementById('password');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
  } else {
    passwordField.type = 'password';
  }
}

function toggleConfirmPassword() {
  const confirmPasswordField = document.getElementById('confirmPassword');
  if (confirmPasswordField) {
    if (confirmPasswordField.type === 'password') {
      confirmPasswordField.type = 'text';
    } else {
      confirmPasswordField.type = 'password';
    }
  }
}

function validateForm() {
  const firstname = document.getElementById('firstname').value.trim();
  const lastname = document.getElementById('lastname').value.trim();
  const regno = document.getElementById('regno').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Reset error displays
  document.querySelectorAll('.error').forEach(error => error.style.display = 'none');

  let isValid = true;
  let errorMessage = '';

  // Validate firstname
  if (!firstname) {
    errorMessage = 'First name is required';
    isValid = false;
  }
  // Validate lastname
  else if (!lastname) {
    errorMessage = 'Last name is required';
    isValid = false;
  }
  // Validate regno
  else if (!regno) {
    errorMessage = 'Registration number is required';
    isValid = false;
  }
  // Validate username
  else if (!username) {
    errorMessage = 'Username is required';
    isValid = false;
  }
  // Validate email
  else if (!email) {
    errorMessage = 'Email is required';
    isValid = false;
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage = 'Please enter a valid email address';
    isValid = false;
  }
  // Validate password
  else if (!password) {
    errorMessage = 'Password is required';
    isValid = false;
  }
  else if (password.length < 6) {
    errorMessage = 'Password must be at least 6 characters long';
    isValid = false;
  }

  if (!isValid) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: errorMessage
    });
  }

  return isValid;
}

function userRegistration() {
  if (!validateForm()) {
    return;
  }

  const formData = {
    firstname: document.getElementById('firstname').value.trim(),
    lastname: document.getElementById('lastname').value.trim(),
    regno: document.getElementById('regno').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };

  // Show loading
  Swal.fire({
    title: 'Registering...',
    text: 'Please wait while we create your account',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Use the config function to get the API URL
  fetch(getApiUrl('REGISTER'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Registration response:', data); // Debug log

    if (data.message && data.message.includes('successfully')) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Your account has been created successfully. You can now login.',
        timer: 3000,
        showConfirmButton: false
      }).then(() => {
        // Clear form
        document.getElementById('registerationForm').reset();
        // Redirect to login
        window.location.href = 'index.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: data.error || 'Registration failed. Please try again.'
      });
    }
  })
  .catch(error => {
    console.error('Registration error:', error); // Debug log
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to server. Please check your internet connection and try again.'
    });
  });
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = document.getElementById('registerationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent default form submission
      userRegistration();
    });
  }

  // Hide error messages initially
  document.querySelectorAll('.error').forEach(error => {
    error.style.display = 'none';
  });
});