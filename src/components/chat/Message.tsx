import { Message } from '@/types/chat';
import styles from './styles/Message.module.css';

interface MessageProps {
  message: Message;
}

export default function MessageComponent({ message }: MessageProps) {
  return (
    <div className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
      {message.imageUrl && (
        <div className={styles.imageContainer}>
          <img 
            src={message.imageUrl} 
            alt="Uploaded content" 
            className={styles.messageImage}
          />
        </div>
      )}
      <div className={styles.messageContent}>
        {message.content?.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <div className={styles.messageTime}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}