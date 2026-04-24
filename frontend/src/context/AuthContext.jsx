import { createContext, useState, useEffect } from "react";
import socket from "../api/socket";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);
      // ✅ SYNC UI LANGUAGE ON REFRESH
      if (parsed.preferredLanguage) {
        import("i18next").then(i18n => i18n.default.changeLanguage(parsed.preferredLanguage));
      }
      return parsed;
    }
    return null;
  });

  useEffect(() => {
    if (user && (user._id || user.id)) {
      const uid = user._id || user.id;
      
      const onConnect = () => {
        socket.emit("join", uid);
        console.log(`Global Socket: User ${uid} re-joined`);
      };

      if (socket.connected) onConnect();
      socket.on("connect", onConnect);

      return () => socket.off("connect", onConnect);
    }
  }, [user]);

  const login = (data)=>{
    localStorage.setItem("token",data.token);
    localStorage.setItem("user", JSON.stringify(data.user)); 
    setUser(data.user);

    // ✅ SYNC UI LANGUAGE
    if (data.user.preferredLanguage) {
      import("i18next").then(module => {
        const i18n = module.default;
        i18n.changeLanguage(data.user.preferredLanguage);
      });
    }
  };

  const logout = ()=>{
    localStorage.clear();
    setUser(null);
  };

  return(
    <AuthContext.Provider value={{user,login,logout}}>
      {children}
    </AuthContext.Provider>
  );
};
