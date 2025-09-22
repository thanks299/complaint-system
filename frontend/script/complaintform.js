function validateComplaintForm() {
  const name = document.getElementById('name').value.trim();
  const matric = document.getElementById('matric').value.trim();
  const email = document.getElementById('email').value.trim();
  const department = document.getElementById('department').value.trim();
  const title = document.getElementById('title').value.trim();
  const details = document.getElementById('details').value.trim();

  let errorMessage = '';

  if (!name) {
    errorMessage = 'Name is required';
  } else if (!matric) {
    errorMessage = 'Matric number is required';
  } else if (!email) {
    errorMessage = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage = 'Please enter a valid email address';
  } else if (!department) {
    errorMessage = 'Department is required';
  } else if (!title) {
    errorMessage = 'Complaint title is required';
  } else if (!details) {
    errorMessage = 'Complaint details are required';
  } else if (details.length < 10) {
    errorMessage = 'Please provide more details (at least 10 characters)';
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

function submitComplaint() {
  if (!validateComplaintForm()) {
    return;
  }

  const complaintData = {
    name: document.getElementById('name').value.trim(),
    matric: document.getElementById('matric').value.trim(),
    email: document.getElementById('email').value.trim(),
    department: document.getElementById('department').value.trim(),
    title: document.getElementById('title').value.trim(),
    details: document.getElementById('details').value.trim()
  };

  // Show loading
  Swal.fire({
    title: 'Submitting Complaint...',
    text: 'Please wait while we process your complaint',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Make API call
  fetch(getApiUrl('SUBMIT_COMPLAINT'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(complaintData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Complaint submission response:', data); // Debug log

    if (data.message && data.message.includes('successfully')) {
      Swal.fire({
        icon: 'success',
        title: 'Complaint Submitted!',
        text: 'Your complaint has been submitted successfully. We will review it soon.',
        timer: 3000,
        showConfirmButton: false
      }).then(() => {
        // Clear form
        document.getElementById('complaintForm').reset();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: data.error || 'Failed to submit complaint. Please try again.'
      });
    }
  })
  .catch(error => {
    console.error('Complaint submission error:', error); // Debug log
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to server. Please check your internet connection and try again.'
    });
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