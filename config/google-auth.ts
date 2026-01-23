export const GoogleAuthConfig = {
  // Get these from Google Cloud Console
  webClientId: '53409583700-tfaprlar3erp309kp35k6d6fbd5767g6.apps.googleusercontent.com',
  iosClientId: '53409583700-lf52gkai0qfvmk0dm1u50ojpl60gpoc4.apps.googleusercontent.com', 
  androidClientId: '53409583700-4ft6430vf0bibt6pmo29l6nqvbuhhvuv.apps.googleusercontent.com',
  
  // OAuth scopes - what info we want from Google
  scopes: ['profile', 'email'],
  
  // Redirect URL for Expo
  redirectUri: '/dashboard',
};