import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { ListingDetail, ListingStatus } from '../../../entities/listing-detail.entity';
import { Favorite } from '../../../entities/favorite.entity';
import { ChatConversation } from '../../../entities/chat-conversation.entity';
import { ChatMessage } from '../../../entities/chat-message.entity';

export interface UserContextData {
  profile: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
    bio: string;
    memberSince: Date;
  };
  listings: {
    active: number;
    total: number;
    recentListings: Array<{
      id: string;
      title: string;
      price: number;
      status: string;
      make: string;
      model: string;
      year: number;
      createdAt: Date;
    }>;
  };
  favorites: {
    count: number;
    recentFavorites: Array<{
      id: string;
      title: string;
      price: number;
      make: string;
      model: string;
      year: number;
      addedAt: Date;
    }>;
  };
  conversations: {
    total: number;
    unreadCount: number;
    activeConversations: number;
    recentConversations: Array<{
      id: string;
      listingTitle: string;
      otherPartyName: string;
      lastMessage: string;
      lastMessageAt: Date;
    }>;
  };
}

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  /**
   * Aggregate all user-related data for context
   */
  async getUserContext(userId: string): Promise<UserContextData> {
    try {
      const [user, listings, favorites, conversations] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserListings(userId),
        this.getUserFavorites(userId),
        this.getUserConversations(userId),
      ]);

      return {
        profile: user,
        listings,
        favorites,
        conversations,
      };
    } catch (error) {
      this.logger.error('Error fetching user context:', error);
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  private async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location,
      bio: user.bio,
      memberSince: user.createdAt,
    };
  }

  /**
   * Get user's listings statistics and recent listings
   */
  private async getUserListings(userId: string) {
    const [recentListings, activeCount, totalCount] = await Promise.all([
      this.listingRepository.find({
        where: { sellerId: userId },
        relations: ['carDetail'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.listingRepository.count({
        where: { sellerId: userId, status: ListingStatus.APPROVED },
      }),
      this.listingRepository.count({
        where: { sellerId: userId },
      }),
    ]);

    return {
      active: activeCount,
      total: totalCount,
      recentListings: recentListings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
        make: listing.carDetail?.make || '',
        model: listing.carDetail?.model || '',
        year: listing.carDetail?.year || 0,
        createdAt: listing.createdAt,
      })),
    };
  }

  /**
   * Get user's favorites
   */
  private async getUserFavorites(userId: string) {
    const [favorites, totalCount] = await Promise.all([
      this.favoriteRepository.find({
        where: { userId },
        relations: ['listing', 'listing.carDetail'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.favoriteRepository.count({
        where: { userId },
      }),
    ]);

    return {
      count: totalCount,
      recentFavorites: favorites.map((fav) => ({
        id: fav.listing.id,
        title: fav.listing.title,
        price: fav.listing.price,
        make: fav.listing.carDetail?.make || '',
        model: fav.listing.carDetail?.model || '',
        year: fav.listing.carDetail?.year || 0,
        addedAt: fav.createdAt,
      })),
    };
  }

  /**
   * Get user's chat conversations
   */
  private async getUserConversations(userId: string) {
    const [recentConversations, totalCount] = await Promise.all([
      this.conversationRepository.find({
        where: [{ buyerId: userId }, { sellerId: userId }],
        relations: ['buyer', 'seller', 'listing'],
        order: { lastMessageAt: 'DESC' },
        take: 5,
      }),
      this.conversationRepository.count({
        where: [{ buyerId: userId }, { sellerId: userId }],
      }),
    ]);

    // Count unread messages (messages NOT sent by this user and not read)
    let unreadCount = 0;
    if (recentConversations.length > 0) {
      // Get all conversation IDs for this user
      const allConversations = await this.conversationRepository.find({
        where: [{ buyerId: userId }, { sellerId: userId }],
        select: ['id'],
      });
      
      const conversationIds = allConversations.map((c) => c.id);
      
      // Get all unread messages in user's conversations where user is NOT the sender
      unreadCount = await this.messageRepository
        .createQueryBuilder('message')
        .where('message.conversationId IN (:...conversationIds)', {
          conversationIds,
        })
        .andWhere('message.senderId != :userId', { userId })
        .andWhere('message.isRead = :isRead', { isRead: false })
        .getCount();
    }

    // Count active conversations (those with messages in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeConversations = recentConversations.filter(
      (conv) => conv.lastMessageAt && conv.lastMessageAt > sevenDaysAgo,
    ).length;

    return {
      total: totalCount,
      unreadCount,
      activeConversations,
      recentConversations: recentConversations.map((conv) => {
        const otherParty = conv.buyerId === userId ? conv.seller : conv.buyer;
        return {
          id: conv.id,
          listingTitle: conv.listing?.title || 'Unknown listing',
          otherPartyName: otherParty?.fullName || 'Unknown user',
          lastMessage: conv.lastMessage || '',
          lastMessageAt: conv.lastMessageAt,
        };
      }),
    };
  }

  /**
   * Format user context for LLM prompt
   */
  formatContextForPrompt(context: UserContextData): string {
    const lines: string[] = [
      '=== USER PROFILE ===',
      `Name: ${context.profile.fullName}`,
      `Email: ${context.profile.email}`,
      context.profile.phoneNumber && `Phone: ${context.profile.phoneNumber}`,
      context.profile.location && `Location: ${context.profile.location}`,
      context.profile.bio && `Bio: ${context.profile.bio}`,
      `Member since: ${context.profile.memberSince.toLocaleDateString()}`,
      '',
      '=== LISTINGS ===',
      `Active listings: ${context.listings.active}`,
      `Total listings: ${context.listings.total}`,
    ];

    if (context.listings.recentListings.length > 0) {
      lines.push('Recent listings:');
      context.listings.recentListings.forEach((listing) => {
        lines.push(
          `  - ${listing.year} ${listing.make} ${listing.model} ($${listing.price}) - Status: ${listing.status}`,
        );
      });
    }

    lines.push(
      '',
      '=== FAVORITES ===',
      `Total favorites: ${context.favorites.count}`,
    );

    if (context.favorites.recentFavorites.length > 0) {
      lines.push('Recent favorites:');
      context.favorites.recentFavorites.forEach((fav) => {
        lines.push(
          `  - ${fav.year} ${fav.make} ${fav.model} ($${fav.price})`,
        );
      });
    }

    lines.push(
      '',
      '=== CONVERSATIONS ===',
      `Total conversations: ${context.conversations.total}`,
      `Active conversations: ${context.conversations.activeConversations}`,
      `Unread messages: ${context.conversations.unreadCount}`,
    );

    if (context.conversations.recentConversations.length > 0) {
      lines.push('Recent conversations:');
      context.conversations.recentConversations.forEach((conv) => {
        lines.push(
          `  - With ${conv.otherPartyName} about "${conv.listingTitle}"`,
        );
        if (conv.lastMessage) {
          lines.push(`    Last: "${conv.lastMessage.substring(0, 50)}..."`);
        }
      });
    }

    return lines.filter(Boolean).join('\n');
  }
}

