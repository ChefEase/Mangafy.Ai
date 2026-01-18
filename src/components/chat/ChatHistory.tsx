import { Chat } from '@/types/chat';
import styles from './styles/ChatHistory.module.css';

interface ChatHistoryProps {
  chats: Chat[];
  currentChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function ChatHistory({ 
  chats, 
  currentChat, 
  onSelectChat, 
  onCreateNewChat,
  onDeleteChat
}: ChatHistoryProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div>
          <h2>Story Sessions</h2>
          <p className={styles.subtitle}>Your manga ideas, saved here</p>
        </div>
        <button onClick={onCreateNewChat} className={styles.newChatButton}>
          New Story
        </button>
      </div>

      <div className={styles.chatList}>
        <div className={styles.sectionLabel}>Recent Conversations</div>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${currentChat?.id === chat.id ? styles.active : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className={styles.chatInfo}>
              <div className={styles.chatTitle}>{chat.title}</div>
              <div className={styles.chatDate}>
                {chat.updatedAt.toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className={styles.deleteButton}
              title="Delete chat"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
