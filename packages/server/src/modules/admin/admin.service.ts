import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import {
  ListingDetail,
  ListingStatus,
} from '../../entities/listing-detail.entity';
import { Transaction } from '../../entities/transaction.entity';
import { ListingPendingChanges } from '../../entities/listing-pending-changes.entity';
import { CarDetail } from '../../entities/car-detail.entity';
import { CarImage, ImageType } from '../../entities/car-image.entity';
import { LogsService } from '../logs/logs.service';
import { LogLevel, LogCategory } from '../../entities/activity-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ListingPendingChanges)
    private readonly pendingChangesRepository: Repository<ListingPendingChanges>,
    @InjectRepository(CarDetail)
    private readonly carDetailRepository: Repository<CarDetail>,
    @InjectRepository(CarImage)
    private readonly carImageRepository: Repository<CarImage>,
    private readonly logsService: LogsService,
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'isEmailVerified',
        'phoneNumber',
        'location',
        'bio',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingListings(page: number = 1, limit: number = 10) {
    const [listings, total] = await this.listingRepository.findAndCount({
      where: { status: ListingStatus.PENDING },
      relations: ['carDetail', 'carDetail.images', 'seller'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveListing(
    listingId: string,
    adminUserId: string,
  ): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['seller', 'carDetail'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    try {
      // Apply any pending changes first
      const pendingChanges = await this.pendingChangesRepository.find({
        where: { listingId, isApplied: false },
      });

      // Track if we've already deleted images to avoid multiple deletions
      let imagesDeleted = false;

      for (const change of pendingChanges) {
        // Apply the changes to the listing (exclude images as they're handled separately)
        if (
          change.changes.listing &&
          Object.keys(change.changes.listing).length > 0
        ) {
          const { images, ...listingChanges } = change.changes.listing;
          if (Object.keys(listingChanges).length > 0) {
            await this.listingRepository.update(listingId, listingChanges);
          }
        }

        // Apply car detail changes (exclude images as they're handled separately)
        if (
          change.changes.carDetail &&
          Object.keys(change.changes.carDetail).length > 0
        ) {
          const { images, ...carDetailChanges } = change.changes.carDetail;
          if (Object.keys(carDetailChanges).length > 0) {
            await this.carDetailRepository.update(
              listing.carDetailId,
              carDetailChanges,
            );
          }
        }

        // Apply image changes if present
        if (change.changes.images && Array.isArray(change.changes.images)) {
          const images = change.changes.images;
          if (images.length > 0) {
            // Delete existing images first to avoid conflicts (only once)
            if (!imagesDeleted) {
              await this.carImageRepository.delete({
                carDetailId: listing.carDetailId,
              });
              imagesDeleted = true;
            }

            // Create and save new images
            const carImages = images.map((image, index) =>
              this.carImageRepository.create({
                filename: image.filename,
                originalName: image.originalName,
                url: image.url,
                type: (image.type as ImageType) || ImageType.EXTERIOR,
                sortOrder: index,
                isPrimary: index === 0,
                alt: image.alt,
                carDetailId: listing.carDetailId,
                fileSize: image.fileSize || 0,
                mimeType: image.mimeType || 'image/jpeg',
              }),
            );
            await this.carImageRepository.save(carImages);
          }
        }

        // Mark the pending change as applied
        await this.pendingChangesRepository.update(change.id, {
          isApplied: true,
          appliedAt: new Date(),
          appliedByUserId: adminUserId,
        });
      }

      // Update listing status to approved
      await this.listingRepository.update(listingId, {
        status: ListingStatus.APPROVED,
        approvedAt: new Date(),
      });

      // Log the approval action
      await this.logsService.createLog({
        level: LogLevel.INFO,
        category: LogCategory.ADMIN_ACTION,
        message: 'Listing approved by admin',
        description: `Listing "${listing.title}" has been approved and is now live`,
        userId: adminUserId,
        listingId: listingId,
        targetUserId: listing.sellerId,
        metadata: {
          listingTitle: listing.title,
          sellerEmail: listing.seller?.email,
          pendingChangesApplied: pendingChanges.length,
        },
      });

      return { message: 'Listing approved successfully' };
    } catch (error) {
      // Log the error for debugging with full details
      console.error('Error approving listing:', error);
      console.error('Listing ID:', listingId);
      console.error('Admin User ID:', adminUserId);
      
      // Re-throw the original error for better debugging
      throw error;
    }
  }

  async rejectListing(
    listingId: string,
    reason?: string,
    adminUserId?: string,
  ): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.listingRepository.update(listingId, {
      status: ListingStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    // Log the rejection action
    await this.logsService.createLog({
      level: LogLevel.WARNING,
      category: LogCategory.ADMIN_ACTION,
      message: 'Listing rejected by admin',
      description: `Listing "${listing.title}" has been rejected${reason ? ` with reason: ${reason}` : ''}`,
      userId: adminUserId,
      listingId: listingId,
      targetUserId: listing.sellerId,
      metadata: {
        listingTitle: listing.title,
        sellerEmail: listing.seller?.email,
        rejectionReason: reason,
      },
    });

    return { message: 'Listing rejected successfully' };
  }

  async getListingWithPendingChanges(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['carDetail', 'carDetail.images', 'seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get only non-applied pending changes
    const pendingChanges = await this.pendingChangesRepository.find({
      where: { listingId, isApplied: false },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...listing,
      pendingChanges,
    };
  }

  async getTransactions(page: number = 1, limit: number = 10) {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        relations: ['buyer', 'seller', 'listing'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const totalListings = await this.listingRepository.count();
    const pendingListings = await this.listingRepository.count({
      where: { status: ListingStatus.PENDING },
    });
    const totalTransactions = await this.transactionRepository.count();

    return {
      totalUsers,
      totalListings,
      pendingListings,
      totalTransactions,
    };
  }

  // Enhanced listing management
  async getAllListings(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) {
    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('listing.carDetail', 'carDetail')
      .leftJoinAndSelect('carDetail.images', 'images')
      .orderBy('listing.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('listing.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(listing.title ILIKE :search OR seller.firstName ILIKE :search OR seller.lastName ILIKE :search OR carDetail.make ILIKE :search OR carDetail.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [listings, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getListingById(id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'carDetail', 'carDetail.images', 'carImages'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async updateListingStatus(id: string, status: string, reason?: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    listing.status = status as ListingStatus;
    if (reason) {
      listing.rejectionReason = reason;
    }

    return this.listingRepository.save(listing);
  }

  async deleteListing(id: string, reason?: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Soft delete by setting status to INACTIVE
    listing.status = ListingStatus.INACTIVE;
    if (reason) {
      listing.rejectionReason = reason;
    }

    return this.listingRepository.save(listing);
  }

  async toggleFeatured(id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    listing.isFeatured = !listing.isFeatured;
    return this.listingRepository.save(listing);
  }

  // Enhanced user management
  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'isEmailVerified',
        'phoneNumber',
        'location',
        'bio',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean, reason?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role as UserRole;
    return this.userRepository.save(user);
  }

  async getUserListings(userId: string, page: number = 1, limit: number = 10) {
    const [listings, total] = await this.listingRepository.findAndCount({
      where: { sellerId: userId },
      relations: ['carDetail', 'carDetail.images', 'seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Analytics and reports
  async getAnalyticsOverview() {
    const [
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      totalTransactions,
    ] = await Promise.all([
      this.userRepository.count(),
      this.listingRepository.count(),
      this.listingRepository.count({
        where: { status: ListingStatus.APPROVED },
      }),
      this.listingRepository.count({
        where: { status: ListingStatus.PENDING },
      }),
      this.transactionRepository.count(),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentUsers, recentListings] = await Promise.all([
      this.userRepository.count({
        where: {
          createdAt: MoreThanOrEqual(sevenDaysAgo),
        },
      }),
      this.listingRepository.count({
        where: {
          createdAt: MoreThanOrEqual(sevenDaysAgo),
        },
      }),
    ]);

    return {
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      totalTransactions,
      recentUsers,
      recentListings,
    };
  }

  async getListingAnalytics(period: string = '30d') {
    // This would typically involve more complex date calculations
    // For now, returning basic stats
    const totalListings = await this.listingRepository.count();
    const activeListings = await this.listingRepository.count({
      where: { status: ListingStatus.APPROVED },
    });
    const pendingListings = await this.listingRepository.count({
      where: { status: ListingStatus.PENDING },
    });

    return {
      totalListings,
      activeListings,
      pendingListings,
      period,
    };
  }

  async getUserAnalytics(period: string = '30d') {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });

    return {
      totalUsers,
      activeUsers,
      period,
    };
  }
}
