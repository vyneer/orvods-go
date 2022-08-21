package main

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/vyneer/orvods-go/logger"
)

func getVidInfo(c *fiber.Ctx) error {
	videoId := c.Query("id")

	if videoId != "" {
		log.FiberInfof("getting YouTube video info (id: %s)", c, videoId)
		resp, err := cfg.YouTube.Client.Videos.List([]string{"liveStreamingDetails"}).Id(videoId).Do()
		if err != nil {
			log.FiberErrorf("%s %s - YouTube API error: %v", c, err)
			return c.Status(500).SendString("YouTube API error")
		}
		return c.JSON(resp)
	} else {
		return c.Status(fiber.StatusBadRequest).SendString("Please provide the video ID")
	}
}
