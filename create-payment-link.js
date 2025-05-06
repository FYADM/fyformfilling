const axios = require('axios');

exports.handler = async function(event, context) {
  const { amount, description, name, email, phone } = JSON.parse(event.body);

  // Razorpay API credentials
  const razorpayKeyId = 'rzp_live_8FVycAsEghg0Yf'; // Your Razorpay Key ID
  const razorpayKeySecret = 'nLzQ8ppUyxF42pjeqS707rvX'; // Your Razorpay Key Secret

  try {
    const response = await axios.post(
      'https://api.razorpay.com/v1/payment_links',
      {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        description: description,
        customer: {
          name: name,
          email: email,
          contact: phone
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        expire_by: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Expire in 7 days
      },
      {
        auth: {
          username: razorpayKeyId,
          password: razorpayKeySecret
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ paymentLink: response.data.short_url })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};