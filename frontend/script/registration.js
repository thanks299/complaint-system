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

function handleRoleChange() {
  const role = document.getElementById('role').value;
  const studentFields = document.getElementById('studentFields');
  const firstnameInput = document.getElementById('firstname');
  const lastnameInput = document.getElementById('lastname');
  const regnoInput = document.getElementById('regno');
  
  if (role === 'admin') {
    // Hide student-specific fields for admin
    studentFields.style.display = 'none';
    // Remove required attribute from student fields
    firstnameInput.removeAttribute('required');
    lastnameInput.removeAttribute('required');
    regnoInput.removeAttribute('required');
  } else if (role === 'student') {
    // Show student-specific fields
    studentFields.style.display = 'block';
    // Add required attribute to student fields
    firstnameInput.setAttribute('required', 'required');
    lastnameInput.setAttribute('required', 'required');
    regnoInput.setAttribute('required', 'required');
  } else {
    // Default: show student fields
    studentFields.style.display = 'block';
  }
}

function validateForm() {
  const role = document.getElementById('role').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Reset error displays
  document.querySelectorAll('.error').forEach(error => error.style.display = 'none');

  let isValid = true;
  let errorMessage = '';

  // Validate role
  if (!role) {
    errorMessage = 'Please select your role';
    isValid = false;
  }
  // Validate student-specific fields
  else if (role === 'student') {
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const regno = document.getElementById('regno').value.trim();

    if (!firstname) {
      errorMessage = 'First name is required';
      isValid = false;
    } else if (!lastname) {
      errorMessage = 'Last name is required';
      isValid = false;
    } else if (!regno) {
      errorMessage = 'Registration number is required';
      isValid = false;
    }
  }
  
  // Validate common fields
  if (isValid && !username) {
    errorMessage = 'Username is required';
    isValid = false;
  } else if (isValid && !email) {
    errorMessage = 'Email is required';
    isValid = false;
  } else if (isValid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage = 'Please enter a valid email address';
    isValid = false;
  } else if (isValid && !password) {
    errorMessage = 'Password is required';
    isValid = false;
  } else if (isValid && password.length < 6) {
    errorMessage = 'Password must be at least 6 characters long';
    isValid = false;
  } else if (isValid && password !== confirmPassword) {
    errorMessage = 'Passwords do not match';
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

  const role = document.getElementById('role').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let formData = {
    username,
    email,
    password,
    role
  };

  let apiEndpoint;
  let redirectPage;

  // Determine API endpoint and redirect page based on role
  if (role === 'student') {
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const regno = document.getElementById('regno').value.trim();
    
    formData.firstname = firstname;
    formData.lastname = lastname;
    formData.regno = regno;
    
    apiEndpoint = getApiUrl('REGISTER');
    redirectPage = 'complaintform.html';
  } else if (role === 'admin') {
    apiEndpoint = getApiUrl('ADMIN_REGISTER');
    redirectPage = 'admindashboard.html';
  }

  // Show loading
  Swal.fire({
    title: 'Registering...',
    text: `Please wait while we create your ${role} account`,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Make API call
  fetch(apiEndpoint, {
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
    console.log('Registration response:', data);

    if (data.message && data.message.includes('successfully')) {
      // Store user info in localStorage
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: `Your ${role} account has been created successfully. Redirecting...`,
        timer: 3000,
        showConfirmButton: false
      }).then(() => {
        // Clear form
        document.getElementById('registerationForm').reset();
        handleRoleChange(); // Reset field visibility
        
        // Redirect based on role
        window.location.href = redirectPage;
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
    console.error('Registration error:', error);
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
      e.preventDefault();
      userRegistration();
    });
  }

  // Hide error messages initially
  document.querySelectorAll('.error').forEach(error => {
    error.style.display = 'none';
  });

  // Initialize form state
  handleRoleChange();
});