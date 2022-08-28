FROM golang:alpine AS gobuilder
LABEL stage=gobuilder
LABEL image=orvods-go
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v

FROM alpine
LABEL image=orvods-go
WORKDIR /app
COPY --from=gobuilder /app/orvods-go /app
ENTRYPOINT ["/app/orvods-go"]