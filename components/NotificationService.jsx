import PushNotification from 'react-native-push-notification';

// Set up PushNotification configurations
PushNotification.configure({
  // Called when a remote or local notification is opened or received
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  },

  // Called when the app is opened from a notification (foreground or background)
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },

  // iOS only: Set permissions for notifications (important for iOS)
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true, // Set this to true to allow for the notification when the app is opened from a background state.
  requestPermissions: true,
});

// Function to get initial notification (when the app was opened from a notification)
const getInitialNotification = async () => {
  try {
    const initialNotification = await PushNotification.getInitialNotification();
    if (initialNotification) {
      console.log('App opened from notification:', initialNotification);
      // Handle your logic here, for example, navigate to a specific screen
    }
  } catch (error) {
    console.error('Error getting initial notification:', error);
  }
};

// Call this function on app start to handle the notification when the app is opened from the background
const handleInitialNotification = () => {
  getInitialNotification();
};

export default {
  handleInitialNotification,
  showLocalNotification: (title, message) => {
    PushNotification.localNotification({
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      vibration: 300,
    });
  },
};
