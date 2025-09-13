import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const LiffContext = createContext({
  liff: null,
  profile: null,
  isLoggedIn: false,
  isLineApp: false,
  loading: true,
  error: null,
});

export const useLiff = () => {
  return useContext(LiffContext);
};

export const useIsLineApp = () => {
  const { isLineApp } = useContext(LiffContext);
  return isLineApp;
};

export const LiffProvider = ({ children }) => {
  const [liff, setLiff] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLineApp, setIsLineApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setLoading(false);
      return;
    }

    const initializeLiff = async () => {
      try {
        const liffModule = await import("@line/liff");
        const liffInstance = liffModule.default;

        const liffId = process.env.EXPO_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("LIFF ID is not defined.");
        }

        await liffInstance.init({ liffId });
        setLiff(liffInstance);
        setIsLineApp(liffInstance.isInClient());
        if (liffInstance.isLoggedIn() || liffInstance.isInClient()) {
          const userProfile = await liffInstance.getProfile();
          setProfile(userProfile);
          setIsLoggedIn(true);
        } else {
          liffInstance.login();
        }
      } catch (e) {
        console.error("LIFF Initialization failed:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const value = {
    liff,
    profile,
    isLoggedIn,
    isLineApp,
    loading,
    error,
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};