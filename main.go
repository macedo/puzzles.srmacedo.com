package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
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

	server := http.Server{
		Addr:         ":" + port,
		Handler:      nil,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  5 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
