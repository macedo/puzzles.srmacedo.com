# Build
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/puzzles .

# Runtime: imagem mínima, sem shell, usuário não-root
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/puzzles /app/puzzles
COPY static /app/static
ENV ENV=production PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/puzzles"]
