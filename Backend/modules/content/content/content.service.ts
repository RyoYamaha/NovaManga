import { Injectable } from '@nestjs/common';
import { ContentCatalogService } from './content-catalog.service';
import { ContentDiscoveryService } from './content-discovery.service';
import { ContentWorkflowService } from './content-workflow.service';
import { OwnershipTier } from '../../../common/constants/content.enum';
import { CreateContentDto } from './dto/create-content.dto';
import { QueryCatalogSortDto } from './dto/query-catalog-sort.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { QueryRankingContentDto } from './dto/query-ranking-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly contentCatalogService: ContentCatalogService,
    private readonly contentDiscoveryService: ContentDiscoveryService,
    private readonly contentWorkflowService: ContentWorkflowService,
  ) {}

  findAll(contentQuery: QueryContentDto) {
    return this.contentCatalogService.findAll(contentQuery);
  }

  findOne(contentId: string) {
    return this.contentCatalogService.findOne(contentId);
  }

  getGenres() {
    return this.contentCatalogService.getGenres();
  }

  getTags(sortOrder?: QueryCatalogSortDto['sort']) {
    return this.contentCatalogService.getTags(sortOrder);
  }

  getPublishers(sortOrder?: QueryCatalogSortDto['sort']) {
    return this.contentCatalogService.getPublishers(sortOrder);
  }

  getRankedContents(rankingQuery: QueryRankingContentDto) {
    return this.contentDiscoveryService.getRankedContents(rankingQuery);
  }

  getRecommendations(userId: string, query: QueryRecommendationsDto) {
    return this.contentDiscoveryService.getRecommendations(userId, query);
  }

  getSimilarContents(contentId: string) {
    return this.contentDiscoveryService.getSimilarContents(contentId);
  }

  createContent( contentData: CreateContentDto, uploaderId: string, ownershipTier: OwnershipTier, publisherId?: string, parentContentId?: string,) {
    return this.contentWorkflowService.createContent( contentData, uploaderId, ownershipTier, publisherId, parentContentId,
    );
  }

  updateContent(contentId: string, uploaderId: string, updateData: UpdateContentDto) {
    return this.contentWorkflowService.updateContent(contentId, uploaderId, updateData);
  }

  deleteOwnedContent(contentId: string, uploaderId: string) {
    return this.contentWorkflowService.deleteOwnedContent(contentId, uploaderId);
  }

  approve(contentId: string) {
    return this.contentWorkflowService.approve(contentId);
  }

  reject(contentId: string, rejectionReason?: string) {
    return this.contentWorkflowService.reject(contentId, rejectionReason);
  }

  hide(contentId: string) {
    return this.contentWorkflowService.hide(contentId);
  }

  restore(contentId: string) {
    return this.contentWorkflowService.restore(contentId);
  }

  resubmit(contentId: string, uploaderId: string) {
    return this.contentWorkflowService.resubmit(contentId, uploaderId);
  }
}
