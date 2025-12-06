import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntentClassificationService } from './services/intent-classification.service';
import { ResponseHandlerService } from './services/response-handler.service';
import { AssistantQueryDto } from './dto/assistant-query.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { User } from '../../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';
import { ChatbotConversation } from '../../entities/chatbot-conversation.entity';
import { ChatbotMessage, ChatbotMessageSender } from '../../entities/chatbot-message.entity';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly intentClassificationService: IntentClassificationService,
    private readonly responseHandlerService: ResponseHandlerService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ChatbotConversation)
    private readonly chatbotConversationRepository: Repository<ChatbotConversation>,
    @InjectRepository(ChatbotMessage)
    private readonly chatbotMessageRepository: Repository<ChatbotMessage>,
  ) {}

  async processQuery(
    queryDto: AssistantQueryDto,
    currentUser?: User,
  ): Promise<AssistantResponseDto> {
    try {
      this.logger.log(`Processing query: ${queryDto.query}`);

      // Get or create conversation
      let conversation: ChatbotConversation | null = null;
      if (currentUser && queryDto.conversationId) {
        conversation = await this.chatbotConversationRepository.findOne({
          where: { id: queryDto.conversationId, userId: currentUser.id },
        });
      }

      // Create new conversation if not exists and user is authenticated
      if (!conversation && currentUser) {
        conversation = this.chatbotConversationRepository.create({
          userId: currentUser.id,
        });
        conversation = await this.chatbotConversationRepository.save(conversation);
      }

      // Save user message if conversation exists
      if (conversation && currentUser) {
        const userMessage = this.chatbotMessageRepository.create({
          conversationId: conversation.id,
          content: queryDto.query,
          sender: ChatbotMessageSender.USER,
        });
        await this.chatbotMessageRepository.save(userMessage);
      }

      // Step 1: Classify user intent using LLM
      const { intent, confidence, extractedEntities } =
        await this.intentClassificationService.classifyIntent(queryDto.query);

      this.logger.log(
        `Intent classified as: ${intent} (confidence: ${confidence})`,
      );

      // Step 2: Handle the intent and generate response
      const response = await this.responseHandlerService.handleIntent(
        intent,
        queryDto.query,
        extractedEntities,
        currentUser,
      );

      // Save assistant response if conversation exists
      if (conversation && currentUser) {
        const assistantMessage = this.chatbotMessageRepository.create({
          conversationId: conversation.id,
          content: response.message,
          sender: ChatbotMessageSender.ASSISTANT,
        });
        await this.chatbotMessageRepository.save(assistantMessage);

        // Update conversation last message
        await this.chatbotConversationRepository.update(conversation.id, {
          lastMessage: response.message,
          lastMessageAt: new Date(),
        });

        // Add conversationId to response
        response.conversationId = conversation.id;
      }

      return response;
    } catch (error) {
      this.logger.error('Error processing query:', error);
      
      // Fallback response
      return {
        intent: null,
        message:
          "I'm having trouble understanding your question. Could you please rephrase it or try asking something else?",
        suggestions: [
          {
            id: '1',
            label: 'View all cars',
            query: 'Show me all available cars',
            icon: '🚗',
          },
          {
            id: '2',
            label: 'Get help',
            query: 'How can I buy a car?',
            icon: '❓',
          },
        ],
      };
    }
  }

  async getWelcomeMessage(userId?: string): Promise<AssistantResponseDto> {
    const welcomeMessage =
      "👋 Hi! I'm your car marketplace assistant. I can help you with:\n\n" +
      "🚗 Car specifications and features\n" +
      "📋 Available cars in our inventory\n" +
      "⚖️ Comparing different car models\n" +
      "❓ Frequently asked questions\n\n" +
      "How can I assist you today?";

    const response: AssistantResponseDto = {
      intent: null,
      message: welcomeMessage,
      suggestions: [
        {
          id: '1',
          label: 'Show available cars',
          query: 'What cars do you have available?',
          icon: '🚗',
        },
        {
          id: '2',
          label: 'Compare cars',
          query: 'Compare Honda Civic vs Toyota Corolla',
          icon: '⚖️',
        },
        {
          id: '3',
          label: 'Car specs',
          query: 'What are the specs of BMW X5?',
          icon: '📊',
        },
        {
          id: '4',
          label: 'How to buy',
          query: 'How do I buy a car from you?',
          icon: '❓',
        },
      ],
    };

    // Check for unread listing approval notifications
    if (userId) {
      try {
        const notificationsResponse =
          await this.notificationsService.getUserNotifications(
            userId,
            1,
            10,
            true, // unreadOnly
          );

        const approvalNotifications = notificationsResponse.notifications.filter(
          (notif) => notif.type === NotificationType.LISTING_APPROVED,
        );

        if (approvalNotifications.length > 0) {
          // Return notifications separately in data field
          response.data = {
            notifications: approvalNotifications.map((notif) => ({
              id: notif.id,
              message: notif.message,
              listingId: notif.relatedListingId,
              createdAt: notif.createdAt,
            })),
          };
        }
      } catch (error) {
        this.logger.error('Error fetching notifications for welcome message:', error);
        // Continue with normal welcome message if notification fetch fails
      }
    }

    return response;
  }

  async getOrCreateConversation(userId: string): Promise<ChatbotConversation> {
    // Get the most recent conversation or create a new one
    let conversation = await this.chatbotConversationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!conversation) {
      conversation = this.chatbotConversationRepository.create({
        userId,
      });
      conversation = await this.chatbotConversationRepository.save(conversation);
    }

    return conversation;
  }

  async getConversationWithMessages(
    conversationId: string,
    userId: string,
  ): Promise<{ conversation: ChatbotConversation; messages: ChatbotMessage[] }> {
    const conversation = await this.chatbotConversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = await this.chatbotMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return { conversation, messages };
  }

  async getUserConversations(
    userId: string,
    limit: number = 10,
  ): Promise<ChatbotConversation[]> {
    return this.chatbotConversationRepository.find({
      where: { userId },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }
}

