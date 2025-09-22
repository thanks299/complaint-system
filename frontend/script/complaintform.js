function submitComplaint() {
  const name = document.getElementById('name').value;
  const matric = document.getElementById('matric').value;
  const email = document.getElementById('email').value;
  const department = document.getElementById('department').value;
  const title = document.getElementById('title').value;
  const details = document.getElementById('details').value;

  if (!name || !matric || !email || !department || !title || !details) {
    swal("Error", "Please fill in all fields", "error");
    return;
  }

  // Show loading
  swal("Submitting complaint...", {
    buttons: false,
    timer: 2000,
  });

  // Make API call to Render backend
  fetch(getApiUrl('SUBMIT_COMPLAINT'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, matric, email, department, title, details })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message && data.message.includes('successfully')) {
      swal("Success!", "Complaint submitted successfully!", "success").then(() => {
        // Clear form
        document.getElementById('complaintForm').reset();
      });
    } else {
      swal("Error", data.error || "Failed to submit complaint", "error");
    }
  })
  .catch(error => {
    console.error('Complaint submission error:', error);
    swal("Error", "Could not connect to server. Please try again.", "error");
  });
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const complaintForm = document.getElementById('complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitComplaint();
    });
  }
});