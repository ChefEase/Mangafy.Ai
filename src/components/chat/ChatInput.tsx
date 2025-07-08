import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import styles from './styles/ChatInput.module.css';

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  isLoading: boolean;
  costPerMessage: number; // Add cost per message prop
}

export default function ChatInput({ onSendMessage, isLoading, costPerMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!message.trim() && !imagePreview) return;
    
    onSendMessage(message, imagePreview || undefined);
    setMessage('');
    setImagePreview(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.container}>
      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt="Preview" />
          <button 
            onClick={() => setImagePreview(null)} 
            className={styles.removeImage}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.inputContainer}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.attachButton}
          disabled={isLoading}
          title="Upload image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className={styles.fileInput}
            disabled={isLoading}
          />
        </button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for character details or story ideas..."
          rows={1}
          className={styles.textInput}
          disabled={isLoading}
        />

<button
  onClick={handleSubmit}
  disabled={(!message.trim() && !imagePreview) || isLoading}
  className={styles.sendButton}
  title="Send message"
>
  <div className={styles.costAndIconWrapper}>
    <span className={styles.costIndicator}>
      {costPerMessage.toFixed(2)}
      <img src="/credit-icon.png" alt="Credits" className={styles.creditIcon} />
    </span>

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  </div>
</button>
      </div>
    </div>
  );
}