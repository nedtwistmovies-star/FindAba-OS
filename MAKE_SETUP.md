# Make.com Integration Guide for FindAba 🚚🚕

This guide explains how to connect your WhatsApp bot to the FindAba backend logic.

## 1. The Endpoint
**URL:** `https://ais-pre-wctxhh536gpevawjkmctw3-5850429325.europe-west2.run.app/api/whatsapp/incoming`  
**Method:** `POST`

---

## 2. Make.com Scenario Structure

### Step 1: WhatsApp Trigger
*   Use your preferred WhatsApp module (Twilio, Gupshup, 360dialog, or a custom Webhook).
*   Ensure you capture the **Sender Phone Number** and the **Message Body**.

### Step 2: HTTP -> Make a Request
*   **Method:** `POST`
*   **URL:** `https://ais-pre-wctxhh536gpevawjkmctw3-5850429325.europe-west2.run.app/api/whatsapp/incoming`
*   **Body Type:** `Raw`
*   **Content Type:** `JSON (application/json)`
*   **Request Content:**
    ```json
    {
      "from": "{{1.SenderPhoneNumber}}",
      "text": "{{1.MessageBody}}",
      "location": {
        "lat": "{{1.LocationLatitude}}",
        "lng": "{{1.LocationLongitude}}"
      }
    }
    ```
    *(Note: Map the `{{ }}` variables to the output fields from Step 1. If location is not available, you can omit the location object or send null.)*

### Step 3: WhatsApp -> Send Response
*   Use the response from Step 2 to reply to the user.
*   **Recipient:** `{{1.SenderPhoneNumber}}`
*   **Text:** `{{2.Data.reply}}`

---

## 3. Supported Keywords
*   **"Hi" or "Menu"**: Resets the conversation and shows options.
*   **"1"**: Starts Carry-Go (Parcel) flow.
*   **"2"**: Starts Purple-Fleet (Ride) flow.
*   **"3" or "Track"**: Returns the current status and a **Live Tracking Link**.
*   **"Confirm"**: Finalizes a booking after location is shared.
*   **"SOS"**: Triggers emergency protocol.

---

## 5. OTP & Verification
The system now sends One-Time Passwords (OTPs) via WhatsApp instead of SMS.

When an OTP is requested, FindAba sends a POST request to your **Make.com Webhook** with:
```json
{
  "type": "OTP_VERIFICATION",
  "phone": "+234...",
  "otp": "123456",
  "message": "Your FindAba Verification Code is: 123456..."
}
```
**Action:** In Make.com, create a router or filter to catch `"type": "OTP_VERIFICATION"` and send the `message` field to the provided `phone` number.
When a user asks for status ("3"), the API returns a link like:
`https://findaba.com.ng/?view=tracking&id=RIDE-XXXX`

Make.com simply passes this text back to the user on WhatsApp. When the user clicks it, it opens the lightweight **Live Tracking Page** I built in the React app.
