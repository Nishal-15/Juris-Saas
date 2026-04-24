import { useParams } from "react-router-dom";
import LawyerChat from "../components/chat/LawyerChat";

export default function ChatPage() {
const { id } = useParams();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user._id || user.id;

  return ( <LawyerChat currentUser={currentUser} targetUser={id} />
);
}
