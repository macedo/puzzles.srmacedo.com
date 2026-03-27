package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"
)

type ctxKey int

const requestIDKey ctxKey = iota

func main() {
	var logger *slog.Logger
	if os.Getenv("ENV") == "production" {
		logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
	} else {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	}
	slog.SetDefault(logger)

	mux := http.NewServeMux()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if path == "/" {
			http.ServeFile(w, r, "./static/index.html")
			return
		}

		fullPath := "./static/" + path

		info, err := os.Stat(fullPath)
		if err == nil && !info.IsDir() {
			http.ServeFile(w, r, fullPath)
			return
		}

		if os.IsNotExist(err) && !strings.HasSuffix(path, ".html") {
			htmlPath := fullPath + ".html"
			htmlInfo, htmlErr := os.Stat(htmlPath)
			if htmlErr == nil && !htmlInfo.IsDir() {
				http.ServeFile(w, r, htmlPath)
				return
			}

			if !os.IsNotExist(htmlErr) {
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			}
		} else if err != nil && !os.IsNotExist(err) {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}

		http.NotFound(w, r)
	})

	handler := loggingMiddleware(logger, mux)

	server := http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  5 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		logger.Error("Error starting server.... bye", "error", err)
		os.Exit(1)
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{w, http.StatusOK}
}

func generateRequestID() string {
	b := make([]byte, 4)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func loggingMiddleware(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		ctx := context.WithValue(r.Context(), requestIDKey, requestID)
		r = r.WithContext(ctx)
		w.Header().Set("X-Request-ID", requestID)

		l := logger.With("request_id", requestID)

		wrapped := newResponseWriter(w)

		l.Info(
			"Started",
			"method", r.Method,
			"path", r.URL.Path,
			"ip", r.RemoteAddr,
			"user_agent", r.UserAgent(),
		)

		next.ServeHTTP(wrapped, r)

		l.Info(
			"Completed",
			"status", wrapped.statusCode,
			"duration", time.Since(start),
		)
	})
}
