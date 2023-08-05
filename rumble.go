package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/gofiber/fiber/v2"
	"github.com/senseyeio/duration"
	log "github.com/vyneer/orvods-go/logger"
)

type RumbleSchemaBase struct {
	T string `json:"@type"`
}

type RumbleSchemaVideo struct {
	RumbleSchemaBase
	EmbedURL string `json:"embedUrl"`
	Duration string `json:"duration"`
}

type Rumble struct {
	ID        string `json:"id"`
	start     time.Time
	StartTime string `json:"starttime"`
	end       time.Time
	EndTime   string `json:"endtime"`
}

func rumbleScrape(u *url.URL) (*Rumble, error) {
	response, err := http.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return nil, errors.New(fmt.Sprintf("%d", response.StatusCode))
	}

	doc, err := goquery.NewDocumentFromReader(response.Body)
	if err != nil {
		return nil, err
	}

	var rumble Rumble

	sel := doc.FindMatcher(goquery.Single("div.streamed-on time"))
	if sel.Size() > 0 {
		startTime, ok := sel.Attr("datetime")
		if !ok {
			return nil, err
		}
		rumble.start, err = time.Parse(time.RFC3339, startTime)
		if err != nil {
			return nil, err
		}
		rumble.StartTime = rumble.start.Format("2006-01-02T15:04:05Z")
	} else {
		return nil, err
	}

	sel = doc.FindMatcher(goquery.Single("script[type='application/ld+json']"))
	if sel.Size() > 0 {
		var base []RumbleSchemaVideo
		err := json.Unmarshal([]byte(sel.Text()), &base)
		if err != nil {
			return nil, err
		}

		for _, v := range base {
			if v.T == "VideoObject" {
				rumble.ID = strings.TrimSuffix(strings.TrimPrefix(v.EmbedURL, "https://rumble.com/embed/"), "/")
				dur, err := duration.ParseISO8601(v.Duration)
				if err != nil {
					return nil, err
				}
				rumble.end = dur.Shift(rumble.start)
				rumble.EndTime = rumble.end.Format("2006-01-02T15:04:05Z")
			}
		}
	} else {
		return nil, err
	}

	return &rumble, nil
}

func rumbleEmbedScrape(u *url.URL) (*url.URL, error) {
	response, err := http.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return nil, errors.New(fmt.Sprintf("%d", response.StatusCode))
	}

	doc, err := goquery.NewDocumentFromReader(response.Body)
	if err != nil {
		return nil, err
	}

	sel := doc.FindMatcher(goquery.Single("link[rel='canonical']"))
	if sel.Size() > 0 {
		href, ok := sel.Attr("href")
		if !ok {
			return nil, errors.New("no href")
		}
		hrefParsed, err := url.Parse(href)
		if err != nil {
			return nil, err
		}
		return hrefParsed, nil
	} else {
		return nil, errors.New("no link")
	}
}

func getRumbleInfo(c *fiber.Ctx) error {
	queryUrl := c.Query("url")

	u, err := url.Parse(queryUrl)
	if err != nil {
		log.FiberErrorf("URL parse error during the Rumble scrape (%s): %s", c, queryUrl, err)
		return c.Status(fiber.StatusBadRequest).SendString("Invalid URL")
	}

	if !strings.Contains(u.Hostname(), "rumble.com") {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid URL")
	}

	if strings.Contains(u.Path, "embed") {
		u, err = rumbleEmbedScrape(u)
		if err != nil {
			log.FiberErrorf("HTTP error during the Rumble scraping (%s): %s", c, u.String(), err)
			return c.Status(500).SendString("Rumble info error")
		}
	}

	rumble, err := rumbleScrape(u)
	if err != nil {
		log.FiberErrorf("HTTP error during the Rumble scraping (%s): %s", c, u.String(), err)
		return c.Status(500).SendString("Rumble info error")
	}

	return c.JSON(rumble)
}
