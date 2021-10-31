package transform

import (
	"context"
	"math"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

// Store is a store containing windows
type Store struct {
	windows map[float64]*CondensedWindow
	start   time.Time
	window  float64
	in      chan *CondensedWindow
	log     *zap.Logger

	storedWindowsCounter prometheus.Counter
}

// NewStore creates a new store. The start time represents the start time at which
// the store and pipeline was started. The window is the duration of each window
// processed by the pipeline and pushed to the store
func NewStore(start time.Time, window time.Duration, log *zap.Logger) *Store {
	return &Store{
		windows: make(map[float64]*CondensedWindow),
		start:   start.UTC(),
		window:  window.Seconds(),
		in:      make(chan *CondensedWindow),
		log:     log,

		storedWindowsCounter: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "pewview",
			Subsystem: "store",
			Name:      "stored_windows_count",
		}),
	}
}

// Load consumes messages from the store's input channel. Blocks until the context is canceled
func (store *Store) Load(ctx context.Context) {
	for {
		select {
		case input := <-store.in:
			index := math.Floor(input.Start.UTC().Sub(store.start).Seconds() / store.window)
			store.log.Debug("Adding window to store", zap.Time("start", input.Start), zap.Float64("index", index), zap.Int("connections", len(input.Connections)))
			store.windows[index] = input
			store.storedWindowsCounter.Inc()
		case <-ctx.Done():
			return
		}
	}
}

// Input returns the input channel the store subscribes to. Provide it to a pipeline to allow the store
// to store processed windows
func (store *Store) Input() chan *CondensedWindow {
	return store.in
}

// LatestWindow returns the latest window
func (store *Store) LatestWindow() *CondensedWindow {
	return store.Window(time.Now().UTC())
}

// Window returns a window containing the specified time. Returns nil if not found
func (store *Store) Window(time time.Time) *CondensedWindow {
	index := math.Floor(time.UTC().Sub(store.start).Seconds() / store.window)
	store.log.Debug("Retrieving window from store", zap.Time("time", time), zap.Float64("index", index))
	window, ok := store.windows[index-1]
	if ok {
		return window
	}

	return nil
}

// Collect implements prometheus.Collector
func (store *Store) Collect(c chan<- prometheus.Metric) {
	c <- store.storedWindowsCounter
}

// Describe implements prometheus.Collector
func (store *Store) Describe(c chan<- *prometheus.Desc) {
	c <- store.storedWindowsCounter.Desc()
}
