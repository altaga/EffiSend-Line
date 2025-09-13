// Basic Imports
import { Image, View } from "react-native";
import logoSplash from "../assets/images/splash-iconC.png";
import GlobalStyles from "../core/styles";

export default function SplashLoading(props) {
  // This App works on web only, android and ios native to be done

  return (
    <View style={[GlobalStyles.container, { justifyContent: "center" }]}>
      <Image
        resizeMode="contain"
        source={logoSplash}
        alt="Main Logo"
        style={{
          width: "70%",
        }}
      />
    </View>
  );
}
