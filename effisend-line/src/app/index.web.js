// Basic Imports
import { useNavigation } from "expo-router";
import { useCallback, useContext, useEffect } from "react";
import { Image, View } from "react-native";
import logoSplash from "../assets/images/splash-iconC.png";
import GlobalStyles from "../core/styles";
import ContextModule from "../providers/contextModule";
import { useLiff } from "../providers/liffProvider";
import { debugServer } from "../app/api/debugUtil";
import { setAsyncStorageValue, setEncryptedStorageValue } from "../core/utils";

export default function SplashLoading() {
  const context = useContext(ContextModule);
  const { isLoggedIn, profile } = useLiff();
  const navigation = useNavigation();

  const fetchFaceIDbyUser = useCallback(async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify({
      userId: profile.userId,
    });
    debugServer({ userId: profile.userId });
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    return new Promise((resolve) => {
      fetch(`/api/fetchFaceIDbyUser`, requestOptions)
        .then((response) => response.json())
        .then((result) => resolve(result))
        .catch(() => resolve({ result: null, error: "BAD REQUEST" }));
    });
  }, [profile]);

  useEffect(() => {
    const update = async () => {
      const { result } = await fetchFaceIDbyUser();
      if (result?.user) {
        await setEncryptedStorageValue({ user: result.user });
        await setAsyncStorageValue({ address: result.address });
        await context.setValueAsync({ address: result.address });
        navigation.navigate("(screens)/main");
      } else {
        navigation.navigate("(screens)/create");
      }
    };
    context.value.starter && isLoggedIn && update();
  }, [
    context.value.address,
    context.value.starter,
    navigation.navigate,
    isLoggedIn,
  ]);

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
