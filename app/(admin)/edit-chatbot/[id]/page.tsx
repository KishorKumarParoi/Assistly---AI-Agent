"use client";

import Avatar from "@/components/Avatar";
import Characteristic from "@/components/Characteristic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BASE_URL } from "@/graphql/ApolloClient";
import { DELETE_CHATBOT } from "@/graphql/mutation/mutations";
import { GET_CHATBOT_BY_ID } from "@/graphql/query/queries";
import { GetChatbotByIdResponse, GetChatbotByIdVariables } from "@/types/types";
import { useMutation, useQuery } from "@apollo/client";
import { Copy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EditChatBot = ({ params: { id } }: { params: { id: string } }) => {
  const [url, setUrl] = useState<string>("");
  const [chatbotname, setChatbotName] = useState<string>("");
  const [newCharacteristic, setNewCharacteristic] = useState<string>("");

  const [deleteChatbot] = useMutation(DELETE_CHATBOT, {
    refetchQueries: ["GetChatbotById"],
    awaitRefetchQueries: true,
  });

  const { data, loading, error } = useQuery<
    GetChatbotByIdResponse,
    GetChatbotByIdVariables
  >(GET_CHATBOT_BY_ID, {
    variables: {
      id,
    },
  });

  useEffect(() => {
    if (data) {
      setChatbotName(data.chatbots.name);
    }
  }, [data]);

  useEffect(() => {
    setUrl(`${BASE_URL}/chatbot/${id}`);
  }, [id]);

  const handleDeleteChatBot = async (id: string) => {
    const isConfirmed = confirm(
      "Are you sure you want to delete this chatbot?"
    );
    if (!isConfirmed) return;

    try {
      const promise = deleteChatbot({
        variables: {
          id,
        },
      });
      toast.promise(promise, {
        loading: "Deleting chatbot...",
        success: "Chatbot deleted successfully...",
        error: "Failed to delete chatbot...",
      });
    } catch (error) {
      console.error("Error Deleting chatbot: ", error);
      toast.error("Failed to delete chatbot...");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto animate-spin p-10">
        <Avatar seed="Assistly AI Support Agent" />
      </div>
    );
  }
  if (error) return <p>Error: {error.message}</p>;

  if (!data?.chatbots) return redirect("/view-chatbots");

  return (
    <div className="px-0 md:p-10">
      <div className="md:sticky md:top-0 z-50 sm:max-w-sm ml-auto space-y-2 md:border p-5 rounded-b-lg md:rounded-lg bg-[#2991EE]">
        <h2 className="text-white text-sm font-bold">Link to chat</h2>
        <p className="text-sm italic text-white">
          Share this link to your customers to start converstations with your
          chatbot.
        </p>
        <div className="flex items-center space-x-2">
          <Link
            href={url}
            className="w-full cursor-pointer hover:opacity-50 bg-white rounded-lg"
          >
            <Input value={url} readOnly className="cursor-pointer" />
          </Link>
          <Button
            size="sm"
            className="px-3"
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("Copied to clipboard");
            }}
          >
            <span className="sr-only">Copy</span>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <section className="relative mt-5 bg-white p-5 md:p-10 rounded-lg">
        <Button
          variant="destructive"
          className="absolute top-1 right-1 h-8 w-2"
          onClick={() => handleDeleteChatBot(id)}
        >
          X
        </Button>

        <div className="flex space-x-4">
          <Avatar seed={chatbotname} />
          <form
            // onSubmit={handleUpdateChatbot}
            className="flex flex-1 space-x-2 items-center"
          >
            <Input
              value={chatbotname}
              onChange={(e) => setChatbotName(e.target.value)}
              placeholder={chatbotname}
              className="w-full border-none bg-transparent text-xl font-bold"
              required
            />
            <Button type="submit" disabled={!chatbotname}>
              Update
            </Button>
          </form>
        </div>

        <h2 className="text-xl font-bold mt-10">
          Here is what your AI Knows...
        </h2>
        <p>
          Your chatbot is equipped with the following information to assist you
          in your conversations with your customers & users.
        </p>

        <div>
          <form action="">
            <Input
              type="text"
              placeholder="Examples: If Customers ask for Pricing page, Reply with the link to pricing page: www.example.com/pricing"
              value={newCharacteristic}
              onChange={(e) => setNewCharacteristic(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!newCharacteristic}
              className="mt-1"
            >
              Add
            </Button>
          </form>

          <ul className="flex flex-wrap-reverse gap-5">
            {data?.chatbots?.chatbot_characteristics?.map((characteristic) => (
              <Characteristic
                key={characteristic.id}
                characteristic={characteristic}
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default EditChatBot;