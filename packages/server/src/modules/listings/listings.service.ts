import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ListingDetail,
  ListingStatus,
} from '../../entities/listing-detail.entity';
import { CarDetail } from '../../entities/car-detail.entity';
import { CarImage, ImageType } from '../../entities/car-image.entity';
import { ListingPendingChanges } from '../../entities/listing-pending-changes.entity';
import {
  Transaction,
  TransactionStatus,
  PaymentMethod,
} from '../../entities/transaction.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { hasActualChanges } from '../../utils/value-comparison.util';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
    @InjectRepository(CarDetail)
    private readonly carDetailRepository: Repository<CarDetail>,
    @InjectRepository(CarImage)
    private readonly carImageRepository: Repository<CarImage>,
    @InjectRepository(ListingPendingChanges)
    private readonly pendingChangesRepository: Repository<ListingPendingChanges>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly logsService: LogsService,
  ) {}

  async create(
    userId: string,
    createListingDto: CreateListingDto,
  ): Promise<ListingDetail> {
    const { carDetail, images, ...listingData } = createListingDto;

    // Create car detail
    const newCarDetail = this.carDetailRepository.create(carDetail);
    const savedCarDetail = await this.carDetailRepository.save(newCarDetail);

    // Create listing
    const listing = this.listingRepository.create({
      ...listingData,
      sellerId: userId,
      carDetailId: savedCarDetail.id,
      status: ListingStatus.PENDING,
    });

    const savedListing = await this.listingRepository.save(listing);

    // Create car images if provided
    if (images && images.length > 0) {
      const carImages = images.map((image, index) =>
        this.carImageRepository.create({
          filename: image.filename,
          originalName: image.originalName,
          url: image.url,
          type: (image.type as ImageType) || ImageType.EXTERIOR,
          sortOrder: index,
          isPrimary: index === 0,
          alt: image.alt,
          carDetailId: savedCarDetail.id,
          fileSize: image.fileSize || 0,
          mimeType: image.mimeType || 'image/jpeg',
        }),
      );
      await this.carImageRepository.save(carImages);
    }

    // Log the listing creation
    await this.logsService.logListingAction(
      userId,
      savedListing.id,
      'created',
      {
        title: savedListing.title,
        price: savedListing.price,
        make: carDetail.make,
        model: carDetail.model,
        year: carDetail.year,
      },
    );

    return this.findOne(savedListing.id);
  }

  async findAll(page: number = 1, limit: number = 10) {
    // Get all active listings (both approved and sold) with proper ordering
    const [listings, total] = await this.listingRepository.findAndCount({
      where: [
        { status: ListingStatus.APPROVED, isActive: true },
        { status: ListingStatus.SOLD, isActive: true },
      ],
      relations: ['carDetail', 'carDetail.images', 'seller'],
      order: {
        status: 'ASC', // Approved first, then sold
        createdAt: 'DESC',
      },
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

  async findOne(id: string): Promise<ListingDetail> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['carDetail', 'carDetail.images', 'seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count
    await this.listingRepository.update(id, {
      viewCount: listing.viewCount + 1,
    });

    return listing;
  }

  async update(
    id: string,
    userId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<ListingDetail> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['carDetail'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const { carDetail, images, ...listingData } = updateListingDto;

    // Store original values for comparison
    const originalValues = {
      ...listing,
      carDetail: listing.carDetail,
    };

    // Prepare changes object
    const changes: Record<string, any> = {};
    const carDetailChanges: Record<string, any> = {};

    // Check for listing changes
    Object.keys(listingData).forEach((key) => {
      if (
        listingData[key] !== undefined &&
        hasActualChanges(originalValues[key], listingData[key])
      ) {
        changes[key] = listingData[key];
      }
    });

    // Check for car detail changes
    if (carDetail) {
      Object.keys(carDetail).forEach((key) => {
        if (
          carDetail[key] !== undefined &&
          hasActualChanges(originalValues.carDetail[key], carDetail[key])
        ) {
          carDetailChanges[key] = carDetail[key];
        }
      });
    }

    // If there are changes, store them as pending changes
    if (
      Object.keys(changes).length > 0 ||
      Object.keys(carDetailChanges).length > 0 ||
      (images && images.length > 0)
    ) {
      const pendingChange = this.pendingChangesRepository.create({
        listingId: id,
        changedByUserId: userId,
        changes: {
          listing: changes,
          carDetail: carDetailChanges,
          images: images || [],
        },
        originalValues: {
          listing: originalValues,
          carDetail: originalValues.carDetail,
        },
      });

      await this.pendingChangesRepository.save(pendingChange);

      // Only update status to pending if there are actual changes
      if (listing.status !== ListingStatus.PENDING) {
        await this.listingRepository.update(id, {
          status: ListingStatus.PENDING,
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.listingRepository.remove(listing);

    return { message: 'Listing deleted successfully' };
  }

  async getPendingChanges(listingId: string): Promise<ListingPendingChanges[]> {
    return this.pendingChangesRepository.find({
      where: { listingId, isApplied: false },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async applyPendingChanges(
    listingId: string,
    pendingChangeId: string,
    appliedByUserId: string,
  ): Promise<ListingDetail> {
    const pendingChange = await this.pendingChangesRepository.findOne({
      where: { id: pendingChangeId, listingId, isApplied: false },
    });

    if (!pendingChange) {
      throw new NotFoundException('Pending change not found');
    }

    const { changes } = pendingChange;

    // Apply listing changes (exclude images as they're handled separately)
    if (changes.listing && Object.keys(changes.listing).length > 0) {
      const { images, ...listingChanges } = changes.listing;
      if (Object.keys(listingChanges).length > 0) {
        await this.listingRepository.update(listingId, listingChanges);
      }
    }

    // Apply car detail changes (exclude images as they're handled separately)
    if (changes.carDetail && Object.keys(changes.carDetail).length > 0) {
      const listing = await this.listingRepository.findOne({
        where: { id: listingId },
        relations: ['carDetail'],
      });

      if (listing) {
        const { images, ...carDetailChanges } = changes.carDetail;
        if (Object.keys(carDetailChanges).length > 0) {
          await this.carDetailRepository.update(
            listing.carDetailId,
            carDetailChanges,
          );
        }
      }
    }

    // Apply image changes if present
    if (changes.images && Array.isArray(changes.images)) {
      const images = changes.images;
      if (images.length > 0) {
        const listing = await this.listingRepository.findOne({
          where: { id: listingId },
        });

        if (listing) {
          // Delete existing images first to avoid conflicts
          await this.carImageRepository.delete({
            carDetailId: listing.carDetailId,
          });

          // Create and save new images
          const carImages = images.map((image, index) =>
            this.carImageRepository.create({
              filename: image.filename,
              originalName: image.originalName,
              url: image.url,
              type: (image.type as any) || 'exterior',
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
    }

    // Mark pending change as applied
    await this.pendingChangesRepository.update(pendingChangeId, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUserId,
    });

    return this.findOne(listingId);
  }

  async rejectPendingChanges(
    pendingChangeId: string,
    rejectedByUserId: string,
    rejectionReason?: string,
  ): Promise<void> {
    const pendingChange = await this.pendingChangesRepository.findOne({
      where: { id: pendingChangeId, isApplied: false },
    });

    if (!pendingChange) {
      throw new NotFoundException('Pending change not found');
    }

    // Mark as applied but with rejection (we can add a rejection field later)
    await this.pendingChangesRepository.update(pendingChangeId, {
      isApplied: true,
      appliedAt: new Date(),
      appliedByUserId: rejectedByUserId,
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: string,
  ): Promise<ListingDetail> {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Validate status
    if (!Object.values(ListingStatus).includes(status as ListingStatus)) {
      throw new BadRequestException('Invalid status');
    }

    await this.listingRepository.update(id, {
      status: status as ListingStatus,
    });

    // If marking as sold, create a transaction record
    if (status === ListingStatus.SOLD) {
      try {
        const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const transaction = this.transactionRepository.create({
          transactionNumber,
          amount: listing.price,
          platformFee: 0, // No platform fee for offline transactions
          totalAmount: listing.price,
          status: TransactionStatus.COMPLETED, // Mark as completed since it's an offline sale
          paymentMethod: PaymentMethod.CASH, // Default to cash for offline transactions
          notes: 'Offline sale - marked as sold by seller',
          completedAt: new Date(),
          sellerId: listing.sellerId,
          listingId: listing.id,
        });

        await this.transactionRepository.save(transaction);
      } catch (error) {
        console.error('Error creating transaction:', error);
        throw new Error('Failed to create transaction record');
      }
    }

    return this.findOne(id);
  }
}
