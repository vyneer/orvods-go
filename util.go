package main

import (
	"errors"
	"io"
	"net/http"
	"os"

	"github.com/bytedance/sonic/encoder"
	"github.com/cespare/xxhash/v2"
	"github.com/eko/gocache/v3/store"
	"github.com/gofiber/fiber/v2"
	log "github.com/vyneer/orvods-go/logger"
	"github.com/vyneer/orvods-go/parser"
)

func Marshal(v interface{}) ([]byte, error) {
	return encoder.Encode(v, encoder.EscapeHTML)
}

func getEmotes(c *fiber.Ctx) error {
	log.FiberInfof("getting d.gg emotes", c)

	req, _ := http.NewRequest("GET", "https://cdn.destiny.gg/emotes/emotes.json", nil)
	emotesResponse, err := httpClient.Do(req)
	if err != nil {
		log.FiberErrorf("couldn't get d.gg emotes (HTTP error): %v", c, err)
		return c.Status(500).SendString("Couldn't get d.gg emotes (HTTP error)")
	}
	defer emotesResponse.Body.Close()
	body, err := io.ReadAll(emotesResponse.Body)
	if err != nil {
		log.Errorf("couldn't read d.gg emotes (IO error): %v", c, err)
		return c.Status(500).SendString("Couldn't read d.gg emotes (IO error)")
	}

	c.Context().SetBody(body)
	c.Context().SetContentType(fiber.MIMEApplicationJSON)
	return nil
}

func getChat(c *fiber.Ctx) error {
	limiter <- struct{}{}
	defer func() { <-limiter }()

	var jsonResponse map[int64][]parser.Dictionary
	dontCache := c.Get("DontCache")
	fromParam := c.Query("from")
	toParam := c.Query("to")

	log.FiberInfof("getting chatlogs (from: %s, to: %s)", c, fromParam, toParam)

	if dontCache == "true" {
		if fromParam != "" && toParam != "" {
			chatlines, err := parser.GetTextFiles(fromParam, toParam)
			if err != nil {
				switch {
				case errors.Is(err, parser.ErrBadRequest), errors.Is(err, parser.ErrNotFound),
					errors.Is(err, parser.ErrForbidden), errors.Is(err, parser.ErrTooManyRequests),
					errors.Is(err, parser.ErrInternalServerError), errors.Is(err, parser.ErrBadGateway),
					errors.Is(err, parser.ErrServiceUnavailable), errors.Is(err, parser.ErrMovedTemporarily), os.IsTimeout(err):
					log.FiberErrorf("wasn't able to get logs from OverRustleLogs, falling back to vyneer.me logs (from: %s, to: %s)", c, fromParam, toParam)
					jsonResponse, err := parser.GetDBLines(fromParam, toParam)
					if err != nil {
						return c.Status(500).SendString("Couldn't parse logs")
					}
					log.FiberInfof("forced no cache, parsed chatlogs (from: %s, to: %s)", c, fromParam, toParam)
					c.Context().SetBody(jsonResponse)
					c.Context().SetContentType(fiber.MIMEApplicationJSON)
					return nil
				default:
					return c.Status(500).SendString("Couldn't parse logs")
				}
			}
			jsonResponse = parser.ParseChat(chatlines)

			log.FiberInfof("forced no cache, parsed chatlogs (from: %s, to: %s)", c, fromParam, toParam)
			return c.JSON(jsonResponse)
		} else {
			return c.Status(http.StatusBadRequest).SendString(`Please provide the "URLs", "from" and "to" query parameters`)
		}
	} else {
		if fromParam != "" && toParam != "" {
			hashString := fromParam + toParam
			hash := xxhash.Sum64String(hashString)
			cacheResponse, err := cacheManager.Get(cacheContext, hash)
			if err != nil {
				chatlines, err := parser.GetTextFiles(fromParam, toParam)
				if err != nil {
					switch {
					case errors.Is(err, parser.ErrBadRequest), errors.Is(err, parser.ErrNotFound),
						errors.Is(err, parser.ErrForbidden), errors.Is(err, parser.ErrTooManyRequests),
						errors.Is(err, parser.ErrInternalServerError), errors.Is(err, parser.ErrBadGateway),
						errors.Is(err, parser.ErrServiceUnavailable), errors.Is(err, parser.ErrMovedTemporarily), os.IsTimeout(err):
						log.FiberErrorf("wasn't able to get logs from OverRustleLogs, falling back to vyneer.me logs (from: %s, to: %s)", c, fromParam, toParam)
						jsonResponse, err := parser.GetDBLines(fromParam, toParam)
						if err != nil {
							log.FiberErrorf("%w", c, err)
							return c.Status(500).SendString("Couldn't parse logs")
						}
						c.Context().SetBody(jsonResponse)
						c.Context().SetContentType(fiber.MIMEApplicationJSON)
						err = cacheManager.Set(cacheContext, hash, jsonResponse, store.WithCost(int64(len(jsonResponse))))
						if err != nil {
							log.FiberErrorf("cache error: %v", c, err)
							return nil
						} else {
							log.FiberInfof("wasn't able to get parsed chat from cache, adding it (from: %s, to: %s)", c, fromParam, toParam)
							return nil
						}
					default:
						return c.Status(500).SendString("Couldn't parse logs")
					}
				}
				jsonResponse = parser.ParseChat(chatlines)
				c.JSON(jsonResponse)
				jsonData := c.Response().Body()
				err = cacheManager.Set(cacheContext, hash, jsonData, store.WithCost(int64(len(jsonData))))
				if err != nil {
					log.FiberErrorf("cache error: %v", c, err)
					return nil
				} else {
					log.FiberInfof("wasn't able to get parsed chat from cache, adding it (from: %s, to: %s)", c, fromParam, toParam)
					return nil
				}
			} else {
				log.FiberInfof("was able to get parsed chat from cache (from: %s, to: %s)", c, fromParam, toParam)
				c.Context().SetBody(cacheResponse)
				c.Context().SetContentType(fiber.MIMEApplicationJSON)
				return nil
			}
		} else {
			return c.Status(http.StatusBadRequest).SendString(`Please provide the "URLs", "from" and "to" query parameters`)
		}
	}
}
