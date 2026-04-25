export const GoogleAuthConfig = {
  // Get these from Google Cloud Console
  webClientId:
    "557054657025-5u9lanne7djbu6e3jlb5kjus6mp6coj6.apps.googleusercontent.com",
  iosClientId:
    "557054657025-02eifc6hlsjeaol2g6f7eki6ri4i4lda.apps.googleusercontent.com",
  androidClientId:
    "557054657025-nrc534vlripjif58t36p05i8fgkehao2.apps.googleusercontent.com",

  scopes: [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
  ],
};
// ios: 557054657025-02eifc6hlsjeaol2g6f7eki6ri4i4lda.apps.googleusercontent.com
// android: 557054657025-nrc534vlripjif58t36p05i8fgkehao2.apps.googleusercontent.com
// web: 557054657025-5u9lanne7djbu6e3jlb5kjus6mp6coj6.apps.googleusercontent.com
// http://localhost:19006