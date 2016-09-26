import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import lodash from 'lodash';


@Pipe({
  name: 'asyncState',
  pure: false
})
export class AsyncStatePipe<T> implements PipeTransform, OnDestroy {
  private subscription: Subscription;
  private latestValue: T | null = null;

  constructor(private cd: ChangeDetectorRef) { }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  transform(observable: Observable<T>): T | null {
    if (!this.subscription) {
      // 1回目の実行時にここを通る。      
      this.subscription = observable
        .distinctUntilChanged((oldValue, newValue) => lodash.isEqual(oldValue, newValue))
        .subscribe(state => {
          this.latestValue = state;
          this.cd.markForCheck();
        }, err => {
          console.error(err);
        });
    }
    return this.latestValue;
  }
}
