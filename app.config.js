// Convertido de app.json pra app.config.js só por causa disto: a chave do
// Google Maps (android.config.googleMaps.apiKey) precisa vir de uma
// variável de ambiente, e JSON estático não lê process.env. O Expo CLI já
// carrega o .env automaticamente antes de avaliar este arquivo.
module.exports = {
  expo: {
    name: "HypeApp",
    slug: "HypeApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "hypeapp",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0D",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hypeapp.app",
    },
    android: {
      package: "com.hypeapp.app",
      adaptiveIcon: {
        backgroundColor: "#0A0A0D",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      // Sem isso o mapa (react-native-maps) aparece quase em branco no
      // Android — só os pins/formas aparecem, sem o mapa-base do Google.
      // O Expo Go lê essa chave em tempo real (não precisa de build
      // nativo pra testar). No iOS não precisa de chave (usa Apple Maps).
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-splash-screen",
      "expo-status-bar",
      "expo-web-browser",
      "@react-native-google-signin/google-signin",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
