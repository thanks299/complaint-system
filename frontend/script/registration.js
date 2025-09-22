function togglePassword() {
    const password = document.getElementById("password");
    if (password.type === "password") {
      password.type = "text";
    } else {
      password.type = "password";
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

  // element variables
  const registerationForm = document.getElementById("registerationForm");
  const fname = document.getElementById("firstname");
  const lname = document.getElementById("lastname");
  const regno = document.getElementById("regno");
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const role = document.getElementById("role");

  // error variables
  const firsterror = document.getElementById("firstnameError");
  const lasterror = document.getElementById("lastnameError");
  const regnoerror = document.getElementById("regError");
  const usererror = document.getElementById("usernameError");
  const emailerror = document.getElementById("emailError");
  const passworderror = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");
  const roleerror = document.getElementById("roleError");

  //form validation
  registerationForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let isValid = true;

    // ...existing validation code...
    // Name validation
    if (fname.value.trim() === "") {
      firsterror.style.display = "block";
      isValid = false;
    } else {
      firsterror.style.display = "none"
    }
    if (lname.value.trim() === "") {
      lasterror.style.display = "block";
      isValid = false;
    } else {
      lasterror.style.display = "none"
    }
    if (regno.value.trim() === "") {
      regnoerror.style.display = "block";
      isValid = false;
    } else {
      regnoerror.style.display = "none"
    }
    if (username.value.trim() === "") {
      usererror.style.display = "block";
      isValid = false;
    } else {
      usererror.style.display = "none"
    }
    let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
    if (!email.value.match(emailPattern)) {
      emailerror.style.display = "block";
      isValid = false;
    } else {
      emailerror.style.display = "none"
    }
    if (password.value.length < 6) {
      passworderror.style.display = "block";
      isValid = false;
    } else {
      passworderror.style.display = "none"
    }
    if (confirmPassword.value !== password.value || confirmPassword.value === "") {
      confirmError.style.display = "block";
      return isValid = false;
    }
    else {
      confirmError.style.display = "none";
    }
    if (role.value.trim() === "") {
      roleError.style.display = 'block';
      isValid = false;
    } else {
      roleError.style.display = "none";
    }

    if (isValid) {
      // Send registration to backend
      fetch("/api/registeration", {
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
            title: "Registered",
            text: "Registration successful! Redirecting...",
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            localStorage.setItem('role', role.value);
            if (role.value.toLowerCase() === 'admin') {
              window.location.href = "admindashboard.html";
            } else {
              window.location.href = "complaintform.html";
            }
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