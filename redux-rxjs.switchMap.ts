import 'babel-polyfill';
import 'zone.js/dist/zone-node';
import * as lodash from 'lodash';
import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';
declare const Zone: any;


class IncrementAction {
  constructor(public num: number) { }
}

class OtherAction {
  constructor() { }
}

type Action = IncrementAction | OtherAction;


interface IncrementState {
  counter: number;
}

interface OtherState {
  foo: string;
  bar: number;
}

interface AppState {
  increment: Promise<IncrementState>;
  other?: OtherState;
}


Zone.current.fork({ name: 'myZone' }).runGuarded(async () => {

  console.log('zone name:', Zone.current.name); /* OUTPUT> zone name: myZone */

  const initialState: AppState = {
    increment: Promise.resolve<IncrementState>({
      counter: 0
    })
  };

  let counter: number;


  const dispatcher$ = new Subject<Action>(); // Dispatcher
  const provider$ = new BehaviorSubject<AppState>(initialState); // Provider


  Observable // ReducerContainer
    .zip<AppState>(...[
      dispatcher$.scan<Promise<IncrementState>>((state, action) => { // Reducer
        if (action instanceof IncrementAction) {
          return new Promise<IncrementState>(resolve => {
            setTimeout(() => {
              state.then(s => resolve({ counter: s.counter + action.num }));
            }, 10);
          });
        } else {
          return state;
        }
      }, initialState.increment),
      (increment): AppState => { // projection
        return Object.assign<{}, AppState, {}>({}, initialState, { increment }); // always create new state object!
      }
    ])
    .subscribe(appState => {
      provider$.next(appState);
    });


  provider$
    .map<Promise<IncrementState>>(appState => appState.increment)
    .switchMap<IncrementState>(state => Observable.fromPromise(state)) // resolve async states.
    .map<IncrementState>(state => lodash.cloneDeep(state)) // make states immutable.
    .distinctUntilChanged((oldValue, newValue) => lodash.isEqual(oldValue, newValue)) // restrict same values to through.
    .subscribe(state => {
      counter = state.counter;
      console.log('counter:', counter);
    });


  await wait(10);                          /* OUTPUT> counter: 0 */
  dispatcher$.next(new IncrementAction(1));
  dispatcher$.next(new IncrementAction(1));
  dispatcher$.next(new IncrementAction(1));
  await wait(10);                          /* OUTPUT> counter: 3 */
  dispatcher$.next(new IncrementAction(0));
  await wait(10);                          /* OUTPUT> (restricted) */
  dispatcher$.next(new IncrementAction(1));
  await wait(10);                          /* OUTPUT> counter: 4 */
  dispatcher$.next(new IncrementAction(-1));
  ;                                        /* OUTPUT> counter: 3 */

});


function wait(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}