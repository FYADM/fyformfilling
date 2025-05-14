emailjs.init("yabsBn7Krs4T7dc_W");

function generateSubmissionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function calculatePrice() {
  const collegesInput = document.getElementById("colleges").value;
  const coursesInput = document.getElementById("courses").value;
  const colleges = parseInt(collegesInput) || 1;
  const coursesPerCollege = coursesInput.split(",").map(num => parseInt(num.trim()) || 1);

  let totalCost = 0;
  if (colleges >= 1) {
    totalCost += 500;
    const firstCollegeCourses = coursesPerCollege[0] || 1;
    if (firstCollegeCourses > 1) {
      totalCost += (firstCollegeCourses - 1) * 100;
    }
  }
  for (let i = 1; i < colleges; i++) {
    totalCost += 500;
    const courses = coursesPerCollege[i] || 1;
    if (courses > 1) {
      totalCost += (courses - 1) * 100;
    }
  }

  document.getElementById("totalCost").textContent = totalCost;
  return totalCost;
}

document.getElementById("colleges").addEventListener("input", calculatePrice);
document.getElementById("courses").addEventListener("input", calculatePrice);

document.getElementById("admissionForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const submissionId = generateSubmissionId();
  const data = {
    submissionId: submissionId,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    colleges: formData.get("colleges"),
    courses: formData.get("courses"),
    collegeDetails: formData.get("collegeDetails"),
    totalCost: calculatePrice(),
    totalForms: 0,
    documents: "",
    paymentStatus: "Pending",
    paymentId: "",
    paymentError: ""
  };

  const colleges = parseInt(data.colleges) || 1;
  const coursesPerCollege = data.courses.split(",").map(num => parseInt(num.trim()) || 1);
  let totalForms = 1;
  coursesPerCollege.forEach(courses => totalForms += courses);
  data.totalForms = totalForms;

  const files = formData.getAll("documents");
  const fileNames = files.map(file => file.name).join(", ");
  data.documents = fileNames;

  try {
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbweGRe_gXXE1x_KgAnt9A6H5M2QkOk5jkYqQQP7pSgmO10a3lp335cgCdt4g7vMGkC7/exec";
    const sheetResponse = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "append", data: data }),
      mode: 'cors',
      redirect: 'follow'
    });

    if (!sheetResponse.ok) {
      throw new Error("Failed to send data to Google Sheet");
    }

    const sheetResult = await sheetResponse.json();
    if (!sheetResult.success) {
      throw new Error(sheetResult.error || "Failed to save data");
    }

    await emailjs.send("service_xm4j16t", "template_05pkln8", data);

    const paymentResponse = await fetch("/.netlify/functions/create-payment-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: data.totalCost,
        description: `Admission Form for ${data.name} (ID: ${submissionId})`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        reference_id: submissionId
      }),
    });

    if (!paymentResponse.ok) {
      throw new Error("Failed to create payment link");
    }

    const paymentData = await paymentResponse.json();
    if (paymentData.paymentLink) {
      window.location.href = paymentData.paymentLink;
    } else {
      throw new Error("No payment link received");
    }

    alert("Form submitted! You will be redirected to payment.");
  } catch (error) {
    alert("Error: " + error.message + ". Please try again or contact support.");
  }
});