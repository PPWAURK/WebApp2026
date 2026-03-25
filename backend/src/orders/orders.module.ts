import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersDocumentService } from './orders-document.service';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersDocumentService],
  exports: [OrdersService],
})
export class OrdersModule {}
