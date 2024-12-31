import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { GET_CHATBOTS_BY_USER } from "@/graphql/query/queries";
import serverClient from "@/lib/server/serverClient";
import {
  Chatbot,
  GetChatbotsByUserData,
  GetChatbotsByUserVariables,
} from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ViewChatbots = async () => {
  const { userId } = await auth();
  console.log(userId);
  if (userId === null) return;

  // Get the chatbots for the user
  const {
    data: { chatbotsByUser },
    loading,
    error,
  } = await serverClient.query<
    GetChatbotsByUserData,
    GetChatbotsByUserVariables
  >({
    query: GET_CHATBOTS_BY_USER,
    variables: {
      clerk_user_id: userId,
    },
  });

  const sortedChatbotsByUser: Chatbot[] = [...chatbotsByUser].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  console.log("Chatbots by user >>", sortedChatbotsByUser);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex-1 pb-20 p-10">
      <h1 className="text-xl lg:text-3xl font-semibold mb-5">
        Active Chatbots
      </h1>

      {sortedChatbotsByUser.length === 0 && (
        <div>
          <p>
            You have not created any chatbots yet. Click the button below to
            create a new chatbot.
          </p>
          <Link href={"/create-chatbot"}>
            <Button className="bg-[#64B5F5] textw-white p-3 rounded-md mt-5">
              Create Chatbot
            </Button>
          </Link>
        </div>
      )}

      <ul className="flex flex-col space-y-5">
        {sortedChatbotsByUser.map((chatbot) => (
          <Link key={chatbot.id} href={`/edit-chatbot/${chatbot.id}`}>
            <li className="relative p-10 border rounded-md max-w-3xl bg-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Avatar seed={chatbot.name} />
                  <h2 className="text-xl font-bold">{chatbot.name}</h2>
                </div>

                <p className="absolute top-5 right-5 text-xs text-gray-400">
                  Created: {new Date(chatbot.created_at).toLocaleDateString()}
                </p>
              </div>

              <hr className="mt-2" />

              <div className="grid grid-cols-2 gap-10 md:gap-5 p-5">
                <h3 className="italic">Characteristic</h3>
                <ul>
                  {!chatbot.chatbot_characteristics.length && (
                    <p>No Characteristics added yet</p>
                  )}
                  {chatbot.chatbot_characteristics.map((characteristic) => (
                    <li
                      key={characteristic.id}
                      className="list-disc bg-gray-100 m-2 p-2 break-words"
                    >
                      {characteristic.content}
                    </li>
                  ))}
                </ul>
                <h3 className="italic">No of Sessions: </h3>
                <p>{chatbot.chat_sessions.length}</p>
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default ViewChatbots;