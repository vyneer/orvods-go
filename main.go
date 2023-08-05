package main

import (
	"context"
	"net/http"
	"os"
	"strconv"

	"github.com/defrankland/hasherator"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	apex "github.com/apex/log"
	"github.com/eko/gocache/v3/cache"
	"github.com/vyneer/orvods-go/config"
	log "github.com/vyneer/orvods-go/logger"
)

var cfg *config.Config
var httpClient *http.Client = &http.Client{}

var cacheContext context.Context
var cacheManager *cache.Cache[[]byte]

var assets hasherator.AssetsDir

var limiter chan struct{}

func init() {
	log.SetHandler(log.New((os.Stderr)))
	log.SetLevel(apex.DebugLevel)
}

func main() {
	cfg = config.LoadDotEnv()
	cacheContext, cacheManager = config.SetupCache(cfg)

	config.CreateIndex(assets)

	orvods := fiber.New(fiber.Config{
		ProxyHeader:             "X-Forwarded-For",
		EnableTrustedProxyCheck: true,
		TrustedProxies:          []string{cfg.TrustedProxy},
		Immutable:               true,
		JSONEncoder:             Marshal,
		StrictRouting:           true,
	})

	orvods.Use(cors.New())
	orvods.Use(logger.New(logger.Config{
		Format:     "[${time}] ${ip} - ${status} ${method} ${path}${query:} - ${latency}\n",
		TimeFormat: "2006-01-02 15:04:05.000000 MST",
	}))

	if cfg.Prefix != "" {
		log.Infof("Current prefix is set to \"%s\".", cfg.Prefix)
	} else {
		log.Infof("Current prefix is set to nothing.")
	}

	if cfg.Prefix != "" {
		orvods.Get(cfg.Prefix, func(c *fiber.Ctx) error {
			c.Redirect(c.OriginalURL() + "/")
			return nil
		})
	}
	orvods.Static(cfg.Prefix+"/", "./public")
	orvods.Get(cfg.Prefix+"/vidinfo", getVidInfo)
	orvods.Get(cfg.Prefix+"/vodinfo", getVODInfo)
	orvods.Get(cfg.Prefix+"/rumbleinfo", getRumbleInfo)
	orvods.Get(cfg.Prefix+"/userinfo", getUserInfo)
	orvods.Get(cfg.Prefix+"/emotes", getEmotes)

	limiter = make(chan struct{}, cfg.MaxClients)
	orvods.Get(cfg.Prefix+"/chat", getChat)

	orvods.Listen(":" + strconv.Itoa(cfg.Port))
}
