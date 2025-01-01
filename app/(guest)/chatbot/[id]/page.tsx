/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Avatar from "@/components/Avatar";
import Messages from "@/components/Messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GET_CHATBOT_BY_ID,
  GET_MESSAGES_BY_CHAT_SESSION_ID,
} from "@/graphql/query/queries";
import { startNewChat } from "@/lib/startNewChat";
import {
  GetChatbotByIdResponse,
  Message,
  MessagesByChatSessionIdResponse,
  MessagesByChatSessionIdVariables,
} from "@/types/types";
import { useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  message: z
    .string()
    .min(2, { message: "Message must be at least 2 characters long" }),
});

const ChatbotPage = ({ params: { id } }: { params: { id: string } }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  console.log("Messages", messages);

  const { data: chatBotData } = useQuery<GetChatbotByIdResponse>(
    GET_CHATBOT_BY_ID,
    {
      variables: {
        id: Number(id),
      },
    }
  );

  const {
    loading: loadingQuery,
    error,
    data,
  } = useQuery<
    MessagesByChatSessionIdResponse,
    MessagesByChatSessionIdVariables
  >(GET_MESSAGES_BY_CHAT_SESSION_ID, {
    variables: {
      chat_session_id: Number(chatId),
    },
    skip: !chatId,
  });

  useEffect(() => {
    if (data) {
      setMessages(data.chat_sessions.messages);
    }
  }, [data]);

  const handleInformationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const chatId = await startNewChat(name, email, Number(id));

    setChatId(chatId);
    setLoading(false);
    setIsOpen(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const { message: formMessage } = values;
    const message = formMessage.trim();
    form.reset();

    if (!name || !email) {
      setIsOpen(true);
      setLoading(false);
      return;
    }

    if (!message) {
      setLoading(false);
      return;
    }

    // Optimistically add the message to the UI
    const userMessage: Message = {
      id: Date.now(),
      content: message,
      created_at: new Date().toISOString(),
      sender: "user",
      chat_session_id: Number(chatId),
    };

    // Add show loading state for AI Response
    const loadingMessage: Message = {
      id: Date.now() + 1,
      content: "Thinking...",
      created_at: new Date().toISOString(),
      sender: "ai",
      chat_session_id: Number(chatId),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    // Send the message to the server
    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          content: message,
          chatbot_id: id,
          chat_session_id: chatId,
        }),
      });

      console.log("Response >>", response);

      const data = await response.json();
      console.log("Data >>", data);

      // explain: Update the loading for the AI with the Actual response from the server
      setMessages((prevMessages) => {
        const newMessages = prevMessages.map((msg) => {
          if (msg.id === loadingMessage.id) {
            return {
              ...msg,
              content: data.content,
              id: data.id,
            };
          }
          return msg;
        });

        return newMessages;
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="w-full flex bg-gray-100">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleInformationSubmit}>
              <DialogHeader className="flex justify-center items-center flex-col">
                <DialogTitle>Let&apos;s Help you out</DialogTitle>
                <DialogDescription>
                  I just need a few details to get started
                </DialogDescription>
              </DialogHeader>

              <div className="grid py-4 gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4 mt-4">
                  <Label htmlFor="username" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="username"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johndoe@gmail.com"
                    className="col-span-3"
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#64B5F5] text-white p-3 rounded-md"
                  disabled={!name || !email || loading}
                >
                  {loading ? "Continue..." : "Start New Chat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col w-full max-w-3xl mx-auto bg-white md:rounded-t-lg shadow-2xl md:mt-10">
          <div className="pb-4 border-b sticky top-0 z-50 bg-[#4D7DFB] py-5 px-10 text-white md:rounded-t-lg flex items-center space-x-4">
            <Avatar
              seed={chatBotData?.chatbots?.name ?? "default-seed"}
              className="h-12 w-12 bg-white rounded-full border-2 border-white "
            />
            <div>
              <h1 className="truncate text-lg">
                {chatBotData?.chatbots?.name}
              </h1>
              <p className="text-sm text-gray-300">
                ⚡ Typically Replies Instantly
              </p>
            </div>
          </div>

          <Messages
            messages={messages}
            chatbotname={chatBotData?.chatbots.name ?? "Chatbot"}
          />

          <form
            className="flex items-start sticky bottom-0 z-50 space-x-4 drop-shadow-sm p-4 bg-gray-100 rouned-md"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel hidden>Message</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Type a message..."
                      {...field}
                      className="p-8"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="bg-[#4D7DFB] text-white p-3 rounded-md ml-4"
              disabled={form.formState.isSubmitting || !form.formState.isValid}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </FormProvider>
  );
};

export default ChatbotPage;