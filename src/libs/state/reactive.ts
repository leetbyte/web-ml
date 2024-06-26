/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Slicer<TIn, TOut> = (input: TIn | null) => TOut;
export type Observer<T> = (state: T | null) => void;
export type Action<T> = T;
export type Reducer<T, TAction> = (
  state: T | null,
  action: TAction,
  payload?: any
) => Promise<T | null>;
export type Dispatch<TAction> = (
  action: Action<TAction>,
  payload?: any
) => void;
export type DispatchAsync<TAction, T> = (
  action: Action<TAction>,
  payload?: T
) => Promise<void>;

export interface IReactiveState<T, TAction> {
  readonly id: string;
  readonly get: <TOut>(slicer?: Slicer<T, TOut>) => TOut;
  readonly observe: <TOut>(
    observer: Observer<TOut>,
    immidiate?: boolean,
    slicer?: Slicer<T | null, TOut>
  ) => () => void;
  readonly updateAsync: (
    action: Action<TAction>,
    updates?: any
  ) => Promise<void>;
  readonly replace: (state: T) => void;
  readonly notify: () => void;
}

export class ReactiveState<T, TAction> implements IReactiveState<T, TAction> {
  constructor(
    id: string,
    reducer: Reducer<T, Action<TAction>> = (state) => Promise.resolve(state),
    initialState: T | null = null
  ) {
    this.id = id;
    this._state = initialState;
    this._reducer = reducer;
  }
  readonly id: string;
  private _state: T | null;
  private _reducer: Reducer<T, Action<TAction>>;

  private _observers = new Array<{
    observer: Observer<any>;
    slicer?: Slicer<any, any>;
  }>();
  readonly observe = <TOut>(
    observer: Observer<TOut>,
    immidate = false,
    slicer?: Slicer<T, TOut>
  ) => {
    this._observers.push({ observer, slicer });
    immidate &&
      observer(
        (typeof slicer === "function"
          ? slicer(this._state)
          : this._state) as any
      );
    return () => {
      this._observers = this._observers.filter(
        (item) => item.observer !== observer
      );
    };
  };
  readonly notify = () => {
    this._observers.forEach((item) => {
      item.observer(this._state);
    });
  };
  readonly updateAsync = async (action: Action<TAction>, updates?: any) => {
    this._state = await this._reducer(this._state, action, updates);
    this.notify();
  };

  readonly replace = (state: T) => {
    this._state = state;
    this.notify();
  };
  readonly get = <TOut>(slicer?: Slicer<T, TOut> | undefined) => {
    if (typeof slicer == "function") {
      return slicer(this._state) as TOut;
    }
    return this._state as TOut;
  };
}
