// Configuration constants
const VALIDATION_CONFIG = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 50,
  MAX_NAME_LENGTH: 100,
  REGNO_PATTERN: /^[A-Z0-9\/]+$/i
};

const ERROR_MESSAGES = {
  ROLE_REQUIRED: 'Please select your role',
  FIRSTNAME_REQUIRED: 'First name is required',
  LASTNAME_REQUIRED: 'Last name is required',
  REGNO_REQUIRED: 'Registration number is required',
  REGNO_INVALID: 'Registration number should contain only letters, numbers, and forward slashes',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_LONG: `Username must be less than ${VALIDATION_CONFIG.MAX_USERNAME_LENGTH} characters`,
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_CONFIG.MIN_PASSWORD_LENGTH} characters long`,
  PASSWORDS_MISMATCH: 'Passwords do not match',
  NAME_TOO_LONG: `Name must be less than ${VALIDATION_CONFIG.MAX_NAME_LENGTH} characters`
};

// Enhanced toggle functions with accessibility
function togglePassword() {
  const passwordField = document.getElementById('password');
  const toggleIcon = document.querySelector('.password-toggle-icon');
  
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    if (toggleIcon) toggleIcon.textContent = '🙈';
    passwordField.setAttribute('aria-label', 'Password visible');
  } else {
    passwordField.type = 'password';
    if (toggleIcon) toggleIcon.textContent = '👁️';
    passwordField.setAttribute('aria-label', 'Password hidden');
  }
}

function toggleConfirmPassword() {
  const confirmPasswordField = document.getElementById('confirmPassword');
  const toggleIcon = document.querySelector('.confirm-password-toggle-icon');
  
  if (confirmPasswordField) {
    if (confirmPasswordField.type === 'password') {
      confirmPasswordField.type = 'text';
      if (toggleIcon) toggleIcon.textContent = '🙈';
      confirmPasswordField.setAttribute('aria-label', 'Confirm password visible');
    } else {
      confirmPasswordField.type = 'password';
      if (toggleIcon) toggleIcon.textContent = '👁️';
      confirmPasswordField.setAttribute('aria-label', 'Confirm password hidden');
    }
  }
}

// Enhanced role change handler with smooth transitions
function handleRoleChange() {
  const role = document.getElementById('role').value;
  const studentFields = document.getElementById('studentFields');
  const firstnameInput = document.getElementById('firstname');
  const lastnameInput = document.getElementById('lastname');
  const regnoInput = document.getElementById('regno');
  
  if (!studentFields) return;
  
  if (role === 'admin') {
    // Hide student-specific fields for admin with smooth transition
    studentFields.style.opacity = '0.5';
    setTimeout(() => {
      studentFields.style.display = 'none';
      studentFields.style.opacity = '1';
    }, 200);
    
    // Remove required attributes and clear values
    [firstnameInput, lastnameInput, regnoInput].forEach(input => {
      if (input) {
        input.removeAttribute('required');
        input.value = '';
        clearFieldError(input.id);
      }
    });
    
    showRoleInfo('admin');
  } else if (role === 'student') {
    // Show student-specific fields with smooth transition
    studentFields.style.display = 'block';
    setTimeout(() => {
      studentFields.style.opacity = '1';
    }, 50);
    
    // Add required attributes
    [firstnameInput, lastnameInput, regnoInput].forEach(input => {
      if (input) {
        input.setAttribute('required', 'required');
      }
    });
    
    showRoleInfo('student');
  } else {
    // Default: show student fields
    studentFields.style.display = 'block';
    studentFields.style.opacity = '1';
  }
}

// Show role-specific information
function showRoleInfo(role) {
  const infoElement = document.getElementById('roleInfo');
  if (infoElement) {
    const infoText = role === 'admin' 
      ? 'Admin accounts have full access to manage complaints and users.'
      : 'Student accounts can submit and track their own complaints.';
    
    infoElement.innerHTML = `<i class="info-icon">ℹ️</i> ${infoText}`;
    infoElement.style.display = 'block';
  }
}

// Enhanced validation with real-time feedback
function validateForm() {
  const role = document.getElementById('role').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Clear previous errors
  clearAllFieldErrors();

  let isValid = true;
  const errors = [];

  // Validate role
  if (!role) {
    addFieldError('role', ERROR_MESSAGES.ROLE_REQUIRED);
    isValid = false;
  }

  // Validate student-specific fields
  if (role === 'student') {
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const regno = document.getElementById('regno').value.trim();

    if (!firstname) {
      addFieldError('firstname', ERROR_MESSAGES.FIRSTNAME_REQUIRED);
      isValid = false;
    } else if (firstname.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
      addFieldError('firstname', ERROR_MESSAGES.NAME_TOO_LONG);
      isValid = false;
    }

    if (!lastname) {
      addFieldError('lastname', ERROR_MESSAGES.LASTNAME_REQUIRED);
      isValid = false;
    } else if (lastname.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
      addFieldError('lastname', ERROR_MESSAGES.NAME_TOO_LONG);
      isValid = false;
    }

    if (!regno) {
      addFieldError('regno', ERROR_MESSAGES.REGNO_REQUIRED);
      isValid = false;
    } else if (!VALIDATION_CONFIG.REGNO_PATTERN.test(regno)) {
      addFieldError('regno', ERROR_MESSAGES.REGNO_INVALID);
      isValid = false;
    }
  }

  // Validate common fields
  if (!username) {
    addFieldError('username', ERROR_MESSAGES.USERNAME_REQUIRED);
    isValid = false;
  } else if (username.length > VALIDATION_CONFIG.MAX_USERNAME_LENGTH) {
    addFieldError('username', ERROR_MESSAGES.USERNAME_TOO_LONG);
    isValid = false;
  }

  if (!email) {
    addFieldError('email', ERROR_MESSAGES.EMAIL_REQUIRED);
    isValid = false;
  } else if (!isValidEmail(email)) {
    addFieldError('email', ERROR_MESSAGES.EMAIL_INVALID);
    isValid = false;
  }

  if (!password) {
    addFieldError('password', ERROR_MESSAGES.PASSWORD_REQUIRED);
    isValid = false;
  } else if (password.length < VALIDATION_CONFIG.MIN_PASSWORD_LENGTH) {
    addFieldError('password', ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    isValid = false;
  }

  if (password !== confirmPassword) {
    addFieldError('confirmPassword', ERROR_MESSAGES.PASSWORDS_MISMATCH);
    isValid = false;
  }

  // Show password strength
  if (password) {
    showPasswordStrength(password);
  }

  return isValid;
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength indicator
function showPasswordStrength(password) {
  const strengthElement = document.getElementById('passwordStrength');
  if (!strengthElement) return;

  let strength = 0;
  let feedback = [];

  // Check length
  if (password.length >= 8) strength += 1;
  else feedback.push('At least 8 characters');

  // Check for lowercase
  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push('One lowercase letter');

  // Check for uppercase  
  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push('One uppercase letter');

  // Check for numbers
  if (/\d/.test(password)) strength += 1;
  else feedback.push('One number');

  // Check for special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
  else feedback.push('One special character');

  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ff4757', '#ff6348', '#ffa502', '#2ed573', '#20bf6b'];

  const level = Math.min(Math.floor(strength), 4);
  
  strengthElement.innerHTML = `
    <div class="password-strength-bar">
      <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background-color: ${strengthColors[level]}"></div>
    </div>
    <span class="strength-text" style="color: ${strengthColors[level]}">${strengthLevels[level]}</span>
    ${feedback.length > 0 ? `<small class="strength-tips">Missing: ${feedback.join(', ')}</small>` : ''}
  `;
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

// Enhanced registration with better error handling and UX
async function userRegistration() {
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

  // Add role-specific data
  if (role === 'student') {
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const regno = document.getElementById('regno').value.trim();
    
    formData.firstname = firstname;
    formData.lastname = lastname;
    formData.regno = regno;
  }

  // Show enhanced loading
  const loadingSwal = Swal.fire({
    title: 'Creating Your Account...',
    html: `
      <div class="registration-progress">
        <div class="progress-step active">
          <div class="step-icon">📝</div>
          <div class="step-text">Validating Information</div>
        </div>
        <div class="progress-step" id="step-creating">
          <div class="step-icon">⚡</div>
          <div class="step-text">Creating Account</div>
        </div>
        <div class="progress-step" id="step-finalizing">
          <div class="step-icon">✨</div>
          <div class="step-text">Finalizing Setup</div>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    console.log('Sending registration data:', { ...formData, password: '[HIDDEN]' });
    
    // Simulate progress steps
    setTimeout(() => {
      document.getElementById('step-creating')?.classList.add('active');
    }, 1000);

    const response = await api.register(formData);
    
    setTimeout(() => {
      document.getElementById('step-finalizing')?.classList.add('active');
    }, 500);
    
    console.log('Registration response:', response);

    // Enhanced response checking
    const isSuccess = response.success || 
                     response.message?.includes('successfully') || 
                     response.message?.includes('created') ||
                     response.status === 'success' ||
                     response.error === null;

    loadingSwal.close();

    if (isSuccess) {
      // Store user info in localStorage
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      
      // Store additional info if available
      if (response.user?.id || response.userId) {
        localStorage.setItem('userId', response.user?.id || response.userId);
      }
      
      // Show success with confetti effect
      Swal.fire({
        icon: 'success',
        title: '🎉 Account Created Successfully!',
        html: `
          <div class="success-message">
            <p>Welcome to NACOS Complaint System, <strong>${username}</strong>!</p>
            <p>Your ${role} account has been created successfully.</p>
            <div class="next-steps">
              <h4>Next Steps:</h4>
              <ul style="text-align: left; display: inline-block;">
                ${role === 'student' ? 
                  '<li>Submit your first complaint</li><li>Track complaint status</li>' : 
                  '<li>Access admin dashboard</li><li>Manage user complaints</li>'
                }
              </ul>
            </div>
          </div>
        `,
        timer: 4000,
        showConfirmButton: true,
        confirmButtonText: role === 'admin' ? 'Go to Dashboard' : 'Start Using System',
        timerProgressBar: true
      }).then((result) => {
        // Clear form
        const form = document.getElementById('registerationForm');
        if (form) {
          form.reset();
          clearAllFieldErrors();
        }
        
        // Reset field visibility
        if (typeof handleRoleChange === 'function') {
          handleRoleChange();
        }
        
        // Redirect based on role
        const redirectPage = role === 'admin' ? 'admindashboard.html' : 'complaintform.html';
        console.log(`Redirecting to: ${redirectPage}`);
        window.location.href = redirectPage;
      });
    } else {
      // Handle registration errors with specific feedback
      let errorMessage = 'Registration failed. Please try again.';
      
      if (response.error) {
        errorMessage = response.error;
        
        // Handle specific server errors
        if (response.error.includes('email')) {
          addFieldError('email', 'This email is already registered');
        } else if (response.error.includes('username')) {
          addFieldError('username', 'This username is already taken');
        }
      } else if (response.message && !response.message.includes('successfully')) {
        errorMessage = response.message;
      }
      
      console.error('Registration failed:', response);
      
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: errorMessage,
        footer: 'Please check your information and try again.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    loadingSwal.close();
    
    let errorMessage = 'Could not connect to server. Please check your internet connection and try again.';
    
    // Handle specific HTTP errors
    if (error.message.includes('400')) {
      errorMessage = 'Invalid registration data. Please check your inputs.';
    } else if (error.message.includes('409')) {
      errorMessage = 'Username or email already exists. Please choose different credentials.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      html: `
        <p>${errorMessage}</p>
        <div class="error-actions">
          <button class="retry-btn" onclick="userRegistration()">Try Again</button>
          <button class="contact-btn" onclick="window.open('mailto:support@nacos.edu.ng', '_blank')">Contact Support</button>
        </div>
      `,
      showConfirmButton: false
    });
  }
}

// Real-time validation
function setupRealTimeValidation() {
  const fields = ['username', 'email', 'password', 'confirmPassword', 'firstname', 'lastname', 'regno'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => {
        validateSingleField(fieldId);
      });
      
      field.addEventListener('input', () => {
        clearFieldError(fieldId);
        if (fieldId === 'password') {
          showPasswordStrength(field.value);
        }
      });
    }
  });
}

// Single field validation
function validateSingleField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const value = field.value.trim();
  let isValid = true;

  switch (fieldId) {
    case 'username':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.USERNAME_REQUIRED);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_USERNAME_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.USERNAME_TOO_LONG);
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
      
    case 'password':
      if (!value) {
        addFieldError(fieldId, ERROR_MESSAGES.PASSWORD_REQUIRED);
        isValid = false;
      } else if (value.length < VALIDATION_CONFIG.MIN_PASSWORD_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.PASSWORD_TOO_SHORT);
        isValid = false;
      }
      break;
      
    case 'confirmPassword':
      const password = document.getElementById('password').value;
      if (value !== password) {
        addFieldError(fieldId, ERROR_MESSAGES.PASSWORDS_MISMATCH);
        isValid = false;
      }
      break;
  }

  return isValid;
}

// Enhanced form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = document.getElementById('registerationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      userRegistration();
    });
  }

  // Setup real-time validation
  setupRealTimeValidation();

  // Initialize form state
  handleRoleChange();

  // Auto-focus on first field
  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    roleSelect.focus();
  }

  // Add form submission via Enter key
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      const form = e.target.closest('#registerationForm');
      if (form) {
        e.preventDefault();
        userRegistration();
      }
    }
  });
});

// Export functions for external use
window.registrationHelpers = {
  validateForm,
  handleRoleChange,
  togglePassword,
  toggleConfirmPassword,
  clearAllFieldErrors
};