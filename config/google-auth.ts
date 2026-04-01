export const GoogleAuthConfig = {
  // Get these from Google Cloud Console
  webClientId:
    "557054657025-f2bkiriqcca17mv0a3p93lrsqjolgmoc.apps.googleusercontent.com",
  iosClientId:
    "53409583700-lf52gkai0qfvmk0dm1u50ojpl60gpoc4.apps.googleusercontent.com",
  androidClientId:
    "53409583700-4ft6430vf0bibt6pmo29l6nqvbuhhvuv.apps.googleusercontent.com",

  scopes: [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
  ],
};
