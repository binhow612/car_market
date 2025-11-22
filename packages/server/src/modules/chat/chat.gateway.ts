import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.query.token as string) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const userId = await this.verifyToken(token);

      if (!userId) {
        client.disconnect();
        return;
      }

      client.userId = userId;

      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client.id);
      this.userSockets.set(userId, userSockets);

      client.join(`user:${userId}`);

      const conversationsResponse =
        await this.chatService.getUserConversations(userId);
      for (const conversation of conversationsResponse.conversations) {
        void client.join(`conversation:${conversation.id}`);
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId) || [];
      const filtered = userSockets.filter((id) => id !== client.id);

      if (filtered.length > 0) {
        this.userSockets.set(client.userId, filtered);
      } else {
        this.userSockets.delete(client.userId);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return;
    }

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        client.userId,
        data.content,
      );
      this.server.to(`conversation:${data.conversationId}`).emit('newMessage', {
        conversationId: data.conversationId,
        message,
      });

      const conversation = await this.chatService.getConversationById(
        data.conversationId,
      );

      const otherUserId =
        conversation.conversation.buyerId === client.userId
          ? conversation.conversation.sellerId
          : conversation.conversation.buyerId;

      this.server.to(`user:${client.userId}`).emit('conversationUpdated', {
        conversation: conversation.conversation,
      });
      this.server.to(`user:${otherUserId}`).emit('conversationUpdated', {
        conversation: conversation.conversation,
      });

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    try {
      await this.chatService.updateTypingStatus(
        data.conversationId,
        client.userId,
        data.isTyping,
      );

      client.to(`conversation:${data.conversationId}`).emit('userTyping', {
        conversationId: data.conversationId,
        userId: client.userId,
        isTyping: data.isTyping,
      });
    } catch {
      // Handle error silently
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    try {
      await this.chatService.markMessagesAsRead(
        data.conversationId,
        client.userId,
      );

      const conversation = await this.chatService.getConversationById(
        data.conversationId,
      );

      const otherUserId =
        conversation.conversation.buyerId === client.userId
          ? conversation.conversation.sellerId
          : conversation.conversation.buyerId;

      this.server.to(`user:${otherUserId}`).emit('messagesRead', {
        conversationId: data.conversationId,
        readBy: client.userId,
      });
    } catch {
      // Handle error silently
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    void client.join(`conversation:${conversationId}`);
  }

  sendNotificationToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  private async verifyToken(token: string): Promise<string | null> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
      return payload.sub || payload.userId;
    } catch {
      return null;
    }
  }
}
