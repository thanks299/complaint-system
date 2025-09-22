
// Toggle password visibility
function togglePassword() {
  let password = document.getElementById("password")
  if (password.type === "password") {
    password.type = "text";
  }
  else {
    password.type = "password"
  }
}

function toggleComfirmPassword() {
  const confirmPassword = document.getElementById("confirmPassword");
  if (confirmPassword.type === "password") {
    confirmPassword.type = "text";
  } else {
    confirmPassword.type = "password";
  }
}

//  elements variables
const form = document.getElementById("adminRegisterForm")
const fullname = document.getElementById("fullname");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const role = document.getElementById("role");

// Error message elements
const fullnameError = document.getElementById("fullnameError");
const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmError");
const roleError = document.getElementById("roleError")

// form validation
form.addEventListener("submit", function (e) {
  e.preventDefault();
  let isValid = true;

  // Name validation
  if (fullname.value.trim() === "") {
    fullnameError.style.display = "block";
    return isValid = false;
  } else {
    fullnameError.style.display = "none";
  }

  // Username validation
  if (username.value.trim() === "") {
    usernameError.style.display = "block";
    return isValid = false;
  } else {
    usernameError.style.display = "none";
  }

  // Email validation
  let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
  if (!email.value.match(emailPattern)) {
    emailError.style.display = "block";
    return isValid = false;
  } else {
    emailError.style.display = "none";
  }

  // Password validation
  if (password.value.length < 6) {
    passwordError.style.display = "block";
    return isValid = false;
  }
  else {
    passwordError.style.display = "none";
  }

  // Password validation
  if (confirmPassword.value !== password.value || confirmPassword.value === "") {
    confirmError.style.display = "block";
    return isValid = false;
  }
  else {
    confirmError.style.display = "none";
  }

  if (role.value === "") {
    roleError.style.display = 'block';
    isValid = false;
  } else {
    roleError.style.display = "none";
  }

  //  Success Alert
  if (isValid) {
    fetch("/api/adminRegisteration", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        email: email.value
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error && data.error.includes('already registered')) {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: data.error
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Admin Registered",
          text: "Registration successful! Redirecting to dashboard...",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.href = "admindashboard.html";
        });
        form.reset();
      }
    })
    .catch(() => {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "Could not connect to server. Try again."
      });
    });
  }
});