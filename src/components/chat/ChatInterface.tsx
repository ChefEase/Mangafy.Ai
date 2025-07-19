import { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '@/types/chat';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import MessageComponent from './Message';
import styles from './styles/ChatInterface.module.css';
import { saveNewChat, saveMessage } from '@/lib/airtable';
import { useCredits } from '@/context/CreditContext'; // Add this import



export default function ChatInterface() {
  const { credits, deductCredits, addCredits } = useCredits(); // Get credit functions
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_COST_PER_MESSAGE = 0.05; // Cost per AI response
  const [chatRecords, setChatRecords] = useState<any[]>([]);
const [messageRecords, setMessageRecords] = useState<any[]>([]);


  useEffect(() => {
    const loadData = async () => {
      try {
        const chatRes = await fetch("https://api.airtable.com/v0/apppD5DROHf5ImEYG/Chats", {
          headers: {
            Authorization: `Bearer patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99`
          }
        });
        const messageRes = await fetch("https://api.airtable.com/v0/apppD5DROHf5ImEYG/Messages", {
          headers: {
            Authorization: `Bearer patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99`
          }
        });
    
        const chatData = await chatRes.json();
        const messageData = await messageRes.json();
        setChatRecords(chatData.records || []);
        setMessageRecords(messageData.records || []);

        if (!chatData.records || !messageData.records) {
          console.error("Failed to load records");
          return;
        }

        const chats: Chat[] = chatData.records.map((record: any) => ({
          id: record.id,
          title: record.fields.title || 'Untitled Chat',
          createdAt: record.fields.createdAt ? new Date(record.fields.createdAt) : new Date(),
          updatedAt: record.fields.updatedAt ? new Date(record.fields.updatedAt) : new Date(),

        }));
    
        const messages: Message[] = messageData.records.map((record: any) => ({
          id: record.id,
          chatId: record.fields.chatId,
          role: record.fields.role,
          content: record.fields.content,
          imageUrl: Array.isArray(record.fields.imageUrl) && record.fields.imageUrl.length > 0
            ? record.fields.imageUrl[0].url
            : undefined,
          createdAt: record.fields.createdAt ? new Date(record.fields.createdAt) : new Date(),

        }));
        messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());


        setChats(chats);
        setMessages(messages);
      } catch (err) {
        console.error("❌ Failed to load Airtable data:", err);
      }
    };
    
  
    loadData();
  }, []);
  
  const createNewChat = async (title: string) => {
    const now = new Date();
    const AIRTABLE_TOKEN = "patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99";
    const userId = localStorage.getItem("userId"); // 🔐 make sure you save this on login

    const chats: Chat[] = chatRecords
    .filter((record: any) => record.fields.userId === userId)
    .map(record => ({
      id: record.id,
      title: record.fields.title || 'Untitled Chat',
      createdAt: record.fields.createdAt ? new Date(record.fields.createdAt) : new Date(),
      updatedAt: record.fields.updatedAt ? new Date(record.fields.updatedAt) : new Date(),
    }));
  

    const res = await fetch("https://api.airtable.com/v0/apppD5DROHf5ImEYG/Chats", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          title,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          userId,
        },
      }),
    });
  
    const data = await res.json();
  
    const newChat: Chat = {
      id: data.id, // ✅ Use Airtable record ID
      title,
      createdAt: now,
      updatedAt: now,
    };
  
    setChats(prev => [...prev, newChat]);
    setCurrentChat(newChat);
  };
  
  const deleteChat = async (chatId: string) => {
    try {
      const AIRTABLE_TOKEN = "patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99";
      const AIRTABLE_BASE_ID = "apppD5DROHf5ImEYG";
  
      // Optimistically remove chat and messages from UI
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      setMessages(prev => prev.filter(msg => msg.chatId !== chatId));
  
      // 🔥 Step 1: Delete the chat from Chats table
      const chatDeleteRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });
  
      if (!chatDeleteRes.ok) {
        console.error("❌ Failed to delete chat from Airtable");
      }
  
      // 🔥 Step 2: Fetch all messages from the chat
      const msgQueryRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Messages?filterByFormula=chatId='${chatId}'`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
        }
      );
  
      const msgData = await msgQueryRes.json();
      const messageIdsToDelete = msgData.records?.map((record: any) => record.id) || [];
  
      // 🔥 Step 3: Delete each message from the Messages table
      for (const messageId of messageIdsToDelete) {
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Messages/${messageId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
        });
      }
  
      console.log("✅ Chat and messages deleted");
    } catch (err) {
      console.error("❌ Error deleting chat and messages:", err);
    }
  };
  

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!currentChat || (!content.trim() && !imageUrl)) return;
  
    if (credits < CHAT_COST_PER_MESSAGE) {
      alert(`You need at least ${CHAT_COST_PER_MESSAGE} credits to send a message`);
      return;
    }
const userId = localStorage.getItem("userId");

const messages: Message[] = messageRecords
  .filter((record: any) => record.fields.userId === userId)
  .map(record => ({
    id: record.id,
    chatId: record.fields.chatId,
    role: record.fields.role,
    content: record.fields.content,
    imageUrl: Array.isArray(record.fields.imageUrl) && record.fields.imageUrl.length > 0
      ? record.fields.imageUrl[0].url
      : undefined,
    createdAt: record.fields.createdAt ? new Date(record.fields.createdAt) : new Date(),
  }));

    const userMessage: Message = {
      id: '', // temporary placeholder
      chatId: currentChat.id,
      role: 'user',
      content,
      imageUrl,
      createdAt: new Date(),
    };
  
    setIsLoading(true);
    const AIRTABLE_TOKEN = "patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99";
    let didDeduct = false;
    try{
        // Deduct credits first
        const deductionSuccess = await deductCredits(CHAT_COST_PER_MESSAGE);
        
        if (!deductionSuccess) {
          alert("Failed to deduct credits. Please try again.");
          return;
        }
        didDeduct = true;

        const userRes = await fetch("https://api.airtable.com/v0/apppD5DROHf5ImEYG/Messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              chatId: userMessage.chatId,
              role: userMessage.role,
              content: userMessage.content,
              imageUrl: userMessage.imageUrl ? [{ url: userMessage.imageUrl }] : [],
              createdAt: userMessage.createdAt.toISOString(),
              userId, // ✅ save userId on message too
            },
          }),
        });

        const userResult = await userRes.json();
        if (userResult.id) {
          userMessage.id = userResult.id;
          setMessages(prev => [...prev, userMessage]);
        }        

        const hfMessages = [...messages, userMessage].map(msg => {
          const blocks = [];
        
          if (msg.content) {
            blocks.push({ type: "text", text: msg.content });
          }
        
          if (msg.imageUrl) {
            blocks.push({ type: "image_url", image_url: { url: msg.imageUrl } });
          }
        
          return {
            role: msg.role,
            content: blocks
          };
        });
        
        const userContentBlocks: { type: string; text?: string; image_url?: { url: string } }[] = [];
        if (content.trim()) {
          userContentBlocks.push({ type: "text", text: content });
        }
        if (imageUrl) {
          userContentBlocks.push({ type: "image_url", image_url: { url: imageUrl } });
        }
    
        hfMessages.push({
          role: "user",
          content: [
            ...(content ? [{ type: "text", text: content }] : []),
            ...(imageUrl ? [{ type: "image_url", image_url: { url: imageUrl } }] : [])
          ]
        });
     
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: hfMessages }),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "API error");
        }
  
        const assistantMessage: Message = {
          id: crypto.randomUUID(), // or a simple UUID library
          chatId: currentChat.id,
          role: 'assistant',
          content: data.content || data.choices?.[0]?.message?.content || "No response",
          createdAt: new Date(),
        };
    
        // ✅ Save assistant message to Airtable
        const assistantRes = await fetch("https://api.airtable.com/v0/apppD5DROHf5ImEYG/Messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              chatId: assistantMessage.chatId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              imageUrl: '',
              createdAt: assistantMessage.createdAt.toISOString(),
            },
          }),
        });
     
        const assistantResult = await assistantRes.json();
      assistantMessage.id = assistantResult.id; // ✅ Airtable record ID 
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Optional: update chat title if it's the first message
      if (content && currentChat?.title === "Untitled Chat") {
        const newTitle = content.length > 20 ? `${content.substring(0, 20)}...` : content;
        const now = new Date();
  
        setChats(prev =>
          prev.map(chat =>
            chat.id === currentChat.id
              ? { ...chat, title: newTitle, updatedAt: now }
              : chat
          )
        );
  
        // ✅ Update chat title in Airtable
        await fetch(`https://api.airtable.com/v0/apppD5DROHf5ImEYG/Chats/${currentChat.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              title: newTitle,
              updatedAt: now.toISOString(),
            },
          }),
        });
      }
  } catch (error: any) {
    if (didDeduct) {
      await addCredits(CHAT_COST_PER_MESSAGE);
    }
    
    console.error('Error sending message:', error);
    alert(`Failed to send message: ${error.message || 'Unknown error'}. Credits have been refunded.`);
  } finally {
    setIsLoading(false);
  }
    };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.container}>
      <ChatHistory 
        chats={chats}
        currentChat={currentChat}
        onSelectChat={(chat) => {
          setCurrentChat(chat);
        }}
        onCreateNewChat={() => createNewChat("Untitled Chat")}
        onDeleteChat={(chatId) => deleteChat(chatId)}
      />

      <div className={styles.chatArea}>
        {currentChat ? (
          <>
            <div className={styles.messagesContainer}>
              {messages
                .filter(msg => msg.chatId === currentChat.id)
                .map(message => (
                  <MessageComponent key={message.id} message={message} />
                ))}
              <div ref={messagesEndRef} />
              
              {isLoading && (
                <div className={styles.typingIndicator}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              )}
            </div>

            <ChatInput 
              onSendMessage={sendMessage}
              isLoading={isLoading}
              costPerMessage={CHAT_COST_PER_MESSAGE} // Pass the cost
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <h2>Story Assistant</h2>
            <p>Upload images for character descriptions or ask for story ideas</p>
            <button  onClick={() => createNewChat("Untitled Chat")}
              className={styles.newChatButton}>
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}