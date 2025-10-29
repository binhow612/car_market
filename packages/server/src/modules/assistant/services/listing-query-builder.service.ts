import { Injectable, Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ListingDetail } from '../../../entities/listing-detail.entity';
import { ListingQueryParams } from '../dto/listing-query-params.dto';

/**
 * Advanced query builder for car listings
 * Constructs optimized TypeORM queries from extracted parameters
 */
@Injectable()
export class ListingQueryBuilderService {
  private readonly logger = new Logger(ListingQueryBuilderService.name);

  constructor(
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
  ) {}

  /**
   * Build and execute a comprehensive listing query
   */
  async buildAndExecuteQuery(
    params: ListingQueryParams,
  ): Promise<{ listings: ListingDetail[]; totalCount: number }> {
    try {
      const queryBuilder = this.createBaseQuery();

      // Apply all filters
      this.applyCarIdentificationFilters(queryBuilder, params);
      this.applySpecificationFilters(queryBuilder, params);
      this.applyNumericFilters(queryBuilder, params);
      this.applyLocationFilters(queryBuilder, params);
      this.applyFeatureFilters(queryBuilder, params);
      this.applySpecialFilters(queryBuilder, params);

      // Apply sorting
      this.applySorting(queryBuilder, params);

      // Get total count before pagination
      const totalCount = await queryBuilder.getCount();

      // Apply pagination
      this.applyPagination(queryBuilder, params);

      // Execute query
      const listings = await queryBuilder.getMany();

      this.logger.log(
        `Query executed: Found ${listings.length} listings (${totalCount} total)`,
      );

      return { listings, totalCount };
    } catch (error) {
      this.logger.error('Error building query:', error);
      throw error;
    }
  }

  /**
   * Create base query with necessary joins
   */
  private createBaseQuery(): SelectQueryBuilder<ListingDetail> {
    return this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.carDetail', 'carDetail')
      .leftJoinAndSelect('carDetail.images', 'images')
      .leftJoinAndSelect('listing.seller', 'seller')
      .where('listing.status = :status', { status: 'approved' })
      .andWhere('listing.isActive = :isActive', { isActive: true });
  }

  /**
   * Apply car identification filters (make, model, year)
   */
  private applyCarIdentificationFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    // Filter by makes (case-insensitive)
    if (params.makes && params.makes.length > 0) {
      queryBuilder.andWhere('LOWER(carDetail.make) IN (:...makes)', {
        makes: params.makes.map(m => m.toLowerCase()),
      });
      this.logger.debug(`Filtering by makes: ${params.makes.join(', ')}`);
    }

    // Filter by models (case-insensitive)
    if (params.models && params.models.length > 0) {
      queryBuilder.andWhere('LOWER(carDetail.model) IN (:...models)', {
        models: params.models.map(m => m.toLowerCase()),
      });
      this.logger.debug(`Filtering by models: ${params.models.join(', ')}`);
    }

    // Filter by year range
    if (params.yearMin !== undefined) {
      queryBuilder.andWhere('carDetail.year >= :yearMin', {
        yearMin: params.yearMin,
      });
      this.logger.debug(`Filtering by yearMin: ${params.yearMin}`);
    }

    if (params.yearMax !== undefined) {
      queryBuilder.andWhere('carDetail.year <= :yearMax', {
        yearMax: params.yearMax,
      });
      this.logger.debug(`Filtering by yearMax: ${params.yearMax}`);
    }
  }

  /**
   * Apply specification filters (body type, fuel, transmission, condition)
   */
  private applySpecificationFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    // Filter by body types
    if (params.bodyTypes && params.bodyTypes.length > 0) {
      queryBuilder.andWhere('carDetail.bodyType IN (:...bodyTypes)', {
        bodyTypes: params.bodyTypes,
      });
      this.logger.debug(
        `Filtering by bodyTypes: ${params.bodyTypes.join(', ')}`,
      );
    }

    // Filter by fuel types
    if (params.fuelTypes && params.fuelTypes.length > 0) {
      queryBuilder.andWhere('carDetail.fuelType IN (:...fuelTypes)', {
        fuelTypes: params.fuelTypes,
      });
      this.logger.debug(
        `Filtering by fuelTypes: ${params.fuelTypes.join(', ')}`,
      );
    }

    // Filter by transmissions
    if (params.transmissions && params.transmissions.length > 0) {
      queryBuilder.andWhere('carDetail.transmission IN (:...transmissions)', {
        transmissions: params.transmissions,
      });
      this.logger.debug(
        `Filtering by transmissions: ${params.transmissions.join(', ')}`,
      );
    }

    // Filter by conditions
    if (params.conditions && params.conditions.length > 0) {
      queryBuilder.andWhere('carDetail.condition IN (:...conditions)', {
        conditions: params.conditions,
      });
      this.logger.debug(
        `Filtering by conditions: ${params.conditions.join(', ')}`,
      );
    }

    // Filter by colors
    if (params.colors && params.colors.length > 0) {
      // Case-insensitive color matching
      const colorConditions = params.colors.map(
        (_, index) => `LOWER(carDetail.color) = LOWER(:color${index})`,
      );
      const colorParams = params.colors.reduce(
        (acc, color, index) => {
          acc[`color${index}`] = color;
          return acc;
        },
        {} as Record<string, string>,
      );

      queryBuilder.andWhere(`(${colorConditions.join(' OR ')})`, colorParams);
      this.logger.debug(`Filtering by colors: ${params.colors.join(', ')}`);
    }
  }

  /**
   * Apply numeric filters (price, mileage, seats)
   */
  private applyNumericFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    // Price range
    if (params.priceMin !== undefined) {
      queryBuilder.andWhere('listing.price >= :priceMin', {
        priceMin: params.priceMin,
      });
      this.logger.debug(`Filtering by priceMin: ${params.priceMin}`);
    }

    if (params.priceMax !== undefined) {
      queryBuilder.andWhere('listing.price <= :priceMax', {
        priceMax: params.priceMax,
      });
      this.logger.debug(`Filtering by priceMax: ${params.priceMax}`);
    }

    // Mileage maximum
    if (params.mileageMax !== undefined) {
      queryBuilder.andWhere('carDetail.mileage <= :mileageMax', {
        mileageMax: params.mileageMax,
      });
      this.logger.debug(`Filtering by mileageMax: ${params.mileageMax}`);
    }

    // Minimum seats
    if (params.seatsMin !== undefined) {
      queryBuilder.andWhere('carDetail.numberOfSeats >= :seatsMin', {
        seatsMin: params.seatsMin,
      });
      this.logger.debug(`Filtering by seatsMin: ${params.seatsMin}`);
    }
  }

  /**
   * Apply location filters
   */
  private applyLocationFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    if (params.city) {
      queryBuilder.andWhere('LOWER(listing.city) LIKE LOWER(:city)', {
        city: `%${params.city}%`,
      });
      this.logger.debug(`Filtering by city: ${params.city}`);
    }

    if (params.state) {
      queryBuilder.andWhere('LOWER(listing.state) LIKE LOWER(:state)', {
        state: `%${params.state}%`,
      });
      this.logger.debug(`Filtering by state: ${params.state}`);
    }

    if (params.country) {
      queryBuilder.andWhere('LOWER(listing.country) LIKE LOWER(:country)', {
        country: `%${params.country}%`,
      });
      this.logger.debug(`Filtering by country: ${params.country}`);
    }

    // Fallback to general location if specific fields not used
    if (
      params.location &&
      !params.city &&
      !params.state &&
      !params.country
    ) {
      queryBuilder.andWhere(
        '(LOWER(listing.location) LIKE LOWER(:location) OR ' +
          'LOWER(listing.city) LIKE LOWER(:location) OR ' +
          'LOWER(listing.state) LIKE LOWER(:location))',
        {
          location: `%${params.location}%`,
        },
      );
      this.logger.debug(`Filtering by location: ${params.location}`);
    }
  }

  /**
   * Apply feature filters
   */
  private applyFeatureFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    if (params.features && params.features.length > 0) {
      // carDetail.features is stored as a simple-array (comma-separated string)
      // Apply a LIKE filter per feature to ensure all requested features are present
      params.features.forEach((feature, index) => {
        const paramKey = `feature${index}`;
        // Use commas as weak delimiters where possible and a general LIKE as fallback
        // Example stored value: "GPS,Leather seats,Sunroof"
        queryBuilder.andWhere(
          `(LOWER(carDetail.features) LIKE LOWER(:${paramKey}))`,
          { [paramKey]: `%${feature}%` },
        );
      });
      this.logger.debug(`Filtering by features: ${params.features.join(', ')}`);
    }
  }

  /**
   * Apply special filters
   */
  private applySpecialFilters(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    if (params.isFeatured !== undefined) {
      queryBuilder.andWhere('listing.isFeatured = :isFeatured', {
        isFeatured: params.isFeatured,
      });
      this.logger.debug(`Filtering by isFeatured: ${params.isFeatured}`);
    }

    if (params.isUrgent !== undefined) {
      queryBuilder.andWhere('listing.isUrgent = :isUrgent', {
        isUrgent: params.isUrgent,
      });
      this.logger.debug(`Filtering by isUrgent: ${params.isUrgent}`);
    }

    if (params.hasServiceHistory !== undefined) {
      queryBuilder.andWhere('carDetail.hasServiceHistory = :hasServiceHistory', {
        hasServiceHistory: params.hasServiceHistory,
      });
      this.logger.debug(
        `Filtering by hasServiceHistory: ${params.hasServiceHistory}`,
      );
    }

    if (params.noAccidentHistory !== undefined && params.noAccidentHistory) {
      queryBuilder.andWhere('carDetail.hasAccidentHistory = :hasAccidentHistory', {
        hasAccidentHistory: false,
      });
      this.logger.debug(`Filtering by noAccidentHistory: true`);
    }
  }

  /**
   * Apply sorting
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'DESC';

    switch (sortBy) {
      case 'price':
        queryBuilder.orderBy('listing.price', sortOrder);
        break;
      case 'year':
        queryBuilder.orderBy('carDetail.year', sortOrder);
        break;
      case 'mileage':
        queryBuilder.orderBy('carDetail.mileage', sortOrder);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('listing.createdAt', sortOrder);
        break;
    }

    this.logger.debug(`Sorting by ${sortBy} ${sortOrder}`);
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    queryBuilder: SelectQueryBuilder<ListingDetail>,
    params: ListingQueryParams,
  ): void {
    const limit = params.limit || 10;
    const offset = params.offset || 0;

    queryBuilder.take(limit).skip(offset);
    this.logger.debug(`Pagination: limit=${limit}, offset=${offset}`);
  }

  /**
   * Get query statistics for debugging
   */
  getQueryStats(params: ListingQueryParams): string {
    const stats: string[] = [];
    
    if (params.makes?.length) stats.push(`${params.makes.length} makes`);
    if (params.models?.length) stats.push(`${params.models.length} models`);
    if (params.yearMin || params.yearMax) stats.push(`year range`);
    if (params.bodyTypes?.length) stats.push(`${params.bodyTypes.length} body types`);
    if (params.fuelTypes?.length) stats.push(`${params.fuelTypes.length} fuel types`);
    if (params.priceMin || params.priceMax) stats.push(`price range`);
    if (params.mileageMax) stats.push(`max mileage`);
    if (params.features?.length) stats.push(`${params.features.length} features`);

    return stats.length > 0 ? stats.join(', ') : 'no filters';
  }
}

