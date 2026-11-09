import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentAdminQueryService } from './payment-admin-query.service';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { SepayWebhookService } from './sepay-webhook.service';
import { AdminPaymentController } from './admin-payment.controller';
import { PaymentSettingsController } from './payment-settings.controller';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookGuard } from './sepay-webhook.guard';

@Module({
  controllers: [
    PaymentController,
    AdminPaymentController,
    PaymentSettingsController,
    SepayWebhookController,
  ],
  providers: [
    PaymentService,
    PaymentAdminQueryService,
    PaymentReconciliationService,
    SepayWebhookService,
    SepayWebhookGuard,
  ],
})
export class PaymentModule {}
