const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.createUserWithDeviceId = functions.region('us-central1').https.onCall(async (data, context) => {
  const deviceId = data.deviceId;

  if (!deviceId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Device ID is required"
    );
  }

  try {
    // Check if user exists
    await admin.auth().getUser(deviceId);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Create auth user
      await admin.auth().createUser({ uid: deviceId });
      
      // Create Firestore document
      await admin.firestore().collection("users").doc(deviceId).set({
        role: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      throw new functions.https.HttpsError(
          "internal",
          "Authentication error"
      );
    }
  }

  // Generate custom token
  const token = await admin.auth().createCustomToken(deviceId);
  return { token };
});