import { Injectable } from '@nestjs/common';
import { ContentCatalogService } from './content-catalog.service';
import { ContentDiscoveryService } from './content-discovery.service';
import { ContentWorkflowService } from './content-workflow.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly contentCatalogService: ContentCatalogService,
    private readonly contentDiscoveryService: ContentDiscoveryService,
    private readonly contentWorkflowService: ContentWorkflowService,
  ) {}

  findAll(...args: Parameters<ContentCatalogService['findAll']>) {
    return this.contentCatalogService.findAll(...args);
  }

  findOne(...args: Parameters<ContentCatalogService['findOne']>) {
    return this.contentCatalogService.findOne(...args);
  }

  getGenres(...args: Parameters<ContentCatalogService['getGenres']>) {
    return this.contentCatalogService.getGenres(...args);
  }

  getTags(...args: Parameters<ContentCatalogService['getTags']>) {
    return this.contentCatalogService.getTags(...args);
  }

  getPublishers(...args: Parameters<ContentCatalogService['getPublishers']>) {
    return this.contentCatalogService.getPublishers(...args);
  }

  getRankedContents(...args: Parameters<ContentDiscoveryService['getRankedContents']>) {
    return this.contentDiscoveryService.getRankedContents(...args);
  }

  getRecommendations(...args: Parameters<ContentDiscoveryService['getRecommendations']>) {
    return this.contentDiscoveryService.getRecommendations(...args);
  }

  getSimilarContents(...args: Parameters<ContentDiscoveryService['getSimilarContents']>) {
    return this.contentDiscoveryService.getSimilarContents(...args);
  }

  createContent(...args: Parameters<ContentWorkflowService['createContent']>) {
    return this.contentWorkflowService.createContent(...args);
  }

  updateContent(...args: Parameters<ContentWorkflowService['updateContent']>) {
    return this.contentWorkflowService.updateContent(...args);
  }

  deleteOwnedContent(...args: Parameters<ContentWorkflowService['deleteOwnedContent']>) {
    return this.contentWorkflowService.deleteOwnedContent(...args);
  }

  approve(...args: Parameters<ContentWorkflowService['approve']>) {
    return this.contentWorkflowService.approve(...args);
  }

  reject(...args: Parameters<ContentWorkflowService['reject']>) {
    return this.contentWorkflowService.reject(...args);
  }

  hide(...args: Parameters<ContentWorkflowService['hide']>) {
    return this.contentWorkflowService.hide(...args);
  }

  restore(...args: Parameters<ContentWorkflowService['restore']>) {
    return this.contentWorkflowService.restore(...args);
  }

  resubmit(...args: Parameters<ContentWorkflowService['resubmit']>) {
    return this.contentWorkflowService.resubmit(...args);
  }
}
