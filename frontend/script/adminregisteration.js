function togglePassword() {
  const passwordField = document.getElementById('password');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
  } else {
    passwordField.type = 'password';
  }
}

function validateAdminForm() {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let errorMessage = '';

  if (!username) {
    errorMessage = 'Username is required';
  } else if (!email) {
    errorMessage = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage = 'Please enter a valid email address';
  } else if (!password) {
    errorMessage = 'Password is required';
  } else if (password.length < 6) {
    errorMessage = 'Password must be at least 6 characters long';
  }

  if (errorMessage) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: errorMessage
    });
    return false;
  }

  return true;
}

function adminRegistration() {
  if (!validateAdminForm()) {
    return;
  }

  const adminData = {
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };

  // Show loading
  Swal.fire({
    title: 'Registering Admin...',
    text: 'Please wait while we create the admin account',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Make API call
  fetch(getApiUrl('ADMIN_REGISTER'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Admin registration response:', data); // Debug log

    if (data.message && data.message.includes('successfully')) {
      Swal.fire({
        icon: 'success',
        title: 'Admin Registered!',
        text: 'Admin account created successfully. You can now login.',
        timer: 3000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: data.error || 'Admin registration failed. Please try again.'
      });
    }
  })
  .catch(error => {
    console.error('Admin registration error:', error); // Debug log
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to server. Please check your internet connection and try again.'
    });
  });
}

// Load complaints for admin dashboard
function loadComplaints() {
  fetch(getApiUrl('COMPLAINTS'))
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(complaints => {
    const complaintsContainer = document.getElementById('complaintsContainer');
    if (complaintsContainer) {
      if (complaints && complaints.length > 0) {
        complaintsContainer.innerHTML = complaints.map(complaint => `
          <div class="complaint-card">
            <h3>${complaint.title}</h3>
            <p><strong>Name:</strong> ${complaint.name}</p>
            <p><strong>Matric:</strong> ${complaint.matric}</p>
            <p><strong>Email:</strong> ${complaint.email}</p>
            <p><strong>Department:</strong> ${complaint.department}</p>
            <p><strong>Details:</strong> ${complaint.details}</p>
            <p><strong>Status:</strong> <span class="status ${complaint.status}">${complaint.status}</span></p>
            <p><strong>Date:</strong> ${new Date(complaint.created_at).toLocaleDateString()}</p>
          </div>
        `).join('');
      } else {
        complaintsContainer.innerHTML = '<p class="no-complaints">No complaints found.</p>';
      }
    }
  })
  .catch(error => {
    console.error('Error loading complaints:', error);
    const complaintsContainer = document.getElementById('complaintsContainer');
    if (complaintsContainer) {
      complaintsContainer.innerHTML = '<p class="error">Failed to load complaints. Please try again.</p>';
    }
  });
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  const adminRegisterForm = document.getElementById('adminRegistrationForm');
  if (adminRegisterForm) {
    adminRegisterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      adminRegistration();
    });
  }

  // Load complaints if on admin dashboard
  if (window.location.pathname.includes('admindashboard')) {
    loadComplaints();
  }
});