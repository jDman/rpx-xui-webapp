import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PaymentLibModule } from '@hmcts/ccpay-web-component';
import { ExuiCommonLibModule } from '@hmcts/rpx-xui-common-lib';
import { SharedModule } from '../app/shared/shared.module';
import { RefundsRoutingModule } from './refunds-routing.module';
import { RefundsComponent } from './refunds/refunds.component';

@NgModule({
  imports: [
    CommonModule,
    RefundsRoutingModule,
    SharedModule,
    PaymentLibModule,
    ExuiCommonLibModule
  ],
  declarations: [RefundsComponent],
  exports: [RefundsComponent]
})
export class RefundsModule { }