function adminRegisteration() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!username || !email || !password) {
    swal("Error", "Please fill in all fields", "error");
    return;
  }

  // Show loading
  swal("Registering admin...", {
    buttons: false,
    timer: 2000,
  });

  // Make API call to Render backend
  fetch(getApiUrl('ADMIN_REGISTER'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message && data.message.includes('successfully')) {
      swal("Success!", "Admin registered successfully! Please login.", "success").then(() => {
        window.location.href = 'index.html';
      });
    } else {
      swal("Error", data.error || "Admin registration failed", "error");
    }
  })
  .catch(error => {
    console.error('Admin registration error:', error);
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

// Load complaints for admin dashboard
function loadComplaints() {
  fetch(getApiUrl('COMPLAINTS'))
  .then(response => response.json())
  .then(complaints => {
    const complaintsContainer = document.getElementById('complaintsContainer');
    if (complaintsContainer && complaints.length > 0) {
      complaintsContainer.innerHTML = complaints.map(complaint => `
        <div class="complaint-card">
          <h3>${complaint.title}</h3>
          <p><strong>Name:</strong> ${complaint.name}</p>
          <p><strong>Matric:</strong> ${complaint.matric}</p>
          <p><strong>Department:</strong> ${complaint.department}</p>
          <p><strong>Details:</strong> ${complaint.details}</p>
          <p><strong>Status:</strong> ${complaint.status}</p>
          <p><strong>Date:</strong> ${new Date(complaint.created_at).toLocaleDateString()}</p>
        </div>
      `).join('');
    }
  })
  .catch(error => {
    console.error('Error loading complaints:', error);
  });
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  const adminRegisterForm = document.getElementById('adminRegisterForm');
  if (adminRegisterForm) {
    adminRegisterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      adminRegisteration();
    });
  }

  // Load complaints if on admin dashboard
  if (window.location.pathname.includes('admindashboard')) {
    loadComplaints();
  }
});