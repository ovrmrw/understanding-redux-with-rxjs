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

  transform(observable: Observable<T>, debugMode: boolean = false): T | null {
    if (debugMode) { console.log('AsyncStatePipe: transform() is called.'); }
    if (!this.subscription) {
      // 1回目の実行時にここを通る。      
      this.subscription = observable
        .distinctUntilChanged((oldValue, newValue) => lodash.isEqual(oldValue, newValue))
        .subscribe(state => {
          this.latestValue = state;
          this.cd.markForCheck();
          if (debugMode) { console.log('AsyncStatePipe: markForCheck() is called.'); }
        }, err => {
          console.error(err);
        });
      if (debugMode) { console.log('AsyncStatePipe: Subscription is created.', observable); }
    }
    return this.latestValue;
  }
}
