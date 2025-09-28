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
  const toggleIcon = document.querySelector('.eye');
  
  if (passwordField && passwordField.type === 'password') {
    passwordField.type = 'text';
    if (toggleIcon) toggleIcon.textContent = '🙈';
    passwordField.setAttribute('aria-label', 'Password visible');
  } else if (passwordField) {
    passwordField.type = 'password';
    if (toggleIcon) toggleIcon.textContent = '👁️';
    passwordField.setAttribute('aria-label', 'Password hidden');
  }
}

function toggleConfirmPassword() {
  const confirmPasswordField = document.getElementById('confirmPassword');
  const toggleIcons = document.querySelectorAll('.eye');
  const confirmToggleIcon = toggleIcons[1]; // Second eye icon for confirm password
  
  if (confirmPasswordField) {
    if (confirmPasswordField.type === 'password') {
      confirmPasswordField.type = 'text';
      if (confirmToggleIcon) confirmToggleIcon.textContent = '🙈';
      confirmPasswordField.setAttribute('aria-label', 'Confirm password visible');
    } else {
      confirmPasswordField.type = 'password';
      if (confirmToggleIcon) confirmToggleIcon.textContent = '👁️';
      confirmPasswordField.setAttribute('aria-label', 'Confirm password hidden');
    }
  }
}

// ✅ FIXED: Enhanced role change handler with smooth transitions and auto-clear errors
function handleRoleChange() {
  const role = document.getElementById('role').value;
  const studentFields = document.getElementById('studentFields');
  const firstnameInput = document.getElementById('firstname');
  const lastnameInput = document.getElementById('lastname');
  const regnoInput = document.getElementById('regno');
  
  // ✅ CLEAR ALL ERRORS WHEN ROLE CHANGES
  clearAllFieldErrors();
  
  if (!studentFields) return;
  
  if (role === 'admin') {
    // Hide student-specific fields for admin with smooth transition
    studentFields.classList.add('hidden');
    
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
    studentFields.classList.remove('hidden');
    
    // Add required attributes
    [firstnameInput, lastnameInput, regnoInput].forEach(input => {
      if (input) {
        input.setAttribute('required', 'required');
      }
    });
    
    showRoleInfo('student');
  } else {
    // Default: show student fields
    studentFields.classList.remove('hidden');
  }
}

// Show role-specific information
function showRoleInfo(role) {
  let infoElement = document.getElementById('roleInfo');
  
  // Create info element if it doesn't exist
  if (!infoElement) {
    infoElement = document.createElement('div');
    infoElement.id = 'roleInfo';
    const roleContainer = document.getElementById('role').parentNode;
    roleContainer.appendChild(infoElement);
  }
  
  if (role && role !== '') {
    const infoText = role === 'admin' 
      ? 'Admin accounts have full access to manage complaints and users.'
      : 'Student accounts can submit and track their own complaints.';
    
    infoElement.innerHTML = `<i class="info-icon">ℹ️</i> ${infoText}`;
    infoElement.style.display = 'block';
  } else {
    infoElement.style.display = 'none';
  }
}

// ✅ ENHANCED: Better error management with auto-clear functionality
function addFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('error');
  
  let errorElement = document.getElementById(`${fieldId}-error`);
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'field-error';
    
    // Insert error element after the field or its container
    const container = field.closest('.form-group') || field.parentNode;
    container.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  errorElement.style.opacity = '1';
  
  // ✅ AUTO-CLEAR ERROR AFTER 5 SECONDS
  setTimeout(() => {
    if (errorElement && errorElement.style.display === 'block') {
      errorElement.style.opacity = '0.5';
    }
  }, 5000);
}

// ✅ ENHANCED: Better field error clearing
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (field) {
    field.classList.remove('error');
    // ✅ ENSURE FIELD IS ALWAYS INTERACTIVE
    field.style.pointerEvents = 'auto';
    field.disabled = false;
  }
  
  if (errorElement) {
    errorElement.style.display = 'none';
    errorElement.style.opacity = '0';
  }
}

// ✅ ENHANCED: Clear all errors and reset form state
function clearAllFieldErrors() {
  // Clear all error elements
  document.querySelectorAll('.field-error').forEach(error => {
    error.style.display = 'none';
    error.style.opacity = '0';
  });
  
  // Remove error classes and ensure fields are interactive
  document.querySelectorAll('.error').forEach(field => {
    field.classList.remove('error');
    field.style.pointerEvents = 'auto';
    field.disabled = false;
  });
  
  // Clear password strength indicator
  const strengthElement = document.getElementById('passwordStrength');
  if (strengthElement) {
    strengthElement.innerHTML = '';
  }
}

// ✅ ENHANCED: Auto-clear errors on field interaction
function setupFieldInteractionHandlers() {
  const allFields = [
    'role', 'firstname', 'lastname', 'regno', 
    'username', 'email', 'password', 'confirmPassword'
  ];
  
  allFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // ✅ CLEAR ERROR ON FOCUS (when user clicks on field)
      field.addEventListener('focus', () => {
        clearFieldError(fieldId);
        field.style.pointerEvents = 'auto';
        field.disabled = false;
      });
      
      // ✅ CLEAR ERROR ON INPUT (when user starts typing)
      field.addEventListener('input', () => {
        clearFieldError(fieldId);
        if (fieldId === 'password') {
          showPasswordStrength(field.value);
        }
        // ✅ CLEAR CONFIRM PASSWORD ERROR WHEN PASSWORD CHANGES
        if (fieldId === 'password') {
          clearFieldError('confirmPassword');
        }
      });
      
      // ✅ CLEAR ERROR ON CHANGE (for select elements)
      field.addEventListener('change', () => {
        clearFieldError(fieldId);
        if (fieldId === 'role') {
          handleRoleChange();
        }
      });
      
      // ✅ VALIDATE ON BLUR (when user clicks away)
      field.addEventListener('blur', () => {
        // Only validate if field has value or is required
        const hasValue = field.value.trim() !== '';
        const isRequired = field.hasAttribute('required');
        
        if (hasValue || isRequired) {
          setTimeout(() => validateSingleField(fieldId), 300);
        }
      });
    }
  });
}

// Enhanced validation with real-time feedback
function validateForm() {
  const role = document.getElementById('role').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // ✅ CLEAR ALL PREVIOUS ERRORS FIRST
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
  let strengthElement = document.getElementById('passwordStrength');
  
  // Create strength element if it doesn't exist
  if (!strengthElement) {
    strengthElement = document.createElement('div');
    strengthElement.id = 'passwordStrength';
    const passwordContainer = document.getElementById('password').closest('.form-group');
    passwordContainer.appendChild(strengthElement);
  }

  if (!password) {
    strengthElement.innerHTML = '';
    return;
  }

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

// Single field validation
function validateSingleField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value.trim();
  let isValid = true;

  // ✅ ONLY VALIDATE IF FIELD IS VISIBLE AND HAS VALUE OR IS REQUIRED
  const isVisible = field.offsetParent !== null;
  const hasValue = value !== '';
  const isRequired = field.hasAttribute('required');
  
  if (!isVisible && !isRequired) return true;

  switch (fieldId) {
    case 'role':
      if (!value && isRequired) {
        addFieldError(fieldId, ERROR_MESSAGES.ROLE_REQUIRED);
        isValid = false;
      }
      break;
      
    case 'firstname':
      if (!value && isRequired) {
        addFieldError(fieldId, ERROR_MESSAGES.FIRSTNAME_REQUIRED);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.NAME_TOO_LONG);
        isValid = false;
      }
      break;
      
    case 'lastname':
      if (!value && isRequired) {
        addFieldError(fieldId, ERROR_MESSAGES.LASTNAME_REQUIRED);
        isValid = false;
      } else if (value.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
        addFieldError(fieldId, ERROR_MESSAGES.NAME_TOO_LONG);
        isValid = false;
      }
      break;
      
    case 'regno':
      if (!value && isRequired) {
        addFieldError(fieldId, ERROR_MESSAGES.REGNO_REQUIRED);
        isValid = false;
      } else if (hasValue && !VALIDATION_CONFIG.REGNO_PATTERN.test(value)) {
        addFieldError(fieldId, ERROR_MESSAGES.REGNO_INVALID);
        isValid = false;
      }
      break;
      
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
      if (value !== password && (hasValue || password)) {
        addFieldError(fieldId, ERROR_MESSAGES.PASSWORDS_MISMATCH);
        isValid = false;
      }
      break;
  }

  return isValid;
}

// Enhanced registration with better error handling and UX
async function userRegistration() {
  // ✅ ENSURE ALL FIELDS ARE INTERACTIVE BEFORE VALIDATION
  const allFields = document.querySelectorAll('input, select');
  allFields.forEach(field => {
    field.style.pointerEvents = 'auto';
    field.disabled = false;
  });

  if (!validateForm()) {
    // ✅ SCROLL TO FIRST ERROR
    const firstError = document.querySelector('.field-error[style*="block"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
      <div class="registration-progress" style="margin-top: 20px;">
        <div class="progress-step active" style="display: flex; align-items: center; margin-bottom: 10px; opacity: 1; font-weight: bold;">
          <div class="step-icon" style="font-size: 1.5em; margin-right: 10px;">📝</div>
          <div class="step-text">Validating Information</div>
        </div>
        <div class="progress-step" id="step-creating" style="display: flex; align-items: center; margin-bottom: 10px; opacity: 0.6;">
          <div class="step-icon" style="font-size: 1.5em; margin-right: 10px;">⚡</div>
          <div class="step-text">Creating Account</div>
        </div>
        <div class="progress-step" id="step-finalizing" style="display: flex; align-items: center; margin-bottom: 10px; opacity: 0.6;">
          <div class="step-icon" style="font-size: 1.5em; margin-right: 10px;">✨</div>
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
      const step = document.getElementById('step-creating');
      if (step) {
        step.style.opacity = '1';
        step.style.fontWeight = 'bold';
      }
    }, 1000);

    const response = await api.register(formData);
    
    setTimeout(() => {
      const step = document.getElementById('step-finalizing');
      if (step) {
        step.style.opacity = '1';
        step.style.fontWeight = 'bold';
      }
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
          <div class="success-message" style="padding: 10px 0 0 0; font-size: 1.1em; color: #222;">
            <p>Welcome to NACOS Complaint System, <strong style="color: #20bf6b;">${username}</strong>!</p>
            <p>Your ${role} account has been created successfully.</p>
            <div class="next-steps" style="margin-top: 15px; background: #f4f8f6; border-radius: 8px; padding: 10px 18px; display: inline-block;">
              <h4 style="margin: 0 0 6px 0; font-size: 1em; color: #2ed573;">Next Steps:</h4>
              <ul style="margin: 0; padding-left: 18px; color: #444; text-align: left; display: inline-block;">
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
        // ✅ PROPERLY RESET FORM
        resetForm();
        
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
        <div class="error-actions" style="margin-top: 15px;">
          <button class="retry-btn" onclick="userRegistration()" style="margin-right: 10px; padding: 8px 16px; background: #4a7c59; color: white; border: none; border-radius: 5px; cursor: pointer;">Try Again</button>
          <button class="contact-btn" onclick="window.open('mailto:support@nacos.edu.ng', '_blank')" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Contact Support</button>
        </div>
      `,
      showConfirmButton: false
    });
  }
}

// ✅ NEW: Properly reset form function
function resetForm() {
  const form = document.getElementById('registerationForm');
  if (form) {
    form.reset();
  }
  
  // Clear all errors
  clearAllFieldErrors();
  
  // Reset field visibility
  handleRoleChange();
  
  // Reset password strength
  const strengthElement = document.getElementById('passwordStrength');
  if (strengthElement) {
    strengthElement.innerHTML = '';
  }
  
  // Ensure all fields are interactive
  const allFields = document.querySelectorAll('input, select');
  allFields.forEach(field => {
    field.style.pointerEvents = 'auto';
    field.disabled = false;
    field.classList.remove('error');
  });
}

// ✅ ENHANCED: Form submission handler with better error prevention
document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = document.getElementById('registerationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      userRegistration();
    });
  }

  // ✅ SETUP ENHANCED FIELD INTERACTION HANDLERS
  setupFieldInteractionHandlers();

  // Initialize form state
  handleRoleChange();

  // Auto-focus on first field
  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    roleSelect.focus();
  }

  // ✅ ENHANCED: Form submission via Enter key with error prevention
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      const form = e.target.closest('#registerationForm');
      if (form) {
        e.preventDefault();
        e.stopPropagation();
        userRegistration();
      }
    }
  });
  
  // ✅ NEW: Clear errors when clicking anywhere on the form
  document.addEventListener('click', function(e) {
    if (e.target.closest('.container')) {
      // Give a small delay to ensure field focus events fire first
      setTimeout(() => {
        // Only clear persistent errors, not validation errors
        document.querySelectorAll('.field-error').forEach(error => {
          if (error.style.opacity === '0.5') {
            error.style.display = 'none';
            error.style.opacity = '0';
          }
        });
      }, 100);
    }
  });
});

// Export functions for external use
window.registrationHelpers = {
  validateForm,
  handleRoleChange,
  togglePassword,
  toggleConfirmPassword,
  clearAllFieldErrors,
  resetForm
};