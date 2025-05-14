exports.handler = async function(event, context) {
  try {
    const payload = JSON.parse(event.body);
    const { payment_id, status, reference_id, error_description } = payload;

    let paymentStatus = "Pending";
    let paymentError = "";

    if (status === "captured") {
      paymentStatus = "Confirmed";
    } else if (status === "failed") {
      paymentStatus = "Failed";
      paymentError = error_description || "Payment failed";
    } else if (status === "cancelled") {
      paymentStatus = "Cancelled";
      paymentError = "Payment cancelled by user";
    }

    const data = {
      submissionId: reference_id,
      paymentStatus: paymentStatus,
      paymentId: payment_id || "",
      paymentError: paymentError
    };

    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbweGRe_gXXE1x_KgAnt9A6H5M2QkOk5jkYqQQP7pSgmO10a3lp335cgCdt4g7vMGkC7/exec";
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "update", data: data }),
      mode: 'cors',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error("Failed to update Google Sheet");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to update payment status");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Payment status updated" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};