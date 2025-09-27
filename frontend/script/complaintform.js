// Configuration constants
const VALIDATION_CONFIG = {
  MIN_DETAILS_LENGTH: 10,
  MAX_TITLE_LENGTH: 200,
  MAX_DETAILS_LENGTH: 1000,
  MAX_NAME_LENGTH: 100
};

const ERROR_MESSAGES = {
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_LONG: `Name must be less than ${VALIDATION_CONFIG.MAX_NAME_LENGTH} characters`,
  MATRIC_REQUIRED: 'Matric number is required',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  DEPARTMENT_REQUIRED: 'Department is required',
  TITLE_REQUIRED: 'Complaint title is required',
  TITLE_TOO_LONG: `Title must be less than ${VALIDATION_CONFIG.MAX_TITLE_LENGTH} characters`,
  DETAILS_REQUIRED: 'Complaint details are required',
  DETAILS_TOO_SHORT: `Please provide more details (at least ${VALIDATION_CONFIG.MIN_DETAILS_LENGTH} characters)`,
  DETAILS_TOO_LONG: `Details must be less than ${VALIDATION_CONFIG.MAX_DETAILS_LENGTH} characters`,
  NOT_LOGGED_IN: 'Please login to submit a complaint',
  UNAUTHORIZED: 'You must be logged in as a student to submit complaints'
};

// Check if user is authenticated
function checkAuthentication() {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  
  if (!role || !username) {
    Swal.fire({
      icon: 'warning',
      title: 'Authentication Required',
      text: ERROR_MESSAGES.NOT_LOGGED_IN,
      confirmButtonText: 'Go to Login'
    }).then(() => {
      window.location.href = 'index.html';
    });
    return false;
  }
  
  if (role !== 'student') {
    Swal.fire({
      icon: 'error',
      title: 'Access Denied',
      text: ERROR_MESSAGES.UNAUTHORIZED,
      confirmButtonText: 'Go to Dashboard'
    }).then(() => {
      window.location.href = role === 'admin' ? 'admindashboard.html' : 'index.html';
    });
    return false;
  }
  
  return true;
}

// Enhanced form validation with real-time feedback
function validateComplaintForm() {
  const name = document.getElementById('name').value.trim();
  const matric = document.getElementById('matric').value.trim();
  const email = document.getElementById('email').value.trim();
  const department = document.getElementById('department').value.trim();
  const title = document.getElementById('title').value.trim();
  const details = document.getElementById('details').value.trim();

  // Clear previous errors
  clearAllFieldErrors();

  let isValid = true;

  // Validate name
  if (!name) {
    addFieldError('name', ERROR_MESSAGES.NAME_REQUIRED);
    isValid = false;
  } else if (name.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
    addFieldError('name', ERROR_MESSAGES.NAME_TOO_LONG);
    isValid = false;
  }

  // Validate matric number
  if (!matric) {
    addFieldError('matric', ERROR_MESSAGES.MATRIC_REQUIRED);
    isValid = false;
  }

  // Validate email
  if (!email) {
    addFieldError('email', ERROR_MESSAGES.EMAIL_REQUIRED);
    isValid = false;
  } else if (!isValidEmail(email)) {
    addFieldError('email', ERROR_MESSAGES.EMAIL_INVALID);
    isValid = false;
  }

  // Validate department
  if (!department) {
    addFieldError('department', ERROR_MESSAGES.DEPARTMENT_REQUIRED);
    isValid = false;
  }

  // Validate title
  if (!title) {
    addFieldError('title', ERROR_MESSAGES.TITLE_REQUIRED);
    isValid = false;
  } else if (title.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
    addFieldError('title', ERROR_MESSAGES.TITLE_TOO_LONG);
    isValid = false;
  }

  // Validate details
  if (!details) {
    addFieldError('details', ERROR_MESSAGES.DETAILS_REQUIRED);
    isValid = false;
  } else if (details.length < VALIDATION_CONFIG.MIN_DETAILS_LENGTH) {
    addFieldError('details', ERROR_MESSAGES.DETAILS_TOO_SHORT);
    isValid = false;
  } else if (details.length > VALIDATION_CONFIG.MAX_DETAILS_LENGTH) {
    addFieldError('details', ERROR_MESSAGES.DETAILS_TOO_LONG);
    isValid = false;
  }

  return isValid;
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced complaint submission using API service
async function submitComplaint() {
  // Check authentication first
  if (!checkAuthentication()) {
    return;
  }

  if (!validateComplaintForm()) {
    return;
  }

  const complaintData = {
    name: document.getElementById('name').value.trim(),
    matric: document.getElementById('matric').value.trim(),
    email: document.getElementById('email').value.trim(),
    department: document.getElementById('department').value.trim(),
    title: document.getElementById('title').value.trim(),
    details: document.getElementById('details').value.trim(),
    // Add user info from localStorage
    username: localStorage.getItem('username'),
    userId: localStorage.getItem('userId')
  };

  // Show enhanced loading
  const loadingSwal = Swal.fire({
    title: 'Submitting Your Complaint...',
    html: `
      <div class="submission-progress">
        <div class="progress-step active">
          <div class="step-icon">📝</div>
          <div class="step-text">Validating Information</div>
        </div>
        <div class="progress-step" id="step-submitting">
          <div class="step-icon">📤</div>
          <div class="step-text">Submitting Complaint</div>
        </div>
        <div class="progress-step" id="step-confirming">
          <div class="step-icon">✅</div>
          <div class="step-text">Confirming Submission</div>
        </div>
      </div>
      <p class="loading-tip">Please don't close this window...</p>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    console.log('Submitting complaint data:', { ...complaintData, email: '[HIDDEN]' });
    
    // Simulate progress steps
    setTimeout(() => {
      document.getElementById('step-submitting')?.classList.add('active');
    }, 1000);

    // Use the centralized API service
    const response = await api.createComplaint(complaintData);
    
    setTimeout(() => {
      document.getElementById('step-confirming')?.classList.add('active');
    }, 500);
    
    console.log('Complaint submission response:', response);

    // Enhanced response checking
    const isSuccess = response.success || 
                     response.message?.includes('successfully') || 
                     response.message?.includes('submitted') ||
                     response.status === 'success' ||
                     response.id; // If complaint has an ID, it was likely created

    loadingSwal.close();

    if (isSuccess) {
      // Show success with complaint details
      const complaintId = response.id || response.complaintId || 'N/A';
      
      Swal.fire({
        icon: 'success',
        title: '🎉 Complaint Submitted Successfully!',
        html: `
          <div class="success-details">
            <p><strong>Thank you for your submission!</strong></p>
            ${complaintId !== 'N/A' ? `<p>Complaint ID: <strong>#${complaintId}</strong></p>` : ''}
            <p>Your complaint "<em>${complaintData.title}</em>" has been received and is being processed.</p>
            
            <div class="next-steps">
              <h4>What happens next?</h4>
              <ul style="text-align: left; display: inline-block; margin: 0;">
                <li>Our team will review your complaint within 24 hours</li>
                <li>You'll receive email updates on the progress</li>
                <li>Check back here anytime to see the status</li>
              </ul>
            </div>
            
            <div class="contact-info" style="margin-top: 15px; font-size: 0.9em; color: #666;">
              <p>Need urgent assistance? Contact us at <strong>support@nacos.edu.ng</strong></p>
            </div>
          </div>
        `,
        confirmButtonText: 'Submit Another Complaint',
        cancelButtonText: 'Done',
        showCancelButton: true,
        timer: 10000,
        timerProgressBar: true
      }).then((result) => {
        // Clear form regardless of choice
        clearComplaintForm();
        
        if (result.dismiss === Swal.DismissReason.cancel) {
          // User clicked "Done" - could redirect somewhere
          // window.location.href = 'dashboard.html';
        }
        // If "Submit Another" (confirm), form is already cleared for new submission
      });
    } else {
      // Handle submission errors with specific feedback
      let errorMessage = 'Failed to submit complaint. Please try again.';
      
      if (response.error) {
        errorMessage = response.error;
        
        // Handle specific field errors
        if (response.error.includes('email')) {
          addFieldError('email', 'Email validation failed');
        } else if (response.error.includes('matric')) {
          addFieldError('matric', 'Matric number validation failed');
        }
      } else if (response.message && !response.message.includes('successfully')) {
        errorMessage = response.message;
      }
      
      console.error('Complaint submission failed:', response);
      
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: errorMessage,
        footer: 'Please check your information and try again.'
      });
    }
  } catch (error) {
    console.error('Complaint submission error:', error);
    loadingSwal.close();
    
    let errorMessage = 'Could not connect to server. Please check your internet connection and try again.';
    
    // Handle specific HTTP errors
    if (error.message.includes('400')) {
      errorMessage = 'Invalid complaint data. Please check your inputs.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please login again.';
      // Clear localStorage and redirect to login
      localStorage.clear();
      setTimeout(() => window.location.href = 'index.html', 2000);
    } else if (error.message.includes('403')) {
      errorMessage = 'You do not have permission to submit complaints.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Submission Error',
      html: `
        <p>${errorMessage}</p>
        <div class="error-actions" style="margin-top: 15px;">
          <button class="retry-btn" onclick="submitComplaint()" style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
          <button class="support-btn" onclick="window.open('mailto:support@nacos.edu.ng', '_blank')" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Contact Support</button>
        </div>
      `,
      showConfirmButton: false
    });
  }
}

// Clear complaint form
function clearComplaintForm() {
  const form = document.getElementById('complaintForm');
  if (form) {
    form.reset();
    clearAllFieldErrors();
    
    // Reset character counters if they exist
    updateCharacterCount('title');
    updateCharacterCount('details');
  }
}

// Character counter for text areas
function updateCharacterCount(fieldId) {
  const field = document.getElementById(fieldId);
  const counter = document.getElementById(`${fieldId}-counter`);
  
  if (field && counter) {
    const currentLength = field.value.length;
    const maxLength = fieldId === 'title' ? VALIDATION_CONFIG.MAX_TITLE_LENGTH : VALIDATION_CONFIG.MAX_DETAILS_LENGTH;
    
    counter.textContent = `${currentLength}/${maxLength}`;
    counter.style.color = currentLength > maxLength * 0.9 ? '#dc3545' : '#6c757d';
  }
}

// Field error management
function addFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('error');
  
  let errorElement = document.getElementById(`${fieldId}-error`);
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'field-error';
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '5px';
    field.parentNode.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field) field.classList.remove('error');
  if (errorElement) errorElement.style.display = 'none';
}

function clearAllFieldErrors() {
  document.querySelectorAll('.field-error').forEach(error => {
    error.style.display = 'none';
  });
  document.querySelectorAll('.error').forEach(field => {
    field.classList.remove('error');
  });
}

// Real-time validation setup
function setupRealTimeValidation() {
  const fields = ['name', 'matric', 'email', 'department', 'title', 'details'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Clear errors on input
      field.addEventListener('input', () => {
        clearFieldError(fieldId);
        
        // Update character count for text fields
        if (fieldId === 'title' || fieldId === 'details') {
          updateCharacterCount(fieldId);
        }
      });
      
      // Validate on blur
      field.addEventListener('blur', () => {
        validateSingleField(fieldId);
      });
    }
  });
}

// Single field validation
function validateSingleField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value.trim();
  let isValid = true;

  switch (fieldId) {
    case 'name':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.NAME_REQUIRED);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.NAME_TOO_LONG);
        isValid = false;
      }
      break;
      
    case 'matric':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.MATRIC_REQUIRED);
        isValid = false;
      }
      break;
      
    case 'email':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.EMAIL_REQUIRED);
        isValid = false;
      } else if (!isValidEmail(value)) {
        addFieldError(fieldId, ERROR_MESSAGES.EMAIL_INVALID);
        isValid = false;
      }
      break;
      
    case 'department':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.DEPARTMENT_REQUIRED);
        isValid = false;
      }
      break;
      
    case 'title':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.TITLE_REQUIRED);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.TITLE_TOO_LONG);
        isValid = false;
      }
      break;
      
    case 'details':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.DETAILS_REQUIRED);
        isValid = false;
      } else if (value.length < VALIDATION_CONFIG.MIN_DETAILS_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.DETAILS_TOO_SHORT);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_DETAILS_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.DETAILS_TOO_LONG);
        isValid = false;
      }
      break;
  }

  return isValid;
}

// Pre-fill user information if available
function prefillUserInfo() {
  const username = localStorage.getItem('username');
  const userEmail = localStorage.getItem('userEmail'); // If stored during registration
  
  if (username) {
    const nameField = document.getElementById('name');
    if (nameField && !nameField.value) {
      nameField.value = username;
    }
  }
  
  if (userEmail) {
    const emailField = document.getElementById('email');
    if (emailField && !emailField.value) {
      emailField.value = userEmail;
    }
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication on page load
  if (!checkAuthentication()) {
    return;
  }

  // Pre-fill user information
  prefillUserInfo();

  // Setup form submission handler
  const complaintForm = document.getElementById('complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitComplaint();
    });
  }

  // Setup real-time validation
  setupRealTimeValidation();

  // Initialize character counters
  updateCharacterCount('title');
  updateCharacterCount('details');

  // Add welcome message
  const username = localStorage.getItem('username');
  if (username) {
    const welcomeElement = document.querySelector('.welcome-message');
    if (welcomeElement) {
      welcomeElement.textContent = `Welcome back, ${username}! Submit your complaint below.`;
    }
  }

  // Add form submission via Enter key (except in textarea)
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      const form = e.target.closest('#complaintForm');
      if (form) {
        e.preventDefault();
        submitComplaint();
      }
    }
  });
});

// Logout functionality
function logout() {
  api.logout(true);
}

// Export functions for external use
window.complaintFormHelpers = {
  validateComplaintForm,
  submitComplaint,
  clearComplaintForm,
  checkAuthentication,
  logout
};