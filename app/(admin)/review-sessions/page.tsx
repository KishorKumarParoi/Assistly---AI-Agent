import ChatbotSessions from "@/components/ChatbotSessions";
import { GET_USER_CHATBOTS } from "@/graphql/query/queries";
import serverClient from "@/lib/server/serverClient";
import {
  Chatbot,
  GetUserChatbotsResponse,
  GetUserChatbotsVariables,
} from "@/types/types";
import { auth } from "@clerk/nextjs/server";

const ReviewSessions = async () => {
  const { userId } = await auth();
  console.log(userId);
  if (userId === null) return;

  const {
    data: { chatbotsByUser },
  } = await serverClient.query<
    GetUserChatbotsResponse,
    GetUserChatbotsVariables
  >({
    query: GET_USER_CHATBOTS,
    variables: {
      userId: userId,
    },
  });

  const sortedChatbotsByUser: Chatbot[] = chatbotsByUser.map((chatbot) => ({
    ...chatbot,
    chat_sessions: [...chatbot.chat_sessions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  }));

  return (
    <div className="flex-1 px-10">
      <h1 className="text-xl lg:text-3xl font-semibold mt-10">Chat Sessions</h1>
      <h2 className="mb-5">
        Review all the chat sessions you have had with your customers
      </h2>
      <ChatbotSessions chatbots={sortedChatbotsByUser} />
    </div>
  );
};

export default ReviewSessions;