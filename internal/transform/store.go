package transform

import "context"

type Store struct {
	windows []*CondensedWindow
	in      chan *CondensedWindow
}

func NewStore() *Store {
	return &Store{
		windows: make([]*CondensedWindow, 0),
		in:      make(chan *CondensedWindow),
	}
}

func (store *Store) Load(ctx context.Context) {
	for {
		select {
		case input := <-store.in:
			store.windows = append(store.windows, input)
		case <-ctx.Done():
			return
		}
	}
}

func (store *Store) Input() chan *CondensedWindow {
	return store.in
}

func (store *Store) LatestWindow() *CondensedWindow {
	if len(store.windows) == 0 {
		return nil
	}

	return store.windows[len(store.windows)-1]
}
