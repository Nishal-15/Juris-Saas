import { useEffect } from "react";
import socket from "../socket";

export default function useNotification(userId) {

useEffect(() => {
socket.emit("join", userId);

```
socket.on("notification", (msg) => {
  alert("🔔 " + msg);
});

return () => socket.off("notification");
```

}, [userId]);

}
