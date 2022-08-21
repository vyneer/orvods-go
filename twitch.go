package main

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/nicklaw5/helix/v2"

	"github.com/vyneer/orvods-go/config"
	log "github.com/vyneer/orvods-go/logger"
)

func refreshTwitchToken(cfg *config.Config, c *fiber.Ctx) error {
	token, err := cfg.Twitch.Client.RequestAppAccessToken([]string{})
	if err != nil {
		return err
	}
	cfg.Twitch.AccessToken = token.Data.AccessToken
	cfg.Twitch.RefreshToken = token.Data.RefreshToken
	cfg.Twitch.Client.SetAppAccessToken(token.Data.AccessToken)
	return nil
}

func getVODInfo(c *fiber.Ctx) error {
	idParam := c.Query("id")
	userIDParam := c.Query("user_id")
	afterParam := c.Query("after")
	firstParam := c.Query("first")
	typeParam := c.Query("type")

	switch {
	case idParam != "":
		log.FiberInfof("getting Twitch single VOD info (id: %s)", c, idParam)
		if ok, refresh, _ := cfg.Twitch.Client.ValidateToken(cfg.Twitch.AccessToken); ok {
			if refresh.Data.ExpiresIn < 120 {
				err := refreshTwitchToken(cfg, c)
				if err != nil {
					log.FiberErrorf("Twitch API error: %v", c, err)
					return c.Status(500).SendString("Twitch API error")
				}
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				IDs: []string{idParam},
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		} else {
			err := refreshTwitchToken(cfg, c)
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				IDs: []string{idParam},
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		}
	case userIDParam != "" && firstParam != "" && typeParam != "" && afterParam == "":
		first, err := strconv.Atoi(firstParam)
		if err != nil {
			log.FiberErrorf(`"first" query parameter needs to be a number (strconv error): %v`, c, err)
			return c.Status(500).SendString(`"first" query parameter needs to be a number`)
		}

		log.FiberInfof("getting Twitch user VOD info (user_id: %s, first: %d, type: %s)", c, userIDParam, first, typeParam)
		if ok, refresh, _ := cfg.Twitch.Client.ValidateToken(cfg.Twitch.AccessToken); ok {
			if refresh.Data.ExpiresIn < 120 {
				err := refreshTwitchToken(cfg, c)
				if err != nil {
					log.FiberErrorf("Twitch API error: %v", c, err)
					return c.Status(500).SendString("Twitch API error")
				}
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				UserID: userIDParam,
				First:  first,
				Type:   typeParam,
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		} else {
			err := refreshTwitchToken(cfg, c)
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				UserID: userIDParam,
				First:  first,
				Type:   typeParam,
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		}
	case userIDParam != "" && firstParam != "" && typeParam != "" && afterParam != "":
		first, err := strconv.Atoi(firstParam)
		if err != nil {
			log.FiberErrorf(`"first" query parameter needs to be a number (strconv error): %v`, c, err)
			return c.Status(500).SendString(`"first" query parameter needs to be a number`)
		}

		log.FiberInfof("getting Twitch user VOD info (user_id: %s, first: %d, type: %s, after: %s)", c, userIDParam, first, typeParam, afterParam)
		if ok, refresh, _ := cfg.Twitch.Client.ValidateToken(cfg.Twitch.AccessToken); ok {
			if refresh.Data.ExpiresIn < 120 {
				err := refreshTwitchToken(cfg, c)
				if err != nil {
					log.FiberErrorf("Twitch API error: %v", c, err)
					return c.Status(500).SendString("Twitch API error")
				}
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				UserID: userIDParam,
				First:  first,
				Type:   typeParam,
				After:  afterParam,
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		} else {
			err := refreshTwitchToken(cfg, c)
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			resp, err := cfg.Twitch.Client.GetVideos(&helix.VideosParams{
				UserID: userIDParam,
				First:  first,
				Type:   typeParam,
				After:  afterParam,
			})
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		}
	default:
		return c.Status(fiber.StatusBadRequest).SendString("Please provide either a VOD ID or UserID, First and Type")
	}
}

func getUserInfo(c *fiber.Ctx) error {
	userLogin := c.Query("user_login")

	if userLogin != "" {
		log.FiberInfof("getting Twitch user info (user_login: %s)", c, userLogin)
		if ok, refresh, _ := cfg.Twitch.Client.ValidateToken(cfg.Twitch.AccessToken); ok {
			if refresh.Data.ExpiresIn < 120 {
				err := refreshTwitchToken(cfg, c)
				if err != nil {
					log.FiberErrorf("Twitch API error: %v", c, err)
					return c.Status(500).SendString("Twitch API error")
				}
			}
			resp, err := cfg.Twitch.Client.GetStreams(&helix.StreamsParams{
				UserLogins: []string{userLogin},
			})
			if err != nil {
				log.FiberErrorf("%s %s - Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		} else {
			err := refreshTwitchToken(cfg, c)
			if err != nil {
				log.FiberErrorf("Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			resp, err := cfg.Twitch.Client.GetUsers(&helix.UsersParams{
				Logins: []string{userLogin},
			})
			if err != nil {
				log.FiberErrorf("%s %s - Twitch API error: %v", c, err)
				return c.Status(500).SendString("Twitch API error")
			}
			return c.JSON(resp.Data)
		}
	} else {
		return c.Status(fiber.StatusBadRequest).SendString("Please provide the user login")
	}
}
