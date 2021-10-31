package transform

import (
	"context"
	"math"
	"time"

	"go.uber.org/zap"
)

type Store struct {
	windows map[float64]*CondensedWindow
	start   time.Time
	window  float64
	in      chan *CondensedWindow
	log     *zap.Logger
}

func NewStore(start time.Time, window time.Duration, log *zap.Logger) *Store {
	return &Store{
		windows: make(map[float64]*CondensedWindow),
		start:   start.UTC(),
		window:  window.Seconds(),
		in:      make(chan *CondensedWindow),
		log:     log,
	}
}

func (store *Store) Load(ctx context.Context) {
	for {
		select {
		case input := <-store.in:
			index := math.Floor(input.Start.UTC().Sub(store.start).Seconds() / store.window)
			store.log.Debug("Adding window to store", zap.Time("start", input.Start), zap.Float64("index", index), zap.Int("connections", len(input.Connections)))
			store.windows[index] = input
		case <-ctx.Done():
			return
		}
	}
}

func (store *Store) Input() chan *CondensedWindow {
	return store.in
}

func (store *Store) LatestWindow() *CondensedWindow {
	return store.Window(time.Now().UTC())
}

func (store *Store) Window(time time.Time) *CondensedWindow {
	index := math.Floor(time.UTC().Sub(store.start).Seconds() / store.window)
	store.log.Debug("Retrieving window from store", zap.Time("time", time), zap.Float64("index", index))
	window, ok := store.windows[index-1]
	if ok {
		return window
	}

	return nil
}
