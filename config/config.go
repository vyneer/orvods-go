package config

import (
	"context"
	"os"
	"strconv"
	"text/template"
	"time"

	"github.com/defrankland/hasherator"
	"github.com/dgraph-io/ristretto"
	"github.com/eko/gocache/v3/cache"
	"github.com/eko/gocache/v3/store"
	"github.com/joho/godotenv"
	"github.com/nicklaw5/helix/v2"
	log "github.com/vyneer/orvods-go/logger"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

type Config struct {
	Port         int
	Prefix       string
	MaxClients   int
	CacheSize    int
	TrustedProxy string
	Twitch       TwitchConfig
	YouTube      YouTubeConfig
}

type TwitchConfig struct {
	clientID     string
	clientSecret string
	AccessToken  string
	RefreshToken string
	Client       *helix.Client
}

type YouTubeConfig struct {
	apiKey string
	Client *youtube.Service
}

func LoadDotEnv() *Config {
	var err error
	var cfg Config

	log.Debugf("Loading environment variables")
	godotenv.Load()

	portStr := os.Getenv("PORT")
	if portStr == "" {
		cfg.Port = 8080
	} else {
		cfg.Port, err = strconv.Atoi(portStr)
		if err != nil {
			log.Fatalf("strconv error: %s", err)
		}
	}

	cfg.Prefix = os.Getenv("PREFIX")
	cfg.TrustedProxy = os.Getenv("TRUSTED_PROXY")

	maxClientsStr := os.Getenv("MAX_CLIENTS")
	if maxClientsStr == "" {
		cfg.MaxClients = 15
	} else {
		cfg.MaxClients, err = strconv.Atoi(maxClientsStr)
		if err != nil {
			log.Fatalf("strconv error: %s", err)
		}
	}

	cacheSizeStr := os.Getenv("CACHE_SIZE")
	cfg.CacheSize = 128
	if cacheSizeStr != "" {
		cacheSizeBuf, err := strconv.Atoi(cacheSizeStr)
		if err != nil {
			log.Fatalf("strconv error: %s", err)
		}
		if IsPowerOfTwo(cacheSizeBuf) {
			cfg.CacheSize = cacheSizeBuf
		} else {
			log.Debugf("CACHE_SIZE needs to be the power of 2, setting it to 128 MB")
		}
	}

	cfg.Twitch.clientID = os.Getenv("TWITCH_CLIENT_ID")
	if cfg.Twitch.clientID == "" {
		log.Fatalf("Please set the TWITCH_CLIENT_ID environment variable and restart the app")
	}

	cfg.Twitch.clientSecret = os.Getenv("TWITCH_CLIENT_SECRET")
	if cfg.Twitch.clientID == "" {
		log.Fatalf("Please set the TWITCH_CLIENT_SECRET environment variable and restart the app")
	}

	cfg.YouTube.apiKey = os.Getenv("YOUTUBE_API_KEY")
	if cfg.YouTube.apiKey == "" {
		log.Fatalf("Please set the YOUTUBE_API_KEY environment variable and restart the app")
	}

	cfg.Twitch.Client, err = helix.NewClient(&helix.Options{
		ClientID:     cfg.Twitch.clientID,
		ClientSecret: cfg.Twitch.clientSecret,
	})
	if err != nil {
		log.Fatalf("Couldn't create the Twitch API client: %v", err)
	}

	resp, err := cfg.Twitch.Client.RequestAppAccessToken([]string{})
	if err != nil {
		log.Fatalf("Couldn't get the Twitch API access token: %v", err)
	}
	cfg.Twitch.AccessToken = resp.Data.AccessToken
	cfg.Twitch.RefreshToken = resp.Data.RefreshToken
	cfg.Twitch.Client.SetAppAccessToken(resp.Data.AccessToken)

	cfg.YouTube.Client, err = youtube.NewService(context.Background(), option.WithAPIKey(cfg.YouTube.apiKey))
	if err != nil {
		log.Fatalf("Couldn't create the YouTube API client: %v", err)
	}

	return &cfg
}

func SetupCache(cfg *Config) (context.Context, *cache.Cache[[]byte]) {
	cacheContext := context.Background()
	cacheClient, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: int64(float64(cfg.CacheSize) * 3.90625),
		MaxCost:     int64(cfg.CacheSize) * 1000000,
		BufferItems: 64,
	})
	if err != nil {
		log.Fatalf("Cache error: %v", err)
	}
	cacheStore := store.NewRistretto(cacheClient, store.WithExpiration(6*time.Hour))
	cacheManager := cache.New[[]byte](cacheStore)
	return cacheContext, cacheManager
}

func CreateIndex(assets hasherator.AssetsDir) {
	log.Infof("Creating the index.html and hashbusting everything else...")
	_ = assets.Run("./assets/", "./public/", []string{"lib", "octicons", "flairs", "vodstiny", "fontawesome", "fa-css", "webfonts"})

	f, err := os.Create("./public/index.html")
	if err != nil {
		log.Fatalf("Error in creating index.html: %v", err)
		return
	}

	tmpl, errTmpl := template.ParseFiles("templates/index.html")
	if errTmpl != nil {
		log.Fatalf("Template error: %v", errTmpl)
	}
	err = tmpl.ExecuteTemplate(f, "index", assets.Map)
	if err != nil {
		log.Fatalf("Error executing template: %v", err)
		return
	}
	f.Close()
}
