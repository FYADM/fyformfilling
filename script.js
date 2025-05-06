// Initialize EmailJS
emailjs.init("user_abc123xyz"); // Replace "user_abc123xyz" with your EmailJS User ID

// Pricing Calculator (Student Pricing)
function calculatePrice() {
  const collegesInput = document.getElementById("colleges").value;
  const coursesInput = document.getElementById("courses").value;
  const colleges = parseInt(collegesInput) || 1;
  const coursesPerCollege = coursesInput.split(",").map(num => parseInt(num.trim()) || 1);

  let totalCost = 0;
  if (colleges >= 1) {
    totalCost += 500; // Base: pre-enrollment + 1 college (1 course)
    const firstCollegeCourses = coursesPerCollege[0] || 1;
    if (firstCollegeCourses > 1) {
      totalCost += (firstCollegeCourses - 1) * 100; // Additional courses in first college
    }
  }
  for (let i = 1; i < colleges; i++) {
    totalCost += 500; // New college (1 course)
    const courses = coursesPerCollege[i] || 1;
    if (courses > 1) {
      totalCost += (courses - 1) * 100; // Additional courses in this college
    }
  }

  document.getElementById("totalCost").textContent = totalCost;
  return totalCost;
}

// Form Submission
document.getElementById("admissionForm").addEventListener("submit", function(event) {
  event.preventDefault();

  // Collect form data
  const formData = new FormData(this);
  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    colleges: formData.get("colleges"),
    courses: formData.get("courses"),
    collegeDetails: formData.get("collegeDetails"),
    totalCost: calculatePrice()
  };

  // Calculate number of forms for staff remuneration (not displayed)
  const colleges = parseInt(data.colleges) || 1;
  const coursesPerCollege = data.courses.split(",").map(num => parseInt(num.trim()) || 1);
  let totalForms = 1; // Pre-enrollment form
  coursesPerCollege.forEach(courses => totalForms += courses); // Add courses for each college
  data.totalForms = totalForms;

  // Handle file uploads (log file names; in production, upload to Google Drive)
  const files = formData.getAll("documents");
  const fileNames = files.map(file => file.name).join(", ");
  data.documents = fileNames;

  // Send data to backend team via EmailJS
  emailjs.send("service_xxxxxx", "template_yyyyyy", data) // Replace "service_xxxxxx" with your EmailJS Service ID, "template_yyyyyy" with your EmailJS Template ID
    .then(() => {
      alert("Form submitted successfully! Proceed to payment.");
      initiatePayment(data);
    })
    .catch(error => {
      alert("Error submitting form: " + error);
    });
});

// Razorpay Payment Integration
function initiatePayment(data) {
  const options = {
    key: "rzp_test_abc123xyz", // Replace "rzp_test_abc123xyz" with your Razorpay Key ID
    amount: data.totalCost * 100, // Convert to paise
    currency: "INR",
    name: "FY Admission Service",
    description: "Form Filling Service",
    handler: function(response) {
      alert("Payment successful! Transaction ID: " + response.razorpay_payment_id);
      // Send payment confirmation to team
      emailjs.send("service_xxxxxx", "template_yyyyyy", { // Replace "service_xxxxxx" with your EmailJS Service ID, "template_yyyyyy" with your EmailJS Template ID
        ...data,
        payment_id: response.razorpay_payment_id
      });
    },
    prefill: {
      name: data.name,
      email: data.email,
      contact: data.phone
    },
    theme: {
      color: "#2563EB"
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}