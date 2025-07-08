export interface Chat {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Message {
    id: string;
    chatId: string;
    role: 'user' | 'assistant';
    content: string;
    imageUrl?: string;
    createdAt: Date;
  }