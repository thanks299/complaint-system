
    //  elements Variables
    const form = document.getElementById("complaintForm");
    const nameField = document.getElementById("name");
    const matricField = document.getElementById("matric");
    const emailField = document.getElementById("email");
    const deptField = document.getElementById("department");
    const titleField = document.getElementById("title");
    const detailsField = document.getElementById("details");

    // Error fields
    const nameError = document.getElementById("nameError");
    const matricError = document.getElementById("matricError");
    const emailError = document.getElementById("emailError");
    const deptError = document.getElementById("deptError");
    const titleError = document.getElementById("titleError");
    const detailsError = document.getElementById("detailsError");

    // Validation functions
    function validateName() {
      if (nameField.value.trim() === "") {
        nameError.style.display = "block";
        return false;
      } else {
        nameError.style.display = "none";
        return true;
      }
    }

    function validateMatric() {
      var regno = /^[A-Za-z0-9]+\/[A-Za-z0-9]+$/;
      if (!matricField.value.match(regno)) {
        matricError.style.display = "block";
        return false;
      } else {
        matricError.style.display = "none";
        return true;
      }
    }

    function validateEmail() {
      var emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
      if (!emailField.value.match(emailPattern)) {
        emailError.style.display = "block";
        return false;
      } else {
        emailError.style.display = "none";
        return true;
      }
    }

    function validateDept() {
      if (deptField.value === "") {
        deptError.style.display = "block";
        return false;
      } else {
        deptError.style.display = "none";
        return true;
      }
    }

    function validateTitle() {
      if (titleField.value.trim() === "") {
        titleError.style.display = "block";
        return false;
      } else {
        titleError.style.display = "none";
        return true;
      }
    }

    function validateDetails() {
      if (detailsField.value.trim().length < 20) {
        detailsError.style.display = "block";
        return false;
      } else {
        detailsError.style.display = "none";
        return true;
      }
    }

    // Real-time validation
    nameField.addEventListener("input", validateName);
    matricField.addEventListener("input", validateMatric);
    emailField.addEventListener("input", validateEmail);
    deptField.addEventListener("input", validateDept);
    titleField.addEventListener("input", validateTitle);
    detailsField.addEventListener("input", validateDetails);


    // On form submit
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Run all validations
      var isValid =
        validateName() &&
        validateMatric() &&
        validateEmail() &&
        validateDept() &&
        validateTitle() &&
        validateDetails();

      if (isValid) {
        // Prepare complaint data
        const complaintData = {
          name: nameField.value,
          matric: matricField.value,
          email: emailField.value,
          department: deptField.value,
          title: titleField.value,
          details: detailsField.value,
          status: 'Pending'
        };
        // Save email to localStorage for user identification
        localStorage.setItem('email', emailField.value);
        // Send to backend
        fetch("/api/complaintform", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complaintData)
        })
        .then(res => res.json())
        .then(data => {
          Swal.fire({
            icon: "success",
            title: "Complaint Submitted",
            text: "Thank you! Your complaint has been recorded.",
            timer: 2500,
            showConfirmButton: false
          });
          form.reset();
          loadMyComplaints();
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Submission Failed",
            text: "Could not submit complaint. Try again."
          });
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Form Incomplete",
          text: "Please fix the errors before submitting."
        });
      }
    });

    // Load user's complaints
    function loadMyComplaints() {
      const email = localStorage.getItem('email');
      if (!email) return;
      fetch('/api/complaints')
        .then(res => res.json())
        .then(complaints => {
          const myComplaints = complaints.filter(c => c.email === email);
          const tbody = document.querySelector('#myComplaintsTable tbody');
          const noMsg = document.getElementById('noComplaintsMsg');
          tbody.innerHTML = '';
          if (myComplaints.length === 0) {
            noMsg.textContent = 'No complaints submitted yet.';
            return;
          }
          noMsg.textContent = '';
          myComplaints.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td style="padding:0.5rem; border:1px solid #eee;">${c.title}</td>
              <td style="padding:0.5rem; border:1px solid #eee;">${c.details}</td>
              <td style="padding:0.5rem; border:1px solid #eee;">${c.status || 'Pending'}</td>
            `;
            tbody.appendChild(tr);
          });
        });
    }

    // Load on page ready
  loadMyComplaints();